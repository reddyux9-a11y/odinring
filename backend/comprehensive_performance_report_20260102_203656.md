# Performance Diagnostic Report

**Generated:** 2026-01-02T20:36:56.728674

---

## Executive Summary

**Overall Status:** 🔴 CRITICAL

- **Critical Issues:** 4
- **Warnings:** 0

### Key Metrics

- **Avg Read Latency Ms:** 386.86
- **Avg Write Latency Ms:** 200.26

## Database Performance


### Single Read

- **Mean Latency:** 386.86 ms
- **Median Latency:** 358.48 ms
- **P95 Latency:** 606.17 ms
- **P99 Latency:** 620.45 ms
- **Throughput:** 2.58 ops/sec
- **Success Rate:** 100/100

### Batch Read

- **Mean Latency:** 232.93 ms
- **Median Latency:** 204.13 ms
- **P95 Latency:** 306.53 ms
- **P99 Latency:** 314.57 ms
- **Success Rate:** 50/50

### Single Write

- **Mean Latency:** 200.26 ms
- **Median Latency:** 196.49 ms
- **P95 Latency:** 221.27 ms
- **P99 Latency:** 246.77 ms
- **Throughput:** 4.99 ops/sec
- **Success Rate:** 100/100

### Update

- **Mean Latency:** 362.39 ms
- **Median Latency:** 343.63 ms
- **P95 Latency:** 411.05 ms
- **P99 Latency:** 763.59 ms
- **Throughput:** 2.76 ops/sec
- **Success Rate:** 100/100

### Concurrent Read

- **Mean Latency:** 172.74 ms
- **Median Latency:** 168.15 ms
- **P95 Latency:** 192.22 ms
- **P99 Latency:** 212.67 ms
- **Throughput:** 5.79 ops/sec
- **Success Rate:** 100/100

### Concurrent Write

- **Mean Latency:** 183.06 ms
- **Median Latency:** 178.47 ms
- **P95 Latency:** 199.82 ms
- **P99 Latency:** 236.50 ms
- **Throughput:** 5.45 ops/sec
- **Success Rate:** 100/100

## Performance Bottlenecks

- ⚠️ High read latency: 386.86ms
- ⚠️ High write latency: 200.26ms
- ⚠️ Low concurrent read throughput: 5.79 ops/sec

## Recommendations


### 1. [HIGH] read_performance
🔴 **Issue:** High read latency: 386.86ms average

**Recommendation:** Consider implementing caching layer (Redis) or optimizing Firestore indexes

### 2. [HIGH] write_performance
🔴 **Issue:** High write latency: 200.26ms average

**Recommendation:** Consider batch writes or optimizing document structure

### 3. [HIGH] database
🔴 **Issue:** High database read latency

**Recommendation:** Implement caching layer (Redis) for frequently accessed data

### 4. [HIGH] database
🔴 **Issue:** High database write latency

**Recommendation:** Consider batch writes and optimize document structure