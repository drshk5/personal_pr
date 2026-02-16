using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/lead-scoring")]
public class LeadScoringController : BaseController
{
    private readonly IMstLeadScoringApplicationService _scoringAppService;

    public LeadScoringController(IMstLeadScoringApplicationService scoringAppService) => _scoringAppService = scoringAppService;

    [HttpGet("rules")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadScoring", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ScoringRuleListDto>>>> GetRules([FromQuery] ScoringRuleFilterParams filter)
    {
        var result = await _scoringAppService.GetRulesAsync(filter);
        return OkResponse(result);
    }

    [HttpGet("rules/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadScoring", "View")]
    public async Task<ActionResult<ApiResponse<ScoringRuleListDto>>> GetRule(Guid id)
    {
        var result = await _scoringAppService.GetRuleByIdAsync(id);
        return OkResponse(result);
    }

    [HttpPost("rules")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadScoring", "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<ScoringRuleListDto>>> CreateRule([FromBody] CreateScoringRuleDto dto)
    {
        var result = await _scoringAppService.CreateRuleAsync(dto);
        return CreatedResponse(result);
    }

    [HttpPut("rules/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadScoring", "Edit")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<ScoringRuleListDto>>> UpdateRule(Guid id, [FromBody] UpdateScoringRuleDto dto)
    {
        var result = await _scoringAppService.UpdateRuleAsync(id, dto);
        return OkResponse(result);
    }

    [HttpDelete("rules/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadScoring", "Delete")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteRule(Guid id)
    {
        await _scoringAppService.DeleteRuleAsync(id);
        return OkResponse<object>(null!, "Scoring rule deleted");
    }

    [HttpGet("leads/{leadId:guid}/history")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ScoreHistoryListDto>>>> GetScoreHistory(Guid leadId, [FromQuery] PagedRequestDto paging)
    {
        var result = await _scoringAppService.GetScoreHistoryAsync(leadId, paging);
        return OkResponse(result);
    }

    [HttpGet("leads/{leadId:guid}/breakdown")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<ScoreBreakdownDto>>> GetScoreBreakdown(Guid leadId)
    {
        var result = await _scoringAppService.GetScoreBreakdownAsync(leadId);
        return OkResponse(result);
    }

    [HttpPost("recalculate-all")]
    [RequireTenantId]
    [AuthorizePermission("CRM_LeadScoring", "Edit")]
    public async Task<ActionResult<ApiResponse<object>>> RecalculateAll()
    {
        await _scoringAppService.RecalculateAllScoresAsync();
        return OkResponse<object>(null!, "All lead scores recalculated");
    }
}
