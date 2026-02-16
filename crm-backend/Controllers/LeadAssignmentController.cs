using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/lead-assignment")]
public class LeadAssignmentController : BaseController
{
    private readonly IMstLeadAssignmentApplicationService _appService;
    public LeadAssignmentController(IMstLeadAssignmentApplicationService appService) => _appService = appService;

    [HttpGet("rules")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadAssignment", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<AssignmentRuleListDto>>>> GetRules([FromQuery] AssignmentRuleFilterParams filter)
    {
        return OkResponse(await _appService.GetRulesAsync(filter));
    }

    [HttpPost("rules")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadAssignment", "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<AssignmentRuleListDto>>> CreateRule([FromBody] CreateAssignmentRuleDto dto)
    {
        return CreatedResponse(await _appService.CreateRuleAsync(dto));
    }

    [HttpPut("rules/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadAssignment", "Edit")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<AssignmentRuleListDto>>> UpdateRule(Guid id, [FromBody] UpdateAssignmentRuleDto dto)
    {
        return OkResponse(await _appService.UpdateRuleAsync(id, dto));
    }

    [HttpDelete("rules/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadAssignment", "Delete")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRule(Guid id)
    {
        await _appService.DeleteRuleAsync(id);
        return OkResponse<object>(null!, "Rule deleted");
    }

    [HttpGet("rules/{ruleId:guid}/members")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadAssignment", "View")]
    public async Task<ActionResult<ApiResponse<List<AssignmentMemberDto>>>> GetMembers(Guid ruleId)
    {
        return OkResponse(await _appService.GetMembersAsync(ruleId));
    }

    [HttpPost("rules/{ruleId:guid}/members")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadAssignment", "Edit")]
    public async Task<ActionResult<ApiResponse<AssignmentMemberDto>>> AddMember(Guid ruleId, [FromBody] AddAssignmentMemberDto dto)
    {
        return CreatedResponse(await _appService.AddMemberAsync(ruleId, dto));
    }

    [HttpDelete("rules/{ruleId:guid}/members/{memberId:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadAssignment", "Edit")]
    public async Task<ActionResult<ApiResponse<object>>> RemoveMember(Guid ruleId, Guid memberId)
    {
        await _appService.RemoveMemberAsync(ruleId, memberId);
        return OkResponse<object>(null!, "Member removed");
    }

    [HttpPost("assign/{leadId:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "Edit")]
    public async Task<ActionResult<ApiResponse<LeadAssignmentResultDto?>>> AutoAssign(Guid leadId)
    {
        return OkResponse(await _appService.AutoAssignLeadAsync(leadId));
    }

    [HttpPost("assign-manual")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "Edit")]
    public async Task<ActionResult<ApiResponse<LeadAssignmentResultDto>>> ManualAssign([FromBody] ManualAssignDto dto)
    {
        return OkResponse(await _appService.ManualAssignAsync(dto));
    }
}
