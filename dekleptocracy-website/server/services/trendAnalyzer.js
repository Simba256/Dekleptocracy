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
function detectRegionalPremium(stateValue, nationalValue, metricType) {
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

export default {
  analyzeTrends,
  getMetricTypeFromTitle,
  detectSignificantChange,
  detectStreak,
  detectMomentum,
  detectThresholdViolation,
  detectRegionalPremium
};
