using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/workflows")]
public class WorkflowsController : BaseController
{
    private readonly IMstWorkflowApplicationService _workflowAppService;

    public WorkflowsController(IMstWorkflowApplicationService workflowAppService) => _workflowAppService = workflowAppService;

    [HttpGet("rules")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Workflows", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<WorkflowRuleListDto>>>> GetRules([FromQuery] WorkflowRuleFilterParams filter)
    {
        var result = await _workflowAppService.GetRulesAsync(filter);
        return OkResponse(result);
    }

    [HttpGet("rules/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Workflows", "View")]
    public async Task<ActionResult<ApiResponse<WorkflowRuleListDto>>> GetRule(Guid id)
    {
        var result = await _workflowAppService.GetRuleByIdAsync(id);
        return OkResponse(result);
    }

    [HttpPost("rules")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Workflows", "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<WorkflowRuleListDto>>> CreateRule([FromBody] CreateWorkflowRuleDto dto)
    {
        var result = await _workflowAppService.CreateRuleAsync(dto);
        return CreatedResponse(result);
    }

    [HttpPut("rules/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Workflows", "Edit")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<WorkflowRuleListDto>>> UpdateRule(Guid id, [FromBody] UpdateWorkflowRuleDto dto)
    {
        var result = await _workflowAppService.UpdateRuleAsync(id, dto);
        return OkResponse(result);
    }

    [HttpDelete("rules/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Workflows", "Delete")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRule(Guid id)
    {
        await _workflowAppService.DeleteRuleAsync(id);
        return OkResponse<object>(null!, "Workflow rule deleted");
    }

    [HttpGet("executions")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Workflows", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<WorkflowExecutionListDto>>>> GetExecutions([FromQuery] PagedRequestDto paging)
    {
        var result = await _workflowAppService.GetExecutionsAsync(paging);
        return OkResponse(result);
    }

    [HttpGet("executions/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Workflows", "View")]
    public async Task<ActionResult<ApiResponse<WorkflowExecutionListDto>>> GetExecution(Guid id)
    {
        var result = await _workflowAppService.GetExecutionByIdAsync(id);
        return OkResponse(result);
    }
}
