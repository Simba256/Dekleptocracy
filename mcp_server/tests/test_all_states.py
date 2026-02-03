#!/usr/bin/env python3
"""
Comprehensive API test suite for all US states
Tests all 7 data types across all 50 states + DC
"""

import requests
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# Configuration
MCP_SERVER_URL = "https://dekleptocracy-production.up.railway.app"
TIMEOUT = 60

# All US states + DC
ALL_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
    'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
]

# Data types to test with their expected fields
DATA_TYPES = [
    {
        'name': 'unemployment',
        'tool': 'get_bls_unemployment_by_state',
        'args': {},
        'required_fields': ['value', 'displayValue', 'change', 'changeDisplay'],
        'change_required': True  # change should not be null
    },
    {
        'name': 'electricity',
        'tool': 'get_electricity_prices_by_state',
        'args': {'sector': 'RES'},
        'required_fields': ['value', 'displayValue', 'change', 'changeDisplay'],
        'change_required': True
    },
    {
        'name': 'gas_prices',
        'tool': 'get_gasoline_prices_by_state',
        'args': {},
        'required_fields': ['value', 'displayValue', 'change', 'changeDisplay'],
        'change_required': True
    },
    {
        'name': 'food_prices',
        'tool': 'get_usda_food_prices',
        'args': {},
        'required_fields': ['value', 'displayValue'],
        'change_required': False  # USDA doesn't have historical change
    },
    {
        'name': 'grocery_basket',
        'tool': 'get_usda_grocery_basket',
        'args': {},
        'required_fields': ['stateValue', 'changeDisplay'],
        'change_required': False
    },
    {
        'name': 'gdp',
        'tool': 'get_bea_state_gdp',
        'args': {},
        'required_fields': ['value', 'displayValue', 'change', 'changeDisplay'],
        'change_required': True
    },
    {
        'name': 'personal_income',
        'tool': 'get_bea_state_personal_income',
        'args': {},
        'required_fields': ['value', 'displayValue', 'change', 'changeDisplay'],
        'change_required': True
    }
]

# FRED fallback tools
FALLBACK_TOOLS = [
    {
        'name': 'fred_unemployment',
        'tool': 'get_fred_state_unemployment',
        'args': {},
        'required_fields': ['value', 'displayValue'],
        'change_required': False
    },
    {
        'name': 'fred_gdp',
        'tool': 'get_fred_state_gdp',
        'args': {},
        'required_fields': ['value', 'displayValue'],
        'change_required': False
    },
    {
        'name': 'fred_personal_income',
        'tool': 'get_fred_state_personal_income',
        'args': {},
        'required_fields': ['value', 'displayValue'],
        'change_required': False
    }
]


def test_api(state: str, data_type: dict) -> dict:
    """Test a single API call for a state"""
    result = {
        'state': state,
        'data_type': data_type['name'],
        'tool': data_type['tool'],
        'success': False,
        'has_value': False,
        'has_change': False,
        'value': None,
        'change': None,
        'error': None
    }

    try:
        args = {'state_name': state, **data_type['args']}
        response = requests.post(
            f"{MCP_SERVER_URL}/execute",
            json={'tool_name': data_type['tool'], 'arguments': args},
            timeout=TIMEOUT
        )

        if response.status_code != 200:
            result['error'] = f"HTTP {response.status_code}"
            return result

        data = response.json()

        if not data.get('success'):
            result['error'] = data.get('error', 'Unknown error')
            return result

        api_result = data.get('result', {})

        if api_result.get('status') != 'success':
            result['error'] = api_result.get('error', 'API returned non-success')
            return result

        # Check required fields
        missing_fields = []
        for field in data_type['required_fields']:
            if field not in api_result or api_result[field] is None:
                missing_fields.append(field)

        if missing_fields:
            result['error'] = f"Missing fields: {missing_fields}"

        # Extract values
        result['value'] = api_result.get('displayValue') or api_result.get('value')
        result['change'] = api_result.get('changeDisplay') or api_result.get('change')
        result['has_value'] = result['value'] is not None
        result['has_change'] = result['change'] is not None and result['change'] != 'N/A'

        # Check if change is required but missing
        if data_type['change_required'] and not result['has_change']:
            result['error'] = f"Change is N/A (required for {data_type['name']})"
        else:
            result['success'] = True

    except requests.exceptions.Timeout:
        result['error'] = "Request timeout"
    except requests.exceptions.RequestException as e:
        result['error'] = f"Request error: {str(e)}"
    except Exception as e:
        result['error'] = f"Error: {str(e)}"

    return result


def run_tests(states: list = None, data_types: list = None, parallel: int = 5):
    """Run tests for specified states and data types"""
    states = states or ALL_STATES
    data_types = data_types or DATA_TYPES

    total_tests = len(states) * len(data_types)
    results = []
    failures = []

    print(f"\n{'='*60}")
    print(f"MCP Server API Test Suite")
    print(f"{'='*60}")
    print(f"Server: {MCP_SERVER_URL}")
    print(f"States: {len(states)}")
    print(f"Data Types: {len(data_types)}")
    print(f"Total Tests: {total_tests}")
    print(f"{'='*60}\n")

    # Create test tasks
    tasks = []
    for state in states:
        for dt in data_types:
            tasks.append((state, dt))

    completed = 0

    with ThreadPoolExecutor(max_workers=parallel) as executor:
        future_to_task = {
            executor.submit(test_api, state, dt): (state, dt)
            for state, dt in tasks
        }

        for future in as_completed(future_to_task):
            state, dt = future_to_task[future]
            result = future.result()
            results.append(result)

            completed += 1
            status = "✓" if result['success'] else "✗"

            if not result['success']:
                failures.append(result)
                print(f"[{completed}/{total_tests}] {status} {state} - {dt['name']}: {result['error']}")
            else:
                # Print progress every 10 tests
                if completed % 10 == 0:
                    print(f"[{completed}/{total_tests}] Progress... ({len(failures)} failures so far)")

    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")

    success_count = sum(1 for r in results if r['success'])
    fail_count = len(failures)

    print(f"Total: {total_tests}")
    print(f"Passed: {success_count} ({100*success_count/total_tests:.1f}%)")
    print(f"Failed: {fail_count} ({100*fail_count/total_tests:.1f}%)")

    if failures:
        print(f"\n{'='*60}")
        print("FAILURES BY DATA TYPE")
        print(f"{'='*60}")

        # Group failures by data type
        by_type = {}
        for f in failures:
            dt = f['data_type']
            if dt not in by_type:
                by_type[dt] = []
            by_type[dt].append(f)

        for dt, fails in sorted(by_type.items()):
            print(f"\n{dt}: {len(fails)} failures")
            for f in fails[:5]:  # Show first 5
                print(f"  - {f['state']}: {f['error']}")
            if len(fails) > 5:
                print(f"  ... and {len(fails)-5} more")

        print(f"\n{'='*60}")
        print("FAILURES BY STATE")
        print(f"{'='*60}")

        # Group failures by state
        by_state = {}
        for f in failures:
            state = f['state']
            if state not in by_state:
                by_state[state] = []
            by_state[state].append(f)

        for state, fails in sorted(by_state.items(), key=lambda x: -len(x[1])):
            types = [f['data_type'] for f in fails]
            print(f"  {state}: {', '.join(types)}")

    print(f"\n{'='*60}")
    print(f"Test completed at {datetime.now().isoformat()}")
    print(f"{'='*60}\n")

    return results, failures


def test_sample_states():
    """Quick test with a sample of diverse states"""
    sample_states = [
        'California', 'Texas', 'New York', 'Florida', 'Alaska',
        'Hawaii', 'Wyoming', 'Rhode Island', 'District of Columbia', 'New Hampshire'
    ]
    return run_tests(states=sample_states)


def test_fallbacks():
    """Test FRED fallback APIs"""
    sample_states = ['California', 'Texas', 'New York', 'Florida', 'Ohio']
    return run_tests(states=sample_states, data_types=FALLBACK_TOOLS)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Test MCP Server APIs')
    parser.add_argument('--full', action='store_true', help='Run full test (all states)')
    parser.add_argument('--sample', action='store_true', help='Run sample test (10 states)')
    parser.add_argument('--fallbacks', action='store_true', help='Test FRED fallback APIs')
    parser.add_argument('--state', type=str, help='Test specific state')
    parser.add_argument('--parallel', type=int, default=5, help='Parallel requests')

    args = parser.parse_args()

    if args.state:
        results, failures = run_tests(states=[args.state], parallel=1)
    elif args.fallbacks:
        results, failures = test_fallbacks()
    elif args.full:
        results, failures = run_tests(parallel=args.parallel)
    else:
        # Default to sample test
        results, failures = test_sample_states()

    # Exit with error code if there are failures
    sys.exit(1 if failures else 0)
