using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstWorkflowRuleRepository : IRepository<MstWorkflowRule>
{
    Task<IEnumerable<MstWorkflowRule>> GetActiveRulesByTriggerAsync(string entityType, string triggerEvent);
}
