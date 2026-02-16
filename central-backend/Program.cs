using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.FileProviders;
using System.Security.Claims;
using System.Text;
using AuditSoftware.Data;
using AuditSoftware.Interfaces;
using AuditSoftware.Services;
using AuditSoftware.Mapping;
using AuditSoftware.Middleware;
using AuditSoftware.Config;
using AuditSoftware.Extensions;
using System.Threading.RateLimiting;
using Serilog;
using Serilog.Events;

// Create date-wise folder structure for logs
var today = DateTime.Now.ToString("yyyy-MM-dd");
var logsPath = $"Logs/{today}";
if (!Directory.Exists(logsPath))
{
    Directory.CreateDirectory(logsPath);
}

// Configure Serilog for file logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .MinimumLevel.Override("AuditSoftware", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "CentralBackend")
    .WriteTo.Console()
    // General errors log
    .WriteTo.File(
        path: "Logs/errors-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 60,
        restrictedToMinimumLevel: LogEventLevel.Error,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {SourceContext}{NewLine}Message: {Message:lj}{NewLine}{Exception}{NewLine}---{NewLine}"
    )
    // Daily application logs
    .WriteTo.File(
        path: logsPath + "/app-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        restrictedToMinimumLevel: LogEventLevel.Information,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}",
        fileSizeLimitBytes: 52428800, // 50MB
        rollOnFileSizeLimit: true
    )
    .CreateLogger();

try
{
    Log.Information("Starting Central Backend application");

// ------------------------------------------------------------
// 1. Create Builder
// ------------------------------------------------------------
var builder = WebApplication.CreateBuilder(args);

// Add Serilog to the application
builder.Host.UseSerilog();

// ✅ Configure Kestrel for HTTP/2 support (eliminates 6-connection limit)
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ConfigureEndpointDefaults(listenOptions =>
    {
        listenOptions.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1AndHttp2;
    });
});

// ------------------------------------------------------------
// 2. Configure Logging (using Serilog)
// ------------------------------------------------------------
// Logging is already configured via Serilog above

// ------------------------------------------------------------
// 3. Add Services
// ------------------------------------------------------------

// ✅ Session
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

// ✅ CORS
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

// ✅ Rate Limiting (Global - can be customized per endpoint with [EnableRateLimiting] attribute)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// ✅ Controllers + JSON Options + Validation
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationErrorFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null;
    options.JsonSerializerOptions.WriteIndented = true;
})
.ConfigureApiBehaviorOptions(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

// ✅ Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Audit Software API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ✅ Authentication (JWT)
builder.Services.AddCustomJwtAuthentication(builder.Configuration);

// ✅ Authorization
builder.Services.AddScoped<IAuthorizationHandler, SuperAdminAuthorizationHandler>();
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, CustomAuthorizationMiddlewareResultHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdminOnly", policy =>
        policy.Requirements.Add(new SuperAdminRequirement()));
});

// ✅ AutoMapper
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

// ✅ Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 10,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        }));

// ✅ Application Services (DI)
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddScoped<IAccountTypeService, AccountTypeService>();
builder.Services.AddScoped<IAddressTypeService, AddressTypeService>();
builder.Services.AddScoped<ICountryService, CountryService>();
builder.Services.AddScoped<IStateService, StateService>();
builder.Services.AddScoped<ICityService, CityService>();
builder.Services.AddScoped<IPicklistTypeService, PicklistTypeService>();
builder.Services.AddScoped<ITaxTypeService, TaxTypeService>();
builder.Services.AddScoped<ITaxRateService, TaxRateService>();
builder.Services.AddScoped<ITaxCategoryService, TaxCategoryService>();
builder.Services.AddScoped<IOrgTaxConfigService, OrgTaxConfigService>();
builder.Services.AddScoped<IPageTemplateService, PageTemplateService>();
builder.Services.AddScoped<IModuleService, ModuleService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICookieTokenService, CookieTokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IUserSessionService, UserSessionService>();
builder.Services.AddScoped<IUserRoleService, UserRoleService>();
builder.Services.AddScoped<IPicklistValueService, PicklistValueService>();
builder.Services.AddScoped<IMenuService, MenuService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IMasterMenuService, MasterMenuService>();
builder.Services.AddScoped<IUserRightsService, UserRightsService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IYearService, YearService>();
builder.Services.AddScoped<IFolderService, FolderService>();
builder.Services.AddScoped<IUserDetailsService, UserDetailsService>();
builder.Services.AddScoped<IIndustryService, IndustryService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IRenameScheduleService, RenameScheduleService>();
builder.Services.AddScoped<IUserInfoService, UserInfoService>();
builder.Services.AddScoped<ICurrencyTypeService, CurrencyTypeService>();
builder.Services.AddScoped<ILegalStatusTypeService, LegalStatusTypeService>();
builder.Services.AddScoped<IDesignationService, DesignationService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IDocTypeService, DocTypeService>();
builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IDocumentAssociationService, DocumentAssociationService>();
builder.Services.AddScoped<IDeleteValidationService, DeleteValidationService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IGroupModuleService, GroupModuleService>();
builder.Services.AddScoped<IDocumentModuleService, DocumentModuleService>();
builder.Services.AddScoped<IExchangeRateService, ExchangeRateService>();

// Background cleanup for old/expired sessions
builder.Services.AddHostedService<AuditSoftware.Services.SessionCleanupHostedService>();

// ✅ API Gateway Config
builder.Services.AddHttpClient();
builder.Services.AddApiGatewayConfig(builder.Configuration);
builder.Services.AddScoped<IApiGatewayService, ApiGatewayService>();

// ------------------------------------------------------------
// 4. Build App
// ------------------------------------------------------------
var app = builder.Build();

// Initialize TokenHashService with configuration
AuditSoftware.Services.TokenHashService.Initialize(builder.Configuration);

// ------------------------------------------------------------
// 5. Create & Serve Uploads Folder
// ------------------------------------------------------------
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "Uploads");
if (!Directory.Exists(uploadsPath))
    Directory.CreateDirectory(uploadsPath);

// Create default upload subfolders
var defaultFolders = new[]
{
    "documents",
    "GroupLogos",
    "ModuleImages",
    "OrganizationLogos",
    "ProfileImages"
};

foreach (var folder in defaultFolders)
{
    var folderPath = Path.Combine(uploadsPath, folder);
    if (!Directory.Exists(folderPath))
    {
        Directory.CreateDirectory(folderPath);
        Console.WriteLine($"✅ Created upload folder: {folder}");
    }
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/Uploads"
});

// ------------------------------------------------------------
// 6. Configure Middleware Pipeline
// ------------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Audit Software API v1");
        c.RoutePrefix = string.Empty;
    });
}

app.UseMiddleware<GlobalExceptionHandler>();

app.UseCors("CorsPolicy");
app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromSeconds(120) });

// ✅ Rate Limiting (before authentication to protect all endpoints)
app.UseRateLimiter();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseSession();

app.UseRefreshTokenCookieMiddleware();
app.UseAuthentication();
app.UseApiGateway();
app.UseMiddleware<SessionValidationMiddleware>();
app.UseTimeZoneMiddleware();
app.UseAuthorization();

app.MapControllers();

// ------------------------------------------------------------
// 7. Database Connection Check
// ------------------------------------------------------------
try
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await context.Database.CanConnectAsync();
    Console.WriteLine("✅ Database connected successfully!");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Database connection failed: {ex.Message}");
    throw;
}

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
