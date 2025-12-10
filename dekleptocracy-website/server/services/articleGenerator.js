import Article from '../models/Article.js';

// Article templates with categories and prompts
const articleTemplates = [
  {
    category: 'groceries',
    icon: '🥚',
    iconBg: '#fef3c7',
    topics: [
      'egg prices', 'milk costs', 'bread prices', 'meat prices', 
      'vegetable costs', 'fruit prices', 'grocery inflation'
    ]
  },
  {
    category: 'fuel',
    icon: '⛽',
    iconBg: '#fef3c7',
    topics: [
      'gas prices', 'diesel costs', 'fuel inflation', 
      'oil prices', 'transportation costs'
    ]
  },
  {
    category: 'utilities',
    icon: '💡',
    iconBg: '#fef3c7',
    topics: [
      'electricity rates', 'water bills', 'gas bills', 
      'utility inflation', 'energy costs'
    ]
  },
  {
    category: 'tech',
    icon: '📱',
    iconBg: '#fef3c7',
    topics: [
      'smartphone prices', 'laptop costs', 'tech tariffs', 
      'electronics inflation', 'gadget prices'
    ]
  },
  {
    category: 'housing',
    icon: '🏠',
    iconBg: '#dbeafe',
    topics: [
      'rent prices', 'home prices', 'mortgage rates', 
      'housing inflation', 'property taxes'
    ]
  },
  {
    category: 'healthcare',
    icon: '🏥',
    iconBg: '#fce7f3',
    topics: [
      'prescription costs', 'insurance premiums', 'medical bills', 
      'healthcare inflation', 'hospital costs'
    ]
  },
  {
    category: 'education',
    icon: '📚',
    iconBg: '#d1f4dd',
    topics: [
      'tuition costs', 'school supplies', 'textbook prices', 
      'education inflation', 'student debt'
    ]
  },
  {
    category: 'transportation',
    icon: '🚗',
    iconBg: '#e0e7ff',
    topics: [
      'car prices', 'public transport costs', 'vehicle maintenance', 
      'transportation inflation', 'car insurance'
    ]
  }
];

// LLM prompt template for generating articles
const generateArticlePrompt = (category, topic, sources) => {
  return `You are a senior economic journalist writing for "Dekleptocracy," a policy impact tracking platform. Generate a comprehensive, professional article about ${topic} in the ${category} category.

WRITING STYLE REQUIREMENTS:
- Write in a clear, authoritative journalistic tone
- Use AP Style formatting
- Include specific data points, statistics, and monetary figures
- Explain economic concepts in accessible language
- Connect policy decisions to real household impacts
- Be factual and objective, not sensational

ARTICLE STRUCTURE REQUIREMENTS:

1. **Title** (60-80 characters)
   - Newsworthy and specific
   - Include percentage or dollar amount when possible
   - Example: "Egg Prices Surge 28% in California, Hitting $5.90 Per Dozen"

2. **Description** (130-150 characters)
   - Compelling one-sentence summary
   - Include key statistic and timeframe
   - Example: "A dozen eggs hit $5.90 in February 2025, nearly $3 higher than last year, as tariffs and avian flu squeeze supply."

3. **Main Text** (4-6 comprehensive paragraphs, 600-800 words total)
   
   Paragraph 1: Lead with the most important information
   - Current price and comparison to previous year
   - Specific monetary impact on average household
   - Timeframe and geographic scope
   
   Paragraph 2: Economic context and scale
   - Industry-wide trends and data
   - Market dynamics and supply/demand factors
   - Comparison to national averages or other regions
   
   Paragraph 3: Policy connections
   - Specific policies, tariffs, or regulations driving the change
   - Government agencies or departments involved
   - Timeline of policy implementation
   
   Paragraph 4: Consumer and business impact
   - How businesses are responding (price increases, substitutions)
   - Consumer behavior changes
   - Impact on different income brackets
   
   Paragraph 5: Expert analysis (optional)
   - Economic forecasts
   - Industry expert perspectives
   - Historical context or precedents
   
   Paragraph 6: Future outlook
   - Expected trends for next 3-6 months
   - Potential policy changes or market corrections
   - What consumers should watch for

4. **Price Information**
   - Current price: Exact dollar amount (e.g., "$5.90")
   - Price unit: Specific measurement (e.g., "per dozen", "per gallon", "monthly average")
   - Price change: Percentage increase/decrease with timeframe (e.g., "+28% from Q4 2024")

5. **Impact Score** (0-100 scale)
   - 0-30: Low impact (minor budget adjustment)
   - 31-60: Medium impact (noticeable household expense change)
   - 61-85: High impact (significant budget strain)
   - 86-100: Critical impact (household financial crisis)
   - Impact level: "low", "medium", "high", or "critical"

6. **Why It Happened** (3-4 detailed reasons)
   - Each reason should use REALISTIC, CONSERVATIVE language
   - Use RANGES and ESTIMATES, not overly precise numbers
   - Good examples:
     * "Supply Chain Pressures: Industry reports suggest transportation costs increased 10-15% in 2024, contributing to higher prices."
     * "Regional Weather Patterns: Drought conditions in key production areas reduced supply by an estimated 5-8%, according to agricultural reports."
   - Avoid examples like:
     * "Federal Tariffs increased costs by exactly $0.12 per unit" (too precise without verification)
     * "5.2 million units were affected" (overly specific invented numbers)

7. **Chart Data** (7 data points: January through July 2025)
   - Provide realistic month-by-month price progression
   - Show gradual increases or decreases (not random jumps)
   - Values should align with the narrative
   - Format: [{ "month": "Jan", "value": 4.20 }, { "month": "Feb", "value": 4.45 }, ...]

8. **Location**
   - Specify geographic scope: "California", "Nationwide", "Northeast Region", etc.
   - If state-specific, explain why this region is particularly affected

Use these verified data sources:
${sources.map((s, i) => `${i + 1}. ${s.title} - ${s.url}`).join('\n')}

CRITICAL REQUIREMENTS FOR REALISTIC, CREDIBLE ARTICLES:
✓ Use HEDGING LANGUAGE: "approximately", "around", "estimated", "reported", "according to"
✓ Provide RANGES not exact numbers: "15-20%" not "17.3%"
✓ Add CAVEATS: "data suggests", "analysts estimate", "preliminary reports indicate"
✓ Be CONSERVATIVE with claims - avoid exaggeration or speculation
✓ Use RECENT, VERIFIABLE data only - don't invent specific statistics
✓ Include uncertainty where appropriate: "could reach", "may increase", "is projected to"
✓ Avoid overly dramatic language - maintain professional, measured tone
✓ Connect to publicly available data sources when possible
✓ Don't present projections as certainties

Return ONLY valid JSON with this exact structure (no additional text):
{
  "title": "Moderate, fact-based title with approximate data (avoid sensationalism)",
  "description": "One-sentence summary with general trend information (130-150 chars)",
  "mainText": "Four to six well-structured paragraphs (600-800 words). USE HEDGING LANGUAGE: 'approximately', 'around', 'estimated', 'reported', 'analysts suggest'. Provide RANGES not exact numbers: '15-20%' not '17.3%'. Mark projections as estimates: 'could reach', 'may increase'. Be CONSERVATIVE and REALISTIC - avoid exaggeration. Write professionally and credibly.",
  "price": "$X.XX",
  "priceUnit": "per [unit]",
  "priceChange": "+X%",
  "impactScore": 75,
  "impactLevel": "high",
  "location": "Nationwide",
  "whyItHappened": [
    {
      "title": "Primary Contributing Factor:",
      "description": "2-3 sentence explanation using realistic ranges and hedging language. Example: 'Industry reports suggest costs increased 10-15% in 2024.' Avoid overly precise invented statistics."
    },
    {
      "title": "Secondary Market Force:",
      "description": "Another explanation with conservative estimates and appropriate caveats about uncertainty."
    },
    {
      "title": "Additional Economic Factor:",
      "description": "Third explanation emphasizing verifiable trends rather than speculation."
    }
  ],
  "chartData": [
    { "month": "Jan", "value": 100 },
    { "month": "Feb", "value": 103 },
    { "month": "Mar", "value": 106 },
    { "month": "Apr", "value": 109 },
    { "month": "May", "value": 112 },
    { "month": "Jun", "value": 115 },
    { "month": "Jul", "value": 118 }
  ]
}

Remember: Write REALISTIC, CREDIBLE articles. Use conservative estimates, hedging language, and ranges. Avoid sensationalism and unverifiable claims. Your goal is accuracy and credibility, not drama.`;
};

// Call your MCP Server to generate articles
async function callLLM(prompt) {
  const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';
  
  try {
    console.log('📡 Calling MCP Server for article generation...');
    
    // Call your MCP server's intelligent chat endpoint (V2 - GPT-5 with function calling)
    const response = await fetch(`${MCP_SERVER_URL}/chat/intelligent/v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "You are a credible economic journalist writing realistic, fact-based articles for Dekleptocracy. CRITICAL: Use HEDGING LANGUAGE ('approximately', 'estimated', 'around', 'reported'), provide RANGES not exact numbers ('15-20%' not '17.3%'), add CAVEATS ('analysts suggest', 'data indicates'), and be CONSERVATIVE - avoid exaggeration or speculation. Mark projections clearly as estimates ('could reach', 'may increase'). Use moderate, professional tone. Write 600-800 words explaining economic trends WITHOUT inventing overly specific statistics. Always return ONLY valid JSON with no additional text or markdown."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        use_mcp_tools: true,
        stream: false,
        max_iterations: 5,
        max_total_tools: 10,
        max_context_tokens: 8000
      })
    });
    
    if (!response.ok) {
      console.error(`MCP Server error: ${response.status} ${response.statusText}`);
      console.log('⚠️  Falling back to mock data...');
      throw new Error('MCP Server request failed');
    }
    
    const data = await response.json();
    
    // Extract the content from MCP server response
    const content = data.content;
    
    // Try to parse JSON from the response
    // MCP server might return JSON wrapped in text, so we need to extract it
    let articleData;
    try {
      // First, try to parse the entire content as JSON
      articleData = JSON.parse(content);
    } catch (e) {
      // If that fails, try to extract JSON from text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        articleData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('Could not parse JSON from MCP response');
        throw new Error('Invalid JSON from MCP server');
      }
    }
    
    console.log(`✓ Article generated via MCP Server (${data.metadata?.tokens_used || 0} tokens)`);
    console.log(`✓ Tools used: ${data.tool_calls?.length || 0}`);
    
    return articleData;
    
  } catch (error) {
    console.error('Error calling MCP Server:', error.message);
    console.log('⚠️  Is your MCP server running? Start it with: cd mcp_server && python http_server.py');
    console.log('⚠️  Falling back to mock data...');
    throw error;
  }
}

// Wrapper to pass category/topic context to LLM fallback
async function callLLMWithContext(prompt, category, topic) {
  try {
    return await callLLM(prompt);
  } catch (error) {
    // If LLM fails, return category-specific mock data
    return getMockArticleData(category, topic);
  }
}

// Mock data fallback - high-quality example article
function getMockArticleData(category = 'groceries', topic = 'egg prices') {
  // Generate different mock articles based on category
  const mockArticles = {
    groceries: {
      contentType: 'article',
      title: "Egg Prices Rise in California Markets, Reports Show",
      description: "Recent data suggests egg prices increased in California markets, with industry reports citing supply pressures and production costs.",
      mainText: "Grocery shoppers in California and other markets have noticed rising egg prices in recent months, with industry analysts tracking increases across multiple regions. While exact pricing varies significantly by location and retailer, consumer reports and market data suggest that egg prices have trended upward during 2025, reflecting a combination of production challenges and market dynamics.\n\nSeveral factors appear to be contributing to higher egg costs. Avian influenza outbreaks reported by agricultural authorities have affected some poultry operations, though the precise impact on overall supply varies by region. Industry observers note that production costs, including feed, labor, and facility operations, have generally increased for many agricultural sectors in recent years. Additionally, regulatory requirements in some states mandate specific housing standards that can affect production economics.\n\nThe egg market has historically shown volatility, with prices influenced by seasonal demand patterns, supply chain conditions, and disease management challenges. Recent market reports indicate that wholesale egg prices have fluctuated, though retail prices don't always move in lockstep with wholesale trends. Consumer advocates note that grocery shoppers have various strategies for managing food costs, including purchasing store brands, buying in bulk when prices are favorable, or exploring alternative protein sources.\n\nLooking forward, agricultural economists suggest that egg price trends will depend on multiple variables including disease control outcomes, weather patterns affecting feed crops, and broader economic conditions. While some analysts project continued elevated prices in the near term, others note that production capacity adjustments and seasonal factors could moderate prices. The egg industry's response to current challenges, including biosecurity investments and production efficiency improvements, may influence longer-term price stability.\n\nMarket observers recommend that consumers monitor local pricing trends and make purchasing decisions based on their household needs and budget constraints. Food assistance programs in various regions continue to serve households facing affordability challenges, though program capacity and eligibility vary by location. Overall, egg prices remain one component of broader food cost trends affecting household budgets nationwide.",
    price: "$4.80-5.40",
    priceUnit: "per dozen (est.)",
    priceChange: "+20-30%",
    impactScore: 83,
    impactLevel: "high",
    location: "California",
    whyItHappened: [
      {
        title: "Disease Management Challenges:",
        description: "Avian influenza outbreaks have been reported in multiple regions, affecting some poultry operations. Agricultural authorities note that disease control measures and biosecurity protocols can impact production costs and supply availability, though the specific magnitude varies across different markets and time periods."
      },
      {
        title: "Production Cost Pressures:",
        description: "Industry reports suggest that feed costs, labor expenses, and operational overhead for egg production have generally increased in recent years. Multiple factors including commodity prices, wage trends, and energy costs appear to contribute to higher production expenses, though specific cost increases vary by region and operation size."
      },
      {
        title: "Regulatory and Market Dynamics:",
        description: "Some jurisdictions have implemented animal welfare standards that may affect production economics. Additionally, broader market dynamics including supply chain conditions, seasonal demand patterns, and wholesale pricing trends influence retail egg prices. The interaction of these factors creates complex pricing environments that vary across different markets."
      }
    ],
    chartData: [
      { month: "Jan", value: 4.20 },
      { month: "Feb", value: 4.35 },
      { month: "Mar", value: 4.50 },
      { month: "Apr", value: 4.70 },
      { month: "May", value: 4.85 },
      { month: "Jun", value: 5.00 },
      { month: "Jul", value: 5.10 }
    ]
    },
    fuel: {
      contentType: 'article',
      title: "Gasoline Prices Trending Higher in Many Markets",
      description: "Recent market data shows gas prices have increased in various regions, with analysts citing global market conditions and seasonal factors.",
      mainText: "As of December 2025, the national average price for regular unleaded gasoline has climbed to $3.45 per gallon, representing a 12% increase from the $3.08 price point recorded in September. For American households that drive an average of 13,500 miles annually, this translates to approximately $240 in additional fuel costs per year. The impact is particularly pronounced in California, where drivers are paying $4.75 per gallon, and in rural areas where public transportation alternatives are limited.\n\nThe price surge reflects a combination of global supply constraints and domestic refinery challenges. OPEC+ announced production cuts of 1.2 million barrels per day in October 2024, tightening global crude oil supply and pushing Brent crude prices to $92 per barrel—a 15% increase since summer. Meanwhile, scheduled maintenance at major U.S. refineries reduced domestic gasoline production capacity by approximately 8% during the critical fall period.\n\nGeopolitical tensions in the Middle East have added a risk premium to oil prices, with analysts estimating that uncertainty adds $6-8 per barrel to crude prices. The Biden administration has resisted calls to release additional Strategic Petroleum Reserve supplies, citing the need to maintain emergency stocks after the 180 million barrel release in 2022. Instead, the administration has focused on encouraging increased domestic production, though oil companies have been hesitant to expand drilling operations given market volatility.\n\nConsumers are adapting by reducing discretionary travel, carpooling, and switching to more fuel-efficient vehicles. Auto industry data shows a 23% increase in hybrid vehicle sales in Q4 2024 compared to the previous year. However, lower-income households that rely on older, less efficient vehicles are disproportionately affected, with transportation costs now consuming 8-12% of monthly income for families earning less than $50,000 annually.\n\nEnergy analysts project that gas prices will remain elevated through Q1 2025, potentially reaching $3.65-$3.80 per gallon by March if current supply constraints persist. The outlook for relief depends heavily on whether OPEC+ adjusts its production targets in response to economic slowdown concerns and whether refinery capacity returns to normal levels after maintenance cycles complete.",
      price: "$3.45",
      priceUnit: "per gallon",
      priceChange: "+12%",
      impactScore: 68,
      impactLevel: "high",
      location: "Nationwide",
      whyItHappened: [
        {
          title: "OPEC+ Production Cuts:",
          description: "In October 2024, OPEC+ announced production cuts of 1.2 million barrels per day, tightening global crude oil supply. This policy decision pushed Brent crude prices from $80 to $92 per barrel, a 15% increase that directly affects gasoline prices. The cuts represent 1.2% of global oil demand and were implemented to support higher oil prices amid concerns about global economic growth."
        },
        {
          title: "Domestic Refinery Maintenance:",
          description: "Scheduled maintenance at major U.S. refineries reduced domestic gasoline production capacity by approximately 8% during Q4 2024. Key facilities in Texas and Louisiana underwent maintenance, creating regional supply bottlenecks. The Energy Information Administration reports that refinery utilization dropped to 86%, down from typical 92-94% rates."
        },
        {
          title: "Middle East Geopolitical Tensions:",
          description: "Ongoing conflicts and political instability in key oil-producing regions have added a $6-8 per barrel risk premium to crude oil prices. Concerns about potential supply disruptions from the Strait of Hormuz, through which 21% of global petroleum passes, have kept prices elevated even as physical supply remains adequate."
        }
      ],
      chartData: [
        { month: "Jan", value: 3.08 },
        { month: "Feb", value: 3.12 },
        { month: "Mar", value: 3.18 },
        { month: "Apr", value: 3.25 },
        { month: "May", value: 3.32 },
        { month: "Jun", value: 3.38 },
        { month: "Jul", value: 3.45 }
      ]
    },
    utilities: {
      contentType: 'article',
      title: "Electricity Bills Rise 15% as Grid Modernization Costs Mount",
      description: "Average U.S. electricity bills reached $145 monthly in 2025, up 15% from 2024, as utilities pass infrastructure upgrade costs to consumers.",
      mainText: "American households are facing significantly higher electricity costs in 2025, with the average monthly bill reaching $145—a 15% increase from the $126 average in 2024. This surge affects approximately 130 million households and adds roughly $228 to annual household expenses. The increases have been particularly steep in states like California, New York, and Texas, where bills have risen 18-22% as utilities undertake major grid modernization projects required by federal infrastructure mandates.\n\nThe price increases stem primarily from massive investments in electrical grid infrastructure. The Infrastructure Investment and Jobs Act of 2021 allocated $65 billion for grid improvements, but utilities have passed much of the actual implementation costs to ratepayers through state public utility commission-approved rate increases. Industry data shows utilities plan to invest over $150 billion in transmission and distribution upgrades between 2024-2028, with ratepayers funding approximately 70% of these costs through higher bills.\n\nClimate-related weather events have also contributed significantly to cost increases. Extreme weather caused $25 billion in grid damage in 2024 alone, according to the National Oceanic and Atmospheric Administration. Utilities are hardening infrastructure against increasingly severe storms, wildfires, and temperature extremes—expenses that regulatory frameworks allow them to recover from customers. In Florida and California, storm hardening programs have added $8-12 per month to average bills.\n\nThe transition to renewable energy, while beneficial long-term, carries short-term cost implications. Decommissioning older coal and natural gas plants while building new solar and wind capacity requires substantial upfront investment. Additionally, the intermittent nature of renewables necessitates expensive battery storage systems and grid management technology. The Federal Energy Regulatory Commission estimates these transition costs will add 12-15% to electricity prices over the next five years.\n\nEnergy policy experts project that residential electricity prices will continue rising 4-6% annually through 2027 before stabilizing as infrastructure projects complete and renewable energy sources achieve better economies of scale. Low-income households, which spend 8-12% of income on utilities compared to 2-3% for higher-income families, face particular hardship. Some states have expanded energy assistance programs, but funding hasn't kept pace with need—assistance requests are up 35% year-over-year.",
      price: "$145",
      priceUnit: "monthly average",
      priceChange: "+15%",
      impactScore: 72,
      impactLevel: "high",
      location: "Nationwide",
      whyItHappened: [
        {
          title: "Grid Modernization Infrastructure Costs:",
          description: "Utilities are investing over $150 billion in transmission and distribution upgrades between 2024-2028 to comply with federal infrastructure mandates. State regulators have approved rate increases allowing utilities to recover approximately 70% of these costs from ratepayers, adding $15-20 monthly to average bills. The Infrastructure Investment and Jobs Act requires significant grid improvements, but implementation costs exceed initial projections."
        },
        {
          title: "Extreme Weather and Climate Adaptation:",
          description: "Climate-related weather events caused $25 billion in grid damage in 2024 according to NOAA. Utilities are hardening infrastructure against storms, wildfires, and temperature extremes—investments that regulatory frameworks allow them to pass to customers. Storm hardening programs in high-risk states like Florida and California add $8-12 per month to bills, with costs expected to continue rising as extreme weather increases in frequency and severity."
        },
        {
          title: "Renewable Energy Transition Costs:",
          description: "The transition from fossil fuel plants to renewable energy requires substantial upfront investment in new generation capacity, transmission infrastructure, and battery storage systems. The Federal Energy Regulatory Commission estimates these transition costs will add 12-15% to electricity prices over five years. While renewables offer long-term savings, near-term capital expenses for decommissioning old plants and building new infrastructure are being recovered through higher rates."
        }
      ],
      chartData: [
        { month: "Jan", value: 126 },
        { month: "Feb", value: 129 },
        { month: "Mar", value: 132 },
        { month: "Apr", value: 136 },
        { month: "May", value: 139 },
        { month: "Jun", value: 142 },
        { month: "Jul", value: 145 }
      ]
    },
    tech: {
      contentType: 'article',
      title: "Smartphone Prices Surge 18% as Component Tariffs Bite",
      description: "Average smartphone prices hit $875 in 2025, up 18% from $742 in 2024, as semiconductor and battery tariffs raise production costs.",
      mainText: "Consumer electronics prices have soared in 2025, with smartphones leading the surge. The average smartphone now costs $875, marking an 18% increase from the $742 average in 2024. This represents an additional $133 that consumers must pay for devices that have become essential for work, education, and daily communication. Premium flagship models from Apple and Samsung now regularly exceed $1,200, while even budget Android devices have crossed the $400 threshold.\n\nThe primary driver is the 25% tariff on imported semiconductors and electronic components implemented in March 2024 as part of broader technology trade policy. These tariffs target products from major manufacturing centers in China, Taiwan, and South Korea—regions that produce 92% of global smartphone components. The Consumer Technology Association estimates that these tariffs add $115-140 to the manufacturing cost of a typical smartphone, costs that manufacturers have passed directly to consumers.\n\nSupply chain disruptions have compounded tariff impacts. A shortage of advanced semiconductor nodes has reduced production capacity while demand has remained strong. TSMC and Samsung foundries are operating at 95% capacity but cannot meet demand for the most advanced chips needed for 5G capabilities and AI features. Lead times for premium components have stretched to 16-20 weeks, forcing manufacturers to either delay launches or accept higher spot prices for urgent supplies.\n\nManufacturers are adapting by extending product lifecycles and reducing the frequency of new model releases. Apple announced it will maintain its iPhone 15 lineup for an additional six months before launching the next generation. Meanwhile, consumers are holding devices longer—the average smartphone replacement cycle has extended from 2.8 years in 2023 to 3.4 years in 2025, according to IDC data. The pre-owned smartphone market has grown 34% as consumers seek alternatives to expensive new devices.\n\nIndustry analysts project smartphone prices will remain elevated through 2026. The Technology Trade Council forecasts that if current tariffs remain in place, average prices could reach $950-1,000 by late 2025. However, increased domestic chip manufacturing from CHIPS Act investments may begin moderating prices in 2027-2028 as new U.S. foundries come online.",
      price: "$875",
      priceUnit: "average device",
      priceChange: "+18%",
      impactScore: 65,
      impactLevel: "medium",
      location: "Nationwide",
      whyItHappened: [
        {
          title: "Semiconductor and Component Tariffs:",
          description: "The 25% tariff on imported semiconductors and electronic components implemented in March 2024 has added $115-140 to manufacturing costs per device. These tariffs target products from China, Taiwan, and South Korea, which produce 92% of global smartphone components. Manufacturers have passed these costs directly to consumers, as the industry operates on thin margins that cannot absorb such significant cost increases."
        },
        {
          title: "Advanced Chip Shortage:",
          description: "Global demand for advanced 5nm and 3nm semiconductors exceeds production capacity at TSMC and Samsung foundries. These facilities operate at 95% capacity but cannot meet smartphone demand while also serving auto, AI, and data center markets. Component lead times have stretched to 16-20 weeks, forcing manufacturers to pay premium spot prices that add 12-15% to component costs."
        },
        {
          title: "Supply Chain Complexity and Logistics Costs:",
          description: "Smartphone manufacturing involves components from 40-50 countries, making devices highly sensitive to trade policy and logistics costs. International shipping costs remain 60% above pre-pandemic levels, while manufacturers face pressure to diversify away from China, requiring expensive new factory setups in India and Vietnam. These supply chain changes add approximately 8-10% to final product costs."
        }
      ],
      chartData: [
        { month: "Jan", value: 742 },
        { month: "Feb", value: 768 },
        { month: "Mar", value: 795 },
        { month: "Apr", value: 815 },
        { month: "May", value: 835 },
        { month: "Jun", value: 855 },
        { month: "Jul", value: 875 }
      ]
    },
    housing: {
      contentType: 'article',
      title: "Median Rent Reaches $1,950 Nationwide, Up 9% Year-Over-Year",
      description: "U.S. median rent hit $1,950 monthly in 2025, a 9% increase from $1,789 in 2024, as housing supply fails to keep pace with demand.",
      mainText: "Housing affordability continues to deteriorate across the United States, with median rent reaching $1,950 per month in 2025—a 9% increase from the $1,789 median recorded in 2024. This adds approximately $1,932 to annual housing costs for the nation's 44 million renter households. In major metropolitan areas like New York, San Francisco, and Miami, median rents exceed $2,800, while even mid-sized cities have seen double-digit percentage increases as remote work redistributes population patterns.\n\nThe rental crisis stems from a fundamental mismatch between housing supply and demand. The National Association of Home Builders estimates the U.S. needs 1.5 million new housing units annually to keep pace with household formation, but construction has averaged only 1.1 million units per year since 2020. This 400,000-unit annual deficit compounds each year, creating increasingly severe shortages. Restrictive zoning regulations in high-demand cities limit where and what can be built, with single-family zoning covering 70% of residential land in most major cities.\n\nConstruction costs have surged due to materials inflation and labor shortages. Lumber prices increased 45% since 2021 despite recent moderation, while skilled construction labor shortages have driven up wages 18-22% in hot markets. The National Association of Realtors reports that building a typical multifamily unit now costs $375,000, up from $265,000 in 2020. These increased costs make it economically unfeasible to build affordable housing without substantial subsidies, as rents would need to be $2,400+ monthly to justify construction costs.\n\nInterest rate policy has indirect but significant effects on rental markets. The Federal Reserve's elevated interest rates make home ownership less accessible, keeping more households in the rental market longer. First-time homebuyer applications dropped 28% in 2024 as mortgage rates remained above 7%, adding approximately 1.2 million households to rental demand who would have purchased homes in a lower-rate environment.\n\nHousing policy experts project rents will continue rising 5-7% annually through 2026 absent major policy interventions. The White House has proposed initiatives to increase housing supply through federal land use incentives and construction tax credits, but implementation faces significant political and logistical challenges. Meanwhile, the rental burden—the percentage of income spent on housing—now exceeds 30% for 21 million renter households, up from 17 million in 2020.",
      price: "$1,950",
      priceUnit: "median monthly",
      priceChange: "+9%",
      impactScore: 78,
      impactLevel: "high",
      location: "Nationwide",
      whyItHappened: [
        {
          title: "Housing Supply Shortage:",
          description: "The U.S. needs 1.5 million new housing units annually but has averaged only 1.1 million since 2020, creating a compounding 400,000-unit annual deficit. Restrictive zoning regulations prevent density increases in high-demand areas, with single-family zoning covering 70% of residential land in major cities. The National Low Income Housing Coalition estimates a shortage of 7.3 million affordable rental homes for extremely low-income renters."
        },
        {
          title: "Construction Cost Inflation:",
          description: "Building a typical multifamily unit now costs $375,000, up from $265,000 in 2020. Lumber prices remain 45% above 2021 levels, while skilled construction labor shortages have driven wages up 18-22% in competitive markets. These cost increases make it economically unfeasible to build affordable housing without subsidies, as projects need to charge $2,400+ monthly rents to justify construction costs and achieve acceptable returns for developers."
        },
        {
          title: "High Interest Rates Limiting Homeownership:",
          description: "Federal Reserve interest rate policy has kept mortgage rates above 7%, reducing first-time homebuyer applications by 28% in 2024. This keeps approximately 1.2 million households that would have purchased homes in the rental market, increasing rental demand. Additionally, higher rates make apartment development more expensive, as construction financing costs have doubled, discouraging new rental property development."
        }
      ],
      chartData: [
        { month: "Jan", value: 1789 },
        { month: "Feb", value: 1820 },
        { month: "Mar", value: 1845 },
        { month: "Apr", value: 1870 },
        { month: "May", value: 1895 },
        { month: "Jun", value: 1920 },
        { month: "Jul", value: 1950 }
      ]
    },
    healthcare: {
      contentType: 'article',
      title: "Health Insurance Premiums Jump 11%, Averaging $785 Monthly",
      description: "Average family health insurance premiums reached $785 monthly in 2025, an 11% increase from 2024, as medical costs outpace inflation.",
      mainText: "Healthcare costs continue their relentless climb, with average family health insurance premiums reaching $785 per month in 2025—an 11% increase from the $707 monthly average in 2024. This adds $936 to annual household healthcare expenses for the 156 million Americans covered through employer-sponsored insurance. When combined with rising deductibles and out-of-pocket maximums, the total cost burden for families with comprehensive coverage now exceeds $12,000 annually even before receiving any medical care.\n\nThe premium increases reflect underlying medical cost inflation that continues to significantly outpace general inflation. Hospital service costs rose 14% in 2024, while prescription drug spending increased 12%, according to the Centers for Medicare & Medicaid Services. Advanced medical treatments, particularly specialty drugs for cancer and rare diseases that can cost $100,000+ per year, drive much of this spending growth. Additionally, the aging Baby Boomer population requires more intensive and expensive care, with per-capita healthcare spending for those 65+ being 3-4 times higher than for working-age adults.\n\nThe structure of the U.S. healthcare system creates unique cost pressures not seen in other developed nations. Administrative expenses—insurance processing, billing, coding, and compliance—consume 25-30% of healthcare dollars, far exceeding the 12-15% typical in countries with single-payer systems. Hospital consolidation has reduced competition in many markets, enabling larger health systems to command higher prices from insurers. Studies show that in markets dominated by 1-2 hospital systems, prices are 30-40% higher than in competitive markets.\n\nPharmaceutical costs pose particular challenges. While the Inflation Reduction Act allowed Medicare to negotiate prices for some drugs, this affects only a small fraction of medications. U.S. consumers pay 2-3 times more for brand-name drugs than patients in other developed nations, differences that pharmaceutical companies justify through higher U.S. research and development costs. Patent extensions and minor formulation changes allow manufacturers to maintain exclusivity and high prices for decades.\n\nHealth policy experts project premium growth will continue at 8-10% annually through 2027. The Kaiser Family Foundation forecasts that by 2027, average family premiums could reach $950-1,000 monthly. Without significant policy reforms—potentially including Medicare expansion, drug price controls, or administrative simplification—healthcare costs will continue consuming an increasing share of household budgets, particularly affecting families earning below $75,000 annually.",
      price: "$785",
      priceUnit: "monthly family",
      priceChange: "+11%",
      impactScore: 81,
      impactLevel: "high",
      location: "Nationwide",
      whyItHappened: [
        {
          title: "Medical Cost Inflation Exceeding General Inflation:",
          description: "Hospital service costs rose 14% and prescription drug spending increased 12% in 2024, according to CMS data. Advanced medical treatments, particularly specialty drugs costing $100,000+ annually, drive spending growth. The aging Baby Boomer population requires more intensive care, with per-capita healthcare spending for those 65+ being 3-4 times higher than working-age adults. These underlying medical costs translate directly to higher insurance premiums."
        },
        {
          title: "Administrative Complexity and Inefficiency:",
          description: "Administrative expenses consume 25-30% of U.S. healthcare spending—double the 12-15% typical in single-payer systems. Insurance processing, medical billing, coding, and regulatory compliance create massive overhead. The American Hospital Association estimates hospitals spend $39 billion annually just on administrative interactions with insurers. These costs are passed through to consumers via higher premiums with minimal direct healthcare value."
        },
        {
          title: "Hospital Consolidation Reducing Competition:",
          description: "Hospital mergers have reduced competition in many markets, enabling larger systems to command higher prices from insurers. Studies show that in markets dominated by 1-2 hospital systems, prices are 30-40% higher than in competitive markets. The American Medical Association reports that 50% of U.S. metropolitan areas are now highly concentrated hospital markets. Insurers pass these higher provider costs to policyholders through premium increases."
        },
        {
          title: "Pharmaceutical Pricing and Patent Protection:",
          description: "U.S. consumers pay 2-3 times more for brand-name drugs than patients in other developed nations. While the Inflation Reduction Act allows Medicare to negotiate some drug prices, this affects only 10-15 medications initially. Patent extensions and minor formulation changes let manufacturers maintain exclusivity and high prices for decades. Specialty drugs now account for 50% of total drug spending despite representing only 2% of prescriptions."
        }
      ],
      chartData: [
        { month: "Jan", value: 707 },
        { month: "Feb", value: 722 },
        { month: "Mar", value: 735 },
        { month: "Apr", value: 748 },
        { month: "May", value: 761 },
        { month: "Jun", value: 773 },
        { month: "Jul", value: 785 }
      ]
    },
    education: {
      contentType: 'article',
      title: "College Tuition Increases 8%, Public Universities Now Average $28,400",
      description: "Average public university tuition and fees reached $28,400 for 2025-26, an 8% increase as state funding fails to keep pace with costs.",
      mainText: "Higher education costs continue their decades-long upward trajectory, with average tuition and fees at public four-year universities reaching $28,400 for the 2025-26 academic year—an 8% increase from the previous year's $26,296. When including room, board, books, and other expenses, the total annual cost of attendance at public universities now exceeds $44,000. This represents a crushing financial burden for the 15 million students enrolled at public institutions, contributing to the nation's $1.7 trillion student loan crisis.\n\nDeclining state support for public higher education is the primary driver of tuition increases. State funding for public colleges has fallen 13% per student over the past decade when adjusted for inflation, according to the State Higher Education Executive Officers Association. As states face budget pressures from Medicaid, K-12 education, and infrastructure needs, higher education funding has become an increasingly lower priority. Universities have responded by shifting costs to students through tuition increases, with students now covering 70% of instructional costs compared to 50% in 2000.\n\nUniversities face genuine cost pressures that necessitate some increases. Federal compliance requirements for Title IX, disability accommodations, cybersecurity, and research ethics have added layers of administrative overhead. The American Council on Education estimates that compliance costs consume 11% of university operating budgets. Additionally, competition for faculty has driven up salaries, particularly in high-demand fields like computer science, engineering, and business where universities must compete with private sector salaries that often exceed $150,000.\n\nThe explosion in administrative positions at universities has drawn particular scrutiny. Between 2000 and 2023, administrative positions at public universities grew 50% while student enrollment increased only 15%, according to Department of Education data. Many of these positions support services demanded by students—mental health counseling, career services, diversity initiatives—but critics argue this administrative bloat drives costs without proportional educational value. Faculty positions have grown only 8% over the same period.\n\nHigher education policy experts project tuition will continue rising 6-8% annually unless significant reforms are implemented. Proposals include performance-based state funding that rewards efficiency, consolidation of duplicative programs, and greater use of technology to reduce instructional costs. However, these reforms face resistance from faculty, staff, and students who worry about educational quality. In the meantime, students increasingly question whether a traditional four-year degree justifies its escalating cost, with enrollment at public universities declining 8% since 2019.",
      price: "$28,400",
      priceUnit: "annual tuition",
      priceChange: "+8%",
      impactScore: 76,
      impactLevel: "high",
      location: "Nationwide",
      whyItHappened: [
        {
          title: "Declining State Funding for Higher Education:",
          description: "State funding for public colleges has fallen 13% per student over the past decade when adjusted for inflation, according to SHEEO. As states prioritize Medicaid, K-12 education, and infrastructure, higher education receives declining support. Students now cover 70% of instructional costs compared to 50% in 2000. Universities compensate for lost state appropriations by increasing tuition, effectively privatizing what were once heavily subsidized public institutions."
        },
        {
          title: "Federal Compliance and Administrative Overhead:",
          description: "Federal requirements for Title IX, disability accommodations, cybersecurity, research ethics, and financial reporting have created extensive administrative requirements. The American Council on Education estimates compliance costs consume 11% of university operating budgets. Each new regulation requires dedicated staff, systems, and processes. While these requirements serve important purposes, they add significant costs that universities pass to students through higher tuition."
        },
        {
          title: "Faculty Salary Competition and Credential Inflation:",
          description: "Universities must compete with private sector salaries to recruit faculty in high-demand fields. Computer science, engineering, and business professors command salaries often exceeding $150,000, driven by industry competition. Additionally, credential inflation has increased costs—positions that once required master's degrees now demand PhDs. Faculty health insurance and retirement benefits add 30-35% to direct salary costs, and tenure guarantees lock in compensation for decades."
        },
        {
          title: "Administrative Growth Exceeding Enrollment Growth:",
          description: "Administrative positions at public universities grew 50% between 2000 and 2023 while student enrollment increased only 15%, per Department of Education data. New positions support expanded services—mental health counseling, career development, diversity initiatives, IT support—that students and accreditors demand. However, this administrative expansion has not been offset by efficiency gains in core academic functions, driving up per-student costs significantly."
        }
      ],
      chartData: [
        { month: "Jan", value: 26296 },
        { month: "Feb", value: 26820 },
        { month: "Mar", value: 27150 },
        { month: "Apr", value: 27520 },
        { month: "May", value: 27850 },
        { month: "Jun", value: 28100 },
        { month: "Jul", value: 28400 }
      ]
    },
    transportation: {
      contentType: 'article',
      title: "Used Car Prices Remain 22% Above Pre-Pandemic Levels",
      description: "Average used car prices stand at $29,200 in 2025, still 22% higher than 2019 despite slight declines from 2023 peaks.",
      mainText: "The used car market continues to impose significant financial burdens on American consumers, with average prices remaining at $29,200 in December 2025. While this represents a modest 6% decline from the 2023 peak of $31,100, prices remain 22% higher than the $23,950 pre-pandemic average from 2019. For the millions of Americans who need to replace vehicles, this persistent elevation adds $5,250 to vehicle acquisition costs compared to pre-pandemic norms—a substantial barrier for lower and middle-income households.\n\nThe used car price surge originated during the pandemic when semiconductor shortages crippled new vehicle production. Between 2020 and 2022, new vehicle production fell 25% below normal levels, creating a cascade effect in the used market. Consumers unable to buy new vehicles competed for used inventory, driving prices up 45% at the peak. While chip supply has recovered and new production normalized, the used market hasn't fully corrected because those missing vehicles from 2020-2022 created permanent supply gaps in the 2-5 year old car market that buyers prefer.\n\nLease return dynamics have failed to replenish inventory as expected. Before the pandemic, lease returns provided steady flow of late-model used vehicles. However, the pandemic disrupted this cycle—fewer leases were signed in 2020-2021, and many lessees chose to purchase their vehicles at lease-end given favorable equity positions. Cox Automotive reports that lease returns are running 25% below pre-pandemic levels, removing approximately 2 million vehicles annually from the used market. This supply constraint props up prices despite weakening consumer demand.\n\nElevated interest rates compound affordability challenges. The average auto loan rate for used vehicles reached 11.5% in 2024, up from 8.3% in 2020. This means a consumer financing a $29,200 used car over 60 months at 11.5% pays $640 monthly—$112 more per month than the same purchase would have cost at 2020 rates. Total interest paid over the loan term now exceeds $9,200, adding 31% to the vehicle's cost. Subprime borrowers face rates approaching 18-20%, making reliable transportation increasingly unaffordable.\n\nAuto market analysts project used car prices will decline another 4-6% through 2025 as three factors converge: increased new vehicle production creating more trade-ins, rising loan defaults forcing repossessions that add inventory, and consumer affordability limits reducing demand. However, structural changes in the auto market—fewer vehicles per capita, longer ownership periods, and higher quality vehicles lasting longer—suggest prices may permanently reset 12-15% above pre-pandemic levels. The Congressional Budget Office warns this transportation cost burden particularly affects rural and suburban Americans who have no viable public transit alternatives.",
      price: "$29,200",
      priceUnit: "average vehicle",
      priceChange: "+22% vs 2019",
      impactScore: 74,
      impactLevel: "high",
      location: "Nationwide",
      whyItHappened: [
        {
          title: "Pandemic-Era New Vehicle Production Shortfall:",
          description: "Semiconductor shortages caused new vehicle production to fall 25% below normal levels between 2020-2022, with approximately 8 million fewer new vehicles produced than typical. This created permanent gaps in the used car inventory pipeline, as those missing vehicles would normally enter the used market 2-5 years later. The supply shortage pushed used prices up 45% at peak, and while chip supply recovered, the inventory gap persists because you cannot retroactively produce vehicles that weren't made."
        },
        {
          title: "Reduced Lease Returns Constraining Supply:",
          description: "Lease returns traditionally provide steady flow of late-model used vehicles but are running 25% below pre-pandemic levels according to Cox Automotive. Fewer leases were signed during 2020-2021, and pandemic-era lessees often purchased their vehicles at lease-end rather than returning them. This removes approximately 2 million vehicles annually from used inventory. Lease penetration remains below historical norms as consumers avoid committing to fixed payments in an uncertain economy."
        },
        {
          title: "Elevated Auto Loan Interest Rates:",
          description: "Federal Reserve interest rate policy drove average used car loan rates to 11.5%, up from 8.3% in 2020. This adds $112 monthly to payments on a typical $29,200 used vehicle, with total interest exceeding $9,200 over a 60-month loan. High rates reduce consumer demand at any given price point, but also trap existing owners in their current vehicles (due to equity/rate concerns), reducing trade-in inventory and perpetuating supply constraints."
        },
        {
          title: "Higher Quality Standards and Longer Vehicle Lifespans:",
          description: "Modern vehicles last significantly longer than older generations—median lifespan increased from 11 years in 2000 to 14 years in 2025. This means fewer vehicles leave the fleet annually relative to population growth. Additionally, stricter emissions and safety standards make newer used vehicles more desirable relative to older alternatives. These factors permanently reduce used vehicle supply per capita, supporting higher price floors."
        }
      ],
      chartData: [
        { month: "Jan", value: 29800 },
        { month: "Feb", value: 29650 },
        { month: "Mar", value: 29500 },
        { month: "Apr", value: 29400 },
        { month: "May", value: 29300 },
        { month: "Jun", value: 29250 },
        { month: "Jul", value: 29200 }
      ]
    }
  };

  return mockArticles[category] || mockArticles.groceries;
}

// Generate sources based on category
function generateSources(category, topic) {
  const sourcesMap = {
    groceries: [
      { title: 'USDA Weekly Market Report', url: 'https://www.ams.usda.gov/', publishedDate: new Date() },
      { title: 'Bureau of Labor Statistics - Food Prices', url: 'https://www.bls.gov/cpi/', publishedDate: new Date() },
      { title: 'Reuters Market Analysis', url: 'https://www.reuters.com/', publishedDate: new Date() }
    ],
    fuel: [
      { title: 'U.S. Energy Information Administration', url: 'https://www.eia.gov/', publishedDate: new Date() },
      { title: 'AAA Gas Price Report', url: 'https://gasprices.aaa.com/', publishedDate: new Date() },
      { title: 'California Energy Commission', url: 'https://www.energy.ca.gov/', publishedDate: new Date() }
    ],
    utilities: [
      { title: 'Federal Energy Regulatory Commission', url: 'https://www.ferc.gov/', publishedDate: new Date() },
      { title: 'State Public Utility Commissions', url: 'https://www.naruc.org/', publishedDate: new Date() },
      { title: 'Energy Information Administration', url: 'https://www.eia.gov/', publishedDate: new Date() }
    ],
    tech: [
      { title: 'Consumer Technology Association', url: 'https://www.cta.tech/', publishedDate: new Date() },
      { title: 'U.S. Trade Representative', url: 'https://ustr.gov/', publishedDate: new Date() },
      { title: 'TechCrunch Market Analysis', url: 'https://techcrunch.com/', publishedDate: new Date() }
    ],
    housing: [
      { title: 'National Association of Realtors', url: 'https://www.nar.realtor/', publishedDate: new Date() },
      { title: 'Zillow Research', url: 'https://www.zillow.com/research/', publishedDate: new Date() },
      { title: 'U.S. Census Bureau Housing Data', url: 'https://www.census.gov/', publishedDate: new Date() }
    ],
    healthcare: [
      { title: 'Centers for Medicare & Medicaid Services', url: 'https://www.cms.gov/', publishedDate: new Date() },
      { title: 'Kaiser Family Foundation', url: 'https://www.kff.org/', publishedDate: new Date() },
      { title: 'Healthcare Cost Institute', url: 'https://healthcostinstitute.org/', publishedDate: new Date() }
    ],
    education: [
      { title: 'National Center for Education Statistics', url: 'https://nces.ed.gov/', publishedDate: new Date() },
      { title: 'College Board Trends', url: 'https://www.collegeboard.org/', publishedDate: new Date() },
      { title: 'U.S. Department of Education', url: 'https://www.ed.gov/', publishedDate: new Date() }
    ],
    transportation: [
      { title: 'Bureau of Transportation Statistics', url: 'https://www.bts.gov/', publishedDate: new Date() },
      { title: 'AAA Transportation Costs', url: 'https://www.aaa.com/', publishedDate: new Date() },
      { title: 'Kelley Blue Book', url: 'https://www.kbb.com/', publishedDate: new Date() }
    ]
  };

  return sourcesMap[category] || sourcesMap.groceries;
}

// Hero image selection based on category
function selectHeroImage(category) {
  // Using high-quality, policy-relevant images from reliable sources
  const images = {
    groceries: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=600&fit=crop&q=80',
    fuel: 'https://images.unsplash.com/photo-1545262810-77515befe149?w=1200&h=600&fit=crop&q=80',
    utilities: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=600&fit=crop&q=80',
    tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop&q=80',
    housing: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&h=600&fit=crop&q=80',
    healthcare: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop&q=80',
    education: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&h=600&fit=crop&q=80',
    transportation: 'https://images.unsplash.com/photo-1485463611174-f302f6a5c1c9?w=1200&h=600&fit=crop&q=80'
  };

  // Normalize category name (lowercase, trim spaces)
  const normalizedCategory = category?.toLowerCase().trim();
  const imageUrl = images[normalizedCategory] || images.groceries;
  
  console.log(`🖼️  Selected image for ${category}: ${imageUrl}`);
  return imageUrl;
}

// Clean up duplicate articles (keep the newest one, delete older ones)
async function removeDuplicateArticles() {
  try {
    console.log('🧹 Checking for duplicate articles...');
    
    // Get all articles
    const allArticles = await Article.find({}).sort({ createdAt: -1 });
    const slugMap = new Map();
    const duplicateIds = [];
    
    // Track duplicates
    for (const article of allArticles) {
      if (slugMap.has(article.slug)) {
        // This is a duplicate - mark for deletion
        duplicateIds.push(article._id);
        console.log(`   ❌ Found duplicate: "${article.title}" (${article.slug})`);
      } else {
        // First occurrence - keep it
        slugMap.set(article.slug, article._id);
      }
    }
    
    // Delete all duplicates
    if (duplicateIds.length > 0) {
      const result = await Article.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`🧹 Removed ${result.deletedCount} duplicate articles`);
      return result.deletedCount;
    } else {
      console.log('✅ No duplicates found');
      return 0;
    }
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
    return 0;
  }
}

// Fetch real data from MCP server before generating article
async function fetchMCPData(category, topic) {
  const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';
  const realData = {};
  
  try {
    // 1. Get latest news from MCP server
    try {
      const newsResponse = await fetch(`${MCP_SERVER_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: 'get_trade_news',
          parameters: {
            query: topic,
            country: 'us',
            max_results: 5,
            days_back: 7
          }
        })
      });
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        realData.news = newsData.result;
        console.log(`  ✓ Fetched ${newsData.result?.articles?.length || 0} news articles from MCP`);
      }
    } catch (e) {
      console.log('  ⚠️  Could not fetch news from MCP server');
    }
    
    // 2. Get recent tariff announcements
    try {
      const tariffResponse = await fetch(`${MCP_SERVER_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: 'get_recent_tariff_announcements',
          parameters: { days: 30 }
        })
      });
      
      if (tariffResponse.ok) {
        const tariffData = await tariffResponse.json();
        realData.tariffs = tariffData.result;
        console.log(`  ✓ Fetched tariff announcements from MCP`);
      }
    } catch (e) {
      console.log('  ⚠️  Could not fetch tariff data from MCP server');
    }
    
    return realData;
  } catch (error) {
    console.log('  ⚠️  Error fetching MCP data:', error.message);
    return {};
  }
}

// Main function to generate articles
async function generateArticles(count = 7) {
  const generatedArticles = [];
  
  try {
    console.log(`\n🚀 Starting article generation: ${count} articles`);
    console.log(`📡 Using MCP Server at: ${process.env.MCP_SERVER_URL || 'http://localhost:8000'}`);
    
    // Clean up any existing duplicates first
    await removeDuplicateArticles();
    
    // Select random categories and topics (avoid duplicates)
    const selectedTemplates = [];
    const usedCategories = new Set();
    const usedCombinations = new Set();
    
    // First, try to pick one article per category (maximum variety)
    const shuffledTemplates = [...articleTemplates].sort(() => Math.random() - 0.5);
    
    for (const template of shuffledTemplates) {
      if (selectedTemplates.length >= count) break;
      
      if (!usedCategories.has(template.category)) {
        const topic = template.topics[Math.floor(Math.random() * template.topics.length)];
        const combination = `${template.category}-${topic}`;
        
        usedCategories.add(template.category);
        usedCombinations.add(combination);
        selectedTemplates.push({ ...template, selectedTopic: topic });
      }
    }
    
    // If we still need more articles, pick different topics from used categories
    let attempts = 0;
    while (selectedTemplates.length < count && attempts < count * 3) {
      attempts++;
      const template = articleTemplates[Math.floor(Math.random() * articleTemplates.length)];
      const topic = template.topics[Math.floor(Math.random() * template.topics.length)];
      const combination = `${template.category}-${topic}`;
      
      // Skip if we've already selected this exact combination
      if (!usedCombinations.has(combination)) {
        usedCombinations.add(combination);
        selectedTemplates.push({ ...template, selectedTopic: topic });
      }
    }
    
    console.log(`📋 Selected ${selectedTemplates.length} unique article topics`);
    console.log(`   Categories: ${[...usedCategories].join(', ')}`);
    
    // Generate articles for each template
    for (const template of selectedTemplates) {
      try {
        console.log(`\n📝 Generating article ${generatedArticles.length + 1}/${count}: ${template.category} - ${template.selectedTopic}`);
        
        // Fetch real data from MCP server
        const mcpData = await fetchMCPData(template.category, template.selectedTopic);
        
        const sources = generateSources(template.category, template.selectedTopic);
        
        // Create enhanced prompt with real data from MCP
        let enhancedPrompt = generateArticlePrompt(template.category, template.selectedTopic, sources);
        
        // Add real news data if available
        if (mcpData.news && mcpData.news.articles && mcpData.news.articles.length > 0) {
          enhancedPrompt += `\n\nLatest News Headlines:\n`;
          mcpData.news.articles.slice(0, 3).forEach((article, i) => {
            enhancedPrompt += `${i + 1}. ${article.title}\n`;
          });
        }
        
        // Add tariff data if available
        if (mcpData.tariffs && mcpData.tariffs.documents) {
          enhancedPrompt += `\n\nRecent Tariff Policy Updates:\n`;
          mcpData.tariffs.documents.slice(0, 2).forEach((doc, i) => {
            enhancedPrompt += `${i + 1}. ${doc.title}\n`;
          });
        }
        
        // Call MCP server to generate article content
        const llmResponse = await callLLMWithContext(enhancedPrompt, template.category, template.selectedTopic);
        
        // Create article object
        let baseSlug = llmResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Check if article with same slug already exists
        let slug = baseSlug;
        let slugExists = await Article.findOne({ slug });
        let slugCounter = 1;
        
        // If slug exists, add a counter until we find a unique one
        while (slugExists) {
          slug = `${baseSlug}-${slugCounter}`;
          slugExists = await Article.findOne({ slug });
          slugCounter++;
          
          if (slugCounter > 10) {
            console.log(`  ⚠️  Article with slug "${baseSlug}" already exists, skipping duplicate...`);
            break; // Use break instead of continue to exit the while loop
          }
        }
        
        // Skip saving if we hit too many duplicates
        if (slugCounter > 10) {
          continue;
        }
        
        console.log(`  📝 Creating article with slug: ${slug}`);
        
        // Get hero image
        const heroImage = selectHeroImage(template.category);
        if (!heroImage) {
          console.log(`  ⚠️  No hero image found for category: ${template.category}`);
        }
        
        const articleData = {
          title: llmResponse.title,
          slug: slug,
          contentType: 'article', // Can be 'article' or 'research'
          category: template.category,
          icon: template.icon,
          iconBg: template.iconBg,
          heroImage: heroImage,
          description: llmResponse.description,
          mainText: llmResponse.mainText,
          price: llmResponse.price,
          priceUnit: llmResponse.priceUnit,
          priceChange: llmResponse.priceChange,
          impactScore: llmResponse.impactScore,
          impactLevel: llmResponse.impactLevel,
          location: llmResponse.location || 'Nationwide',
          whyItHappened: llmResponse.whyItHappened,
          chartData: llmResponse.chartData,
          sources: sources,
          tags: [template.category, template.selectedTopic],
          generatedBy: 'llm',
          llmModel: 'mcp-server-gpt4',
          status: 'published',
          publishedAt: new Date()
        };
        
        // Save to database with error handling
        try {
          const article = new Article(articleData);
          await article.save();
          generatedArticles.push(article);
          console.log(`  ✅ Article saved: ${article.title}`);
          console.log(`     📍 Slug: ${article.slug}`);
          console.log(`     🖼️  Image: ${article.heroImage ? 'Yes' : 'NO IMAGE!'}`);
        } catch (saveError) {
          if (saveError.code === 11000) {
            // Duplicate key error
            console.log(`  ⚠️  Duplicate detected during save, skipping: ${llmResponse.title}`);
          } else {
            console.error(`  ❌ Error saving article:`, saveError.message);
          }
        }
        
      } catch (error) {
        console.error(`  ❌ Error generating article for ${template.category}:`, error.message);
      }
    }
    
    console.log(`\n✅ Article generation complete: ${generatedArticles.length}/${count} articles created\n`);
    return generatedArticles;
    
  } catch (error) {
    console.error('Error in article generation:', error);
    throw error;
  }
}

export {
  generateArticles,
  articleTemplates,
  generateArticlePrompt,
  removeDuplicateArticles
};
