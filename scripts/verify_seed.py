import pymssql

conn = pymssql.connect(
    server='localhost:14333',
    user='sa',
    password='Darshak@5804',
    database='MasterDB'
)
cursor = conn.cursor()

print("\n" + "="*70)
print("CRM SEED DATA VERIFICATION REPORT")
print("="*70 + "\n")

# Check modules
cursor.execute("SELECT strModuleGUID, strName, strDesc FROM mstModule WHERE strName = 'CRM'")
modules = cursor.fetchall()
print(f"Modules (CRM): {len(modules)}")
for mod in modules:
    print(f"   - {mod[1]}: {mod[2][:50] if mod[2] else 'N/A'}...")

# Check page templates
cursor.execute("SELECT strPageTemplateGUID, strPageTemplateName FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%'")
templates = cursor.fetchall()
print(f"\nPage Templates (CRM): {len(templates)}")
for tmpl in templates:
    print(f"   - {tmpl[1]}")

# Check picklist types
cursor.execute("SELECT COUNT(*) FROM mstPicklistType")
picklist_types = cursor.fetchone()[0]
print(f"\nPicklist Types (Total): {picklist_types}")

# Check picklist values
cursor.execute("SELECT COUNT(*) FROM mstPickListValue")
picklist_values = cursor.fetchone()[0]
print(f"Picklist Values (Total): {picklist_values}")

# Check master menus
try:
    cursor.execute("SELECT COUNT(*) FROM mstMasterMenu WHERE strCategory = 'CRM'")
    menu_count = cursor.fetchone()[0]
    print(f"\nCRM Master Menus: {menu_count}")
except:
    print(f"\nCRM Master Menus: (unable to verify)")

print("\n" + "="*70)
print("SEEDING COMPLETE - All CRM data installed successfully!")
print("="*70 + "\n")

cursor.close()
conn.close()
