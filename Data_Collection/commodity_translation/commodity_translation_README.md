# Dataset Name: USITC Commodity Translation Database

## Dataset Overview

### Quick Summary
- **Dataset Type**: Trade Statistics / Classification System Mappings
- **Primary Focus**: Trade Policy / Classification Harmonization / Cross-System Product Mapping
- **Time Range**: 1989 to 2020+ (31+ years)
- **Geographic Scope**: US (with international classification system links)
- **Update Frequency**: Annual updates with HS system revisions
- **Data Quality**: High - Official USITC government source with comprehensive validation

### Business Value for Tariff Impact Analysis
- **Primary Use Case**: Map products across different classification systems to maintain consistency in trade analysis across time periods and system changes
- **Financial Impact Prediction Relevance**: Essential for linking tariff rate changes to specific products when classification codes change over time; enables accurate historical analysis of tariff impacts
- **Affected Stakeholders**: Trade researchers, customs brokers, import/export businesses, policy analysts, economic researchers studying long-term trade patterns

## Dataset Structure & Format

### File Information
- **File Format**: CSV (3 files extracted from original 16.7MB XLSB)
- **File Size**: ~50MB total across 3 CSV files
- **Number of Records**: ~800,000+ product-year observations
- **Compression**: None (extracted CSV files)

### Schema & Key Fields
```
Fields CSV (17 rows) - Data dictionary:
- Field: Column name
- Definition: Field description
- Further information: Links to official documentation

Import/Export Concordance CSV (~400k rows each):
- year: Calendar year (1989-2020+)
- census_issue_date: Month/year data retrieved from Census
- hts10: 10-digit HTS import code OR Schedule B10 export code
- description_long: Detailed product description
- description_short: Abbreviated product description
- quantity_1: Primary unit of measurement (NO, KG, DOZ, M2, etc.)
- quantity_2: Secondary unit of measurement (if applicable)
- sitc: Standard International Trade Classification code (5-digit)
- end_use: End-use classification code (BEA economic categories)
- naics: North American Industry Classification System (1997+)
- ag_code: Agriculture indicator (0=agricultural, 1=non-agricultural)
- hitech: Advanced technology product indicator
- sic: Standard Industrial Classification (1989-2003 only)
```

### Data Quality Indicators
- **Completeness**: 
  - NAICS: Missing for 1989-1996 (pre-implementation)
  - SIC: Missing after 2003 (discontinued)
  - HiTech: ~95% complete for applicable products
  - All other fields: >99% complete
- **Consistency**: Standardized government format with consistent field structures
- **Accuracy**: Official USITC source with regular validation against Census Bureau data
- **Duplicates**: No duplicates - unique by year+hts10 combination

## Content Analysis

### Key Topics Covered
- [x] Product classification harmonization across HS system revisions
- [x] Cross-system mapping (HTS↔SITC↔NAICS↔End-Use)
- [x] Trade statistics standardization
- [x] Industry-specific product categorization
- [x] Agricultural vs non-agricultural product identification
- [x] Advanced technology product classification
- [x] Historical classification system evolution
- [x] International trade code standardization
- [ ] Tariff announcements/changes (use tariff database instead)
- [ ] Political rhetoric/policy positions

### Financial Data Points Available
- **Direct Financial Metrics**: None (classification mapping only)
- **Indirect Indicators**: Product sophistication levels (HiTech), industry linkages (NAICS), economic use categories (End-Use)
- **Predictive Elements**: Classification trends indicating product evolution and technological advancement

### Entities & Classifications
- **Countries**: US (primary) with international HS system compatibility
- **Industries/Sectors**: All US import/export industries via NAICS codes (1997+)
- **Commodities/Products**: All US tradeable goods (~80,000 current product codes)
- **Companies**: None (product-level, not company-specific)
- **Government Bodies**: USITC, Census Bureau, USDA (agriculture classification), BEA (end-use categories)

## Analysis Potential

### Suitable Analysis Types
- [ ] Sentiment analysis (not applicable - codes/classifications only)
- [x] Named entity recognition (product descriptions, industry classifications)
- [x] Time series analysis (classification evolution over time)
- [x] Impact correlation analysis (link trade impacts across classification changes)
- [x] Predictive modeling (product sophistication trends, trade pattern evolution)
- [x] Text classification (product description categorization)
- [x] Network analysis (classification system relationships)
- [x] Other: Cross-system concordance analysis, product complexity measurement

### Integration Opportunities
- **Complementary Datasets**: USITC Annual Tariff Databases (same HTS10 codes), UN Comtrade (HS6 codes), Census trade statistics
- **Cross-Reference Potential**: Links tariff rates to products across time, validates trade statistics consistency, connects international and domestic data
- **Temporal Alignment**: Perfect alignment with USITC tariff data, compatible with monthly Census trade data

## Technical Implementation

### Preprocessing Requirements
- **Text Cleaning**: Product descriptions may need standardization for consistent analysis
- **Data Standardization**: Handle missing values for discontinued classification systems (SIC) or late-adoption systems (NAICS)
- **Feature Extraction**: Extract HS chapter/heading hierarchies, map classification system relationships, create industry aggregations
- **Filtering Criteria**: Filter by year ranges, specific industries (NAICS), technology levels (HiTech), or agricultural status

### RAG/MCP Considerations
- **Chunking Strategy**: Chunk by product categories (HS chapters) or industry groups (NAICS sectors) for semantic coherence
- **Metadata Tags**: year, hs_chapter, industry_sector, product_type, technology_level, agricultural_status
- **Search Keywords**: product descriptions, classification codes, industry terms, trade categories, technology indicators
- **Context Windows**: Include full classification hierarchy (HS2→HS4→HS6→HTS8→HTS10) for complete context

### Known Limitations
- **Bias**: US-centric classification system, may not reflect international product categorization priorities
- **Coverage Gaps**: Services not included (goods only), some niche products may have generic classifications
- **Technical Issues**: Product descriptions vary in specificity across years, some many-to-many mapping complexities
- **Temporal Lag**: Classification updates may lag 1-2 years behind product innovation

## Usage Guidelines

### Best Practices
1. Use SITC codes for longest consistent time series analysis (most stable over time)
2. Validate critical product mappings against official USITC/Census documentation
3. Account for missing NAICS data in pre-1997 analysis and missing SIC data post-2003
4. Weight aggregations by trade value when combining products across classification changes

### Common Pitfalls
- Assuming one-to-one mappings between classification systems (many are many-to-many)
- Using HTS10 codes for long-term trends without accounting for code changes
- Ignoring unit of measurement changes when analyzing quantity data over time
- Mixing import (HTS10) and export (Schedule B10) codes inappropriately

### Ethical Considerations
- **Source Attribution**: Cite USITC as primary source, Census Bureau for underlying trade statistics
- **Privacy Concerns**: No PII - all product/industry level data
- **Bias Mitigation**: Acknowledge US-centric perspective, supplement with international sources for global analysis

## Sample Data & Examples

### Representative Sample
```
Import Concordance (1989):
year,census_issue_date,hts10,description_long,description_short,quantity_1,quantity_2,sitc,end_use,naics,ag_code,hitech,sic
1989,July 1993,0101110010,"HORSES, LIVE, PUREBRED BREEDING, MALE","HORSES, LIVE, PUREBRED BREEDING, MALE",NO,,00151,12060,,0,,0272

Import Concordance (2020):
year,census_issue_date,hts10,description_long,description_short,quantity_1,quantity_2,sitc,end_use,naics,ag_code,hitech,sic
2020,June 2022,0101210010,"HORSES AND ASSES, PUREBRED BREEDING, MALE, LIVE","HORSES AND ASSES, PUREBRED BREEDING, MALE, LIVE",NO,,00150,12060,112920,0,00,

Manufacturing Example (2012):
2012,June 2015,6204633510,"WOMEN'S TROUSERS AND BREECHES, OF SYNTHETIC FIBERS, NOT KNITTED","W TROUSER ETC SYN FIB LT 36% WT W/FAH, N KNT/CROCH",DOZ,KG,84260,40020,315240,1,00,
```

### Key Insights Demonstrated
- Product code evolution: Horse classification codes changed from 0101110010 to 0101210010 between 1989-2020
- System adoption: NAICS codes appear starting 1997, replacing SIC codes which ended 2003
- Measurement complexity: Manufacturing products often have dual units (DOZ + KG) while agricultural products typically use single units

## Maintenance & Updates

### Data Freshness
- **Last Updated**: Data through 2020+ (varies by specific year in dataset)
- **Update Process**: USITC updates annually following HS system revisions and Census Bureau data releases
- **Version Control**: Managed by USITC DataWeb system with version tracking

### Quality Monitoring
- **Validation Checks**: Cross-validation with Census Bureau trade statistics and official HS nomenclature updates
- **Issue Tracking**: USITC DataWeb help desk manages data quality issues and user feedback
- **Change Log**: Major HS revisions (every 5 years) documented in USITC reports and WCO materials

## Integration Notes

### API/Access Information
- **Access Method**: File path: `/Data_Collection/commodity_translation/` (3 CSV files)
- **Authentication**: None required (public government data)
- **Rate Limits**: Not applicable (local files)

### Dependencies
- **Required Libraries**: `pandas` (Python), `readr` (R) for basic CSV processing
- **Environment Setup**: Standard data science environment, no special requirements
- **System Requirements**: ~100MB RAM for full dataset processing

## Contact & Support

### Dataset Maintainer
- **Name**: USITC DataWeb Team (original), Local extraction by Dekleptocracy Project
- **Email**: USITC DataWeb Help Desk for official questions
- **Last Review Date**: August 2025

### Issue Reporting
- **Bug Reports**: Contact USITC DataWeb for official data issues
- **Enhancement Requests**: Submit to USITC for official dataset improvements
- **Documentation Updates**: Maintain locally for project-specific documentation

---

## Quick Start Checklist for AI Models

For MCP/RAG systems, this dataset is best used for:
- [x] Product classification consistency across time periods
- [x] Cross-system trade data harmonization
- [x] Industry-level trade impact analysis via NAICS mappings

Key search terms for retrieval: `hts10, sitc, naics, product classification, trade codes, harmonized system, commodity translation, industry mapping`

Most valuable fields for analysis: `hts10, description_long, sitc, naics, ag_code, hitech, year`

Recommended preprocessing: `Handle missing NAICS (pre-1997) and SIC (post-2003), standardize product descriptions, create HS hierarchy levels, map industry aggregations`