using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstOpportunityApplicationService : IApplicationService
{
    Task<PagedResponse<OpportunityListDto>> GetOpportunitiesAsync(OpportunityFilterParams filter);
    Task<OpportunityDetailDto> GetOpportunityByIdAsync(Guid id);
    Task<OpportunityDetailDto> CreateOpportunityAsync(CreateOpportunityDto dto);
    Task<OpportunityDetailDto> UpdateOpportunityAsync(Guid id, UpdateOpportunityDto dto);
    Task<bool> DeleteOpportunityAsync(Guid id);
    Task<OpportunityDetailDto> MoveStageAsync(Guid id, MoveStageDto dto);
    Task<OpportunityDetailDto> CloseOpportunityAsync(Guid id, CloseOpportunityDto dto);
    Task<OpportunityDetailDto> AddContactAsync(Guid opportunityId, AddOpportunityContactDto dto);
    Task<bool> RemoveContactAsync(Guid opportunityId, Guid contactId);
    /// <summary>
    /// Board/Kanban view for a pipeline.
    /// NOTE: For high-volume datasets, this endpoint must not return every opportunity.
    /// Use takePerStage to cap returned cards per stage while keeping stage totals/counts accurate.
    /// </summary>
    Task<List<OpportunityBoardColumnDto>> GetBoardAsync(Guid pipelineId, int takePerStage = 50);
    Task<bool> BulkArchiveAsync(OpportunityBulkArchiveDto dto);
    Task<bool> BulkRestoreAsync(OpportunityBulkArchiveDto dto);
}
