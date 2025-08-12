================================================================================
                      USITC COMMODITY TRANSLATION DATABASE
                         All Commodity Translations Dataset
                              
              Source: https://dataweb.usitc.gov/classification/commodity-translation
================================================================================

OVERVIEW
========
This collection contains the complete USITC Commodity Translation Database,
extracted from the original commodity_translation_wizard.xlsb file (16.7MB). 
The database provides comprehensive mappings between different international 
and domestic trade classification systems for U.S. import and export data 
from 1989 to present.

This dataset is essential for trade research, policy analysis, and business
intelligence as it enables consistent analysis across different classification
systems and time periods despite numerous updates to the Harmonized System.

DATASET COMPOSITION
===================
The database has been extracted into 3 CSV files:

1. **commodity_translation_wizard_Fields.csv** (17 rows)
   - Data dictionary and field definitions
   - Reference information for understanding all columns
   - Links to official documentation for each classification system

2. **commodity_translation_wizard_Import_Concordance.csv** (~400,000+ rows)
   - Complete import classification translations (1989-2020+)
   - Maps HTS10 import codes to multiple classification systems
   - Approximately 14,400+ records per year for early years
   - Approximately 80,000+ records per year for recent years

3. **commodity_translation_wizard_Export_Concordance.csv** (~400,000+ rows)
   - Complete export classification translations (1989-2020+)
   - Maps Schedule B10 export codes to multiple classification systems
   - Similar structure to import concordance but for exports

DATASET PURPOSE
===============
This dataset addresses several critical challenges in international trade analysis:

1. CLASSIFICATION HARMONIZATION
   - Maps between different versions of Harmonized System (HS) codes
   - Bridges domestic classification systems with international standards
   - Connects historical and current product categorizations

2. TEMPORAL CONSISTENCY
   - Enables time-series analysis across classification system updates
   - Maintains data continuity when HS codes change
   - Supports longitudinal trade pattern studies

3. CROSS-SYSTEM COMPATIBILITY
   - Links U.S. Harmonized Tariff Schedule (HTS) to international HS codes
   - Connects to Standard International Trade Classification (SITC) systems
   - Bridges to North American Industry Classification System (NAICS)

CORE DATA STRUCTURE
===================
Each concordance file contains the following 13 fields:

**TEMPORAL IDENTIFIERS:**
- year: Calendar year (1989-current)
- census_issue_date: Month/year data retrieved from Census

**PRODUCT CLASSIFICATION:**
- hts10: 10-digit HTS import code OR Schedule B10 export code
- description_long: Detailed product description
- description_short: Abbreviated product description
- quantity_1: Primary unit of measurement
- quantity_2: Secondary unit of measurement (if applicable)

**CLASSIFICATION MAPPINGS:**
- sitc: Standard International Trade Classification code
- end_use: End-use classification code
- naics: North American Industry Classification System (1997+)
- ag_code: Agriculture/non-agriculture indicator (0=ag, 1=non-ag)
- hitech: Advanced technology product indicator
- sic: Standard Industrial Classification (1989-2003 only)

TEMPORAL COVERAGE
=================
**Time Span:** 1989-2020+ (31+ years of data)
**Update Pattern:** Annual updates reflecting HS system revisions
**Data Volume Growth:** Significant expansion over time
- Early years (1989): ~14,400 product codes
- Recent years (2020+): ~80,000 product codes

**Key HS System Updates Covered:**
- HS 1988 (original implementation)
- HS 1992 (first major revision)
- HS 1996 revision
- HS 2002 revision
- HS 2007 revision
- HS 2012 revision
- HS 2017 revision
- HS 2022 revision (most recent)

CLASSIFICATION SYSTEM DETAILS
=============================

**HTS10/Schedule B10 (Primary Identifiers):**
- 10-digit codes specific to U.S. trade
- First 6 digits: International HS code
- 7th-8th digits: U.S.-specific subcategories
- 9th-10th digits: Statistical reporting detail
- Import codes (HTS10) vs Export codes (Schedule B10) may differ

**SITC (Standard International Trade Classification):**
- UN system for economic analysis
- Groups products by economic function
- 5-digit codes with hierarchical structure
- Used extensively in academic trade research

**End-Use Categories:**
- BEA economic classification system
- Groups products by ultimate economic use
- Critical for GDP and economic accounting
- Different codes for imports vs exports

**NAICS (North American Industry Classification):**
- Industry-based classification system
- Links trade products to domestic production industries
- 6-digit codes with 2-4-6 digit hierarchy
- Available 1997-present only

**Agriculture Code:**
- USDA determination of agricultural vs non-agricultural
- 0 = Agricultural commodity
- 1 = Non-agricultural commodity
- Used for agricultural trade policy analysis

**HiTech (Advanced Technology Products):**
- Census Bureau classification
- Identifies technologically advanced products
- Critical for innovation and competitiveness research
- Binary indicator with detailed subcategories

**SIC (Standard Industrial Classification):**
- Legacy industry classification system
- Available 1989-2003 only (replaced by NAICS)
- 4-digit codes
- Useful for historical industry analysis

SAMPLE DATA EXAMPLES
====================

**1989 Import Record (Early Format):**
- HTS10: 0101110010
- Description: "HORSES, LIVE, PUREBRED BREEDING, MALE"
- SITC: 00151
- End-use: 12060
- Agriculture: 0 (agricultural)
- SIC: 0272

**2020 Import Record (Recent Format):**
- HTS10: 0101210010
- Description: "HORSES AND ASSES, PUREBRED BREEDING, MALE, LIVE"
- SITC: 00150
- End-use: 12060
- NAICS: 112920
- Agriculture: 0 (agricultural)
- HiTech: 00 (not high-tech)

**Complex Manufacturing Example (2012):**
- HTS10: 6204633510
- Description: "WOMEN'S TROUSERS AND BREECHES, OF SYNTHETIC FIBERS, NOT KNITTED"
- Units: DOZ (dozens), KG (kilograms)
- SITC: 84260
- End-use: 40020
- NAICS: 315240
- Agriculture: 1 (non-agricultural)

DATA APPLICATIONS
=================

TRADE RESEARCH:
1. Historical Trade Analysis
   - Track product trade flows across HS system revisions
   - Maintain consistency in multi-decade studies
   - Analyze impact of classification changes on reported trade

2. Comparative Trade Studies
   - Compare trade patterns between countries using different systems
   - Harmonize bilateral trade data for analysis
   - Study regional trade agreement impacts across classification systems

3. Product Evolution Tracking
   - Monitor how technological change affects product classification
   - Study emergence of new product categories
   - Analyze classification granularity changes over time

BUSINESS INTELLIGENCE:
1. Market Analysis
   - Identify all classification codes relevant to specific products
   - Map competitive product categories across systems
   - Understand regulatory classification for different markets

2. Supply Chain Management
   - Determine tariff implications across different classification systems
   - Optimize product coding for customs purposes
   - Navigate classification differences in global operations

3. Compliance and Reporting
   - Ensure accurate product classification for customs
   - Meet reporting requirements across multiple jurisdictions
   - Maintain consistent internal product categorization

POLICY ANALYSIS:
1. Tariff Impact Studies
   - Analyze how classification changes affect duty collections
   - Study protection patterns across product categories
   - Evaluate trade agreement implementation effects

2. Trade Facilitation Research
   - Assess classification system harmonization benefits
   - Study customs modernization impacts
   - Analyze trade cost reduction from improved classification

3. Industrial Development Studies
   - Track industrial diversification through classification changes
   - Study comparative advantage evolution
   - Analyze export sophistication trends

CLASSIFICATION SYSTEM BACKGROUND
================================

HARMONIZED SYSTEM (HS):
- International standard developed by World Customs Organization
- Updated every 5 years (major revisions: 1988, 1992, 1996, 2002, 2007, 2012, 2017, 2022)
- 6-digit codes provide global consistency
- Countries add digits (7th, 8th+) for national detail

U.S. HARMONIZED TARIFF SCHEDULE (HTS):
- U.S. implementation of HS system
- 8-digit codes (adds 2 digits to international 6-digit HS)
- Incorporates U.S.-specific product distinctions
- Updated annually with HS revisions and domestic needs

STANDARD INTERNATIONAL TRADE CLASSIFICATION (SITC):
- UN system focused on economic analysis rather than customs
- Groups products by economic function and production stage
- Multiple revisions (Rev 1, 2, 3, 4) with different analytical focuses
- Widely used in academic research and economic statistics

COMMON USE CASES
================

RESEARCHERS:
1. "How has trade in electronics evolved from 1990-2020?"
   → Use HS mappings to maintain product consistency across HS revisions

2. "What products benefit most from specific trade agreements?"
   → Map HTS codes to broader categories for aggregate analysis

3. "How do classification changes affect reported trade growth?"
   → Compare pre/post classification change data using translations

BUSINESSES:
1. "What tariff code should we use for our new product?"
   → Find appropriate HTS classification and any relevant alternatives

2. "How will the new HS revision affect our customs classification?"
   → Use translation tables to understand classification continuity

3. "What products compete with ours in trade statistics?"
   → Map between different classification systems to find comparable products

GOVERNMENT ANALYSTS:
1. "How effective are our trade promotion programs?"
   → Map beneficiary products across classification systems for impact assessment

2. "What products are most affected by specific trade barriers?"
   → Use classification mappings to identify affected product ranges

3. "How should we adjust our trade monitoring for new HS codes?"
   → Plan for classification transitions using translation guidance

DATA QUALITY CONSIDERATIONS
============================

MAPPING COMPLEXITY:
- Not all mappings are one-to-one relationships
- Some products split across multiple new codes
- Some new codes combine multiple old products
- Temporal gaps may exist in some translations

SYSTEM DIFFERENCES:
- Different systems optimize for different purposes (customs vs. economic analysis)
- Granularity levels vary between systems
- Cultural/national differences in product categorization
- Technical vs. commercial classification differences

UPDATE FREQUENCY:
- HS system updates every 5 years with major revisions
- Annual updates for minor changes and clarifications
- Country-specific additions updated on national schedules
- Translation tables may lag behind official system updates

TECHNICAL USAGE GUIDELINES
==========================

**DATA PROCESSING CONSIDERATIONS:**

1. **Classification Consistency**
   - HTS/Schedule B codes change over time - use translation tables carefully
   - SITC codes provide more temporal stability for long-term analysis
   - NAICS data only available 1997+ (missing for early years)

2. **Unit of Measurement Handling**
   - Quantity units vary by year and product
   - Some products have dual units (quantity_1, quantity_2)
   - "NO" indicates no special unit (count/number)
   - Weight (KG) and specialized units (DOZ, M2, etc.) are common

3. **Missing Data Patterns**
   - Early years (1989-1996) lack NAICS codes
   - SIC codes discontinued after 2003
   - Some specialized fields may be empty for certain product categories

**ANALYSIS RECOMMENDATIONS:**

1. **Time Series Analysis**
   - Use SITC codes for longest consistent time series
   - Document classification breaks in your analysis
   - Consider using "bridge years" around major HS revisions

2. **Cross-System Mapping**
   - Many-to-many relationships exist between systems
   - Weight mappings by trade value when aggregating
   - Validate critical mappings against official sources

3. **Industry Analysis**
   - Combine NAICS mapping with domestic production data
   - Use end-use categories for economic impact analysis
   - Agricultural code enables agribusiness-specific studies

COMMON RESEARCH QUESTIONS
=========================

**"How has U.S. trade in electronics evolved since 1989?"**
→ Filter by HiTech codes and relevant SITC categories, track over time
→ Use consistent SITC mapping to handle HS classification changes

**"What products benefit most from NAFTA preferences?"**
→ Cross-reference with USITC tariff databases using HTS10 codes
→ Use end-use categories to aggregate impact by economic sector

**"How has export product sophistication changed?"**
→ Map HiTech indicators and SITC categories to complexity measures
→ Track evolution of advanced technology exports over time

**"Which industries are most affected by trade disputes?"**
→ Use NAICS mappings to connect trade products to domestic industries
→ Analyze industry-level trade exposure using classification links

**"How do agricultural trade patterns differ from manufacturing?"**
→ Use ag_code to separate agricultural from non-agricultural products
→ Apply different analytical frameworks to each category

DATA QUALITY AND LIMITATIONS
============================

**STRENGTHS:**
- Comprehensive coverage of U.S. trade classification systems
- Long time series enabling historical analysis
- Official government source with regular updates
- Multiple classification system mappings in single dataset

**LIMITATIONS:**
- Classification systems optimized for different purposes may not align perfectly
- Many-to-many mappings create aggregation challenges
- Missing data for discontinued systems (SIC) or late-adoption systems (NAICS)
- Product descriptions may vary in specificity across years

**VALIDATION RECOMMENDATIONS:**
- Cross-check critical mappings with official classification documents
- Verify temporal consistency for key product categories
- Test sensitivity of results to alternative mapping approaches
- Document any manual adjustments or assumptions made

COMPLEMENTARY DATASETS
======================

**USITC Databases:**
- Annual Tariff Databases (tariff rates by HTS10 code)
- Import/Export data by commodity
- Trade agreement utilization statistics

**Census Bureau:**
- Monthly trade statistics by commodity
- Foreign Trade Division reference materials
- Advanced Technology Products lists

**International Sources:**
- UN Comtrade (international trade by HS code)
- WTO Trade Profiles
- OECD Trade by Commodity Statistics

RESEARCH APPLICATIONS
=====================

ACADEMIC STUDIES:
1. Trade Creation/Diversion Analysis
   - Map products affected by trade agreements across classification changes
   - Maintain consistent product definitions in before/after studies

2. Comparative Advantage Evolution
   - Track product sophistication using consistent classifications
   - Study export diversification patterns over long time periods

3. Gravity Model Estimation
   - Ensure product-level trade data consistency across countries/time
   - Handle classification differences in bilateral trade databases

POLICY EVALUATION:
1. Trade Agreement Impact Assessment
   - Identify all products covered by specific trade preferences
   - Track utilization rates across classification system changes

2. Industrial Policy Analysis
   - Map between trade and production classification systems
   - Study linkages between trade patterns and domestic industry structure

3. Customs Modernization Studies
   - Assess classification harmonization benefits
   - Evaluate trade facilitation impacts of improved systems

DATA LIMITATIONS
================

COVERAGE GAPS:
- Some historical mappings may be incomplete
- New products may lack historical translations
- Services classifications typically not included
- Country-specific variations may not be captured

MAPPING ACCURACY:
- Automated translations may miss nuanced product distinctions
- Economic vs. physical product characteristics may differ
- Legal vs. practical classification differences possible
- Updates to mappings may not be immediately available

TEMPORAL CONSISTENCY:
- Classification philosophy changes over time
- New technologies create mapping challenges
- Political/economic factors influence classification decisions
- Historical data may need manual verification for critical applications

CITATION AND ATTRIBUTION
========================
Primary Source: United States International Trade Commission (USITC)
URL: https://dataweb.usitc.gov/classification/commodity-translation
Tool: Commodity Translation Wizard

For academic research, cite as:
"U.S. International Trade Commission Commodity Translation Database, 
https://dataweb.usitc.gov/classification/commodity-translation"

For business applications, reference:
"USITC Commodity Translation Wizard, accessed [date]"

RELATED RESOURCES
=================

OFFICIAL SOURCES:
- World Customs Organization HS Database
- UN Statistics Division classification systems
- USITC Harmonized Tariff Schedule
- Bureau of Economic Analysis end-use categories

COMPLEMENTARY DATASETS:
- USITC Annual Tariff Databases (companion to this translation data)
- UN Comtrade International Trade Statistics
- World Bank WITS (World Integrated Trade Solution)
- OECD International Trade by Commodity Statistics

TECHNICAL SUPPORT:
- USITC DataWeb Help Desk
- World Customs Organization Classification Opinions
- UN Statistics Division Classification Registry
- National customs authorities for country-specific guidance

DISCLAIMER
==========
This dataset is designed for analytical and research purposes. For official 
customs classifications, import/export determinations, or legal matters, 
consult current official publications from relevant customs authorities. 
Classification systems and their translations are subject to change, and 
users should verify current classifications for operational decisions.

The commodity translation relationships represent best-effort mappings between 
different classification systems but may not capture all nuances relevant to 
specific use cases. Critical applications should be validated against multiple 
sources and expert review.

UPDATE AND MAINTENANCE
=====================
- Database updated annually with new HS revisions
- Major updates correspond to 5-year HS revision cycle
- Minor updates reflect annual classification adjustments
- Check USITC DataWeb for most current version

DISCLAIMER
==========
This dataset is provided for analytical and research purposes. For official 
customs classifications, legal determinations, or operational decisions, 
consult current official publications from USITC, U.S. Customs and Border 
Protection, and other relevant agencies.

Classification mappings represent best-effort translations between different 
systems and may not capture all nuances. Users should validate critical 
mappings against official sources and consider the limitations of automated 
classification translation for their specific applications.

The temporal coverage and data quality reflect the evolution of trade 
classification systems over three decades. Earlier years may have less 
granular product detail, while recent years reflect increased complexity 
in international trade categorization.

================================================================================
Documentation Updated: August 2025
Dataset Coverage: 1989-2020+ (31+ years)
Total Records: ~800,000+ product-year observations
Primary Classifications: HTS10/Schedule B10, SITC, End-Use, NAICS, Agriculture
Time Series: Consistent mappings across major HS system revisions
================================================================================