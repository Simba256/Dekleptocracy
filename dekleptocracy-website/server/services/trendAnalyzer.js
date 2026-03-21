/**
 * Trend Analyzer
 * Pure functions for detecting patterns and anomalies in time series data
 * Surfaces actionable insights without relying on LLM
 */

/**
 * Thresholds for determining notable vs critical changes by metric type
 */
const CHANGE_THRESHOLDS = {
  unemployment: { notable: 0.5, critical: 1.0, unit: 'percentage points' },
  gas_prices: { notable: 10, critical: 20, unit: 'percent' },
  electricity_prices: { notable: 8, critical: 15, unit: 'percent' },
  rent: { notable: 5, critical: 10, unit: 'percent' },
  food_prices: { notable: 5, critical: 10, unit: 'percent' },
  affordability: { notable: 30, critical: 50, unit: 'absolute %' }
};

/**
 * Domain-specific absolute thresholds that trigger alerts
 */
const DOMAIN_THRESHOLDS = {
  unemployment: [
    { threshold: 7, severity: 'critical', message: 'High unemployment' },
    { threshold: 5, severity: 'warning', message: 'Elevated unemployment' }
  ],
  affordability: [
    { threshold: 50, severity: 'critical', message: 'Severely cost-burdened' },
    { threshold: 30, severity: 'warning', message: 'Cost-burdened (HUD definition)' }
  ],
  gas_vs_national: [
    { threshold: 15, severity: 'warning', message: 'Regional premium' }
  ]
};

/**
 * Detect significant change in value over time
 * @param {Array} timeSeries - Array of {value, label} objects
 * @param {Object} thresholds - {notable, critical, unit}
 * @returns {Object|null} Alert object or null
 */
function detectSignificantChange(timeSeries, thresholds) {
  if (!timeSeries || timeSeries.length < 2) return null;

  const first = timeSeries[0]?.value;
  const last = timeSeries[timeSeries.length - 1]?.value;

  if (first == null || last == null || first === 0) return null;

  const changePercent = ((last - first) / first) * 100;
  const absChange = Math.abs(changePercent);

  // For unemployment, we care about absolute percentage point change
  if (thresholds.unit === 'percentage points') {
    const pointChange = Math.abs(last - first);
    if (pointChange >= thresholds.critical) {
      return {
        type: 'change',
        severity: 'critical',
        message: `Changed ${pointChange.toFixed(1)} ${thresholds.unit} over period`,
        value: pointChange
      };
    }
    if (pointChange >= thresholds.notable) {
      return {
        type: 'change',
        severity: 'warning',
        message: `Changed ${pointChange.toFixed(1)} ${thresholds.unit} over period`,
        value: pointChange
      };
    }
    return null;
  }

  // For affordability, we use the absolute value
  if (thresholds.unit === 'absolute %') {
    return null; // Handled by threshold violations instead
  }

  // For percentage-based metrics
  if (absChange >= thresholds.critical) {
    const direction = changePercent > 0 ? 'up' : 'down';
    return {
      type: 'change',
      severity: 'critical',
      message: `${direction === 'up' ? 'Up' : 'Down'} ${absChange.toFixed(1)}% over period`,
      value: changePercent
    };
  }
  if (absChange >= thresholds.notable) {
    const direction = changePercent > 0 ? 'up' : 'down';
    return {
      type: 'change',
      severity: 'warning',
      message: `${direction === 'up' ? 'Up' : 'Down'} ${absChange.toFixed(1)}% over period`,
      value: changePercent
    };
  }

  return null;
}

/**
 * Detect consecutive increasing or decreasing values (streak)
 * @param {Array} timeSeries - Array of {value, label} objects
 * @returns {Object|null} Alert object or null
 */
function detectStreak(timeSeries) {
  if (!timeSeries || timeSeries.length < 3) return null;

  let risingStreak = 0;
  let fallingStreak = 0;

  for (let i = 1; i < timeSeries.length; i++) {
    const prev = timeSeries[i - 1]?.value;
    const curr = timeSeries[i]?.value;

    if (prev == null || curr == null) continue;

    if (curr > prev) {
      if (risingStreak >= 0) {
        risingStreak++;
        fallingStreak = 0;
      }
    } else if (curr < prev) {
      if (fallingStreak >= 0) {
        fallingStreak++;
        risingStreak = 0;
      }
    } else {
      // Equal values - maintain streaks
    }
  }

  // Only report streaks of 3+ periods
  if (risingStreak >= 3) {
    return {
      type: 'streak',
      severity: risingStreak >= 5 ? 'warning' : 'info',
      message: `Rising for ${risingStreak} consecutive periods`,
      value: risingStreak,
      direction: 'up'
    };
  }
  if (fallingStreak >= 3) {
    return {
      type: 'streak',
      severity: 'info',
      message: `Falling for ${fallingStreak} consecutive periods`,
      value: fallingStreak,
      direction: 'down'
    };
  }

  return null;
}

/**
 * Detect overall momentum (trend direction and stability)
 * @param {Array} timeSeries - Array of {value, label} objects
 * @returns {Object} Momentum analysis {momentum, trendSummary}
 */
function detectMomentum(timeSeries) {
  if (!timeSeries || timeSeries.length < 2) {
    return { momentum: 'stable', trendSummary: 'Insufficient data' };
  }

  const values = timeSeries.map(p => p?.value).filter(v => v != null);
  if (values.length < 2) {
    return { momentum: 'stable', trendSummary: 'Insufficient data' };
  }

  // Calculate direction changes to measure volatility
  let ups = 0;
  let downs = 0;
  let changes = 0;

  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i - 1]) {
      ups++;
      changes++;
    } else if (values[i] < values[i - 1]) {
      downs++;
      changes++;
    }
  }

  const first = values[0];
  const last = values[values.length - 1];
  const overallChange = last - first;
  const changePercent = first !== 0 ? ((overallChange / first) * 100) : 0;

  // Calculate volatility (how often direction changes)
  let directionChanges = 0;
  let prevDirection = null;
  for (let i = 1; i < values.length; i++) {
    const currDirection = values[i] > values[i - 1] ? 'up' :
                          values[i] < values[i - 1] ? 'down' : prevDirection;
    if (prevDirection && currDirection && currDirection !== prevDirection) {
      directionChanges++;
    }
    if (currDirection) prevDirection = currDirection;
  }

  const volatility = changes > 0 ? directionChanges / changes : 0;

  // Determine momentum and summary
  if (volatility > 0.5) {
    return { momentum: 'volatile', trendSummary: 'Volatile' };
  }

  if (Math.abs(changePercent) < 2) {
    return { momentum: 'stable', trendSummary: 'Stable' };
  }

  if (overallChange > 0) {
    if (ups > downs * 1.5) {
      return { momentum: 'steady_up', trendSummary: 'Rising steadily' };
    }
    return { momentum: 'up', trendSummary: 'Rising' };
  } else {
    if (downs > ups * 1.5) {
      return { momentum: 'steady_down', trendSummary: 'Falling steadily' };
    }
    return { momentum: 'down', trendSummary: 'Falling' };
  }
}

/**
 * Detect threshold violations based on current value
 * @param {number} currentValue - Current metric value
 * @param {string} metricType - Type of metric
 * @returns {Object|null} Alert object or null
 */
function detectThresholdViolation(currentValue, metricType) {
  if (currentValue == null) return null;

  const thresholds = DOMAIN_THRESHOLDS[metricType];
  if (!thresholds) return null;

  // Check thresholds in order (critical first, then warning)
  for (const threshold of thresholds) {
    if (currentValue >= threshold.threshold) {
      return {
        type: 'threshold',
        severity: threshold.severity,
        message: threshold.message,
        value: currentValue,
        threshold: threshold.threshold
      };
    }
  }

  return null;
}

/**
 * Detect if state price is significantly higher than national average
 * @param {number} stateValue - State price value
 * @param {number} nationalValue - National average value
 * @param {string} metricType - Type of metric (gas_prices, electricity_prices)
 * @returns {Object|null} Alert object or null
 */
function detectRegionalPremium(stateValue, nationalValue, _metricType) {
  if (stateValue == null || nationalValue == null || nationalValue === 0) return null;

  const premium = ((stateValue - nationalValue) / nationalValue) * 100;

  if (premium >= 15) {
    return {
      type: 'regional',
      severity: 'warning',
      message: `${premium.toFixed(0)}% above national average`,
      value: premium
    };
  }

  return null;
}

/**
 * Main entry point - analyze trends for a metric
 * @param {Array} timeSeries - Array of {value, label} objects
 * @param {string} metricType - Type of metric (unemployment, gas_prices, etc.)
 * @param {number} currentValue - Current value of the metric
 * @param {Object} options - Optional parameters (nationalValue for comparisons)
 * @returns {Object} Analysis result with alerts, momentum, and trendSummary
 */
export function analyzeTrends(timeSeries, metricType, currentValue, options = {}) {
  const alerts = [];

  // Get thresholds for this metric type
  const thresholds = CHANGE_THRESHOLDS[metricType] || CHANGE_THRESHOLDS.gas_prices;

  // Run all detectors
  const changeAlert = detectSignificantChange(timeSeries, thresholds);
  if (changeAlert) alerts.push(changeAlert);

  const streakAlert = detectStreak(timeSeries);
  if (streakAlert) alerts.push(streakAlert);

  const thresholdAlert = detectThresholdViolation(currentValue, metricType);
  if (thresholdAlert) alerts.push(thresholdAlert);

  // Check regional premium if national value provided
  if (options.nationalValue != null) {
    const premiumAlert = detectRegionalPremium(currentValue, options.nationalValue, metricType);
    if (premiumAlert) alerts.push(premiumAlert);
  }

  // Analyze momentum
  const { momentum, trendSummary } = detectMomentum(timeSeries);

  // Sort alerts by severity (critical first, then warning, then info)
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

  return {
    metric: metricType,
    alerts,
    momentum,
    trendSummary
  };
}

/**
 * Map metric title to metric type for analysis
 */
export function getMetricTypeFromTitle(title) {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('unemployment')) return 'unemployment';
  if (titleLower.includes('gas') || titleLower.includes('fuel')) return 'gas_prices';
  if (titleLower.includes('electricity')) return 'electricity_prices';
  if (titleLower.includes('rent')) return 'rent';
  if (titleLower.includes('food') || titleLower.includes('grocery')) return 'food_prices';
  if (titleLower.includes('affordability') || titleLower.includes('% of income')) return 'affordability';

  return null;
}

/**
 * Minimum months of data required for meaningful historical context
 */
const MIN_HISTORICAL_MONTHS = 6;

/**
 * Calculate the percentile rank of current value within historical values
 * @param {Array} values - Array of historical values
 * @param {number} currentValue - Current value to rank
 * @returns {Object|null} Percentile info or null if insufficient data
 */
function calculatePercentile(values, currentValue) {
  if (!values || values.length < MIN_HISTORICAL_MONTHS || currentValue == null) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const belowCount = sorted.filter(v => v < currentValue).length;
  const equalCount = sorted.filter(v => v === currentValue).length;

  // Use midpoint method for ties
  const percentile = Math.round(((belowCount + equalCount / 2) / sorted.length) * 100);

  let description;
  if (percentile >= 90) {
    description = 'Near historical high';
  } else if (percentile >= 75) {
    description = 'Above typical range';
  } else if (percentile <= 10) {
    description = 'Near historical low';
  } else if (percentile <= 25) {
    description = 'Below typical range';
  } else {
    description = 'Within typical range';
  }

  return {
    percentile,
    description,
    type: percentile >= 75 ? 'high' : percentile <= 25 ? 'low' : 'typical'
  };
}

/**
 * Find the peak and trough values with their dates
 * @param {Array} timeSeries - Array of {value, label, date} objects
 * @param {number} currentValue - Current value
 * @returns {Object|null} Peak/trough info or null if insufficient data
 */
function findPeakTrough(timeSeries, currentValue) {
  if (!timeSeries || timeSeries.length < MIN_HISTORICAL_MONTHS || currentValue == null) return null;

  let peak = { value: -Infinity, label: null };
  let trough = { value: Infinity, label: null };

  for (const point of timeSeries) {
    if (point.value == null) continue;

    if (point.value > peak.value) {
      peak = { value: point.value, label: point.label };
    }
    if (point.value < trough.value) {
      trough = { value: point.value, label: point.label };
    }
  }

  if (peak.value === -Infinity || trough.value === Infinity) return null;

  const fromPeak = peak.value !== 0 ? ((currentValue - peak.value) / peak.value) * 100 : 0;
  const fromTrough = trough.value !== 0 ? ((currentValue - trough.value) / trough.value) * 100 : 0;

  return {
    peak: {
      value: peak.value,
      label: peak.label,
      fromPeak: Math.round(fromPeak)
    },
    trough: {
      value: trough.value,
      label: trough.label,
      fromTrough: Math.round(fromTrough)
    }
  };
}

/**
 * Compare current value to the same period last year
 * @param {Array} timeSeries - Array of {value, label, date} objects
 * @param {number} currentValue - Current value
 * @returns {Object|null} Year-over-year comparison or null if insufficient data
 */
function compareYearOverYear(timeSeries, currentValue) {
  if (!timeSeries || timeSeries.length < 12 || currentValue == null) return null;

  // The last item is most recent, so ~12 months back would be the YoY comparison
  // Find the point closest to 12 months ago
  const targetIndex = timeSeries.length - 12;
  if (targetIndex < 0) return null;

  const yearAgoPoint = timeSeries[targetIndex];
  if (!yearAgoPoint || yearAgoPoint.value == null || yearAgoPoint.value === 0) return null;

  const change = ((currentValue - yearAgoPoint.value) / yearAgoPoint.value) * 100;
  const roundedChange = Math.round(change);

  return {
    yearAgoValue: yearAgoPoint.value,
    yearAgoLabel: yearAgoPoint.label,
    change: roundedChange,
    description: `${roundedChange >= 0 ? '+' : ''}${roundedChange}% vs ${yearAgoPoint.label}`
  };
}

/**
 * Find historical rank - "Highest since X" or "Lowest in Y years"
 * @param {Array} timeSeries - Array of {value, label, date} objects
 * @param {number} currentValue - Current value
 * @returns {Object|null} Historical rank info or null if insufficient data
 */
function findHistoricalRank(timeSeries, currentValue) {
  if (!timeSeries || timeSeries.length < MIN_HISTORICAL_MONTHS || currentValue == null) return null;

  // Find when we last had a value this high or higher
  let lastHigherIndex = -1;
  let lastLowerIndex = -1;

  for (let i = timeSeries.length - 2; i >= 0; i--) {
    const val = timeSeries[i]?.value;
    if (val == null) continue;

    if (val >= currentValue && lastHigherIndex === -1) {
      lastHigherIndex = i;
    }
    if (val <= currentValue && lastLowerIndex === -1) {
      lastLowerIndex = i;
    }

    if (lastHigherIndex !== -1 && lastLowerIndex !== -1) break;
  }

  const totalMonths = timeSeries.length;
  const monthsSinceHigher = lastHigherIndex === -1 ? totalMonths : (timeSeries.length - 1 - lastHigherIndex);
  const monthsSinceLower = lastLowerIndex === -1 ? totalMonths : (timeSeries.length - 1 - lastLowerIndex);

  // Determine if current value is notably high or low
  const yearsOfData = Math.floor(totalMonths / 12);
  let type = 'typical';
  let description = null;

  if (lastHigherIndex === -1 && totalMonths >= 12) {
    // No value higher in the entire series
    type = 'record_high';
    description = `Highest in ${yearsOfData > 1 ? yearsOfData + '+ years' : 'over a year'}`;
  } else if (lastLowerIndex === -1 && totalMonths >= 12) {
    // No value lower in the entire series
    type = 'record_low';
    description = `Lowest in ${yearsOfData > 1 ? yearsOfData + '+ years' : 'over a year'}`;
  } else if (monthsSinceHigher >= 12) {
    // Highest in at least a year
    const yearsSince = Math.floor(monthsSinceHigher / 12);
    type = 'high';
    description = `Highest in ${yearsSince > 1 ? yearsSince + ' years' : 'over a year'}`;
  } else if (monthsSinceLower >= 12) {
    // Lowest in at least a year
    const yearsSince = Math.floor(monthsSinceLower / 12);
    type = 'low';
    description = `Lowest in ${yearsSince > 1 ? yearsSince + ' years' : 'over a year'}`;
  } else if (monthsSinceHigher >= 6) {
    type = 'elevated';
    description = `Highest in ${monthsSinceHigher} months`;
  } else if (monthsSinceLower >= 6) {
    type = 'depressed';
    description = `Lowest in ${monthsSinceLower} months`;
  }

  return {
    type,
    description,
    monthsSinceHigher,
    monthsSinceLower
  };
}

/**
 * Main function: Analyze historical context for a metric
 * Provides temporal anchoring like "Highest since 2021", percentile ranking, YoY comparisons
 * @param {Array} timeSeries - Array of {value, label, date} objects
 * @param {string} metricType - Type of metric (for context-aware formatting)
 * @param {number} currentValue - Current value of the metric
 * @returns {Object} Historical context analysis
 */
export function analyzeHistoricalContext(timeSeries, metricType, currentValue) {
  if (!timeSeries || timeSeries.length < MIN_HISTORICAL_MONTHS) {
    return {
      available: false,
      reason: 'Insufficient historical data'
    };
  }

  const values = timeSeries.map(p => p?.value).filter(v => v != null);

  if (values.length < MIN_HISTORICAL_MONTHS) {
    return {
      available: false,
      reason: 'Insufficient valid data points'
    };
  }

  const percentile = calculatePercentile(values, currentValue);
  const peakTrough = findPeakTrough(timeSeries, currentValue);
  const yearOverYear = compareYearOverYear(timeSeries, currentValue);
  const historicalRank = findHistoricalRank(timeSeries, currentValue);

  // Build a summary description
  let summaryDescription = null;
  if (historicalRank?.description) {
    summaryDescription = historicalRank.description;
  } else if (percentile?.description && percentile.type !== 'typical') {
    summaryDescription = percentile.description;
  }

  return {
    available: true,
    metric: metricType,
    dataPoints: values.length,
    percentile,
    peakTrough,
    yearOverYear,
    historicalRank,
    summaryDescription
  };
}

export default {
  analyzeTrends,
  analyzeHistoricalContext,
  getMetricTypeFromTitle,
  detectSignificantChange,
  detectStreak,
  detectMomentum,
  detectThresholdViolation,
  detectRegionalPremium
};
