using AuditSoftware.Attributes;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Schedule;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using AuditSoftware.Helpers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuditSoftware.Controllers
{
    [Authorize] // Changed from SuperAdminOnly to general authorization
    [ApiController]
    [Route("api/[controller]")]
    public class ScheduleController : BaseDeletionController<MstSchedule>
    {
        private readonly IScheduleService _scheduleService;
        private new readonly ILogger<ScheduleController> _logger;

        public ScheduleController(
            IScheduleService scheduleService,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<MstSchedule>> baseLogger,
            ILogger<ScheduleController> logger)
            : base(deleteValidationService, baseLogger)
        {
            _scheduleService = scheduleService ?? throw new ArgumentNullException(nameof(scheduleService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Create([FromBody] ScheduleCreateDto createDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(createdByGUID))
                    return Unauthorized(new ApiResponse<object>
                    {
                        statusCode = 401,
                        Message = "Required claims not found in token"
                    });

                // For super admin users, groupGUID can be empty
                groupGUID = groupGUID ?? string.Empty;

                var response = await _scheduleService.CreateAsync(createDto, createdByGUID, groupGUID);
                
                return CreatedAtAction(nameof(GetById), new { guid = response.strScheduleGUID }, new ApiResponse<ScheduleResponseDto>
                {
                    statusCode = 201,
                    Message = "Schedule created successfully",
                    Data = response
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating schedule");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while creating the schedule"
                });
            }
        }

        [HttpGet]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] bool? bolIsActive = null,
            [FromQuery] bool? bolIsEditable = null,
            [FromQuery(Name = "strParentScheduleGUIDs")] string? ParentScheduleGUIDs = null,
            [FromQuery(Name = "strDefaultAccountTypeGUIDs")] string? DefaultAccountTypeGUIDs = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true)
        {
            try
            {
                // Super admin doesn't belong to any group, so we don't need group GUID check
                // For consistency, we still pass empty group GUID to service
                var groupGUID = User.FindFirst("strGroupGUID")?.Value ?? string.Empty;
                
                var filterDto = new ScheduleFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    Search = search,
                    bolIsActive = bolIsActive,
                    bolIsEditable = bolIsEditable,
                    ParentScheduleGUIDs = ParentScheduleGUIDs,
                    DefaultAccountTypeGUIDs = DefaultAccountTypeGUIDs,
                    SortBy = sortBy,
                    ascending = ascending
                };

                var result = await _scheduleService.GetAllAsync(filterDto, groupGUID);
                
                return Ok(new
                {
                    statusCode = 200,
                    message = "Schedules retrieved successfully",
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
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving schedules");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving schedules"
                });
            }
        }

        [HttpGet("{guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var response = await _scheduleService.GetByIdAsync(guid);
                
                return Ok(new ApiResponse<ScheduleResponseDto>
                {
                    statusCode = 200,
                    Message = "Schedule retrieved successfully",
                    Data = response
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while retrieving schedule with GUID {guid}");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving the schedule"
                });
            }
        }

        [HttpPut("{guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Update(string guid, [FromBody] ScheduleUpdateDto updateDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(updatedByGUID))
                    return Unauthorized(new ApiResponse<object>
                    {
                        statusCode = 401,
                        Message = "Required claims not found in token"
                    });

                // For super admin users, groupGUID can be empty
                groupGUID = groupGUID ?? string.Empty;

                var response = await _scheduleService.UpdateAsync(guid, updateDto, updatedByGUID, groupGUID);
                
                return Ok(new ApiResponse<ScheduleResponseDto>
                {
                    statusCode = 200,
                    Message = "Schedule updated successfully",
                    Data = response
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error occurred while updating schedule with GUID {guid}");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while updating the schedule"
                });
            }
        }

        [HttpDelete("{guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                // Use SafeDeleteAsync to validate and perform the deletion
                _logger.LogInformation($"Validating and deleting Schedule with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "Schedule",
                    async (id) => await _scheduleService.DeleteAsync(id.ToString()));
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
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> GetActiveSchedules([FromQuery] string? search = null)
        {
            try
            {
                // Super admin doesn't belong to any group, so we don't need group GUID check
                // For consistency, we still pass empty group GUID to service
                var groupGUID = User.FindFirst("strGroupGUID")?.Value ?? string.Empty;

                var result = await _scheduleService.GetActiveSchedulesAsync(search, groupGUID);
                
                return Ok(new ApiResponse<List<ScheduleSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active schedules retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving active schedules");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving active schedules"
                });
            }
        }

        [HttpGet("export")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ExportSchedules([FromQuery] string format)
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

                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(groupGUID))
                    return Unauthorized(new ApiResponse<object>
                    {
                        statusCode = 401,
                        Message = "Group GUID not found in token"
                    });

                var (fileContents, contentType, fileName) = await _scheduleService.ExportSchedulesAsync(format, groupGUID);

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
                _logger.LogError(ex, "Error occurred during schedule export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }

        [HttpPost("import")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ImportSchedules(IFormFile file)
        {
            try
            {
                // Validate file
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "No file was uploaded"
                    });
                }

                string extension = Path.GetExtension(file.FileName).ToLower();
                if (extension != ".xlsx" && extension != ".xls")
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Only Excel files (.xlsx or .xls) are supported"
                    });
                }

                var userGUID = User.FindFirst("strUserGUID")?.Value;
                
                // Log available claims for debugging
                _logger.LogInformation("Import schedule - Available claims:");
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
                }

                // For Super Admin, we only check userGUID, not groupGUID
                if (string.IsNullOrEmpty(userGUID))
                {
                    _logger.LogWarning($"Import schedule - Missing required user claim. userGUID: {(userGUID == null ? "null" : "present")}");
                    return Unauthorized(new ApiResponse<object>
                    {
                        statusCode = 401,
                        Message = "User GUID not found in token"
                    });
                }
                
                // Get groupGUID if available, but it's optional for Super Admin
                var groupGUID = User.FindFirst("strGroupGUID")?.Value ?? "00000000-0000-0000-0000-000000000000";
                _logger.LogInformation($"Import schedule - Using groupGUID: {groupGUID}");

                var result = await _scheduleService.ImportSchedulesAsync(file, userGUID, groupGUID);

                return Ok(new ApiResponse<ImportScheduleResultDto>
                {
                    statusCode = 200,
                    Message = "Import completed",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during schedule import");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while processing your request."
                });
            }
        }

        [HttpGet("tree/active")]
        [Authorize] // Just requires authentication, no specific policy
        public async Task<IActionResult> GetActiveScheduleTree()
        {
            try
            {
                // Super admin doesn't belong to any group, so we don't need group GUID check
                // For consistency, we still pass empty group GUID to service
                var groupGUID = User.FindFirst("strGroupGUID")?.Value ?? string.Empty;

                var result = await _scheduleService.GetActiveScheduleTreeAsync(groupGUID);
                
                return Ok(new ApiResponse<List<ScheduleTreeDto>>
                {
                    statusCode = 200,
                    Message = "Active schedule tree retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving active schedule tree");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving the active schedule tree"
                });
            }
        }

        [HttpGet("export/pdf")]
        [Authorize]
        public async Task<IActionResult> PrintActiveScheduleTree()
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value ?? string.Empty;

                var (fileContents, contentType, fileName) = await _scheduleService.ExportActiveScheduleTreeToPdfAsync(groupGUID);

                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating schedule PDF");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while generating the schedule PDF"
                });
            }
        }

        [HttpGet("export/excel")]
        [Authorize]
        public async Task<IActionResult> ExportActiveScheduleTreeToExcel()
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value ?? string.Empty;

                var (fileContents, contentType, fileName) = await _scheduleService.ExportActiveScheduleTreeToExcelAsync(groupGUID);

                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while generating schedule Excel");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while generating the schedule Excel"
                });
            }
        }
    }
}
