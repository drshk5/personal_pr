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
    private readonly ILogger<ContactsController> _logger;

    public ContactsController(
        IMstContactApplicationService contactAppService,
        ILogger<ContactsController> logger)
    {
        _contactAppService = contactAppService;
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
}
