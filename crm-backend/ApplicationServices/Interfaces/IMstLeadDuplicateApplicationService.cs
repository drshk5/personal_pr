using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstLeadDuplicateApplicationService : IApplicationService
{
    Task<List<DuplicatePairDto>> CheckDuplicatesAsync(Guid leadId);
    Task<PagedResponse<DuplicatePairDto>> GetSuggestionsAsync(DuplicateFilterParams filter);
    Task ResolveDuplicateAsync(Guid duplicateId, DuplicateResolveDto dto);
    Task<LeadMergeResultDto> MergeLeadsAsync(LeadMergeRequestDto dto);
    Task<PagedResponse<MergeHistoryListDto>> GetMergeHistoryAsync(PagedRequestDto paging);
}
