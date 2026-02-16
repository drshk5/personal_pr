using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Interfaces;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/communications")]
public class CommunicationsController : BaseController
{
    private readonly IMstCommunicationApplicationService _appService;
    private readonly ICommunicationService _commService;

    public CommunicationsController(IMstCommunicationApplicationService appService, ICommunicationService commService)
    {
        _appService = appService;
        _commService = commService;
    }

    [HttpPost("email")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Communications", "Create")]
    public async Task<ActionResult<ApiResponse<CommunicationDetailDto>>> LogEmail([FromBody] LogEmailDto dto)
    {
        return CreatedResponse(await _appService.LogEmailAsync(dto));
    }

    [HttpPost("call")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Communications", "Create")]
    public async Task<ActionResult<ApiResponse<CommunicationDetailDto>>> LogCall([FromBody] LogCallDto dto)
    {
        return CreatedResponse(await _appService.LogCallAsync(dto));
    }

    [HttpPost("sms")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Communications", "Create")]
    public async Task<ActionResult<ApiResponse<CommunicationDetailDto>>> LogSms([FromBody] LogSmsDto dto)
    {
        return CreatedResponse(await _appService.LogSmsAsync(dto));
    }

    [HttpPost("whatsapp")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Communications", "Create")]
    public async Task<ActionResult<ApiResponse<CommunicationDetailDto>>> LogWhatsApp([FromBody] LogWhatsAppDto dto)
    {
        return CreatedResponse(await _appService.LogWhatsAppAsync(dto));
    }

    [HttpGet("leads/{leadId:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<CommunicationListDto>>>> GetLeadTimeline(Guid leadId, [FromQuery] PagedRequestDto paging)
    {
        return OkResponse(await _appService.GetLeadTimelineAsync(leadId, paging));
    }

    [HttpGet]
    [RequireTenantId]
    [AuthorizePermission("CRM_Communications", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<CommunicationListDto>>>> GetAll([FromQuery] CommunicationFilterParams filter)
    {
        return OkResponse(await _appService.GetCommunicationsAsync(filter));
    }

    [HttpGet("{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Communications", "View")]
    public async Task<ActionResult<ApiResponse<CommunicationDetailDto>>> GetById(Guid id)
    {
        return OkResponse(await _appService.GetByIdAsync(id));
    }

    [HttpGet("track/open/{trackingPixelGuid:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackOpen(Guid trackingPixelGuid)
    {
        await _commService.TrackEmailOpenAsync(trackingPixelGuid);
        var pixel = Convert.FromBase64String("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
        return File(pixel, "image/gif");
    }

    [HttpGet("track/click/{communicationGuid:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackClick(Guid communicationGuid, [FromQuery] string url)
    {
        await _commService.IncrementClickCountAsync(communicationGuid);
        return Redirect(url ?? "/");
    }
}
