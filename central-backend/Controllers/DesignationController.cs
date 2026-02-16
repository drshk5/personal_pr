using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.Attributes;
using AuditSoftware.DTOs.Designation;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using System.Linq;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DesignationController : BaseDeletionController<Models.Entities.MstDesignation>
    {
        private readonly IDesignationService _designationService;

        public DesignationController(
            IDesignationService designationService,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<Models.Entities.MstDesignation>> logger)
            : base(deleteValidationService, logger)
        {
            _designationService = designationService ?? throw new ArgumentNullException(nameof(designationService));
        }

        [HttpPost]
        [AuthorizePermission("designation", PermissionType.CanSave, "Designation")]
        public async Task<IActionResult> Create([FromBody] DesignationCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                if (string.IsNullOrEmpty(groupGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "Group GUID not found in token" });

                var result = await _designationService.CreateAsync(createDto, createdByGUID, groupGUID);
                return Ok(new ApiResponse<DesignationResponseDto>
                {
                    statusCode = 200,
                    Message = "Designation created successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet]
        [AuthorizePermission("designation", PermissionType.CanView, "Designation")]
        public async Task<IActionResult> GetAll([FromQuery] DesignationFilterDto filterDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                filterDto.strGroupGUID = groupGUID;
                var result = await _designationService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Designations retrieved successfully",
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
        [AuthorizePermission("designation", PermissionType.CanView, "Designation")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var result = await _designationService.GetByIdAsync(guid);
                return Ok(new ApiResponse<DesignationResponseDto>
                {
                    statusCode = 200,
                    Message = "Designation retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpPut("{guid}")]
        [AuthorizePermission("designation", PermissionType.CanEdit, "Designation")]
        public async Task<IActionResult> Update(string guid, [FromBody] DesignationUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;

                if (string.IsNullOrEmpty(updatedByGUID) || string.IsNullOrEmpty(groupGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "Required claims not found in token" });

                var result = await _designationService.UpdateAsync(guid, updateDto, updatedByGUID, groupGUID);
                return Ok(new ApiResponse<DesignationResponseDto>
                {
                    statusCode = 200,
                    Message = "Designation updated successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpDelete("{guid}")]
        [AuthorizePermission("designation", PermissionType.CanDelete, "Designation")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                // Use SafeDeleteAsync to validate and perform the deletion
                _logger.LogInformation($"Validating and deleting Designation with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "Designation",
                    async (id) => await _designationService.DeleteAsync(id.ToString()));
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, $"Business validation failed in Delete with GUID {guid}");
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveDesignations([FromQuery] string? search = null)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var result = await _designationService.GetActiveDesignationsAsync(search!, groupGUID);
                return Ok(new ApiResponse<List<DesignationSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active designations retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("export")]
        [AuthorizePermission("designation", PermissionType.CanExport, "Designation")]
        public async Task<IActionResult> ExportDesignations([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _designationService.ExportDesignationsAsync(format);

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
                _logger.LogError(ex, "Error occurred during designation export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
