# Dataset Name: Bureau of Economic Analysis (BEA) API Data Retrieval Suite

## Dataset Overview

### Quick Summary
- **Dataset Type**: Economic Indicators / Trade Statistics / Financial Data
- **Primary Focus**: Economic Impact / Trade Policy / Market Data / Economic Indicators
- **Time Range**: Historical to real-time (varies by dataset: 1929+ for NIPA, 1958+ for Regional, 1998+ for others)
- **Geographic Scope**: US Federal and regional data with international trade implications
- **Update Frequency**: Real-time to quarterly updates across different datasets
- **Data Quality**: High - Official government source with verified API keys and direct access

### Business Value for Tariff Impact Analysis
- **Primary Use Case**: Comprehensive economic data retrieval for analyzing GDP by industry, regional economic impacts, international trade flows, and multinational enterprise activities that directly correlate with tariff policy effects
- **Financial Impact Prediction Relevance**: Critical for baseline economic modeling, industry-specific impact assessment, regional economic analysis, and international investment position tracking for predictive tariff impact modeling
- **Affected Stakeholders**: Economic researchers, trade policy analysts, regional economists, industry analysts, academic institutions, financial institutions, and policy makers

## Dataset Structure & Format

### File Information
- **File Format**: JSON, XML (API responses)
- **File Size**: Variable (single requests ~10KB-10MB, bulk collections can be 100MB+)
- **Number of Records**: Millions of time series across 8 major datasets with historical depth varying by series
- **Compression**: Native API compression available

### Schema & Key Fields
```
National Income and Product Accounts (NIPA):
- TableName: Standard NIPA table identifier
- SeriesCode: Unique time series identifier
- LineNumber: Sequence within table
- TimePeriod: YYYY, YYYYQn, or YYYYMx format
- DataValue: Economic statistic value
- UNIT_MULT: Base-10 exponent multiplier
- CL_UNIT: Measurement unit (USD, percent, etc.)

Regional Economic Data:
- TableName: Published table identifier
- LineCode: Statistic line in table
- GeoFips: Geographic code (state/county/MSA)
- Year: Time period
- DataValue: Regional economic value

International Trade (ITA/IIP):
- Indicator: Transaction type identifier
- AreaOrCountry: Trading partner geography
- Frequency: Annual/Quarterly timing
- TimePeriod: Time reference
- DataValue: Trade flow or position value

Multinational Enterprises (MNE):
- DirectionOfInvestment: Inward/Outward flow
- SeriesID: Data series identifier
- Classification: Country/Industry breakdown
- DataValue: Investment or activity measure
```

### Data Quality Indicators
- **Completeness**: >98% for core economic indicators, >85% for detailed industry breakdowns
- **Consistency**: Standardized government statistical methods with official validation
- **Accuracy**: Direct from Bureau of Economic Analysis with real-time updates and revisions
- **Duplicates**: None - unique time series identifiers prevent duplication across datasets

## Content Analysis

### Key Topics Covered
- [x] Tariff announcements/changes (through international trade accounts)
- [x] Trade negotiations (via international investment positions and trade flows)
- [x] Economic impact assessments (GDP by industry, regional economic accounts)
- [x] Industry-specific effects (detailed industry breakdowns across all datasets)
- [x] Consumer price impacts (regional price parities, implicit price deflators)
- [x] Supply chain disruptions (industry interconnections via input-output tables)
- [x] Market reactions (quarterly data captures short-term economic responses)
- [x] International relations (multinational enterprise activities, investment positions)
- [x] Regional economic effects (state and local area economic accounts)

### Financial Data Points Available
- **Direct Financial Metrics**: GDP values, personal income, corporate profits, trade balances, investment positions, compensation levels, industry output values
- **Indirect Indicators**: Price deflators, quantity indexes, employment levels, productivity measures, regional price parities
- **Predictive Elements**: Quarterly data for trend analysis, industry interconnections, regional economic patterns, international investment flows

### Entities & Classifications
- **Countries**: All countries in international trade and investment data
- **Industries/Sectors**: All NAICS industry codes with historical SIC data
- **Commodities/Products**: Detailed product classifications in trade data
- **Geographic Areas**: All US states, counties, metropolitan areas, and territories
- **Government Bodies**: Bureau of Economic Analysis data sourced from all federal statistical agencies

## Analysis Potential

### Suitable Analysis Types
- [x] Time series analysis (comprehensive historical data with consistent methodologies)
- [x] Impact correlation analysis (industry interconnections and regional relationships)
- [x] Predictive modeling (quarterly frequency enables trend analysis)
- [x] Network analysis (input-output relationships, multinational enterprise connections)
- [x] Regional analysis (state/county/MSA geographic breakdowns)
- [x] Industry analysis (detailed sector classifications and interconnections)
- [x] International analysis (trade flows, investment positions, multinational activities)
- [x] Other: Economic baseline modeling, policy impact assessment, regional development analysis

### Integration Opportunities
- **Complementary Datasets**: USITC tariff databases, Census trade data, Federal Reserve economic data, Congressional Budget Office projections
- **Cross-Reference Potential**: Validate trade policy impacts with actual economic outcomes, correlate tariff changes with regional and industry effects
- **Temporal Alignment**: Quarterly and annual data provides both short-term and long-term impact analysis capabilities

## Technical Implementation

### Preprocessing Requirements
- **Data Standardization**: Normalize time periods across datasets, standardize geographic codes, align industry classifications
- **Feature Extraction**: Calculate growth rates, extract seasonal patterns, derive industry relationships, compute regional comparisons
- **Filtering Criteria**: Focus on trade-sensitive industries, international-facing regions, tariff-relevant economic indicators
- **Quality Validation**: Handle data revisions, manage seasonal adjustments, validate geographic and industry code consistency

### RAG/MCP Considerations
- **Chunking Strategy**: Chunk by dataset type (NIPA, Regional, ITA, etc.), by time period, by geographic area, or by industry sector
- **Metadata Tags**: dataset_name, table_name, time_period, geography, industry_code, data_type, frequency, last_updated
- **Search Keywords**: GDP, personal income, trade balance, industry output, regional economy, international investment, tariff impact, economic indicator
- **Context Windows**: Include methodological notes, data revision history, seasonal adjustment information, and geographic/industry definitions

### Known Limitations
- **Bias**: US-centric economic perspective, methodological changes over time may affect historical comparability
- **Coverage Gaps**: Some detailed industry data not available for all time periods, confidential data suppressed in detailed geographic areas
- **Technical Issues**: API rate limits (100 requests/minute), large data requests may timeout, seasonal adjustments complicate raw data interpretation
- **Temporal Lag**: Most data released with 1-3 quarter lag, annual data may have longer delays, frequent revisions to recent data

## Usage Guidelines

### Best Practices
1. Monitor API rate limits (100 requests/minute, 100MB/minute, 30 errors/minute) to avoid throttling
2. Use GetParameterValues methods to discover available data before making large requests
3. Leverage GetParameterValuesFiltered for targeted data discovery across related parameters
4. Cache frequently accessed data locally to minimize API calls and improve performance

### Common Pitfalls
- Ignoring data revision cycles (quarterly updates often revise previous periods)
- Mixing seasonally adjusted and non-seasonally adjusted data in analysis
- Overlooking geographic and industry code changes over time
- Exceeding API throttling limits with rapid successive requests

### Ethical Considerations
- **Source Attribution**: All data is public domain but should cite Bureau of Economic Analysis as source
- **Privacy Concerns**: No personal information, but some detailed geographic/industry data may be suppressed for confidentiality
- **Bias Mitigation**: Supplement US government data with international sources and private sector analysis for complete perspective

## Sample Data & Examples

### Representative Sample
```
NIPA Quarterly GDP Data:
{
  "TableName": "T10101",
  "SeriesCode": "A191RL1Q225SBEA",
  "LineNumber": "1",
  "LineDescription": "Gross domestic product",
  "TimePeriod": "2024Q2",
  "DataValue": "28,613.5",
  "CL_UNIT": "Billions of chained 2017 dollars",
  "UNIT_MULT": "9"
}

Regional Personal Income:
{
  "TableName": "SAINC1",
  "LineCode": "1",
  "GeoFips": "06000",
  "GeoName": "California",
  "TimePeriod": "2023",
  "DataValue": "3,598,103",
  "CL_UNIT": "thousands of dollars",
  "UNIT_MULT": "3"
}

International Trade Balance:
{
  "Indicator": "BalGds",
  "AreaOrCountry": "China",
  "Frequency": "A",
  "TimePeriod": "2023",
  "DataValue": "-382.9",
  "CL_UNIT": "billions of dollars",
  "UNIT_MULT": "9"
}
```

### Key Insights Demonstrated
- Comprehensive economic baseline data essential for tariff impact modeling
- Regional granularity enables state and local economic impact analysis
- Industry detail supports sector-specific tariff effect assessment
- International data provides trade flow context for tariff policy analysis

## Maintenance & Updates

### Data Freshness
- **Last Updated**: Real-time API access with data updated on official BEA release schedule
- **Update Process**: Automated API access, quarterly major releases with monthly and weekly updates for selected series
- **Version Control**: BEA maintains official data revision history, API provides most current published data

### Quality Monitoring
- **Validation Checks**: API key verification (36-character UserID required), response format validation, error handling for rate limits
- **Issue Tracking**: Monitor BEA release schedule, track data revisions, validate geographic and industry code consistency
- **Change Log**: BEA publishes comprehensive documentation of methodological changes and data revisions

## API Endpoints & Technical Details

### Base URLs & Authentication
- **Primary API Base URL**: `https://apps.bea.gov/api/data`
- **Authentication Method**: 36-character UserID (register at https://apps.bea.gov/api/signup/)
- **API Key**: `F2DCD1D2-965D-4E3A-9773-D39414D840DA`
- **Rate Limits**: 100 requests/minute, 100MB data/minute, 30 errors/minute
- **API Version**: Current stable version (no version number in URL)

### Core Endpoints

#### Meta-Data Discovery Endpoints
- **GET** `/api/data?UserID={key}&method=GETDATASETLIST`
  - **Purpose**: Retrieve list of available datasets
  - **Parameters**: 
    - `UserID` (required): 36-character authentication key
    - `method` (required): GETDATASETLIST
    - `ResultFormat` (optional): JSON or XML (default: JSON)
  - **Response Format**: Array of dataset objects with names and descriptions
  - **Example**: `GET /api/data?UserID=F2DCD1D2-965D-4E3A-9773-D39414D840DA&method=GETDATASETLIST&ResultFormat=JSON`

- **GET** `/api/data?UserID={key}&method=GetParameterList&DatasetName={dataset}`
  - **Purpose**: Get parameters for specific dataset
  - **Parameters**: 
    - `UserID` (required): Authentication key
    - `method` (required): GetParameterList
    - `DatasetName` (required): Dataset identifier (NIPA, Regional, ITA, etc.)
    - `ResultFormat` (optional): Response format
  - **Response Format**: Parameter definitions with data types and requirements
  - **Example**: `GET /api/data?UserID=F2DCD1D2-965D-4E3A-9773-D39414D840DA&method=GetParameterList&DatasetName=NIPA`

- **GET** `/api/data?UserID={key}&method=GetParameterValues&DatasetName={dataset}&ParameterName={param}`
  - **Purpose**: Get valid values for specific parameter
  - **Parameters**: 
    - `UserID` (required): Authentication key
    - `DatasetName` (required): Dataset name
    - `ParameterName` (required): Parameter to query
  - **Response Format**: Valid parameter values with descriptions
  - **Example**: `GET /api/data?UserID=F2DCD1D2-965D-4E3A-9773-D39414D840DA&method=GetParameterValues&DatasetName=Regional&ParameterName=TableName`

#### Data Retrieval Endpoints
- **GET** `/api/data?UserID={key}&method=GetData&DatasetName={dataset}&{parameters}`
  - **Purpose**: Retrieve actual economic data
  - **Parameters**: 
    - `UserID` (required): Authentication key
    - `method` (required): GetData
    - `DatasetName` (required): Target dataset
    - Additional parameters vary by dataset (TableName, Year, etc.)
  - **Response Format**: Time series data with metadata
  - **Example**: `GET /api/data?UserID=F2DCD1D2-965D-4E3A-9773-D39414D840DA&method=GetData&DatasetName=NIPA&TableName=T10101&Frequency=Q&Year=2023`

### Dataset-Specific Endpoints

#### NIPA (National Income and Product Accounts)
- **Required Parameters**: TableName OR TableID, Frequency, Year
- **Optional Parameters**: ResultFormat
- **Key Tables**: T10101 (GDP), T20600 (Personal Income), T40100 (Government)
- **Frequencies**: A (Annual), Q (Quarterly), M (Monthly - selected series)

#### Regional Economic Data
- **Required Parameters**: TableName, LineCode, GeoFips
- **Optional Parameters**: Year (defaults to LAST5)
- **Geographic Codes**: STATE, COUNTY, MSA, or specific FIPS codes
- **Key Tables**: SAINC1 (State Income), CAINC1 (County Income), SAGDP2N (State GDP)

#### International Trade Accounts (ITA)
- **Required Parameters**: One of Indicator OR AreaOrCountry (not both as "ALL")
- **Optional Parameters**: Frequency, Year
- **Key Indicators**: BalGds (Goods Balance), PfInvAssets (Portfolio Investment)
- **Geographic Coverage**: All trading partner countries and regions

### Error Handling
- **Common Error Codes**:
  - `3`: Invalid UserID
  - `1`: Rate limit exceeded (Volume per minute)
  - `40`: Missing required parameters
  - `204`: Invalid parameter values or no data available
- **Rate Limiting**: HTTP 429 status with RETRY-AFTER header (1 hour timeout)
- **Best Practices**: Implement exponential backoff, respect rate limits, validate parameters before requests

## Integration Notes

### API/Access Information
- **Access Method**: RESTful HTTP GET requests to single base URL
- **Authentication**: 36-character UserID registration required
- **Rate Limits**: Generous limits suitable for research and analysis applications
- **Data Formats**: JSON (default) and XML available for all endpoints

### Dependencies
- **Required Libraries**: `requests`, `json`, `pandas` for Python; standard HTTP libraries for other languages
- **Environment Setup**: Internet connection, valid UserID registration
- **System Requirements**: Minimal - API responses typically under 10MB per request

## Contact & Support

### Dataset Maintainer
- **Name**: Bureau of Economic Analysis, U.S. Department of Commerce
- **Email**: Support available through official BEA channels
- **Last Review Date**: January 2025

### Issue Reporting
- **Bug Reports**: Report API issues to BEA through official support channels
- **Enhancement Requests**: BEA accepts feedback on data coverage and API functionality
- **Documentation Updates**: Official documentation maintained by BEA at https://apps.bea.gov/api/

---

## Quick Start Checklist for AI Models

For MCP/RAG systems, this dataset is best used for:
- [x] Economic baseline modeling for tariff impact analysis
- [x] Regional and industry-specific economic impact assessment
- [x] Time series analysis of economic indicators and trade flows
- [x] International trade and investment position monitoring

Key search terms for retrieval: `GDP, personal income, trade balance, regional economy, industry output, international investment, economic indicator, tariff impact, multinational enterprise, economic growth`

Most valuable fields for analysis: `DataValue, TimePeriod, TableName, SeriesCode, GeoFips, LineCode, Indicator, AreaOrCountry`

Recommended preprocessing: `Calculate growth rates and trends, normalize geographic and industry codes, handle seasonal adjustments, manage data revisions, extract industry relationships`