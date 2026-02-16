using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/lead-duplicates")]
public class LeadDuplicatesController : BaseController
{
    private readonly IMstLeadDuplicateApplicationService _appService;
    public LeadDuplicatesController(IMstLeadDuplicateApplicationService appService) => _appService = appService;

    [HttpGet("leads/{leadId:guid}/check")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<List<DuplicatePairDto>>>> CheckDuplicates(Guid leadId)
    {
        return OkResponse(await _appService.CheckDuplicatesAsync(leadId));
    }

    [HttpGet("suggestions")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<DuplicatePairDto>>>> GetSuggestions([FromQuery] DuplicateFilterParams filter)
    {
        return OkResponse(await _appService.GetSuggestionsAsync(filter));
    }

    [HttpPatch("{duplicateId:guid}/resolve")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "Edit")]
    public async Task<ActionResult<ApiResponse<object>>> Resolve(Guid duplicateId, [FromBody] DuplicateResolveDto dto)
    {
        await _appService.ResolveDuplicateAsync(duplicateId, dto);
        return OkResponse<object>(null!, "Duplicate resolved");
    }

    [HttpPost("merge")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "Edit")]
    public async Task<ActionResult<ApiResponse<LeadMergeResultDto>>> Merge([FromBody] LeadMergeRequestDto dto)
    {
        return OkResponse(await _appService.MergeLeadsAsync(dto));
    }

    [HttpGet("merge-history")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<MergeHistoryListDto>>>> GetMergeHistory([FromQuery] PagedRequestDto paging)
    {
        return OkResponse(await _appService.GetMergeHistoryAsync(paging));
    }
}
