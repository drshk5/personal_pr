# Central Backend Load Balancing with NGINX (Non-Docker Setup)

## 🚀 NGINX Load Balancing Configuration

### 1. NGINX Installation & Setup

#### Windows Installation

```powershell
# Download NGINX for Windows
# Go to: http://nginx.org/en/download.html
# Download nginx/Windows-1.24.0

# Extract to: C:\nginx
# Or use Chocolatey:
choco install nginx

# Start NGINX
cd C:\nginx
start nginx

# Test installation
curl http://localhost
```

#### Linux Installation (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. NGINX Load Balancer Configuration

Create or replace `/etc/nginx/nginx.conf` (Linux) or `C:\nginx\conf\nginx.conf` (Windows):

```nginx
# NGINX Configuration for Central Backend Load Balancing

# Main context
worker_processes auto;
error_log logs/error.log warn;
pid logs/nginx.pid;

events {
    worker_connections 1024;
    use epoll; # Linux only - remove for Windows
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    '$upstream_addr $upstream_status $upstream_response_time';

    access_log logs/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M; # For file uploads

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Upstream servers - Central Backend instances
    upstream central_backend {
        # Load balancing method
        least_conn; # Options: round_robin (default), least_conn, ip_hash, hash

        # Backend servers
        server 192.168.1.20:5001 max_fails=3 fail_timeout=30s weight=1;
        server 192.168.1.21:5001 max_fails=3 fail_timeout=30s weight=1;
        server 192.168.1.22:5001 max_fails=3 fail_timeout=30s weight=1;

        # Health check (requires NGINX Plus or custom module)
        # health_check interval=10s fails=3 passes=2 uri=/api/health;

        # Backup server (optional)
        # server 192.168.1.23:5001 backup;

        # Keep alive connections to backend
        keepalive 32;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/s;

    # Main server block
    server {
        listen 80;
        listen [::]:80;
        server_name your-domain.com localhost 192.168.1.20;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Health check endpoint (local)
        location /nginx-health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Static files (SHARED STORAGE - see file sharing section below)
        location /Uploads/ {
            alias /shared/uploads/; # Linux: NFS/GlusterFS mount point
            # alias \\\\file-server\\uploads\\; # Windows: SMB share

            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Served-By "nginx-static";

            # Security: Prevent execution of uploaded files
            location ~ \.(php|asp|aspx|jsp|js|sh|bat)$ {
                deny all;
                return 403;
            }
        }

        # File upload endpoints (with rate limiting)
        location ~* ^/api/.*/upload {
            limit_req zone=upload_limit burst=5 nodelay;

            proxy_pass http://central_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Increase timeouts for file uploads
            proxy_connect_timeout 60s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;

            # Large body size for uploads
            client_max_body_size 100M;
        }

        # API requests (with rate limiting)
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://central_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Request-ID $request_id;

            # Connection pooling
            proxy_http_version 1.1;
            proxy_set_header Connection "";

            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # Retry logic
            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
            proxy_next_upstream_tries 2;
            proxy_next_upstream_timeout 30s;
        }

        # WebSocket support (for SignalR if needed)
        location /hubs/ {
            proxy_pass http://central_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket timeouts
            proxy_read_timeout 300s;
            proxy_send_timeout 300s;
        }

        # Default route to backend
        location / {
            proxy_pass http://central_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }

        # Error pages
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root html;
        }
    }

    # HTTPS server (SSL configuration)
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name your-domain.com;

        # SSL configuration
        ssl_certificate /path/to/your/certificate.crt;
        ssl_certificate_key /path/to/your/private-key.key;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_stapling on;
        ssl_stapling_verify on;

        # Modern SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # HSTS (optional)
        add_header Strict-Transport-Security "max-age=63072000" always;

        # Same location blocks as HTTP server
        # ... (copy from above)
    }

    # NGINX Status page (optional - for monitoring)
    server {
        listen 8080;
        server_name localhost;

        location /nginx_status {
            stub_status;
            allow 127.0.0.1;
            deny all;
        }

        location /upstream_status {
            # Requires nginx-module-upstream-fair or similar
            return 200 "Upstream status check\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## 📁 File Storage Solutions for Multiple Servers

### Problem: Shared Upload Folder Access

When you have multiple servers, each server's local `Uploads` folder is isolated. Here are solutions:

### Solution 1: Network File System (NFS) - Linux Recommended

#### NFS Server Setup (File Server)

```bash
# Install NFS server
sudo apt install nfs-kernel-server

# Create shared directory
sudo mkdir -p /shared/uploads
sudo chown nobody:nogroup /shared/uploads
sudo chmod 755 /shared/uploads

# Configure NFS exports
echo "/shared/uploads 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)" | sudo tee -a /etc/exports

# Restart NFS
sudo systemctl restart nfs-kernel-server
sudo exportfs -ra
```

#### NFS Client Setup (Backend Servers)

```bash
# Install NFS client
sudo apt install nfs-common

# Create mount point
sudo mkdir -p /shared/uploads

# Mount the shared directory
sudo mount -t nfs 192.168.1.100:/shared/uploads /shared/uploads

# Auto-mount at boot
echo "192.168.1.100:/shared/uploads /shared/uploads nfs defaults 0 0" | sudo tee -a /etc/fstab
```

### Solution 2: SMB/CIFS Share - Windows/Mixed Environment

#### Windows File Server Setup

```powershell
# Create shared folder
New-Item -Path "C:\SharedUploads" -ItemType Directory
New-SmbShare -Name "uploads" -Path "C:\SharedUploads" -FullAccess "Everyone"

# Set permissions
Grant-SmbShareAccess -Name "uploads" -AccountName "Everyone" -AccessRight Full
```

#### Mount on Backend Servers (Windows)

```powershell
# Map network drive
net use Z: \\file-server\uploads /persistent:yes

# Or use UNC path directly in appsettings.json:
# "FileStorage:UploadsPath": "\\\\file-server\\uploads"
```

#### Mount on Backend Servers (Linux)

```bash
# Install CIFS utilities
sudo apt install cifs-utils

# Create mount point
sudo mkdir -p /shared/uploads

# Mount Windows share
sudo mount -t cifs //file-server/uploads /shared/uploads -o username=youruser,password=yourpass

# Auto-mount at boot
echo "//file-server/uploads /shared/uploads cifs username=youruser,password=yourpass,uid=www-data,gid=www-data 0 0" | sudo tee -a /etc/fstab
```

### Solution 3: Cloud Storage (AWS S3, Azure Blob, etc.)

#### Update Central Backend for Cloud Storage

```csharp
// Add to central-backend/Services/CloudFileStorageService.cs
public class CloudFileStorageService : IFileStorageService
{
    private readonly string _containerName;
    private readonly BlobServiceClient _blobServiceClient;

    public CloudFileStorageService(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("BlobStorage");
        _blobServiceClient = new BlobServiceClient(connectionString);
        _containerName = configuration["BlobStorage:ContainerName"];
    }

    public async Task<string> SaveFileAsync(IFormFile file, string folder)
    {
        var fileName = $"{folder}/{Guid.NewGuid()}_{file.FileName}";
        var blobClient = _blobServiceClient.GetBlobContainerClient(_containerName)
                                          .GetBlobClient(fileName);

        await blobClient.UploadAsync(file.OpenReadStream(), overwrite: true);
        return blobClient.Uri.ToString();
    }
}
```

#### NGINX Configuration for Cloud Files

```nginx
# Proxy cloud storage URLs
location ~* ^/uploads/(.+)$ {
    proxy_pass https://yourstorageaccount.blob.core.windows.net/uploads/$1;
    proxy_set_header Host yourstorageaccount.blob.core.windows.net;

    # Cache cloud files
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Solution 4: GlusterFS - Distributed File System

#### GlusterFS Setup (Advanced)

```bash
# Install GlusterFS
sudo apt install glusterfs-server

# Create trusted storage pool
sudo gluster peer probe server2
sudo gluster peer probe server3

# Create distributed volume
sudo gluster volume create uploads-vol transport tcp \
  server1:/gluster/uploads \
  server2:/gluster/uploads \
  server3:/gluster/uploads

sudo gluster volume start uploads-vol
```

## 🔧 Central Backend Configuration Updates

### Update appsettings.json for Shared Storage

```json
{
  "FileStorage": {
    "Type": "SharedNetwork", // Options: Local, SharedNetwork, Cloud
    "UploadsPath": "/shared/uploads", // Linux NFS mount
    "WindowsUploadsPath": "\\\\file-server\\uploads", // Windows SMB
    "AllowedExtensions": [".pdf", ".docx", ".xlsx", ".jpg", ".png"],
    "MaxFileSizeBytes": 104857600
  },
  "BlobStorage": {
    "ConnectionString": "DefaultEndpointsProtocol=https;AccountName=...",
    "ContainerName": "uploads"
  }
}
```

### Update FileStorageService for Shared Storage

```csharp
// In FileStorageService.cs
public class FileStorageService : IFileStorageService
{
    private readonly string _uploadsPath;
    private readonly ILogger<FileStorageService> _logger;

    public FileStorageService(IConfiguration configuration, ILogger<FileStorageService> logger)
    {
        var fileStorageType = configuration["FileStorage:Type"];

        _uploadsPath = fileStorageType switch
        {
            "SharedNetwork" => GetSharedNetworkPath(configuration),
            "Local" => GetLocalPath(configuration),
            _ => GetLocalPath(configuration)
        };

        _logger = logger;

        // Ensure directory exists
        if (!Directory.Exists(_uploadsPath))
        {
            Directory.CreateDirectory(_uploadsPath);
            _logger.LogInformation("Created uploads directory: {path}", _uploadsPath);
        }
    }

    private string GetSharedNetworkPath(IConfiguration configuration)
    {
        if (Environment.OSVersion.Platform == PlatformID.Win32NT)
        {
            return configuration["FileStorage:WindowsUploadsPath"];
        }
        return configuration["FileStorage:UploadsPath"];
    }

    private string GetLocalPath(IConfiguration configuration)
    {
        return Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
    }
}
```

## 🚀 Deployment Script

Create `deploy-nginx-lb.ps1` (Windows) or `deploy-nginx-lb.sh` (Linux):

### Windows PowerShell Script

```powershell
# Deploy NGINX Load Balancer for Central Backend
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "test")]
    [string]$Action = "start"
)

$nginxPath = "C:\nginx"
$configPath = "$nginxPath\conf\nginx.conf"

function Start-LoadBalancer {
    Write-Host "Starting NGINX Load Balancer..." -ForegroundColor Green

    # Test configuration
    & "$nginxPath\nginx.exe" -t
    if ($LASTEXITCODE -ne 0) {
        Write-Error "NGINX configuration test failed!"
        return
    }

    # Start NGINX
    Set-Location $nginxPath
    Start-Process "nginx.exe" -WorkingDirectory $nginxPath

    Write-Host "✅ NGINX Load Balancer started successfully" -ForegroundColor Green
    Write-Host "Access: http://localhost" -ForegroundColor Cyan
    Write-Host "Status: http://localhost:8080/nginx_status" -ForegroundColor Cyan
}

function Stop-LoadBalancer {
    Write-Host "Stopping NGINX Load Balancer..." -ForegroundColor Yellow
    & "$nginxPath\nginx.exe" -s stop
    Write-Host "✅ NGINX Load Balancer stopped" -ForegroundColor Green
}

function Restart-LoadBalancer {
    Write-Host "Restarting NGINX Load Balancer..." -ForegroundColor Blue
    & "$nginxPath\nginx.exe" -s reload
    Write-Host "✅ NGINX configuration reloaded" -ForegroundColor Green
}

function Get-LoadBalancerStatus {
    Write-Host "NGINX Load Balancer Status:" -ForegroundColor Cyan

    # Check NGINX process
    $nginxProcess = Get-Process nginx -ErrorAction SilentlyContinue
    if ($nginxProcess) {
        Write-Host "✅ NGINX is running (PID: $($nginxProcess.Id))" -ForegroundColor Green
    } else {
        Write-Host "❌ NGINX is not running" -ForegroundColor Red
    }

    # Test health endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/nginx-health" -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health check passed" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Health check failed" -ForegroundColor Red
    }

    # Test backend connectivity
    Write-Host "`nTesting backend servers:" -ForegroundColor Cyan
    $backends = @("192.168.1.20:5001", "192.168.1.21:5001", "192.168.1.22:5001")

    foreach ($backend in $backends) {
        try {
            $response = Invoke-WebRequest -Uri "http://$backend/api/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $backend - Healthy" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ $backend - Unhealthy" -ForegroundColor Red
        }
    }
}

function Test-Configuration {
    Write-Host "Testing NGINX configuration..." -ForegroundColor Blue
    & "$nginxPath\nginx.exe" -t

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Configuration test passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Configuration test failed" -ForegroundColor Red
    }
}

# Main execution
switch ($Action) {
    "start" { Start-LoadBalancer }
    "stop" { Stop-LoadBalancer }
    "restart" { Restart-LoadBalancer }
    "status" { Get-LoadBalancerStatus }
    "test" { Test-Configuration }
}
```

## 📋 Quick Setup Checklist

### ✅ Step-by-Step Deployment

1. **Install NGINX**

   ```bash
   # Linux
   sudo apt install nginx

   # Windows - Download from nginx.org
   ```

2. **Configure Backend Servers**
   - Start multiple instances of central-backend on different ports/servers
   - Update `appsettings.json` for shared file storage

3. **Setup Shared Storage**
   - Choose NFS (Linux) or SMB (Windows)
   - Mount shared storage on all backend servers
   - Test file write/read access

4. **Configure NGINX**
   - Replace `/etc/nginx/nginx.conf` with provided configuration
   - Update server IPs in upstream block
   - Test configuration: `nginx -t`

5. **Start Services**

   ```bash
   # Start backend instances
   dotnet run --urls=http://*:5001  # Server 1
   dotnet run --urls=http://*:5001  # Server 2
   dotnet run --urls=http://*:5001  # Server 3

   # Start NGINX
   sudo systemctl start nginx
   ```

6. **Verify Load Balancing**

   ```bash
   # Test health checks
   curl http://localhost/api/health
   curl http://localhost/nginx-health

   # Test file upload (should work across all servers)
   curl -X POST -F "file=@test.pdf" http://localhost/api/document/upload
   ```

## 🎯 Production Recommendations

### 1. **SSL/TLS Setup**

```bash
# Get SSL certificate (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. **Monitoring Setup**

```bash
# Install monitoring tools
sudo apt install htop iotop nginx-module-vts
```

### 3. **Backup Strategy**

```bash
# Backup shared storage
rsync -av /shared/uploads/ /backup/uploads/

# Backup NGINX config
cp /etc/nginx/nginx.conf /backup/nginx-$(date +%Y%m%d).conf
```

### 4. **Security Hardening**

- Configure firewall rules
- Set up fail2ban for brute force protection
- Regular security updates
- File upload validation

---

**🚀 Your Central Backend is now ready for high-performance load balancing with NGINX and shared file storage!**
