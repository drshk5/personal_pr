using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstActivityApplicationService : IApplicationService
{
    // ── Existing ──
    Task<PagedResponse<ActivityListDto>> GetActivitiesAsync(ActivityFilterParams filter);
    Task<ActivityListDto> GetActivityByIdAsync(Guid id);
    Task<ActivityListDto> CreateActivityAsync(CreateActivityDto dto);
    Task<PagedResponse<ActivityListDto>> GetEntityActivitiesAsync(string entityType, Guid entityId, ActivityFilterParams filter);
    Task<List<UpcomingActivityDto>> GetUpcomingActivitiesAsync();

    // ── New: Full CRUD ──
    Task<ActivityListDto> UpdateActivityAsync(Guid id, UpdateActivityDto dto);
    Task<bool> DeleteActivityAsync(Guid id);

    // ── New: Status & Assignment ──
    Task<ActivityListDto> ChangeStatusAsync(Guid id, ActivityStatusChangeDto dto);
    Task<ActivityListDto> AssignActivityAsync(Guid id, ActivityAssignDto dto);

    // ── New: Bulk Operations ──
    Task<bool> BulkAssignAsync(ActivityBulkAssignDto dto);
    Task<bool> BulkChangeStatusAsync(ActivityBulkStatusDto dto);
    Task<bool> BulkDeleteAsync(ActivityBulkDeleteDto dto);

    // ── New: User-centric views ──
    Task<List<ActivityListDto>> GetTodayActivitiesAsync();
    Task<PagedResponse<ActivityListDto>> GetMyActivitiesAsync(ActivityFilterParams filter);
    Task<List<ActivityListDto>> GetOverdueActivitiesAsync();

    // ── New: Bulk Email Notifications ──
    Task<bool> SendBulkActivityNotificationsAsync(ActivityBulkNotifyDto dto);
}
