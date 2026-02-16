using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.Constants;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/pipelines")]
[RequireTenantId]
public class PipelinesController : BaseController
{
    private readonly IMstPipelineApplicationService _pipelineAppService;
    private readonly ILogger<PipelinesController> _logger;

    public PipelinesController(
        IMstPipelineApplicationService pipelineAppService,
        ILogger<PipelinesController> logger)
    {
        _pipelineAppService = pipelineAppService;
        _logger = logger;
    }

    /// <summary>
    /// List all pipelines (with stage count and opportunity count)
    /// </summary>
    [HttpGet]
    [AuthorizePermission("CRM_Pipelines", "View")]
    public async Task<ActionResult<ApiResponse<List<PipelineListDto>>>> GetPipelines()
    {
        var result = await _pipelineAppService.GetPipelinesAsync();
        return OkResponse(result);
    }

    /// <summary>
    /// Get pipeline detail by ID (with all stages)
    /// </summary>
    [HttpGet("{id:guid}")]
    [AuthorizePermission("CRM_Pipelines", "View")]
    public async Task<ActionResult<ApiResponse<PipelineDetailDto>>> GetPipeline(Guid id)
    {
        var result = await _pipelineAppService.GetPipelineByIdAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Create a new pipeline with stages
    /// </summary>
    [HttpPost]
    [AuthorizePermission("CRM_Pipelines", "Create")]
    [AuditLog(EntityTypeConstants.Pipeline, "Create")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<PipelineDetailDto>>> CreatePipeline(
        [FromBody] CreatePipelineDto dto)
    {
        var result = await _pipelineAppService.CreatePipelineAsync(dto);
        return CreatedResponse(result);
    }

    /// <summary>
    /// Update an existing pipeline and its stages
    /// </summary>
    [HttpPut("{id:guid}")]
    [AuthorizePermission("CRM_Pipelines", "Edit")]
    [AuditLog(EntityTypeConstants.Pipeline, "Update")]
    [TrimStrings]
    public async Task<ActionResult<ApiResponse<PipelineDetailDto>>> UpdatePipeline(
        Guid id, [FromBody] CreatePipelineDto dto)
    {
        var result = await _pipelineAppService.UpdatePipelineAsync(id, dto);
        return OkResponse(result);
    }

    /// <summary>
    /// Soft delete a pipeline (only if no opportunities)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [AuthorizePermission("CRM_Pipelines", "Delete")]
    [AuditLog(EntityTypeConstants.Pipeline, "Delete")]
    public async Task<ActionResult<ApiResponse<bool>>> DeletePipeline(Guid id)
    {
        var result = await _pipelineAppService.DeletePipelineAsync(id);
        return OkResponse(result, "Pipeline deleted successfully");
    }

    /// <summary>
    /// Set a pipeline as the default pipeline
    /// </summary>
    [HttpPost("{id:guid}/set-default")]
    [AuthorizePermission("CRM_Pipelines", "Edit")]
    [AuditLog(EntityTypeConstants.Pipeline, "SetDefault")]
    public async Task<ActionResult<ApiResponse<PipelineDetailDto>>> SetDefaultPipeline(Guid id)
    {
        var result = await _pipelineAppService.SetDefaultPipelineAsync(id);
        return OkResponse(result, "Pipeline set as default successfully");
    }
}
