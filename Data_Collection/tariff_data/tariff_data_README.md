# Dataset Name: USITC Annual Tariff Database

## Dataset Overview

### Quick Summary
- **Dataset Type**: Trade Statistics / Tariff Rates / Policy Data
- **Primary Focus**: Tariffs / Trade Policy / Free Trade Agreements / Import Duties
- **Time Range**: 1997 to 2025 (29 years)
- **Geographic Scope**: US (tariff rates applied to imports from all countries)
- **Update Frequency**: Annual updates with policy changes and new trade agreements
- **Data Quality**: High - Official USITC government source with comprehensive trade policy data

### Business Value for Tariff Impact Analysis
- **Primary Use Case**: Calculate exact import duty costs, analyze tariff rate changes over time, assess trade agreement benefits, predict cost impacts of tariff policy changes
- **Financial Impact Prediction Relevance**: Direct financial impact calculation - provides exact tariff rates (%) and specific duties ($/unit) for all US import products by country of origin and trade agreement status
- **Affected Stakeholders**: Importers, exporters, customs brokers, trade lawyers, supply chain managers, economic researchers, policy analysts, affected industries and consumers

## Dataset Structure & Format

### File Information
- **File Format**: Text files (pipe-separated 1997-2018, CSV 2019-2025)
- **File Size**: ~150MB total (individual files range 1.8MB to 13.5MB)
- **Number of Records**: ~370,000 product-year observations (12K-22K products per year)
- **Compression**: None (extracted from original ZIP files)

### Schema & Key Fields
```
Core Product Information:
- hts8: Harmonized Tariff Schedule 8-digit code (primary key)
- brief_description: Product description
- quantity_1_code/quantity_2_code: Unit of measurement codes
- wto_binding_code: WTO binding status (B=bound, U=unbound)

General Tariff Rates (MFN - Most Favored Nation):
- mfn_text_rate: Tariff rate as text ("5.5%", "Free", "$2.50/kg")
- mfn_rate_type_code: Rate type (0=Free, 7=Ad valorem %, 1=Specific $)
- mfn_ave: Average equivalent ad valorem rate
- mfn_ad_val_rate: Ad valorem component (percentage)
- mfn_specific_rate: Specific duty component ($/unit)

Free Trade Agreement Rates (varies by year, ~50+ agreement fields):
- nafta_canada_ind/nafta_mexico_ind: NAFTA indicators
- usmca_*: US-Mexico-Canada Agreement rates
- korea_*, japan_*, chile_*, australia_*: FTA-specific rates
- singapore_*, jordan_*, morocco_*, peru_*: Additional FTA rates

Preferential Programs:
- gsp_indicator: Generalized System of Preferences
- agoa_indicator: African Growth and Opportunity Act
- cbi_indicator: Caribbean Basin Initiative
- atpa_indicator: Andean Trade Preference Act

Administrative Fields:
- begin_effect_date/end_effective_date: Validity period
- footnote_comment: Special conditions
- col2_*: Column 2 rates (non-MFN countries)
```

### Data Quality Indicators
- **Completeness**: >99% complete for core fields (hts8, mfn rates), ~85% for specialized programs
- **Consistency**: Standardized government format, some naming variations across years
- **Accuracy**: Official USITC source validated against customs regulations
- **Duplicates**: None - unique by year+hts8 combination

## Content Analysis

### Key Topics Covered
- [x] Tariff announcements/changes (annual rate updates)
- [x] Trade negotiations (implemented FTA rates)
- [x] Economic impact assessments (rate comparisons across agreements)
- [x] Industry-specific effects (product-level tariff variations)
- [x] Consumer price impacts (direct duty cost calculations)
- [ ] Supply chain disruptions (policy only, not operational data)
- [x] Political rhetoric/policy positions (reflected in preferential program coverage)
- [x] Market reactions (rate changes indicate policy responses)
- [x] International relations (FTA implementation patterns)

### Financial Data Points Available
- **Direct Financial Metrics**: Exact tariff percentages, specific duty amounts ($/unit), compound rates, rate ranges
- **Indirect Indicators**: Trade preference utilization patterns, protection level indicators, policy preference signals
- **Predictive Elements**: Scheduled rate reductions in FTAs, binding commitments, expiration dates for temporary programs

### Entities & Classifications
- **Countries**: All trading partners (200+) with specific rates for each FTA partner
- **Industries/Sectors**: All HS chapters (01-99) covering agriculture, manufacturing, services
- **Commodities/Products**: ~13,000-22,000 specific product codes per year (HTS8 level)
- **Companies**: None (product-level, not company-specific)
- **Government Bodies**: USITC, U.S. Customs and Border Protection, USTR, various trade agreement bodies

## Analysis Potential

### Suitable Analysis Types
- [ ] Sentiment analysis (not applicable - numerical rates only)
- [x] Named entity recognition (product descriptions, country names, agreement names)
- [x] Time series analysis (tariff rate evolution, protection trends)
- [x] Impact correlation analysis (rate changes vs. trade volumes, prices)
- [x] Predictive modeling (future rate changes, cost impact forecasting)
- [ ] Text classification (limited text content)
- [x] Network analysis (trade agreement relationships, product hierarchies)
- [x] Other: Cost calculation models, trade diversion analysis, effective protection rate analysis

### Integration Opportunities
- **Complementary Datasets**: Commodity Translation Database (same HTS8 codes), UN Comtrade trade statistics, BLS import price indices, Census trade data
- **Cross-Reference Potential**: Calculate actual duty payments using trade volumes, analyze price impacts using cost data, validate policy effects using trade flows
- **Temporal Alignment**: Perfect alignment with annual trade statistics, monthly customs data, quarterly economic indicators

## Technical Implementation

### Preprocessing Requirements
- **Text Cleaning**: Standardize rate text formats ("Free" vs "0%"), handle special characters in product descriptions
- **Data Standardization**: Convert between pipe-separated (1997-2018) and CSV (2019-2025) formats, normalize country/agreement naming
- **Feature Extraction**: Calculate effective protection rates, create trade agreement coverage matrices, generate HS hierarchy aggregations
- **Filtering Criteria**: Filter by HS chapters, specific trade agreements, rate types, time periods

### RAG/MCP Considerations
- **Chunking Strategy**: Chunk by HS chapters (commodity groups) or trade agreements for semantic coherence
- **Metadata Tags**: year, hs_chapter, trade_agreement, rate_type, product_category, protection_level
- **Search Keywords**: product names, tariff rates, trade agreements, country names, duty calculations, protection levels
- **Context Windows**: Include full rate structure (MFN + all applicable preferential rates) for complete cost analysis

### Known Limitations
- **Bias**: US policy perspective only, doesn't reflect foreign tariffs on US exports
- **Coverage Gaps**: Services not included (goods only), some products may have temporary suspensions not captured
- **Technical Issues**: Rate format variations across years, some complex compound rates difficult to parse automatically  
- **Temporal Lag**: Annual updates may not capture mid-year policy changes immediately

## Usage Guidelines

### Best Practices
1. Always use the most restrictive rate structure when calculating duties (compare MFN vs. preferential rates)
2. Validate rate calculations against official CBP rulings for complex products
3. Account for additional factors not in database (anti-dumping duties, countervailing duties, trade remedy measures)
4. Cross-reference with commodity translation database when analyzing products across time periods

### Common Pitfalls
- Assuming preferential rates always apply (must meet rules of origin and other requirements)
- Using wrong rate type (ad valorem % vs. specific $/unit vs. compound rates)
- Ignoring effective dates and temporary suspensions
- Mixing HTS8 codes across years without checking for classification changes

### Ethical Considerations
- **Source Attribution**: Cite USITC as primary source for all tariff data
- **Privacy Concerns**: No PII - all product/policy level data
- **Bias Mitigation**: Acknowledge US-only perspective, supplement with foreign tariff data for complete analysis

## Sample Data & Examples

### Representative Sample
```
1997 Record (Early Format - Pipe Separated):
hts8|brief_description|mfn_ave|mfn_rate_type_code|mfn_ad_val_rate|nafta_canada_ind|canada_ad_val_rate|nafta_mexico_ind|mexico_ad_val_rate|col2_ad_val_rate
52104980|Woven fabrics of cotton|0.155|7|0.155|CA|0.015|MX|0.052|0.435

2023 Record (Recent Format - CSV):
"hts8","brief_description","mfn_text_rate","mfn_ave","usmca_indicator","usmca_ad_val_rate","korea_indicator","korea_ad_val_rate","japan_indicator","japan_ad_val_rate"
"55031910","Synthetic staple fibers","Free",0.00,,,,,,"25%",0.25

Complex Rate Example:
"84212300","Filtering or purifying machinery","2.5%",0.025,"Free",0.00,"Free",0.00,"Free",0.00
```

### Key Insights Demonstrated
- Rate complexity evolution: 1997 had ~37 columns, 2023 has 122 columns reflecting new trade agreements
- Trade liberalization: Many products show "Free" rates for FTA partners vs. positive MFN rates
- Policy differentiation: Same product can have different rates for different countries based on agreement status

## Maintenance & Updates

### Data Freshness
- **Last Updated**: 2025 data available (most recent)
- **Update Process**: USITC publishes annual updates following Harmonized Tariff Schedule revisions and new trade agreement implementations
- **Version Control**: Annual versions with clear year identification, maintains historical data

### Quality Monitoring
- **Validation Checks**: Cross-validated with official HTS publications and CBP regulations
- **Issue Tracking**: USITC DataWeb system manages corrections and user feedback
- **Change Log**: Annual HTS updates documented in Federal Register and USITC reports

## Integration Notes

### API/Access Information
- **Access Method**: File path: `/Data_Collection/tariff_data/tariff_data_YYYY/` (29 directories)
- **Authentication**: None required (public government data)
- **Rate Limits**: Not applicable (local files)

### Dependencies
- **Required Libraries**: `pandas` (Python), `readr` (R) for CSV/pipe-separated file processing
- **Environment Setup**: Standard data science environment, handle mixed separators (| vs ,)
- **System Requirements**: ~200MB RAM for full historical dataset processing

## Contact & Support

### Dataset Maintainer
- **Name**: USITC DataWeb Team (original), Dekleptocracy Project (local extraction)
- **Email**: USITC DataWeb Help for official data questions
- **Last Review Date**: August 2025

### Issue Reporting
- **Bug Reports**: Report to USITC DataWeb for official data issues
- **Enhancement Requests**: Submit to USITC for official dataset improvements  
- **Documentation Updates**: Maintain locally for project-specific documentation

---

## Quick Start Checklist for AI Models

For MCP/RAG systems, this dataset is best used for:
- [x] Tariff rate calculation and cost impact analysis
- [x] Trade agreement benefit quantification
- [x] Historical tariff policy trend analysis

Key search terms for retrieval: `tariff rates, import duties, trade agreements, hts codes, mfn rates, free trade, customs, protection levels, duty calculations`

Most valuable fields for analysis: `hts8, brief_description, mfn_ave, mfn_ad_val_rate, [agreement]_ad_val_rate, begin_effect_date`

Recommended preprocessing: `Standardize rate formats across years, handle pipe vs CSV separation, calculate effective rates, create agreement coverage matrices, normalize product descriptions`