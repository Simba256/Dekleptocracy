import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WalletShock from '../models/WalletShock.js';
import CostDriver from '../models/CostDriver.js';
import StatsSummary from '../models/StatsSummary.js';

dotenv.config();

// Helper function to generate SVG chart path
function generateChartPath(values) {
  const width = 200;
  const height = 80;
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - minValue) / range) * (height * 0.8);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  return `M ${points.join(' L ')}`;
}

// Generate realistic chart data for past 6 months
function generateChartData(baseValue, trend = 'up') {
  const data = [];
  const currentDate = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);

    let value = baseValue;
    if (trend === 'up') {
      value = baseValue * (0.85 + (i * 0.03)); // Gradual increase
    } else if (trend === 'down') {
      value = baseValue * (1.15 - (i * 0.03)); // Gradual decrease
    } else {
      value = baseValue * (0.95 + Math.random() * 0.1); // Volatile
    }

    data.push({ date, value: parseFloat(value.toFixed(2)) });
  }

  return data;
}

// Seed data for different states
const states = ['nationwide', 'California', 'Texas', 'Florida', 'New York', 'Arizona'];

async function seedWalletShocks() {
  console.log('🌱 Seeding Wallet Shocks...');

  const walletShockTemplates = [
    {
      category: 'groceries',
      icon: '🥚',
      iconBg: '#fef3c7',
      baseData: {
        nationwide: { price: 5.90, unit: 'per dozen', trend: 'up' },
        California: { price: 7.25, unit: 'per dozen', trend: 'up' },
        Texas: { price: 4.80, unit: 'per dozen', trend: 'up' },
        Florida: { price: 5.45, unit: 'per dozen', trend: 'up' },
        'New York': { price: 6.90, unit: 'per dozen', trend: 'up' },
        Arizona: { price: 5.15, unit: 'per dozen', trend: 'up' }
      },
      titleTemplate: 'Egg prices hit $PRICE in STATE, up CHANGE% from last year'
    },
    {
      category: 'fuel',
      icon: '⛽',
      iconBg: '#fef3c7',
      baseData: {
        nationwide: { price: 3.35, unit: 'per gallon', trend: 'volatile' },
        California: { price: 5.45, unit: 'per gallon', trend: 'volatile' },
        Texas: { price: 2.65, unit: 'per gallon', trend: 'volatile' },
        Florida: { price: 3.15, unit: 'per gallon', trend: 'volatile' },
        'New York': { price: 3.85, unit: 'per gallon', trend: 'volatile' },
        Arizona: { price: 3.25, unit: 'per gallon', trend: 'volatile' }
      },
      titleTemplate: 'Gas prices reach $PRICE/gal in STATE, CHANGE% change in 2 weeks'
    },
    {
      category: 'utilities',
      icon: '💡',
      iconBg: '#fef3c7',
      baseData: {
        nationwide: { price: 0.180, unit: 'per kWh', trend: 'up' },
        California: { price: 0.365, unit: 'per kWh', trend: 'up' },
        Texas: { price: 0.135, unit: 'per kWh', trend: 'up' },
        Florida: { price: 0.195, unit: 'per kWh', trend: 'up' },
        'New York': { price: 0.285, unit: 'per kWh', trend: 'up' },
        Arizona: { price: 0.145, unit: 'per kWh', trend: 'up' }
      },
      titleTemplate: 'Electricity rates in STATE climb to $PRICE/kWh, up CHANGE% year-over-year'
    },
    {
      category: 'tech',
      icon: '📱',
      iconBg: '#fef3c7',
      baseData: {
        nationwide: { price: 999, unit: 'base model', trend: 'up' },
        California: { price: 999, unit: 'base model', trend: 'up' },
        Texas: { price: 999, unit: 'base model', trend: 'up' },
        Florida: { price: 999, unit: 'base model', trend: 'up' },
        'New York': { price: 999, unit: 'base model', trend: 'up' },
        Arizona: { price: 999, unit: 'base model', trend: 'up' }
      },
      titleTemplate: 'New iPhone expected to cost $PRICE due to tariff increases of CHANGE%'
    }
  ];

  const walletShocks = [];

  for (const state of states) {
    for (const template of walletShockTemplates) {
      const stateData = template.baseData[state];
      const chartData = generateChartData(stateData.price, stateData.trend);
      const values = chartData.map(d => d.value);

      const oldValue = values[0];
      const newValue = values[values.length - 1];
      const changePercent = ((newValue - oldValue) / oldValue) * 100;

      const title = template.titleTemplate
        .replace('PRICE', newValue.toFixed(2))
        .replace('STATE', state)
        .replace('CHANGE', Math.abs(changePercent).toFixed(1));

      walletShocks.push({
        category: template.category,
        icon: template.icon,
        iconBg: template.iconBg,
        title: title,
        price: `$${newValue.toFixed(2)}`,
        unit: stateData.unit,
        change: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`,
        changePercent: parseFloat(changePercent.toFixed(2)),
        chartColor: changePercent > 0 ? '#ef4444' : '#22c55e',
        chartPath: generateChartPath(values),
        chartData: chartData,
        state: state,
        source: 'Bureau of Labor Statistics',
        dataDate: new Date(),
        reactions: {
          shock: Math.floor(Math.random() * 20),
          angry: Math.floor(Math.random() * 15),
          sad: Math.floor(Math.random() * 18)
        },
        featured: state === 'nationwide' && Math.random() > 0.5,
        status: 'published'
      });
    }
  }

  // Clear existing data
  await WalletShock.deleteMany({});

  // Insert new data
  const result = await WalletShock.insertMany(walletShocks);
  console.log(`✅ Seeded ${result.length} wallet shocks`);

  return result.length;
}

async function seedCostDrivers() {
  console.log('🌱 Seeding Cost Drivers...');

  const driverTemplates = [
    { label: 'Tariffs', color: '#3E5132', type: 'direct', basePercentage: 34 },
    { label: 'Fuels', color: '#6B7F5F', type: 'direct', basePercentage: 22 },
    { label: 'Labor', color: '#A8B89C', type: 'direct', basePercentage: 20 },
    { label: 'Supply Chain', color: '#A8B89C', type: 'indirect', basePercentage: 18 },
    { label: 'Currency', color: '#C5D4BC', type: 'indirect', basePercentage: 13 },
    { label: 'Weather', color: '#9CA3AF', type: 'indirect', basePercentage: 5 }
  ];

  const timePeriods = ['YoY', '3 months', '30 days'];
  const costDrivers = [];

  for (const state of states) {
    for (const period of timePeriods) {
      for (let i = 0; i < driverTemplates.length; i++) {
        const template = driverTemplates[i];

        // Add state-specific variation
        const stateVariation = state === 'California' ? 5 :
                             state === 'Texas' ? -3 :
                             state === 'New York' ? 3 : 0;

        // Add period-specific variation
        const periodMultiplier = period === 'YoY' ? 1 :
                                period === '3 months' ? 0.8 : 0.6;

        const percentage = Math.max(0, Math.min(100,
          (template.basePercentage + stateVariation) * periodMultiplier +
          (Math.random() - 0.5) * 5
        ));

        costDrivers.push({
          label: template.label,
          percentage: parseFloat(percentage.toFixed(1)),
          color: template.color,
          type: template.type,
          state: state,
          timePeriod: period,
          category: 'all',
          dataDate: new Date(),
          source: 'Economic Analysis Bureau',
          displayOrder: i,
          status: 'published'
        });
      }
    }
  }

  // Clear existing data
  await CostDriver.deleteMany({});

  // Insert new data
  const result = await CostDriver.insertMany(costDrivers);
  console.log(`✅ Seeded ${result.length} cost drivers`);

  return result.length;
}

async function seedStatsSummary() {
  console.log('🌱 Seeding Stats Summary...');

  const statTypes = [
    {
      type: 'lobbying',
      baseValue: { nationwide: 276000, California: 45000, Texas: 38000, Florida: 22000, 'New York': 42000, Arizona: 18000 },
      format: 'K',
      subtitle: 'tracked since 2020'
    },
    {
      type: 'consumer-cost',
      baseValue: { nationwide: 4679, California: 5890, Texas: 4120, Florida: 4450, 'New York': 5670, Arizona: 4280 },
      format: '$',
      subtitle: 'due to tariffs'
    },
    {
      type: 'contributions',
      baseValue: { nationwide: 9200000, California: 1850000, Texas: 1420000, Florida: 890000, 'New York': 1680000, Arizona: 720000 },
      format: '$M',
      subtitle: 'in lobbying spend'
    },
    {
      type: 'tariff-revenue',
      baseValue: { nationwide: 6700000000, California: 1200000000, Texas: 980000000, Florida: 650000000, 'New York': 1100000000, Arizona: 520000000 },
      format: '$B',
      subtitle: 'weekly collection'
    }
  ];

  const statsSummaries = [];

  for (const state of states) {
    for (const statType of statTypes) {
      const baseValue = statType.baseValue[state];

      // Generate weekly chart data
      const chartData = [];
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        chartData.push({
          label: days[i],
          value: baseValue * (0.85 + Math.random() * 0.3),
          date: date
        });
      }

      // Calculate change
      const change = (Math.random() - 0.3) * 40; // -12% to +28%

      // Format display value
      let displayValue = '';
      if (statType.format === 'K') {
        displayValue = `${Math.round(baseValue / 1000)}K`;
      } else if (statType.format === '$M') {
        displayValue = `$${(baseValue / 1000000).toFixed(1)}M`;
      } else if (statType.format === '$B') {
        displayValue = `$${(baseValue / 1000000000).toFixed(1)}B`;
      } else if (statType.format === '$') {
        displayValue = `$${baseValue.toLocaleString()}`;
      }

      statsSummaries.push({
        statType: statType.type,
        state: state,
        value: baseValue,
        displayValue: displayValue,
        change: parseFloat(change.toFixed(2)),
        changeDisplay: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
        changeDirection: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        subtitle: statType.subtitle,
        chartData: chartData,
        timePeriod: 'weekly',
        dataDate: new Date(),
        source: 'Federal Trade Commission',
        status: 'published'
      });
    }
  }

  // Clear existing data
  await StatsSummary.deleteMany({});

  // Insert new data
  const result = await StatsSummary.insertMany(statsSummaries);
  console.log(`✅ Seeded ${result.length} stats summaries`);

  return result.length;
}

async function seedAll() {
  try {
    console.log('\n🌱 Starting Homepage Data Seeding...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Seed all data
    const walletShockCount = await seedWalletShocks();
    const costDriverCount = await seedCostDrivers();
    const statsCount = await seedStatsSummary();

    console.log('\n✅ Seeding Complete!');
    console.log(`   - Wallet Shocks: ${walletShockCount}`);
    console.log(`   - Cost Drivers: ${costDriverCount}`);
    console.log(`   - Stats Summaries: ${statsCount}`);
    console.log(`   - Total: ${walletShockCount + costDriverCount + statsCount} documents\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAll();
}

export { seedAll, seedWalletShocks, seedCostDrivers, seedStatsSummary };
