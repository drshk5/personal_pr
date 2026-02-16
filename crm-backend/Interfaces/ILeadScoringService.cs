using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Interfaces;

public interface ILeadScoringService
{
    Task<int> CalculateScoreAsync(MstLead lead);
    Task RecordScoreChangeAsync(Guid leadGuid, int previousScore, int newScore, string reason, Guid? ruleGuid = null);
    Task ApplyDecayAsync();
    Task RecalculateAllScoresAsync();
    Task<ScoreBreakdownDto> GetScoreBreakdownAsync(MstLead lead);
}
