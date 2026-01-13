# Performance Optimizations - Deployment Guide

**Date:** January 2, 2026  
**Status:** Ready for Deployment

---

## Quick Start

### 1. Deploy Firestore Indexes (Required)

```bash
cd backend
chmod +x deploy_indexes.sh
./deploy_indexes.sh
```

**Alternative (if Firebase CLI not installed):**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore → Indexes**
4. Click **"Deploy"** or upload `firestore.indexes.json`

**Expected Time:** 5-15 minutes for index building

---

### 2. Set Up Redis (Optional but Recommended)

```bash
cd backend
chmod +x setup_redis.sh
./setup_redis.sh
```

**Quick Setup:**

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

**Configure:**
Add to `backend/.env`:
```bash
REDIS_URL=redis://localhost:6379
```

**Note:** If Redis is not available, the system automatically uses in-memory caching (works but not shared across instances).

---

### 3. Monitor Performance

```bash
cd backend
python3 monitor_performance.py
```

This will:
- Check cache status (Redis or in-memory)
- Test cache performance
- Test database read performance with/without cache
- Generate recommendations

---

## Verification Steps

### 1. Verify Indexes Are Deployed

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Navigate to **Firestore → Indexes**
3. Check that all indexes show status: **"Enabled"** (not "Building")

### 2. Verify Caching Is Working

Run the performance monitor:
```bash
cd backend
python3 monitor_performance.py
```

Look for:
- ✅ Cache type: `redis` or `in-memory`
- ✅ Cache working: `True`
- ✅ Read (cached) latency < 50ms

### 3. Verify Batch Operations

Check logs when using reorder endpoints:
- `/api/links/reorder` - Should show "batch operation" in logs
- `/api/media/reorder` - Should show "batch operation" in logs

---

## Performance Testing

### Run Full Performance Test

```bash
cd backend
python3 performance_test.py
```

**Expected Results After Optimizations:**
- Read Latency (cached): < 100ms (down from 386ms)
- Write Latency (batch): < 20ms per operation (down from 200ms)
- Read Throughput: > 10 ops/sec (up from 2.58 ops/sec)
- Write Throughput: > 20 ops/sec (up from 4.99 ops/sec)

### Run API Performance Test

```bash
cd backend
python3 api_performance_test.py --url http://localhost:8000
```

---

## Environment Variables

### Required
None - optimizations work out of the box

### Optional (for Production)
```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password  # If Redis requires password

# For cloud Redis:
# REDIS_URL=redis://username:password@host:port
```

---

## Troubleshooting

### Issue: Indexes Not Building

**Symptoms:**
- Queries fail with "index required" error
- Indexes show "Building" status for > 30 minutes

**Solutions:**
1. Check Firebase Console for index build errors
2. Verify `firestore.indexes.json` syntax is valid
3. Check Firestore quota limits
4. Wait longer (large collections can take hours)

### Issue: Cache Not Working

**Symptoms:**
- Performance monitor shows cache not working
- No performance improvement

**Solutions:**
1. Check Redis connection (if using Redis):
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. Verify environment variables:
   ```bash
   echo $REDIS_URL
   ```

3. Check logs for cache errors:
   ```bash
   grep -i cache backend/logs/*.log
   ```

4. In-memory cache works automatically - no setup needed

### Issue: Batch Operations Failing

**Symptoms:**
- Batch write errors in logs
- Operations timing out

**Solutions:**
1. Check batch size (Firestore limit: 500 operations per batch)
2. Verify all documents exist before batch update
3. Check Firestore quota limits
4. Review error messages in logs

---

## Monitoring & Maintenance

### Daily Monitoring

Run performance monitor daily:
```bash
cd backend
python3 monitor_performance.py > performance_$(date +%Y%m%d).log
```

### Weekly Review

1. Review cache hit rates (should be > 70%)
2. Check query performance trends
3. Review index usage in Firebase Console
4. Monitor Redis memory usage (if using Redis)

### Monthly Optimization

1. Review and optimize cache TTL values
2. Add new indexes based on query patterns
3. Review batch operation usage
4. Update performance benchmarks

---

## Rollback Plan

If issues occur, you can disable optimizations:

### Disable Caching

In `backend/firestore_db.py`, change:
```python
self.enable_cache = enable_cache  # Set to False
```

Or per-operation:
```python
await db.find_one({'id': user_id}, use_cache=False)
```

### Revert Batch Operations

The reorder endpoints will continue to work (they fall back to sequential if batch fails).

### Remove Indexes

Indexes can be deleted from Firebase Console, but this is not recommended as it will slow down queries.

---

## Production Checklist

Before deploying to production:

- [ ] Firestore indexes deployed and enabled
- [ ] Redis configured (or in-memory cache acceptable)
- [ ] Performance tests passing
- [ ] Cache hit rate > 70%
- [ ] Monitoring scripts tested
- [ ] Environment variables configured
- [ ] Logs reviewed for errors
- [ ] Rollback plan documented

---

## Support

For issues or questions:

1. Check `PERFORMANCE_OPTIMIZATIONS_IMPLEMENTED.md` for implementation details
2. Review `PERFORMANCE_DIAGNOSTIC_REPORT.md` for baseline metrics
3. Run `monitor_performance.py` for current status
4. Check Firebase Console for index status
5. Review application logs for errors

---

## Next Steps

After deployment:

1. **Monitor for 24-48 hours** to ensure stability
2. **Re-run performance tests** to verify improvements
3. **Review cache hit rates** and adjust TTL if needed
4. **Consider Priority 2 optimizations**:
   - Connection pooling (already implemented)
   - Performance monitoring dashboard
   - Read replicas for scale

---

**Last Updated:** January 2, 2026  
**Status:** ✅ Ready for Production



