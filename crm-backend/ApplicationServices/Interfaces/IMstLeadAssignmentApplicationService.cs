using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstLeadAssignmentApplicationService : IApplicationService
{
    Task<PagedResponse<AssignmentRuleListDto>> GetRulesAsync(AssignmentRuleFilterParams filter);
    Task<AssignmentRuleListDto> CreateRuleAsync(CreateAssignmentRuleDto dto);
    Task<AssignmentRuleListDto> UpdateRuleAsync(Guid id, UpdateAssignmentRuleDto dto);
    Task<bool> DeleteRuleAsync(Guid id);
    Task<List<AssignmentMemberDto>> GetMembersAsync(Guid ruleId);
    Task<AssignmentMemberDto> AddMemberAsync(Guid ruleId, AddAssignmentMemberDto dto);
    Task<bool> RemoveMemberAsync(Guid ruleId, Guid memberId);
    Task<LeadAssignmentResultDto?> AutoAssignLeadAsync(Guid leadId);
    Task<LeadAssignmentResultDto> ManualAssignAsync(ManualAssignDto dto);
}
