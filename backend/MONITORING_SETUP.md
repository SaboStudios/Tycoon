# Cost Monitoring Setup

Quick reference for monitoring the cost optimization impact.

## 1. **Database Performance**

### Check if indexes are being used
```sql
-- MySQL: Show index statistics
SELECT object_schema, object_name, count_read, count_write 
FROM performance_schema.table_io_waits_summary_by_index_usage 
WHERE object_schema = 'tycoon' AND object_name = 'games';

-- PostgreSQL: Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE tablename = 'games' 
ORDER BY idx_scan DESC;
```

### Measure query performance before/after
```sql
-- Time a polling query (games by status)
SELECT SQL_NO_CACHE * FROM games 
WHERE status IN ('RUNNING', 'IN_PROGRESS') 
AND duration IS NOT NULL;
```

**Expected improvement:** 10x faster (e.g., 500ms → 50ms)

---

## 2. **Polling Query Volume**

### Check server logs for polling frequency

```bash
# Count poller invocations per minute
grep "Timed game finished by backend poller" /var/log/backend.log | \
  cut -d' ' -f1-2 | uniq -c | head -20

# Count agent runner polls  
grep "Agent game runner poll" /var/log/backend.log | wc -l
```

**Expected with new intervals:**
- Every 10 seconds: 6 polls/min = ~8,640 polls/day (vs. 43,200 before)
- Every 60 seconds: 1 poll/min = ~1,440 polls/day (vs. 4,320 before)

---

## 3. **RPC Provider Cache Hit Rate**

Add this to `tycoonContract.js` to track cache effectiveness:

```javascript
// At the top, add metrics tracking
let providerCacheHits = 0;
let providerCacheMisses = 0;

function getCachedProvider(rpcUrl, network) {
  const cacheKey = `${rpcUrl}:${network.chainId}:${network.name}`;
  if (providerCache.has(cacheKey)) {
    providerCacheHits++;
  } else {
    providerCacheMisses++;
  }
  if (!providerCache.has(cacheKey)) {
    providerCache.set(cacheKey, new JsonRpcProvider(rpcUrl, network));
  }
  return providerCache.get(cacheKey);
}

// Export metrics endpoint
export function getProviderCacheStats() {
  const total = providerCacheHits + providerCacheMisses;
  return {
    hits: providerCacheHits,
    misses: providerCacheMisses,
    hitRate: total > 0 ? (providerCacheHits / total * 100).toFixed(2) + '%' : '0%',
    totalCalls: total,
  };
}
```

**Expected:** 95%+ cache hit rate after warmup period

---

## 4. **Cost Tracking Template**

Use this spreadsheet to track costs over time:

| Date | RPC Calls | DB Queries | Sentry Events | Total Cost | Notes |
|------|-----------|-----------|----------------|-----------|-------|
| Pre-opt | 500K | 300K | 100K | $X | Baseline |
| Day 1 | 450K | 200K | 10K | $0.6X | Post-deploy |
| Day 7 | 425K | 180K | 9K | $0.55X | Stabilized |
| Week 2 | 420K | 175K | 8.5K | $0.52X | Fully optimized |

---

## 5. **Sentry Trace Monitoring**

```javascript
// Track Sentry trace decisions in code
import * as Sentry from "@sentry/node";

// Check current sampling config
console.log('Sentry sampling rate:', process.env.SENTRY_TRACE_SAMPLE_RATE || 'not set');

// Monitor transaction capture rate
Sentry.captureMessage(`Trace sampling: ${process.env.SENTRY_TRACE_SAMPLE_RATE}`);
```

---

## 6. **Production Monitoring Commands**

### Real-time polling stats
```bash
# Watch polling frequency (update every 2s)
watch -n 2 "grep 'Timed game' /var/log/backend.log | tail -1"

# Count games processed by poller this hour
grep "$(date +%Y-%m-%d\ %H)" /var/log/backend.log | \
  grep "Timed game finished" | wc -l
```

### Database index effectiveness
```bash
# PostgreSQL: Which indexes are slowing things down?
SELECT * FROM pg_stat_user_indexes 
WHERE idx_scan = 0  -- Unused indexes
ORDER BY idx_blks_read DESC;

# MySQL: Slow query log
SHOW VARIABLES LIKE 'slow_query_log%';
```

---

## 7. **Alert Configuration**

Set up alerts in your cloud provider:

**AWS RDS:**
- Metric: "Database Connections" → Alert if > previous avg
- Metric: "DatabaseConnections" → Should stay stable or decrease
- Custom: Query runtime → Should see 10x improvement on status queries

**Datadog/New Relic:**
```yaml
alerts:
  - name: "High RPC calls"
    condition: "rpc_call_count > baseline * 1.5"
    action: "notify"
  - name: "Slow polling"
    condition: "polling_query_time > 500ms"
    action: "notify"
```

---

## 8. **Weekly Cost Review**

Every Monday:
1. Check your RPC provider's usage dashboard
2. Check Sentry billing  
3. Review database slow query log
4. Compare to baseline from Week 0

**Success criteria:**
- RPC: ↓40-50%
- Database queries: ↓90%
- Sentry events: ↓90%
- Overall cost: ↓50%

---

**Questions?** Check `COST_OPTIMIZATION_GUIDE.md` for detailed troubleshooting.
