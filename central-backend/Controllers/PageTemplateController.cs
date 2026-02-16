using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using AuditSoftware.DTOs.PageTemplate;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Models.Entities;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize(Policy = "SuperAdminOnly")]
    [ApiController]
    [Route("api/[controller]")]
    public class PageTemplateController : BaseDeletionController<MstPageTemplate>
    {
        private readonly IPageTemplateService _pageTemplateService;

        public PageTemplateController(
            IPageTemplateService pageTemplateService,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<MstPageTemplate>> logger)
            : base(deleteValidationService, logger)
        {
            _pageTemplateService = pageTemplateService ?? throw new ArgumentNullException(nameof(pageTemplateService));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PageTemplateCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _pageTemplateService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<PageTemplateResponseDto>
                {
                    statusCode = 200,
                    Message = "Page template created successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll([FromQuery] PageTemplateFilterDto filterDto)
        {
            try
            {
                var result = await _pageTemplateService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Page templates retrieved successfully",
                    data = new
                    {
                        items = result.Items,
                        totalCount = result.TotalCount,
                        pageNumber = result.PageNumber,
                        pageSize = result.PageSize,
                        totalPages = result.TotalPages,
                        hasPrevious = result.HasPrevious,
                        hasNext = result.HasNext
                    }
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("{guid}")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var result = await _pageTemplateService.GetByIdAsync(guid);
                return Ok(new ApiResponse<PageTemplateResponseDto>
                {
                    statusCode = 200,
                    Message = "Page template retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpPut("{guid}")]
        public async Task<IActionResult> Update(string guid, [FromBody] PageTemplateUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _pageTemplateService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<PageTemplateResponseDto>
                {
                    statusCode = 200,
                    Message = "Page template updated successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpDelete("{guid}")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                // Use SafeDeleteAsync to validate and perform the deletion
                _logger.LogInformation($"Validating and deleting Page Template with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "Page Template",
                    async (id) => await _pageTemplateService.DeleteAsync(id.ToString()));
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, $"Business validation failed in Delete with GUID {guid}");
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error in Delete with GUID {guid}");
                return StatusCode(500, new ApiResponse<object> { statusCode = 500, Message = $"An error occurred during delete: {ex.Message}" });
            }
        }

        [HttpGet("active")]
        [Authorize]
        public async Task<IActionResult> GetActivePageTemplates([FromQuery] string? search = null)
        {
            try
            {
                var result = await _pageTemplateService.GetActivePageTemplatesAsync(search);
                
                return Ok(new ApiResponse<List<PageTemplateSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active page templates retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("export")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ExportPageTemplates([FromQuery] string format)
        {
            try
            {
                if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
                {
                    return BadRequest(new ApiResponse<object> 
                    { 
                        statusCode = 400, 
                        Message = "Invalid format specified. Supported formats are 'excel' and 'csv'."
                    });
                }

                var (fileContents, contentType, fileName) = await _pageTemplateService.ExportPageTemplatesAsync(format);

                // Set appropriate headers for file download
                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                
                // Return the file
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception
                _logger.LogError(ex, "Error occurred during page template export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
