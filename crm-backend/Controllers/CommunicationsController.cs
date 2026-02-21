using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.DTOs.Common;
using crm_backend.Interfaces;
using crm_backend.Models.Wrappers;
using System.Net.Mail;

namespace crm_backend.Controllers;

[Route("api/crm/communications")]
public class CommunicationsController : BaseController
{
    private readonly IMstCommunicationApplicationService _appService;
    private readonly ICommunicationService _commService;
    private readonly IEmailNotificationService _emailNotificationService;
    private readonly ILogger<CommunicationsController> _logger;

    public CommunicationsController(
        IMstCommunicationApplicationService appService,
        ICommunicationService commService,
        IEmailNotificationService emailNotificationService,
        ILogger<CommunicationsController> logger)
    {
        _appService = appService;
        _commService = commService;
        _emailNotificationService = emailNotificationService;
        _logger = logger;
    }

    [HttpPost("email")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Communications", "Create")]
    public async Task<ActionResult<ApiResponse<CommunicationDetailDto>>> LogEmail([FromBody] LogEmailDto dto)
    {
        return CreatedResponse(await _appService.LogEmailAsync(dto));
    }

    [HttpPost("bulk-email")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Communications", "Create")]
    public async Task<ActionResult<ApiResponse<int>>> SendBulkEmail([FromBody] BulkCustomEmailRequestDto dto)
    {
        if (dto == null)
            return ErrorResponse<int>(400, "Request body is required");

        if (string.IsNullOrWhiteSpace(dto.Subject))
            return ErrorResponse<int>(400, "Email subject is required");

        if (string.IsNullOrWhiteSpace(dto.Body))
            return ErrorResponse<int>(400, "Email body is required");

        var recipients = (dto.Recipients ?? new List<string>())
            .Select(e => e?.Trim())
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (recipients.Count == 0)
            return ErrorResponse<int>(400, "At least one recipient email is required");

        var validRecipients = new List<string>();
        foreach (var recipient in recipients)
        {
            try
            {
                _ = new MailAddress(recipient!);
                validRecipients.Add(recipient!);
            }
            catch
            {
                // skip invalid emails
            }
        }

        if (validRecipients.Count == 0)
            return ErrorResponse<int>(400, "No valid recipient email addresses found");

        var emails = validRecipients.Select(email => new EmailDto
        {
            ToEmail = email,
            ToName = email.Split('@')[0],
            Subject = dto.Subject,
            Body = dto.Body,
            IsHtml = dto.IsHtml
        }).ToList();

        // Queue in-memory and return immediately for low-latency API response.
        await _emailNotificationService.SendBulkCustomEmailsAsync(emails);
        _logger.LogInformation(
            "Queued {Count} custom emails for async dispatch via /api/crm/communications/bulk-email",
            emails.Count);

        return OkResponse(emails.Count, $"Queued {emails.Count} emails for sending");
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
