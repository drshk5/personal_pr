using crm_backend.Models.Core.CustomerData;

namespace crm_backend.DataAccess.Interfaces;

public interface IMstLeadAssignmentMemberRepository : IRepository<MstLeadAssignmentMember>
{
    Task<IEnumerable<MstLeadAssignmentMember>> GetByRuleIdAsync(Guid ruleGuid);
    Task<IEnumerable<MstLeadAssignmentMember>> GetActiveMembersByRuleIdAsync(Guid ruleGuid);
}
