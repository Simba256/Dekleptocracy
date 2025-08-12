# Dataset Name: U.S. Census Data API Suite

## Dataset Overview

### Quick Summary
- **Dataset Type**: Economic Indicators / Trade Statistics / Demographic Data / Business Patterns
- **Primary Focus**: Economic Impact / Trade Policy / Market Data / Industry Analysis / Demographics
- **Time Range**: Historical to real-time (1986+ for CBP, 1989+ for CPS, 2005+ for ACS)
- **Geographic Scope**: US Federal, state, county, metropolitan, and local area data
- **Update Frequency**: Real-time to annual (monthly for CPS, annual for ACS/CBP, ongoing for estimates)
- **Data Quality**: High - Official government source with comprehensive statistical validation

### Business Value for Tariff Impact Analysis
- **Primary Use Case**: Comprehensive analysis of industry employment patterns, business establishment data, worker demographics, and economic characteristics that directly correlate with tariff policy effects across all U.S. geographic levels
- **Financial Impact Prediction Relevance**: Critical for baseline economic modeling, industry-specific workforce analysis, regional business dependency assessment, and demographic impact evaluation for predictive tariff modeling
- **Affected Stakeholders**: Trade policy analysts, industry economists, regional development specialists, workforce planners, business analysts, academic researchers, and policy makers

## Dataset Structure & Format

### File Information
- **File Format**: JSON (API responses), CSV (bulk downloads)
- **File Size**: Variable (single requests ~10KB-1MB, bulk collections can be 1GB+)
- **Number of Records**: Millions of time series and microdata records across 400+ datasets
- **Compression**: Native API compression, bulk downloads available in ZIP format

### Schema & Key Fields
```
American Community Survey (ACS):
- TableID: Standard ACS table identifier (e.g., B24010, C24010)
- Variable: Specific data element code with estimate/margin of error
- Geography: Geographic identifier (state, county, tract, etc.)
- TimePeriod: Survey year or year range (2019, 2015-2019)
- Estimate: Statistical estimate value
- MarginOfError: Statistical margin of error
- Annotation: Data quality flags

Current Population Survey (CPS):
- HRHHID: Household identifier
- PULINENO: Person line number
- GESTFIPS: State FIPS code
- GTCBSA: Metropolitan area code
- PEMLR: Monthly labor force status
- PRDTIND1: Detailed industry code
- PRDTOCC1: Detailed occupation code
- PEERNVAL: Earnings value

County Business Patterns (CBP):
- FIPSTATE: State FIPS code
- FIPSCTY: County FIPS code
- NAICS2017: Industry classification code
- ESTAB: Number of establishments
- EMP: Employment count
- PAYANN: Annual payroll ($1,000s)
- AP: Annual payroll flag
- EMPSZES: Employment size class

Public Use Microdata Sample (PUMS):
- SERIALNO: Housing unit/group quarters serial number
- SPORDER: Person number within household
- PUMA: Public Use Microdata Area code
- ST: State code
- PWGTP: Person weight
- INDP: Industry code (based on 2017 NAICS)
- OCCP: Occupation code (based on 2018 SOC)
- WAGP: Wages or salary income past 12 months
```

### Data Quality Indicators
- **Completeness**: >95% for core economic indicators, >90% for detailed demographic breakdowns
- **Consistency**: Standardized federal statistical methods with official validation across all programs
- **Accuracy**: Direct from U.S. Census Bureau with comprehensive quality control and statistical significance testing
- **Duplicates**: None - unique identifiers prevent duplication within and across datasets

## Content Analysis

### Key Topics Covered
- [x] Tariff announcements/changes (through industry employment and business establishment tracking)
- [x] Trade negotiations (via foreign-born workforce and trade-related industry analysis)
- [x] Economic impact assessments (comprehensive industry and regional economic data)
- [x] Industry-specific effects (detailed NAICS industry breakdowns across all datasets)
- [x] Consumer price impacts (income, earnings, and cost-of-living data)
- [x] Supply chain disruptions (transportation, warehousing, and logistics industry data)
- [x] Market reactions (business establishment creation/closure patterns)
- [x] International relations (foreign-born population and naturalization data)
- [x] Regional economic effects (county and metropolitan area economic indicators)

### Financial Data Points Available
- **Direct Financial Metrics**: Annual payroll by industry, household income, individual earnings, business establishment counts, employment levels, poverty rates
- **Indirect Indicators**: Industry employment concentration, educational attainment by industry, geographic mobility patterns, business size distributions
- **Predictive Elements**: Population projections, workforce demographic trends, industry growth patterns, regional economic dependencies

### Entities & Classifications
- **Countries**: All countries of birth for foreign-born population data
- **Industries/Sectors**: Complete NAICS industry classification system (2-6 digit detail)
- **Commodities/Products**: Industry-based product classifications through business patterns
- **Geographic Areas**: All U.S. states, counties, metropolitan areas, congressional districts, places, census tracts
- **Government Bodies**: U.S. Census Bureau, Bureau of Labor Statistics, Department of Commerce

## Analysis Potential

### Suitable Analysis Types
- [x] Time series analysis (comprehensive historical data with consistent methodologies)
- [x] Impact correlation analysis (industry relationships and regional economic dependencies)
- [x] Predictive modeling (demographic trends and workforce projections)
- [x] Network analysis (industry interdependencies and supply chain relationships)
- [x] Regional analysis (state/county/metropolitan statistical area comparisons)
- [x] Industry analysis (detailed sector classifications and workforce characteristics)
- [x] Demographic analysis (population characteristics affecting trade and economic outcomes)
- [x] Other: Economic baseline modeling, workforce impact assessment, regional development analysis

### Integration Opportunities
- **Complementary Datasets**: BEA industry data, USITC trade statistics, Federal Register policy announcements, JOLTS employment data
- **Cross-Reference Potential**: Validate trade policy impacts with actual employment and business outcomes, correlate tariff changes with regional industry effects
- **Temporal Alignment**: Annual and monthly data provides both short-term and long-term economic impact analysis capabilities

## Technical Implementation

### Preprocessing Requirements
- **Data Standardization**: Normalize geographic codes across vintages, standardize industry classifications, align demographic categories
- **Feature Extraction**: Calculate employment growth rates, extract industry concentrations, derive regional dependencies, compute demographic ratios
- **Filtering Criteria**: Focus on trade-sensitive industries, manufacturing sectors, import/export-related occupations, foreign-born workforce concentrations
- **Quality Validation**: Handle survey margins of error, manage disclosure limitations, validate geographic and industry code consistency

### RAG/MCP Considerations
- **Chunking Strategy**: Chunk by dataset type (ACS, CPS, CBP), by geographic level, by industry sector, or by demographic characteristics
- **Metadata Tags**: dataset_name, survey_year, geography_level, industry_code, demographic_group, data_type, reliability_flag
- **Search Keywords**: employment, industry, workforce, business patterns, demographics, income, manufacturing, trade, foreign-born, establishment
- **Context Windows**: Include survey methodology notes, margin of error information, geographic definitions, and industry classification details

### Known Limitations
- **Bias**: U.S.-centric perspective, survey non-response bias in certain populations, industry classification changes over time
- **Coverage Gaps**: Some detailed data suppressed for small areas, industry detail limited for confidentiality, microdata geographic detail restricted
- **Technical Issues**: API rate limits, large dataset size requirements, complex variable naming conventions
- **Temporal Lag**: ACS data released 1 year after collection, CBP data released 2 years after reference year, frequent survey methodology updates

## Usage Guidelines

### Best Practices
1. Use appropriate geographic levels for analysis scope (avoid census tract data for national analysis)
2. Always include margins of error for ACS estimates in statistical analysis
3. Validate industry codes across different survey years due to classification updates
4. Combine multiple datasets for comprehensive analysis (e.g., CBP for businesses, ACS for workers)

### Common Pitfalls
- Mixing different survey methodologies without understanding coverage differences
- Ignoring statistical significance and margins of error in small-area estimates
- Using inappropriate geographic aggregations that violate disclosure rules
- Overlooking industry classification changes when creating time series

### Ethical Considerations
- **Source Attribution**: All data is public domain but should cite U.S. Census Bureau as source
- **Privacy Concerns**: Microdata has geographic and demographic restrictions to protect individual privacy
- **Bias Mitigation**: Supplement federal data with private sector sources and consider survey non-response patterns

## Sample Data & Examples

### Representative Sample
```
ACS Industry Employment Data:
{
  "NAME": "California",
  "B24010_001E": "18567890",
  "B24010_001M": "15678",
  "B24010_029E": "1245678",
  "B24010_029M": "8901",
  "state": "06",
  "year": "2023"
}

County Business Patterns:
{
  "FIPSTATE": "06",
  "FIPSCTY": "037",
  "NAICS2017": "3361",
  "ESTAB": "45",
  "EMP": "12500",
  "PAYANN": "890750",
  "year": "2022"
}

CPS Monthly Employment:
{
  "GESTFIPS": "06",
  "GTCBSA": "31080",
  "PEMLR": "1",
  "PRDTIND1": "3370",
  "PEERNVAL": "75000",
  "PWSSWGT": "1834.56",
  "month": "11",
  "year": "2024"
}

ACS PUMS Individual Record:
{
  "SERIALNO": "2023000123456",
  "PUMA": "00801",
  "ST": "06",
  "INDP": "3361",
  "OCCP": "5120",
  "WAGP": "85000",
  "NATIVITY": "2",
  "PWGTP": "45"
}
```

### Key Insights Demonstrated
- Comprehensive industry employment tracking enables sector-specific tariff impact analysis
- Geographic granularity supports state and local economic impact assessment
- Demographic detail provides workforce composition analysis for trade-affected industries
- Business establishment data tracks economic restructuring patterns following policy changes

## Maintenance & Updates

### Data Freshness
- **Last Updated**: Real-time API access with data updated on official Census Bureau release schedule
- **Update Process**: Automated API access, annual major releases for ACS/CBP, monthly releases for CPS
- **Version Control**: Census Bureau maintains official vintage history, API provides most current published data

### Quality Monitoring
- **Validation Checks**: API key verification (none required - public access), response format validation, error handling for rate limits
- **Issue Tracking**: Monitor Census Bureau release calendar, track survey methodology changes, validate geographic and industry code updates
- **Change Log**: Census Bureau publishes comprehensive documentation of methodological changes and data revisions

## API Endpoints & Technical Details

### Base URLs & Authentication
- **Primary API Base URL**: `https://api.census.gov/data/`
- **Authentication Method**: None required - public access
- **API Key**: `F2DCD1D2-965D-4E3A-9773-D39414D840DA` (recommended for rate limit management)
- **Rate Limits**: Standard limits apply (specific limits not published)
- **API Version**: RESTful API with vintage-based versioning

### Core Endpoints

#### American Community Survey (ACS) Endpoints
- **GET** `/data/{year}/acs/acs5`
  - **Purpose**: Retrieve ACS 5-year detailed tables data
  - **Parameters**: 
    - `get` (required): Variables to retrieve (comma-separated)
    - `for` (required): Geographic level and codes
    - `in` (optional): Geographic hierarchy constraints
    - `key` (optional): API key for rate limit management
  - **Response Format**: JSON array with variable data and geographic identifiers
  - **Example**: `GET /data/2023/acs/acs5?get=B24010_001E,B24010_029E&for=state:*&key=F2DCD1D2-965D-4E3A-9773-D39414D840DA`

- **GET** `/data/{year}/acs/acs5/profile`
  - **Purpose**: Retrieve ACS data profiles (percentage distributions)
  - **Parameters**: Similar to detailed tables
  - **Response Format**: JSON with percentage and count estimates
  - **Example**: `GET /data/2023/acs/acs5/profile?get=DP03_0002PE,DP03_0002E&for=county:*&in=state:06`

- **GET** `/data/{year}/acs/acs5/pums`
  - **Purpose**: Retrieve Public Use Microdata Sample records
  - **Parameters**: 
    - `get` (required): PUMS variables (person and housing unit)
    - `for` (required): State or PUMA geographic level
    - `INDP` (optional): Industry filter
    - `OCCP` (optional): Occupation filter
  - **Response Format**: JSON array with individual-level records
  - **Example**: `GET /data/2023/acs/acs5/pums?get=PWGTP,INDP,WAGP,NATIVITY&for=state:06&INDP=3360:3390`

#### Current Population Survey (CPS) Endpoints
- **GET** `/data/{year}/cps/basic/{month}`
  - **Purpose**: Retrieve monthly labor force data
  - **Parameters**: 
    - `get` (required): CPS variables
    - `for` (required): Geographic level (limited to state and above)
    - `PRDTIND1` (optional): Industry filter
    - `PEMLR` (optional): Labor force status filter
  - **Response Format**: JSON with monthly employment estimates
  - **Example**: `GET /data/2024/cps/basic/nov?get=PWSSWGT,PEMLR,PRDTIND1,PEERNVAL&for=state:*&PRDTIND1=3000:3999`

- **GET** `/data/{year}/cps/asec/mar`
  - **Purpose**: Retrieve Annual Social and Economic Supplement data
  - **Parameters**: Similar to basic CPS with additional income variables
  - **Response Format**: JSON with detailed income and demographic data
  - **Example**: `GET /data/2024/cps/asec/mar?get=HINC,POVL,INDUST&for=state:*`

#### County Business Patterns (CBP) Endpoints
- **GET** `/data/{year}/cbp`
  - **Purpose**: Retrieve business establishment and employment data
  - **Parameters**: 
    - `get` (required): CBP variables (ESTAB, EMP, PAYANN)
    - `for` (required): Geographic level
    - `NAICS2017` (optional): Industry filter
    - `EMPSZES` (optional): Employment size class filter
  - **Response Format**: JSON with business statistics by industry and geography
  - **Example**: `GET /data/2022/cbp?get=ESTAB,EMP,PAYANN&for=county:*&NAICS2017=31-33`

#### Population Estimates Program (PEP) Endpoints
- **GET** `/data/{year}/pep/population`
  - **Purpose**: Retrieve annual population estimates
  - **Parameters**: 
    - `get` (required): Population variables
    - `for` (required): Geographic level
    - `DATE_CODE` (optional): Specific estimate date
  - **Response Format**: JSON with population estimates by demographic groups
  - **Example**: `GET /data/2023/pep/population?get=POP,DENSITY&for=county:*&in=state:06`

### Supporting Metadata Endpoints
#### Variable Discovery
- **GET** `/data/{year}/{survey}/variables.json`
  - **Purpose**: Get complete variable list and definitions
  - **Response Format**: JSON object with variable codes, labels, and concepts
  - **Example**: `GET /data/2023/acs/acs5/variables.json`

#### Geographic Hierarchy
- **GET** `/data/{year}/{survey}/geography.json`
  - **Purpose**: Get available geographic levels and codes
  - **Response Format**: JSON with geographic hierarchies and FIPS codes
  - **Example**: `GET /data/2023/acs/acs5/geography.json`

#### Variable Groups
- **GET** `/data/{year}/{survey}/groups.json`
  - **Purpose**: Get variable groupings and table structures
  - **Response Format**: JSON with table groups and variable relationships
  - **Example**: `GET /data/2023/acs/acs5/groups.json`

#### API Examples
- **GET** `/data/{year}/{survey}/examples.json`
  - **Purpose**: Get sample API calls and query patterns
  - **Response Format**: JSON with example queries and explanations
  - **Example**: `GET /data/2023/acs/acs5/examples.json`

### Industry and Geographic Filter Patterns
#### Industry-Specific Queries
- **Manufacturing**: `NAICS2017=31-33` or `INDP=3360:3390`
- **Trade and Transportation**: `NAICS2017=42,44-45,48-49` or `INDP=4670:5390`
- **Agriculture**: `NAICS2017=11` or `INDP=0170:0490`

#### Geographic Targeting
- **All States**: `for=state:*`
- **Specific State Counties**: `for=county:*&in=state:06`
- **Metropolitan Areas**: `for=metropolitan statistical area:*`
- **Congressional Districts**: `for=congressional district:*&in=state:06`

### Bulk Data Access
- **FTP Downloads**: `https://www2.census.gov/programs-surveys/acs/data/pums/`
- **Dataset Collections**: Available through data.census.gov interface
- **Historical Archives**: Vintage-specific bulk downloads for research

### Error Handling
- **Common Error Codes**:
  - `400`: Bad Request - Invalid query parameters or variable codes
  - `404`: Not Found - Dataset, vintage, or geographic area doesn't exist
  - `414`: URI Too Long - Query string exceeds maximum length
  - `500`: Server Error - Census API service temporarily unavailable
- **Rate Limiting**: HTTP 429 status with retry guidance (specific limits not published)
- **Best Practices**: Use API key for tracking, implement exponential backoff, validate parameters before requests

## Integration Notes

### API/Access Information
- **Access Method**: RESTful HTTP GET requests to multiple survey-specific endpoints
- **Authentication**: Optional API key for rate limit management and usage tracking
- **Rate Limits**: Reasonable limits for research and analysis applications
- **Data Formats**: JSON (primary), XML available for some legacy endpoints

### Dependencies
- **Required Libraries**: `requests`, `json`, `pandas` for Python; standard HTTP libraries for other languages
- **Environment Setup**: Internet connection, optional API key registration
- **System Requirements**: Minimal for API calls - bulk microdata downloads may require significant storage

## Contact & Support

### Dataset Maintainer
- **Name**: U.S. Census Bureau, U.S. Department of Commerce
- **Email**: Survey-specific support (acso.users.support@census.gov for ACS, dsd.cps@census.gov for CPS)
- **Last Review Date**: August 2025

### Issue Reporting
- **Bug Reports**: Report API issues through Census Bureau official support channels
- **Enhancement Requests**: Census Bureau accepts feedback on data coverage and API functionality
- **Documentation Updates**: Official documentation maintained at https://www.census.gov/developers/

---

## Quick Start Checklist for AI Models

For MCP/RAG systems, this dataset is best used for:
- [x] Industry-specific workforce and business establishment analysis for tariff impact modeling
- [x] Regional economic dependency assessment and demographic impact evaluation
- [x] Time series analysis of employment and business patterns across trade-sensitive sectors
- [x] Comprehensive baseline economic modeling for policy impact prediction

Key search terms for retrieval: `employment, industry, workforce, business patterns, demographics, manufacturing, trade, establishments, income, foreign-born, NAICS, county, metropolitan`

Most valuable fields for analysis: `ESTAB, EMP, PAYANN, INDP, OCCP, WAGP, B24010_001E, NAICS2017, FIPSTATE, FIPSCTY, PWGTP`

Recommended preprocessing: `Calculate industry employment concentrations, normalize geographic codes across surveys, extract demographic ratios, compute regional industry dependencies, handle survey margins of error, standardize industry classifications across time periods`