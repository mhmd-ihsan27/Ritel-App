# Rate Limiting Documentation

## Overview

Rate limiting is a critical security feature that prevents API abuse, brute force attacks, and ensures fair usage of your API resources. This implementation provides flexible, per-IP rate limiting with different limits for different endpoint types.

## Features

✅ **Per-IP Tracking** - Each client IP address has separate rate limits
✅ **Smart Limits** - Different limits for login, API, and general endpoints
✅ **Configurable** - All limits configurable via environment variables
✅ **Informative Headers** - Clients receive rate limit info in response headers
✅ **Auto-Cleanup** - Old visitor records are automatically cleaned up
✅ **Production-Ready** - Thread-safe with proper error handling

## How It Works

### Rate Limit Tiers

The system applies **three tiers** of rate limiting:

| Endpoint Type | Default Limit | Window | Use Case |
|--------------|---------------|---------|----------|
| **Login** (`/api/auth/login`) | 5 requests | 1 minute | Prevent brute force attacks |
| **API** (`/api/*`) | 100 requests | 1 minute | Normal API operations |
| **Global** (others) | 200 requests | 1 minute | Health checks, static files |

### Algorithm

The implementation uses a **sliding window** algorithm:

1. Each IP address maintains a list of request timestamps
2. On each request, timestamps older than the window are removed
3. If remaining count < limit, request is allowed
4. Otherwise, request is rejected with HTTP 429

### Response Headers

Every response includes rate limit information:

```http
X-RateLimit-Limit: 100          # Total requests allowed
X-RateLimit-Remaining: 87       # Requests remaining
X-RateLimit-Window: 1m0s        # Time window
Retry-After: 45                 # Seconds until retry (on 429)
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Global rate limit (non-API endpoints)
RATE_LIMIT_GLOBAL=200
RATE_LIMIT_WINDOW_GLOBAL=1m

# API rate limit (/api/* endpoints)
RATE_LIMIT_API=100
RATE_LIMIT_WINDOW_API=1m

# Login rate limit (/api/auth/login - strictest)
RATE_LIMIT_LOGIN=5
RATE_LIMIT_WINDOW_LOGIN=1m
```

### Duration Format

Windows support Go duration format:
- `1s` = 1 second
- `1m` = 1 minute
- `1h` = 1 hour
- `30s` = 30 seconds
- `5m` = 5 minutes

### Production Recommendations

**Development:**
```env
RATE_LIMIT_ENABLED=false  # Disable for easier testing
```

**Staging:**
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN=10       # Slightly relaxed
RATE_LIMIT_API=200        # Higher for testing
```

**Production:**
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN=5        # Strict - prevent brute force
RATE_LIMIT_API=100        # Moderate - normal usage
RATE_LIMIT_GLOBAL=200     # Relaxed - health checks, etc.
```

## Usage Examples

### Client-Side Handling (JavaScript)

```javascript
async function makeRequest(url) {
  const response = await fetch(url);

  // Check rate limit headers
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');

  console.log(`Rate limit: ${remaining}/${limit} remaining`);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    console.error(`Rate limited! Retry after ${retryAfter} seconds`);

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeRequest(url);
  }

  return response.json();
}
```

### cURL Testing

Test rate limiting:

```bash
# Make multiple requests quickly
for i in {1..10}; do
  curl -i http://localhost:8080/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  echo ""
done

# After 5 requests, you'll see:
# HTTP/1.1 429 Too Many Requests
# Retry-After: 45
```

### Custom Rate Limit in Code

If you need custom rate limiting for specific routes:

```go
import "ritel-app/internal/http/middleware"

// Custom 10 requests per 5 minutes
router.GET("/expensive-operation",
  middleware.RateLimit(10, 5*time.Minute),
  expensiveHandler,
)
```

## Response Format

### Success (200 OK)

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [...]
}
```

Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Window: 1m0s
```

### Rate Limited (429 Too Many Requests)

```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later."
}
```

Headers:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Window: 1m0s
Retry-After: 42
```

## IP Detection

The system detects client IPs from:

1. **X-Forwarded-For** header (behind proxy/load balancer)
2. **X-Real-IP** header (nginx)
3. **RemoteAddr** (direct connection)

### Behind Load Balancer

If using nginx or a load balancer, ensure it sets the correct header:

**Nginx:**
```nginx
location /api {
  proxy_pass http://backend:8080;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

## Monitoring

### Logs

Rate limit events are logged:

```log
[HTTP] GET /api/auth/login | Status: 429 | Duration: 1.2ms
```

### Metrics (Future Enhancement)

Recommended metrics to track:

- `rate_limit_hits_total` - Total rate limit violations
- `rate_limit_remaining` - Current remaining requests per IP
- `rate_limit_active_ips` - Number of tracked IPs

## Testing

### Unit Tests

Run the test suite:

```bash
go test -v ./internal/http/middleware/
```

### Manual Testing

**Test login rate limit (5 req/min):**
```bash
# This script will trigger rate limiting after 5 requests
for i in {1..10}; do
  echo "Request $i:"
  curl -s -w "Status: %{http_code}\n" \
    http://localhost:8080/api/auth/login \
    -X POST \
    -d '{"username":"admin","password":"admin"}'
  sleep 1
done
```

**Test API rate limit (100 req/min):**
```bash
# Send 105 requests quickly
for i in {1..105}; do
  curl -s http://localhost:8080/api/products > /dev/null
  echo "Request $i"
done
# Last 5 should return 429
```

## Troubleshooting

### Issue: Rate limit triggered too quickly

**Cause:** Clock skew or timestamps not cleaning up
**Solution:** Check server time synchronization (NTP)

### Issue: Different IPs getting same limit

**Cause:** Load balancer not forwarding IP headers
**Solution:** Configure X-Forwarded-For header in load balancer

### Issue: Rate limit not working

**Cause:** RATE_LIMIT_ENABLED=false in .env
**Solution:** Set to true and restart server

### Issue: All requests from same IP

**Cause:** Behind NAT/proxy without proper headers
**Solution:** Configure proxy to send client IP headers

## Security Considerations

### DoS Prevention

Rate limiting prevents:
- ✅ Brute force password attacks
- ✅ API scraping/harvesting
- ✅ Resource exhaustion
- ✅ Credential stuffing

### Best Practices

1. **Keep login limits strict** (5-10 req/min)
2. **Use HTTPS** to prevent header manipulation
3. **Monitor** rate limit violations for attack patterns
4. **Whitelist** known good IPs if needed (future feature)
5. **Combine** with other security measures (JWT, CORS, etc.)

### Known Limitations

- **Distributed systems:** Current implementation is in-memory
  For multi-server deployments, consider Redis-based rate limiting
- **IP spoofing:** Relies on client IP - use HTTPS and trusted proxies
- **Memory usage:** Tracks all visitor IPs - cleanup runs every 5 minutes

## Future Enhancements

Potential improvements:

- [ ] Redis-based rate limiting for distributed systems
- [ ] IP whitelist/blacklist
- [ ] Per-user rate limiting (based on JWT)
- [ ] Configurable rate limit per route
- [ ] Rate limit bypass for admin users
- [ ] Prometheus metrics export
- [ ] Geo-based rate limiting
- [ ] Dynamic rate limit adjustment

## API Reference

### Middleware Functions

#### `RateLimit(limit int, window time.Duration)`

Simple rate limiter for any route.

```go
router.GET("/api/special",
  middleware.RateLimit(50, time.Minute),
  handler,
)
```

#### `SmartRateLimit()`

Automatic rate limiting based on endpoint path.

```go
router.Use(middleware.SmartRateLimit())
```

#### `InitRateLimiters(global, login, api int, ...)`

Initialize rate limiters with custom limits.

```go
middleware.InitRateLimiters(
  200,         // global limit
  5,           // login limit
  100,         // API limit
  time.Minute, // global window
  time.Minute, // login window
  time.Minute, // API window
)
```

## Support

For issues or questions:
- Check logs: `cat app.log | grep "429"`
- Review configuration: `.env` file
- Test with: `curl -i http://localhost:8080/health`
- Report bugs: GitHub Issues

## License

Part of Ritel-App - MIT License
