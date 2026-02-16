using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstWorkflowExecutionRepository : IRepository<MstWorkflowExecution>
{
    Task<IEnumerable<MstWorkflowExecution>> GetPendingExecutionsAsync();
    Task<IEnumerable<MstWorkflowExecution>> GetByWorkflowRuleIdAsync(Guid ruleGuid);
}
