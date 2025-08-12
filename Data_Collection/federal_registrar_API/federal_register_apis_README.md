# Dataset Name: Federal Register API Access Suite

## Dataset Overview

### Quick Summary
- **Dataset Type**: Policy Documents / Regulatory Data / Government Publications
- **Primary Focus**: Trade Policy / Regulatory Impact / Federal Agency Actions / Tariff Announcements
- **Time Range**: Historical to real-time (varies by API: 1994+ for Federal Register, current for Regulations.gov)
- **Geographic Scope**: US Federal government actions with international trade implications
- **Update Frequency**: Real-time to daily updates across different APIs
- **Data Quality**: High - Official government sources with verified API keys and direct access

### Business Value for Tariff Impact Analysis
- **Primary Use Case**: Track real-time tariff announcements, regulatory changes, trade policy documents, and agency actions that affect import/export costs
- **Financial Impact Prediction Relevance**: Critical for early detection of tariff changes before implementation, regulatory impact assessments, and policy sentiment analysis for predictive modeling
- **Affected Stakeholders**: Import/export businesses, customs brokers, trade lawyers, policy analysts, supply chain managers, economists tracking regulatory impacts

## Dataset Structure & Format

### File Information
- **File Format**: JSON (API responses), XML (bulk downloads), HTML (Federal Register API Explorer interface)
- **File Size**: Variable (single documents ~50KB, bulk collections 100MB-1GB+)
- **Number of Records**: ~80,000+ Federal Register documents annually, millions of regulatory documents
- **Compression**: ZIP for bulk downloads, real-time JSON for API calls

### Schema & Key Fields
```
Federal Register API (federalregister.gov):
- title: Document title
- abstract: Executive summary
- type: RULE, PRORULE, NOTICE, PRESDOCU
- agencies: [Array of agency objects with name, slug]
- publication_date: YYYY-MM-DD
- effective_on: YYYY-MM-DD (when rule takes effect)
- document_number: Unique identifier (e.g., 2019-24499)
- docket_id: Related regulatory docket
- pdf_url: PDF download link
- html_url: HTML version link
- raw_text_url: Plain text version

GovInfo API (api.govinfo.gov):
- packageId: Unique package identifier
- title: Document/collection title
- dateIssued: Publication date
- packageLink: Direct download URL
- lastModified: Last update timestamp
- collections: FR (Federal Register), CFR (Code of Federal Regulations)
- granuleCount: Number of documents in package

Regulations.gov API (api.regulations.gov):
- docketId: Regulatory docket identifier
- title: Regulation title
- docketType: Rulemaking, Nonrulemaking
- agencyId: Responsible agency code
- commentStartDate/commentEndDate: Public comment period
- attributes: Detailed regulatory metadata
- documentType: Rule, Proposed Rule, Supporting Material
```

### Data Quality Indicators
- **Completeness**: >95% for core fields, ~80% for optional metadata fields
- **Consistency**: Standardized government formats with official validation
- **Accuracy**: Direct from source agencies with real-time updates
- **Duplicates**: Minimal - unique identifiers prevent duplication across APIs

## Content Analysis

### Key Topics Covered
- [x] Tariff announcements/changes (Federal Register rules and notices)
- [x] Trade negotiations (regulatory proceedings and public comments)
- [x] Economic impact assessments (regulatory impact analyses in rulemaking)
- [x] Industry-specific effects (sector-specific regulations and tariffs)
- [x] Supply chain disruptions (regulatory changes affecting imports)
- [x] Political rhetoric/policy positions (presidential documents and agency statements)
- [x] Market reactions (regulatory responses to economic conditions)
- [x] International relations (trade-related federal actions and agreements)
- [x] Consumer price impacts (regulatory analysis requirements)

### Financial Data Points Available
- **Direct Financial Metrics**: Cost-benefit analyses in regulatory documents, tariff rate specifications, economic impact assessments, trade volume projections
- **Indirect Indicators**: Regulatory burden estimates, compliance costs, agency priority signals, policy implementation timelines
- **Predictive Elements**: Proposed rules (future policy), effective dates (implementation timing), comment periods (policy development stage)

### Entities & Classifications
- **Countries**: All countries mentioned in trade-related regulations and tariff schedules
- **Industries/Sectors**: All sectors covered by federal regulation (NAICS-coded in many documents)
- **Commodities/Products**: Specific products mentioned in tariff schedules and trade regulations
- **Companies**: Companies mentioned in regulatory proceedings, public comments, and enforcement actions
- **Government Bodies**: All federal agencies (USTR, Commerce, Customs, Treasury, etc.), congressional committees, White House offices

## Analysis Potential

### Suitable Analysis Types
- [x] Sentiment analysis (regulatory tone, policy direction analysis)
- [x] Named entity recognition (companies, products, countries, officials)
- [x] Time series analysis (regulatory activity patterns, policy trends)
- [x] Impact correlation analysis (regulatory announcements vs. market/trade reactions)
- [x] Predictive modeling (policy implementation timing, regulatory outcomes)
- [x] Text classification (document types, regulatory categories, urgency levels)
- [x] Network analysis (agency relationships, stakeholder connections, docket participation)
- [x] Other: Policy timeline reconstruction, regulatory burden quantification, stakeholder influence mapping

### Integration Opportunities
- **Complementary Datasets**: USITC tariff databases (same products/HTS codes), trade statistics, economic indicators, congressional documents
- **Cross-Reference Potential**: Validate tariff database updates with Federal Register announcements, correlate regulatory activity with trade flow changes
- **Temporal Alignment**: Real-time policy announcements provide early indicators for economic datasets, regulatory effective dates align with tariff implementation

## Technical Implementation

### Preprocessing Requirements
- **Text Cleaning**: Remove regulatory formatting, extract structured data from PDF/HTML, standardize agency names and document types
- **Data Standardization**: Normalize dates across different formats, standardize agency identifiers, clean product/commodity references
- **Feature Extraction**: Extract financial figures, effective dates, affected products/industries, stakeholder mentions, geographic references
- **Filtering Criteria**: Focus on trade-related documents, tariff-specific regulations, international commerce rules, specific agency actions

### RAG/MCP Considerations
- **Chunking Strategy**: Chunk by regulatory sections (preamble, analysis, rule text), by topic (tariffs, specific industries), or by document type
- **Metadata Tags**: agency, document_type, effective_date, affected_industries, trade_relevance, financial_impact, urgency_level
- **Search Keywords**: tariff, trade, import, export, duty, customs, international, commerce, economic impact, regulatory analysis
- **Context Windows**: Include full regulatory context (background, analysis, rule text) for complete understanding of policy changes

### Known Limitations
- **Bias**: US government perspective only, regulatory language may obscure true policy intent
- **Coverage Gaps**: Some inter-agency coordination not captured, informal policy guidance may be missing
- **Technical Issues**: PDF parsing challenges, inconsistent formatting across agencies, API rate limits during high-traffic periods
- **Temporal Lag**: Some documents published after policy implementation, complex rules may have delayed effective dates

## Usage Guidelines

### Best Practices
1. Monitor multiple APIs simultaneously for comprehensive coverage of trade policy developments
2. Set up automated alerts for trade-related keywords to capture breaking policy changes
3. Cross-reference Federal Register announcements with USITC tariff database updates for validation
4. Track comment periods and public participation to gauge industry and stakeholder reactions

### Common Pitfalls
- Assuming all Federal Register documents are final (many are proposed rules requiring further action)
- Overlooking effective dates (policies may be announced months before implementation)
- Missing inter-agency coordination (trade policies often involve multiple agencies)
- Ignoring comment periods and public feedback that may change final rules

### Ethical Considerations
- **Source Attribution**: All documents are public domain but should cite specific Federal Register citations
- **Privacy Concerns**: Public comments may contain business-sensitive information submitted by stakeholders
- **Bias Mitigation**: Supplement US government sources with international trade organization data and foreign government positions

## Sample Data & Examples

### Representative Sample
```
Federal Register Rule (Tariff Change):
{
  "title": "Modifications to the Harmonized Tariff Schedule of the United States",
  "abstract": "CBP is modifying the HTS to correct technical errors and implement trade agreement obligations...",
  "type": "RULE",
  "agencies": [{"name": "Customs and Border Protection", "slug": "customs-and-border-protection"}],
  "publication_date": "2024-03-15",
  "effective_on": "2024-06-15",
  "document_number": "2024-12345",
  "docket_id": "CBP-2024-0001",
  "pdf_url": "https://www.federalregister.gov/documents/2024/03/15/2024-12345/modifications-to-the-harmonized-tariff-schedule.pdf"
}

GovInfo Package (Bulk Federal Register):
{
  "packageId": "FR-2024-03-15",
  "title": "Federal Register Volume 89, Number 52",
  "dateIssued": "2024-03-15",
  "packageLink": "https://www.govinfo.gov/content/pkg/FR-2024-03-15",
  "lastModified": "2024-03-15T09:00:00Z",
  "granuleCount": 47
}

Regulations.gov Docket:
{
  "docketId": "USTR-2024-0001",
  "title": "Request for Comments on China Trade Relations",
  "docketType": "Nonrulemaking",
  "agencyId": "USTR",
  "commentStartDate": "2024-01-15",
  "commentEndDate": "2024-03-15",
  "commentCount": 1247
}
```

### Key Insights Demonstrated
- Policy implementation lag: Rules published in March with June effective dates provide 3-month advance notice
- Multi-agency coordination: Trade policies often involve CBP (implementation), USTR (negotiation), and Commerce (analysis)
- Public engagement: Significant stakeholder participation (1200+ comments) indicates high industry interest/impact

## Maintenance & Updates

### Data Freshness
- **Last Updated**: Real-time for Federal Register API, daily bulk updates for GovInfo
- **Update Process**: Automatic API updates, manual monitoring for new collections and document types
- **Version Control**: APIs maintain version history, Federal Register provides official publication dates

### Quality Monitoring
- **Validation Checks**: API key verification (pre-configured keys: 8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn), response format validation, error handling for rate limits
- **Issue Tracking**: Monitor API status pages, track response time and availability
- **Change Log**: Federal Register publishes daily updates, agencies announce API changes through official channels

## API Endpoints & Technical Details

### Base URLs & Authentication
- **Federal Register API Base URL**: `https://www.federalregister.gov/api/v1/`
- **GovInfo API Base URL**: `https://api.govinfo.gov/`
- **Regulations.gov API Base URL**: `https://api.regulations.gov/v4/`
- **Authentication Method**: API key for GovInfo and Regulations.gov, none for Federal Register
- **API Key**: `8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn` (pre-configured)
- **Rate Limits**: 1000 requests/hour per API
- **API Version**: Federal Register v1, GovInfo latest, Regulations.gov v4

### Federal Register API Endpoints
#### Document Search & Retrieval
- **GET** `/api/v1/articles.json`
  - **Purpose**: Search and retrieve Federal Register documents
  - **Parameters**: 
    - `conditions[term]` (optional): Search term/keywords
    - `conditions[type]` (optional): RULE, PRORULE, NOTICE, PRESDOCU
    - `conditions[agencies][]` (optional): Agency slug (e.g., customs-and-border-protection)
    - `conditions[publication_date][gte]` (optional): Date from (YYYY-MM-DD)
    - `conditions[publication_date][lte]` (optional): Date to (YYYY-MM-DD)
    - `per_page` (optional): Results per page (default: 20, max: 1000)
    - `page` (optional): Page number for pagination
  - **Response Format**: JSON with results array containing document objects
  - **Example**: `GET /api/v1/articles.json?conditions[term]=tariff&conditions[type]=RULE&per_page=50`

- **GET** `/api/v1/articles/{document_number}.json`
  - **Purpose**: Get detailed information for specific document
  - **Parameters**: 
    - `document_number` (required): Document number (e.g., 2024-12345)
  - **Response Format**: JSON with full document details, PDFs, HTML links
  - **Example**: `GET /api/v1/articles/2024-12345.json`

#### Agency Information
- **GET** `/api/v1/agencies.json`
  - **Purpose**: Get list of all federal agencies
  - **Parameters**: None
  - **Response Format**: Array of agency objects with name, slug, id
  - **Example**: `GET /api/v1/agencies.json`

### GovInfo API Endpoints
#### Collections Access
- **GET** `/collections`
  - **Purpose**: Get list of all available collections
  - **Parameters**: 
    - `api_key` (required): Authentication key
  - **Response Format**: Array of collection objects
  - **Example**: `GET /collections?api_key=8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn`

- **GET** `/collections/{collection}/{startDate}`
  - **Purpose**: Get packages for specific collection since a date
  - **Parameters**: 
    - `collection` (required): Collection code (e.g., FR, CFR)
    - `startDate` (required): ISO date format (YYYY-MM-DDTHH:MM:SSZ)
    - `api_key` (required): Authentication key
    - `offsetMark` (optional): Pagination marker (default: *)
    - `pageSize` (optional): Results per page (default: 100, max: 1000)
  - **Response Format**: JSON with packages array and pagination info
  - **Example**: `GET /collections/FR/2024-01-01T00:00:00Z?offsetMark=*&pageSize=100&api_key=8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn`

#### Published Documents
- **GET** `/published/{date}`
  - **Purpose**: Get all documents published on specific date
  - **Parameters**: 
    - `date` (required): Publication date (YYYY-MM-DD)
    - `api_key` (required): Authentication key
    - `offsetMark` (optional): Pagination marker
    - `pageSize` (optional): Results per page
  - **Response Format**: JSON with published packages for that date
  - **Example**: `GET /published/2024-03-15?api_key=8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn`

#### Advanced Search
- **POST** `/search`
  - **Purpose**: Advanced search across all GovInfo content
  - **Parameters**: 
    - `api_key` (required): Authentication key
  - **Request Body**: JSON with search parameters:
    ```json
    {
      "query": "collection:(FR) AND tariff",
      "pageSize": 100,
      "offsetMark": "*",
      "sorts": [
        { "field": "lastModified", "sortOrder": "DESC" }
      ]
    }
    ```
  - **Response Format**: JSON with search results and metadata
  - **Example**: `POST /search?api_key=8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn`

### Bulk Download Endpoints
- **GET** `https://www.govinfo.gov/bulkdata/FR/{year}/{year}-{month}.zip`
  - **Purpose**: Download bulk Federal Register XML files
  - **File Formats**: XML, MODS metadata
  - **Size Limits**: Monthly files ~500MB-2GB, annual collections 10GB+
  - **Compression**: ZIP format
  - **Example**: `https://www.govinfo.gov/bulkdata/FR/2024/2024-03.zip`

### Regulations.gov API Endpoints
#### Document Search
- **GET** `/v4/documents`
  - **Purpose**: Search regulatory documents
  - **Parameters**: 
    - `api_key` (required): Authentication key
    - `page[size]` (optional): Results per page (default: 25, max: 250)
    - `page[number]` (optional): Page number
    - `filter[agencyId]` (optional): Agency code (e.g., EPA, SEC, FDA)
    - `filter[searchTerm]` (optional): Search keywords
  - **Response Format**: JSON with documents array and pagination info
  - **Example**: `GET /v4/documents?api_key=8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn&filter[agencyId]=USTR`

#### Docket Search
- **GET** `/v4/dockets`
  - **Purpose**: Search regulatory dockets
  - **Parameters**: 
    - `api_key` (required): Authentication key
    - `page[size]` (optional): Results per page
    - `filter[agencyId]` (optional): Agency filter
  - **Response Format**: JSON with dockets array containing regulatory proceedings
  - **Example**: `GET /v4/dockets?api_key=8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn`

#### Comment Search
- **GET** `/v4/comments`
  - **Purpose**: Search public comments on regulations
  - **Parameters**: 
    - `api_key` (required): Authentication key
    - `filter[docketId]` (optional): Specific docket
    - `page[size]` (optional): Results per page
  - **Response Format**: JSON with public comments and metadata
  - **Example**: `GET /v4/comments?api_key=8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn`

### Error Handling
- **Common Error Codes**:
  - `400`: Bad Request - Invalid parameters or malformed request
  - `401`: Unauthorized - Missing or invalid API key
  - `403`: Forbidden - API key lacks required permissions
  - `404`: Not Found - Document/resource doesn't exist
  - `429`: Rate Limited - Too many requests, retry after delay
  - `500`: Server Error - API service temporarily unavailable

## Integration Notes

### API/Access Information
- **Access Method**: 
  - Federal Register: `https://www.federalregister.gov/api/v1/` (no key required)
  - GovInfo: `https://api.govinfo.gov/` (API key: 8Xh7gVkd75vu4uKUcQwmPCz2GLc1tuNEZxAtKJfn)
  - Regulations.gov: `https://api.regulations.gov/v4/` (verified api.data.gov key)
- **Authentication**: API keys pre-configured in Federal_Registrar_API_Explorer.html
- **Rate Limits**: 1000 requests/hour (Federal Register), 1000 requests/hour (GovInfo), 1000 requests/hour (Regulations.gov)

### Dependencies
- **Required Libraries**: `requests`, `json`, `pandas` for Python; browser-based interface available in HTML file
- **Environment Setup**: Internet connection required, JavaScript enabled for HTML interface
- **System Requirements**: Minimal - API calls are lightweight, bulk downloads may require significant storage

## Contact & Support

### Dataset Maintainer
- **Name**: Federal government APIs (official), Federal Register API Explorer (local interface)
- **Email**: Federal Register support through official channels, local questions via project documentation
- **Last Review Date**: August 2025

### Issue Reporting
- **Bug Reports**: Report API issues to respective government agencies, interface issues via project channels
- **Enhancement Requests**: Submit suggestions for additional API integration or interface improvements
- **Documentation Updates**: Maintain locally for project-specific enhancements

---

## Quick Start Checklist for AI Models

For MCP/RAG systems, this dataset is best used for:
- [x] Real-time tariff and trade policy monitoring
- [x] Regulatory impact analysis and prediction
- [x] Policy sentiment analysis and trend identification

Key search terms for retrieval: `tariff, trade, import, export, customs, duty, regulatory impact, federal register, agency action, effective date, economic analysis`

Most valuable fields for analysis: `title, abstract, type, agencies, publication_date, effective_on, document_number, docket_id`

Recommended preprocessing: `Extract financial figures and dates, standardize agency names, classify trade relevance, identify affected products/industries, track policy implementation timelines`