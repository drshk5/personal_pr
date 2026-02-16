using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstActivityApplicationService : IApplicationService
{
    Task<PagedResponse<ActivityListDto>> GetActivitiesAsync(ActivityFilterParams filter);
    Task<ActivityListDto> GetActivityByIdAsync(Guid id);
    Task<ActivityListDto> CreateActivityAsync(CreateActivityDto dto);
    Task<PagedResponse<ActivityListDto>> GetEntityActivitiesAsync(string entityType, Guid entityId, ActivityFilterParams filter);
    Task<List<UpcomingActivityDto>> GetUpcomingActivitiesAsync();
}
