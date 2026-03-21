import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WalletShock from '../models/WalletShock.js';
import CostDriver from '../models/CostDriver.js';
import StatsSummary from '../models/StatsSummary.js';
import StateComparison from '../models/StateComparison.js';
import SocialPost from '../models/SocialPost.js';
import ProductImpact from '../models/ProductImpact.js';
import MapRegion from '../models/MapRegion.js';
import QuickQuestion from '../models/QuickQuestion.js';
import TimelineConfig from '../models/TimelineConfig.js';

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

    let value;
    if (trend === 'up') {
      value = baseValue * (0.85 + i * 0.03); // Gradual increase
    } else if (trend === 'down') {
      value = baseValue * (1.15 - i * 0.03); // Gradual decrease
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
        nationwide: { price: 5.9, unit: 'per dozen', trend: 'up' },
        California: { price: 7.25, unit: 'per dozen', trend: 'up' },
        Texas: { price: 4.8, unit: 'per dozen', trend: 'up' },
        Florida: { price: 5.45, unit: 'per dozen', trend: 'up' },
        'New York': { price: 6.9, unit: 'per dozen', trend: 'up' },
        Arizona: { price: 5.15, unit: 'per dozen', trend: 'up' },
      },
      titleTemplate: 'Egg prices hit $PRICE in STATE, up CHANGE% from last year',
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
        Arizona: { price: 3.25, unit: 'per gallon', trend: 'volatile' },
      },
      titleTemplate: 'Gas prices reach $PRICE/gal in STATE, CHANGE% change in 2 weeks',
    },
    {
      category: 'utilities',
      icon: '💡',
      iconBg: '#fef3c7',
      baseData: {
        nationwide: { price: 0.18, unit: 'per kWh', trend: 'up' },
        California: { price: 0.365, unit: 'per kWh', trend: 'up' },
        Texas: { price: 0.135, unit: 'per kWh', trend: 'up' },
        Florida: { price: 0.195, unit: 'per kWh', trend: 'up' },
        'New York': { price: 0.285, unit: 'per kWh', trend: 'up' },
        Arizona: { price: 0.145, unit: 'per kWh', trend: 'up' },
      },
      titleTemplate: 'Electricity rates in STATE climb to $PRICE/kWh, up CHANGE% year-over-year',
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
        Arizona: { price: 999, unit: 'base model', trend: 'up' },
      },
      titleTemplate: 'New iPhone expected to cost $PRICE due to tariff increases of CHANGE%',
    },
  ];

  const walletShocks = [];

  for (const state of states) {
    for (const template of walletShockTemplates) {
      const stateData = template.baseData[state];
      const chartData = generateChartData(stateData.price, stateData.trend);
      const values = chartData.map((d) => d.value);

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
          sad: Math.floor(Math.random() * 18),
        },
        featured: state === 'nationwide' && Math.random() > 0.5,
        status: 'published',
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
    { label: 'Weather', color: '#9CA3AF', type: 'indirect', basePercentage: 5 },
  ];

  const timePeriods = ['YoY', '3 months', '30 days'];
  const costDrivers = [];

  for (const state of states) {
    for (const period of timePeriods) {
      for (let i = 0; i < driverTemplates.length; i++) {
        const template = driverTemplates[i];

        // Add state-specific variation
        const stateVariation =
          state === 'California' ? 5 : state === 'Texas' ? -3 : state === 'New York' ? 3 : 0;

        // Add period-specific variation
        const periodMultiplier = period === 'YoY' ? 1 : period === '3 months' ? 0.8 : 0.6;

        const percentage = Math.max(
          0,
          Math.min(
            100,
            (template.basePercentage + stateVariation) * periodMultiplier +
              (Math.random() - 0.5) * 5,
          ),
        );

        costDrivers.push({
          label: template.label,
          percentage: parseFloat(percentage.toFixed(1)),
          color: template.color,
          type: template.type,
          state: state,
          timePeriod: period,
          category: 'all',
          dataDate: new Date(),
          source: 'Bureau of Economic Analysis',
          displayOrder: i,
          status: 'published',
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
      baseValue: {
        nationwide: 276000,
        California: 45000,
        Texas: 38000,
        Florida: 22000,
        'New York': 42000,
        Arizona: 18000,
      },
      format: 'K',
      subtitle: 'tracked since 2020',
      source: 'U.S. Senate Office of Public Records (LDA)',
    },
    {
      type: 'consumer-cost',
      baseValue: {
        nationwide: 4679,
        California: 5890,
        Texas: 4120,
        Florida: 4450,
        'New York': 5670,
        Arizona: 4280,
      },
      format: '$',
      subtitle: 'due to tariffs',
      source: 'Bureau of Labor Statistics, EIA, USDA',
    },
    {
      type: 'contributions',
      baseValue: {
        nationwide: 9200000,
        California: 1850000,
        Texas: 1420000,
        Florida: 890000,
        'New York': 1680000,
        Arizona: 720000,
      },
      format: '$M',
      subtitle: 'in lobbying spend',
      source: 'Federal Election Commission',
    },
    {
      type: 'tariff-revenue',
      baseValue: {
        nationwide: 6700000000,
        California: 1200000000,
        Texas: 980000000,
        Florida: 650000000,
        'New York': 1100000000,
        Arizona: 520000000,
      },
      format: '$B',
      subtitle: 'weekly collection',
      source: 'U.S. Department of the Treasury',
    },
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
          date: date,
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
        source: statType.source,
        status: 'published',
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

async function seedStateComparisons() {
  console.log('🌱 Seeding State Comparisons...');

  const comparisonTemplates = [
    {
      category: 'groceries',
      label: 'Grocery basket',
      nationalValue: 395,
      stateMultipliers: {
        California: 1.12,
        Texas: 0.95,
        Florida: 1.02,
        'New York': 1.08,
        Arizona: 0.98,
        nationwide: 1.0,
      },
    },
    {
      category: 'fuel',
      label: 'Fuel Price',
      nationalValue: 3.7,
      stateMultipliers: {
        California: 1.47,
        Texas: 0.72,
        Florida: 0.85,
        'New York': 1.04,
        Arizona: 0.88,
        nationwide: 1.0,
      },
    },
    {
      category: 'utilities',
      label: 'Electricity Bill',
      nationalValue: 187,
      stateMultipliers: {
        California: 1.69,
        Texas: 0.72,
        Florida: 1.04,
        'New York': 1.52,
        Arizona: 0.78,
        nationwide: 1.0,
      },
    },
    {
      category: 'books',
      label: 'Books & Printing',
      nationalValue: 4.1,
      unitType: 'percentage',
      stateMultipliers: {
        California: 1.17,
        Texas: 0.95,
        Florida: 1.02,
        'New York': 1.12,
        Arizona: 0.98,
        nationwide: 1.0,
      },
    },
  ];

  const comparisons = [];

  for (const state of states) {
    for (let i = 0; i < comparisonTemplates.length; i++) {
      const template = comparisonTemplates[i];
      const multiplier = template.stateMultipliers[state] || 1.0;
      const stateNumericValue = template.nationalValue * multiplier;
      const percentDiff =
        ((stateNumericValue - template.nationalValue) / template.nationalValue) * 100;

      const isPercent = template.unitType === 'percentage';
      const stateValue = isPercent
        ? `${stateNumericValue.toFixed(1)}%`
        : `$${Math.round(stateNumericValue)}`;
      const nationalValue = isPercent
        ? `${template.nationalValue.toFixed(1)}%`
        : `$${template.nationalValue}`;

      comparisons.push({
        category: template.category,
        label: template.label,
        state: state,
        stateValue: stateValue,
        nationalValue: nationalValue,
        stateNumericValue: stateNumericValue,
        nationalNumericValue: template.nationalValue,
        percentDifference: parseFloat(percentDiff.toFixed(1)),
        percentDisplay: `${percentDiff > 0 ? '+' : ''}${percentDiff.toFixed(0)}%`,
        unitType: template.unitType || 'currency',
        timePeriod: 'current',
        source: 'Bureau of Labor Statistics',
        dataDate: new Date(),
        displayOrder: i,
        status: 'published',
      });
    }
  }

  await StateComparison.deleteMany({});
  const result = await StateComparison.insertMany(comparisons);
  console.log(`✅ Seeded ${result.length} state comparisons`);

  return result.length;
}

async function seedSocialPosts() {
  console.log('🌱 Seeding Social Posts...');

  const posts = [
    {
      username: '@janedoe',
      platform: 'X Twitter',
      timeAgo: '2h ago',
      postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      verified: false,
      text: '"$6.12/gal in LA today. That\'s half my paycheck gone on gas."',
      image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop',
      avatarUrl: 'https://i.pravatar.cc/150?img=10',
      engagement: { comments: 250, retweets: '8.7k', likes: '134.6k' },
      topics: ['gas', 'inflation'],
      state: 'California',
      featured: true,
      displayOrder: 0,
    },
    {
      username: '@markfoodie',
      platform: 'Thread',
      timeAgo: '5h ago',
      postedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      verified: true,
      text: '"Our grocery bill jumped from $120 to $170 in two months. Same cart, same store."',
      image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&h=400&fit=crop',
      avatarUrl: 'https://i.pravatar.cc/150?img=11',
      engagement: { comments: 189, retweets: '5.2k', likes: '89.4k' },
      topics: ['groceries', 'inflation'],
      state: 'nationwide',
      featured: true,
      displayOrder: 1,
    },
    {
      username: '@janedee',
      platform: 'X Twitter',
      timeAgo: '2h ago',
      postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      verified: true,
      text: '"Electric bill was $280 this month in Nebraska. 40% higher than last year."',
      image: 'https://images.unsplash.com/photo-1554224311-beee415c201f?w=600&h=400&fit=crop',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
      engagement: { comments: 312, retweets: '12.1k', likes: '156.2k' },
      topics: ['utilities', 'inflation'],
      state: 'nationwide',
      featured: true,
      displayOrder: 2,
    },
    {
      username: '@texasmom2024',
      platform: 'X Twitter',
      timeAgo: '4h ago',
      postedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      verified: false,
      text: '"School supplies cost us $150 more this year. New tariffs are hitting families hard."',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
      avatarUrl: 'https://i.pravatar.cc/150?img=23',
      engagement: { comments: 445, retweets: '15.8k', likes: '201.3k' },
      topics: ['tariffs', 'economy'],
      state: 'Texas',
      featured: false,
      displayOrder: 3,
    },
    {
      username: '@nycrent',
      platform: 'Thread',
      timeAgo: '6h ago',
      postedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      verified: false,
      text: '"My rent just went up $400. In this economy? I\'m looking for a roommate now."',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',
      avatarUrl: 'https://i.pravatar.cc/150?img=32',
      engagement: { comments: 567, retweets: '22.4k', likes: '298.7k' },
      topics: ['housing', 'economy'],
      state: 'New York',
      featured: false,
      displayOrder: 4,
    },
  ];

  // Add moderation status
  const postsWithModeration = posts.map((post) => ({
    ...post,
    moderation: { status: 'approved', reviewedAt: new Date() },
    status: 'published',
  }));

  await SocialPost.deleteMany({});
  const result = await SocialPost.insertMany(postsWithModeration);
  console.log(`✅ Seeded ${result.length} social posts`);

  return result.length;
}

async function seedProductImpacts() {
  console.log('🌱 Seeding Product Impacts...');

  const products = [
    {
      name: 'Housing',
      category: 'housing',
      startingPrice: 2.15,
      currentPrice: 3.89,
      startingDate: new Date('2024-01-20'),
      drivers: [
        {
          name: 'Tariffs on Building materials',
          type: 'tariff',
          impact: 'Steel: 25%, Aluminum: 10%, Lumber duties: -14.5%',
          description:
            'Import duties on steel, aluminum, lumber, gypsum, windows, roofing raise input costs. NAHB notes sizeable share of building materials are imported.',
          sources: ['National Association of Home Builders'],
        },
      ],
      lobbyingData: {
        totalSpent: 2300000000,
        totalSpentDisplay: '$2.3B',
        description: 'Real estate lobbying spending in DC',
      },
      keywords: ['housing', 'home', 'rent', 'real estate', 'apartment', 'mortgage'],
    },
    {
      name: 'Eggs',
      category: 'groceries',
      startingPrice: 3.5,
      currentPrice: 5.9,
      startingDate: new Date('2024-01-01'),
      drivers: [
        {
          name: 'Avian Flu Impact',
          type: 'supply-chain',
          impact: '+40%',
          description: 'Avian flu outbreaks have reduced egg-laying hen populations significantly.',
          sources: ['USDA'],
        },
        {
          name: 'Feed Costs',
          type: 'supply-chain',
          impact: '+15%',
          description: 'Rising corn and soy prices increase production costs.',
          sources: ['Agricultural Department'],
        },
      ],
      lobbyingData: {
        totalSpent: 45000000,
        totalSpentDisplay: '$45M',
        description: 'Poultry industry lobbying',
      },
      keywords: ['eggs', 'poultry', 'breakfast', 'groceries'],
      trending: true,
      trendingScore: 95,
    },
    {
      name: 'Gasoline',
      category: 'fuel',
      startingPrice: 2.85,
      currentPrice: 3.45,
      startingDate: new Date('2024-01-01'),
      drivers: [
        {
          name: 'Crude Oil Prices',
          type: 'supply-chain',
          impact: '+12%',
          description: 'Global crude oil price increases due to OPEC production cuts.',
          sources: ['EIA'],
        },
        {
          name: 'Refinery Capacity',
          type: 'supply-chain',
          impact: '+8%',
          description: 'Limited refinery capacity and maintenance downtime.',
          sources: ['American Petroleum Institute'],
        },
      ],
      keywords: ['gas', 'gasoline', 'fuel', 'petrol'],
      trending: true,
      trendingScore: 88,
    },
  ];

  const productImpacts = [];

  for (const product of products) {
    const priceChange = product.currentPrice - product.startingPrice;
    const percentChange = (priceChange / product.startingPrice) * 100;

    // Generate price history
    const priceHistory = [];
    const monthsDiff = Math.ceil((new Date() - product.startingDate) / (30 * 24 * 60 * 60 * 1000));
    for (let i = 0; i <= monthsDiff; i++) {
      const date = new Date(product.startingDate);
      date.setMonth(date.getMonth() + i);
      const progress = i / monthsDiff;
      const price = product.startingPrice + priceChange * progress + (Math.random() - 0.5) * 0.2;

      priceHistory.push({
        date,
        price: parseFloat(price.toFixed(2)),
        priceDisplay: `$${price.toFixed(2)}`,
      });
    }

    productImpacts.push({
      name: product.name,
      category: product.category,
      currentPrice: product.currentPrice,
      currentPriceDisplay: `$${product.currentPrice.toFixed(2)}`,
      startingPrice: product.startingPrice,
      startingPriceDisplay: `$${product.startingPrice.toFixed(2)}`,
      priceChange: {
        amount: parseFloat(priceChange.toFixed(2)),
        amountDisplay: `$${priceChange.toFixed(2)}`,
        percent: parseFloat(percentChange.toFixed(1)),
        percentDisplay: `+${percentChange.toFixed(1)}%`,
      },
      startingDate: product.startingDate,
      currentDate: new Date(),
      priceHistory,
      drivers: product.drivers,
      lobbyingData: product.lobbyingData,
      state: 'nationwide',
      source: 'Bureau of Labor Statistics',
      keywords: product.keywords,
      trending: product.trending || false,
      trendingScore: product.trendingScore || 0,
      status: 'published',
    });
  }

  await ProductImpact.deleteMany({});
  const result = await ProductImpact.insertMany(productImpacts);
  console.log(`✅ Seeded ${result.length} product impacts`);

  return result.length;
}

async function seedMapRegions() {
  console.log('🌱 Seeding Map Regions...');

  const regionData = [
    { name: 'California', abbreviation: 'CA', cx: 85, cy: 285, rx: 75, ry: 90, intensity: 85 },
    { name: 'Texas', abbreviation: 'TX', cx: 420, cy: 445, rx: 120, ry: 95, intensity: 85 },
    { name: 'Arizona', abbreviation: 'AZ', cx: 175, cy: 360, rx: 55, ry: 65, intensity: 75 },
    { name: 'New Mexico', abbreviation: 'NM', cx: 245, cy: 375, rx: 50, ry: 70, intensity: 75 },
    { name: 'Oklahoma', abbreviation: 'OK', cx: 340, cy: 375, rx: 55, ry: 50, intensity: 65 },
    { name: 'Louisiana', abbreviation: 'LA', cx: 465, cy: 480, rx: 50, ry: 45, intensity: 78 },
    { name: 'Washington', abbreviation: 'WA', cx: 75, cy: 135, rx: 55, ry: 45, intensity: 62 },
    { name: 'Oregon', abbreviation: 'OR', cx: 75, cy: 190, rx: 60, ry: 50, intensity: 62 },
    { name: 'Nevada', abbreviation: 'NV', cx: 135, cy: 260, rx: 50, ry: 70, intensity: 58 },
    { name: 'Utah', abbreviation: 'UT', cx: 185, cy: 265, rx: 45, ry: 60, intensity: 58 },
    { name: 'Colorado', abbreviation: 'CO', cx: 250, cy: 280, rx: 55, ry: 55, intensity: 58 },
    { name: 'Kansas', abbreviation: 'KS', cx: 350, cy: 300, rx: 60, ry: 45, intensity: 58 },
    { name: 'Illinois', abbreviation: 'IL', cx: 500, cy: 280, rx: 40, ry: 70, intensity: 58 },
    { name: 'New York', abbreviation: 'NY', cx: 755, cy: 195, rx: 65, ry: 55, intensity: 68 },
    {
      name: 'Florida',
      abbreviation: 'FL',
      cx: 700,
      cy: 485,
      rx: 60,
      ry: 100,
      intensity: 52,
      rotation: 15,
    },
    { name: 'Georgia', abbreviation: 'GA', cx: 630, cy: 380, rx: 50, ry: 60, intensity: 55 },
    { name: 'Michigan', abbreviation: 'MI', cx: 540, cy: 215, rx: 55, ry: 70, intensity: 58 },
    { name: 'Ohio', abbreviation: 'OH', cx: 590, cy: 275, rx: 50, ry: 55, intensity: 55 },
  ];

  const topShocksData = {
    'New York': [
      {
        item: 'Eggs +15%',
        location: 'New York, NY',
        icon: '🥚',
        bgColor: '#fef3c7',
        changePercent: 15,
      },
    ],
    Texas: [
      {
        item: 'Fuel +8%',
        location: 'Houston, TX',
        icon: '⛽',
        bgColor: '#dbeafe',
        changePercent: 8,
      },
    ],
    California: [
      {
        item: 'Gas +22%',
        location: 'Los Angeles, CA',
        icon: '⛽',
        bgColor: '#fed7d7',
        changePercent: 22,
      },
    ],
  };

  const regions = regionData.map((region) => ({
    name: region.name,
    abbreviation: region.abbreviation,
    coordinates: {
      cx: region.cx,
      cy: region.cy,
      rx: region.rx,
      ry: region.ry,
      rotation: region.rotation || 0,
    },
    intensity: region.intensity,
    intensityCategory: MapRegion.getIntensityCategory(region.intensity),
    color: MapRegion.getIntensityColor(region.intensity),
    opacity: 0.5 + region.intensity / 200, // 0.5 - 1.0 based on intensity
    topShocks: topShocksData[region.name] || [],
    overallChange: {
      percent: region.intensity * 0.2,
      percentDisplay: `+${(region.intensity * 0.2).toFixed(1)}%`,
      direction: 'up',
    },
    dataDate: new Date(),
    status: 'published',
  }));

  await MapRegion.deleteMany({});
  const result = await MapRegion.insertMany(regions);
  console.log(`✅ Seeded ${result.length} map regions`);

  return result.length;
}

async function seedQuickQuestions() {
  console.log('🌱 Seeding Quick Questions...');

  const questions = [
    {
      text: 'How does the new tax hit my grocery bill in my city?',
      textTemplate: 'How does the new tax hit my grocery bill in {city}?',
      category: 'taxes',
      icon: 'shopping-bag',
      iconType: 'svg',
      iconPath: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
      topics: ['groceries', 'taxes'],
      personalization: { useLocation: true, useState: true, useCity: true },
      displayOrder: 0,
      featured: true,
    },
    {
      text: 'Why is gas more expensive in my city than last year?',
      textTemplate: 'Why is gas more expensive in {city} than last year?',
      category: 'prices',
      icon: 'credit-card',
      iconType: 'svg',
      iconPath: 'M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zM2 10h20',
      topics: ['gas', 'inflation'],
      personalization: { useLocation: true, useState: true, useCity: true },
      displayOrder: 1,
      featured: true,
    },
    {
      text: 'Compare eggs and milk prices in my city than others?',
      textTemplate: 'Compare eggs and milk prices in {city} than others?',
      category: 'comparison',
      icon: 'globe',
      iconType: 'svg',
      iconPath:
        'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
      topics: ['groceries', 'inflation'],
      personalization: { useLocation: true, useState: true, useCity: true },
      displayOrder: 2,
      featured: true,
    },
    {
      text: 'What policies are driving up housing costs?',
      category: 'policy',
      icon: 'home',
      iconType: 'svg',
      iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      topics: ['housing', 'economy'],
      personalization: { useLocation: false, useState: false, useCity: false },
      displayOrder: 3,
      featured: false,
    },
    {
      text: 'How much are tariffs adding to my annual bills?',
      category: 'bills',
      icon: 'dollar-sign',
      iconType: 'svg',
      iconPath: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      topics: ['tariffs', 'inflation'],
      personalization: { useLocation: false, useState: true, useCity: false },
      displayOrder: 4,
      featured: false,
    },
  ];

  const questionsWithStatus = questions.map((q) => ({
    ...q,
    status: 'published',
  }));

  await QuickQuestion.deleteMany({});
  const result = await QuickQuestion.insertMany(questionsWithStatus);
  console.log(`✅ Seeded ${result.length} quick questions`);

  return result.length;
}

async function seedTimelineConfig() {
  console.log('🌱 Seeding Timeline Config...');

  const config = {
    name: 'policy-impact-2024-2025',
    description: 'Timeline tracking policy impacts from before 2024 election through current',
    milestones: [
      {
        position: 0,
        date: new Date('2024-07-01'),
        dateDisplay: 'Jul 1, 2024',
        label: 'Before Policy',
        description: 'Baseline before major policy changes',
        isDefault: false,
        highlighted: false,
      },
      {
        position: 20,
        date: new Date('2024-10-01'),
        dateDisplay: 'Oct 1, 2024',
        label: 'Pre-Election',
        description: 'Period leading up to election',
        isDefault: false,
        highlighted: false,
      },
      {
        position: 50,
        date: new Date('2025-01-20'),
        dateDisplay: 'Jan 20, 2025',
        label: 'Inauguration Day',
        description: 'Presidential inauguration',
        isDefault: true,
        highlighted: true,
        event: {
          name: 'Presidential Inauguration',
          type: 'policy',
          impact: 'Major policy shifts announced',
        },
      },
      {
        position: 70,
        date: new Date('2025-04-01'),
        dateDisplay: 'Apr 1, 2025',
        label: 'Early Months',
        description: 'First 100 days impact',
        isDefault: false,
        highlighted: false,
      },
      {
        position: 85,
        date: new Date('2025-07-01'),
        dateDisplay: 'Jul 1, 2025',
        label: 'Mid-Year',
        description: 'Mid-year assessment',
        isDefault: false,
        highlighted: false,
      },
      {
        position: 100,
        date: new Date('2025-10-01'),
        dateDisplay: 'Oct 1, 2025',
        label: 'Current Snapshot',
        description: 'Current state of prices',
        isDefault: false,
        highlighted: false,
      },
    ],
    slider: {
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
    },
    dateRange: {
      start: new Date('2024-07-01'),
      end: new Date('2025-10-01'),
    },
    suggestedSearches: [
      { term: 'eggs', category: 'groceries' },
      { term: 'housing', category: 'housing' },
      { term: 'gasoline', category: 'fuel' },
    ],
    display: {
      showLabels: true,
      showDates: true,
      labelPosition: 'above',
      colorScheme: {
        track: '#e5e7eb',
        progress: '#FF6B5A',
        thumb: '#FF6B5A',
      },
    },
    active: true,
    status: 'published',
  };

  await TimelineConfig.deleteMany({});
  await TimelineConfig.create(config);
  console.log(`✅ Seeded 1 timeline config`);

  return 1;
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
    const comparisonCount = await seedStateComparisons();
    const socialPostCount = await seedSocialPosts();
    const productImpactCount = await seedProductImpacts();
    const mapRegionCount = await seedMapRegions();
    const questionCount = await seedQuickQuestions();
    const timelineCount = await seedTimelineConfig();

    const total =
      walletShockCount +
      costDriverCount +
      statsCount +
      comparisonCount +
      socialPostCount +
      productImpactCount +
      mapRegionCount +
      questionCount +
      timelineCount;

    console.log('\n✅ Seeding Complete!');
    console.log(`   - Wallet Shocks: ${walletShockCount}`);
    console.log(`   - Cost Drivers: ${costDriverCount}`);
    console.log(`   - Stats Summaries: ${statsCount}`);
    console.log(`   - State Comparisons: ${comparisonCount}`);
    console.log(`   - Social Posts: ${socialPostCount}`);
    console.log(`   - Product Impacts: ${productImpactCount}`);
    console.log(`   - Map Regions: ${mapRegionCount}`);
    console.log(`   - Quick Questions: ${questionCount}`);
    console.log(`   - Timeline Configs: ${timelineCount}`);
    console.log(`   - Total: ${total} documents\n`);

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

export {
  seedAll,
  seedWalletShocks,
  seedCostDrivers,
  seedStatsSummary,
  seedStateComparisons,
  seedSocialPosts,
  seedProductImpacts,
  seedMapRegions,
  seedQuickQuestions,
  seedTimelineConfig,
};
