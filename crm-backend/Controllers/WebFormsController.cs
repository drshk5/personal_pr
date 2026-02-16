using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.Constants;
using crm_backend.DTOs.Common;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/web-forms")]
public class WebFormsController : BaseController
{
    private readonly IMstWebFormApplicationService _webFormAppService;
    private readonly ILogger<WebFormsController> _logger;

    public WebFormsController(
        IMstWebFormApplicationService webFormAppService,
        ILogger<WebFormsController> logger)
    {
        _webFormAppService = webFormAppService;
        _logger = logger;
    }

    /// <summary>
    /// List web forms (paged, filtered)
    /// </summary>
    [HttpGet]
    [RequireTenantId]
    [AuthorizePermission("CRM_WebForms", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<WebFormListDto>>>> GetForms(
        [FromQuery] WebFormFilterParams filter)
    {
        var result = await _webFormAppService.GetFormsAsync(filter);
        return OkResponse(result);
    }

    /// <summary>
    /// Create a new web form
    /// </summary>
    [HttpPost]
    [RequireTenantId]
    [AuthorizePermission("CRM_WebForms", "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<WebFormDetailDto>>> CreateForm(
        [FromBody] CreateWebFormDto dto)
    {
        var result = await _webFormAppService.CreateFormAsync(dto);
        return CreatedResponse(result);
    }

    /// <summary>
    /// Get web form detail by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_WebForms", "View")]
    public async Task<ActionResult<ApiResponse<WebFormDetailDto>>> GetForm(Guid id)
    {
        var result = await _webFormAppService.GetFormByIdAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Update an existing web form
    /// </summary>
    [HttpPut("{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_WebForms", "Edit")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<WebFormDetailDto>>> UpdateForm(
        Guid id, [FromBody] UpdateWebFormDto dto)
    {
        var result = await _webFormAppService.UpdateFormAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Soft delete a web form
    /// </summary>
    [HttpDelete("{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_WebForms", "Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteForm(Guid id)
    {
        var result = await _webFormAppService.DeleteFormAsync(id);
        return OkResponse(result, "Web form deleted successfully");
    }

    /// <summary>
    /// Get embed code (HTML snippet) for a web form
    /// </summary>
    [HttpGet("{id:guid}/embed-code")]
    [RequireTenantId]
    [AuthorizePermission("CRM_WebForms", "View")]
    public async Task<ActionResult<ApiResponse<WebFormEmbedCodeDto>>> GetEmbedCode(Guid id)
    {
        var result = await _webFormAppService.GetEmbedCodeAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Public endpoint for web form submission (anonymous access)
    /// </summary>
    [HttpPost("{formId:guid}/submit")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<WebFormSubmissionListDto>>> SubmitForm(
        Guid formId, [FromBody] WebFormSubmitDto dto)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _webFormAppService.SubmitFormAsync(formId, dto, ipAddress, userAgent);
        return CreatedResponse(result, "Form submitted successfully");
    }

    /// <summary>
    /// List submissions for a web form (paged)
    /// </summary>
    [HttpGet("{formId:guid}/submissions")]
    [RequireTenantId]
    [AuthorizePermission("CRM_WebForms", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<WebFormSubmissionListDto>>>> GetSubmissions(
        Guid formId, [FromQuery] PagedRequestDto paging)
    {
        var result = await _webFormAppService.GetSubmissionsAsync(formId, paging);
        return OkResponse(result);
    }
}
