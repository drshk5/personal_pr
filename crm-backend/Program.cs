using Microsoft.EntityFrameworkCore;
using FluentValidation;
using FluentValidation.AspNetCore;
using Serilog;
using crm_backend.ApplicationServices.CustomerData;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Data;
using crm_backend.DataAccess.Interfaces;
using crm_backend.DataAccess.Repositories;
using crm_backend.Extensions;
using crm_backend.Filters;
using crm_backend.Helpers;
using crm_backend.Hubs;
using crm_backend.Interfaces;
using crm_backend.Middleware;
using crm_backend.Services.Background;
using crm_backend.Services.CustomerData;
using crm_backend.Services;
using crm_backend.Utils;
using crm_backend.Validators;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);

// ===== Serilog =====
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// ===== Database =====
// Master database context for accessing central database
builder.Services.AddDbContext<MasterDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ===== HttpContext Accessor =====
builder.Services.AddHttpContextAccessor();

// ===== Memory Cache =====
builder.Services.AddMemoryCache();

// ===== Tenant Context =====
builder.Services.AddScoped<ITenantContextProvider, TenantContextProvider>();
builder.Services.AddSingleton<ITenantDbContextManager, TenantDbContextManager>();
builder.Services.AddScoped<IConnectionStringResolver, ConnectionStringResolver>();

// Dynamic tenant CRM context: resolves group DB + organization schema per request
builder.Services.AddScoped<CrmDbContext>(serviceProvider =>
{
    var httpContextAccessor = serviceProvider.GetRequiredService<IHttpContextAccessor>();
    var tenantContextProvider = serviceProvider.GetRequiredService<ITenantContextProvider>();
    var connectionStringResolver = serviceProvider.GetRequiredService<IConnectionStringResolver>();
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var logger = serviceProvider.GetRequiredService<ILogger<CrmDbContext>>();

    var defaultConnectionString = configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("DefaultConnection is not configured");

    var groupGuid = tenantContextProvider.GetTenantId();
    var organizationGuid = tenantContextProvider.GetOrganizationId();
    var moduleGuid = tenantContextProvider.GetModuleId();

    var schema = organizationGuid != Guid.Empty
        ? SchemaUtility.GenerateSchemaFromOrganizationGuid(organizationGuid.ToString())
        : "crm";

    var resolvedConnectionString = defaultConnectionString;

    if (groupGuid != Guid.Empty)
    {
        string? connectionFromMetadata = null;

        if (moduleGuid != Guid.Empty)
        {
            connectionFromMetadata = connectionStringResolver
                .GetConnectionStringAsync(groupGuid, moduleGuid)
                .GetAwaiter()
                .GetResult();
        }

        connectionFromMetadata ??= connectionStringResolver
            .GetCrmConnectionStringByGroupAsync(groupGuid)
            .GetAwaiter()
            .GetResult();

        if (!string.IsNullOrWhiteSpace(connectionFromMetadata))
        {
            resolvedConnectionString = connectionFromMetadata;
        }
        else
        {
            var builder = new SqlConnectionStringBuilder(defaultConnectionString)
            {
                InitialCatalog = $"CRM_{groupGuid.ToString("N").ToLowerInvariant()}"
            };
            resolvedConnectionString = builder.ConnectionString;
        }
    }

    logger.LogInformation(
        "Resolved CRM context. GroupGUID: {GroupGUID}, OrganizationGUID: {OrganizationGUID}, ModuleGUID: {ModuleGUID}, Schema: {Schema}",
        groupGuid, organizationGuid, moduleGuid, schema);

    return new CrmDbContext(resolvedConnectionString, schema, httpContextAccessor);
});

// ===== Repositories =====
builder.Services.AddScoped<IMstLeadRepository, MstLeadRepository>();
builder.Services.AddScoped<IMstContactRepository, MstContactRepository>();
builder.Services.AddScoped<IMstAccountRepository, MstAccountRepository>();
builder.Services.AddScoped<IMstOpportunityRepository, MstOpportunityRepository>();
builder.Services.AddScoped<IMstOpportunityContactRepository, MstOpportunityContactRepository>();
builder.Services.AddScoped<IMstPipelineRepository, MstPipelineRepository>();
builder.Services.AddScoped<IMstPipelineStageRepository, MstPipelineStageRepository>();
builder.Services.AddScoped<IMstActivityRepository, MstActivityRepository>();
builder.Services.AddScoped<IMstActivityLinkRepository, MstActivityLinkRepository>();
builder.Services.AddScoped<IMstAuditLogRepository, MstAuditLogRepository>();
builder.Services.AddScoped<IMstLeadScoringRuleRepository, MstLeadScoringRuleRepository>();
builder.Services.AddScoped<IMstLeadScoreHistoryRepository, MstLeadScoreHistoryRepository>();
builder.Services.AddScoped<IMstLeadAssignmentRuleRepository, MstLeadAssignmentRuleRepository>();
builder.Services.AddScoped<IMstLeadAssignmentMemberRepository, MstLeadAssignmentMemberRepository>();
builder.Services.AddScoped<IMstLeadDuplicateRepository, MstLeadDuplicateRepository>();
builder.Services.AddScoped<IMstLeadMergeHistoryRepository, MstLeadMergeHistoryRepository>();
builder.Services.AddScoped<IMstWorkflowRuleRepository, MstWorkflowRuleRepository>();
builder.Services.AddScoped<IMstWorkflowExecutionRepository, MstWorkflowExecutionRepository>();
builder.Services.AddScoped<IMstWebFormRepository, MstWebFormRepository>();
builder.Services.AddScoped<IMstWebFormFieldRepository, MstWebFormFieldRepository>();
builder.Services.AddScoped<IMstWebFormSubmissionRepository, MstWebFormSubmissionRepository>();
builder.Services.AddScoped<IMstImportJobRepository, MstImportJobRepository>();
builder.Services.AddScoped<IMstImportJobErrorRepository, MstImportJobErrorRepository>();
builder.Services.AddScoped<IMstLeadCommunicationRepository, MstLeadCommunicationRepository>();

// ===== Unit of Work =====
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ===== Domain Services =====
builder.Services.AddScoped<ILeadService, MstLeadService>();
builder.Services.AddScoped<IContactService, MstContactService>();
builder.Services.AddScoped<IAccountService, MstAccountService>();
builder.Services.AddScoped<IAuditLogService, MstAuditLogService>();
builder.Services.AddScoped<ILeadScoringService, MstLeadScoringService>();
builder.Services.AddScoped<ILeadAssignmentService, MstLeadAssignmentService>();
builder.Services.AddScoped<ILeadDuplicateService, MstLeadDuplicateService>();
builder.Services.AddScoped<ILeadMergeService, MstLeadMergeService>();
builder.Services.AddScoped<IActivityService, MstActivityService>();
builder.Services.AddScoped<ICommunicationService, MstCommunicationService>();
builder.Services.AddScoped<IWorkflowService, MstWorkflowService>();
builder.Services.AddScoped<IWebFormService, MstWebFormService>();
builder.Services.AddScoped<IImportExportService, MstImportExportService>();
builder.Services.AddScoped<ILeadAnalyticsService, MstLeadAnalyticsService>();
builder.Services.AddScoped<IOpportunityService, MstOpportunityService>();
builder.Services.AddScoped<IPipelineService, MstPipelineService>();
builder.Services.AddScoped<IDashboardService, MstDashboardService>();
builder.Services.AddScoped<IEmailNotificationService, EmailNotificationService>();

// ===== CRM Real-time Notification Service =====
builder.Services.AddSingleton<ICrmNotificationService, CrmNotificationService>();

// ===== Application Services =====
builder.Services.AddScoped<IMstLeadApplicationService, MstLeadApplicationService>();
builder.Services.AddScoped<IMstContactApplicationService, MstContactApplicationService>();
builder.Services.AddScoped<IMstAccountApplicationService, MstAccountApplicationService>();
builder.Services.AddScoped<IMstActivityApplicationService, MstActivityApplicationService>();
builder.Services.AddScoped<IMstLeadScoringApplicationService, MstLeadScoringApplicationService>();
builder.Services.AddScoped<IMstLeadAssignmentApplicationService, MstLeadAssignmentApplicationService>();
builder.Services.AddScoped<IMstLeadDuplicateApplicationService, MstLeadDuplicateApplicationService>();
builder.Services.AddScoped<IMstCommunicationApplicationService, MstCommunicationApplicationService>();
builder.Services.AddScoped<IMstWorkflowApplicationService, MstWorkflowApplicationService>();
builder.Services.AddScoped<IMstWebFormApplicationService, MstWebFormApplicationService>();
builder.Services.AddScoped<IMstImportExportApplicationService, MstImportExportApplicationService>();
builder.Services.AddScoped<IMstLeadAnalyticsApplicationService, MstLeadAnalyticsApplicationService>();
builder.Services.AddScoped<IMstOpportunityApplicationService, MstOpportunityApplicationService>();
builder.Services.AddScoped<IMstPipelineApplicationService, MstPipelineApplicationService>();
builder.Services.AddScoped<IMstDashboardApplicationService, MstDashboardApplicationService>();

// ===== Background Services =====
if (builder.Configuration.GetValue("BackgroundServices:LeadWorkflowEnabled", false))
{
    builder.Services.AddHostedService<LeadWorkflowBackgroundService>();
}

// ===== Helpers =====
builder.Services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

// ===== FluentValidation =====
builder.Services.AddValidatorsFromAssemblyContaining<LeadCreateDtoValidator>();
builder.Services.AddFluentValidationAutoValidation();

// ===== JWT Authentication =====
builder.Services.AddCrmJwtAuthentication(builder.Configuration);

// ===== Authorization =====
builder.Services.AddAuthorization();

// ===== Rate Limiting =====
builder.Services.AddCrmRateLimiting(builder.Configuration);

// ===== CORS =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", corsBuilder =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173" };

        corsBuilder.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ===== Controllers + Filters =====
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidateModelFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
    options.JsonSerializerOptions.WriteIndented = true;
});

// ===== SignalR =====
builder.Services.AddSignalR();

// ===== Swagger =====
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "CRM Backend API",
        Version = "v1",
        Description = "CRM System - Phase 1 API"
    });

    // Map IFormFile to file upload in Swagger UI
    options.MapType<IFormFile>(() => new Microsoft.OpenApi.Models.OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter JWT token"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ===== Middleware Pipeline (ORDER MATTERS) =====

// 1. Global exception handling
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 2. CORS
app.UseCors("CorsPolicy");

// 3. Rate limiting
app.UseRateLimiter();

// 4. HTTPS redirect (keep local development on configured HTTP port)
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// 5. Swagger (dev only)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CRM Backend API v1");
    });
}

// 6. Token validation
app.UseMiddleware<TokenValidationMiddleware>();

// 7. Authentication
app.UseAuthentication();

// 8. Tenant context extraction
app.UseMiddleware<TenantContextMiddleware>();

// 9. Request logging
app.UseMiddleware<RequestLoggingMiddleware>();

// 10. Performance monitoring
app.UseMiddleware<PerformanceMiddleware>();

// 11. Authorization
app.UseAuthorization();

// 12. Map controllers
app.MapControllers();

// 13. SignalR hub
app.MapHub<CrmNotificationHub>("/hubs/crm");

// ===== Run =====
Log.Information("CRM Backend starting on {Environment}", app.Environment.EnvironmentName);

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "CRM Backend terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
