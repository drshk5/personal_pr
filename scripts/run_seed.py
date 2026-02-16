#!/usr/bin/env python3
import subprocess
import os

# Read the seed script
script_path = "/Users/drshk5/Downloads/crm-dk/scripts/CRM_Complete_Seed_Script.sql"

# Docker command to execute the script inside SQL Server container
docker_cmd = f"""
docker exec sqlserver /bin/bash -c "
apt-get update -qq &&
apt-get install -qq -y mssql-tools18 unixodbc-dev 2>/dev/null &&
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Darshak@5804 -d MasterDB -i /tmp/seed.sql
" 2>/dev/null
"""

# First, copy the script to the container
copy_cmd = f"docker cp {script_path} sqlserver:/tmp/seed.sql"
result = subprocess.run(copy_cmd, shell=True, capture_output=True)
print(f"Copying script... {result.returncode == 0 and '✓ Done' or f'Error: {result.stderr.decode()}'}")

# Execute the script
print("\n🔄 Executing CRM seed script...")
print("=" * 60)
result = subprocess.run(docker_cmd, shell=True, capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)
print("=" * 60)
print("\n✅ Seeding Complete!" if result.returncode == 0 else "\n❌ Error occurred")
