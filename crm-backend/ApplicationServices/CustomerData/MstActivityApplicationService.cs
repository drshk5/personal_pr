using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Constants;
using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.DTOs.CustomerData;
using crm_backend.Exceptions;
using crm_backend.Helpers;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;
using crm_backend.Models.Wrappers;
using System.Linq.Dynamic.Core;

namespace crm_backend.ApplicationServices.CustomerData;

public class MstActivityApplicationService : ApplicationServiceBase, IMstActivityApplicationService
{
    private readonly MasterDbContext _masterDbContext;
    private readonly IActivityService _activityService;
    private readonly IAuditLogService _auditLogService;
    private readonly IWorkflowService _workflowService;
    private readonly IEmailNotificationService _emailNotificationService;

    public MstActivityApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        MasterDbContext masterDbContext,
        IActivityService activityService,
        IAuditLogService auditLogService,
        IWorkflowService workflowService,
        IEmailNotificationService emailNotificationService,
        ILogger<MstActivityApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _masterDbContext = masterDbContext;
        _activityService = activityService;
        _auditLogService = auditLogService;
        _workflowService = workflowService;
        _emailNotificationService = emailNotificationService;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  SHARED: DTO projection expression (ensures consistent mapping)
    // ─────────────────────────────────────────────────────────────────────

    private static ActivityListDto ProjectToDto(MstActivity a)
    {
        var now = DateTime.UtcNow;
        return new ActivityListDto
        {
            strActivityGUID = a.strActivityGUID,
            strActivityType = a.strActivityType,
            strSubject = a.strSubject,
            strDescription = a.strDescription,
            dtScheduledOn = a.dtScheduledOn,
            dtCompletedOn = a.dtCompletedOn,
            intDurationMinutes = a.intDurationMinutes,
            strOutcome = a.strOutcome,
            strStatus = a.strStatus,
            strPriority = a.strPriority,
            dtDueDate = a.dtDueDate,
            strCategory = a.strCategory,
            bolIsOverdue = a.dtDueDate.HasValue && a.dtDueDate.Value < now
                          && a.strStatus != ActivityStatusConstants.Completed
                          && a.strStatus != ActivityStatusConstants.Cancelled,
            strAssignedToGUID = a.strAssignedToGUID,
            strAssignedToName = null,
            strCreatedByGUID = a.strCreatedByGUID,
            strCreatedByName = string.Empty,
            dtCreatedOn = a.dtCreatedOn,
            dtUpdatedOn = a.dtUpdatedOn,
            bolIsActive = a.bolIsActive,
            Links = a.ActivityLinks.Select(al => new ActivityLinkDto
            {
                strEntityType = al.strEntityType,
                strEntityGUID = al.strEntityGUID
            }).ToList()
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    //  GET: Paginated list with enhanced filtering
    // ─────────────────────────────────────────────────────────────────────

    public async Task<PagedResponse<ActivityListDto>> GetActivitiesAsync(ActivityFilterParams filter)
    {
        var query = BuildFilteredQuery(filter);

        var totalCount = await query.CountAsync();

        // Sorting — use allowlist to prevent crashes on derived DTO-only fields
        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            var sortKey = filter.SortBy.Trim().ToLowerInvariant();
            query = sortKey switch
            {
                "strsubject" => filter.Ascending ? query.OrderBy(a => a.strSubject) : query.OrderByDescending(a => a.strSubject),
                "stractivitytype" => filter.Ascending ? query.OrderBy(a => a.strActivityType) : query.OrderByDescending(a => a.strActivityType),
                "strstatus" => filter.Ascending ? query.OrderBy(a => a.strStatus) : query.OrderByDescending(a => a.strStatus),
                "strpriority" => filter.Ascending ? query.OrderBy(a => a.strPriority) : query.OrderByDescending(a => a.strPriority),
                "dtscheduledon" => filter.Ascending ? query.OrderBy(a => a.dtScheduledOn) : query.OrderByDescending(a => a.dtScheduledOn),
                "dtcompletedon" => filter.Ascending ? query.OrderBy(a => a.dtCompletedOn) : query.OrderByDescending(a => a.dtCompletedOn),
                "dtduedate" => filter.Ascending ? query.OrderBy(a => a.dtDueDate) : query.OrderByDescending(a => a.dtDueDate),
                "strcategory" => filter.Ascending ? query.OrderBy(a => a.strCategory) : query.OrderByDescending(a => a.strCategory),
                "strassignedtoguid" => filter.Ascending ? query.OrderBy(a => a.strAssignedToGUID) : query.OrderByDescending(a => a.strAssignedToGUID),
                "dtcreatedon" => filter.Ascending ? query.OrderBy(a => a.dtCreatedOn) : query.OrderByDescending(a => a.dtCreatedOn),
                "bolisactive" => filter.Ascending ? query.OrderBy(a => a.bolIsActive) : query.OrderByDescending(a => a.bolIsActive),
                _ => query.OrderByDescending(a => a.dtCreatedOn)
            };

            if (sortKey is "strassignedtoname" or "strcreatedbyname" or "bolisoverdue")
            {
                _logger.LogWarning("SortBy '{SortBy}' is a derived field for activities; falling back to dtCreatedOn.", filter.SortBy);
            }
        }
        else
        {
            query = query.OrderByDescending(a => a.dtCreatedOn);
        }

        var activities = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Include(a => a.ActivityLinks)
            .ToListAsync();

        var activityDtos = activities.Select(ProjectToDto).ToList();
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), activityDtos);

        return new PagedResponse<ActivityListDto>
        {
            Items = activityDtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<ActivityListDto> GetActivityByIdAsync(Guid id)
    {
        var activity = await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Include(a => a.ActivityLinks)
            .FirstOrDefaultAsync(a => a.strActivityGUID == id && !a.bolIsDeleted);

        if (activity == null)
            throw new NotFoundException("Activity not found");

        var dto = ProjectToDto(activity);
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), new List<ActivityListDto> { dto });
        return dto;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  CREATE — with workflow triggers
    // ─────────────────────────────────────────────────────────────────────

    public async Task<ActivityListDto> CreateActivityAsync(CreateActivityDto dto)
    {
        _activityService.ValidateActivityType(dto.strActivityType);
        if (dto.Links.Count > 0)
            _activityService.ValidateEntityLinks(dto.Links);

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();
        var activityId = Guid.NewGuid();

        var activity = new MstActivity
        {
            strActivityGUID = activityId,
            strGroupGUID = GetTenantId(),
            strActivityType = dto.strActivityType,
            strSubject = dto.strSubject.Trim(),
            strDescription = DataNormalizationHelper.TrimOrNull(dto.strDescription),
            dtScheduledOn = dto.dtScheduledOn,
            dtCompletedOn = dto.dtCompletedOn,
            intDurationMinutes = dto.intDurationMinutes,
            strOutcome = DataNormalizationHelper.TrimOrNull(dto.strOutcome),
            strStatus = dto.strStatus ?? (dto.dtCompletedOn.HasValue ? ActivityStatusConstants.Completed : ActivityStatusConstants.Pending),
            strPriority = dto.strPriority ?? ActivityPriorityConstants.Medium,
            dtDueDate = dto.dtDueDate,
            strCategory = dto.strCategory,
            strAssignedToGUID = dto.strAssignedToGUID,
            strCreatedByGUID = userId,
            dtCreatedOn = now,
            bolIsActive = true
        };

        await _unitOfWork.Activities.AddAsync(activity);

        var linkDtos = new List<ActivityLinkDto>();
        foreach (var link in dto.Links)
        {
            var activityLink = new MstActivityLink
            {
                strActivityLinkGUID = Guid.NewGuid(),
                strActivityGUID = activityId,
                strEntityType = link.strEntityType,
                strEntityGUID = link.strEntityGUID,
                dtCreatedOn = now
            };
            await _unitOfWork.ActivityLinks.AddAsync(activityLink);
            linkDtos.Add(new ActivityLinkDto
            {
                strEntityType = link.strEntityType,
                strEntityGUID = link.strEntityGUID
            });
        }

        await _unitOfWork.SaveChangesAsync();

        // Auto lead status: New → Contacted when any activity is logged
        var leadLinks = dto.Links.Where(l => l.strEntityType == EntityTypeConstants.Lead).ToList();
        foreach (var leadLink in leadLinks)
        {
            var linkedLead = await _unitOfWork.Leads.GetByIdAsync(leadLink.strEntityGUID);
            if (linkedLead != null && linkedLead.strStatus == LeadStatusConstants.New)
            {
                linkedLead.strStatus = LeadStatusConstants.Contacted;
                linkedLead.strUpdatedByGUID = userId;
                linkedLead.dtUpdatedOn = now;
                _unitOfWork.Leads.Update(linkedLead);
            }
        }
        if (leadLinks.Count > 0)
            await _unitOfWork.SaveChangesAsync();

        // Trigger workflows (non-fatal — don't let workflow errors block activity creation)
        try
        {
            await _workflowService.TriggerWorkflowsAsync(
                EntityTypeConstants.Activity, activityId,
                WorkflowTriggerConstants.ActivityCreated,
                GetTenantId(), userId,
                JsonSerializer.Serialize(new { dto.strActivityType, dto.strSubject, dto.strAssignedToGUID }));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Workflow trigger failed for activity {ActivityId}, continuing", activityId);
        }

        // If created as Completed, also trigger the Completed workflow
        if (activity.strStatus == ActivityStatusConstants.Completed)
        {
            await TriggerActivityCompletedWorkflowsAsync(activity, leadLinks);
        }

        await _auditLogService.LogAsync(
            "Activity", activityId, "Create",
            JsonSerializer.Serialize(new { dto.strActivityType, dto.strSubject, LinkCount = dto.Links.Count }),
            userId);

        _logger.LogInformation("Activity created: {ActivityGUID} type={Type} by {UserGUID}",
            activityId, dto.strActivityType, userId);

        activity.ActivityLinks = linkDtos.Select(l => new MstActivityLink
        {
            strEntityType = l.strEntityType,
            strEntityGUID = l.strEntityGUID
        }).ToList();

        var resultDto = ProjectToDto(activity);
        resultDto.strCreatedByName = GetCurrentUserName();
        return resultDto;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────────────────────────────

    public async Task<ActivityListDto> UpdateActivityAsync(Guid id, UpdateActivityDto dto)
    {
        _activityService.ValidateActivityType(dto.strActivityType);
        if (dto.Links?.Count > 0)
            _activityService.ValidateEntityLinks(dto.Links);

        var activity = await _unitOfWork.Activities.Query()
            .Include(a => a.ActivityLinks)
            .FirstOrDefaultAsync(a => a.strActivityGUID == id && !a.bolIsDeleted);

        if (activity == null)
            throw new NotFoundException("Activity not found");

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();
        var oldStatus = activity.strStatus;

        activity.strActivityType = dto.strActivityType;
        activity.strSubject = dto.strSubject.Trim();
        activity.strDescription = DataNormalizationHelper.TrimOrNull(dto.strDescription);
        activity.dtScheduledOn = dto.dtScheduledOn;
        activity.dtCompletedOn = dto.dtCompletedOn;
        activity.intDurationMinutes = dto.intDurationMinutes;
        activity.strOutcome = DataNormalizationHelper.TrimOrNull(dto.strOutcome);
        if (dto.strStatus != null)
            activity.strStatus = dto.strStatus;
        if (dto.strPriority != null)
            activity.strPriority = dto.strPriority;
        activity.dtDueDate = dto.dtDueDate;
        activity.strCategory = dto.strCategory;
        activity.strAssignedToGUID = dto.strAssignedToGUID;
        activity.strUpdatedByGUID = userId;
        activity.dtUpdatedOn = now;

        // Handle completion
        if (dto.strStatus == ActivityStatusConstants.Completed && activity.dtCompletedOn == null)
            activity.dtCompletedOn = now;

        _unitOfWork.Activities.Update(activity);

        // Update links if provided
        if (dto.Links != null)
        {
            // Remove old links
            var existingLinks = activity.ActivityLinks.ToList();
            foreach (var link in existingLinks)
                activity.ActivityLinks.Remove(link);

            // Add new links
            foreach (var link in dto.Links)
            {
                await _unitOfWork.ActivityLinks.AddAsync(new MstActivityLink
                {
                    strActivityLinkGUID = Guid.NewGuid(),
                    strActivityGUID = id,
                    strEntityType = link.strEntityType,
                    strEntityGUID = link.strEntityGUID,
                    dtCreatedOn = now
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();

        // Trigger status-change workflow if status changed to Completed
        if (oldStatus != activity.strStatus && activity.strStatus == ActivityStatusConstants.Completed)
        {
            var leadLinks = activity.ActivityLinks
                .Where(l => l.strEntityType == EntityTypeConstants.Lead)
                .Select(l => new ActivityLinkDto { strEntityType = l.strEntityType, strEntityGUID = l.strEntityGUID })
                .ToList();
            await TriggerActivityCompletedWorkflowsAsync(activity, leadLinks);
        }

        await _auditLogService.LogAsync(
            "Activity", id, "Update",
            JsonSerializer.Serialize(new { dto.strActivityType, dto.strSubject, dto.strStatus }),
            userId);

        // Reload with links for response
        var updated = await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Include(a => a.ActivityLinks)
            .FirstAsync(a => a.strActivityGUID == id);

        var resultDto = ProjectToDto(updated);
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), new List<ActivityListDto> { resultDto });
        return resultDto;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  DELETE (soft)
    // ─────────────────────────────────────────────────────────────────────

    public async Task<bool> DeleteActivityAsync(Guid id)
    {
        var activity = await _unitOfWork.Activities.GetByIdAsync(id);
        if (activity == null || activity.bolIsDeleted)
            throw new NotFoundException("Activity not found");

        activity.bolIsDeleted = true;
        activity.bolIsActive = false;
        activity.dtDeletedOn = DateTime.UtcNow;
        activity.strUpdatedByGUID = GetCurrentUserId();
        activity.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.Activities.Update(activity);
        await _unitOfWork.SaveChangesAsync();

        await _auditLogService.LogAsync("Activity", id, "Delete", null, GetCurrentUserId());
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  STATUS CHANGE — with auto business logic
    // ─────────────────────────────────────────────────────────────────────

    public async Task<ActivityListDto> ChangeStatusAsync(Guid id, ActivityStatusChangeDto dto)
    {
        var activity = await _unitOfWork.Activities.Query()
            .Include(a => a.ActivityLinks)
            .FirstOrDefaultAsync(a => a.strActivityGUID == id && !a.bolIsDeleted);

        if (activity == null)
            throw new NotFoundException("Activity not found");

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();
        var oldStatus = activity.strStatus;

        activity.strStatus = dto.strStatus;
        activity.strUpdatedByGUID = userId;
        activity.dtUpdatedOn = now;

        if (dto.strOutcome != null)
            activity.strOutcome = dto.strOutcome;

        // Auto-set completedOn when marking as completed
        if (dto.strStatus == ActivityStatusConstants.Completed && activity.dtCompletedOn == null)
            activity.dtCompletedOn = now;

        // Clear completedOn if reopening
        if (dto.strStatus == ActivityStatusConstants.Pending || dto.strStatus == ActivityStatusConstants.InProgress)
            activity.dtCompletedOn = null;

        _unitOfWork.Activities.Update(activity);
        await _unitOfWork.SaveChangesAsync();

        // Trigger ActivityCompleted workflow if status changed to Completed
        if (dto.strStatus == ActivityStatusConstants.Completed && oldStatus != ActivityStatusConstants.Completed)
        {
            var leadLinks = activity.ActivityLinks
                .Where(l => l.strEntityType == EntityTypeConstants.Lead)
                .Select(l => new ActivityLinkDto { strEntityType = l.strEntityType, strEntityGUID = l.strEntityGUID })
                .ToList();
            await TriggerActivityCompletedWorkflowsAsync(activity, leadLinks);
        }

        await _auditLogService.LogAsync(
            "Activity", id, "StatusChange",
            JsonSerializer.Serialize(new { OldStatus = oldStatus, NewStatus = dto.strStatus }),
            userId);

        var resultDto = ProjectToDto(activity);
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), new List<ActivityListDto> { resultDto });
        return resultDto;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  ASSIGN
    // ─────────────────────────────────────────────────────────────────────

    public async Task<ActivityListDto> AssignActivityAsync(Guid id, ActivityAssignDto dto)
    {
        var activity = await _unitOfWork.Activities.Query()
            .Include(a => a.ActivityLinks)
            .FirstOrDefaultAsync(a => a.strActivityGUID == id && !a.bolIsDeleted);

        if (activity == null)
            throw new NotFoundException("Activity not found");

        var userId = GetCurrentUserId();
        activity.strAssignedToGUID = dto.strAssignedToGUID;
        activity.strUpdatedByGUID = userId;
        activity.dtUpdatedOn = DateTime.UtcNow;

        _unitOfWork.Activities.Update(activity);
        await _unitOfWork.SaveChangesAsync();

        // Trigger Assigned workflow
        await _workflowService.TriggerWorkflowsAsync(
            EntityTypeConstants.Activity, id,
            WorkflowTriggerConstants.Assigned,
            GetTenantId(), userId,
            JsonSerializer.Serialize(new { dto.strAssignedToGUID }));

        await _auditLogService.LogAsync(
            "Activity", id, "Assign",
            JsonSerializer.Serialize(new { dto.strAssignedToGUID }),
            userId);

        var resultDto = ProjectToDto(activity);
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), new List<ActivityListDto> { resultDto });
        return resultDto;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  BULK OPERATIONS
    // ─────────────────────────────────────────────────────────────────────

    public async Task<bool> BulkAssignAsync(ActivityBulkAssignDto dto)
    {
        if (dto.Guids.Count == 0)
            return true;

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();
        var activities = await _unitOfWork.Activities.Query()
            .Where(a => dto.Guids.Contains(a.strActivityGUID) && !a.bolIsDeleted)
            .ToListAsync();

        foreach (var activity in activities)
        {
            activity.strAssignedToGUID = dto.strAssignedToGUID;
            activity.strUpdatedByGUID = userId;
            activity.dtUpdatedOn = now;
            _unitOfWork.Activities.Update(activity);
        }

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Bulk assigned {Count} activities to {UserId}", activities.Count, dto.strAssignedToGUID);
        return true;
    }

    public async Task<bool> BulkChangeStatusAsync(ActivityBulkStatusDto dto)
    {
        if (dto.Guids.Count == 0)
            return true;

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();
        var activities = await _unitOfWork.Activities.Query()
            .Include(a => a.ActivityLinks)
            .Where(a => dto.Guids.Contains(a.strActivityGUID) && !a.bolIsDeleted)
            .ToListAsync();

        foreach (var activity in activities)
        {
            var oldStatus = activity.strStatus;
            activity.strStatus = dto.strStatus;
            activity.strUpdatedByGUID = userId;
            activity.dtUpdatedOn = now;

            if (dto.strOutcome != null)
                activity.strOutcome = dto.strOutcome;

            if (dto.strStatus == ActivityStatusConstants.Completed && activity.dtCompletedOn == null)
                activity.dtCompletedOn = now;

            _unitOfWork.Activities.Update(activity);

            // Trigger workflow for each completed activity
            if (dto.strStatus == ActivityStatusConstants.Completed && oldStatus != ActivityStatusConstants.Completed)
            {
                var leadLinks = activity.ActivityLinks
                    .Where(l => l.strEntityType == EntityTypeConstants.Lead)
                    .Select(l => new ActivityLinkDto { strEntityType = l.strEntityType, strEntityGUID = l.strEntityGUID })
                    .ToList();
                await TriggerActivityCompletedWorkflowsAsync(activity, leadLinks);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Bulk status change to {Status} for {Count} activities", dto.strStatus, activities.Count);
        return true;
    }

    public async Task<bool> BulkDeleteAsync(ActivityBulkDeleteDto dto)
    {
        if (dto.Guids.Count == 0)
            return true;

        var now = DateTime.UtcNow;
        var userId = GetCurrentUserId();
        var activities = await _unitOfWork.Activities.Query()
            .Where(a => dto.Guids.Contains(a.strActivityGUID) && !a.bolIsDeleted)
            .ToListAsync();

        foreach (var activity in activities)
        {
            activity.bolIsDeleted = true;
            activity.bolIsActive = false;
            activity.dtDeletedOn = now;
            activity.strUpdatedByGUID = userId;
            activity.dtUpdatedOn = now;
            _unitOfWork.Activities.Update(activity);
        }

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Bulk deleted {Count} activities", activities.Count);
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  USER-CENTRIC VIEWS
    // ─────────────────────────────────────────────────────────────────────

    public async Task<List<ActivityListDto>> GetTodayActivitiesAsync()
    {
        var userId = GetCurrentUserId();
        var todayStart = DateTime.UtcNow.Date;
        var todayEnd = todayStart.AddDays(1);

        var activities = await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Include(a => a.ActivityLinks)
            .Where(a => a.strAssignedToGUID == userId
                        && !a.bolIsDeleted
                        && a.bolIsActive
                        && a.strStatus != ActivityStatusConstants.Completed
                        && a.strStatus != ActivityStatusConstants.Cancelled
                        && ((a.dtDueDate.HasValue && a.dtDueDate.Value >= todayStart && a.dtDueDate.Value < todayEnd)
                            || (a.dtScheduledOn.HasValue && a.dtScheduledOn.Value >= todayStart && a.dtScheduledOn.Value < todayEnd)
                            || (a.dtDueDate.HasValue && a.dtDueDate.Value < todayStart)))  // Include overdue
            .OrderBy(a => a.dtDueDate ?? a.dtScheduledOn ?? a.dtCreatedOn)
            .Take(50)
            .ToListAsync();

        var dtos = activities.Select(ProjectToDto).ToList();
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), dtos);
        return dtos;
    }

    public async Task<PagedResponse<ActivityListDto>> GetMyActivitiesAsync(ActivityFilterParams filter)
    {
        filter.strAssignedToGUID = GetCurrentUserId();
        return await GetActivitiesAsync(filter);
    }

    public async Task<List<ActivityListDto>> GetOverdueActivitiesAsync()
    {
        var now = DateTime.UtcNow;

        var activities = await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Include(a => a.ActivityLinks)
            .Where(a => !a.bolIsDeleted
                        && a.bolIsActive
                        && a.dtDueDate.HasValue
                        && a.dtDueDate.Value < now
                        && a.strStatus != ActivityStatusConstants.Completed
                        && a.strStatus != ActivityStatusConstants.Cancelled)
            .OrderBy(a => a.dtDueDate)
            .Take(50)
            .ToListAsync();

        var dtos = activities.Select(ProjectToDto).ToList();
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), dtos);
        return dtos;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  BULK EMAIL NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────

    public async Task<bool> SendBulkActivityNotificationsAsync(ActivityBulkNotifyDto dto)
    {
        if (dto.ActivityGuids.Count == 0)
            return true;

        var activities = await _unitOfWork.Activities.Query()
            .Where(a => dto.ActivityGuids.Contains(a.strActivityGUID) && !a.bolIsDeleted)
            .ToListAsync();

        if (!activities.Any())
            return false;

        // Get unique assigned user IDs
        var userIds = activities
            .Where(a => a.strAssignedToGUID.HasValue)
            .Select(a => a.strAssignedToGUID!.Value)
            .Distinct()
            .ToList();

        // Use email notification service for sending
        await _emailNotificationService.SendBulkActivityNotificationsAsync(dto.ActivityGuids, userIds);

        _logger.LogInformation("Queued notifications for {Count} activities to {UserCount} users", 
            activities.Count, userIds.Count);

        return true;
    }

    /// <summary>
    /// Send bulk custom emails to activity participants
    /// High-performance implementation with template support and tenant isolation
    /// </summary>
    public async Task<int> SendBulkActivityEmailsAsync(ActivityBulkEmailDto dto)
    {
        if (dto.ActivityGuids.Count == 0)
            throw new BusinessException("At least one activity must be selected");

        if (string.IsNullOrWhiteSpace(dto.Subject))
            throw new BusinessException("Email subject is required");

        if (string.IsNullOrWhiteSpace(dto.Body))
            throw new BusinessException("Email body is required");

        var tenantId = GetTenantId();
        var userId = GetCurrentUserId();

        // Send bulk emails using the email service
        var emailCount = await _emailNotificationService.SendBulkActivityEmailsAsync(dto, tenantId);

        // Log audit trail
        await _auditLogService.LogAsync(
            "Activity",
            Guid.Empty,
            "BulkEmail",
            JsonSerializer.Serialize(new { 
                ActivityCount = dto.ActivityGuids.Count, 
                EmailCount = emailCount,
                Subject = dto.Subject 
            }),
            userId);

        _logger.LogInformation(
            "Bulk email sent: {EmailCount} emails for {ActivityCount} activities by user {UserGUID}", 
            emailCount, dto.ActivityGuids.Count, userId);

        return emailCount;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  ENTITY ACTIVITIES (existing, enhanced)
    // ─────────────────────────────────────────────────────────────────────

    public async Task<PagedResponse<ActivityListDto>> GetEntityActivitiesAsync(
        string entityType, Guid entityId, ActivityFilterParams filter)
    {
        var query = _unitOfWork.ActivityLinks.Query()
            .AsNoTracking()
            .Where(al => al.strEntityType == entityType && al.strEntityGUID == entityId)
            .Select(al => al.Activity)
            .Where(a => !a.bolIsDeleted)
            .Distinct();

        if (!string.IsNullOrWhiteSpace(filter.strActivityType))
            query = query.Where(a => a.strActivityType == filter.strActivityType);

        if (!string.IsNullOrWhiteSpace(filter.strStatus))
            query = query.Where(a => a.strStatus == filter.strStatus);

        if (!string.IsNullOrWhiteSpace(filter.strPriority))
            query = query.Where(a => a.strPriority == filter.strPriority);

        if (filter.bolIsCompleted.HasValue)
        {
            query = filter.bolIsCompleted.Value
                ? query.Where(a => a.strStatus == ActivityStatusConstants.Completed)
                : query.Where(a => a.strStatus != ActivityStatusConstants.Completed);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.Trim();
            query = query.Where(a =>
                a.strSubject.Contains(searchTerm) ||
                (a.strDescription != null && a.strDescription.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync();

        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            var sortKey = filter.SortBy.Trim().ToLowerInvariant();
            query = sortKey switch
            {
                "strsubject" => filter.Ascending ? query.OrderBy(a => a.strSubject) : query.OrderByDescending(a => a.strSubject),
                "stractivitytype" => filter.Ascending ? query.OrderBy(a => a.strActivityType) : query.OrderByDescending(a => a.strActivityType),
                "strstatus" => filter.Ascending ? query.OrderBy(a => a.strStatus) : query.OrderByDescending(a => a.strStatus),
                "strpriority" => filter.Ascending ? query.OrderBy(a => a.strPriority) : query.OrderByDescending(a => a.strPriority),
                "dtscheduledon" => filter.Ascending ? query.OrderBy(a => a.dtScheduledOn) : query.OrderByDescending(a => a.dtScheduledOn),
                "dtcompletedon" => filter.Ascending ? query.OrderBy(a => a.dtCompletedOn) : query.OrderByDescending(a => a.dtCompletedOn),
                "dtduedate" => filter.Ascending ? query.OrderBy(a => a.dtDueDate) : query.OrderByDescending(a => a.dtDueDate),
                "strcategory" => filter.Ascending ? query.OrderBy(a => a.strCategory) : query.OrderByDescending(a => a.strCategory),
                "strassignedtoguid" => filter.Ascending ? query.OrderBy(a => a.strAssignedToGUID) : query.OrderByDescending(a => a.strAssignedToGUID),
                "dtcreatedon" => filter.Ascending ? query.OrderBy(a => a.dtCreatedOn) : query.OrderByDescending(a => a.dtCreatedOn),
                "bolisactive" => filter.Ascending ? query.OrderBy(a => a.bolIsActive) : query.OrderByDescending(a => a.bolIsActive),
                _ => query.OrderByDescending(a => a.dtCreatedOn)
            };
        }
        else
        {
            query = query.OrderByDescending(a => a.dtCreatedOn);
        }

        var activities = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Include(a => a.ActivityLinks)
            .ToListAsync();

        var activityDtos = activities.Select(ProjectToDto).ToList();
        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), activityDtos);

        return new PagedResponse<ActivityListDto>
        {
            Items = activityDtos,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    //  UPCOMING (existing, enhanced with status/priority)
    // ─────────────────────────────────────────────────────────────────────

    public async Task<List<UpcomingActivityDto>> GetUpcomingActivitiesAsync()
    {
        var now = DateTime.UtcNow;

        return await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Where(a => a.dtScheduledOn != null
                        && a.dtScheduledOn > now
                        && !a.bolIsDeleted
                        && a.strStatus != ActivityStatusConstants.Completed
                        && a.strStatus != ActivityStatusConstants.Cancelled
                        && a.bolIsActive)
            .OrderBy(a => a.dtScheduledOn)
            .Take(20)
            .Select(a => new UpcomingActivityDto
            {
                strActivityGUID = a.strActivityGUID,
                strActivityType = a.strActivityType,
                strSubject = a.strSubject,
                strStatus = a.strStatus,
                strPriority = a.strPriority,
                dtScheduledOn = a.dtScheduledOn,
                dtDueDate = a.dtDueDate,
                bolIsOverdue = a.dtDueDate.HasValue && a.dtDueDate.Value < now,
                strAssignedToGUID = a.strAssignedToGUID,
                strCategory = a.strCategory,
                Links = a.ActivityLinks.Select(al => new ActivityLinkDto
                {
                    strEntityType = al.strEntityType,
                    strEntityGUID = al.strEntityGUID
                }).ToList()
            })
            .ToListAsync();
    }

    // ─────────────────────────────────────────────────────────────────────
    //  PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────

    private IQueryable<MstActivity> BuildFilteredQuery(ActivityFilterParams filter)
    {
        var query = _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Where(a => !a.bolIsDeleted);

        if (filter.bolIsActive.HasValue)
            query = query.Where(a => a.bolIsActive == filter.bolIsActive.Value);

        if (!string.IsNullOrWhiteSpace(filter.strActivityType))
            query = query.Where(a => a.strActivityType == filter.strActivityType);

        if (!string.IsNullOrWhiteSpace(filter.strStatus))
            query = query.Where(a => a.strStatus == filter.strStatus);

        if (!string.IsNullOrWhiteSpace(filter.strPriority))
            query = query.Where(a => a.strPriority == filter.strPriority);

        if (!string.IsNullOrWhiteSpace(filter.strCategory))
            query = query.Where(a => a.strCategory == filter.strCategory);

        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(a => a.strAssignedToGUID == filter.strAssignedToGUID.Value);

        if (filter.dtFromDate.HasValue)
            query = query.Where(a => a.dtCreatedOn >= filter.dtFromDate.Value);

        if (filter.dtToDate.HasValue)
            query = query.Where(a => a.dtCreatedOn <= filter.dtToDate.Value);

        if (filter.dtDueBefore.HasValue)
            query = query.Where(a => a.dtDueDate.HasValue && a.dtDueDate.Value <= filter.dtDueBefore.Value);

        if (filter.dtDueAfter.HasValue)
            query = query.Where(a => a.dtDueDate.HasValue && a.dtDueDate.Value >= filter.dtDueAfter.Value);

        if (filter.bolIsOverdue == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(a => a.dtDueDate.HasValue && a.dtDueDate.Value < now
                                     && a.strStatus != ActivityStatusConstants.Completed
                                     && a.strStatus != ActivityStatusConstants.Cancelled);
        }

        if (filter.bolIsCompleted.HasValue)
        {
            query = filter.bolIsCompleted.Value
                ? query.Where(a => a.strStatus == ActivityStatusConstants.Completed)
                : query.Where(a => a.strStatus != ActivityStatusConstants.Completed);
        }

        // Entity-level filtering via ActivityLinks junction
        if (!string.IsNullOrWhiteSpace(filter.strEntityType) && filter.strEntityGUID.HasValue)
        {
            query = query.Where(a => a.ActivityLinks.Any(
                al => al.strEntityType == filter.strEntityType &&
                      al.strEntityGUID == filter.strEntityGUID.Value));
        }
        else if (!string.IsNullOrWhiteSpace(filter.strEntityType))
        {
            query = query.Where(a => a.ActivityLinks.Any(
                al => al.strEntityType == filter.strEntityType));
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.Trim();
            query = query.Where(a =>
                a.strSubject.Contains(searchTerm) ||
                (a.strDescription != null && a.strDescription.Contains(searchTerm)) ||
                (a.strOutcome != null && a.strOutcome.Contains(searchTerm)));
        }

        return query;
    }

    /// <summary>
    /// Trigger business logic when an activity is completed:
    /// 1. Update linked lead status (Contacted → Qualified for meetings, etc.)
    /// 2. Fire ActivityCompleted workflow trigger
    /// </summary>
    private async Task TriggerActivityCompletedWorkflowsAsync(MstActivity activity, List<ActivityLinkDto> leadLinks)
    {
        var userId = GetCurrentUserId();
        var tenantId = GetTenantId();

        // Auto lead status progression based on activity type
        foreach (var leadLink in leadLinks)
        {
            var lead = await _unitOfWork.Leads.GetByIdAsync(leadLink.strEntityGUID);
            if (lead == null) continue;

            string? newStatus = null;

            // Any activity completed + lead is Contacted → Qualified
            if (lead.strStatus == LeadStatusConstants.Contacted)
            {
                newStatus = LeadStatusConstants.Qualified;
            }
            // Any activity completed + lead is New → Contacted
            else if (lead.strStatus == LeadStatusConstants.New)
            {
                newStatus = LeadStatusConstants.Contacted;
            }

            if (newStatus != null)
            {
                lead.strStatus = newStatus;
                lead.strUpdatedByGUID = userId;
                lead.dtUpdatedOn = DateTime.UtcNow;
                _unitOfWork.Leads.Update(lead);

                _logger.LogInformation(
                    "Auto-updated lead {LeadId} status to {NewStatus} upon activity {ActivityId} completion",
                    lead.strLeadGUID, newStatus, activity.strActivityGUID);
            }
        }

        if (leadLinks.Count > 0)
            await _unitOfWork.SaveChangesAsync();

        // Trigger workflow engine
        await _workflowService.TriggerWorkflowsAsync(
            EntityTypeConstants.Activity, activity.strActivityGUID,
            WorkflowTriggerConstants.ActivityCompleted,
            tenantId, userId,
            JsonSerializer.Serialize(new
            {
                activity.strActivityType,
                activity.strSubject,
                activity.strStatus,
                LinkedLeadIds = leadLinks.Select(l => l.strEntityGUID).ToList()
            }));
    }
}
