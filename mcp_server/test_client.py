import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_server():
    server_params = StdioServerParameters(
        command="python",
        args=["tariff_server.py"]
    )
    
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                print("=== Testing Tools ===")
                
                # Test basic math
                result = await session.call_tool("add_numbers", {"a": 5, "b": 3})
                print(f"add_numbers(5, 3): {result.content[0].text}")
                
                # Test tariff calculation
                result = await session.call_tool("calculate_tariff_cost", {
                    "import_value": 10000,
                    "tariff_rate": 25.0
                })
                print(f"Tariff calculation: {result.content[0].text}")
                
                # Test HTS lookup
                result = await session.call_tool("lookup_hts_code", {
                    "hts_code": "8703.23.00"
                })
                print(f"HTS lookup: {result.content[0].text}")
                
                # Test scenario comparison
                result = await session.call_tool("compare_tariff_scenarios", {
                    "base_import_value": 100000,
                    "scenarios": [
                        {"name": "Current", "tariff_rate": 10.0},
                        {"name": "Proposed", "tariff_rate": 25.0},
                        {"name": "High", "tariff_rate": 50.0}
                    ]
                })
                print(f"Scenario comparison: {result.content[0].text}")
                
                print("\n=== Testing Resources ===")
                
                # Test resources
                from pydantic import AnyUrl
                
                resource = await session.read_resource(AnyUrl("tariff://sample_rates"))
                print(f"Sample rates: {resource.contents[0].text}")
                
                resource = await session.read_resource(AnyUrl("tariff://server_info"))
                print(f"Server info: {resource.contents[0].text}")
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_server())