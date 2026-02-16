using crm_backend.DTOs.Common;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstLeadScoringApplicationService : IApplicationService
{
    Task<PagedResponse<ScoringRuleListDto>> GetRulesAsync(ScoringRuleFilterParams filter);
    Task<ScoringRuleListDto> GetRuleByIdAsync(Guid id);
    Task<ScoringRuleListDto> CreateRuleAsync(CreateScoringRuleDto dto);
    Task<ScoringRuleListDto> UpdateRuleAsync(Guid id, UpdateScoringRuleDto dto);
    Task<bool> DeleteRuleAsync(Guid id);
    Task<PagedResponse<ScoreHistoryListDto>> GetScoreHistoryAsync(Guid leadId, PagedRequestDto paging);
    Task<ScoreBreakdownDto> GetScoreBreakdownAsync(Guid leadId);
    Task RecalculateAllScoresAsync();
}
