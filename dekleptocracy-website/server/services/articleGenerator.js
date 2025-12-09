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
  return `Generate a detailed article about ${topic} in the ${category} category for our policy impact tracking website "Dekleptocracy".

Requirements:
1. Title: Create an engaging, newsworthy title (max 80 characters)
2. Description: Write a one-line summary (max 150 characters)
3. Main Text: Write 2-3 paragraphs explaining the current situation and its impact on households
4. Price Information: Provide specific price data with change percentage
5. Impact Score: Rate the impact on household budgets (0-100)
6. Why It Happened: List 3 reasons with titles and detailed descriptions explaining the causes
7. Chart Data: Provide 7 months of price trend data (January to July 2025)
8. Location: Specify if it's nationwide or state-specific

Use these verified sources for data:
${sources.map((s, i) => `${i + 1}. ${s.title} - ${s.url}`).join('\n')}

Return the response in JSON format with this exact structure:
{
  "title": "Article title here",
  "description": "One-line summary",
  "mainText": "Full article text with 2-3 paragraphs",
  "price": "$X.XX or +X%",
  "priceUnit": "per unit or timeframe",
  "priceChange": "+X.X%",
  "impactScore": 75,
  "impactLevel": "high",
  "location": "California or Nationwide",
  "whyItHappened": [
    {
      "title": "Reason Title:",
      "description": "Detailed explanation of this reason"
    }
  ],
  "chartData": [
    { "month": "Jan", "value": 100 },
    ...
  ]
}

Important: Make the article factual, data-driven, and focused on how policy decisions impact consumer costs. Include specific numbers and percentages.`;
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
            content: "You are a data journalist specializing in economic policy and consumer price impacts. Generate factual, data-driven articles with specific numbers and citations. Always return valid JSON in your response."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        use_mcp_tools: true,
        stream: false,
        max_iterations: 5,
        max_total_tools: 8
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

// Mock data fallback
function getMockArticleData() {
  return {
    title: "Egg Prices Surge 28% in California",
    description: "A dozen eggs hit $5.90 in February 2025, nearly $3 higher than last year.",
    mainText: "In February 2025, the price of a dozen eggs in California climbed to $5.90, almost double last year's price. Families are now paying nearly $25 more per month just for eggs, a staple in most households. This surge represents a 28% increase from the previous quarter and has become one of the most visible signs of grocery inflation affecting American consumers.",
    price: "$5.90",
    priceUnit: "per dozen",
    priceChange: "+28%",
    impactScore: 83,
    impactLevel: "high",
    location: "California",
    whyItHappened: [
      {
        title: "Feed Tariffs:",
        description: "New tariffs on imported grains like corn and soy — critical for chicken feed — increased production costs by approximately 15%."
      },
      {
        title: "Avian Flu Outbreak:",
        description: "Ongoing outbreaks of avian flu reduced poultry supply nationwide, eliminating over 5 million laying hens from production."
      },
      {
        title: "Rising Energy Costs:",
        description: "Increased electricity and heating costs for chicken farms added to overall production expenses."
      }
    ],
    chartData: [
      { month: "Jan", value: 3.2 },
      { month: "Feb", value: 3.5 },
      { month: "Mar", value: 3.8 },
      { month: "Apr", value: 4.2 },
      { month: "May", value: 4.8 },
      { month: "Jun", value: 5.4 },
      { month: "Jul", value: 5.9 }
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
