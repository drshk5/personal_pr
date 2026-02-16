# Docker Setup for Central Backend

This guide explains how to containerize and run the central backend using Docker.

## Prerequisites

- Docker Desktop installed and running
- .NET 8.0 SDK (for local development)
- SQL Server accessible from Docker container

## Files Created

1. **Dockerfile** - Multi-stage build configuration for the application
2. **.dockerignore** - Excludes unnecessary files from Docker build context
3. **docker-compose.yml** - Orchestrates services (includes optional SQL Server)
4. **appsettings.Docker.json** - Docker-specific configuration

## Quick Start

### Option 1: Using Docker Compose (Recommended)

This will build and run your application with all dependencies:

```bash
# Build and start the services
docker-compose up -d

# View logs
docker-compose logs -f central-backend

# Stop services
docker-compose down
```

The application will be available at:

- HTTP: http://localhost:5001
- HTTPS: http://localhost:5002

### Option 2: Using Docker CLI

Build the image:

```bash
docker build -t central-backend:latest .
```

Run the container:

```bash
docker run -d `
  --name central-backend `
  -p 5001:8080 `
  -e ASPNETCORE_ENVIRONMENT=Production `
  -e "ConnectionStrings__DefaultConnection=Server=host.docker.internal\SQLEXPRESS;Database=MasterDB;User Id=sa;Password=De$ktop;TrustServerCertificate=True;" `
  -v ${PWD}/Uploads:/app/Uploads `
  central-backend:latest
```

## Configuration

### Database Connection

The default configuration uses `host.docker.internal` to connect to SQL Server running on your host machine. Update the connection string in `docker-compose.yml` if needed:

```yaml
- ConnectionStrings__DefaultConnection=Server=host.docker.internal\SQLEXPRESS;Database=MasterDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;
```

### Using SQL Server in Docker

If you want to run SQL Server in a container, uncomment the `sqlserver` service in `docker-compose.yml`. Then update the connection string to:

```
Server=sqlserver;Database=MasterDB;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;
```

### Environment Variables

You can override settings using environment variables in `docker-compose.yml`:

- `ASPNETCORE_ENVIRONMENT` - Set to Development, Production, etc.
- `ConnectionStrings__DefaultConnection` - Database connection string
- `Jwt__Key` - JWT signing key
- `ApiGateway__TaskServiceBaseUrl` - Task service URL
- `ApiGateway__AccountingServiceBaseUrl` - Accounting service URL

## Useful Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs central-backend

# Follow logs in real-time
docker logs -f central-backend

# Execute commands in running container
docker exec -it central-backend bash

# Stop and remove container
docker stop central-backend
docker rm central-backend

# Remove image
docker rmi central-backend:latest

# Rebuild and restart with docker-compose
docker-compose up -d --build

# Scale services (if needed)
docker-compose up -d --scale central-backend=3
```

## Volumes

The following directories are persisted as volumes:

- `./Uploads` - Uploaded files (module images, etc.)
- `./Logs` - Application logs (if configured)
- `sqlserver-data` - SQL Server data (if using containerized SQL Server)

## Networking

The application runs in a custom bridge network (`easyaudit-network`) which allows:

- Communication between services by container name
- Isolation from other Docker networks
- Easy addition of other services (task-backend, accounting-backend, etc.)

## Troubleshooting

### Cannot connect to SQL Server

- Ensure SQL Server allows remote connections
- Check firewall settings
- Verify the connection string is correct
- Try using `host.docker.internal` instead of `localhost`

### Port already in use

Change the port mapping in `docker-compose.yml`:

```yaml
ports:
  - '5010:8080' # Use 5010 instead of 5001
```

### Container exits immediately

Check logs: `docker logs central-backend`
Common issues:

- Invalid connection string
- Missing environment variables
- Configuration errors

### File upload/download issues

Ensure the Uploads volume is properly mounted and has correct permissions.

## Production Considerations

1. **Use environment-specific configuration files**
2. **Store secrets in environment variables or secret management systems**
3. **Use a reverse proxy (nginx, traefik) for HTTPS**
4. **Set up health checks**
5. **Configure resource limits**
6. **Enable logging to external systems**
7. **Use Docker secrets for sensitive data**

Example with resource limits:

```yaml
central-backend:
  # ... other config ...
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

## Multi-Service Setup

To run all your backends together, create a root-level `docker-compose.yml`:

```yaml
version: '3.8'

services:
  central-backend:
    build: ./central-backend
    ports:
      - '5001:8080'
    networks:
      - easyaudit-network

  task-backend:
    build: ./task-backend
    ports:
      - '5006:8080'
    networks:
      - easyaudit-network

  accounting-backend:
    build: ./accounting-backend
    ports:
      - '7089:8080'
    networks:
      - easyaudit-network

  frontend:
    build: ./audit-frontend
    ports:
      - '5173:80'
    networks:
      - easyaudit-network

networks:
  easyaudit-network:
    driver: bridge
```

Then run: `docker-compose up -d`
