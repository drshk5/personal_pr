# Central Backend Load Balancing - Deployment Guide

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- At least 4GB RAM available
- Ports 80, 443, 1433, 6379, 8404 available

### 1. Deploy Load Balanced Setup

```bash
# Stop existing services
docker-compose down

# Deploy load balanced configuration
docker-compose -f docker-compose.loadbalanced.yml up -d

# Check status
docker-compose -f docker-compose.loadbalanced.yml ps
```

### 2. Verify Health Checks

```bash
# Check HAProxy stats
curl http://localhost:8404/stats

# Check individual instances
curl http://localhost/api/health
curl http://localhost/api/health/detailed
```

## 🏗️ Architecture Overview

```
Internet → HAProxy Load Balancer (Port 80/443)
                  ↓
         ┌─────────────────────┐
         │   central-backend-1  │
         │   central-backend-2  │  → Redis (Session Store)
         │   central-backend-3  │
         └─────────────────────┘
                  ↓
              SQL Server
```

## ⚙️ Configuration Options

### Load Balancing Algorithms

```bash
# In haproxy.cfg, change balance method:
balance roundrobin    # Default - equal distribution
balance leastconn     # Route to least active connections
balance source        # Sticky sessions by IP
balance uri           # Route based on URI hash
```

### Session Management

**Option 1: Redis (Recommended for Production)**

```csharp
// Uncomment in Program.cs:
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});
```

**Option 2: Sticky Sessions via HAProxy**

```bash
# Add to haproxy.cfg backend:
cookie JSESSIONID prefix nocache
server central-backend-1 central-backend-1:8080 cookie s1 check
server central-backend-2 central-backend-2:8080 cookie s2 check
```

## 📊 Monitoring & Health Checks

### HAProxy Dashboard

- **URL**: http://localhost:8404/stats
- **Username**: admin
- **Password**: password123

### Health Check Endpoints

- **Basic**: `GET /api/health`
- **Detailed**: `GET /api/health/detailed`
- **Built-in**: `GET /health` (ASP.NET Core)

### Key Metrics to Monitor

```bash
# Instance health
curl http://localhost/api/health

# Database connectivity
curl http://localhost/api/health/detailed

# HAProxy status
curl http://localhost:8404/stats

# Container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 🔧 Scaling Operations

### Scale Up (Add Instance)

```bash
# Add to docker-compose.loadbalanced.yml:
central-backend-4:
  # ... same config with INSTANCE_NAME=central-backend-4

# Update haproxy.cfg:
server central-backend-4 central-backend-4:8080 check

# Restart with new configuration
docker-compose -f docker-compose.loadbalanced.yml up -d --scale central-backend-4=1
```

### Scale Down (Remove Instance)

```bash
# Graceful shutdown
docker-compose -f docker-compose.loadbalanced.yml stop central-backend-3

# Update haproxy.cfg (comment/remove the server line)
# server central-backend-3 central-backend-3:8080 check

# Reload HAProxy config without restart
docker exec central-load-balancer kill -USR2 1
```

## 🚨 Troubleshooting

### Common Issues

**1. Health Check Failures**

```bash
# Check instance logs
docker logs central-backend-1

# Check database connection
docker exec -it central-backend-1 curl http://localhost:8080/api/health/detailed
```

**2. Session Issues**

```bash
# Check Redis connectivity
docker exec -it central-redis redis-cli ping

# Verify session configuration
docker exec -it central-backend-1 env | grep -i redis
```

**3. Load Balancer Issues**

```bash
# Check HAProxy logs
docker logs central-load-balancer

# Verify backend health
docker exec -it central-load-balancer cat /proc/net/tcp
```

### Performance Tuning

**Database Connection Pool Optimization**

```csharp
// In Program.cs, optimize connection pool:
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 10,
            maxRetryDelay: TimeSpan.FromSeconds(30),
            errorNumbersToAdd: null);
    })
    .EnableSensitiveDataLogging(false)
    .EnableServiceProviderCaching()
    .EnableDetailedErrors(false));
```

**HAProxy Performance**

```bash
# Increase connection limits in haproxy.cfg:
global
    maxconn 8192     # Increase from 4096
    nbthread 4       # Match CPU cores

defaults
    timeout connect 3000ms   # Reduce timeouts
    timeout client  25000ms
    timeout server  25000ms
```

## 📈 Production Recommendations

### 1. **Security Hardening**

```bash
# Use environment variables for secrets
export HAPROXY_STATS_PASSWORD="$(openssl rand -base64 32)"
export JWT_SECRET_KEY="$(openssl rand -base64 64)"
```

### 2. **SSL/TLS Configuration**

```bash
# Add SSL certificates to haproxy.cfg
frontend https_frontend
    bind *:443 ssl crt /etc/ssl/certs/your-domain.pem
    redirect scheme https if !{ ssl_fc }
```

### 3. **Resource Limits**

```yaml
# In docker-compose.loadbalanced.yml:
central-backend-1:
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M
```

### 4. **Backup Strategy**

```bash
# Database backups
docker exec central-sqlserver sqlcmd -S localhost -U sa -P 'YourStrong@Passw0rd' \
  -Q "BACKUP DATABASE [MasterDB] TO DISK = '/var/opt/mssql/backup/MasterDB.bak'"

# Configuration backups
tar -czf config-backup-$(date +%Y%m%d).tar.gz haproxy.cfg docker-compose.loadbalanced.yml
```

## ✅ Success Indicators

- ✅ All instances show "Healthy" in HAProxy stats
- ✅ Health check endpoints return 200 OK
- ✅ Session persistence works across instances
- ✅ Request distribution is balanced
- ✅ Automatic failover during instance restarts

## 🎯 Next Steps

1. **Monitor Performance**: Set up Prometheus + Grafana for metrics
2. **Auto-scaling**: Implement horizontal pod autoscaler (HPA) for Kubernetes
3. **Circuit Breakers**: Add Polly for resilience patterns
4. **Security**: Implement WAF and rate limiting per user
5. **Caching**: Add Redis caching for frequently accessed data

---

**🔥 Your Central Backend is now ready for high-availability production deployment with load balancing!**
