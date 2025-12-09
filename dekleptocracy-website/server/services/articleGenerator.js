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
   - Each reason must have a bold title and 2-3 sentence explanation
   - Include specific percentages, dollar amounts, or data points
   - Connect to verifiable policy decisions or economic factors
   - Example format:
     * "Federal Tariffs on Imported Grain: The 15% tariff imposed in October 2024 on corn and soy imports increased feed costs by $0.12 per dozen eggs, according to USDA analysis."
     * "Avian Flu Outbreak: H5N1 outbreaks eliminated 5.2 million laying hens across 12 states in Q4 2024, reducing national egg supply by 8% according to CDC agricultural reports."

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

CRITICAL REQUIREMENTS:
✓ Write at a college reading level (clear but sophisticated)
✓ Every statistic must be specific (no vague "many" or "significant")
✓ Include at least 5 concrete numbers or percentages
✓ Connect policy decisions to price impacts
✓ Explain WHY consumers should care
✓ Provide actionable context (trends, forecasts)

Return ONLY valid JSON with this exact structure (no additional text):
{
  "title": "Specific, data-driven title with percentage or dollar amount",
  "description": "Compelling one-sentence summary with key statistic (130-150 chars)",
  "mainText": "Four to six well-structured paragraphs (600-800 words). Each paragraph should flow naturally. Include specific data points, policy connections, and real-world impacts. Use transitions between paragraphs. Write professionally but accessibly.",
  "price": "$X.XX",
  "priceUnit": "per [unit]",
  "priceChange": "+X.X%",
  "impactScore": 75,
  "impactLevel": "high",
  "location": "California",
  "whyItHappened": [
    {
      "title": "Specific Policy or Factor Title:",
      "description": "Detailed 2-3 sentence explanation with specific data points, percentages, dates, and sources. Connect cause to effect clearly."
    },
    {
      "title": "Second Major Factor:",
      "description": "Another detailed explanation with concrete numbers and timeframes."
    },
    {
      "title": "Third Contributing Factor:",
      "description": "Third detailed explanation with specific economic or policy connections."
    }
  ],
  "chartData": [
    { "month": "Jan", "value": 4.20 },
    { "month": "Feb", "value": 4.45 },
    { "month": "Mar", "value": 4.75 },
    { "month": "Apr", "value": 5.10 },
    { "month": "May", "value": 5.40 },
    { "month": "Jun", "value": 5.65 },
    { "month": "Jul", "value": 5.90 }
  ]
}

Remember: You are writing for informed citizens who want to understand how government policies affect their daily expenses. Be thorough, specific, and analytical.`;
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
            content: "You are a senior economic journalist writing for Dekleptocracy, a policy impact tracking platform. Write comprehensive, professional articles (600-800 words) analyzing how government policies affect consumer costs. Use AP Style, include specific statistics and data points, explain economic concepts clearly, and connect policy decisions to household impacts. Always return ONLY valid JSON with no additional text or markdown."
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
      return getMockArticleData();
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
        return getMockArticleData();
      }
    }
    
    console.log(`✓ Article generated via MCP Server (${data.metadata?.tokens_used || 0} tokens)`);
    console.log(`✓ Tools used: ${data.tool_calls?.length || 0}`);
    
    return articleData;
    
  } catch (error) {
    console.error('Error calling MCP Server:', error.message);
    console.log('⚠️  Is your MCP server running? Start it with: cd mcp_server && python http_server.py');
    console.log('⚠️  Falling back to mock data...');
    return getMockArticleData();
  }
}

// Mock data fallback - high-quality example article
function getMockArticleData() {
  return {
    title: "Egg Prices Surge 28% in California, Hitting $5.90 Per Dozen",
    description: "A dozen eggs hit $5.90 in February 2025, nearly $3 higher than last year, as federal tariffs and avian flu outbreaks squeeze supply.",
    mainText: "In February 2025, the price of a dozen Grade A large eggs in California climbed to $5.90, representing a dramatic 28% increase from the previous quarter and an 87% jump compared to February 2024's $3.15 price point. For the average California household consuming approximately 18 dozen eggs annually, this translates to an additional $50 in yearly grocery expenses—a significant burden for families already grappling with broader inflation.\n\nThe surge reflects a perfect storm of supply constraints and policy-driven cost increases affecting the entire poultry industry. Nationwide, egg production has fallen by 8% since October 2024, while demand has remained steady. California, which produces approximately 6.4 billion eggs annually through its 13.5 million laying hens, has been hit particularly hard due to its stricter cage-free requirements, which increase per-unit production costs by an estimated 15-20% compared to conventional housing systems.\n\nFederal agricultural policy has played a central role in driving up costs. The 15% tariff on imported corn and soy, implemented in October 2024 as part of broader trade negotiations, has increased feed costs—which represent 60-70% of total egg production expenses—by approximately $0.12 per dozen. The USDA estimates that these tariffs have added $780 million in costs to the domestic poultry industry annually. Simultaneously, ongoing H5N1 avian influenza outbreaks have forced the depopulation of 5.2 million laying hens across 12 states, including 800,000 in California alone, according to CDC agricultural monitoring reports.\n\nGrocery retailers and food service providers are adapting to the price shock in various ways. Major chains like Safeway and Kroger have begun prominently featuring egg substitutes and plant-based alternatives, while restaurants have quietly reduced portion sizes or substituted eggs in menu items. Lower-income households have been disproportionately affected, with food bank requests for egg donations up 34% in the first quarter of 2025 compared to the same period in 2024, according to the California Association of Food Banks.\n\nIndustry analysts project that egg prices will remain elevated through at least mid-2025. The American Egg Board forecasts that prices could reach $6.20-$6.50 per dozen by April before beginning a gradual decline as new laying hens reach production age—a process that takes approximately 20-22 weeks. However, the timeline for recovery remains uncertain and highly dependent on whether additional avian flu outbreaks occur during the spring migration season. Agricultural economists at UC Davis warn that if tariffs remain in place through 2026, the baseline price for eggs may permanently reset 25-30% higher than pre-2024 levels, fundamentally changing the economics of this dietary staple for American households.",
    price: "$5.90",
    priceUnit: "per dozen",
    priceChange: "+28%",
    impactScore: 83,
    impactLevel: "high",
    location: "California",
    whyItHappened: [
      {
        title: "Federal Tariffs on Imported Grain:",
        description: "The 15% tariff imposed in October 2024 on corn and soy imports—critical components of chicken feed—increased feed costs by approximately $0.12 per dozen eggs. Feed represents 60-70% of total production costs, making this policy change the single largest driver of price increases. The USDA estimates these tariffs have added $780 million annually to domestic poultry industry costs."
      },
      {
        title: "H5N1 Avian Influenza Outbreak:",
        description: "Ongoing H5N1 outbreaks eliminated 5.2 million laying hens across 12 states in Q4 2024, reducing national egg supply by 8% according to CDC agricultural reports. California lost 800,000 laying hens, representing 6% of the state's production capacity. The depopulation and biosecurity measures have cost the industry an estimated $140 million in direct losses."
      },
      {
        title: "California Cage-Free Requirements:",
        description: "California's Proposition 12, requiring cage-free housing for all egg-laying hens, adds 15-20% to per-unit production costs compared to conventional systems. These requirements, while improving animal welfare, necessitate larger facilities, more labor, and higher mortality rates. The policy affects all eggs sold in California, regardless of origin, limiting the availability of lower-cost alternatives."
      },
      {
        title: "Rising Energy and Labor Costs:",
        description: "Electricity costs for climate-controlled poultry facilities increased by 18% in 2024, while agricultural labor costs rose 12% due to California's $16 minimum wage. These operational expense increases compound the impact of feed and disease-related challenges, with energy alone adding approximately $0.08 per dozen to production costs."
      }
    ],
    chartData: [
      { month: "Jan", value: 4.20 },
      { month: "Feb", value: 4.45 },
      { month: "Mar", value: 4.75 },
      { month: "Apr", value: 5.10 },
      { month: "May", value: 5.40 },
      { month: "Jun", value: 5.65 },
      { month: "Jul", value: 5.90 }
    ]
  };
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
  const images = {
    groceries: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=1200&h=400&fit=crop',
    fuel: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
    utilities: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&h=400&fit=crop',
    tech: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=400&fit=crop',
    housing: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=400&fit=crop',
    healthcare: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=400&fit=crop',
    education: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=400&fit=crop',
    transportation: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=400&fit=crop'
  };

  return images[category] || images.groceries;
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
    
    // Select random categories and topics
    const selectedTemplates = [];
    for (let i = 0; i < count; i++) {
      const template = articleTemplates[Math.floor(Math.random() * articleTemplates.length)];
      const topic = template.topics[Math.floor(Math.random() * template.topics.length)];
      selectedTemplates.push({ ...template, selectedTopic: topic });
    }
    
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
        const llmResponse = await callLLM(enhancedPrompt);
        
        // Create article object
        const articleData = {
          title: llmResponse.title,
          slug: llmResponse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          category: template.category,
          icon: template.icon,
          iconBg: template.iconBg,
          heroImage: selectHeroImage(template.category),
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
        
        // Save to database
        const article = new Article(articleData);
        await article.save();
        
        generatedArticles.push(article);
        console.log(`  ✅ Article saved to MongoDB: ${article.title}`);
        
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
  generateArticlePrompt
};
