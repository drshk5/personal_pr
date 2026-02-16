using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/contacts")]
[RequireTenantId]
public class ContactsController : BaseController
{
    private readonly IMstContactApplicationService _contactAppService;
    private readonly IMstImportExportApplicationService _importExportAppService;
    private readonly ILogger<ContactsController> _logger;

    public ContactsController(
        IMstContactApplicationService contactAppService,
        IMstImportExportApplicationService importExportAppService,
        ILogger<ContactsController> logger)
    {
        _contactAppService = contactAppService;
        _importExportAppService = importExportAppService;
        _logger = logger;
    }

    /// <summary>
    /// List contacts (paged, filtered)
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Contacts", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ContactListDto>>>> GetContacts(
        [FromQuery] ContactFilterParams filter)
    {
        var result = await _contactAppService.GetContactsAsync(filter);
        return OkResponse(result);
    }

    /// <summary>
    /// Get contact detail by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [AuthorizePermission("CRM_Contacts", "View")]
    public async Task<ActionResult<ApiResponse<ContactDetailDto>>> GetContact(Guid id)
    {
        var result = await _contactAppService.GetContactByIdAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Create a new contact
    /// </summary>
    [HttpPost]
    [AuthorizePermission("CRM_Contacts", "Create")]
    [AuditLog(EntityTypeConstants.Contact, "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<ContactDetailDto>>> CreateContact(
        [FromBody] CreateContactDto dto)
    {
        var result = await _contactAppService.CreateContactAsync(dto);
        return CreatedResponse(result);
    }

    /// <summary>
    /// Update an existing contact
    /// </summary>
    [HttpPut("{id:guid}")]
    [AuthorizePermission("CRM_Contacts", "Edit")]
    [AuditLog(EntityTypeConstants.Contact, "Update")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<ContactDetailDto>>> UpdateContact(
        Guid id, [FromBody] UpdateContactDto dto)
    {
        var result = await _contactAppService.UpdateContactAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Soft delete a contact
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AuthorizePermission("CRM_Contacts", "Delete")]
    [AuditLog(EntityTypeConstants.Contact, "Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteContact(Guid id)
    {
        var result = await _contactAppService.DeleteContactAsync(id);
        return OkResponse(result, "Contact deleted successfully");
    }

    /// <summary>
    /// Bulk archive contacts
    /// </summary>
    [HttpPost("bulk-archive")]
    [AuthorizePermission("CRM_Contacts", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkArchive(
        [FromBody] ContactBulkArchiveDto dto)
    {
        var result = await _contactAppService.BulkArchiveAsync(dto);
        return OkResponse(result, "Contacts archived successfully");
    }

    /// <summary>
    /// Bulk restore contacts
    /// </summary>
    [HttpPost("bulk-restore")]
    [AuthorizePermission("CRM_Contacts", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkRestore(
        [FromBody] ContactBulkArchiveDto dto)
    {
        var result = await _contactAppService.BulkRestoreAsync(dto);
        return OkResponse(result, "Contacts restored successfully");
    }

    /// <summary>
    /// Import contacts from CSV
    /// </summary>
    [HttpPost("import")]
    [AuthorizePermission("CRM_Contacts", "Create")]
    public async Task<ActionResult<ApiResponse<ImportJobListDto>>> ImportContacts(
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
        var result = await _importExportAppService.StartContactImportAsync(stream, file.FileName, settings);

        return CreatedResponse(result, "Contact import completed");
    }

    /// <summary>
    /// Suggest contact field mapping for CSV headers
    /// </summary>
    [HttpPost("import/suggest-mapping")]
    [AuthorizePermission("CRM_Contacts", "View")]
    public async Task<ActionResult<ApiResponse<ImportSuggestMappingResultDto>>> SuggestContactMapping(
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return ErrorResponse<ImportSuggestMappingResultDto>(400, "CSV file is required");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return ErrorResponse<ImportSuggestMappingResultDto>(400, "Only CSV files are allowed");

        using var stream = file.OpenReadStream();
        var result = await _importExportAppService.SuggestContactMappingAsync(stream);

        return OkResponse(result);
    }

    /// <summary>
    /// Export contacts to CSV
    /// </summary>
    [HttpPost("export")]
    [AuthorizePermission("CRM_Contacts", "View")]
    public async Task<IActionResult> ExportContacts([FromBody] ContactFilterParams filter)
    {
        var bytes = await _importExportAppService.ExportContactsAsync(filter);
        return File(bytes, "text/csv", $"contacts-export-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    /// <summary>
    /// Export contacts to CSV (GET compatibility route)
    /// </summary>
    [HttpGet("export")]
    [AuthorizePermission("CRM_Contacts", "View")]
    public async Task<IActionResult> ExportContactsGet([FromQuery] ContactFilterParams filter)
    {
        var bytes = await _importExportAppService.ExportContactsAsync(filter);
        return File(bytes, "text/csv", $"contacts-export-{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
