using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[ApiController]
[Route("api/crm/activities")]
[Authorize]
[RequireTenantId]
public class ActivitiesController : ControllerBase
{
    private readonly IMstActivityApplicationService _activityAppService;

    public ActivitiesController(IMstActivityApplicationService activityAppService)
    {
        _activityAppService = activityAppService;
    }

    // ── LIST ──

    /// <summary>
    /// Paginated list of all activities with filtering (status, priority, type, category, dates, entity links, overdue).
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ActivityListDto>>>> GetActivities(
        [FromQuery] ActivityFilterParams filter)
    {
        var result = await _activityAppService.GetActivitiesAsync(filter);
        return Ok(ApiResponse<PagedResponse<ActivityListDto>>.Success(result));
    }

    // ── GET BY ID ──

    /// <summary>
    /// Single activity detail with linked entities and user names.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<ActivityListDto>>> GetActivityById(Guid id)
    {
        var result = await _activityAppService.GetActivityByIdAsync(id);
        return Ok(ApiResponse<ActivityListDto>.Success(result));
    }

    // ── CREATE ──

    /// <summary>
    /// Create a new activity. Auto-updates linked lead status (New → Contacted).
    /// Triggers ActivityCreated workflow.
    /// </summary>
    [HttpPost]
    [AuthorizePermission("CRM_Activities", "Create")]
    [AuditLog("Activity", "Create")]
    public async Task<ActionResult<ApiResponse<ActivityListDto>>> CreateActivity(
        [FromBody] CreateActivityDto dto)
    {
        var result = await _activityAppService.CreateActivityAsync(dto);
        return CreatedAtAction(nameof(GetActivityById), new { id = result.strActivityGUID },
            ApiResponse<ActivityListDto>.Success(result, "Activity created successfully"));
    }

    // ── UPDATE ──

    /// <summary>
    /// Full update of an activity. Triggers workflows on status change to Completed.
    /// </summary>
    [HttpPut("{id:guid}")]
    [AuthorizePermission("CRM_Activities", "Edit")]
    [AuditLog("Activity", "Update")]
    public async Task<ActionResult<ApiResponse<ActivityListDto>>> UpdateActivity(
        Guid id, [FromBody] UpdateActivityDto dto)
    {
        var result = await _activityAppService.UpdateActivityAsync(id, dto);
        return Ok(ApiResponse<ActivityListDto>.Success(result, "Activity updated successfully"));
    }

    // ── DELETE (soft) ──

    /// <summary>
    /// Soft delete an activity (sets bolIsDeleted = true).
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AuthorizePermission("CRM_Activities", "Delete")]
    [AuditLog("Activity", "Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteActivity(Guid id)
    {
        var result = await _activityAppService.DeleteActivityAsync(id);
        return Ok(ApiResponse<bool>.Success(result, "Activity deleted successfully"));
    }

    // ── STATUS CHANGE ──

    /// <summary>
    /// Change activity status (Pending → InProgress → Completed → Cancelled).
    /// Completing an activity triggers auto lead status progression and ActivityCompleted workflow.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [AuthorizePermission("CRM_Activities", "Edit")]
    [AuditLog("Activity", "StatusChange")]
    public async Task<ActionResult<ApiResponse<ActivityListDto>>> ChangeStatus(
        Guid id, [FromBody] ActivityStatusChangeDto dto)
    {
        var result = await _activityAppService.ChangeStatusAsync(id, dto);
        return Ok(ApiResponse<ActivityListDto>.Success(result, "Activity status changed successfully"));
    }

    // ── ASSIGN ──

    /// <summary>
    /// Re-assign an activity to a different user. Triggers Assigned workflow.
    /// </summary>
    [HttpPatch("{id:guid}/assign")]
    [AuthorizePermission("CRM_Activities", "Edit")]
    [AuditLog("Activity", "Assign")]
    public async Task<ActionResult<ApiResponse<ActivityListDto>>> AssignActivity(
        Guid id, [FromBody] ActivityAssignDto dto)
    {
        var result = await _activityAppService.AssignActivityAsync(id, dto);
        return Ok(ApiResponse<ActivityListDto>.Success(result, "Activity assigned successfully"));
    }

    // ── BULK ASSIGN ──

    /// <summary>
    /// Bulk assign multiple activities to a user.
    /// </summary>
    [HttpPost("bulk-assign")]
    [AuthorizePermission("CRM_Activities", "Edit")]
    [AuditLog("Activity", "BulkAssign")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkAssign(
        [FromBody] ActivityBulkAssignDto dto)
    {
        var result = await _activityAppService.BulkAssignAsync(dto);
        return Ok(ApiResponse<bool>.Success(result, $"Successfully assigned {dto.Guids.Count} activities"));
    }

    // ── BULK STATUS CHANGE ──

    /// <summary>
    /// Bulk change status for multiple activities. Triggers workflows for each completed activity.
    /// </summary>
    [HttpPost("bulk-status")]
    [AuthorizePermission("CRM_Activities", "Edit")]
    [AuditLog("Activity", "BulkStatusChange")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkChangeStatus(
        [FromBody] ActivityBulkStatusDto dto)
    {
        var result = await _activityAppService.BulkChangeStatusAsync(dto);
        return Ok(ApiResponse<bool>.Success(result, $"Successfully updated status for {dto.Guids.Count} activities"));
    }

    // ── BULK DELETE ──

    /// <summary>
    /// Bulk soft delete multiple activities.
    /// </summary>
    [HttpPost("bulk-delete")]
    [AuthorizePermission("CRM_Activities", "Delete")]
    [AuditLog("Activity", "BulkDelete")]
    public async Task<ActionResult<ApiResponse<bool>>> BulkDelete(
        [FromBody] ActivityBulkDeleteDto dto)
    {
        var result = await _activityAppService.BulkDeleteAsync(dto);
        return Ok(ApiResponse<bool>.Success(result, $"Successfully deleted {dto.Guids.Count} activities"));
    }

    // ── ENTITY ACTIVITIES ──

    /// <summary>
    /// Get all activities linked to a specific entity (Lead, Account, Contact, Opportunity).
    /// </summary>
    [HttpGet("entity/{entityType}/{entityId:guid}")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ActivityListDto>>>> GetEntityActivities(
        string entityType, Guid entityId, [FromQuery] ActivityFilterParams filter)
    {
        var result = await _activityAppService.GetEntityActivitiesAsync(entityType, entityId, filter);
        return Ok(ApiResponse<PagedResponse<ActivityListDto>>.Success(result));
    }

    // ── TODAY'S TASKS ──

    /// <summary>
    /// Get current user's tasks for today (scheduled today, due today, or overdue).
    /// </summary>
    [HttpGet("today")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<List<ActivityListDto>>>> GetTodayActivities()
    {
        var result = await _activityAppService.GetTodayActivitiesAsync();
        return Ok(ApiResponse<List<ActivityListDto>>.Success(result));
    }

    // ── MY ACTIVITIES ──

    /// <summary>
    /// Get all activities assigned to the current user with filtering.
    /// </summary>
    [HttpGet("my-activities")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ActivityListDto>>>> GetMyActivities(
        [FromQuery] ActivityFilterParams filter)
    {
        var result = await _activityAppService.GetMyActivitiesAsync(filter);
        return Ok(ApiResponse<PagedResponse<ActivityListDto>>.Success(result));
    }

    // ── OVERDUE ──

    /// <summary>
    /// Get all overdue activities (past due date, not completed/cancelled).
    /// </summary>
    [HttpGet("overdue")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<List<ActivityListDto>>>> GetOverdueActivities()
    {
        var result = await _activityAppService.GetOverdueActivitiesAsync();
        return Ok(ApiResponse<List<ActivityListDto>>.Success(result));
    }

    // ── UPCOMING ──

    /// <summary>
    /// Get upcoming scheduled activities (not yet completed, ordered by soonest first).
    /// </summary>
    [HttpGet("upcoming")]
    [AuthorizePermission("CRM_Activities", "View")]
    public async Task<ActionResult<ApiResponse<List<UpcomingActivityDto>>>> GetUpcomingActivities()
    {
        var result = await _activityAppService.GetUpcomingActivitiesAsync();
        return Ok(ApiResponse<List<UpcomingActivityDto>>.Success(result));
    }

    // ── BULK EMAIL NOTIFICATION ──

    /// <summary>
    /// Send bulk email notifications to all assigned users for selected activities.
    /// Processes emails in background queue for high performance.
    /// </summary>
    [HttpPost("bulk-notify")]
    [AuthorizePermission("CRM_Activities", "Edit")]
    [AuditLog("Activity", "BulkNotify")]
    public async Task<ActionResult<ApiResponse<bool>>> SendBulkNotifications(
        [FromBody] ActivityBulkNotifyDto dto)
    {
        var result = await _activityAppService.SendBulkActivityNotificationsAsync(dto);
        return Ok(ApiResponse<bool>.Success(result, $"Notifications queued for {dto.ActivityGuids.Count} activities"));
    }
}
