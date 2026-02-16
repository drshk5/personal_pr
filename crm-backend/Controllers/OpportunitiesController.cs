using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/opportunities")]
[RequireTenantId]
public class OpportunitiesController : BaseController
{
    private readonly IMstOpportunityApplicationService _opportunityAppService;
    private readonly ILogger<OpportunitiesController> _logger;

    public OpportunitiesController(
        IMstOpportunityApplicationService opportunityAppService,
        ILogger<OpportunitiesController> logger)
    {
        _opportunityAppService = opportunityAppService;
        _logger = logger;
    }

    /// <summary>
    /// List opportunities (paged, filtered, server-side rotting)
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Opportunities", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<OpportunityListDto>>>> GetOpportunities(
        [FromQuery] OpportunityFilterParams filter)
    {
        var result = await _opportunityAppService.GetOpportunitiesAsync(filter);
        return OkResponse(result);
    }

    /// <summary>
    /// Get opportunity detail by ID (with contacts + recent activities)
    /// </summary>
    [HttpGet("{id:guid}")]
    [AuthorizePermission("CRM_Opportunities", "View")]
    public async Task<ActionResult<ApiResponse<OpportunityDetailDto>>> GetOpportunity(Guid id)
    {
        var result = await _opportunityAppService.GetOpportunityByIdAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Create a new opportunity
    /// </summary>
    [HttpPost]
    [AuthorizePermission("CRM_Opportunities", "Create")]
    [AuditLog(EntityTypeConstants.Opportunity, "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<OpportunityDetailDto>>> CreateOpportunity(
        [FromBody] CreateOpportunityDto dto)
    {
        var result = await _opportunityAppService.CreateOpportunityAsync(dto);
        return CreatedResponse(result);
    }

    /// <summary>
    /// Update an existing opportunity
    /// </summary>
    [HttpPut("{id:guid}")]
    [AuthorizePermission("CRM_Opportunities", "Edit")]
    [AuditLog(EntityTypeConstants.Opportunity, "Update")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<OpportunityDetailDto>>> UpdateOpportunity(
        Guid id, [FromBody] UpdateOpportunityDto dto)
    {
        var result = await _opportunityAppService.UpdateOpportunityAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Soft delete an opportunity
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AuthorizePermission("CRM_Opportunities", "Delete")]
    [AuditLog(EntityTypeConstants.Opportunity, "Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteOpportunity(Guid id)
    {
        var result = await _opportunityAppService.DeleteOpportunityAsync(id);
        return OkResponse(result, "Opportunity deleted successfully");
    }

    /// <summary>
    /// Move opportunity to a different stage (drag-and-drop)
    /// </summary>
    [HttpPatch("{id:guid}/stage")]
    [AuthorizePermission("CRM_Opportunities", "Edit")]
    [AuditLog(EntityTypeConstants.Opportunity, "MoveStage")]
    public async Task<ActionResult<ApiResponse<OpportunityDetailDto>>> MoveStage(
        Guid id, [FromBody] MoveStageDto dto)
    {
        var result = await _opportunityAppService.MoveStageAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Close opportunity as Won or Lost
    /// </summary>
    [HttpPost("{id:guid}/close")]
    [AuthorizePermission("CRM_Opportunities", "Edit")]
    [AuditLog(EntityTypeConstants.Opportunity, "Close")]
    public async Task<ActionResult<ApiResponse<OpportunityDetailDto>>> CloseOpportunity(
        Guid id, [FromBody] CloseOpportunityDto dto)
    {
        var result = await _opportunityAppService.CloseOpportunityAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Add a contact to an opportunity
    /// </summary>
    [HttpPost("{id:guid}/contacts")]
    [AuthorizePermission("CRM_Opportunities", "Edit")]
    public async Task<ActionResult<ApiResponse<OpportunityDetailDto>>> AddContact(
        Guid id, [FromBody] AddOpportunityContactDto dto)
    {
        var result = await _opportunityAppService.AddContactAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Remove a contact from an opportunity
    /// </summary>
    [HttpDelete("{id:guid}/contacts/{contactId:guid}")]
    [AuthorizePermission("CRM_Opportunities", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> RemoveContact(Guid id, Guid contactId)
    {
        var result = await _opportunityAppService.RemoveContactAsync(id, contactId);
        return OkResponse(result, "Contact removed successfully");
    }

    /// <summary>
    /// Get board/kanban view for a pipeline
    /// </summary>
    [HttpGet("board/{pipelineId:guid}")]
    [AuthorizePermission("CRM_Opportunities", "View")]
    public async Task<ActionResult<ApiResponse<List<OpportunityBoardColumnDto>>>> GetBoard(
        Guid pipelineId,
        [FromQuery] int? takePerStage)
    {
        // Default is capped in service (high-volume safe).
        var result = await _opportunityAppService.GetBoardAsync(
            pipelineId,
            takePerStage ?? 50);
        return OkResponse(result);
    }

    /// <summary>
    /// Bulk archive opportunities
    /// </summary>
    [HttpPost("bulk-archive")]
    [AuthorizePermission("CRM_Opportunities", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkArchive(
        [FromBody] OpportunityBulkArchiveDto dto)
    {
        var result = await _opportunityAppService.BulkArchiveAsync(dto);
        return OkResponse(result, "Opportunities archived successfully");
    }

    /// <summary>
    /// Bulk restore opportunities
    /// </summary>
    [HttpPost("bulk-restore")]
    [AuthorizePermission("CRM_Opportunities", "Edit")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkRestore(
        [FromBody] OpportunityBulkArchiveDto dto)
    {
        var result = await _opportunityAppService.BulkRestoreAsync(dto);
        return OkResponse(result, "Opportunities restored successfully");
    }
}
