# Tariff Analysis MCP Server

A simple Model Context Protocol (MCP) server for tariff and trade analysis, built using the FastMCP library.

## What is MCP?

Model Context Protocol (MCP) is a standard for connecting AI assistants (like Claude) to external data sources and tools. It allows:

- **Tools**: Functions that AI can call to perform actions
- **Resources**: Data sources that AI can read from
- **Prompts**: Reusable templates for AI interactions

## How This Server Works

### 1. **Tools** (Functions AI Can Call)
Our server provides these tools:

- `calculate_tariff_cost(import_value, tariff_rate)`: Calculates tariff costs and total costs
- `lookup_hts_code(hts_code)`: Looks up Harmonized Tariff Schedule codes  
- `compare_tariff_scenarios(base_value, scenarios)`: Compares multiple tariff scenarios
- `greet(name)` and `add_numbers(a, b)`: Basic test tools

### 2. **Resources** (Data AI Can Access)
The server exposes these data resources:

- `tariff://sample_rates`: Sample tariff rates for common products
- `tariff://server_info`: Information about the server capabilities

### 3. **How It Connects to Claude**
When you connect this server to Claude:

1. Claude can **call tools** to perform calculations
2. Claude can **read resources** to get current data 
3. Claude can combine both to provide comprehensive analysis

## Example Usage

### Tool Call Example:
```python
# Claude can call this tool:
calculate_tariff_cost(import_value=100000, tariff_rate=25.0)

# Returns:
{
  "import_value_usd": 100000,
  "tariff_rate_percent": 25.0,
  "tariff_cost_usd": 25000.0,
  "total_cost_usd": 125000.0,
  "cost_increase_percent": 25.0
}
```

### Resource Access Example:
```python
# Claude can read this resource:
GET tariff://sample_rates

# Returns sample tariff data for analysis
```

## Installation and Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   python tariff_server.py
   ```

3. **Connect to Claude:**
   - Add this server to your Claude configuration
   - Claude will discover available tools and resources automatically

## Server Architecture

```
tariff_server.py
├── Tools (@mcp.tool())
│   ├── calculate_tariff_cost()
│   ├── lookup_hts_code() 
│   ├── compare_tariff_scenarios()
│   └── basic test tools
│
├── Resources (@mcp.resource())
│   ├── tariff://sample_rates
│   └── tariff://server_info
│
└── FastMCP Framework
    ├── Automatic JSON-RPC handling
    ├── Type validation
    └── Transport management
```

## Key Benefits of MCP

1. **Standardized**: Uses the official MCP protocol
2. **Type-Safe**: Automatic validation of inputs/outputs
3. **Discoverable**: Claude automatically finds available tools/resources
4. **Extensible**: Easy to add new tools and data sources
5. **Real-Time**: Live connection between Claude and your data

## Next Steps

This basic server demonstrates core MCP concepts. We can extend it by:

1. **Adding real data sources** (BEA API, Census API, etc.)
2. **Implementing authentication** for protected resources
3. **Adding more sophisticated analysis tools**
4. **Connecting to live databases**
5. **Adding progress reporting** for long operations

The FastMCP framework makes it easy to add these capabilities incrementally!