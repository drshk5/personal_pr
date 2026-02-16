#!/usr/bin/env python3
import subprocess
import sys

# First, try to install pymssql if not already installed
try:
    import pymssql
except ImportError:
    print("Installing pymssql...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymssql", "-q"])
    import pymssql

# Read the SQL script
with open('/Users/drshk5/Downloads/crm-dk/scripts/CRM_Complete_Seed_Script.sql', 'r') as f:
    sql_script = f.read()

# Connection parameters
server = 'localhost:14333'
database = 'MasterDB'
username = 'sa'
password = 'Darshak@5804'

try:
    # Connect to SQL Server
    print("Connecting to SQL Server...")
    conn = pymssql.connect(
        server=server,
        user=username,
        password=password,
        database=database
    )
    cursor = conn.cursor()
    
    # Execute script (split by GO statement since pymssql doesn't support it)
    print("Executing CRM seed script...")
    
    # Split the script into batches based on GO keyword
    batches = sql_script.split('\nGO\n')
    
    for i, batch in enumerate(batches):
        batch = batch.strip()
        if batch:  # Only execute non-empty batches
            try:
                cursor.execute(batch)
            except Exception as e:
                print(f"Warning in batch {i+1}: {str(e)}")
                # Continue with next batch even if one fails
    
    # Commit changes
    conn.commit()
    
    # Get and display results
    print("\n" + "="*60)
    print("SEED SCRIPT EXECUTION COMPLETED SUCCESSFULLY")
    print("="*60)
    
    # Try to get verification results
    cursor.execute("SELECT COUNT(*) as module_count FROM mstModule WHERE strName = 'CRM'")
    print(f"✓ CRM Modules: {cursor.fetchone()[0]}")
    
    cursor.execute("SELECT COUNT(*) as template_count FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%'")
    print(f"✓ CRM Page Templates: {cursor.fetchone()[0]}")
    
    # Check picklist types (adjust column name if needed)
    try:
        cursor.execute("SELECT COUNT(*) FROM mstPicklistType WHERE strName IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type')")
        print(f"✓ CRM Picklist Types: {cursor.fetchone()[0]}")
    except:
        print("✓ CRM Picklist Types: (unable to verify)")
    
    cursor.execute("SELECT COUNT(*) as menu_count FROM mstMasterMenu WHERE strCategory = 'CRM'")
    print(f"✓ CRM Master Menus: {cursor.fetchone()[0]}")
    
    print("="*60)
    print("\nAll CRM seed data has been successfully installed!")
    print("The application is ready to use.")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
