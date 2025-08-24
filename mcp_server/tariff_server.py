#!/usr/bin/env python3
"""
Simple Tariff Analysis MCP Server using FastMCP
This demonstrates the basic concepts of MCP with trade/tariff analysis tools.
"""

from mcp.server.fastmcp import FastMCP
from typing import Dict, List, Any
import json

# Create an MCP server
mcp = FastMCP("Tariff Analysis Server")

# ===== BASIC TOOLS =====

@mcp.tool()
def add_numbers(a: int, b: int) -> int:
    """Add two numbers together - basic test tool"""
    return a + b

@mcp.tool()
def greet(name: str = "Trade Analyst") -> str:
    """Greet someone by name"""
    return f"Hello, {name}! Welcome to the Tariff Analysis Server!"

# ===== TARIFF ANALYSIS TOOLS =====

@mcp.tool()
def calculate_tariff_cost(import_value: float, tariff_rate: float) -> Dict[str, float]:
    """
    Calculate the tariff cost and total cost including tariffs
    
    Args:
        import_value: Value of imported goods in USD
        tariff_rate: Tariff rate as a percentage (e.g., 25.0 for 25%)
    
    Returns:
        Dictionary with tariff calculations
    """
    tariff_cost = import_value * (tariff_rate / 100)
    total_cost = import_value + tariff_cost
    
    return {
        "import_value_usd": import_value,
        "tariff_rate_percent": tariff_rate,
        "tariff_cost_usd": round(tariff_cost, 2),
        "total_cost_usd": round(total_cost, 2),
        "cost_increase_percent": round((tariff_cost / import_value) * 100, 2)
    }

@mcp.tool()
def lookup_hts_code(hts_code: str) -> Dict[str, Any]:
    """
    Look up information for a Harmonized Tariff Schedule (HTS) code
    
    Args:
        hts_code: The HTS code to look up (e.g., "8703.23.00")
    
    Returns:
        Information about the HTS code and typical tariff rates
    """
    # Sample data - in a real implementation, this would query actual tariff databases
    sample_hts_data = {
        "8703.23.00": {
            "description": "Motor cars and other motor vehicles; other vehicles with spark-ignition engine (cylinder capacity > 1500cc but <= 3000cc)",
            "category": "Vehicles",
            "typical_tariff_rate": 2.5,
            "units": "Number",
            "special_rates": {
                "Most Favored Nation": 2.5,
                "General": 10.0
            }
        },
        "6203.42.40": {
            "description": "Men's or boys' trousers and shorts, of cotton (not knitted)",
            "category": "Textiles",
            "typical_tariff_rate": 16.6,
            "units": "Dozen pairs",
            "special_rates": {
                "Most Favored Nation": 16.6,
                "General": 90.0
            }
        },
        "0203.29.00": {
            "description": "Meat of swine, frozen (other cuts with bone in)",
            "category": "Agriculture",
            "typical_tariff_rate": 0.0,
            "units": "Kilograms",
            "special_rates": {
                "Most Favored Nation": 0.0,
                "General": 4.4
            }
        }
    }
    
    if hts_code in sample_hts_data:
        result = sample_hts_data[hts_code].copy()
        result["hts_code"] = hts_code
        result["status"] = "found"
        return result
    else:
        return {
            "hts_code": hts_code,
            "status": "not_found",
            "message": "HTS code not found in sample database"
        }

@mcp.tool()
def compare_tariff_scenarios(base_import_value: float, scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compare multiple tariff scenarios for impact analysis
    
    Args:
        base_import_value: Base value of imports in USD
        scenarios: List of scenarios, each with 'name' and 'tariff_rate'
    
    Returns:
        Comparison of costs across all scenarios
    """
    results = {
        "base_import_value": base_import_value,
        "scenarios": []
    }
    
    for scenario in scenarios:
        name = scenario.get("name", "Unnamed")
        tariff_rate = scenario.get("tariff_rate", 0.0)
        
        calculation = calculate_tariff_cost(base_import_value, tariff_rate)
        scenario_result = {
            "scenario_name": name,
            **calculation
        }
        results["scenarios"].append(scenario_result)
    
    # Find the scenario with lowest and highest costs
    if results["scenarios"]:
        lowest_cost = min(results["scenarios"], key=lambda x: x["total_cost_usd"])
        highest_cost = max(results["scenarios"], key=lambda x: x["total_cost_usd"])
        
        results["summary"] = {
            "lowest_cost_scenario": lowest_cost["scenario_name"],
            "lowest_total_cost": lowest_cost["total_cost_usd"],
            "highest_cost_scenario": highest_cost["scenario_name"],
            "highest_total_cost": highest_cost["total_cost_usd"],
            "cost_difference": round(highest_cost["total_cost_usd"] - lowest_cost["total_cost_usd"], 2)
        }
    
    return results

# ===== RESOURCES =====

@mcp.resource("tariff://sample_rates")
def get_sample_tariff_rates() -> str:
    """Get sample tariff rates for common products"""
    sample_data = {
        "dataset_info": {
            "name": "Sample Tariff Rates",
            "description": "Representative tariff rates for demonstration",
            "last_updated": "2024-08-13",
            "source": "MCP Demo Server"
        },
        "tariff_rates": [
            {
                "hts_code": "8703.23.00",
                "product": "Motor cars (1500-3000cc)",
                "category": "Vehicles", 
                "mfn_rate": 2.5,
                "general_rate": 10.0
            },
            {
                "hts_code": "6203.42.40", 
                "product": "Men's cotton trousers",
                "category": "Textiles",
                "mfn_rate": 16.6,
                "general_rate": 90.0
            },
            {
                "hts_code": "0203.29.00",
                "product": "Frozen pork cuts", 
                "category": "Agriculture",
                "mfn_rate": 0.0,
                "general_rate": 4.4
            },
            {
                "hts_code": "8471.30.01",
                "product": "Digital computers",
                "category": "Electronics", 
                "mfn_rate": 0.0,
                "general_rate": 35.0
            }
        ]
    }
    
    return json.dumps(sample_data, indent=2)

@mcp.resource("tariff://server_info")
def get_server_info() -> str:
    """Get information about this MCP server"""
    server_info = {
        "name": "Tariff Analysis MCP Server",
        "version": "1.0.0",
        "description": "A demonstration MCP server for tariff and trade analysis",
        "capabilities": [
            "Tariff cost calculations",
            "HTS code lookups", 
            "Scenario comparisons",
            "Sample data provision"
        ],
        "data_sources": [
            "Sample HTS database",
            "Demonstration tariff rates"
        ],
        "created_by": "Claude Code",
        "created_date": "2024-08-13"
    }
    
    return json.dumps(server_info, indent=2)

# This is important - allows the server to run directly
if __name__ == "__main__":
    print("Starting Tariff Analysis MCP Server...")
    print("======================================")
    print("Available tools:")
    print("- add_numbers: Basic math test")
    print("- greet: Welcome message")
    print("- calculate_tariff_cost: Calculate tariff costs")
    print("- lookup_hts_code: Look up HTS code information")
    print("- compare_tariff_scenarios: Compare multiple tariff scenarios")
    print("\nAvailable resources:")
    print("- tariff://sample_rates: Sample tariff rate data")
    print("- tariff://server_info: Server information")
    print("\nServer ready!")
    
    mcp.run()