using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstLeadScoringRuleRepository : IRepository<MstLeadScoringRule>
{
    Task<IEnumerable<MstLeadScoringRule>> GetActiveRulesByCategoryAsync(string category);
    Task<IEnumerable<MstLeadScoringRule>> GetAllActiveRulesAsync();
}
