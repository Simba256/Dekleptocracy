import Article from '../models/Article.js';

// Research study categories with analytical, data-driven topics
// These are deeper economic research questions, not news headlines
const researchCategories = [
  {
    category: 'groceries',
    icon: '🥚',
    iconBg: '#fef3c7',
    topics: [
      'Multi-year price elasticity analysis of staple food commodities',
      'Agricultural subsidy impact on consumer price transmission mechanisms',
      'Cross-border trade policy effects on food inflation volatility',
      'Regional price disparity drivers in grocery markets',
      'Supply chain resilience and consumer cost implications'
    ]
  },
  {
    category: 'fuel',
    icon: '⛽',
    iconBg: '#fef3c7',
    topics: [
      'Energy policy regime changes and retail fuel price dynamics',
      'Crude oil futures market transmission to consumer prices',
      'Renewable energy infrastructure investment impact on traditional fuel markets',
      'Geographic price variation determinants in fuel markets',
      'Environmental regulation compliance costs and price pass-through analysis'
    ]
  },
  {
    category: 'utilities',
    icon: '💡',
    iconBg: '#fef3c7',
    topics: [
      'Electric grid modernization investment and rate base expansion',
      'Decentralized energy generation impact on utility pricing models',
      'Water infrastructure aging and replacement cost allocation',
      'Energy efficiency mandates and consumer cost-benefit analysis',
      'Regulatory rate-setting mechanisms and consumer welfare'
    ]
  },
  {
    category: 'tech',
    icon: '📱',
    iconBg: '#fef3c7',
    topics: [
      'Semiconductor supply chain disruption propagation effects',
      'Technology sector tariff cascading impacts on consumer electronics',
      'Digital infrastructure investment public-private partnership models',
      'Consumer electronics obsolescence cycles and replacement costs',
      'Technology adoption barriers and affordability constraints'
    ]
  },
  {
    category: 'housing',
    icon: '🏠',
    iconBg: '#dbeafe',
    topics: [
      'Housing affordability index decomposition and regional factors',
      'Monetary policy transmission to mortgage rates and housing costs',
      'Rental market dynamics and tenant cost burden analysis',
      'Property tax policy variation and housing cost implications',
      'Housing supply elasticity constraints and price dynamics'
    ]
  },
  {
    category: 'healthcare',
    icon: '🏥',
    iconBg: '#fce7f3',
    topics: [
      'Pharmaceutical pricing mechanisms and consumer cost drivers',
      'Health insurance market concentration and premium determinants',
      'Medical cost inflation decomposition by service category',
      'Healthcare access disparities and financial barrier analysis',
      'Regulatory framework impacts on prescription drug affordability'
    ]
  },
  {
    category: 'education',
    icon: '📚',
    iconBg: '#d1f4dd',
    topics: [
      'Higher education cost drivers and student debt accumulation',
      'Public education funding formula impacts on household costs',
      'Textbook market structure and pricing behavior analysis',
      'Educational attainment gaps and economic mobility',
      'Education policy reform and long-term cost implications'
    ]
  },
  {
    category: 'transportation',
    icon: '🚗',
    iconBg: '#e0e7ff',
    topics: [
      'Vehicle ownership cost components and affordability trends',
      'Public transit investment returns and rider cost savings',
      'Automotive market structure and pricing power analysis',
      'Transportation infrastructure investment allocation and efficiency',
      'Electric vehicle adoption economics and consumer cost factors'
    ]
  }
];

/**
 * Generate an academic research paper-style prompt for economic analysis
 * This is fundamentally different from articles:
 * - Academic tone and structure
 * - Methodology sections
 * - Data analysis and findings
 * - Research conclusions
 * - Not news-focused, but analytical
 */
function generateResearchPrompt(category, topic, researchYear = 2024) {
  return `You are a senior economic researcher at an academic institution writing a comprehensive research report for Dekleptocracy, a policy impact tracking platform.

CRITICAL FIRST STEP - USE TOOLS TO GATHER REAL DATA:
Before writing the research report, you MUST use available tools to gather real economic data:
- Use search_web to find recent academic papers, government reports, and economic statistics
- Use get_trade_policy_news to find policy-related information
- Use get_bea_data or get_census_data for official economic statistics
- Search for research papers and institutional publications related to: ${topic}
- Gather multiple data sources, statistics, and references
- Call 2-4 tools in parallel to efficiently gather comprehensive information
- Only after gathering real data, proceed to write the research report

RESEARCH OBJECTIVE:
Generate a formal academic research report analyzing: **${topic}** in the **${category}** category.
Use the real data you gather from tools to inform your analysis and provide actual citations.

RESEARCH PAPER STRUCTURE:
This must be a complete academic research report, NOT a news article. Use formal academic language, include methodology, and provide rigorous analysis.

REQUIRED SECTIONS (in mainText - 1000-1400 words total):

1. EXECUTIVE SUMMARY (150-200 words)
   - Brief overview of research question
   - Key findings summary
   - Main conclusions

2. INTRODUCTION & RESEARCH QUESTION (150-200 words)
   - Context and background
   - Research objectives
   - Significance of study

3. METHODOLOGY & DATA SOURCES (150-200 words)
   - Data collection approach
   - Analytical methods used
   - Time period and scope
   - Limitations and considerations

4. LITERATURE REVIEW & CONTEXT (150-200 words)
   - Relevant economic theory
   - Previous research findings
   - Current policy landscape

5. DATA ANALYSIS & FINDINGS (300-400 words)
   - Statistical analysis results
   - Trend identification
   - Comparative analysis
   - Regional or demographic variations
   - Include specific data points with ranges and confidence intervals

6. ECONOMIC IMPLICATIONS (150-200 words)
   - Market mechanism explanations
   - Consumer impact analysis
   - Distributional effects
   - Economic efficiency considerations

7. POLICY ANALYSIS (150-200 words)
   - Current policy effectiveness
   - Policy alternatives
   - Regulatory considerations
   - Implementation challenges

8. CONCLUSIONS & RECOMMENDATIONS (150-200 words)
   - Summary of key findings
   - Policy recommendations
   - Areas for future research

WRITING REQUIREMENTS:
- Use formal academic tone throughout
- Include hedging language: "suggests", "indicates", "appears to", "may imply"
- Use ranges and estimates: "12-18%", "approximately $150-$170"
- Include uncertainty markers: "with confidence intervals", "estimated range", "preliminary analysis"
- Cite economic principles and concepts
- Use passive voice where appropriate for academic writing
- Include statistical language: "correlation", "trend", "variance", "elasticity"
- Reference years and time periods clearly
- NO journalistic language or news-style reporting
- NO first-person narrative

PRICE ANALYSIS REQUIREMENTS:
- "price": Representative dollar amount (e.g., "$1,820")
- "priceUnit": Specific unit (e.g., "median annual cost", "per household monthly average")
- "priceChange": Range with timeframe (e.g., "+12-17% over 2020-2024")

IMPACT SCORING:
- 0-30: Low impact (minimal economic disruption)
- 31-60: Medium impact (moderate economic effects)
- 61-85: High impact (significant economic consequences)
- 86-100: Critical impact (severe economic disruption)
- Match "impactLevel" to score range

LOCATION:
Provide geographic scope: "Nationwide Analysis", "Multi-State Regional Study (Northeast)", "Comparative State Analysis (CA, TX, NY)"

KEY FINDINGS SECTION (whyItHappened):
Provide 5-6 analytical findings, each with:
- Title: Analytical concept or factor name
- Description: Detailed explanation with data, methodology references, and economic reasoning

CHART DATA:
Provide 12-15 data points showing research data over time (quarters or years), with realistic trends that support the analysis.

REFERENCES:
Include 10-15 REAL academic, government, and research institution sources with actual URLs and citations.
Use actual research papers, government reports, and institutional publications.
Do NOT create fictional or mock sources - only reference real, verifiable sources.

OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:

{
  "title": "Academic research title (e.g., 'An Economic Analysis of [Topic]: Evidence and Policy Implications')",
  "description": "Research summary statement (180-220 characters)",
  "mainText": "Complete research report with all 8 sections (1000-1400 words), using formal academic language",
  "price": "$X,XXX",
  "priceUnit": "per [specific research unit]",
  "priceChange": "+XX-YY% over YYYY-YYYY",
  "impactScore": 0,
  "impactLevel": "low | medium | high | critical",
  "location": "Geographic research scope",
  "whyItHappened": [
    {
      "title": "Primary Economic Factor",
      "description": "Detailed analytical finding with data and economic reasoning"
    },
    {
      "title": "Structural Market Condition",
      "description": "Analysis of underlying market forces"
    },
    {
      "title": "Policy Intervention Effect",
      "description": "Research findings on policy impacts"
    },
    {
      "title": "Supply Chain Dynamic",
      "description": "Analysis of supply-side factors"
    },
    {
      "title": "Demographic Distributional Impact",
      "description": "Research on who is affected and how"
    },
    {
      "title": "Temporal Trend Factor",
      "description": "Analysis of time-based patterns and trends"
    }
  ],
  "chartData": [
    { "month": "Q1 2020", "value": 100 },
    { "month": "Q2 2020", "value": 102 },
    { "month": "Q3 2020", "value": 105 },
    { "month": "Q4 2020", "value": 108 },
    { "month": "Q1 2021", "value": 112 },
    { "month": "Q2 2021", "value": 115 },
    { "month": "Q3 2021", "value": 118 },
    { "month": "Q4 2021", "value": 122 },
    { "month": "Q1 2022", "value": 125 },
    { "month": "Q2 2022", "value": 128 },
    { "month": "Q3 2022", "value": 132 },
    { "month": "Q4 2022", "value": 135 },
    { "month": "Q1 2023", "value": 138 },
    { "month": "Q2 2023", "value": 142 },
    { "month": "Q3 2023", "value": 145 }
  ],
  "references": [
    "List 10-15 academic, government, and research institution sources"
  ]
}

CRITICAL: This is a RESEARCH REPORT, not a news article. Maintain academic rigor, include methodology, and focus on analysis rather than current events reporting.`;
}

/**
 * Call MCP Server to generate research content
 */
async function callLLM(prompt, category = 'unknown', topic = 'unknown') {
  const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';
  
  const academicSystemPrompt = `
You are an academic economic researcher writing comprehensive research reports for Dekleptocracy.

CRITICAL WORKFLOW - FOLLOW THESE STEPS:

STEP 1: GATHER REAL DATA USING TOOLS
- You MUST use available tools to gather real economic data before writing
- Use tools like: search_web, get_trade_policy_news, get_bea_data, get_census_data, etc.
- Search for recent academic papers, government reports, and economic data related to the research topic
- Gather multiple data points, statistics, and sources
- Use 2-4 tools per iteration to gather comprehensive information
- Call tools in parallel when possible for efficiency

STEP 2: SYNTHESIZE DATA INTO RESEARCH REPORT
- After gathering data from tools, synthesize it into a formal academic research report
- Use formal academic language throughout
- Include methodology, analysis, and research conclusions
- Reference the actual data and sources you gathered
- Include statistical analysis, ranges, and confidence intervals
- Use hedging language appropriate for academic research

STEP 3: OUTPUT FINAL JSON
- After gathering data and writing the report, output ONLY valid JSON matching the schema
- NO markdown, backticks, or commentary outside JSON
- The JSON must contain the complete research report

RESEARCH REQUIREMENTS:
- Write in formal academic style with methodology, analysis, and conclusions
- Include 8 sections: Executive Summary, Introduction, Methodology, Literature Review, Data Analysis, Economic Implications, Policy Analysis, Conclusions
- Use statistical and economic terminology
- Reference real research methods and data sources gathered from tools
- Include 10-15 real academic, government, and research institution sources with actual URLs
- NO journalistic language, news reporting, or current events focus
- Focus on analytical economic research based on real data

FINAL OUTPUT SCHEMA (after tool usage):
{
  "title": "Academic research title",
  "description": "Research summary",
  "mainText": "Complete research report (1000-1400 words, 8 sections)",
  "price": "string",
  "priceUnit": "string",
  "priceChange": "string",
  "impactScore": 0,
  "impactLevel": "low|medium|high|critical",
  "location": "string",
  "whyItHappened": [{"title": "string", "description": "string"}],
  "chartData": [{"month": "string", "value": 0}],
  "references": ["string with actual URLs"]
}

REMEMBER: Use tools first to gather real data, then write the research report, then output JSON.`;

  try {
    console.log(`📡 Calling MCP Server: ${MCP_SERVER_URL}/chat/intelligent/v2`);
    console.log(`   Category: ${category}`);
    console.log(`   Topic: ${topic.substring(0, 60)}...`);
    console.log(`   Prompt length: ${prompt.length} chars`);
    
    const requestBody = {
      messages: [
        {
          role: "system",
          content: [
            "You are a senior economic researcher writing academic research reports for Dekleptocracy.",
            "CRITICAL: Generate RESEARCH REPORTS, not news articles.",
            "",
            "WORKFLOW (IMPORTANT):",
            "1. FIRST: Use available tools (search_web, get_trade_policy_news, get_bea_data, etc.) to gather REAL economic data",
            "2. THEN: Synthesize the gathered data into a comprehensive research report",
            "3. FINALLY: Output the completed report as valid JSON",
            "",
            "TOOL USAGE:",
            "- You MUST use tools to gather real data before writing the report",
            "- Call 2-4 tools in parallel to gather comprehensive information efficiently",
            "- Search for academic papers, government reports, and economic statistics",
            "- Gather actual sources, data points, and references",
            "",
            "RESEARCH STYLE:",
            "- Write in formal academic style with methodology, analysis, and conclusions",
            "- Include hedging language, ranges, and statistical analysis",
            "- Maintain 1000-1400 words in mainText across 8 academic sections",
            "- Reference the real data and sources you gathered from tools",
            "- Include 10-15 real sources with actual URLs from your tool searches",
            "",
            "OUTPUT:",
            "- After gathering data and writing the report, output ONLY valid JSON",
            "- No markdown, backticks, or prose outside JSON",
            "- The JSON must contain the complete research report"
          ].join(" ")
        },
        {
          role: "user",
          content: prompt
        }
      ],
      system_prompt: academicSystemPrompt,
      use_mcp_tools: true,
      stream: false,
      max_iterations: 5,
      max_total_tools: 8,
      max_context_tokens: 16000
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
      console.error(`   Error response:`, errorText.substring(0, 500));
      throw new Error(`MCP Server request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`   ✅ Response received`);
    console.log(`   Content length: ${data.content?.length || 0} chars`);
    console.log(`   Tools called: ${data.tool_calls?.length || 0}`);
    
    const rawContent = data.content;
    const contentStr = typeof rawContent === 'string' ? rawContent.trim() : JSON.stringify(rawContent);
    
    // Parse JSON from response with multiple fallbacks
    let researchData;
    const tryParses = [
      () => JSON.parse(contentStr),
      () => {
        const cleaned = contentStr
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        return JSON.parse(cleaned);
      },
      () => {
        if (contentStr.startsWith('"') && contentStr.endsWith('"')) {
          const unquoted = JSON.parse(contentStr);
          return JSON.parse(unquoted);
        }
        throw new Error('Not a quoted JSON string');
      },
      () => {
        const cleaned = contentStr
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
        throw new Error('No JSON object found');
      }
    ];
    
    for (const attempt of tryParses) {
      try {
        researchData = attempt();
        console.log(`   ✅ JSON parsed successfully`);
        break;
      } catch (err) {
        // Continue to next attempt
      }
    }
    
    if (!researchData) {
      throw new Error(`Failed to extract valid JSON from LLM response for category='${category}' topic='${topic}'`);
    }
    
    // Validate required fields
    const requiredFields = [
      'title', 'description', 'mainText', 'price', 'priceUnit', 'priceChange',
      'impactScore', 'impactLevel', 'location', 'whyItHappened', 'chartData', 'references'
    ];
    const missingFields = requiredFields.filter(field => 
      !researchData[field] || 
      (Array.isArray(researchData[field]) && !researchData[field].length)
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid research data: missing fields ${missingFields.join(', ')}`);
    }
    
    console.log(`   ✅ All required fields present`);
    console.log(`   Title: ${researchData.title?.substring(0, 70)}...`);
    console.log(`   Word count: ~${researchData.mainText.split(' ').length} words`);
    
    return researchData;
    
  } catch (error) {
    console.error(`\n❌ ERROR calling MCP Server:`);
    console.error(`   Error: ${error.message}`);
    console.error(`\n⚠️  Is your MCP server running?`);
    console.error(`   Start it with: cd mcp_server && python http_server.py`);
    throw error;
  }
}

/**
 * Wrapper with retry logic
 */
async function callLLMWithContext(prompt, category, topic, attempt = 1) {
  try {
    return await callLLM(prompt, category, topic);
  } catch (error) {
    const isParseError = /Failed to extract valid JSON/i.test(error.message);
    if (attempt >= 2 || !isParseError) {
      console.error('LLM call failed:', error.message);
      throw error;
    }

    console.warn('⚠️  LLM returned non-JSON; retrying with stricter instructions...');
    const retryPrompt = `${prompt}

IMPORTANT RETRY INSTRUCTIONS:
- Your previous response was invalid (not JSON).
- You MUST return a single valid JSON object exactly matching the required schema.
- This is an ACADEMIC RESEARCH REPORT, not a news article.
- Use formal academic language with methodology and analysis sections.
- No markdown, no code fences, no prose outside JSON.`;

    return await callLLMWithContext(retryPrompt, category, topic, attempt + 1);
  }
}


/**
 * Select hero image for research category
 */
function selectResearchHeroImage(category) {
  const imageMap = {
    'groceries': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&h=600&fit=crop&q=80',
    'fuel': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&h=600&fit=crop&q=80',
    'utilities': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&h=600&fit=crop&q=80',
    'tech': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop&q=80',
    'housing': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop&q=80',
    'healthcare': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=600&fit=crop&q=80',
    'education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=600&fit=crop&q=80',
    'transportation': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop&q=80'
  };

  return imageMap[category] || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=600&fit=crop&q=80';
}

/**
 * Remove duplicate research reports
 */
async function removeDuplicateResearch() {
  try {
    console.log('🧹 Checking for duplicate research reports...');
    
    const allResearch = await Article.find({ contentType: 'research' }).sort({ createdAt: -1 });
    const titleMap = new Map();
    const duplicateIds = [];
    
    for (const research of allResearch) {
      const normalizedTitle = research.title.trim().toLowerCase();
      
      if (titleMap.has(normalizedTitle)) {
        duplicateIds.push(research._id);
        console.log(`   ❌ Found duplicate: "${research.title}"`);
      } else {
        titleMap.set(normalizedTitle, research._id);
      }
    }
    
    if (duplicateIds.length > 0) {
      const result = await Article.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`🧹 Removed ${result.deletedCount} duplicate research reports`);
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

/**
 * Main function to generate research reports
 */
async function generateResearch(count = 5) {
  const generatedResearch = [];
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔬 RESEARCH REPORT GENERATION STARTED`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📊 Target count: ${count} research reports`);
    console.log(`📡 MCP Server: ${process.env.MCP_SERVER_URL || 'http://localhost:8000'}`);
    console.log(`⏰ Time: ${new Date().toLocaleString()}`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Clean up duplicates
    await removeDuplicateResearch();
    
    // Select research topics
    const selectedTopics = [];
    const usedCombinations = new Set();
    const shuffledCategories = [...researchCategories].sort(() => Math.random() - 0.5);
    
    for (const category of shuffledCategories) {
      if (selectedTopics.length >= count) break;
      
      const topic = category.topics[Math.floor(Math.random() * category.topics.length)];
      const combination = `${category.category}-${topic}`;
      
      if (!usedCombinations.has(combination)) {
        usedCombinations.add(combination);
        selectedTopics.push({ ...category, selectedTopic: topic });
      }
    }
    
    // Fill remaining slots if needed
    while (selectedTopics.length < count && usedCombinations.size < researchCategories.length * 5) {
      const category = researchCategories[Math.floor(Math.random() * researchCategories.length)];
      const topic = category.topics[Math.floor(Math.random() * category.topics.length)];
      const combination = `${category.category}-${topic}`;
      
      if (!usedCombinations.has(combination)) {
        usedCombinations.add(combination);
        selectedTopics.push({ ...category, selectedTopic: topic });
      }
    }
    
    console.log(`📋 Selected ${selectedTopics.length} research topics:`);
    selectedTopics.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.category} - ${t.selectedTopic.substring(0, 70)}...`);
    });
    console.log('');
    
    // Generate each research report
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < selectedTopics.length; i++) {
      const topic = selectedTopics[i];
      try {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📊 [${i + 1}/${selectedTopics.length}] Generating Research: ${topic.category}`);
        console.log(`   Topic: ${topic.selectedTopic}`);
        console.log(`${'─'.repeat(80)}`);
        
        // Create research prompt
        const researchYear = new Date().getFullYear();
        const prompt = generateResearchPrompt(topic.category, topic.selectedTopic, researchYear);
        console.log(`📝 Research prompt created (${prompt.length} chars)`);
        
        // Call LLM to generate research
        console.log('🤖 Calling MCP server for research generation...');
        const llmResponse = await callLLMWithContext(prompt, topic.category, topic.selectedTopic);
        console.log('✅ Research content generated');
        
        // Create unique title with research identifier
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
        const uniqueTitle = `${llmResponse.title} (${dateStr})`;
        
        // Generate slug
        let baseSlug = uniqueTitle.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 100);
        
        let slug = baseSlug;
        let slugExists = await Article.findOne({ slug });
        let slugCounter = 1;
        
        while (slugExists) {
          slug = `${baseSlug}-${slugCounter}`;
          slugExists = await Article.findOne({ slug });
          slugCounter++;
          
          if (slugCounter > 10) {
            console.log(`  ❌ Too many duplicates for slug, skipping...`);
            failCount++;
            break;
          }
        }
        
        if (slugCounter > 10) continue;
        
        console.log(`✅ Slug: ${slug}`);
        
        // Get hero image
        const heroImage = selectResearchHeroImage(topic.category);
        
        // Build research data object
        const researchData = {
          title: uniqueTitle,
          slug: slug,
          contentType: 'research',
          category: topic.category,
          icon: topic.icon,
          iconBg: topic.iconBg,
          heroImage: heroImage,
          description: llmResponse.description,
          mainText: llmResponse.mainText,
          price: llmResponse.price,
          priceUnit: llmResponse.priceUnit,
          priceChange: llmResponse.priceChange,
          impactScore: llmResponse.impactScore,
          impactLevel: llmResponse.impactLevel,
          location: llmResponse.location || 'Nationwide Analysis',
          whyItHappened: llmResponse.whyItHappened,
          chartData: llmResponse.chartData,
          references: llmResponse.references,
          sources: [], // No mock sources - only use real references from LLM
          tags: [topic.category, 'research', 'economic-analysis', 'academic-study', 'policy-research'],
          generatedBy: 'llm',
          llmModel: 'mcp-server-academic-research',
          status: 'published',
          publishedAt: new Date()
        };
        
        // Save to database
        console.log('💾 Saving research report to database...');
        const research = new Article(researchData);
        await research.save();
        generatedResearch.push(research);
        successCount++;
        
        console.log(`\n✅ SUCCESS: Research report created`);
        console.log(`   Title: ${research.title.substring(0, 70)}...`);
        console.log(`   Category: ${research.category}`);
        console.log(`   Type: ${research.contentType}`);
        console.log(`   Impact: ${research.impactLevel} (${research.impactScore}/100)`);
        console.log(`   Word count: ~${research.mainText.split(' ').length} words`);
        console.log(`   References: ${research.references?.length || 0}`);
        console.log(`   Chart data points: ${research.chartData.length}`);
        
      } catch (error) {
        failCount++;
        console.error(`\n❌ GENERATION ERROR:`);
        console.error(`   Category: ${topic.category}`);
        console.error(`   Topic: ${topic.selectedTopic}`);
        console.error(`   Error: ${error.message}`);
        if (error.stack) {
          console.error(`   Stack: ${error.stack.substring(0, 500)}...`);
        }
      }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESEARCH GENERATION COMPLETE`);
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Successfully generated: ${successCount}/${selectedTopics.length} reports`);
    console.log(`❌ Failed: ${failCount}/${selectedTopics.length} reports`);
    console.log(`📝 Total saved: ${generatedResearch.length}`);
    
    if (generatedResearch.length > 0) {
      console.log(`\n📋 Generated Research Reports:`);
      generatedResearch.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title.substring(0, 70)}...`);
      });
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

