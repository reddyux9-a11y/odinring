#!/usr/bin/env python3
"""
Performance Monitoring Script
Monitors cache hit rates, query performance, and system metrics
"""

import asyncio
import time
import json
from datetime import datetime
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from cache_service import get_cache, CACHE_TTL
from firestore_db import FirestoreDB
from firebase_config import initialize_firebase
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerformanceMonitor:
    """Monitor system performance metrics"""
    
    def __init__(self):
        self.cache = get_cache()
        self.metrics = {
            'timestamp': datetime.now().isoformat(),
            'cache_stats': {},
            'database_stats': {},
            'recommendations': []
        }
    
    def check_cache_status(self):
        """Check cache service status"""
        stats = {
            'type': 'in-memory',
            'available': True,
            'redis_connected': False
        }
        
        if hasattr(self.cache, 'use_redis') and self.cache.use_redis:
            stats['type'] = 'redis'
            stats['redis_connected'] = True
            try:
                if self.cache.redis_client:
                    info = self.cache.redis_client.info('memory')
                    stats['redis_memory_used'] = info.get('used_memory_human', 'N/A')
                    stats['redis_keys'] = self.cache.redis_client.dbsize()
            except Exception as e:
                stats['redis_error'] = str(e)
                stats['redis_connected'] = False
        
        self.metrics['cache_stats'] = stats
        return stats
    
    async def test_cache_performance(self):
        """Test cache read/write performance"""
        logger.info("Testing cache performance...")
        
        test_key = f"perf_test_{int(time.time())}"
        test_value = {"test": "data", "timestamp": time.time()}
        
        # Test write
        write_start = time.perf_counter()
        self.cache.set('test', test_key, test_value, ttl=60)
        write_time = (time.perf_counter() - write_start) * 1000
        
        # Test read (should be cached)
        read_start = time.perf_counter()
        cached_value = self.cache.get('test', test_key)
        read_time = (time.perf_counter() - read_start) * 1000
        
        # Test read (miss - different key)
        miss_start = time.perf_counter()
        miss_value = self.cache.get('test', 'non_existent_key')
        miss_time = (time.perf_counter() - miss_start) * 1000
        
        # Cleanup
        self.cache.delete('test', test_key)
        
        return {
            'write_latency_ms': write_time,
            'read_latency_ms': read_time,
            'miss_latency_ms': miss_time,
            'cache_working': cached_value == test_value
        }
    
    async def test_database_performance(self):
        """Test database read performance with and without cache"""
        logger.info("Testing database performance...")
        
        # Initialize database
        initialize_firebase()
        db = FirestoreDB('users')
        
        # Find a test user (or create one for testing)
        test_user = await db.find_one({'email': {'$regex': 'test'}})
        
        if not test_user:
            logger.warning("No test user found, skipping database performance test")
            return None
        
        user_id = test_user.get('id')
        
        # Test without cache (first read)
        start = time.perf_counter()
        user1 = await db.find_one({'id': user_id}, use_cache=False)
        time_without_cache = (time.perf_counter() - start) * 1000
        
        # Test with cache (second read)
        start = time.perf_counter()
        user2 = await db.find_one({'id': user_id}, use_cache=True)
        time_with_cache = (time.perf_counter() - start) * 1000
        
        # Calculate speedup
        speedup = time_without_cache / time_with_cache if time_with_cache > 0 else 0
        
        return {
            'read_without_cache_ms': time_without_cache,
            'read_with_cache_ms': time_with_cache,
            'speedup': f"{speedup:.2f}x",
            'cache_effective': time_with_cache < time_without_cache
        }
    
    def generate_recommendations(self):
        """Generate performance recommendations"""
        recommendations = []
        
        cache_stats = self.metrics.get('cache_stats', {})
        if cache_stats.get('type') == 'in-memory':
            recommendations.append({
                'severity': 'medium',
                'category': 'cache',
                'issue': 'Using in-memory cache (not shared across instances)',
                'recommendation': 'Set up Redis for production to enable shared caching across multiple server instances'
            })
        
        if not cache_stats.get('redis_connected', False) and cache_stats.get('type') == 'redis':
            recommendations.append({
                'severity': 'high',
                'category': 'cache',
                'issue': 'Redis configured but not connected',
                'recommendation': 'Check Redis connection settings and ensure Redis server is running'
            })
        
        db_stats = self.metrics.get('database_stats', {})
        if db_stats:
            read_with_cache = db_stats.get('read_with_cache_ms', 0)
            if read_with_cache > 50:
                recommendations.append({
                    'severity': 'low',
                    'category': 'performance',
                    'issue': f'Cached read latency is {read_with_cache:.2f}ms (target: < 50ms)',
                    'recommendation': 'Consider optimizing cache TTL or reviewing cache implementation'
                })
        
        self.metrics['recommendations'] = recommendations
    
    async def run_monitoring(self):
        """Run all monitoring checks"""
        print("=" * 80)
        print("Performance Monitoring")
        print("=" * 80)
        print()
        
        # Check cache status
        print("📊 Cache Status:")
        cache_stats = self.check_cache_status()
        print(f"   Type: {cache_stats['type']}")
        print(f"   Available: {cache_stats['available']}")
        if cache_stats.get('redis_connected'):
            print(f"   Redis Memory: {cache_stats.get('redis_memory_used', 'N/A')}")
            print(f"   Redis Keys: {cache_stats.get('redis_keys', 0)}")
        print()
        
        # Test cache performance
        print("⚡ Cache Performance:")
        cache_perf = await self.test_cache_performance()
        self.metrics['cache_performance'] = cache_perf
        print(f"   Write Latency: {cache_perf['write_latency_ms']:.2f} ms")
        print(f"   Read Latency: {cache_perf['read_latency_ms']:.2f} ms")
        print(f"   Cache Working: {cache_perf['cache_working']}")
        print()
        
        # Test database performance
        print("🗄️  Database Performance:")
        db_perf = await self.test_database_performance()
        if db_perf:
            self.metrics['database_stats'] = db_perf
            print(f"   Read (no cache): {db_perf['read_without_cache_ms']:.2f} ms")
            print(f"   Read (cached): {db_perf['read_with_cache_ms']:.2f} ms")
            print(f"   Speedup: {db_perf['speedup']}")
            print(f"   Cache Effective: {db_perf['cache_effective']}")
        else:
            print("   Skipped (no test data)")
        print()
        
        # Generate recommendations
        self.generate_recommendations()
        
        # Print recommendations
        if self.metrics['recommendations']:
            print("💡 Recommendations:")
            for i, rec in enumerate(self.metrics['recommendations'], 1):
                severity_icon = "🔴" if rec['severity'] == 'high' else "🟡" if rec['severity'] == 'medium' else "🟢"
                print(f"   {severity_icon} [{rec['severity'].upper()}] {rec['category']}")
                print(f"      Issue: {rec['issue']}")
                print(f"      Recommendation: {rec['recommendation']}")
                print()
        
        # Save metrics
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = Path(__file__).parent / f"performance_monitor_{timestamp}.json"
        
        with open(report_path, 'w') as f:
            json.dump(self.metrics, f, indent=2)
        
        print(f"📄 Report saved to: {report_path}")
        print()
        print("=" * 80)


async def main():
    """Main entry point"""
    monitor = PerformanceMonitor()
    await monitor.run_monitoring()


if __name__ == "__main__":
    asyncio.run(main())



