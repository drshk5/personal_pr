#!/bin/bash
# Run Activity Enhancement Migration
# This script applies the database schema changes for activities

echo "===================================="
echo "Activity Enhancement Migration"
echo "===================================="

# Check if Docker SQL Server is running
if ! docker ps | grep -q "sql"; then
    echo "ERROR: SQL Server container not found!"
    echo "Please start the SQL Server container first."
    exit 1
fi

# Get container name
CONTAINER=$(docker ps --filter "ancestor=mcr.microsoft.com/mssql/server" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
    CONTAINER=$(docker ps --filter "publish=14333" --format "{{.Names}}" | head -1)
fi

if [ -z "$CONTAINER" ]; then
    echo "ERROR: Could not find SQL Server container"
    echo "Looking for containers..."
    docker ps
    exit 1
fi

echo "Found SQL Server container: $CONTAINER"
echo ""
echo "Running migration script..."
echo ""

# Copy migration script to container and execute
docker cp scripts/activity_enhancement_migration.sql $CONTAINER:/tmp/migration.sql

docker exec -it $CONTAINER /opt/mssql-tools18/bin/sqlcmd \
    -S localhost \
    -U sa \
    -P "Darshak@5804" \
    -C \
    -i /tmp/migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "===================================="
    echo "✓ Migration completed successfully!"
    echo "===================================="
    echo ""
    echo "Next steps:"
    echo "1. Restart the CRM backend: cd crm-backend && dotnet run"
    echo "2. Test activity creation in the frontend"
else
    echo ""
    echo "===================================="
    echo "✗ Migration failed!"
    echo "===================================="
    echo "Please check the error messages above."
    exit 1
fi
