using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/activities")]
[RequireTenantId]
public class ActivitiesController : BaseController
{
    private readonly IMstActivityApplicationService _activityAppService;
    private readonly ILogger<ActivitiesController> _logger;

    public ActivitiesController(
        IMstActivityApplicationService activityAppService,
        ILogger<ActivitiesController> logger)
    {
        _activityAppService = activityAppService;
        _logger = logger;
    }

    /// <summary>
    /// List activities (paged, filtered by type/entity/date/completion)
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ActivityListDto>>>> GetActivities(
        [FromQuery] ActivityFilterParams filter)
    {
        var result = await _activityAppService.GetActivitiesAsync(filter);
        return OkResponse(result);
    }

    /// <summary>
    /// Get single activity detail
    /// </summary>
    [HttpGet("{id:guid}")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<ActivityListDto>>> GetActivity(Guid id)
    {
        var result = await _activityAppService.GetActivityByIdAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Create activity (with entity links) — IMMUTABLE: no update/delete endpoints exist
    /// </summary>
    [HttpPost]
    [AuthorizePermission("CRM_Activities", "Create")]
    [AuditLog("Activity", "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<ActivityListDto>>> CreateActivity(
        [FromBody] CreateActivityDto dto)
    {
        var result = await _activityAppService.CreateActivityAsync(dto);
        return CreatedResponse(result);
    }

    /// <summary>
    /// All activities for a specific entity (uses IX_MstActivityLinks_Entity index)
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId:guid}")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ActivityListDto>>>> GetEntityActivities(
        string entityType, Guid entityId, [FromQuery] ActivityFilterParams filter)
    {
        var result = await _activityAppService.GetEntityActivitiesAsync(entityType, entityId, filter);
        return OkResponse(result);
    }

    /// <summary>
    /// Upcoming scheduled activities (not yet completed, soonest first, max 20)
    /// </summary>
    [HttpGet("upcoming")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<List<UpcomingActivityDto>>>> GetUpcoming()
    {
        var result = await _activityAppService.GetUpcomingActivitiesAsync();
        return OkResponse(result);
    }
}
