using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/lead-conversion")]
[RequireTenantId]
public class LeadConversionController : BaseController
{
    private readonly IMstLeadApplicationService _leadAppService;

    public LeadConversionController(IMstLeadApplicationService leadAppService)
    {
        _leadAppService = leadAppService;
    }

    [HttpGet("{leadId:guid}/preview")]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<LeadListDto>>> Preview(Guid leadId)
    {
        var result = await _leadAppService.GetConversionPreviewAsync(leadId);
        return OkResponse(result);
    }

    [HttpPost("convert")]
    [AuthorizePermission("CRM_Leads", "Edit")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<LeadConversionResultDto>>> Convert([FromBody] ConvertLeadDto dto)
    {
        var result = await _leadAppService.ConvertLeadAsync(dto);
        return OkResponse(result, "Lead converted successfully");
    }
}
