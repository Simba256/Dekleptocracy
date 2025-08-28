#!/usr/bin/env python3
"""
Interactive Gemini + MCP tools runner: asks for your question, calls relevant tools from
tariff_server, and synthesizes an answer using Gemini.
"""

import json
import google.generativeai as genai

# Import MCP tools directly from the server module (no extra client needed)
from tariff_server import (
    get_trade_news,
    analyze_trade_news_sentiment,
    comprehensive_trade_analysis,
    search_federal_register,
    lookup_tariff_rate,
    search_usitc_trade_data,
    analyze_gdp_by_industry,
    get_census_trade_data,
    translate_commodity_codes,
)

# Configure Gemini
GEMINI_API_KEY = "AIzaSyD1tu-eIUXRjEVBBtC3GdnC--HzWe1Mxvc"
genai.configure(api_key=GEMINI_API_KEY)

def test_gemini_connection():
    """Test Gemini API connection and list a few models."""
    print("🔍 Testing Gemini API Connection...")
    print("=" * 50)
    try:
        # Try common model names in order
        model_names = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'models/gemini-1.5-flash',
        ]
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content("Hello from MCP toolchain test")
                print(f"✅ Gemini reachable with model: {model_name}")
                return model_name
            except Exception as e:
                print(f"❌ {model_name} failed: {e}")
        return None
    except Exception as e:
        print(f"❌ API Connection Failed: {e}")
        return None

def extract_params_from_question(q: str):
    import re
    question = q or ""
    
    # Enhanced HTS code detection - including automotive codes
    hts_match = re.search(r"(\d[\d\.\s]{6,12}\d)", question)
    hts_code = None
    if hts_match:
        hts_code = re.sub(r"[^0-9]", "", hts_match.group(1))
        if len(hts_code) < 6 or len(hts_code) > 10:
            hts_code = None
    
    # Auto-detect common product HTS codes
    product_hts_map = {
        r"\b(car|vehicle|auto|motor)\b": "87032300",  # Motor cars 1500-3000cc
        r"\b(electric vehicle|ev)\b": "87038000",     # Electric vehicles  
        r"\b(truck|pickup)\b": "87042100",           # Motor vehicles for goods transport
        r"\b(textile|clothing|apparel)\b": "62034240", # Men's cotton trousers
        r"\b(steel|metal)\b": "72084000",            # Hot-rolled steel
        r"\b(solar panel|photovoltaic)\b": "85414020", # Solar cells
    }
    
    if not hts_code:
        for pattern, code in product_hts_map.items():
            if re.search(pattern, question, re.I):
                hts_code = code
                break

    # Year
    year_match = re.search(r"\b(20\d{2}|19\d{2})\b", question)
    year = year_match.group(1) if year_match else "2024"

    # Enhanced country detection
    country = "china"
    country_map = {
        "china": "china",
        "mexico": "mexico", 
        "canada": "canada",
        "japan": "japan",
        "korea": "korea",
        "germany": "germany",
        "vietnam": "vietnam",
        "india": "india",
        "us": "us",
        "usa": "us",
        "united states": "us",
    }
    for k, v in country_map.items():
        if re.search(rf"\b{k}\b", question, re.IGNORECASE):
            country = v
            break

    # Target system for possible translation
    target_system = None
    for sys in ["NAICS", "SITC", "HTS", "SIC", "End-Use", "END-USE", "ENDUSE"]:
        if re.search(rf"\b{sys}\b", question, re.I):
            norm = sys.upper().replace("-", "-")
            target_system = "END-USE" if norm in {"ENDUSE", "END-USE"} else norm
            break
    if not target_system:
        target_system = "NAICS"

    # Political action focused intent detection
    intents = {
        "news": bool(re.search(r"news|sentiment|headlines|press|article|recent|current|latest", question, re.I)),
        "policy": bool(re.search(r"policy|federal register|rule|notice|duty|tariff|regulation|announcement|political|government|administration|decision", question, re.I)),
        "trade": bool(re.search(r"import|export|volume|usitc|trade|statistics|data", question, re.I)),
        "bea": bool(re.search(r"bea|gdp|industry|economic|economy|growth", question, re.I)),
        "census": bool(re.search(r"census|trade statistics|intltrade|timeseries", question, re.I)),
        "translate": bool(re.search(r"translate|map|concordance|convert", question, re.I)) or bool(re.search(r"\bNAICS\b|\bSITC\b|\bSIC\b|End-Use|END-USE|ENDUSE", question, re.I)),
        "pricing": bool(re.search(r"price|cost|expensive|increasing|inflation|why.*cost|why.*price|impact.*price", question, re.I)),
        "comprehensive": bool(re.search(r"comprehensive|analysis|analyze|explain|understand|why|impact|effect|affect", question, re.I)),
        "political": bool(re.search(r"trump|biden|congress|administration|president|secretary|ustr|political|sanctions|executive.*order", question, re.I))
    }

    return hts_code, country, year, target_system, intents


def call_mcp_tools_for_question(model_name: str, question: str):
    """Conduct exhaustive research using ALL relevant MCP tools before analysis."""
    model = genai.GenerativeModel(model_name)
    hts_code, country, year, target_system, intents = extract_params_from_question(question)

    print("\n🔍 CONDUCTING COMPREHENSIVE RESEARCH...")
    print("=" * 60)
    print("📋 Research Plan:")
    print("  Phase 1: Core Data Collection (Tariffs, Trade Stats, Policy Docs)")
    print("  Phase 2: Historical Analysis (Multi-year comparisons, Evolution)")
    print("  Phase 3: Cross-validation (Multiple sources, News verification)")
    print("  Phase 4: Political Context (Decision makers, Timeline, Impact)")
    print("=" * 60)

    results = {"question": question, "research_phases": {}}

    # ===== PHASE 1: CORE DATA COLLECTION =====
    print("\n📊 PHASE 1: Core Data Collection")
    phase1_results = {}
    
    # MANDATORY: Always collect these regardless of HTS code
    research_tasks = [
        # Tariff Analysis (multiple years for historical context)
        ("current_tariffs", lambda: lookup_tariff_rate(hts_code or "87032300", country, year)),
        ("prev_year_tariffs", lambda: lookup_tariff_rate(hts_code or "87032300", country, str(int(year)-1))),
        ("base_year_tariffs", lambda: lookup_tariff_rate(hts_code or "87032300", country, "2019")),
        
        # Trade Statistics (comprehensive coverage)
        ("current_trade_data", lambda: search_usitc_trade_data(hts_code or "87032300", [country.upper()], year, year, "Import")),
        ("export_data", lambda: search_usitc_trade_data(hts_code or "87032300", [country.upper()], year, year, "Export")),
        ("multi_year_trade", lambda: search_usitc_trade_data(hts_code or "87032300", [country.upper()], str(int(year)-2), year, "Import")),
        
        # Policy Documents (broad and specific)
        ("specific_policy", lambda: search_federal_register(f"HTS {hts_code or 'tariff'} OR {country} {hts_code or 'trade'}")),
        ("general_policy", lambda: search_federal_register(f"{country} tariff OR {country} trade policy")),
        ("recent_announcements", lambda: get_recent_tariff_announcements(90)),
        
        # Economic Context
        ("gdp_analysis", lambda: analyze_gdp_by_industry(year)),
        ("prev_gdp_analysis", lambda: analyze_gdp_by_industry(str(int(year)-1))),
        
        # Comprehensive Analysis
        ("comprehensive_current", lambda: comprehensive_trade_analysis(hts_code or "87032300", country, year)),
    ]
    
    for task_name, task_func in research_tasks:
        try:
            print(f"  🔄 {task_name}...", end="")
            phase1_results[task_name] = task_func()
            print(" ✅")
        except Exception as e:
            phase1_results[task_name] = {"status": "error", "error": str(e)}
            print(f" ❌ ({str(e)[:50]}...)")
    
    results["research_phases"]["phase1_core_data"] = phase1_results

    # ===== PHASE 2: HISTORICAL ANALYSIS =====
    print("\n📈 PHASE 2: Historical Analysis")
    phase2_results = {}
    
    historical_tasks = [
        # Tariff Evolution (5-year span)
        ("tariff_evolution", lambda: compare_tariff_evolution(hts_code or "87032300", 
            [str(int(year)-4), str(int(year)-2), year])),
        
        # Trade Anomaly Detection
        ("trade_anomalies", lambda: analyze_trade_anomalies(hts_code or "87032300", 
            country.upper(), [str(int(year)-1), year])),
            
        # Census Historical Data
        ("census_current", lambda: get_census_trade_data(hts_code or "87032300", country, year)),
        ("census_historical", lambda: get_census_trade_data(hts_code or "87032300", country, str(int(year)-2))),
        
        # Commodity Translation for context
        ("hts_to_naics", lambda: translate_commodity_codes(hts_code or "87032300", "HTS", "NAICS", year)),
        ("hts_to_sitc", lambda: translate_commodity_codes(hts_code or "87032300", "HTS", "SITC", year)),
    ]
    
    for task_name, task_func in historical_tasks:
        try:
            print(f"  🔄 {task_name}...", end="")
            phase2_results[task_name] = task_func()
            print(" ✅")
        except Exception as e:
            phase2_results[task_name] = {"status": "error", "error": str(e)}
            print(f" ❌ ({str(e)[:50]}...)")
    
    results["research_phases"]["phase2_historical"] = phase2_results

    # Helper: build news query candidates (sanitized)
    def build_news_queries(q: str):
        import re
        base = q.strip()
        # Extract hints
        has_ev = bool(re.search(r"\bev(s)?\b|electric vehicle", base, re.I))
        has_china = bool(re.search(r"\bchina\b", base, re.I))
        # Candidates from most specific to general
        candidates = []
        if has_ev and has_china:
            candidates.extend([
                "tariff EV China",
                "duty EV China",
                "tariff electric vehicle China",
                "import tax EV China",
            ])
        # Generic tariff/news search
        candidates.extend([
            "tariff China",
            "import duty China",
            "tariff electric vehicle",
            "tariff EV",
        ])
        # Political action focused candidates for pricing questions
        if "price" in base.lower() or "cost" in base.lower() or "expensive" in base.lower():
            candidates.extend([
                "tariff policy impact price",
                "trade war cost increase",
                "government regulation price",
                "Biden tariff policy",
                "Trump tariff legacy",
            ])
        
        # Always include fallbacks
        candidates.extend(["tariff", "trade policy", "import duty"])
        
        # Ensure uniqueness while preserving order
        seen = set()
        uniq = []
        for c in candidates:
            if c not in seen:
                uniq.append(c)
                seen.add(c)
        return uniq[:5]  # Limit to top 5 to avoid too many API calls

    # ===== PHASE 3: CROSS-VALIDATION & NEWS ANALYSIS =====
    print("\n🔍 PHASE 3: Cross-validation & News Analysis")
    phase3_results = {}
    
    # Multiple news sources and timeframes
    news_queries = build_news_queries(question)
    news_tasks = [
        ("recent_news_30d", lambda: get_trade_news(query=news_queries[0] if news_queries else "tariff", days_back=30, max_results=10)),
        ("extended_news_90d", lambda: get_trade_news(query=news_queries[1] if len(news_queries)>1 else "trade policy", days_back=90, max_results=15)),
        ("policy_news", lambda: get_tariff_policy_updates()),
        ("sentiment_analysis", lambda: analyze_trade_news_sentiment(query=news_queries[0] if news_queries else question, max_articles=8)),
    ]
    
    for task_name, task_func in news_tasks:
        try:
            print(f"  🔄 {task_name}...", end="")
            phase3_results[task_name] = task_func()
            print(" ✅")
        except Exception as e:
            phase3_results[task_name] = {"status": "error", "error": str(e)}
            print(f" ❌ ({str(e)[:50]}...)")
    
    results["research_phases"]["phase3_cross_validation"] = phase3_results

    # ===== PHASE 4: POLITICAL CONTEXT & VALIDATION =====
    print("\n🏛️ PHASE 4: Political Context & Deep Validation")
    phase4_results = {}
    
    # Political decision-makers and timeline research
    political_tasks = [
        # Extended policy searches with political keywords
        ("biden_policies", lambda: search_federal_register(f"Biden OR executive order OR {country} tariff")),
        ("trump_legacy", lambda: search_federal_register(f"Trump OR Section 301 OR {country} duties")),
        ("congress_actions", lambda: search_federal_register(f"Congress OR legislative OR {country} trade")),
        ("ustr_decisions", lambda: search_federal_register(f"USTR OR trade representative OR {country}")),
        
        # Extended timeframe announcements
        ("long_term_announcements", lambda: get_recent_tariff_announcements(180)),  # 6 months
        
        # Multiple product analysis for comparison
        ("compare_auto_tariffs", lambda: lookup_tariff_rate("87032300", country, year)),  # Cars
        ("compare_steel_tariffs", lambda: lookup_tariff_rate("72084000", country, year)),  # Steel
        ("compare_solar_tariffs", lambda: lookup_tariff_rate("85414020", country, year)),  # Solar
        
        # Cross-country validation
        ("compare_mexico", lambda: lookup_tariff_rate(hts_code or "87032300", "mexico", year)),
        ("compare_canada", lambda: lookup_tariff_rate(hts_code or "87032300", "canada", year)),
    ]
    
    for task_name, task_func in political_tasks:
        try:
            print(f"  🔄 {task_name}...", end="")
            phase4_results[task_name] = task_func()
            print(" ✅")
        except Exception as e:
            phase4_results[task_name] = {"status": "error", "error": str(e)}
            print(f" ❌ ({str(e)[:50]}...)")
    
    results["research_phases"]["phase4_political_context"] = phase4_results
    
    # ===== RESEARCH COMPLETE - COMPILE METADATA =====
    print("\n📋 Research Summary:")
    total_successful = sum([
        sum(1 for r in phase.values() if isinstance(r, dict) and r.get("status") != "error")
        for phase in results["research_phases"].values()
    ])
    total_attempted = sum([len(phase) for phase in results["research_phases"].values()])
    print(f"  📊 Data Sources Accessed: {total_successful}/{total_attempted}")
    print(f"  🎯 Primary Product: HTS {hts_code or 'Multiple'} from {country.title()}")
    print(f"  📅 Analysis Period: {year} (with historical context)")
    print("=" * 60)

    # Comprehensive research-based analysis prompt
    prompt = (
        "You are a senior political economy analyst with access to comprehensive government data. "
        "Based on the EXHAUSTIVE RESEARCH conducted across 4 phases (outlined below), provide a thorough analysis focusing on political actions and policy impacts.\n\n"
        
        "RESEARCH CONDUCTED:\n"
        f"• Phase 1: {len(phase1_results)} core data sources (tariffs, trade stats, policies)\n"
        f"• Phase 2: {len(phase2_results)} historical analyses (evolution, anomalies)\n" 
        f"• Phase 3: {len(phase3_results)} cross-validation sources (news, sentiment)\n"
        f"• Phase 4: {len(phase4_results)} political context sources (admin decisions, comparisons)\n\n"
        
        "ANALYSIS REQUIREMENTS:\n"
        "1. THOROUGHLY examine ALL research phases before drawing conclusions\n"
        "2. Cross-reference multiple data sources for validation\n"
        "3. Identify specific political decision-makers (Presidents, Congress, USTR, agencies)\n"
        "4. Establish clear timeline of policy changes and their impacts\n"
        "5. Compare across products/countries to identify patterns\n"
        "6. Distinguish between correlation and causation in policy impacts\n"
        "7. Note data gaps and acknowledge limitations\n\n"
        
        "RESPONSE STRUCTURE (COMPREHENSIVE):\n"
        "🎯 EXECUTIVE SUMMARY (key findings)\n"
        "🏛️ POLITICAL DECISIONS & DECISION-MAKERS (who, when, why)\n"
        "📊 QUANTITATIVE IMPACT ANALYSIS (data-driven effects)\n"
        "📈 HISTORICAL CONTEXT & TRENDS (evolution over time)\n"
        "🔍 CROSS-VALIDATION & VERIFICATION (multiple source confirmation)\n"
        "⚠️ LIMITATIONS & UNCERTAINTY (data gaps, reliability)\n"
        "🔮 IMPLICATIONS & MONITORING (what to watch)\n\n"
        
        f"USER QUESTION: {question}\n\n"
        f"COMPREHENSIVE RESEARCH DATA:\n{json.dumps(results, indent=1)[:25000]}\n\n"
        f"TARGET: HTS {hts_code or 'Multiple Products'} from {country.title()}, Analysis Year: {year}\n\n"
        
        "Provide a thorough, evidence-based analysis that demonstrates deep understanding of the political economy. "
        "Be comprehensive but organized. Support all claims with specific data from the research phases."
    )

    print("\n🧠 Sending synthesized prompt to Gemini...")
    try:
        response = model.generate_content(prompt)
        print("\n📈 Gemini Answer:\n")
        print(response.text)
    except Exception as e:
        print(f"❌ Gemini synthesis failed: {e}")


if __name__ == "__main__":
    print("🚀 Gemini + MCP Tools Diagnostic")
    print("🔑 API Key: AIzaSyD1tu-eIUXRjEVBBtC3GdnC--HzWe1Mxvc")
    print()

    working_model = test_gemini_connection()
    if not working_model:
        print("\n❌ No working Gemini model found. Exiting.")
    else:
        try:
            user_q = input("Enter your trade/tariff question: ")
        except Exception:
            user_q = "What is the current tariff exposure and recent policy for HTS 8703.23.00 from China in 2024?"
        call_mcp_tools_for_question(working_model, user_q)
