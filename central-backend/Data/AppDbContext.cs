using Microsoft.EntityFrameworkCore;
using AuditSoftware.Models.Entities;
using AuditSoftware.Models.Core;

namespace AuditSoftware.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<MstAccountType> MstAccountTypes { get; set; }
    public DbSet<MstAddressType> MstAddressTypes { get; set; }
    public DbSet<MstCountry> MstCountry { get; set; }
    public DbSet<MstState> MstState { get; set; }
    public DbSet<MstCity> MstCity { get; set; }
    public DbSet<MstGroup> MstGroups { get; set; }
    public DbSet<MstUser> MstUsers { get; set; }
    public DbSet<MstUserSession> MstUserSessions { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<MstPicklistType> MstPicklistTypes { get; set; }
    public DbSet<MstTaxType> MstTaxTypes { get; set; }
    public DbSet<MstTaxRate> MstTaxRates { get; set; }
    public DbSet<MstTaxCategory> MstTaxCategories { get; set; }
    public DbSet<MstOrgTaxConfig> MstOrgTaxConfigs { get; set; }
    public DbSet<MstUserActivityLog> MstUserActivityLogs { get; set; }
    public DbSet<MstModule> MstModules { get; set; }
    public DbSet<MstGroupModule> MstGroupModules { get; set; }
    public DbSet<MstPickListValue> MstPickListValues { get; set; }
    public DbSet<MstUserRole> MstUserRoles { get; set; }
    public DbSet<MstMenu> MstMenus { get; set; }
    public DbSet<MstMasterMenu> MstMasterMenus { get; set; }
    public DbSet<MstUserRights> MstUserRights { get; set; }
    public DbSet<MstOrganization> MstOrganizations { get; set; }
    public DbSet<MstUserDetails> MstUserDetails { get; set; }
    public DbSet<MstYear> MstYears { get; set; }
    public DbSet<MstUserInfo> MstUserInfos { get; set; }
    public DbSet<MstIndustry> MstIndustries { get; set; }
    public DbSet<MstCurrencyType> MstCurrencyTypes { get; set; }
    public DbSet<MstLegalStatusType> MstLegalStatusTypes { get; set; }
    public DbSet<MstDesignation> MstDesignations { get; set; }
    public DbSet<MstDepartment> MstDepartments { get; set; }
    public DbSet<MstPageTemplate> MstPageTemplates { get; set; }
    public DbSet<MstSchedule> MstSchedules { get; set; }
    public DbSet<MstRenameSchedule> MstRenameSchedules { get; set; }
    public DbSet<MstDocument> MstDocuments { get; set; }
    public DbSet<MstDocType> MstDocTypes { get; set; }
    public DbSet<MstFolder> MstFolders { get; set; }
    public DbSet<MstDocumentAssociation> MstDocumentAssociations { get; set; }
    public DbSet<MstDocumentModule> MstDocumentModules { get; set; }
    public DbSet<MstHelpCategory> MstHelpCategories { get; set; }
    public DbSet<MstHelpArticle> MstHelpArticles { get; set; }

    // Intercept SaveChanges to handle DateTime values consistently
    public override int SaveChanges()
    {
        ProcessDateTimeValues();
        return base.SaveChanges();
    }
    
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ProcessDateTimeValues();
        return base.SaveChangesAsync(cancellationToken);
    }
    
    private void ProcessDateTimeValues()
    {
        // Process entities with DateTime properties to ensure consistent storage in UTC
        foreach (var entry in ChangeTracker.Entries())
        {
            // Only process added or modified entities
            if (entry.State != EntityState.Added && entry.State != EntityState.Modified)
                continue;
                
            // Get all DateTime properties
            var dateTimeProperties = entry.Entity.GetType().GetProperties()
                .Where(p => p.PropertyType == typeof(DateTime) || p.PropertyType == typeof(DateTime?));
                
            foreach (var property in dateTimeProperties)
            {
                // Skip if property doesn't have a value
                if (property.PropertyType == typeof(DateTime?))
                {
                    var nullableValue = property.GetValue(entry.Entity) as DateTime?;
                    if (!nullableValue.HasValue)
                        continue;
                }
                
                // For added entities, ensure createdOn fields are in UTC
                if (entry.State == EntityState.Added && 
                    (property.Name == "dtCreatedOn" || property.Name.EndsWith("CreatedOn")))
                {
                    // Store current UTC time with UTC kind marker
                    var currentUtc = AuditSoftware.Helpers.DateTimeProvider.Now;
                    property.SetValue(entry.Entity, currentUtc);
                    System.Diagnostics.Debug.WriteLine($"Setting {property.Name} to UTC time: {currentUtc}");
                }
                
                // For modified entities, ensure updatedOn fields are in UTC
                if (entry.State == EntityState.Modified && 
                    (property.Name == "dtUpdatedOn" || property.Name.EndsWith("UpdatedOn")))
                {
                    // Store current UTC time with UTC kind marker
                    var currentUtc = AuditSoftware.Helpers.DateTimeProvider.Now;
                    property.SetValue(entry.Entity, currentUtc);
                    System.Diagnostics.Debug.WriteLine($"Setting {property.Name} to UTC time: {currentUtc}");
                }
            }
        }
    }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Apply foreign key naming convention
        ApplyForeignKeyNamingConvention(modelBuilder);

        // Configure MstAddressType
        modelBuilder.Entity<MstAddressType>()
            .HasKey(a => a.strAddressTypeGUID);

        modelBuilder.Entity<MstAddressType>()
            .HasIndex(a => a.strName)
            .IsUnique();

        // Configure MstGroup
        modelBuilder.Entity<MstGroup>()
            .HasKey(c => c.strGroupGUID);

        modelBuilder.Entity<MstGroup>()
            .HasIndex(c => c.strPAN)
            .IsUnique();

        // Configure MstOrganization
        modelBuilder.Entity<MstOrganization>()
            .HasKey(o => o.strOrganizationGUID);

        modelBuilder.Entity<MstOrganization>()
            .HasIndex(o => new { o.strOrganizationName, o.strGroupGUID })
            .IsUnique();

        // Optional: Create index on PAN if it should be unique
        modelBuilder.Entity<MstOrganization>()
            .HasIndex(o => o.strPAN)
            .IsUnique()
            .HasFilter("[strPAN] IS NOT NULL");

        // Configure MstPicklistType
        modelBuilder.Entity<MstPicklistType>()
            .HasKey(p => p.strPicklistTypeGUID);

        modelBuilder.Entity<MstPicklistType>()
            .HasIndex(p => p.strType)
            .IsUnique();
            
        // Configure MstModule
        modelBuilder.Entity<MstModule>()
            .HasKey(m => m.strModuleGUID);

        modelBuilder.Entity<MstModule>()
            .HasIndex(m => m.strName)
            .IsUnique();

        // Configure MstCountry
        modelBuilder.Entity<MstCountry>()
            .HasKey(c => c.strCountryGUID);

        modelBuilder.Entity<MstCountry>()
            .HasIndex(c => c.strName)
            .IsUnique();
            
        // Configure MstState
        modelBuilder.Entity<MstState>()
            .HasKey(s => s.strStateGUID);

        modelBuilder.Entity<MstState>()
            .HasIndex(s => new { s.strName, s.strCountryGUID })
            .IsUnique();

        modelBuilder.Entity<MstState>()
            .HasOne(s => s.Country)
            .WithMany()
            .HasForeignKey(s => s.strCountryGUID);

        // Configure MstCity
        modelBuilder.Entity<MstCity>()
            .HasKey(c => c.strCityGUID);

        modelBuilder.Entity<MstCity>()
            .HasIndex(c => new { c.strName, c.strStateGUID, c.strCountryGUID })
            .IsUnique();

        modelBuilder.Entity<MstCity>()
            .HasOne(c => c.State)
            .WithMany()
            .HasForeignKey(c => c.strStateGUID)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<MstCity>()
            .HasOne(c => c.Country)
            .WithMany()
            .HasForeignKey(c => c.strCountryGUID)
            .OnDelete(DeleteBehavior.NoAction);

        // Configure MstUser
        modelBuilder.Entity<MstUser>()
            .HasKey(u => u.strUserGUID);

        modelBuilder.Entity<MstUser>()
            .HasIndex(u => u.strEmailId)
            .IsUnique();

        modelBuilder.Entity<MstUser>()
            .HasIndex(u => u.strMobileNo)
            .IsUnique();

        // Configure RefreshToken
        modelBuilder.Entity<RefreshToken>()
            .HasKey(r => r.Token);

        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.MstUser)
            .WithMany()
            .HasForeignKey(r => r.strUserGUID)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure MstPickListValue
        modelBuilder.Entity<MstPickListValue>()
            .HasIndex(p => new { p.strPicklistTypeGUID, p.strValue, p.strGroupGUID })
            .IsUnique();

        // Configure MstUserRole
        modelBuilder.Entity<MstUserRole>()
            .HasKey(r => r.strUserRoleGUID);

        modelBuilder.Entity<MstUserRole>()
            .HasIndex(r => new { r.strName, r.strGroupGUID })
            .IsUnique();
            
        // Configure MstIndustry
        modelBuilder.Entity<MstIndustry>()
            .HasKey(i => i.strIndustryGUID);

        modelBuilder.Entity<MstIndustry>()
            .HasIndex(i => i.strName)
            .IsUnique();
            
        // Configure MstCurrencyType
        modelBuilder.Entity<MstCurrencyType>()
            .HasKey(ct => ct.strCurrencyTypeGUID);

        modelBuilder.Entity<MstCurrencyType>()
            .HasIndex(ct => ct.strName)
            .IsUnique();

        modelBuilder.Entity<MstCurrencyType>()
            .HasOne(ct => ct.Country)
            .WithMany()
            .HasForeignKey(ct => ct.strCountryGUID)
            .OnDelete(DeleteBehavior.NoAction);
            
        // Configure MstLegalStatusType
        modelBuilder.Entity<MstLegalStatusType>()
            .HasKey(lst => lst.strLegalStatusTypeGUID);

        modelBuilder.Entity<MstLegalStatusType>()
            .HasIndex(lst => lst.strName)
            .IsUnique();
            
        // Configure MstDesignation
        modelBuilder.Entity<MstDesignation>()
            .HasKey(d => d.strDesignationGUID);

        // Make designation name unique within a group (nullable group allowed)
        modelBuilder.Entity<MstDesignation>()
            .HasIndex(d => new { d.strName, d.strGroupGUID })
            .IsUnique();
            
        // Configure MstDepartment
        modelBuilder.Entity<MstDepartment>()
            .HasKey(d => d.strDepartmentGUID);

        // Prevent duplicate department names within the same group
        modelBuilder.Entity<MstDepartment>()
            .HasIndex(d => new { d.strDepartmentName, d.strGroupGUID })
            .IsUnique();
            
        // Configure MstMenu with explicit column mappings
        modelBuilder.Entity<MstMenu>(entity =>
        {
            entity.HasKey(m => m.strMenuGUID);
            
            entity.Property(m => m.strMenuGUID)
                .HasColumnName("strMenuGUID");
                
            entity.Property(m => m.strMasterMenuGUID)
                .HasColumnName("strMasterMenuGUID");
                
            entity.Property(m => m.strParentMenuGUID)
                .HasColumnName("strParentMenuGUID");
            
            entity.HasIndex(m => new { m.strParentMenuGUID, m.strName })
                .IsUnique()
                .HasFilter("[strParentMenuGUID] IS NOT NULL");

            // Update unique index to include strGroupGUID and strModuleGUID
            entity.HasIndex(m => new { m.strPath, m.strGroupGUID, m.strModuleGUID })
                .IsUnique()
                .HasFilter("[strPath] IS NOT NULL");

            entity.HasOne(m => m.ParentMenu)
                .WithMany(m => m.ChildMenus)
                .HasForeignKey(m => m.strParentMenuGUID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MstMasterMenu>(entity =>
        {
            entity.HasKey(m => m.strMasterMenuGUID);
            
            entity.Property(m => m.strMasterMenuGUID)
                .HasColumnName("strMasterMenuGUID");
                
            entity.Property(m => m.strParentMenuGUID)
                .HasColumnName("strParentMenuGUID");
                
            entity.Property(m => m.strModuleGUID)
                .HasColumnName("strModuleGUID");
            
            entity.HasIndex(m => new { m.strParentMenuGUID, m.strName })
                .IsUnique()
                .HasFilter("[strParentMenuGUID] IS NOT NULL");

            entity.HasIndex(m => m.strPath)
                .IsUnique()
                .HasFilter("[strPath] IS NOT NULL");

            entity.HasOne(m => m.ParentMasterMenu)
                .WithMany(m => m.ChildMasterMenus)
                .HasForeignKey(m => m.strParentMenuGUID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MstUserRights>(entity =>
        {
            entity.HasKey(r => r.strUserRightGUID);
            
            entity.HasIndex(r => new { r.strUserRoleGUID, r.strMenuGUID })
                .IsUnique();

            entity.HasOne(r => r.MstUserRole)
                .WithMany()
                .HasForeignKey(r => r.strUserRoleGUID)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.MstMenu)
                .WithMany()
                .HasForeignKey(r => r.strMenuGUID)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure MstUserSession
        modelBuilder.Entity<MstUserSession>(entity =>
        {
            entity.HasKey(s => s.strUserSessionGUID);
            entity.HasIndex(s => new { s.strUserGUID, s.JwtId }).IsUnique();

            entity.HasOne(s => s.MstUser)
                .WithMany()
                .HasForeignKey(s => s.strUserGUID)
                .OnDelete(DeleteBehavior.Cascade);
        });
            
        // Configure MstUserDetails
        modelBuilder.Entity<MstUserDetails>()
            .HasKey(ud => ud.strUserDetailGUID);
            
        modelBuilder.Entity<MstUserDetails>()
            .HasIndex(ud => new { ud.strUserGUID, ud.strOrganizationGUID, ud.strYearGUID, ud.strModuleGUID })
            .IsUnique()
            .HasFilter(null); // Apply to all records, including those with null strModuleGUID
            
        // Configure MstYear with unique constraint on name + organization + company
        modelBuilder.Entity<MstYear>()
            .HasIndex(y => new { y.strName, y.strOrganizationGUID, y.strGroupGUID })
            .IsUnique();
            
        // Configure MstGroupModule
        modelBuilder.Entity<MstGroupModule>()
            .HasKey(gm => gm.strGroupModuleGUID);
            
        // Prevent duplicates with the same group and module
        modelBuilder.Entity<MstGroupModule>()
            .HasIndex(gm => new { gm.strGroupGUID, gm.strModuleGUID })
            .IsUnique();
            
        modelBuilder.Entity<MstGroupModule>()
            .HasOne(gm => gm.Group)
            .WithMany()
            .HasForeignKey(gm => gm.strGroupGUID)
            .OnDelete(DeleteBehavior.NoAction);
            
        modelBuilder.Entity<MstGroupModule>()
            .HasOne(gm => gm.Module)
            .WithMany()
            .HasForeignKey(gm => gm.strModuleGUID)
            .OnDelete(DeleteBehavior.NoAction);
    }
    
    private void ApplyForeignKeyNamingConvention(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            // Skip the MstMenu entity as we're explicitly configuring its columns
            if (entityType.ClrType == typeof(MstMenu))
            {
                continue;
            }
            
            foreach (var foreignKey in entityType.GetForeignKeys())
            {
                // Get the principal entity type
                var principalEntityType = foreignKey.PrincipalEntityType;
                var principalPrimaryKey = principalEntityType.FindPrimaryKey();
                
                if (principalPrimaryKey != null && principalPrimaryKey.Properties.Count == 1)
                {
                    // Get the expected FK name based on the principal entity's PK name
                    var principalPkName = principalPrimaryKey.Properties[0].Name;
                    
                    // Update the FK property to use the same name, but only if it's a single FK
                    // Skip if there are multiple FKs to the same table to avoid column conflicts
                    var foreignKeysToSameTable = entityType.GetForeignKeys()
                        .Where(fk => fk.PrincipalEntityType == principalEntityType).ToList();
                    
                    if (foreignKeysToSameTable.Count == 1)
                    {
                        foreach (var property in foreignKey.Properties)
                        {
                            if (property.Name != principalPkName)
                            {
                                property.SetColumnName(principalPkName);
                            }
                        }
                    }
                    // For multiple FKs to the same table, keep the original property names as column names
                }
            }
        }
    }
} 