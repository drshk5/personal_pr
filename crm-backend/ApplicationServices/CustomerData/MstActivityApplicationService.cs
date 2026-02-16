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

    public MstActivityApplicationService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        MasterDbContext masterDbContext,
        IActivityService activityService,
        IAuditLogService auditLogService,
        ILogger<MstActivityApplicationService> logger)
        : base(unitOfWork, tenantContextProvider, logger)
    {
        _masterDbContext = masterDbContext;
        _activityService = activityService;
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// Paginated list of all activities with filtering — SQL-level projection, no full entity loading.
    /// </summary>
    public async Task<PagedResponse<ActivityListDto>> GetActivitiesAsync(ActivityFilterParams filter)
    {
        var query = _unitOfWork.Activities.Query().AsNoTracking();

        // ── Filters — applied BEFORE count/pagination for max SQL efficiency ──

        if (filter.bolIsActive.HasValue)
            query = query.Where(a => a.bolIsActive == filter.bolIsActive.Value);

        if (!string.IsNullOrWhiteSpace(filter.strActivityType))
            query = query.Where(a => a.strActivityType == filter.strActivityType);

        if (filter.strAssignedToGUID.HasValue)
            query = query.Where(a => a.strAssignedToGUID == filter.strAssignedToGUID.Value);

        if (filter.dtFromDate.HasValue)
            query = query.Where(a => a.dtCreatedOn >= filter.dtFromDate.Value);

        if (filter.dtToDate.HasValue)
            query = query.Where(a => a.dtCreatedOn <= filter.dtToDate.Value);

        if (filter.bolIsCompleted.HasValue)
        {
            query = filter.bolIsCompleted.Value
                ? query.Where(a => a.dtCompletedOn != null)
                : query.Where(a => a.dtCompletedOn == null);
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

        // Search — SQL Server case-insensitive collation, no ToLower() needed
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.Trim();
            query = query.Where(a =>
                a.strSubject.Contains(searchTerm) ||
                (a.strDescription != null && a.strDescription.Contains(searchTerm)) ||
                (a.strOutcome != null && a.strOutcome.Contains(searchTerm)));
        }

        // Count AFTER filtering
        var totalCount = await query.CountAsync();

        // ── Sorting ──
        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            var direction = filter.Ascending ? "ascending" : "descending";
            query = query.OrderBy($"{filter.SortBy} {direction}");
        }
        else
        {
            query = query.OrderByDescending(a => a.dtCreatedOn);
        }

        // ── Project to DTO at DB level — single round-trip ──
        var activityDtos = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new ActivityListDto
            {
                strActivityGUID = a.strActivityGUID,
                strActivityType = a.strActivityType,
                strSubject = a.strSubject,
                strDescription = a.strDescription,
                dtScheduledOn = a.dtScheduledOn,
                dtCompletedOn = a.dtCompletedOn,
                intDurationMinutes = a.dtScheduledOn.HasValue && a.dtCompletedOn.HasValue
                    ? EF.Functions.DateDiffMinute(a.dtScheduledOn.Value, a.dtCompletedOn.Value)
                    : a.intDurationMinutes,
                strOutcome = a.strOutcome,
                strAssignedToGUID = a.strAssignedToGUID,
                strAssignedToName = null, // Populated below
                strCreatedByGUID = a.strCreatedByGUID,
                strCreatedByName = string.Empty, // Populated below
                dtCreatedOn = a.dtCreatedOn,
                bolIsActive = a.bolIsActive,
                Links = a.ActivityLinks.Select(al => new ActivityLinkDto
                {
                    strEntityType = al.strEntityType,
                    strEntityGUID = al.strEntityGUID
                }).ToList()
            })
            .ToListAsync();

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

    /// <summary>
    /// Single activity detail — AsNoTracking + Include for links.
    /// </summary>
    public async Task<ActivityListDto> GetActivityByIdAsync(Guid id)
    {
        var activity = await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Where(a => a.strActivityGUID == id)
            .Select(a => new ActivityListDto
            {
                strActivityGUID = a.strActivityGUID,
                strActivityType = a.strActivityType,
                strSubject = a.strSubject,
                strDescription = a.strDescription,
                dtScheduledOn = a.dtScheduledOn,
                dtCompletedOn = a.dtCompletedOn,
                intDurationMinutes = a.dtScheduledOn.HasValue && a.dtCompletedOn.HasValue
                    ? EF.Functions.DateDiffMinute(a.dtScheduledOn.Value, a.dtCompletedOn.Value)
                    : a.intDurationMinutes,
                strOutcome = a.strOutcome,
                strAssignedToGUID = a.strAssignedToGUID,
                strAssignedToName = null,
                strCreatedByGUID = a.strCreatedByGUID,
                strCreatedByName = string.Empty,
                dtCreatedOn = a.dtCreatedOn,
                bolIsActive = a.bolIsActive,
                Links = a.ActivityLinks.Select(al => new ActivityLinkDto
                {
                    strEntityType = al.strEntityType,
                    strEntityGUID = al.strEntityGUID
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (activity == null)
            throw new NotFoundException("Activity not found");

        await ActivityDtoEnricher.PopulateUserNamesAsync(_masterDbContext, GetTenantId(), new List<ActivityListDto> { activity });

        return activity;
    }

    /// <summary>
    /// Create activity — IMMUTABLE: insert-only, no update/delete ever.
    /// Single SaveChanges call for both activity + links (atomic).
    /// </summary>
    public async Task<ActivityListDto> CreateActivityAsync(CreateActivityDto dto)
    {
        // Validate
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
            strAssignedToGUID = dto.strAssignedToGUID,
            strCreatedByGUID = userId,
            dtCreatedOn = now,
            bolIsActive = true
        };

        await _unitOfWork.Activities.AddAsync(activity);

        // Insert all links in a single batch — no N+1
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

        // Single SaveChanges — activity + all links atomically
        await _unitOfWork.SaveChangesAsync();

        // Auto-update lead status: if activity is logged for a "New" lead, move it to "Contacted"
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

        // Audit log
        await _auditLogService.LogAsync(
            "Activity",
            activityId,
            "Create",
            JsonSerializer.Serialize(new { dto.strActivityType, dto.strSubject, LinkCount = dto.Links.Count }),
            userId);

        _logger.LogInformation("Activity created: {ActivityGUID} type={Type} by {UserGUID}",
            activityId, dto.strActivityType, userId);

        return new ActivityListDto
        {
            strActivityGUID = activityId,
            strActivityType = activity.strActivityType,
            strSubject = activity.strSubject,
            strDescription = activity.strDescription,
            dtScheduledOn = activity.dtScheduledOn,
            dtCompletedOn = activity.dtCompletedOn,
            intDurationMinutes = activity.dtScheduledOn.HasValue && activity.dtCompletedOn.HasValue
                ? (int?)(activity.dtCompletedOn.Value - activity.dtScheduledOn.Value).TotalMinutes
                : dto.intDurationMinutes,
            strOutcome = activity.strOutcome,
            strAssignedToGUID = activity.strAssignedToGUID,
            strAssignedToName = null,
            strCreatedByGUID = userId,
            strCreatedByName = GetCurrentUserName(),
            dtCreatedOn = activity.dtCreatedOn,
            bolIsActive = activity.bolIsActive,
            Links = linkDtos
        };
    }

    /// <summary>
    /// All activities for a specific entity — uses the IX_MstActivityLinks_Entity index.
    /// Single query via join, no N+1.
    /// </summary>
    public async Task<PagedResponse<ActivityListDto>> GetEntityActivitiesAsync(
        string entityType, Guid entityId, ActivityFilterParams filter)
    {
        // Start from ActivityLinks and join to Activities — leverages the covering index
        var query = _unitOfWork.ActivityLinks.Query()
            .AsNoTracking()
            .Where(al => al.strEntityType == entityType && al.strEntityGUID == entityId)
            .Select(al => al.Activity)
            .Distinct();

        // Apply additional filters
        if (!string.IsNullOrWhiteSpace(filter.strActivityType))
            query = query.Where(a => a.strActivityType == filter.strActivityType);

        if (filter.bolIsCompleted.HasValue)
        {
            query = filter.bolIsCompleted.Value
                ? query.Where(a => a.dtCompletedOn != null)
                : query.Where(a => a.dtCompletedOn == null);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var searchTerm = filter.Search.Trim();
            query = query.Where(a =>
                a.strSubject.Contains(searchTerm) ||
                (a.strDescription != null && a.strDescription.Contains(searchTerm)));
        }

        var totalCount = await query.CountAsync();

        // Sort
        if (!string.IsNullOrWhiteSpace(filter.SortBy))
        {
            var direction = filter.Ascending ? "ascending" : "descending";
            query = query.OrderBy($"{filter.SortBy} {direction}");
        }
        else
        {
            query = query.OrderByDescending(a => a.dtCreatedOn);
        }

        // Project to DTO at DB level
        var activityDtos = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(a => new ActivityListDto
            {
                strActivityGUID = a.strActivityGUID,
                strActivityType = a.strActivityType,
                strSubject = a.strSubject,
                strDescription = a.strDescription,
                dtScheduledOn = a.dtScheduledOn,
                dtCompletedOn = a.dtCompletedOn,
                intDurationMinutes = a.dtScheduledOn.HasValue && a.dtCompletedOn.HasValue
                    ? EF.Functions.DateDiffMinute(a.dtScheduledOn.Value, a.dtCompletedOn.Value)
                    : a.intDurationMinutes,
                strOutcome = a.strOutcome,
                strAssignedToGUID = a.strAssignedToGUID,
                strAssignedToName = null,
                strCreatedByGUID = a.strCreatedByGUID,
                strCreatedByName = string.Empty,
                dtCreatedOn = a.dtCreatedOn,
                bolIsActive = a.bolIsActive,
                Links = a.ActivityLinks.Select(al => new ActivityLinkDto
                {
                    strEntityType = al.strEntityType,
                    strEntityGUID = al.strEntityGUID
                }).ToList()
            })
            .ToListAsync();

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

    /// <summary>
    /// Upcoming scheduled activities (not yet completed, ordered by soonest first).
    /// Lightweight DTO — no links fetched.
    /// </summary>
    public async Task<List<UpcomingActivityDto>> GetUpcomingActivitiesAsync()
    {
        var now = DateTime.UtcNow;

        return await _unitOfWork.Activities.Query()
            .AsNoTracking()
            .Where(a => a.dtScheduledOn != null &&
                        a.dtScheduledOn > now &&
                        a.dtCompletedOn == null &&
                        a.bolIsActive)
            .OrderBy(a => a.dtScheduledOn)
            .Take(20) // Cap at 20 upcoming
            .Select(a => new UpcomingActivityDto
            {
                strActivityGUID = a.strActivityGUID,
                strActivityType = a.strActivityType,
                strSubject = a.strSubject,
                dtScheduledOn = a.dtScheduledOn
            })
            .ToListAsync();
    }
}
