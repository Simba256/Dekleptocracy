# Dataset Name: USITC DataWeb Trade Statistics API

## Dataset Overview

### Quick Summary
- **Dataset Type**: Trade Statistics / Economic Data / Tariff Information
- **Primary Focus**: U.S. Import/Export Trade Flows / Tariff Analysis / Economic Impact Assessment
- **Time Range**: 1989 to Present (Ongoing)
- **Geographic Scope**: Global (U.S. trade with all countries/regions)
- **Update Frequency**: Monthly (with some data available more frequently)
- **Data Quality**: High - Official U.S. government trade statistics from Department of Commerce

### Business Value for Kleptocracy/Trade Analysis
- **Primary Use Case**: Detecting suspicious trade patterns, sanctions evasion, and illicit financial flows through trade misinvoicing
- **Financial Impact Prediction Relevance**: Enables analysis of trade value anomalies, price manipulation, and volume discrepancies that may indicate corruption or illicit activities
- **Affected Stakeholders**: Compliance officers, financial investigators, policy analysts, sanctions enforcement, anti-corruption researchers

## Dataset Structure & Format

### File Information
- **File Format**: JSON (API responses) / CSV/Excel (bulk downloads)
- **File Size**: Variable (API responses: KB to MB, bulk downloads: GB+)
- **Number of Records**: 300+ million trade records since 1989
- **Compression**: API responses uncompressed, bulk downloads available in ZIP

### Schema & Key Fields
```
Core Trade Record Structure:
- trade_flow: string (Import/Export/Re-export)
- classification_system: string (HTS/NAICS/SITC)
- time_period: string (YYYY-MM format)
- country_code: string (ISO country codes)
- commodity_code: string (HTS/NAICS product codes)
- trade_value: float (USD value)
- quantity_1: float (Primary quantity measure)
- quantity_1_unit: string (Unit of measurement)
- quantity_2: float (Secondary quantity measure) 
- quantity_2_unit: string (Secondary unit)
- customs_district: string (Port/district of entry)
- rate_provision_code: string (Tariff rate information)
- duty_rate: float (Applied tariff rate)
- calculated_duty: float (Duty amount in USD)

Metadata Fields:
- report_date: date (When data was compiled)
- data_source: string (Census Bureau/BLS)
- confidentiality_flag: boolean (Data suppression indicator)
- revision_flag: boolean (Indicates revised data)
```

### Data Quality Indicators
- **Completeness**: >98% for trade values, ~85% for quantity data (some suppressed for confidentiality)
- **Consistency**: High - standardized government collection processes
- **Accuracy**: Official statistics with established validation procedures
- **Duplicates**: Minimal - robust deduplication in government systems

## Content Analysis

### Key Topics Covered
- [x] Import/export trade flows by country and commodity
- [x] Tariff rates and duty calculations
- [x] Trade balance analysis
- [x] Port-level trade statistics
- [x] Product classification data (HTS, NAICS, SITC)
- [x] Quantity and value metrics
- [x] Trade agreement preferences (NAFTA, etc.)
- [x] Special trade programs (GSP, CBI, etc.)
- [x] Customs district information
- [x] Time series trade data

### Financial Data Points Available
- **Direct Financial Metrics**: Trade values (USD), calculated duties, tariff rates, unit values
- **Indirect Indicators**: Trade imbalances, price anomalies, volume-value relationships
- **Predictive Elements**: Historical trends for forecasting, seasonal patterns, trade agreement impacts

### Entities & Classifications
- **Countries**: 240+ countries and territories (ISO standard codes)
- **Industries/Sectors**: All major industrial sectors via HTS/NAICS classification
- **Commodities/Products**: 17,000+ HTS product categories at 10-digit level
- **Companies**: Not directly identified (company-level data not public)
- **Government Bodies**: USITC, Census Bureau, CBP, BLS referenced in metadata

## Analysis Potential

### Suitable Analysis Types
- [x] Anomaly detection for trade misinvoicing
- [x] Time series analysis for trend identification
- [x] Network analysis of trade relationships
- [x] Price comparison analysis (transfer pricing detection)
- [x] Sanctions evasion pattern recognition
- [x] Trade flow correlation analysis
- [x] Geographic clustering analysis
- [x] Statistical outlier detection

### Integration Opportunities
- **Complementary Datasets**: UN Comtrade (mirror statistics), OFAC sanctions lists, corporate ownership databases, shipping manifests
- **Cross-Reference Potential**: Compare U.S. import data with partner country export data to identify discrepancies
- **Temporal Alignment**: Monthly alignment with most global trade databases, daily alignment with sanctions updates

## Technical Implementation

### Preprocessing Requirements
- **Data Cleaning**: Handle confidential data markers (*), standardize country codes, validate HTS transitions over time
- **Data Standardization**: Convert all values to consistent currency/units, normalize product classifications
- **Feature Extraction**: Calculate unit values, trade intensity ratios, year-over-year changes, price volatility measures
- **Filtering Criteria**: Filter by country risk levels, product categories of interest, value thresholds, time periods

### RAG/MCP Considerations
- **Chunking Strategy**: Chunk by country-commodity-time combinations for semantic search, maintain trade flow context
- **Metadata Tags**: Country, product category, trade direction, time period, value range, customs district
- **Search Keywords**: Country names, product descriptions, HTS codes, trade flow types, customs districts
- **Context Windows**: Include 12-month rolling windows for seasonal analysis, 3-year windows for trend analysis

### Known Limitations
- **Bias**: U.S.-centric view of global trade, potential underreporting of small shipments
- **Coverage Gaps**: Services trade not included, some data suppressed for confidentiality, company identities not available
- **Technical Issues**: 
  - HTS code changes over time require careful mapping
  - "Dataweb is in data load mode" errors during system updates
  - API unavailable during data loading periods
  - Some legacy data formatting inconsistencies
  - Manual query updates may not always be processable (use saved queries for complex operations)
- **Temporal Lag**: 1-2 month delay for final statistics, preliminary data may be revised
- **Query Limitations**: Web interface limited to 10,000 rows display, downloads limited to 300,000 rows maximum

## Usage Guidelines

### Best Practices
1. Always account for HTS code changes when analyzing multi-year trends
2. Cross-reference with partner country data when possible to validate accuracy
3. Use unit value analysis (value/quantity) to identify potential misinvoicing
4. Filter out confidential/suppressed data points marked with asterisks
5. Consider seasonal adjustment for agricultural and consumer goods

### Common Pitfalls
- Ignoring HTS code evolution leading to false trend breaks
- Misinterpreting confidential data suppressions as zero values
- Comparing incompatible classification systems across time periods
- Overlooking re-export flows when analyzing country origins
- Using preliminary data without checking for subsequent revisions
- Attempting complex manual query modifications instead of using saved queries from web interface
- Not handling "data load mode" errors during system maintenance periods
- Exceeding row limits without implementing pagination or filtering strategies

### Ethical Considerations
- **Source Attribution**: Credit USITC and U.S. Department of Commerce as data sources
- **Privacy Concerns**: Individual shipment details are aggregated; no personal information exposed
- **Bias Mitigation**: Acknowledge U.S. perspective limitation; supplement with international sources for complete analysis

## Sample Data & Examples

### Representative Sample
```json
{
  "trade_flow": "Import",
  "classification_system": "HTS",
  "time_period": "2024-10",
  "country_code": "CH",
  "country_name": "China",
  "commodity_code": "8471300090",
  "commodity_description": "Portable automatic data processing machines",
  "trade_value": 2547823.45,
  "quantity_1": 15234,
  "quantity_1_unit": "Number",
  "customs_district": "San Francisco, CA",
  "unit_value": 167.23,
  "duty_rate": 0.0,
  "calculated_duty": 0.0
}
```

### Key Insights Demonstrated
- Unit value anomalies can indicate potential trade misinvoicing (e.g., luxury goods priced as basic commodities)
- Sudden shifts in trade partner countries may suggest sanctions evasion routes
- Comparison of import/export unit values between countries reveals pricing discrepancies

## Maintenance & Updates

### Data Freshness
- **Last Updated**: Monthly around 15th of following month
- **Update Process**: Automated from Census Bureau trade data systems
- **Version Control**: Monthly releases with revision indicators for adjusted data

### Quality Monitoring
- **Validation Checks**: Automated consistency checks against historical patterns and partner country data
- **Issue Tracking**: USITC maintains data quality feedback system
- **Change Log**: HTS code changes documented annually, major methodology changes announced via Federal Register

## API Endpoints & Technical Details

### Base URLs & Authentication
- **Primary API Base URL**: `https://datawebws.usitc.gov/dataweb`
- **Authentication Method**: Bearer Token
- **API Key**: `eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyMDAyOTM2IiwianRpIjoiNWJmNTFmMjctMDM5Ny00NTNlLTk4YTYtZjJiMTM3MjhlMTEzIiwiaXNzIjoiZGF0YXdlYiIsImlhdCI6MTc1NDkyMTgwMiwiZXhwIjoxNzcwNDczODAyfQ.fR0_nR37GSILC3Pg0CLTCF0Va4G1jDTl_5RKSvi9BDfmdbQiy728mCuQrBYMdEPsWbvDC4afoWH_7u5ZUSVxDg`
- **Rate Limits**: Not publicly specified (reasonable use expected)
- **API Version**: v2

### Core Endpoints

#### Query/Search Endpoints
- **POST** `/api/v2/report2/runReport`
  - **Purpose**: Execute complex trade data queries with multiple filters and aggregations
  - **Parameters**: 
    - `searchOptions` (required): Complex nested object defining query parameters
      - `componentSettings`: Time period, data measures, scale
      - `countries`: Country selection and aggregation settings
      - `commodities`: Product classification and grouping
      - `MiscGroup`: Districts, programs, rate provision codes
    - `reportOptions` (required): Output format settings
      - `tradeType`: Import/Export/GenImp/TotExp/Balance/ForeignExp/ImpExp
      - `classificationSystem`: QUICK/HTS/SIC/SITC/NAIC/EXPERT
    - `sortingAndDataFormat` (optional): Sort order and display preferences
  - **Response Format**: JSON with nested table structure containing column definitions and row data
  - **Example**: Complex nested JSON object (see Sample API Request section)

- **GET** `/api/v2/savedQuery/getAllSavedQueries`
  - **Purpose**: Retrieve user's saved queries for reuse and modification
  - **Parameters**: None (uses authentication token for user-specific queries)
  - **Response Format**: Array of complete saved query objects with full parameter structure
  - **Use Case**: Extract exact query parameters for complex searches created via web interface

#### Reference Data Endpoints

##### Country Data
- **GET** `/api/v2/country/getAllCountries`
  - **Purpose**: Get complete list of country codes, names, and metadata
  - **Parameters**: None
  - **Response Format**: `{"options": [{"value": "code", "name": "Country Name"}]}`
  - **Example**: Returns all 240+ countries with standardized codes

- **GET** `/api/v2/country/getAllUserGroupsWithCountries`
  - **Purpose**: Retrieve user-defined country groups and their member countries
  - **Parameters**: None (user-specific via authentication)
  - **Response Format**: Array of country group objects with embedded country lists
  - **Use Case**: Access custom country groupings for regional analysis

##### Commodity/Product Data
- **POST** `/api/v2/commodity/getAllSystemGroupsWithCommodities`
  - **Purpose**: Get system-managed commodity groups (currently none available)
  - **Parameters**: 
    - `tradeType`: "Import" or "Export"
    - `classificationSystem`: "HTS", "NAICS", "SITC", etc.
    - `timeframesSelectedTab`: "fullYears" or date range type
  - **Response Format**: Array of commodity group objects
  - **Note**: Currently returns empty - no system-managed groups exist

- **POST** `/api/v2/commodity/getAllUserGroupsWithCommodities`
  - **Purpose**: Retrieve user-saved commodity groups with member products
  - **Parameters**: Same as system groups endpoint
  - **Response Format**: Array of user-defined commodity group objects
  - **Use Case**: Access custom product groupings for sector analysis

##### Program and Tariff Data
- **POST** `/api/v2/query/getImportPrograms`
  - **Purpose**: Get list of special import programs (GSP, NAFTA, etc.)
  - **Parameters**: 
    - `tradeType`: "Import" (required)
  - **Response Format**: Array of program objects with codes and descriptions
  - **Availability**: Only available for Import trade flow
  - **Use Case**: Analyze trade under preferential programs

- **POST** `/api/v2/query/getRPCodesList`
  - **Purpose**: Get rate provision codes for tariff analysis
  - **Parameters**: 
    - `tradeType`: "Import" or "Export"
  - **Response Format**: Array of rate provision code objects with descriptions
  - **Use Case**: Filter by specific tariff categories and duty rates

##### District Data
- **GET** `/api/v2/district/getAllDistricts`
  - **Purpose**: Get complete list of customs districts (ports of entry)
  - **Parameters**: None
  - **Response Format**: Array of district objects with codes and names
  - **Use Case**: Analyze trade flows by port of entry for geographic patterns

- **GET** `/api/v2/district/getAllUserGroupsWithDistricts`
  - **Purpose**: Retrieve user-saved district groups
  - **Parameters**: None (user-specific)
  - **Response Format**: Array of custom district group objects
  - **Use Case**: Analyze trade through grouped ports/regions

### Sample Query Structure
Based on the official documentation, here's the complete structure for the `basicQuery` object:

```json
{
    "savedQueryName": "",
    "savedQueryDesc": "",
    "isOwner": true,
    "runMonthly": false,
    "reportOptions": {
        "tradeType": "Import",  // Import/Export/GenImp/TotExp/Balance/ForeignExp/ImpExp
        "classificationSystem": "HTS"  // QUICK/HTS/SIC/SITC/NAIC/EXPERT
    },
    "searchOptions": {
        "componentSettings": {
            "dataToReport": ["CONS_FIR_UNIT_QUANT"],  // Data measures to include
            "scale": "1",  // Scaling factor
            "timeframeSelectType": "fullYears",  // fullYears/specificDateRange
            "years": ["2022", "2023"],  // Year selection for fullYears
            "startDate": null,  // MM/YYYY format for date ranges
            "endDate": null,    // MM/YYYY format for date ranges
            "yearsTimeline": "Annual"  // Annual/Monthly aggregation
        },
        "countries": {
            "aggregation": "Aggregate Countries",  // Aggregate Countries/Break Out Countries
            "countries": [],  // Array of country codes
            "countriesExpanded": [{"name": "All Countries", "value": "all"}],
            "countriesSelectType": "all",  // all/list
            "countryGroups": {
                "systemGroups": [],
                "userGroups": []
            }
        },
        "commodities": {
            "aggregation": "Aggregate Commodities",
            "codeDisplayFormat": "YES",
            "commodities": [],
            "commoditiesExpanded": [],
            "commoditiesManual": "",
            "commodityGroups": {
                "systemGroups": [],
                "userGroups": []
            },
            "commoditySelectType": "all",
            "granularity": "2"
        },
        "MiscGroup": {
            "districts": {
                "aggregation": "Aggregate District",
                "districtGroups": {"userGroups": []},
                "districts": [],
                "districtsExpanded": [{"name": "All Districts", "value": "all"}],
                "districtsSelectType": "all"
            },
            "extImportPrograms": {
                "aggregation": "Aggregate CSC",
                "extImportPrograms": [],
                "extImportProgramsExpanded": [],
                "programsSelectType": "all"
            },
            "provisionCodes": {
                "aggregation": "Aggregate RPCODE",
                "provisionCodesSelectType": "all",
                "rateProvisionCodes": [],
                "rateProvisionCodesExpanded": []
            }
        }
    },
    "sortingAndDataFormat": {
        "DataSort": {
            "columnOrder": [],
            "fullColumnOrder": [],
            "sortOrder": []
        },
        "reportCustomizations": {
            "exportCombineTables": false,
            "showAllSubtotal": true,
            "subtotalRecords": "",
            "totalRecords": "20000",
            "exportRawData": false
        }
    }
}
```

### Python Implementation Example
```python
import pandas as pd
import requests

# Configuration
token = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyMDAyOTM2IiwianRpIjoiNWJmNTFmMjctMDM5Ny00NTNlLTk4YTYtZjJiMTM3MjhlMTEzIiwiaXNzIjoiZGF0YXdlYiIsImlhdCI6MTc1NDkyMTgwMiwiZXhwIjoxNzcwNDczODAyfQ.fR0_nR37GSILC3Pg0CLTCF0Va4G1jDTl_5RKSvi9BDfmdbQiy728mCuQrBYMdEPsWbvDC4afoWH_7u5ZUSVxDg'
baseUrl = 'https://datawebws.usitc.gov/dataweb'
headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Bearer " + token
}

# Basic query execution
response = requests.post(baseUrl + '/api/v2/report2/runReport', 
                        headers=headers, json=basicQuery, verify=False)

# Extract data from nested JSON response
def extract_trade_data(response_json):
    tables = response_json['dto']['tables']
    if not tables:
        return pd.DataFrame()
    
    table = tables[0]
    
    # Extract column headers
    columns = []
    for group in table['column_groups']:
        for col in group['columns']:
            columns.append(col['label'])
    
    # Extract row data
    data = []
    for row in table['row_groups'][0]['rowsNew']:
        row_data = [entry['value'] for entry in row['rowEntries']]
        data.append(row_data)
    
    return pd.DataFrame(data, columns=columns)

# Convert to DataFrame
df = extract_trade_data(response.json())
```

### Error Handling
- **Common Error Codes**:
  - `400`: Bad Request - Invalid query structure or parameters
  - `401`: Unauthorized - Invalid or expired API token
  - `403`: Forbidden - Insufficient permissions for requested data
  - `404`: Not Found - Invalid endpoint or resource
  - `429`: Rate Limited - Too many requests (if implemented)
  - `500`: Server Error - Database or internal processing error
  - `503`: Service Unavailable - "Dataweb is in data load mode" during updates

## Integration Notes

### API/Access Information
- **Access Method**: RESTful API with JSON payloads
- **Authentication**: Bearer token in Authorization header
- **Rate Limits**: Reasonable use policy (no hard limits published)

### Dependencies
- **Required Libraries**: requests, pandas (Python), httr, jsonlite (R)
- **Environment Setup**: HTTPS capability required, JSON processing
- **System Requirements**: Minimal - API responses typically <10MB

## Contact & Support

### Dataset Maintainer
- **Name**: USITC DataWeb Team
- **Email**: dataweb@usitc.gov
- **Last Review Date**: January 2025

### Issue Reporting
- **Bug Reports**: Contact dataweb@usitc.gov for technical issues
- **Enhancement Requests**: Submit through USITC website feedback
- **Documentation Updates**: API documentation at https://datawebws.usitc.gov/dataweb/swagger-ui/

---

## Quick Start Checklist for AI Models

For MCP/RAG systems, this dataset is best used for:
- [x] Trade misinvoicing detection through unit value analysis
- [x] Sanctions evasion pattern identification
- [x] Anomalous trade relationship discovery
- [x] Cross-border financial flow analysis

Key search terms for retrieval: `trade misinvoicing, sanctions evasion, unit value analysis, customs district, HTS codes, trade anomalies, price manipulation, tariff avoidance`

Most valuable fields for analysis: `trade_value, quantity_1, country_code, commodity_code, unit_value, customs_district, time_period`

Recommended preprocessing: `Calculate unit values, identify statistical outliers, normalize for inflation, filter by risk countries, aggregate by product categories`