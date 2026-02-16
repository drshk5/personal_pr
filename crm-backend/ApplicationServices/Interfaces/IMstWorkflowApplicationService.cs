using crm_backend.DTOs.Common;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstWorkflowApplicationService : IApplicationService
{
    Task<PagedResponse<WorkflowRuleListDto>> GetRulesAsync(WorkflowRuleFilterParams filter);
    Task<WorkflowRuleListDto> GetRuleByIdAsync(Guid id);
    Task<WorkflowRuleListDto> CreateRuleAsync(CreateWorkflowRuleDto dto);
    Task<WorkflowRuleListDto> UpdateRuleAsync(Guid id, UpdateWorkflowRuleDto dto);
    Task<bool> DeleteRuleAsync(Guid id);
    Task<PagedResponse<WorkflowExecutionListDto>> GetExecutionsAsync(PagedRequestDto paging);
    Task<WorkflowExecutionListDto> GetExecutionByIdAsync(Guid id);
}
