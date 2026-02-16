using Microsoft.AspNetCore.Mvc;
using crm_backend.ApplicationServices.Interfaces;
using crm_backend.Attributes;
using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.Controllers;

[Route("api/crm/leads")]
public class ImportExportController : BaseController
{
    private readonly IMstImportExportApplicationService _appService;
    private readonly ILogger<ImportExportController> _logger;

    public ImportExportController(
        IMstImportExportApplicationService appService,
        ILogger<ImportExportController> logger)
    {
        _appService = appService;
        _logger = logger;
    }

    /// <summary>
    /// Import leads from a CSV file
    /// </summary>
    [HttpPost("import")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "Create")]
    public async Task<ActionResult<ApiResponse<ImportJobListDto>>> ImportLeads(
        IFormFile file,
        [FromForm] string strDuplicateHandling,
        [FromForm] string columnMappingJson)
    {
        if (file == null || file.Length == 0)
            return ErrorResponse<ImportJobListDto>(400, "CSV file is required");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return ErrorResponse<ImportJobListDto>(400, "Only CSV files are allowed");

        var settings = new ImportStartDto
        {
            strDuplicateHandling = strDuplicateHandling ?? "Skip",
            ColumnMapping = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(
                columnMappingJson ?? "{}") ?? new Dictionary<string, string>()
        };

        if (settings.ColumnMapping.Count == 0)
            return ErrorResponse<ImportJobListDto>(400, "Column mapping is required");

        using var stream = file.OpenReadStream();
        var result = await _appService.StartImportAsync(stream, file.FileName, settings);

        return CreatedResponse(result, "Import started successfully");
    }

    /// <summary>
    /// Suggest column mapping for a CSV file
    /// </summary>
    [HttpPost("import/suggest-mapping")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<ImportSuggestMappingResultDto>>> SuggestMapping(
        IFormFile file)
    {
        if (file == null || file.Length == 0)
            return ErrorResponse<ImportSuggestMappingResultDto>(400, "CSV file is required");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return ErrorResponse<ImportSuggestMappingResultDto>(400, "Only CSV files are allowed");

        using var stream = file.OpenReadStream();
        var result = await _appService.SuggestMappingAsync(stream);

        return OkResponse(result);
    }

    /// <summary>
    /// List import jobs (paged)
    /// </summary>
    [HttpGet("import/jobs")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<PagedResponse<ImportJobListDto>>>> GetImportJobs(
        [FromQuery] ImportJobFilterParams filter)
    {
        var result = await _appService.GetImportJobsAsync(filter);
        return OkResponse(result);
    }

    /// <summary>
    /// Get import job detail with errors
    /// </summary>
    [HttpGet("import/jobs/{id:guid}")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<ActionResult<ApiResponse<ImportJobDetailDto>>> GetImportJob(Guid id)
    {
        var result = await _appService.GetImportJobByIdAsync(id);
        return OkResponse(result);
    }

    /// <summary>
    /// Export leads to CSV
    /// </summary>
    [HttpPost("export")]
    [RequireTenantId]
    [AuthorizePermission("CRM_Leads", "View")]
    public async Task<IActionResult> ExportLeads([FromBody] ExportRequestDto filter)
    {
        var bytes = await _appService.ExportLeadsAsync(filter);
        return File(bytes, "text/csv", $"leads-export-{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
