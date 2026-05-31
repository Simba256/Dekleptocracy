/**
 * Static fallback data for the homepage aggregated endpoint.
 *
 * TEMPORARY: serves a representative snapshot when MongoDB Atlas is
 * unreachable so the site renders instead of showing a full-screen error.
 * Mirrors the shape produced by GET /api/homepage/all (see homepageRoutes.js)
 * and the values in scripts/seedHomepageData.js (nationwide baseline).
 *
 * Remove (or keep as a safety net) once the database connection is restored.
 */

const UPWARD_CHART_PATH = 'M0,70 L40,58 L80,52 L120,38 L160,28 L200,14';

const statChart = (base) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const factors = [0.88, 0.92, 0.9, 0.97, 1.0, 1.05, 1.08];
  return days.map((label, i) => ({ label, value: Math.round(base * factors[i]) }));
};

const walletShocks = [
  {
    _id: 'fallback-shock-eggs',
    category: 'groceries',
    icon: '🥚',
    iconBg: '#fef3c7',
    title: 'Egg prices hit $5.90 nationwide, up 12.4% from last year',
    price: '$5.90',
    unit: 'per dozen',
    change: '+12.4%',
    changePercent: 12.4,
    chartColor: '#ef4444',
    chartPath: UPWARD_CHART_PATH,
    chartData: [],
    state: 'nationwide',
    source: 'Bureau of Labor Statistics',
    reactions: { shock: 14, angry: 9, sad: 11 },
    featured: true,
    status: 'published',
  },
  {
    _id: 'fallback-shock-gas',
    category: 'fuel',
    icon: '⛽',
    iconBg: '#fef3c7',
    title: 'Gas prices reach $3.35/gal nationwide, +8.1% change in 2 weeks',
    price: '$3.35',
    unit: 'per gallon',
    change: '+8.1%',
    changePercent: 8.1,
    chartColor: '#ef4444',
    chartPath: UPWARD_CHART_PATH,
    chartData: [],
    state: 'nationwide',
    source: 'Bureau of Labor Statistics',
    reactions: { shock: 12, angry: 13, sad: 7 },
    featured: true,
    status: 'published',
  },
  {
    _id: 'fallback-shock-electricity',
    category: 'utilities',
    icon: '💡',
    iconBg: '#fef3c7',
    title: 'Electricity rates climb to $0.18/kWh, up 9.7% year-over-year',
    price: '$0.18',
    unit: 'per kWh',
    change: '+9.7%',
    changePercent: 9.7,
    chartColor: '#ef4444',
    chartPath: UPWARD_CHART_PATH,
    chartData: [],
    state: 'nationwide',
    source: 'Bureau of Labor Statistics',
    reactions: { shock: 10, angry: 8, sad: 9 },
    featured: false,
    status: 'published',
  },
  {
    _id: 'fallback-shock-iphone',
    category: 'tech',
    icon: '📱',
    iconBg: '#fef3c7',
    title: 'New iPhone expected to cost $999 due to tariff increases of 15%',
    price: '$999.00',
    unit: 'base model',
    change: '+15.0%',
    changePercent: 15.0,
    chartColor: '#ef4444',
    chartPath: UPWARD_CHART_PATH,
    chartData: [],
    state: 'nationwide',
    source: 'Bureau of Labor Statistics',
    reactions: { shock: 16, angry: 11, sad: 6 },
    featured: false,
    status: 'published',
  },
];

const costDrivers = [
  { label: 'Tariffs', percentage: 34, color: '#3E5132', type: 'direct', displayOrder: 0 },
  { label: 'Fuels', percentage: 22, color: '#6B7F5F', type: 'direct', displayOrder: 1 },
  { label: 'Labor', percentage: 20, color: '#A8B89C', type: 'direct', displayOrder: 2 },
  { label: 'Supply Chain', percentage: 18, color: '#A8B89C', type: 'indirect', displayOrder: 3 },
  { label: 'Currency', percentage: 13, color: '#C5D4BC', type: 'indirect', displayOrder: 4 },
  { label: 'Weather', percentage: 5, color: '#9CA3AF', type: 'indirect', displayOrder: 5 },
].map((d) => ({
  ...d,
  state: 'nationwide',
  timePeriod: 'YoY',
  category: 'all',
  source: 'Bureau of Economic Analysis',
  status: 'published',
}));

const stats = {
  lobbying: {
    statType: 'lobbying',
    state: 'nationwide',
    value: 276000,
    displayValue: '276K',
    change: 4.2,
    changeDisplay: '+4.20%',
    changeDirection: 'up',
    subtitle: 'tracked since 2020',
    chartData: statChart(276),
    source: 'U.S. Senate Office of Public Records (LDA)',
  },
  consumerCost: {
    statType: 'consumer-cost',
    state: 'nationwide',
    value: 4679,
    displayValue: '$4,679',
    change: 6.8,
    changeDisplay: '+6.80%',
    changeDirection: 'up',
    subtitle: 'due to tariffs',
    chartData: statChart(4679),
    source: 'Bureau of Labor Statistics, EIA, USDA',
  },
  contributions: {
    statType: 'contributions',
    state: 'nationwide',
    value: 9200000,
    displayValue: '$9.2M',
    change: 3.1,
    changeDisplay: '+3.10%',
    changeDirection: 'up',
    subtitle: 'in lobbying spend',
    chartData: statChart(9200),
    source: 'Federal Election Commission',
  },
  tariffRevenue: {
    statType: 'tariff-revenue',
    state: 'nationwide',
    value: 6700000000,
    displayValue: '$6.7B',
    change: 5.5,
    changeDisplay: '+5.50%',
    changeDirection: 'up',
    subtitle: 'weekly collection',
    chartData: statChart(6700),
    source: 'U.S. Department of the Treasury',
  },
};

const stateComparisons = [
  {
    category: 'groceries',
    label: 'Grocery basket',
    state: 'nationwide',
    stateValue: '$395',
    nationalValue: '$395',
    stateNumericValue: 395,
    nationalNumericValue: 395,
    percentDifference: 0,
    percentDisplay: '0%',
    unitType: 'currency',
    displayOrder: 0,
  },
  {
    category: 'fuel',
    label: 'Fuel Price',
    state: 'nationwide',
    stateValue: '$3.70',
    nationalValue: '$3.70',
    stateNumericValue: 3.7,
    nationalNumericValue: 3.7,
    percentDifference: 0,
    percentDisplay: '0%',
    unitType: 'currency',
    displayOrder: 1,
  },
  {
    category: 'utilities',
    label: 'Electricity Bill',
    state: 'nationwide',
    stateValue: '$187',
    nationalValue: '$187',
    stateNumericValue: 187,
    nationalNumericValue: 187,
    percentDifference: 0,
    percentDisplay: '0%',
    unitType: 'currency',
    displayOrder: 2,
  },
  {
    category: 'books',
    label: 'Books & Printing',
    state: 'nationwide',
    stateValue: '4.1%',
    nationalValue: '4.1%',
    stateNumericValue: 4.1,
    nationalNumericValue: 4.1,
    percentDifference: 0,
    percentDisplay: '0%',
    unitType: 'percentage',
    displayOrder: 3,
  },
].map((c) => ({
  ...c,
  timePeriod: 'current',
  source: 'Bureau of Labor Statistics',
  status: 'published',
}));

const socialPosts = [
  {
    _id: 'fallback-post-1',
    username: '@janedoe',
    platform: 'X Twitter',
    timeAgo: '2h ago',
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
    _id: 'fallback-post-2',
    username: '@markfoodie',
    platform: 'Thread',
    timeAgo: '5h ago',
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
    _id: 'fallback-post-3',
    username: '@janedee',
    platform: 'X Twitter',
    timeAgo: '2h ago',
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
];

const quickQuestions = [
  {
    _id: 'fallback-q-1',
    text: 'How does the new tax hit my grocery bill in your state?',
    category: 'taxes',
    icon: 'shopping-bag',
    iconType: 'svg',
    iconPath: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',
    topics: ['groceries', 'taxes'],
  },
  {
    _id: 'fallback-q-2',
    text: 'Why is gas more expensive in your state than last year?',
    category: 'prices',
    icon: 'credit-card',
    iconType: 'svg',
    iconPath: 'M2 5h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5zM2 10h20',
    topics: ['gas', 'inflation'],
  },
  {
    _id: 'fallback-q-3',
    text: 'Compare eggs and milk prices in your state vs others?',
    category: 'comparison',
    icon: 'globe',
    iconType: 'svg',
    iconPath:
      'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    topics: ['groceries', 'inflation'],
  },
];

const timelineConfig = {
  name: 'policy-impact-2024-2025',
  description: 'Timeline tracking policy impacts from before 2024 election through current',
  milestones: [
    {
      position: 0,
      date: '2024-07-01T00:00:00.000Z',
      dateDisplay: 'Jul 1, 2024',
      label: 'Before Policy',
      description: 'Baseline before major policy changes',
      isDefault: false,
      highlighted: false,
    },
    {
      position: 20,
      date: '2024-10-01T00:00:00.000Z',
      dateDisplay: 'Oct 1, 2024',
      label: 'Pre-Election',
      description: 'Period leading up to election',
      isDefault: false,
      highlighted: false,
    },
    {
      position: 50,
      date: '2025-01-20T00:00:00.000Z',
      dateDisplay: 'Jan 20, 2025',
      label: 'Inauguration Day',
      description: 'Presidential inauguration',
      isDefault: true,
      highlighted: true,
    },
    {
      position: 70,
      date: '2025-04-01T00:00:00.000Z',
      dateDisplay: 'Apr 1, 2025',
      label: 'Early Months',
      description: 'First 100 days impact',
      isDefault: false,
      highlighted: false,
    },
    {
      position: 85,
      date: '2025-07-01T00:00:00.000Z',
      dateDisplay: 'Jul 1, 2025',
      label: 'Mid-Year',
      description: 'Mid-year assessment',
      isDefault: false,
      highlighted: false,
    },
    {
      position: 100,
      date: '2025-10-01T00:00:00.000Z',
      dateDisplay: 'Oct 1, 2025',
      label: 'Current Snapshot',
      description: 'Current state of prices',
      isDefault: false,
      highlighted: false,
    },
  ],
  slider: { min: 0, max: 100, step: 1, defaultValue: 50 },
  dateRange: {
    start: '2024-07-01T00:00:00.000Z',
    end: '2025-10-01T00:00:00.000Z',
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
    colorScheme: { track: '#e5e7eb', progress: '#FF6B5A', thumb: '#FF6B5A' },
  },
  active: true,
  status: 'published',
};

/**
 * Build a fallback response body for GET /api/homepage/all.
 * @param {string} state - requested state (echoed back)
 * @param {string} period - requested period (echoed back)
 */
export function getFallbackHomepageData(state = 'nationwide', period = 'YoY') {
  return {
    success: true,
    fallback: true,
    notice:
      'Live data is temporarily unavailable. Showing a recent snapshot while the database is restored.',
    state,
    period,
    data: {
      walletShocks,
      costDrivers,
      stats,
      stateComparisons,
      socialPosts,
      quickQuestions,
      timelineConfig,
    },
  };
}

export default getFallbackHomepageData;
