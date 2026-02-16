using AuditSoftware.Attributes;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.RenameSchedule;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RenameScheduleController : ControllerBase
    {
        private readonly IRenameScheduleService _renameScheduleService;
        private readonly ILogger<RenameScheduleController> _logger;

        public RenameScheduleController(
            IRenameScheduleService renameScheduleService,
            ILogger<RenameScheduleController> logger)
        {
            _renameScheduleService = renameScheduleService ?? throw new ArgumentNullException(nameof(renameScheduleService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost("upsert")]
        [AuthorizePermission("chart_of_account", PermissionType.CanSave, "RenameSchedule")]
        public async Task<IActionResult> Upsert([FromBody] RenameScheduleUpsertDto upsertDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var userGUID = User.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(userGUID))
                    return Unauthorized(new ApiResponse<object>
                    {
                        statusCode = 401,
                        Message = "Required claims not found in token"
                    });

                // For super admin users, groupGUID can be empty
                groupGUID = groupGUID ?? string.Empty;

                var result = await _renameScheduleService.UpsertAsync(upsertDto, userGUID, groupGUID);
                
                var isCreate = upsertDto.strRenameScheduleGUID == Guid.Empty;
                var statusCode = isCreate ? 201 : 200;
                var message = isCreate ? "Chart of Account created successfully" : "Chart of Account updated successfully";

                return Ok(new ApiResponse<RenameScheduleResponseDto>
                {
                    statusCode = statusCode,
                    Message = message,
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning($"Business validation error: {ex.Message}");
                if (ex.Message.Contains("not found"))
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = ex.Message
                    });
                }
                
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating/updating Chart of Account: {ex.Message}");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while processing the Chart of Account"
                });
            }
        }

        [HttpGet]
        [AuthorizePermission("chart_of_account", PermissionType.CanView, "RenameSchedule")]
        public async Task<IActionResult> GetAll([FromQuery] RenameScheduleFilterDto filterDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value ?? string.Empty;

                var result = await _renameScheduleService.GetAllAsync(filterDto, groupGUID);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Chart of Accounts retrieved successfully",
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
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving Chart of Accounts: {ex.Message}");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving the Chart of Accounts"
                });
            }
        }

        [HttpGet("{guid}")]
        [AuthorizePermission("chart_of_account", PermissionType.CanView, "RenameSchedule")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var result = await _renameScheduleService.GetByIdAsync(guid);

                return Ok(new ApiResponse<RenameScheduleResponseDto>
                {
                    statusCode = 200,
                    Message = "Chart of Account retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning($"Business validation error: {ex.Message}");
                if (ex.Message.Contains("not found"))
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = ex.Message
                    });
                }
                
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving Chart of Account: {ex.Message}");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving the Chart of Account"
                });
            }
        }

        [HttpPut("{guid}")]
        [AuthorizePermission("chart_of_account", PermissionType.CanEdit, "RenameSchedule")]
        public async Task<IActionResult> Update(string guid, [FromBody] RenameScheduleUpdateDto updateDto)
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

                var result = await _renameScheduleService.UpdateAsync(guid, updateDto, updatedByGUID, groupGUID);

                return Ok(new ApiResponse<RenameScheduleResponseDto>
                {
                    statusCode = 200,
                    Message = "Chart of Account updated successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning($"Business validation error: {ex.Message}");
                if (ex.Message.Contains("not found"))
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = ex.Message
                    });
                }
                
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating Chart of Account: {ex.Message}");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while updating the Chart of Account"
                });
            }
        }

        [HttpDelete("{guid}")]
        [AuthorizePermission("chart_of_account", PermissionType.CanDelete, "RenameSchedule")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                var currentUserGuid = User.GetUserGuid();
                await _renameScheduleService.DeleteAsync(guid, currentUserGuid);

                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Chart of Account deleted successfully"
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning($"Business validation error: {ex.Message}");
                if (ex.Message.Contains("not found"))
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = ex.Message
                    });
                }
                
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting Chart of Account: {ex.Message}");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while deleting the Chart of Account"
                });
            }
        }
    }
}