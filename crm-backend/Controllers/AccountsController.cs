using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/accounts")]
[RequireTenantId]
public class AccountsController : BaseController
{
    private readonly IMstAccountApplicationService _accountAppService;
    private readonly IMstImportExportApplicationService _importExportAppService;
    private readonly ILogger<AccountsController> _logger;

    public AccountsController(
        IMstAccountApplicationService accountAppService,
        IMstImportExportApplicationService importExportAppService,
        ILogger<AccountsController> logger)
    {
        _accountAppService = accountAppService;
        _importExportAppService = importExportAppService;
        _logger = logger;
    }

    /// <summary>
    /// List accounts (paged, filtered)
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Accounts", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<AccountListDto>>>> GetAccounts(
        [FromQuery] AccountFilterParams filter)
    {
        var result = await _accountAppService.GetAccountsAsync(filter);
        return OkResponse(result);
    }

    /// <summary>
    /// Get account detail by ID (with contacts + opportunities)
    /// </summary>
    [HttpGet("{id:guid}")]
    [AuthorizePermission("CRM_Accounts", "View")]
    public async Task<ActionResult<ApiResponse<AccountDetailDto>>> GetAccount(Guid id)
    {
        var result = await _accountAppService.GetAccountByIdAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Create a new account
    /// </summary>
    [HttpPost]
    [AuthorizePermission("CRM_Accounts", "Create")]
    [AuditLog(EntityTypeConstants.Account, "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<AccountDetailDto>>> CreateAccount(
        [FromBody] CreateAccountDto dto)
    {
        var result = await _accountAppService.CreateAccountAsync(dto);
        return CreatedResponse(result);
    }

    /// <summary>
    /// Update an existing account
    /// </summary>
    [HttpPut("{id:guid}")]
    [AuthorizePermission("CRM_Accounts", "Edit")]
    [AuditLog(EntityTypeConstants.Account, "Update")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<AccountDetailDto>>> UpdateAccount(
        Guid id, [FromBody] UpdateAccountDto dto)
    {
        var result = await _accountAppService.UpdateAccountAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Soft delete an account
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AuthorizePermission("CRM_Accounts", "Delete")]
    [AuditLog(EntityTypeConstants.Account, "Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteAccount(Guid id)
    {
        var result = await _accountAppService.DeleteAccountAsync(id);
        return OkResponse(result, "Account deleted successfully");
    }

    /// <summary>
    /// Bulk archive accounts
    /// </summary>
    [HttpPost("bulk-archive")]
    [AuthorizePermission("CRM_Accounts", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkArchive(
        [FromBody] AccountBulkArchiveDto dto)
    {
        var result = await _accountAppService.BulkArchiveAsync(dto);
        return OkResponse(result, "Accounts archived successfully");
    }

    /// <summary>
    /// Bulk restore accounts
    /// </summary>
    [HttpPost("bulk-restore")]
    [AuthorizePermission("CRM_Accounts", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkRestore(
        [FromBody] AccountBulkArchiveDto dto)
    {
        var result = await _accountAppService.BulkRestoreAsync(dto);
        return OkResponse(result, "Accounts restored successfully");
    }

    /// <summary>
    /// Import accounts from CSV
    /// </summary>
    [HttpPost("import")]
    [AuthorizePermission("CRM_Accounts", "Create")]
    public async Task<ActionResult<ApiResponse<ImportJobListDto>>> ImportAccounts(
        IFormFile file,
        [FromForm] string strDuplicateHandling,
        [FromForm] string columnMappingJson)
    {
        if (file == null || file.Length == 0)
            return ErrorResponse<ImportJobListDto>(400, "CSV file is required");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return ErrorResponse<ImportJobListDto>(400, "Only CSV files are allowed");

        var settings = new ImportStartDto
        {
            strDuplicateHandling = strDuplicateHandling ?? "Skip",
            ColumnMapping = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(
                columnMappingJson ?? "{}") ?? new Dictionary<string, string>()
        };

        if (settings.ColumnMapping.Count == 0)
            return ErrorResponse<ImportJobListDto>(400, "Column mapping is required");

        using var stream = file.OpenReadStream();
        var result = await _importExportAppService.StartAccountImportAsync(stream, file.FileName, settings);

        return CreatedResponse(result, "Account import completed");
    }

    /// <summary>
    /// Suggest account field mapping for CSV headers
    /// </summary>
    [HttpPost("import/suggest-mapping")]
    [AuthorizePermission("CRM_Accounts", "View")]
    public async Task<ActionResult<ApiResponse<ImportSuggestMappingResultDto>>> SuggestAccountMapping(
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return ErrorResponse<ImportSuggestMappingResultDto>(400, "CSV file is required");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return ErrorResponse<ImportSuggestMappingResultDto>(400, "Only CSV files are allowed");

        using var stream = file.OpenReadStream();
        var result = await _importExportAppService.SuggestAccountMappingAsync(stream);

        return OkResponse(result);
    }

    /// <summary>
    /// Export accounts to CSV
    /// </summary>
    [HttpPost("export")]
    [AuthorizePermission("CRM_Accounts", "View")]
    public async Task<IActionResult> ExportAccounts([FromBody] AccountFilterParams filter)
    {
        var bytes = await _importExportAppService.ExportAccountsAsync(filter);
        return File(bytes, "text/csv", $"accounts-export-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>
    /// Export accounts to CSV (GET compatibility route)
    /// </summary>
    [HttpGet("export")]
    [AuthorizePermission("CRM_Accounts", "View")]
    public async Task<IActionResult> ExportAccountsGet([FromQuery] AccountFilterParams filter)
    {
        var bytes = await _importExportAppService.ExportAccountsAsync(filter);
        return File(bytes, "text/csv", $"accounts-export-{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
