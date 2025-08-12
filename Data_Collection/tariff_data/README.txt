================================================================================
                        USITC TARIFF DATABASE DOCUMENTATION
                           Years 1997-2025 (29 datasets)
                              
                     Source: https://dataweb.usitc.gov/tariff/annual
================================================================================

OVERVIEW
========
This collection contains yearly U.S. tariff data from the United States 
International Trade Commission (USITC). Each dataset represents the tariff 
rates and trade preferences applicable to imports into the United States for 
that specific year.

The data shows how U.S. trade policy has evolved over nearly three decades,
including the implementation of various Free Trade Agreements (FTAs) and
preferential trade programs.

FILE STRUCTURE
==============
- 29 directories: tariff_data_YYYY (where YYYY = 1997-2025)
- Each directory contains one text file with tariff data
- File naming varies by era:
  * 1997-2018: tariff_database_YYYY.txt (pipe-separated |)
  * 2019-2025: trade_tariff_database_YYYYMM.txt (comma-separated CSV)

DATA FORMAT EVOLUTION
=====================
The dataset has grown significantly in complexity:
- 1997: 37 columns, ~12K products
- 2023: 122 columns, ~13K products

This expansion reflects new trade agreements and preferential programs added
over time.

KEY DATA FIELDS
===============

CORE PRODUCT IDENTIFICATION:
- hts8: Harmonized Tariff Schedule 8-digit code (primary key)
- brief_description: Product description
- quantity_1_code/quantity_2_code: Unit of measurement codes

GENERAL TARIFF RATES (MFN - Most Favored Nation):
- mfn_text_rate: Tariff rate as text (e.g., "5.5%", "Free")
- mfn_rate_type_code: Rate type (0=Free, 7=Ad valorem %, etc.)
- mfn_ave: Average equivalent ad valorem rate
- mfn_ad_val_rate: Ad valorem component (percentage)
- mfn_specific_rate: Specific duty component ($/unit)
- wto_binding_code: WTO binding status

PREFERENTIAL TRADE PROGRAMS:
Each program has indicator fields and specific rates:

Major FTAs (with rate_type_code, ad_val_rate, specific_rate):
- NAFTA/USMCA: nafta_canada_ind, nafta_mexico_ind, usmca_*
- Australia: australia_*
- Bahrain: bahrain_*
- Chile: chile_*
- Colombia: colombia_*
- Jordan: jordan_*
- Korea: korea_*
- Morocco: morocco_*
- Oman: oman_*
- Panama: panama_*
- Peru: peru_*
- Singapore: singapore_*
- Japan: japan_*

Regional Programs:
- DR-CAFTA: Dominican Republic-Central America FTA
- CBI: Caribbean Basin Initiative
- AGOA: African Growth and Opportunity Act
- ATPA/ATPDEA: Andean Trade Preference Act
- GSP: Generalized System of Preferences
- APTA: Asia-Pacific Trade Agreement

Special Categories:
- pharmaceutical_ind: Pharmaceutical products
- dyes_indicator: Dyes and chemicals
- civil_air_indicator: Civil aircraft

ADMINISTRATIVE FIELDS:
- begin_effect_date/end_effective_date: Validity period
- footnote_comment: Special conditions or notes
- additional_duty: Extra duties that may apply
- col2_*: Column 2 rates (for non-MFN countries)

RATE TYPE CODES
===============
0 = Free (no duty)
1 = Specific rate (fixed amount per unit)
7 = Ad valorem (percentage of value)
8 = Compound rate (combination)
N = Not applicable

HOW TO READ THE DATA
====================

Example Record Analysis:
HTS Code: 52104980 (Cotton fabric)
- MFN Rate: 15.5% ad valorem
- NAFTA Canada: 1.5% (preferential)
- NAFTA Mexico: 5.2% (preferential)
- Israel FTA: Free
- Column 2: 43.5% (non-MFN countries)

This shows the product faces different tariff rates depending on country of
origin, with FTA partners getting preferential access.

WHAT CAN BE LEARNED
===================

TRADE POLICY ANALYSIS:
1. Evolution of U.S. trade liberalization (1997-2025)
2. Impact of FTA implementation on tariff rates
3. Sectoral protection patterns across industries
4. Preferential treatment for developing countries

ECONOMIC RESEARCH:
1. Trade creation/diversion effects of FTAs
2. Tariff escalation patterns (raw materials vs. finished goods)
3. Non-tariff barrier identification through special codes
4. Effective protection rates calculation

BUSINESS INTELLIGENCE:
1. Import duty calculations for specific products
2. Country-of-origin optimization strategies
3. Competitive advantage analysis by trade agreement
4. Market access conditions for different suppliers

HISTORICAL ANALYSIS:
1. Pre/post NAFTA comparison (1997 vs. later years)
2. China trade relations (Column 2 vs. MFN treatment)
3. Development program effectiveness (GSP, AGOA, etc.)
4. Supply chain reconfiguration incentives

DATA USAGE TIPS
===============

FILE READING:
- 1997-2018: Use pipe (|) separator
- 2019+: Use comma (,) separator
- Handle quoted fields in newer CSV format
- Some files have different date formats

ANALYSIS CONSIDERATIONS:
- HTS codes may change between years (product reclassification)
- New trade agreements add columns over time
- Some rates are "Free" (text) vs. 0.00 (numeric)
- Specific rates require unit conversion for comparison
- Missing/empty fields indicate non-applicability

COMMON RESEARCH QUESTIONS
=========================

1. "What's the average tariff rate for [industry/HTS chapter]?"
   → Filter by HTS code prefix, calculate weighted average

2. "How did NAFTA affect tariffs on [product]?"
   → Compare MFN vs. NAFTA rates over time

3. "Which countries get the best access for [product]?"
   → Compare all preferential rates for specific HTS codes

4. "What products face the highest protection?"
   → Rank by MFN rates, identify outliers

5. "How has trade policy liberalized over time?"
   → Calculate average rates by year, trend analysis

TECHNICAL NOTES
===============
- File sizes range from 2MB (1997) to 14MB (2012)
- Total dataset: ~150MB of structured trade policy data
- Some data inconsistencies exist between years
- Always verify current rates with official USITC sources
- Rates shown may not include anti-dumping or countervailing duties

CITATION
========
Data Source: United States International Trade Commission (USITC)
URL: https://dataweb.usitc.gov/tariff/annual
Coverage: U.S. Harmonized Tariff Schedule, Annual Data 1997-2025

For academic research, cite as:
"U.S. International Trade Commission Tariff Database, [Year], 
https://dataweb.usitc.gov/tariff/annual"

DISCLAIMER
==========
This data is for analytical purposes only. For official import/export 
determinations, consult current USITC publications and U.S. Customs and 
Border Protection regulations. Tariff rates and trade programs are subject 
to change and may have specific eligibility requirements not captured in 
this dataset.

================================================================================
Last Updated: August 2025
Dataset Coverage: 1997-2025 (29 years)
Total Records: ~370,000 product-year observations
================================================================================