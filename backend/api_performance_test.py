#!/usr/bin/env python3
"""
API Endpoint Performance Testing Script
Tests API endpoint read/write performance
"""

import asyncio
import time
import statistics
import json
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

class APIPerformanceTest:
    """Test API endpoint performance"""
    
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv('BACKEND_URL', 'http://localhost:8000')
        self.api_url = f"{self.base_url}/api"
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'base_url': self.api_url,
            'tests': {},
            'summary': {},
            'recommendations': []
        }
        self.auth_token = None
        self.test_user_id = None
    
    def get_auth_token(self) -> Optional[str]:
        """Get authentication token for testing"""
        if self.auth_token:
            return self.auth_token
        
        # Try to get token from environment or create test user
        test_email = f"perf_test_{int(time.time())}@test.com"
        test_password = "TestPassword123!"
        
        try:
            # Register test user
            register_data = {
                "email": test_email,
                "password": test_password,
                "name": "Performance Test User"
            }
            
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=register_data,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.auth_token = data.get('access_token') or data.get('token')
                if 'user' in data:
                    self.test_user_id = data['user'].get('id')
                return self.auth_token
            else:
                # Try login instead
                login_data = {
                    "email": test_email,
                    "password": test_password
                }
                response = requests.post(
                    f"{self.api_url}/auth/login",
                    json=login_data,
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    self.auth_token = data.get('access_token') or data.get('token')
                    if 'user' in data:
                        self.test_user_id = data['user'].get('id')
                    return self.auth_token
        except Exception as e:
            print(f"Warning: Could not get auth token: {e}")
        
        return None
    
    def test_endpoint(self, method: str, endpoint: str, iterations: int = 50, 
                     data: dict = None, requires_auth: bool = True) -> Dict[str, Any]:
        """Test a single endpoint"""
        url = f"{self.api_url}{endpoint}"
        latencies = []
        errors = 0
        status_codes = []
        
        headers = {}
        if requires_auth and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        for i in range(iterations):
            try:
                start = time.perf_counter()
                
                if method.upper() == 'GET':
                    response = requests.get(url, headers=headers, timeout=10)
                elif method.upper() == 'POST':
                    response = requests.post(url, json=data, headers=headers, timeout=10)
                elif method.upper() == 'PUT':
                    response = requests.put(url, json=data, headers=headers, timeout=10)
                elif method.upper() == 'DELETE':
                    response = requests.delete(url, headers=headers, timeout=10)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                end = time.perf_counter()
                latency = (end - start) * 1000  # Convert to ms
                
                latencies.append(latency)
                status_codes.append(response.status_code)
                
                if response.status_code >= 400:
                    errors += 1
                    
            except Exception as e:
                errors += 1
                latencies.append(0)  # Failed request
        
        return {
            'endpoint': endpoint,
            'method': method,
            'iterations': iterations,
            'successful': iterations - errors,
            'errors': errors,
            'status_codes': {
                str(code): status_codes.count(code) for code in set(status_codes)
            },
            'latency_ms': {
                'min': min(latencies) if latencies else 0,
                'max': max(latencies) if latencies else 0,
                'mean': statistics.mean(latencies) if latencies else 0,
                'median': statistics.median(latencies) if latencies else 0,
                'p95': self.percentile(latencies, 95) if latencies else 0,
                'p99': self.percentile(latencies, 99) if latencies else 0,
                'std_dev': statistics.stdev(latencies) if len(latencies) > 1 else 0
            },
            'throughput_ops_per_sec': (iterations - errors) / (sum(latencies) / 1000) if latencies else 0
        }
    
    def test_concurrent_endpoint(self, method: str, endpoint: str, concurrency: int = 10,
                                iterations_per_thread: int = 5, data: dict = None,
                                requires_auth: bool = True) -> Dict[str, Any]:
        """Test endpoint with concurrent requests"""
        import concurrent.futures
        
        url = f"{self.api_url}{endpoint}"
        all_latencies = []
        errors = 0
        status_codes = []
        
        headers = {}
        if requires_auth and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        def make_request():
            latencies = []
            for _ in range(iterations_per_thread):
                try:
                    start = time.perf_counter()
                    
                    if method.upper() == 'GET':
                        response = requests.get(url, headers=headers, timeout=10)
                    elif method.upper() == 'POST':
                        response = requests.post(url, json=data, headers=headers, timeout=10)
                    else:
                        raise ValueError(f"Unsupported method: {method}")
                    
                    end = time.perf_counter()
                    latency = (end - start) * 1000
                    
                    latencies.append(latency)
                    status_codes.append(response.status_code)
                    
                    if response.status_code >= 400:
                        errors += 1
                except Exception as e:
                    errors += 1
                    latencies.append(0)
            
            return latencies
        
        start_time = time.perf_counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(make_request) for _ in range(concurrency)]
            for future in concurrent.futures.as_completed(futures):
                try:
                    latencies = future.result()
                    all_latencies.extend(latencies)
                except Exception as e:
                    errors += 1
        
        end_time = time.perf_counter()
        total_time = (end_time - start_time) * 1000
        total_operations = concurrency * iterations_per_thread
        
        return {
            'endpoint': endpoint,
            'method': method,
            'concurrency': concurrency,
            'iterations_per_thread': iterations_per_thread,
            'total_operations': total_operations,
            'successful': total_operations - errors,
            'errors': errors,
            'total_time_ms': total_time,
            'status_codes': {
                str(code): status_codes.count(code) for code in set(status_codes)
            },
            'latency_ms': {
                'min': min(all_latencies) if all_latencies else 0,
                'max': max(all_latencies) if all_latencies else 0,
                'mean': statistics.mean(all_latencies) if all_latencies else 0,
                'median': statistics.median(all_latencies) if all_latencies else 0,
                'p95': self.percentile(all_latencies, 95) if all_latencies else 0,
                'p99': self.percentile(all_latencies, 99) if all_latencies else 0,
                'std_dev': statistics.stdev(all_latencies) if len(all_latencies) > 1 else 0
            },
            'throughput_ops_per_sec': (total_operations - errors) / (total_time / 1000) if total_time > 0 else 0
        }
    
    def percentile(self, data: List[float], percentile: float) -> float:
        """Calculate percentile"""
        if not data:
            return 0.0
        sorted_data = sorted(data)
        index = (percentile / 100) * (len(sorted_data) - 1)
        if index.is_integer():
            return sorted_data[int(index)]
        else:
            lower = sorted_data[int(index)]
            upper = sorted_data[int(index) + 1]
            return lower + (upper - lower) * (index - int(index))
    
    def check_server_health(self) -> bool:
        """Check if server is running"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except:
            try:
                # Try API docs endpoint
                response = requests.get(f"{self.api_url}/docs", timeout=5)
                return response.status_code == 200
            except:
                return False
    
    def run_all_tests(self):
        """Run all API performance tests"""
        print("=" * 80)
        print("Starting API Performance Testing")
        print("=" * 80)
        
        # Check server health
        if not self.check_server_health():
            print(f"⚠️  Warning: Server at {self.base_url} may not be running")
            print("   Some tests may fail. Make sure the backend server is running.")
            response = input("Continue anyway? (y/n): ")
            if response.lower() != 'y':
                return
        
        test_start_time = time.perf_counter()
        
        try:
            # Get auth token
            print("\n🔐 Getting authentication token...")
            self.get_auth_token()
            if self.auth_token:
                print("✅ Authentication successful")
            else:
                print("⚠️  Could not authenticate - some tests may fail")
            
            # Test public endpoints
            print("\n📊 Testing public endpoints...")
            self.results['tests']['health_check'] = self.test_endpoint('GET', '/health', iterations=50, requires_auth=False)
            
            # Test authenticated endpoints
            if self.auth_token:
                print("\n📊 Testing authenticated endpoints...")
                self.results['tests']['get_profile'] = self.test_endpoint('GET', '/users/me', iterations=50)
                self.results['tests']['get_links'] = self.test_endpoint('GET', '/links', iterations=50)
                
                # Test write operations
                print("\n📊 Testing write operations...")
                link_data = {
                    "title": "Performance Test Link",
                    "url": "https://example.com",
                    "description": "Test link for performance testing"
                }
                self.results['tests']['create_link'] = self.test_endpoint('POST', '/links', iterations=30, data=link_data)
                
                # Test concurrent operations
                print("\n📊 Testing concurrent operations...")
                self.results['tests']['concurrent_get_links'] = self.test_concurrent_endpoint(
                    'GET', '/links', concurrency=10, iterations_per_thread=5
                )
                
        except Exception as e:
            print(f"❌ Error during testing: {e}")
            self.results['error'] = str(e)
        
        # Calculate summary
        test_end_time = time.perf_counter()
        total_time = test_end_time - test_start_time
        
        self.results['summary'] = {
            'total_test_time_seconds': total_time,
            'total_tests': len(self.results['tests']),
            'timestamp': datetime.now().isoformat()
        }
        
        print("\n" + "=" * 80)
        print("API Performance Testing Complete")
        print("=" * 80)
    
    def save_report(self, filename: str = None):
        """Save performance report to file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"api_performance_report_{timestamp}.json"
        
        filepath = Path(__file__).parent / filename
        
        with open(filepath, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n✅ Report saved to: {filepath}")
        return filepath
    
    def print_summary(self):
        """Print human-readable summary"""
        print("\n" + "=" * 80)
        print("API PERFORMANCE TEST SUMMARY")
        print("=" * 80)
        
        for test_name, test_result in self.results['tests'].items():
            if not isinstance(test_result, dict):
                continue
            
            print(f"\n📊 {test_name.upper().replace('_', ' ')}")
            print("-" * 80)
            print(f"  Endpoint:        {test_result.get('method', 'N/A')} {test_result.get('endpoint', 'N/A')}")
            
            if 'latency_ms' in test_result:
                latency = test_result['latency_ms']
                print(f"  Mean Latency:    {latency['mean']:.2f} ms")
                print(f"  Median Latency:  {latency['median']:.2f} ms")
                print(f"  P95 Latency:     {latency['p95']:.2f} ms")
                print(f"  P99 Latency:     {latency['p99']:.2f} ms")
                print(f"  Min Latency:     {latency['min']:.2f} ms")
                print(f"  Max Latency:     {latency['max']:.2f} ms")
            
            if 'throughput_ops_per_sec' in test_result:
                print(f"  Throughput:      {test_result['throughput_ops_per_sec']:.2f} ops/sec")
            
            if 'successful' in test_result:
                print(f"  Successful:      {test_result['successful']}")
                print(f"  Errors:          {test_result.get('errors', 0)}")
            
            if 'status_codes' in test_result:
                print(f"  Status Codes:    {test_result['status_codes']}")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='API Performance Testing')
    parser.add_argument('--url', type=str, help='Backend URL (default: http://localhost:8000)')
    args = parser.parse_args()
    
    tester = APIPerformanceTest(base_url=args.url)
    
    try:
        tester.run_all_tests()
        tester.print_summary()
        tester.save_report()
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()



