import Article from '../models/Article.js';

// Research templates with categories and topics
const researchTemplates = [
  {
    category: 'groceries',
    icon: '🥚',
    iconBg: '#fef3c7',
    topics: [
      'food supply chain impact analysis',
      'agricultural policy effects on consumer prices',
      'comparative grocery inflation study',
      'food security and pricing trends',
      'tariff impact on food imports'
    ]
  },
  {
    category: 'fuel',
    icon: '⛽',
    iconBg: '#fef3c7',
    topics: [
      'energy policy impact on fuel markets',
      'crude oil price transmission analysis',
      'renewable energy transition costs',
      'transportation fuel price elasticity',
      'regional fuel price disparities'
    ]
  },
  {
    category: 'utilities',
    icon: '💡',
    iconBg: '#fef3c7',
    topics: [
      'electricity grid modernization economics',
      'utility rate structure analysis',
      'renewable energy integration costs',
      'water infrastructure investment impact',
      'energy efficiency program outcomes'
    ]
  },
  {
    category: 'tech',
    icon: '📱',
    iconBg: '#fef3c7',
    topics: [
      'semiconductor supply chain analysis',
      'tech sector tariff impact study',
      'consumer electronics pricing trends',
      'digital infrastructure investment',
      'technology adoption cost analysis'
    ]
  },
  {
    category: 'housing',
    icon: '🏠',
    iconBg: '#dbeafe',
    topics: [
      'housing affordability crisis analysis',
      'mortgage rate impact study',
      'rental market dynamics research',
      'property tax policy effects',
      'housing supply constraints study'
    ]
  },
  {
    category: 'healthcare',
    icon: '🏥',
    iconBg: '#fce7f3',
    topics: [
      'prescription drug pricing analysis',
      'health insurance market trends',
      'medical cost inflation study',
      'healthcare access and affordability',
      'pharmaceutical policy impact'
    ]
  },
  {
    category: 'education',
    icon: '📚',
    iconBg: '#d1f4dd',
    topics: [
      'higher education cost trends',
      'student debt burden analysis',
      'education funding policy impact',
      'textbook market economics',
      'educational inequality study'
    ]
  },
  {
    category: 'transportation',
    icon: '🚗',
    iconBg: '#e0e7ff',
    topics: [
      'vehicle affordability analysis',
      'public transit investment impact',
      'automotive market trends',
      'transportation infrastructure costs',
      'electric vehicle adoption economics'
    ]
  }
];

// Research prompt template - more academic and data-focused
const generateResearchPrompt = (category, topic, sources) => {
  return `You are a senior economic researcher writing an in-depth research report for "Dekleptocracy," a policy impact tracking platform. Generate a comprehensive, data-driven research report about ${topic} in the ${category} category.

RESEARCH WRITING REQUIREMENTS:
- Use formal, academic tone with clear, authoritative language
- Include extensive data analysis with specific statistics and figures
- Provide multiple data points from different time periods for trend analysis
- Include comparative analysis across regions, demographics, or time periods
- Use hedging language appropriately ("data suggests", "analysis indicates", "studies show")
- Present both quantitative and qualitative findings
- Include methodological considerations where relevant

RESEARCH REPORT STRUCTURE:

1. **Title** (70-90 characters)
   - Academic and specific
   - Include key finding and scope
   - Example: "Housing Affordability Crisis: A 5-Year Analysis of Rent Burden Across 50 Cities"

2. **Executive Summary** (150-180 characters)
   - Concise overview of key findings
   - Include primary statistic and significance
   - Example: "Analysis of rental data from 2019-2024 reveals a 35% increase in median rents, with low-income households now spending over 50% of income on housing."

3. **Main Research Content** (8-12 comprehensive sections, 1200-1800 words total)
   
   **Introduction & Background (2 paragraphs)**
   - Research context and significance
   - Current state of the issue with baseline data
   - Research questions or hypotheses
   
   **Methodology & Data Sources (1-2 paragraphs)**
   - Brief overview of data sources used
   - Time period analyzed
   - Geographic or demographic scope
   - Key metrics and measurements
   
   **Key Findings (3-4 paragraphs)**
   - Primary findings with specific data points
   - Statistical trends with percentage changes
   - Comparative analysis (year-over-year, region-by-region, etc.)
   - Break down findings by relevant categories
   - Include ranges and confidence intervals where appropriate
   
   **Economic Analysis (2-3 paragraphs)**
   - Economic factors driving the trends
   - Policy impacts and regulatory changes
   - Market dynamics and supply/demand analysis
   - Connection to broader economic indicators
   
   **Demographic Impact Analysis (2 paragraphs)**
   - How different income brackets are affected
   - Geographic variations and regional disparities
   - Specific populations most impacted
   - Distributional effects
   
   **Policy Implications (2 paragraphs)**
   - Current policies affecting the issue
   - Policy changes and their timeline
   - Government and institutional responses
   - Regulatory framework impact
   
   **Future Projections & Trends (1-2 paragraphs)**
   - Data-based projections for next 6-12 months
   - Expected market corrections or continued trends
   - Scenario analysis (best case, base case, worst case)
   - Leading indicators to monitor
   
   **Conclusion & Recommendations (1-2 paragraphs)**
   - Summary of key findings
   - Research limitations and caveats
   - Areas for further study
   - Policy recommendations or implications

4. **Price Information**
   - Current price: Exact dollar amount with context (e.g., "$1,850")
   - Price unit: Specific measurement (e.g., "median monthly rent", "per unit", "annual average")
   - Price change: Detailed change with timeframe (e.g., "+35% from 2019-2024, with accelerated growth of +18% in 2023-2024 alone")

5. **Impact Score** (0-100 scale)
   - 0-30: Low impact (minimal economic burden)
   - 31-60: Medium impact (noticeable household budget pressure)
   - 61-85: High impact (significant financial strain)
   - 86-100: Critical impact (severe economic hardship)
   - Impact level: "low", "medium", "high", or "critical"

6. **Key Research Findings** (4-5 detailed findings)
   - Each finding should be data-driven and specific
   - Use academic language and proper citations to data sources
   - Include statistical measures where appropriate
   - Good examples:
     * "Longitudinal Analysis: Tracking 2019-2024 data reveals rent increases outpaced wage growth by 12 percentage points, with regional variation ranging from 8-18 points across metro areas."
     * "Income Quintile Impact: Bottom quintile households now allocate 52-58% of pre-tax income to rent (up from 38-42% in 2019), compared to 18-22% for top quintile (up from 15-18%)."
     * "Supply-Side Factors: Housing starts declined 15-20% below demographic demand, with zoning restrictions cited in 68% of surveyed municipalities as primary constraint."
     * "Policy Impact Analysis: Markets with rent control showed 8-12% slower price growth but 15-20% reduced new construction, suggesting trade-offs in affordability interventions."
   - Avoid examples like:
     * "Prices went up by exactly $1.47" (overly precise without verification)
     * "Exactly 2.3 million households affected" (unverified specific numbers)

7. **Data Tables & Figures** (10-14 data points across multiple dimensions)
   - Provide comprehensive time-series data
   - Show year-over-year or quarter-over-quarter progression
   - Include multiple metrics when relevant (e.g., median, mean, percentiles)
   - Values should show realistic trends with variability
   - Format: [
       { "month": "Jan 2023", "value": 98.5 }, 
       { "month": "Apr 2023", "value": 101.2 }, 
       { "month": "Jul 2023", "value": 103.8 },
       { "month": "Oct 2023", "value": 106.4 },
       { "month": "Jan 2024", "value": 109.1 },
       { "month": "Apr 2024", "value": 112.3 },
       { "month": "Jul 2024", "value": 115.7 },
       { "month": "Oct 2024", "value": 118.9 },
       { "month": "Dec 2024", "value": 121.5 }
     ]

8. **Location**
   - Specify geographic scope precisely: "Multi-state Analysis (CA, NY, TX, FL)", "Nationwide Study", "Northeast Regional Analysis", etc.
   - Explain geographic focus and why these regions are studied

9. **References & Data Sources** (8-15 sources)
   - Include academic papers, government reports, industry studies
   - Provide specific report titles and publication dates
   - Mix of data sources: federal agencies, research institutions, industry associations
   - Use the provided sources plus typical academic/government sources

Use these verified data sources as primary references:
${sources.map((s, i) => `${i + 1}. ${s.title} - ${s.url}`).join('\n')}

CRITICAL REQUIREMENTS FOR CREDIBLE RESEARCH:
✓ Use EXTENSIVE DATA: Multiple data points, time series, cross-sectional comparisons
✓ Include STATISTICAL MEASURES: Percentages, ranges, confidence intervals, standard deviations
✓ Provide PROPER CONTEXT: Compare to historical baselines, other regions, inflation rates
✓ Use HEDGING LANGUAGE: "data suggests", "analysis indicates", "studies show", "research finds"
✓ Present RANGES not exact numbers: "15-20%" not "17.3%", "approximately $50-55" not "$52.17"
✓ Include METHODOLOGICAL TRANSPARENCY: Mention data sources, time periods, sample sizes
✓ Show TREND ANALYSIS: Year-over-year, quarter-over-quarter, multi-year comparisons
✓ Acknowledge UNCERTAINTY: "preliminary data", "subject to revision", "estimates vary"
✓ Be COMPREHENSIVE: Cover multiple dimensions (temporal, geographic, demographic)
✓ Maintain ACADEMIC RIGOR: Formal tone, precise language, evidence-based claims

Return ONLY valid JSON with this exact structure (no additional text):
{
  "title": "Formal, academic title with specific scope and timeframe",
  "description": "Executive summary with key finding and statistical significance (150-180 chars)",
  "mainText": "Eight to twelve comprehensive sections totaling 1200-1800 words. Use formal academic tone. Include: Introduction & Background, Methodology & Data Sources, Key Findings (with extensive statistics), Economic Analysis, Demographic Impact Analysis, Policy Implications, Future Projections & Trends, Conclusion & Recommendations. Use hedging language ('data suggests', 'analysis indicates'), provide ranges ('15-20%'), include multiple data points from different time periods, show comparative analysis, acknowledge uncertainty, and maintain academic rigor throughout.",
  "price": "$X,XXX",
  "priceUnit": "per [specific unit]",
  "priceChange": "+XX% from YYYY-YYYY, with detailed breakdown of recent trends",
  "impactScore": 75,
  "impactLevel": "high",
  "location": "Multi-state Analysis (CA, NY, TX) / Nationwide Study / Regional Analysis",
  "whyItHappened": [
    {
      "title": "Primary Research Finding:",
      "description": "Detailed finding with specific data ranges and statistical measures. Example: 'Longitudinal analysis of 2019-2024 data reveals price increases of 15-20% in 75% of surveyed markets, with regional variation of 8-25%. Statistical analysis (p<0.05) indicates significant correlation with supply constraints.'"
    },
    {
      "title": "Secondary Economic Factor:",
      "description": "Another research finding with comparative analysis and proper hedging. Include cross-sectional or time-series data."
    },
    {
      "title": "Policy Impact Analysis:",
      "description": "Finding related to policy effects with before/after comparison or treatment/control analysis."
    },
    {
      "title": "Demographic Disparities:",
      "description": "Finding showing differential impacts across populations with specific percentages or ranges."
    },
    {
      "title": "Market Dynamics Finding:",
      "description": "Additional finding related to supply/demand, market structure, or competitive dynamics with supporting data."
    }
  ],
  "chartData": [
    { "month": "Jan 2023", "value": 100 },
    { "month": "Apr 2023", "value": 103 },
    { "month": "Jul 2023", "value": 106 },
    { "month": "Oct 2023", "value": 109 },
    { "month": "Jan 2024", "value": 112 },
    { "month": "Apr 2024", "value": 116 },
    { "month": "Jul 2024", "value": 119 },
    { "month": "Oct 2024", "value": 123 },
    { "month": "Dec 2024", "value": 126 }
  ]
}

Remember: Write COMPREHENSIVE, DATA-DRIVEN research reports. Use extensive statistics, multiple data points, comparative analysis, and proper academic language. Include ranges, acknowledge uncertainty, and provide thorough analysis across multiple dimensions. Your goal is academic credibility and research rigor, not journalism or simplification.`;
};

// Call MCP Server to generate research
async function callLLM(prompt) {
  const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';
  
  try {
    console.log(`📡 Calling MCP Server: ${MCP_SERVER_URL}/chat/intelligent/v2`);
    console.log(`   Prompt length: ${prompt.length} chars`);
    
    const requestBody = {
      messages: [
        {
          role: "system",
          content: "You are a senior economic researcher writing comprehensive, data-driven research reports for Dekleptocracy. CRITICAL: Use formal academic tone, extensive data with ranges and statistics, multiple data points across time periods and regions, proper hedging language ('data suggests', 'analysis indicates', 'studies show'), comparative analysis, methodological transparency, and acknowledge uncertainty. Write 1200-1800 words with 8-12 sections covering introduction, methodology, key findings, economic analysis, demographic impact, policy implications, projections, and conclusions. Always return ONLY valid JSON with no additional text or markdown."
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
      max_context_tokens: 12000
    };
    
    console.log(`   Request config:`, JSON.stringify({
      use_mcp_tools: requestBody.use_mcp_tools,
      max_iterations: requestBody.max_iterations,
      max_total_tools: requestBody.max_total_tools,
      max_context_tokens: requestBody.max_context_tokens
    }));
    
    const response = await fetch(`${MCP_SERVER_URL}/chat/intelligent/v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`   Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ MCP Server error: ${response.status} ${response.statusText}`);
      console.error(`   Error response:`, errorText);
      throw new Error(`MCP Server request failed: ${response.status} ${response.statusText}`);
    }
    
    console.log(`   ✅ Response received, parsing JSON...`);
    const data = await response.json();
    console.log(`   Response keys:`, Object.keys(data));
    console.log(`   Content length: ${data.content?.length || 0} chars`);
    console.log(`   Tokens used: ${data.metadata?.tokens_used || 'unknown'}`);
    console.log(`   Tools called: ${data.tool_calls?.length || 0}`);
    const content = data.content;
    console.log(`   Content preview: ${content.substring(0, 200)}...`);
    
    // Parse JSON from response
    console.log(`   Parsing JSON from content...`);
    let researchData;
    try {
      researchData = JSON.parse(content);
      console.log(`   ✅ JSON parsed successfully`);
      console.log(`   Research title: ${researchData.title?.substring(0, 60)}...`);
    } catch (e) {
      console.log(`   ⚠️  Direct JSON parse failed, trying to extract JSON...`);
      console.log(`   Error: ${e.message}`);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log(`   Found JSON in content, attempting to parse...`);
        researchData = JSON.parse(jsonMatch[0]);
        console.log(`   ✅ JSON extracted and parsed successfully`);
      } else {
        console.error(`   ❌ Could not find JSON in MCP response`);
        console.error(`   Content:`, content.substring(0, 500));
        throw new Error('Invalid JSON from MCP server - no JSON found in response');
      }
    }
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'mainText', 'price', 'priceUnit', 'priceChange', 
                           'impactScore', 'impactLevel', 'whyItHappened', 'chartData'];
    const missingFields = requiredFields.filter(field => !researchData[field]);
    
    if (missingFields.length > 0) {
      console.error(`   ❌ Missing required fields:`, missingFields);
      throw new Error(`Invalid research data: missing fields ${missingFields.join(', ')}`);
    }
    
    console.log(`   ✅ All required fields present`);
    console.log(`✓ Research generated successfully`);
    
    return researchData;
    
  } catch (error) {
    console.error(`\n❌ ERROR calling MCP Server:`);
    console.error(`   Error type: ${error.constructor.name}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack:`, error.stack);
    console.error(`\n⚠️  Is your MCP server running?`);
    console.error(`   Start it with: cd mcp_server && python http_server.py`);
    console.error(`   Or: python mcp_server/http_server.py`);
    throw error;
  }
}

// Wrapper to pass category/topic context to LLM
async function callLLMWithContext(prompt, category, topic) {
  try {
    return await callLLM(prompt);
  } catch (error) {
    console.error('LLM call failed:', error.message);
    throw error;
  }
}

// Generate mock sources for research
function generateMockSources(category, topic) {
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - Math.floor(Math.random() * 6));

  return [
    {
      title: `Bureau of Economic Analysis - ${category} Price Index Report`,
      url: 'https://www.bea.gov',
      publishedDate: baseDate
    },
    {
      title: `Federal Reserve Economic Data - ${topic} Analysis`,
      url: 'https://fred.stlouisfed.org',
      publishedDate: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      title: `U.S. Census Bureau - Consumer Expenditure Survey`,
      url: 'https://www.census.gov',
      publishedDate: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000)
    },
    {
      title: `Congressional Research Service - ${category.charAt(0).toUpperCase() + category.slice(1)} Policy Brief`,
      url: 'https://crsreports.congress.gov',
      publishedDate: new Date(baseDate.getTime() - 45 * 24 * 60 * 60 * 1000)
    },
    {
      title: `National Bureau of Economic Research - Working Paper on ${topic}`,
      url: 'https://www.nber.org',
      publishedDate: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000)
    },
    {
      title: `Brookings Institution - ${category.charAt(0).toUpperCase() + category.slice(1)} Market Analysis`,
      url: 'https://www.brookings.edu',
      publishedDate: new Date(baseDate.getTime() - 75 * 24 * 60 * 60 * 1000)
    },
    {
      title: `Government Accountability Office - ${topic} Impact Study`,
      url: 'https://www.gao.gov',
      publishedDate: new Date(baseDate.getTime() - 120 * 24 * 60 * 60 * 1000)
    }
  ];
}

// Select hero image based on category
function selectHeroImage(category) {
  const imageMap = {
    'groceries': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=600&fit=crop&q=80',
    'fuel': 'https://images.unsplash.com/photo-1545262810-77515befe149?w=1200&h=600&fit=crop&q=80',
    'utilities': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&h=600&fit=crop&q=80',
    'tech': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=600&fit=crop&q=80',
    'housing': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop&q=80',
    'healthcare': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop&q=80',
    'education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop&q=80',
    'transportation': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&h=600&fit=crop&q=80'
  };

  return imageMap[category] || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&h=600&fit=crop&q=80';
}

// Clean up duplicate articles by title
async function removeDuplicateArticles() {
  try {
    console.log('🧹 Checking for duplicate articles by title...');
    
    const allArticles = await Article.find({}).sort({ createdAt: -1 });
    const titleMap = new Map();
    const duplicateIds = [];
    
    for (const article of allArticles) {
      const normalizedTitle = article.title.trim().toLowerCase();
      
      if (titleMap.has(normalizedTitle)) {
        duplicateIds.push(article._id);
        console.log(`   ❌ Found duplicate: "${article.title}" (${article.slug})`);
      } else {
        titleMap.set(normalizedTitle, article._id);
      }
    }
    
    if (duplicateIds.length > 0) {
      const result = await Article.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`🧹 Removed ${result.deletedCount} duplicate articles (${titleMap.size} unique remain)`);
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

// Main function to generate research reports
async function generateResearch(count = 5) {
  const generatedResearch = [];
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔬 RESEARCH GENERATION STARTED`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📊 Target count: ${count} reports`);
    console.log(`📡 MCP Server: ${process.env.MCP_SERVER_URL || 'http://localhost:8000'}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Clean up any existing duplicates first
    console.log('🧹 Cleaning up duplicates...');
    const duplicatesRemoved = await removeDuplicateArticles();
    console.log(`✅ Duplicates cleanup complete (${duplicatesRemoved} removed)\n`);
    
    // Select random categories and topics
    const selectedTemplates = [];
    const usedCombinations = new Set();
    
    // Shuffle templates
    const shuffledTemplates = [...researchTemplates].sort(() => Math.random() - 0.5);
    
    for (const template of shuffledTemplates) {
      if (selectedTemplates.length >= count) break;
      
      const topic = template.topics[Math.floor(Math.random() * template.topics.length)];
      const combination = `${template.category}-${topic}`;
      
      if (!usedCombinations.has(combination)) {
        usedCombinations.add(combination);
        selectedTemplates.push({ ...template, selectedTopic: topic });
      }
    }
    
    console.log(`📋 Selected ${selectedTemplates.length} research topics:`);
    selectedTemplates.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.category} - ${t.selectedTopic}`);
    });
    console.log('');
    
    // Generate each research report
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < selectedTemplates.length; i++) {
      const template = selectedTemplates[i];
      try {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📊 [${i + 1}/${selectedTemplates.length}] Generating: ${template.category} - ${template.selectedTopic}`);
        console.log(`${'─'.repeat(80)}`);
        
        // Generate mock sources
        console.log('📚 Generating mock sources...');
        const sources = generateMockSources(template.category, template.selectedTopic);
        console.log(`✅ Generated ${sources.length} sources`);
        
        // Create research prompt
        console.log('📝 Creating research prompt...');
        const enhancedPrompt = generateResearchPrompt(template.category, template.selectedTopic, sources);
        console.log(`✅ Prompt created (${enhancedPrompt.length} chars)`);
        
        // Call MCP server to generate research content
        console.log('🤖 Calling MCP server for content generation...');
        const llmResponse = await callLLMWithContext(enhancedPrompt, template.category, template.selectedTopic);
        console.log('✅ LLM response received');
        console.log(`   Title: ${llmResponse.title?.substring(0, 60)}...`);
        console.log(`   Description length: ${llmResponse.description?.length || 0} chars`);
        console.log(`   Main text length: ${llmResponse.mainText?.length || 0} chars`);
        
        // Add date to title to make it unique
        console.log('📅 Adding date to title...');
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const uniqueTitle = `${llmResponse.title} - ${dateStr}`;
        console.log(`✅ Unique title: ${uniqueTitle.substring(0, 80)}...`);
        
        // Create slug from title
        console.log('🔗 Generating slug...');
        let baseSlug = uniqueTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        console.log(`   Base slug: ${baseSlug.substring(0, 60)}...`);
        
        // Check if research with same slug already exists
        let slug = baseSlug;
        let slugExists = await Article.findOne({ slug });
        let slugCounter = 1;
        
        while (slugExists) {
          console.log(`   ⚠️  Slug "${slug}" exists, trying counter ${slugCounter}...`);
          slug = `${baseSlug}-${slugCounter}`;
          slugExists = await Article.findOne({ slug });
          slugCounter++;
          
          if (slugCounter > 10) {
            console.log(`  ❌ Too many duplicates for slug "${baseSlug}", skipping...`);
            failCount++;
            break;
          }
        }
        
        if (slugCounter > 10) {
          continue;
        }
        
        console.log(`✅ Final slug: ${slug}`);
        
        // Get hero image
        console.log('🖼️  Selecting hero image...');
        const heroImage = selectHeroImage(template.category);
        console.log(`✅ Hero image: ${heroImage.substring(0, 60)}...`);
        
        console.log('📦 Building research data object...');
        const researchData = {
          title: uniqueTitle,
          slug: slug,
          contentType: 'research',
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
          tags: [template.category, template.selectedTopic, 'research', 'data-analysis'],
          generatedBy: 'llm',
          llmModel: 'mcp-server-gpt4-research',
          status: 'published',
          publishedAt: new Date()
        };
        
        // Save to database
        console.log('💾 Saving to database...');
        try {
          const research = new Article(researchData);
          console.log('   Creating Article document...');
          await research.save();
          console.log('   ✅ Saved to MongoDB');
          generatedResearch.push(research);
          successCount++;
          
          console.log(`\n✅ SUCCESS: Research report created`);
          console.log(`   Title: ${research.title.substring(0, 70)}...`);
          console.log(`   Slug: ${research.slug}`);
          console.log(`   Category: ${research.category}`);
          console.log(`   Type: ${research.contentType}`);
          console.log(`   Impact: ${research.impactLevel} (${research.impactScore}/100)`);
          console.log(`   Word count: ~${research.mainText.split(' ').length} words`);
          console.log(`   Sources: ${research.sources.length}`);
          console.log(`   Chart data points: ${research.chartData.length}`);
          
        } catch (saveError) {
          failCount++;
          if (saveError.code === 11000) {
            console.log(`\n❌ DUPLICATE ERROR: Slug already exists`);
            console.log(`   Title: ${llmResponse.title}`);
            console.log(`   Slug: ${slug}`);
          } else {
            console.error(`\n❌ DATABASE ERROR:`, saveError.message);
            console.error(`   Full error:`, saveError);
          }
        }
        
      } catch (error) {
        failCount++;
        console.error(`\n❌ GENERATION ERROR for ${template.category}:`);
        console.error(`   Topic: ${template.selectedTopic}`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack:`, error.stack);
      }
    }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESEARCH GENERATION COMPLETE`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Successfully generated: ${successCount}/${selectedTemplates.length} reports`);
    console.log(`❌ Failed: ${failCount}/${selectedTemplates.length} reports`);
    console.log(`📝 Total saved to database: ${generatedResearch.length}`);
    
    if (generatedResearch.length > 0) {
      console.log(`\n📋 Generated Research Reports:`);
      generatedResearch.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title.substring(0, 70)}...`);
        console.log(`      Category: ${r.category}, Slug: ${r.slug}`);
      });
    } else {
      console.log(`\n⚠️  WARNING: No research reports were saved to database!`);
    }
    
    console.log(`${'='.repeat(80)}\n`);
    return generatedResearch;
    
  } catch (error) {
    console.error(`\n${'='.repeat(80)}`);
    console.error('❌ FATAL ERROR in research generation');
    console.error(`${'='.repeat(80)}`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error(`${'='.repeat(80)}\n`);
    throw error;
  }
}

export {
  generateResearch
};

