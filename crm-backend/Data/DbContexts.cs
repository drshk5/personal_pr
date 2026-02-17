using System;
using Microsoft.EntityFrameworkCore;
using crm_backend.Models.Core.CustomerData;
using crm_backend.Models.External;
using Microsoft.Extensions.Logging;
using System.Collections.Concurrent;
using System.Threading;
using System.Linq;

namespace crm_backend.Data
{
    // =============================================
    // Master Database Context - Central Database
    // =============================================
    public class MasterDbContext : DbContext
    {
        public MasterDbContext(DbContextOptions<MasterDbContext> options)
            : base(options)
        {
        }

        // Define master database entities
        public DbSet<MstUser> MstUsers { get; set; } = null!;
        public DbSet<MstOrganization> MstOrganizations { get; set; } = null!;
        public DbSet<MstGroupModule> MstGroupModules { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure external entities
            modelBuilder.Entity<MstUser>()
                .HasKey(e => e.strUserGUID);

            modelBuilder.Entity<MstUser>()
                .ToTable("mstUser");

            modelBuilder.Entity<MstOrganization>()
                .HasKey(e => e.strOrganizationGUID);

            modelBuilder.Entity<MstOrganization>()
                .ToTable("mstOrganization");

            modelBuilder.Entity<MstGroupModule>()
                .HasKey(e => e.strGroupModuleGUID);

            modelBuilder.Entity<MstGroupModule>()
                .ToTable("mstGroupModule");
        }
    }

    // =============================================
    // Tenant Database Context - Module Database
    // =============================================
    public class CrmDbContext : DbContext
    {
        private readonly Guid _tenantId;
        private readonly string _connectionString;
        private readonly string _schema;
        private bool _modelConfigured;

        // Constructor for dynamic tenant context (with connection string and schema)
        public CrmDbContext(string connectionString, string schema, IHttpContextAccessor httpContextAccessor)
        {
            _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
            _schema = schema ?? throw new ArgumentNullException(nameof(schema));
            _modelConfigured = false;

            // Extract tenant ID from HTTP context
            var tenantId = httpContextAccessor.HttpContext?.Items["TenantId"] as string;
            _tenantId = tenantId != null ? Guid.Parse(tenantId) : Guid.Empty;

            // Force a new model to be created
            ChangeTracker.Clear();
        }

        // Legacy constructor for compatibility (if needed)
        public CrmDbContext(DbContextOptions<CrmDbContext> options, ITenantContextProvider tenantContextProvider)
            : base(options)
        {
            _tenantId = tenantContextProvider.GetTenantId();
            _connectionString = string.Empty;
            _schema = "crm";
            _modelConfigured = false;
        }

        // Core CRM
        public DbSet<MstLead> MstLeads { get; set; } = null!;
        public DbSet<MstAccount> MstAccounts { get; set; } = null!;
        public DbSet<MstContact> MstContacts { get; set; } = null!;
        public DbSet<MstOpportunity> MstOpportunities { get; set; } = null!;
        public DbSet<MstOpportunityContact> MstOpportunityContacts { get; set; } = null!;
        public DbSet<MstPipeline> MstPipelines { get; set; } = null!;
        public DbSet<MstPipelineStage> MstPipelineStages { get; set; } = null!;
        public DbSet<MstActivity> MstActivities { get; set; } = null!;
        public DbSet<MstActivityLink> MstActivityLinks { get; set; } = null!;
        public DbSet<MstAuditLog> MstAuditLogs { get; set; } = null!;

        // Advanced Lead Management
        public DbSet<MstLeadScoringRule> MstLeadScoringRules { get; set; } = null!;
        public DbSet<MstLeadScoreHistory> MstLeadScoreHistory { get; set; } = null!;
        public DbSet<MstLeadAssignmentRule> MstLeadAssignmentRules { get; set; } = null!;
        public DbSet<MstLeadAssignmentMember> MstLeadAssignmentMembers { get; set; } = null!;
        public DbSet<MstLeadDuplicate> MstLeadDuplicates { get; set; } = null!;
        public DbSet<MstLeadMergeHistory> MstLeadMergeHistory { get; set; } = null!;
        public DbSet<MstWorkflowRule> MstWorkflowRules { get; set; } = null!;
        public DbSet<MstWorkflowExecution> MstWorkflowExecutions { get; set; } = null!;
        public DbSet<MstWebForm> MstWebForms { get; set; } = null!;
        public DbSet<MstWebFormField> MstWebFormFields { get; set; } = null!;
        public DbSet<MstWebFormSubmission> MstWebFormSubmissions { get; set; } = null!;
        public DbSet<MstImportJob> MstImportJobs { get; set; } = null!;
        public DbSet<MstImportJobError> MstImportJobErrors { get; set; } = null!;
        public DbSet<MstLeadCommunication> MstLeadCommunications { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!_modelConfigured && !string.IsNullOrEmpty(_connectionString))
            {
                // Configure SQL Server with proper schema handling
                optionsBuilder.UseSqlServer(_connectionString, options =>
                {
                    // This ensures EF Core correctly handles schema names
                    options.MigrationsHistoryTable("__EFMigrationsHistory", _schema);
                    options.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);
                })
                .EnableServiceProviderCaching(false); // Prevent caching of model between requests

                _modelConfigured = true;
            }
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Force model rebuild to ensure schema changes are applied
            builder.Model.GetEntityTypes().ToList().ForEach(e =>
            {
                var tableName = e.GetTableName()?.Split('.').Last() ?? e.ClrType.Name;
                e.SetTableName(tableName);
                e.SetSchema(_schema);
            });

            // === Default Schema for CRM tables ===
            builder.HasDefaultSchema(_schema);

            // === Table Names ===
            builder.Entity<MstLead>().ToTable("MstLeads");
            builder.Entity<MstAccount>().ToTable("MstAccounts");
            builder.Entity<MstContact>().ToTable("MstContacts");
            builder.Entity<MstOpportunity>().ToTable("MstOpportunities");
            builder.Entity<MstOpportunityContact>().ToTable("MstOpportunityContacts");
            builder.Entity<MstPipeline>().ToTable("MstPipelines");
            builder.Entity<MstPipelineStage>().ToTable("MstPipelineStages");
            builder.Entity<MstActivity>().ToTable("MstActivities");
            builder.Entity<MstActivityLink>().ToTable("MstActivityLinks");
            builder.Entity<MstAuditLog>().ToTable("MstAuditLogs");
            builder.Entity<MstLeadScoringRule>().ToTable("MstLeadScoringRules");
            builder.Entity<MstLeadScoreHistory>().ToTable("MstLeadScoreHistory");
            builder.Entity<MstLeadAssignmentRule>().ToTable("MstLeadAssignmentRules");
            builder.Entity<MstLeadAssignmentMember>().ToTable("MstLeadAssignmentMembers");
            builder.Entity<MstLeadDuplicate>().ToTable("MstLeadDuplicates");
            builder.Entity<MstLeadMergeHistory>().ToTable("MstLeadMergeHistory");
            builder.Entity<MstWorkflowRule>().ToTable("MstWorkflowRules");
            builder.Entity<MstWorkflowExecution>().ToTable("MstWorkflowExecutions");
            builder.Entity<MstWebForm>().ToTable("MstWebForms");
            builder.Entity<MstWebFormField>().ToTable("MstWebFormFields");
            builder.Entity<MstWebFormSubmission>().ToTable("MstWebFormSubmissions");
            builder.Entity<MstImportJob>().ToTable("MstImportJobs");
            builder.Entity<MstImportJobError>().ToTable("MstImportJobErrors");
            builder.Entity<MstLeadCommunication>().ToTable("MstLeadCommunications");

            // === Primary Keys ===
            builder.Entity<MstLead>().HasKey(e => e.strLeadGUID);
            builder.Entity<MstAccount>().HasKey(e => e.strAccountGUID);
            builder.Entity<MstContact>().HasKey(e => e.strContactGUID);
            builder.Entity<MstOpportunity>().HasKey(e => e.strOpportunityGUID);
            builder.Entity<MstOpportunityContact>().HasKey(e => e.strOpportunityContactGUID);
            builder.Entity<MstPipeline>().HasKey(e => e.strPipelineGUID);
            builder.Entity<MstPipelineStage>().HasKey(e => e.strStageGUID);
            builder.Entity<MstActivity>().HasKey(e => e.strActivityGUID);
            builder.Entity<MstActivityLink>().HasKey(e => e.strActivityLinkGUID);
            builder.Entity<MstAuditLog>().HasKey(e => e.strAuditLogGUID);
            builder.Entity<MstLeadScoringRule>().HasKey(e => e.strScoringRuleGUID);
            builder.Entity<MstLeadScoreHistory>().HasKey(e => e.strScoreHistoryGUID);
            builder.Entity<MstLeadAssignmentRule>().HasKey(e => e.strAssignmentRuleGUID);
            builder.Entity<MstLeadAssignmentMember>().HasKey(e => e.strAssignmentMemberGUID);
            builder.Entity<MstLeadDuplicate>().HasKey(e => e.strDuplicateGUID);
            builder.Entity<MstLeadMergeHistory>().HasKey(e => e.strMergeHistoryGUID);
            builder.Entity<MstWorkflowRule>().HasKey(e => e.strWorkflowRuleGUID);
            builder.Entity<MstWorkflowExecution>().HasKey(e => e.strExecutionGUID);
            builder.Entity<MstWebForm>().HasKey(e => e.strWebFormGUID);
            builder.Entity<MstWebFormField>().HasKey(e => e.strWebFormFieldGUID);
            builder.Entity<MstWebFormSubmission>().HasKey(e => e.strSubmissionGUID);
            builder.Entity<MstImportJob>().HasKey(e => e.strImportJobGUID);
            builder.Entity<MstImportJobError>().HasKey(e => e.strImportJobErrorGUID);
            builder.Entity<MstLeadCommunication>().HasKey(e => e.strCommunicationGUID);

            // === Global Query Filters (Multi-Tenancy + Soft Delete) ===
            builder.Entity<MstLead>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstAccount>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstContact>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstOpportunity>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstPipeline>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstActivity>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstAuditLog>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstLeadScoringRule>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstLeadScoreHistory>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstLeadAssignmentRule>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstLeadAssignmentMember>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstLeadDuplicate>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstLeadMergeHistory>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstWorkflowRule>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstWorkflowExecution>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstWebForm>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
            builder.Entity<MstWebFormField>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstWebFormSubmission>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstImportJob>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstImportJobError>().HasQueryFilter(e => e.strGroupGUID == _tenantId);
            builder.Entity<MstLeadCommunication>().HasQueryFilter(e => e.strGroupGUID == _tenantId);

            // === Entity Configurations ===
            ConfigureMstLead(builder);
            ConfigureMstAccount(builder);
            ConfigureMstContact(builder);
            ConfigureMstPipeline(builder);
            ConfigureMstPipelineStage(builder);
            ConfigureMstOpportunity(builder);
            ConfigureMstOpportunityContact(builder);
            ConfigureMstActivity(builder);
            ConfigureMstActivityLink(builder);
            ConfigureMstAuditLog(builder);
            ConfigureMstLeadScoringRule(builder);
            ConfigureMstLeadScoreHistory(builder);
            ConfigureMstLeadAssignmentRule(builder);
            ConfigureMstLeadAssignmentMember(builder);
            ConfigureMstLeadDuplicate(builder);
            ConfigureMstLeadMergeHistory(builder);
            ConfigureMstWorkflowRule(builder);
            ConfigureMstWorkflowExecution(builder);
            ConfigureMstWebForm(builder);
            ConfigureMstWebFormField(builder);
            ConfigureMstWebFormSubmission(builder);
            ConfigureMstImportJob(builder);
            ConfigureMstImportJobError(builder);
            ConfigureMstLeadCommunication(builder);
        }

        private void ConfigureMstLead(ModelBuilder builder)
        {
            builder.Entity<MstLead>(entity =>
            {
                // ActivityLinks is a polymorphic link and is queried by entity type + GUID, not a direct FK relation.
                entity.Ignore(e => e.ActivityLinks);
                entity.Property(e => e.strLeadGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strFirstName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strLastName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strEmail).HasMaxLength(255).IsRequired();
                entity.Property(e => e.strPhone).HasMaxLength(20);
                entity.Property(e => e.strCompanyName).HasMaxLength(200);
                entity.Property(e => e.strJobTitle).HasMaxLength(150);
                entity.Property(e => e.strSource).HasMaxLength(50).IsRequired();
                entity.Property(e => e.strStatus).HasMaxLength(50).IsRequired().HasDefaultValue("New");
                entity.Property(e => e.intLeadScore).HasDefaultValue(0);
                entity.Property(e => e.strAddress).HasMaxLength(500);
                entity.Property(e => e.strCity).HasMaxLength(100);
                entity.Property(e => e.strState).HasMaxLength(100);
                entity.Property(e => e.strCountry).HasMaxLength(100);
                entity.Property(e => e.strPostalCode).HasMaxLength(20);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);

                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstLeads_GroupGUID");
                entity.HasIndex(e => e.strStatus).HasDatabaseName("IX_MstLeads_Status");
                entity.HasIndex(e => e.strEmail).HasDatabaseName("IX_MstLeads_Email");
                entity.HasIndex(e => e.strAssignedToGUID).HasDatabaseName("IX_MstLeads_AssignedTo");

                entity.HasOne(e => e.ConvertedAccount)
                    .WithMany()
                    .HasForeignKey(e => e.strConvertedAccountGUID)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ConvertedContact)
                    .WithMany()
                    .HasForeignKey(e => e.strConvertedContactGUID)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ConvertedOpportunity)
                    .WithMany()
                    .HasForeignKey(e => e.strConvertedOpportunityGUID)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureMstAccount(ModelBuilder builder)
        {
            builder.Entity<MstAccount>(entity =>
            {
                // ActivityLinks is polymorphic; ignore navigation to avoid EF creating shadow FK columns.
                entity.Ignore(e => e.ActivityLinks);
                entity.Property(e => e.strAccountGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strAccountName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.strIndustry).HasMaxLength(100);
                entity.Property(e => e.strWebsite).HasMaxLength(500);
                entity.Property(e => e.strPhone).HasMaxLength(20);
                entity.Property(e => e.strEmail).HasMaxLength(255);
                entity.Property(e => e.dblAnnualRevenue).HasColumnType("decimal(18,2)");
                entity.Property(e => e.strAddress).HasMaxLength(500);
                entity.Property(e => e.strCity).HasMaxLength(100);
                entity.Property(e => e.strState).HasMaxLength(100);
                entity.Property(e => e.strCountry).HasMaxLength(100);
                entity.Property(e => e.strPostalCode).HasMaxLength(20);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);

                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstAccounts_GroupGUID");
                entity.HasIndex(e => e.strAccountName).HasDatabaseName("IX_MstAccounts_AccountName");
            });
        }

        private void ConfigureMstContact(ModelBuilder builder)
        {
            builder.Entity<MstContact>(entity =>
            {
                // ActivityLinks is polymorphic; ignore navigation to avoid EF creating shadow FK columns.
                entity.Ignore(e => e.ActivityLinks);
                entity.Property(e => e.strContactGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strFirstName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strLastName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strEmail).HasMaxLength(255).IsRequired();
                entity.Property(e => e.strPhone).HasMaxLength(20);
                entity.Property(e => e.strMobilePhone).HasMaxLength(20);
                entity.Property(e => e.strJobTitle).HasMaxLength(150);
                entity.Property(e => e.strDepartment).HasMaxLength(100);
                entity.Property(e => e.strLifecycleStage).HasMaxLength(50).HasDefaultValue("Subscriber");
                entity.Property(e => e.strAddress).HasMaxLength(500);
                entity.Property(e => e.strCity).HasMaxLength(100);
                entity.Property(e => e.strState).HasMaxLength(100);
                entity.Property(e => e.strCountry).HasMaxLength(100);
                entity.Property(e => e.strPostalCode).HasMaxLength(20);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);

                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstContacts_GroupGUID");
                entity.HasIndex(e => e.strAccountGUID).HasDatabaseName("IX_MstContacts_AccountGUID");
                entity.HasIndex(e => e.strEmail).HasDatabaseName("IX_MstContacts_Email");

                entity.HasOne(e => e.Account)
                    .WithMany(a => a.Contacts)
                    .HasForeignKey(e => e.strAccountGUID)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureMstPipeline(ModelBuilder builder)
        {
            builder.Entity<MstPipeline>(entity =>
            {
                entity.Property(e => e.strPipelineGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strPipelineName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.strDescription).HasMaxLength(500);
                entity.Property(e => e.bolIsDefault).HasDefaultValue(false);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);
            });
        }

        private void ConfigureMstPipelineStage(ModelBuilder builder)
        {
            builder.Entity<MstPipelineStage>(entity =>
            {
                entity.Property(e => e.strStageGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strStageName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.intProbabilityPercent).HasDefaultValue(0);
                entity.Property(e => e.intDefaultDaysToRot).HasDefaultValue(30);
                entity.Property(e => e.bolIsWonStage).HasDefaultValue(false);
                entity.Property(e => e.bolIsLostStage).HasDefaultValue(false);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);

                entity.HasOne(e => e.Pipeline)
                    .WithMany(p => p.Stages)
                    .HasForeignKey(e => e.strPipelineGUID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureMstOpportunity(ModelBuilder builder)
        {
            builder.Entity<MstOpportunity>(entity =>
            {
                // ActivityLinks is polymorphic; ignore navigation to avoid EF creating shadow FK columns.
                entity.Ignore(e => e.ActivityLinks);
                entity.Property(e => e.strOpportunityGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strOpportunityName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.strStatus).HasMaxLength(50).IsRequired().HasDefaultValue("Open");
                entity.Property(e => e.dblAmount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.strCurrency).HasMaxLength(10).HasDefaultValue("INR");
                entity.Property(e => e.strLossReason).HasMaxLength(500);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);

                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstOpportunities_GroupGUID");
                entity.HasIndex(e => e.strPipelineGUID).HasDatabaseName("IX_MstOpportunities_PipelineGUID");
                entity.HasIndex(e => e.strStageGUID).HasDatabaseName("IX_MstOpportunities_StageGUID");
                entity.HasIndex(e => e.strAccountGUID).HasDatabaseName("IX_MstOpportunities_AccountGUID");
                entity.HasIndex(e => e.strStatus).HasDatabaseName("IX_MstOpportunities_Status");

                entity.HasOne(e => e.Account)
                    .WithMany(a => a.Opportunities)
                    .HasForeignKey(e => e.strAccountGUID)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Pipeline)
                    .WithMany(p => p.Opportunities)
                    .HasForeignKey(e => e.strPipelineGUID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Stage)
                    .WithMany()
                    .HasForeignKey(e => e.strStageGUID)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private void ConfigureMstOpportunityContact(ModelBuilder builder)
        {
            builder.Entity<MstOpportunityContact>(entity =>
            {
                entity.Property(e => e.strOpportunityContactGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strRole).HasMaxLength(50).HasDefaultValue("Stakeholder");
                entity.Property(e => e.bolIsPrimary).HasDefaultValue(false);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => new { e.strOpportunityGUID, e.strContactGUID }).IsUnique();

                entity.HasOne(e => e.Opportunity)
                    .WithMany(o => o.OpportunityContacts)
                    .HasForeignKey(e => e.strOpportunityGUID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Contact)
                    .WithMany(c => c.OpportunityContacts)
                    .HasForeignKey(e => e.strContactGUID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureMstActivity(ModelBuilder builder)
        {
            builder.Entity<MstActivity>(entity =>
            {
                entity.Property(e => e.strActivityGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strActivityType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.strSubject).HasMaxLength(300).IsRequired();
                entity.Property(e => e.strOutcome).HasMaxLength(200);
                entity.Property(e => e.dtScheduledOn).HasColumnName("dtScheduledStart");
                entity.Property(e => e.dtCompletedOn).HasColumnName("dtActualEnd");
                entity.Property(e => e.intDurationMinutes);
                entity.Property(e => e.strStatus).HasMaxLength(50).HasDefaultValue("Pending");
                entity.Property(e => e.strPriority).HasMaxLength(50).HasDefaultValue("Normal");
                entity.Property(e => e.dtDueDate);
                entity.Property(e => e.strCategory).HasMaxLength(100);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);
                entity.Property(e => e.dtDeletedOn);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
            });
        }

        private void ConfigureMstActivityLink(ModelBuilder builder)
        {
            builder.Entity<MstActivityLink>(entity =>
            {
                entity.Property(e => e.strActivityLinkGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strEntityType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => new { e.strActivityGUID, e.strEntityType, e.strEntityGUID }).IsUnique();
                entity.HasIndex(e => new { e.strEntityType, e.strEntityGUID }).HasDatabaseName("IX_MstActivityLinks_Entity");

                entity.HasOne(e => e.Activity)
                    .WithMany(a => a.ActivityLinks)
                    .HasForeignKey(e => e.strActivityGUID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureMstAuditLog(ModelBuilder builder)
        {
            builder.Entity<MstAuditLog>(entity =>
            {
                entity.Property(e => e.strAuditLogGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strEntityType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.strAction).HasMaxLength(50).IsRequired();
                entity.Property(e => e.strChanges).HasColumnName("strChanges");
                entity.Property(e => e.dtPerformedOn).HasDefaultValueSql("GETUTCDATE()");
            });
        }

        private void ConfigureMstLeadScoringRule(ModelBuilder builder)
        {
            builder.Entity<MstLeadScoringRule>(entity =>
            {
                entity.Property(e => e.strScoringRuleGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strRuleName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.strRuleCategory).HasMaxLength(50).IsRequired();
                entity.Property(e => e.strConditionField).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strConditionOperator).HasMaxLength(20).HasDefaultValue("Equals");
                entity.Property(e => e.strConditionValue).HasMaxLength(500);
                entity.Property(e => e.intScorePoints).HasColumnName("intScoreChange");
                entity.Property(e => e.intDecayDays);
                entity.Property(e => e.intSortOrder);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);

                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstLeadScoringRules_GroupGUID");
            });
        }

        private void ConfigureMstLeadScoreHistory(ModelBuilder builder)
        {
            builder.Entity<MstLeadScoreHistory>(entity =>
            {
                entity.Property(e => e.strScoreHistoryGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.intPreviousScore).HasColumnName("intOldScore");
                entity.Property(e => e.strChangeReason).HasMaxLength(500).IsRequired();
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => e.strLeadGUID).HasDatabaseName("IX_MstLeadScoreHistory_LeadGUID");
                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstLeadScoreHistory_GroupGUID");

                entity.HasOne(e => e.Lead)
                    .WithMany()
                    .HasForeignKey(e => e.strLeadGUID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.ScoringRule)
                    .WithMany()
                    .HasForeignKey(e => e.strScoringRuleGUID)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureMstLeadAssignmentRule(ModelBuilder builder)
        {
            builder.Entity<MstLeadAssignmentRule>(entity =>
            {
                entity.Property(e => e.strAssignmentRuleGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strRuleName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.strAssignmentType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.strConditionJson).HasColumnName("strCriteria");
                entity.Property(e => e.intLastAssignedIndex);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);

                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstLeadAssignmentRules_GroupGUID");
            });
        }

        private void ConfigureMstLeadAssignmentMember(ModelBuilder builder)
        {
            builder.Entity<MstLeadAssignmentMember>(entity =>
            {
                entity.Property(e => e.strAssignmentMemberGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.intMaxCapacity).HasColumnName("intCapacityPercentage");
                entity.Property(e => e.strSkillLevel).HasMaxLength(50);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);

                entity.HasIndex(e => e.strAssignmentRuleGUID).HasDatabaseName("IX_MstLeadAssignmentMembers_RuleGUID");

                entity.HasOne(e => e.AssignmentRule)
                    .WithMany(r => r.Members)
                    .HasForeignKey(e => e.strAssignmentRuleGUID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureMstLeadDuplicate(ModelBuilder builder)
        {
            builder.Entity<MstLeadDuplicate>(entity =>
            {
                entity.Property(e => e.strDuplicateGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strMatchType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.dblConfidenceScore).HasColumnType("decimal(5,2)");
                entity.Property(e => e.strStatus).HasMaxLength(30).HasDefaultValue("Pending");
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstLeadDuplicates_GroupGUID");
                entity.HasIndex(e => e.strLeadGUID1).HasDatabaseName("IX_MstLeadDuplicates_LeadGUID1");
                entity.HasIndex(e => e.strLeadGUID2).HasDatabaseName("IX_MstLeadDuplicates_LeadGUID2");

                entity.HasOne(e => e.Lead1)
                    .WithMany()
                    .HasForeignKey(e => e.strLeadGUID1)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(e => e.Lead2)
                    .WithMany()
                    .HasForeignKey(e => e.strLeadGUID2)
                    .OnDelete(DeleteBehavior.NoAction);
            });
        }

        private void ConfigureMstLeadMergeHistory(ModelBuilder builder)
        {
            builder.Entity<MstLeadMergeHistory>(entity =>
            {
                entity.Property(e => e.strMergeHistoryGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strMergedDataJson).HasColumnName("strMergedLeadsJson");
                entity.Property(e => e.strMergedLeadGUID);
                entity.Property(e => e.dtMergedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.SurvivorLead)
                    .WithMany()
                    .HasForeignKey(e => e.strSurvivorLeadGUID)
                    .OnDelete(DeleteBehavior.NoAction);
            });
        }

        private void ConfigureMstWorkflowRule(ModelBuilder builder)
        {
            builder.Entity<MstWorkflowRule>(entity =>
            {
                entity.Property(e => e.strWorkflowRuleGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strRuleName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.strEntityType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.strTriggerEvent).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strActionType).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strTriggerConditionJson).HasColumnName("strConditions");
                entity.Property(e => e.strActionConfigJson).HasColumnName("strActionConfig");
                entity.Property(e => e.intDelayMinutes).HasColumnName("intExecutionOrder");
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);
            });
        }

        private void ConfigureMstWorkflowExecution(ModelBuilder builder)
        {
            builder.Entity<MstWorkflowExecution>(entity =>
            {
                entity.Property(e => e.strExecutionGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strStatus).HasMaxLength(30).IsRequired();
                entity.Property(e => e.dtScheduledFor).HasColumnName("dtStartedOn");
                entity.Property(e => e.dtExecutedOn).HasColumnName("dtCompletedOn");
                entity.Property(e => e.strResultJson).HasColumnName("strErrorMessage");
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.WorkflowRule)
                    .WithMany(r => r.Executions)
                    .HasForeignKey(e => e.strWorkflowRuleGUID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureMstWebForm(ModelBuilder builder)
        {
            builder.Entity<MstWebForm>(entity =>
            {
                entity.Property(e => e.strWebFormGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strFormName).HasMaxLength(200).IsRequired();
                entity.Property(e => e.strFormDescription).HasMaxLength(500);
                entity.Property(e => e.strRedirectUrl).HasMaxLength(500);
                entity.Property(e => e.strThankYouMessage).HasMaxLength(500);
                entity.Property(e => e.strDefaultSource).HasMaxLength(50).HasDefaultValue("Website");
                entity.Property(e => e.strDefaultAssignedToGUID);
                entity.Property(e => e.strCustomCss);
                entity.Property(e => e.bolIsActive).HasDefaultValue(true);
                entity.Property(e => e.bolIsDeleted).HasDefaultValue(false);
                entity.Property(e => e.bolCaptchaEnabled).HasDefaultValue(true);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
            });
        }

        private void ConfigureMstWebFormField(ModelBuilder builder)
        {
            builder.Entity<MstWebFormField>(entity =>
            {
                entity.Property(e => e.strWebFormFieldGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strFieldLabel).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strFieldType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.strMappedLeadField).HasMaxLength(100).IsRequired();
                entity.Property(e => e.strDefaultValue).HasMaxLength(500);
                entity.Property(e => e.strOptionsJson);
                entity.Property(e => e.intSortOrder).HasColumnName("intDisplayOrder");
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.WebForm)
                    .WithMany(f => f.Fields)
                    .HasForeignKey(e => e.strWebFormGUID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureMstWebFormSubmission(ModelBuilder builder)
        {
            builder.Entity<MstWebFormSubmission>(entity =>
            {
                entity.Property(e => e.strSubmissionGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strSubmittedDataJson).IsRequired();
                entity.Property(e => e.strIpAddress).HasMaxLength(50);
                entity.Property(e => e.strUserAgent).HasMaxLength(500);
                entity.Property(e => e.strReferrerUrl).HasMaxLength(500);
                entity.Property(e => e.strUtmSource).HasMaxLength(200);
                entity.Property(e => e.strUtmMedium).HasMaxLength(200);
                entity.Property(e => e.strUtmCampaign).HasMaxLength(200);
                entity.Property(e => e.strUtmTerm).HasMaxLength(200);
                entity.Property(e => e.strUtmContent).HasMaxLength(200);
                entity.Property(e => e.strStatus).HasMaxLength(30).HasDefaultValue("Processed");
                entity.Property(e => e.strErrorMessage).HasMaxLength(500);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.WebForm)
                    .WithMany(f => f.Submissions)
                    .HasForeignKey(e => e.strWebFormGUID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Lead)
                    .WithMany()
                    .HasForeignKey(e => e.strLeadGUID)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private void ConfigureMstImportJob(ModelBuilder builder)
        {
            builder.Entity<MstImportJob>(entity =>
            {
                entity.Property(e => e.strImportJobGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strFileName).HasMaxLength(300).IsRequired();
                entity.Property(e => e.strStatus).HasMaxLength(30).HasDefaultValue("Pending");
                entity.Property(e => e.intTotalRows).HasColumnName("intTotalRecords");
                entity.Property(e => e.intSuccessRows).HasColumnName("intSuccessRecords");
                entity.Property(e => e.intErrorRows).HasColumnName("intFailedRecords");
                entity.Property(e => e.intProcessedRows);
                entity.Property(e => e.intDuplicateRows);
                entity.Property(e => e.strDuplicateHandling).HasMaxLength(30).HasDefaultValue("Skip");
                entity.Property(e => e.strColumnMappingJson).IsRequired();
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");
            });
        }

        private void ConfigureMstImportJobError(ModelBuilder builder)
        {
            builder.Entity<MstImportJobError>(entity =>
            {
                entity.Property(e => e.strImportJobErrorGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strRawDataJson).HasColumnName("strRowDataJson");
                entity.Property(e => e.strErrorMessage).HasMaxLength(500).IsRequired();
                entity.Property(e => e.strErrorType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasOne(e => e.ImportJob)
                    .WithMany(j => j.Errors)
                    .HasForeignKey(e => e.strImportJobGUID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private void ConfigureMstLeadCommunication(ModelBuilder builder)
        {
            builder.Entity<MstLeadCommunication>(entity =>
            {
                entity.Property(e => e.strCommunicationGUID).HasDefaultValueSql("NEWID()");
                entity.Property(e => e.strChannelType).HasMaxLength(30).IsRequired();
                entity.Property(e => e.strDirection).HasMaxLength(20).IsRequired();
                entity.Property(e => e.strSubject).HasMaxLength(300);
                entity.Property(e => e.strFromAddress).HasMaxLength(255);
                entity.Property(e => e.strToAddress).HasMaxLength(255);
                entity.Property(e => e.strCallOutcome).HasMaxLength(100);
                entity.Property(e => e.strRecordingUrl).HasMaxLength(500);
                entity.Property(e => e.bolIsOpened).HasDefaultValue(false);
                entity.Property(e => e.intClickCount).HasDefaultValue(0);
                entity.Property(e => e.strExternalMessageId).HasMaxLength(200);
                entity.Property(e => e.strCreatedByGUID);
                entity.Property(e => e.dtCreatedOn).HasDefaultValueSql("GETUTCDATE()");

                entity.HasIndex(e => e.strLeadGUID).HasDatabaseName("IX_MstLeadCommunications_LeadGUID");
                entity.HasIndex(e => e.strGroupGUID).HasDatabaseName("IX_MstLeadCommunications_GroupGUID");
                entity.HasIndex(e => e.strTrackingPixelGUID).HasDatabaseName("IX_MstLeadCommunications_TrackingPixel");

                entity.HasOne(e => e.Lead)
                    .WithMany()
                    .HasForeignKey(e => e.strLeadGUID)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        public override void Dispose()
        {
            base.Dispose();
        }

        public override async ValueTask DisposeAsync()
        {
            await base.DisposeAsync();
        }
    }

    // =============================================
    // Tenant DB Context Manager
    // =============================================
    public interface ITenantDbContextManager
    {
        CrmDbContext GetTenantDbContext(string connectionString, string schema);
    }

    public class TenantDbContextManager : ITenantDbContextManager
    {
        private readonly ILogger<TenantDbContextManager> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        private static readonly AsyncLocal<ConcurrentDictionary<string, CrmDbContext>?> _ambientContexts
            = new AsyncLocal<ConcurrentDictionary<string, CrmDbContext>?>();

        public TenantDbContextManager(
            ILogger<TenantDbContextManager> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        public CrmDbContext GetTenantDbContext(string connectionString, string schema)
        {
            _logger.LogInformation("GetTenantDbContext called with schema: {Schema}", schema);

            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogError("Connection string is null or empty");
                throw new ArgumentException("Connection string cannot be null or empty", nameof(connectionString));
            }

            var contexts = _ambientContexts.Value;
            if (contexts == null)
            {
                contexts = new ConcurrentDictionary<string, CrmDbContext>();
                _ambientContexts.Value = contexts;
            }

            var key = $"{schema}|{connectionString}";

            if (contexts.TryGetValue(key, out var existingContext))
            {
                _logger.LogDebug("Reusing existing CrmDbContext for schema {Schema}", schema);
                return existingContext;
            }

            _logger.LogInformation("Creating new CrmDbContext with schema {Schema}", schema);

            var context = new CrmDbContext(connectionString, schema, _httpContextAccessor);

            if (!contexts.TryAdd(key, context))
            {
                if (contexts.TryGetValue(key, out var cached))
                {
                    _logger.LogDebug("Another CrmDbContext was created concurrently, reusing cached instance for schema {Schema}", schema);
                    context.Dispose();
                    return cached;
                }
            }

            _logger.LogInformation("Successfully created new CrmDbContext");
            return context;
        }
    }
}
