#!/usr/bin/env python3
"""
Comprehensive Performance Testing Script for OdinRing
Tests data reading and writing speed from end to end
"""

import asyncio
import time
import statistics
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path
import random
import string

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from firestore_db import FirestoreDB
from firebase_config import initialize_firebase
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test collections
TEST_COLLECTION = 'performance_test'
BACKUP_COLLECTION = 'performance_test_backup'

class PerformanceTest:
    """Comprehensive performance testing for database operations"""
    
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'tests': {},
            'summary': {},
            'recommendations': []
        }
        self.db = FirestoreDB(TEST_COLLECTION)
        self.test_documents = []
        
    def generate_test_data(self, size='small'):
        """Generate test data of different sizes"""
        sizes = {
            'small': {'fields': 5, 'field_length': 50},
            'medium': {'fields': 15, 'field_length': 200},
            'large': {'fields': 30, 'field_length': 500}
        }
        
        config = sizes.get(size, sizes['small'])
        data = {
            'id': f"test_{int(time.time() * 1000)}_{random.randint(1000, 9999)}",
            'test_type': size,
            'created_at': datetime.now().isoformat(),
            'timestamp': time.time()
        }
        
        # Add fields based on size
        for i in range(config['fields']):
            field_name = f"field_{i}"
            field_value = ''.join(random.choices(
                string.ascii_letters + string.digits,
                k=config['field_length']
            ))
            data[field_name] = field_value
        
        return data
    
    async def test_single_read(self, iterations: int = 100) -> Dict[str, Any]:
        """Test single document read performance"""
        logger.info(f"Testing single read operations ({iterations} iterations)...")
        
        # Create test document
        test_doc = self.generate_test_data('medium')
        await self.db.insert_one(test_doc)
        self.test_documents.append(test_doc['id'])
        
        latencies = []
        errors = 0
        
        for i in range(iterations):
            try:
                start = time.perf_counter()
                result = await self.db.find_one({'id': test_doc['id']})
                end = time.perf_counter()
                
                if result:
                    latencies.append((end - start) * 1000)  # Convert to ms
                else:
                    errors += 1
            except Exception as e:
                logger.error(f"Read error: {e}")
                errors += 1
        
        return {
            'operation': 'single_read',
            'iterations': iterations,
            'successful': iterations - errors,
            'errors': errors,
            'latency_ms': {
                'min': min(latencies) if latencies else 0,
                'max': max(latencies) if latencies else 0,
                'mean': statistics.mean(latencies) if latencies else 0,
                'median': statistics.median(latencies) if latencies else 0,
                'p95': self.percentile(latencies, 95) if latencies else 0,
                'p99': self.percentile(latencies, 99) if latencies else 0,
                'std_dev': statistics.stdev(latencies) if len(latencies) > 1 else 0
            },
            'throughput_ops_per_sec': (iterations - errors) / sum(latencies) * 1000 if latencies else 0
        }
    
    async def test_batch_read(self, batch_size: int = 10, iterations: int = 50) -> Dict[str, Any]:
        """Test batch read performance"""
        logger.info(f"Testing batch read operations (batch_size={batch_size}, iterations={iterations})...")
        
        # Create multiple test documents
        test_docs = []
        for i in range(batch_size * 2):  # Create more than we need
            doc = self.generate_test_data('small')
            await self.db.insert_one(doc)
            test_docs.append(doc)
            self.test_documents.append(doc['id'])
        
        latencies = []
        errors = 0
        total_docs_read = 0
        
        for i in range(iterations):
            try:
                # Read a batch of documents
                start = time.perf_counter()
                results = await self.db.find({'test_type': 'small'}, limit=batch_size)
                end = time.perf_counter()
                
                latencies.append((end - start) * 1000)  # Convert to ms
                total_docs_read += len(results)
            except Exception as e:
                logger.error(f"Batch read error: {e}")
                errors += 1
        
        return {
            'operation': 'batch_read',
            'batch_size': batch_size,
            'iterations': iterations,
            'successful': iterations - errors,
            'errors': errors,
            'total_docs_read': total_docs_read,
            'latency_ms': {
                'min': min(latencies) if latencies else 0,
                'max': max(latencies) if latencies else 0,
                'mean': statistics.mean(latencies) if latencies else 0,
                'median': statistics.median(latencies) if latencies else 0,
                'p95': self.percentile(latencies, 95) if latencies else 0,
                'p99': self.percentile(latencies, 99) if latencies else 0,
                'std_dev': statistics.stdev(latencies) if len(latencies) > 1 else 0
            },
            'throughput_docs_per_sec': total_docs_read / (sum(latencies) / 1000) if latencies else 0
        }
    
    async def test_single_write(self, iterations: int = 100) -> Dict[str, Any]:
        """Test single document write performance"""
        logger.info(f"Testing single write operations ({iterations} iterations)...")
        
        latencies = []
        errors = 0
        written_ids = []
        
        for i in range(iterations):
            try:
                test_doc = self.generate_test_data('medium')
                start = time.perf_counter()
                result = await self.db.insert_one(test_doc)
                end = time.perf_counter()
                
                latencies.append((end - start) * 1000)  # Convert to ms
                written_ids.append(test_doc['id'])
                self.test_documents.append(test_doc['id'])
            except Exception as e:
                logger.error(f"Write error: {e}")
                errors += 1
        
        return {
            'operation': 'single_write',
            'iterations': iterations,
            'successful': iterations - errors,
            'errors': errors,
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
    
    async def test_update_operation(self, iterations: int = 100) -> Dict[str, Any]:
        """Test document update performance"""
        logger.info(f"Testing update operations ({iterations} iterations)...")
        
        # Create test documents first
        test_docs = []
        for i in range(iterations):
            doc = self.generate_test_data('small')
            await self.db.insert_one(doc)
            test_docs.append(doc)
            self.test_documents.append(doc['id'])
        
        latencies = []
        errors = 0
        
        for doc in test_docs:
            try:
                update_data = {
                    'updated_at': datetime.now().isoformat(),
                    'update_count': random.randint(1, 100),
                    'new_field': ''.join(random.choices(string.ascii_letters, k=50))
                }
                
                start = time.perf_counter()
                await self.db.update_one({'id': doc['id']}, {'$set': update_data})
                end = time.perf_counter()
                
                latencies.append((end - start) * 1000)  # Convert to ms
            except Exception as e:
                logger.error(f"Update error: {e}")
                errors += 1
        
        return {
            'operation': 'update',
            'iterations': iterations,
            'successful': iterations - errors,
            'errors': errors,
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
    
    async def test_concurrent_reads(self, concurrency: int = 10, iterations_per_thread: int = 10) -> Dict[str, Any]:
        """Test concurrent read operations"""
        logger.info(f"Testing concurrent reads (concurrency={concurrency}, iterations={iterations_per_thread})...")
        
        # Create test document
        test_doc = self.generate_test_data('medium')
        await self.db.insert_one(test_doc)
        self.test_documents.append(test_doc['id'])
        
        async def read_operation():
            latencies = []
            for _ in range(iterations_per_thread):
                start = time.perf_counter()
                await self.db.find_one({'id': test_doc['id']})
                end = time.perf_counter()
                latencies.append((end - start) * 1000)
            return latencies
        
        start_time = time.perf_counter()
        tasks = [read_operation() for _ in range(concurrency)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.perf_counter()
        
        all_latencies = []
        errors = 0
        
        for result in results:
            if isinstance(result, Exception):
                errors += 1
                logger.error(f"Concurrent read error: {result}")
            else:
                all_latencies.extend(result)
        
        total_time = (end_time - start_time) * 1000  # Convert to ms
        total_operations = concurrency * iterations_per_thread
        
        return {
            'operation': 'concurrent_read',
            'concurrency': concurrency,
            'iterations_per_thread': iterations_per_thread,
            'total_operations': total_operations,
            'successful': total_operations - errors,
            'errors': errors,
            'total_time_ms': total_time,
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
    
    async def test_concurrent_writes(self, concurrency: int = 10, iterations_per_thread: int = 10) -> Dict[str, Any]:
        """Test concurrent write operations"""
        logger.info(f"Testing concurrent writes (concurrency={concurrency}, iterations={iterations_per_thread})...")
        
        async def write_operation():
            latencies = []
            for _ in range(iterations_per_thread):
                doc = self.generate_test_data('small')
                start = time.perf_counter()
                await self.db.insert_one(doc)
                end = time.perf_counter()
                latencies.append((end - start) * 1000)
                self.test_documents.append(doc['id'])
            return latencies
        
        start_time = time.perf_counter()
        tasks = [write_operation() for _ in range(concurrency)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.perf_counter()
        
        all_latencies = []
        errors = 0
        
        for result in results:
            if isinstance(result, Exception):
                errors += 1
                logger.error(f"Concurrent write error: {result}")
            else:
                all_latencies.extend(result)
        
        total_time = (end_time - start_time) * 1000  # Convert to ms
        total_operations = concurrency * iterations_per_thread
        
        return {
            'operation': 'concurrent_write',
            'concurrency': concurrency,
            'iterations_per_thread': iterations_per_thread,
            'total_operations': total_operations,
            'successful': total_operations - errors,
            'errors': errors,
            'total_time_ms': total_time,
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
    
    async def test_data_size_impact(self) -> Dict[str, Any]:
        """Test impact of different data sizes on performance"""
        logger.info("Testing data size impact...")
        
        results = {}
        sizes = ['small', 'medium', 'large']
        
        for size in sizes:
            # Write test
            write_doc = self.generate_test_data(size)
            write_start = time.perf_counter()
            await self.db.insert_one(write_doc)
            write_end = time.perf_counter()
            write_latency = (write_end - write_start) * 1000
            self.test_documents.append(write_doc['id'])
            
            # Read test
            read_start = time.perf_counter()
            await self.db.find_one({'id': write_doc['id']})
            read_end = time.perf_counter()
            read_latency = (read_end - read_start) * 1000
            
            results[size] = {
                'write_latency_ms': write_latency,
                'read_latency_ms': read_latency,
                'data_size_bytes': len(json.dumps(write_doc).encode('utf-8'))
            }
        
        return {
            'operation': 'data_size_impact',
            'results': results
        }
    
    async def test_query_performance(self) -> Dict[str, Any]:
        """Test query performance with different filters"""
        logger.info("Testing query performance...")
        
        # Create test documents with different attributes
        test_docs = []
        for i in range(50):
            doc = self.generate_test_data('small')
            doc['category'] = random.choice(['A', 'B', 'C'])
            doc['score'] = random.randint(1, 100)
            await self.db.insert_one(doc)
            test_docs.append(doc)
            self.test_documents.append(doc['id'])
        
        query_results = {}
        
        # Test 1: Simple equality query
        start = time.perf_counter()
        results = await self.db.find({'category': 'A'})
        end = time.perf_counter()
        query_results['equality_query'] = {
            'latency_ms': (end - start) * 1000,
            'results_count': len(results)
        }
        
        # Test 2: Query with limit
        start = time.perf_counter()
        results = await self.db.find({'test_type': 'small'}, limit=10)
        end = time.perf_counter()
        query_results['limited_query'] = {
            'latency_ms': (end - start) * 1000,
            'results_count': len(results)
        }
        
        return {
            'operation': 'query_performance',
            'results': query_results
        }
    
    async def cleanup(self):
        """Clean up test documents"""
        logger.info("Cleaning up test documents...")
        deleted = 0
        errors = 0
        
        for doc_id in self.test_documents:
            try:
                await self.db.delete_one({'id': doc_id})
                deleted += 1
            except Exception as e:
                logger.warning(f"Failed to delete {doc_id}: {e}")
                errors += 1
        
        logger.info(f"Cleaned up {deleted} documents ({errors} errors)")
        return deleted, errors
    
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
    
    def generate_recommendations(self):
        """Generate performance recommendations based on results"""
        recommendations = []
        
        # Analyze read performance
        if 'single_read' in self.results['tests']:
            read_test = self.results['tests']['single_read']
            mean_latency = read_test['latency_ms']['mean']
            
            if mean_latency > 100:
                recommendations.append({
                    'severity': 'high',
                    'category': 'read_performance',
                    'issue': f'High read latency: {mean_latency:.2f}ms average',
                    'recommendation': 'Consider implementing caching layer (Redis) or optimizing Firestore indexes'
                })
            elif mean_latency > 50:
                recommendations.append({
                    'severity': 'medium',
                    'category': 'read_performance',
                    'issue': f'Moderate read latency: {mean_latency:.2f}ms average',
                    'recommendation': 'Monitor and consider query optimization'
                })
        
        # Analyze write performance
        if 'single_write' in self.results['tests']:
            write_test = self.results['tests']['single_write']
            mean_latency = write_test['latency_ms']['mean']
            
            if mean_latency > 200:
                recommendations.append({
                    'severity': 'high',
                    'category': 'write_performance',
                    'issue': f'High write latency: {mean_latency:.2f}ms average',
                    'recommendation': 'Consider batch writes or optimizing document structure'
                })
        
        # Analyze concurrent performance
        if 'concurrent_read' in self.results['tests']:
            conc_test = self.results['tests']['concurrent_read']
            if conc_test['errors'] > 0:
                recommendations.append({
                    'severity': 'high',
                    'category': 'concurrency',
                    'issue': f'{conc_test["errors"]} errors during concurrent reads',
                    'recommendation': 'Review connection pooling and retry logic'
                })
        
        # Analyze error rates
        total_errors = sum(
            test.get('errors', 0) 
            for test in self.results['tests'].values() 
            if isinstance(test, dict)
        )
        if total_errors > 10:
            recommendations.append({
                'severity': 'high',
                'category': 'reliability',
                'issue': f'High error rate: {total_errors} total errors',
                'recommendation': 'Investigate connection stability and error handling'
            })
        
        self.results['recommendations'] = recommendations
    
    async def run_all_tests(self):
        """Run all performance tests"""
        logger.info("=" * 80)
        logger.info("Starting Comprehensive Performance Testing")
        logger.info("=" * 80)
        
        test_start_time = time.perf_counter()
        
        try:
            # Initialize Firebase
            logger.info("Initializing Firebase connection...")
            initialize_firebase()
            logger.info("✅ Firebase initialized")
            
            # Run tests
            self.results['tests']['single_read'] = await self.test_single_read(iterations=100)
            self.results['tests']['batch_read'] = await self.test_batch_read(batch_size=10, iterations=50)
            self.results['tests']['single_write'] = await self.test_single_write(iterations=100)
            self.results['tests']['update'] = await self.test_update_operation(iterations=100)
            self.results['tests']['concurrent_read'] = await self.test_concurrent_reads(concurrency=10, iterations_per_thread=10)
            self.results['tests']['concurrent_write'] = await self.test_concurrent_writes(concurrency=10, iterations_per_thread=10)
            self.results['tests']['data_size_impact'] = await self.test_data_size_impact()
            self.results['tests']['query_performance'] = await self.test_query_performance()
            
        except Exception as e:
            logger.error(f"Error during testing: {e}", exc_info=True)
            self.results['error'] = str(e)
        finally:
            # Cleanup
            await self.cleanup()
            
            # Calculate summary
            test_end_time = time.perf_counter()
            total_time = test_end_time - test_start_time
            
            self.results['summary'] = {
                'total_test_time_seconds': total_time,
                'total_tests': len(self.results['tests']),
                'timestamp': datetime.now().isoformat()
            }
            
            # Generate recommendations
            self.generate_recommendations()
            
            logger.info("=" * 80)
            logger.info("Performance Testing Complete")
            logger.info("=" * 80)
    
    def save_report(self, filename: str = None):
        """Save performance report to file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"performance_report_{timestamp}.json"
        
        filepath = Path(__file__).parent / filename
        
        with open(filepath, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        logger.info(f"Report saved to: {filepath}")
        return filepath
    
    def print_summary(self):
        """Print human-readable summary"""
        print("\n" + "=" * 80)
        print("PERFORMANCE TEST SUMMARY")
        print("=" * 80)
        
        for test_name, test_result in self.results['tests'].items():
            if not isinstance(test_result, dict):
                continue
                
            print(f"\n📊 {test_name.upper().replace('_', ' ')}")
            print("-" * 80)
            
            if 'latency_ms' in test_result:
                latency = test_result['latency_ms']
                print(f"  Mean Latency:    {latency['mean']:.2f} ms")
                print(f"  Median Latency:  {latency['median']:.2f} ms")
                print(f"  P95 Latency:     {latency['p95']:.2f} ms")
                print(f"  P99 Latency:     {latency['p99']:.2f} ms")
                print(f"  Min Latency:     {latency['min']:.2f} ms")
                print(f"  Max Latency:     {latency['max']:.2f} ms")
                print(f"  Std Deviation:   {latency['std_dev']:.2f} ms")
            
            if 'throughput_ops_per_sec' in test_result:
                print(f"  Throughput:      {test_result['throughput_ops_per_sec']:.2f} ops/sec")
            
            if 'successful' in test_result:
                print(f"  Successful:      {test_result['successful']}")
                print(f"  Errors:          {test_result.get('errors', 0)}")
                if test_result.get('errors', 0) > 0:
                    error_rate = (test_result['errors'] / test_result.get('iterations', test_result.get('total_operations', 1))) * 100
                    print(f"  Error Rate:      {error_rate:.2f}%")
        
        if self.results['recommendations']:
            print("\n" + "=" * 80)
            print("RECOMMENDATIONS")
            print("=" * 80)
            for i, rec in enumerate(self.results['recommendations'], 1):
                severity_icon = "🔴" if rec['severity'] == 'high' else "🟡" if rec['severity'] == 'medium' else "🟢"
                print(f"\n{severity_icon} [{rec['severity'].upper()}] {rec['category']}")
                print(f"   Issue: {rec['issue']}")
                print(f"   Recommendation: {rec['recommendation']}")
        
        print("\n" + "=" * 80)


async def main():
    """Main entry point"""
    tester = PerformanceTest()
    
    try:
        await tester.run_all_tests()
        tester.print_summary()
        report_path = tester.save_report()
        
        print(f"\n✅ Full report saved to: {report_path}")
        
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        await tester.cleanup()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        logger.exception("Fatal error")
        await tester.cleanup()


if __name__ == "__main__":
    asyncio.run(main())



