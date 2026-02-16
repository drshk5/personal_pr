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
    private readonly ILogger<AccountsController> _logger;

    public AccountsController(
        IMstAccountApplicationService accountAppService,
        ILogger<AccountsController> logger)
    {
        _accountAppService = accountAppService;
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
}
