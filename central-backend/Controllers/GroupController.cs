using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.Group;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "SuperAdminOnly")]
public class GroupController : BaseDeletionController<Models.Entities.MstGroup>
{
    private readonly IGroupService _groupService;

    public GroupController(
        IGroupService groupService,
        IDeleteValidationService deleteValidationService,
        Microsoft.Extensions.Logging.ILogger<BaseDeletionController<Models.Entities.MstGroup>> logger)
        : base(deleteValidationService, logger)
    {
        _groupService = groupService ?? throw new ArgumentNullException(nameof(groupService));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResponse<GroupResponseDto>>>> GetGroups(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool ascending = true,
        [FromQuery] string? search = null)
    {
        if (pageNumber < 1 || pageSize < 1)
            return BadRequest(ApiResponse<PagedResponse<GroupResponseDto>>.Fail(400, "Page number and page size must be greater than 0"));

        var groups = await _groupService.GetAllGroupsAsync(pageNumber, pageSize, sortBy, ascending, search);
        return Ok(new
        {
            statusCode = 200,
            message = "Groups retrieved successfully",
            data = new
            {
                items = groups.Items,
                totalCount = groups.TotalCount,
                pageNumber = groups.PageNumber,
                pageSize = groups.PageSize,
                totalPages = groups.TotalPages,
                hasPrevious = groups.HasPrevious,
                hasNext = groups.HasNext
            }
        });
    }

    [HttpGet("{guid}")]
    public async Task<ActionResult<ApiResponse<GroupResponseDto>>> GetGroup(Guid guid)
    {
        var group = await _groupService.GetGroupByIdAsync(guid);
        if (group == null)
            return NotFound(ApiResponse<GroupResponseDto>.Fail(404, $"Group with GUID {guid} not found"));

        return Ok(ApiResponse<GroupResponseDto>.Success(group, "Group retrieved successfully"));
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<GroupResponseDto>>> CreateGroup([FromForm] GroupCreateDto groupDto)
    {
        var userGuid = User.FindFirst("strUserGUID")?.Value;
        if (string.IsNullOrEmpty(userGuid))
        {
            return BadRequest(ApiResponse<GroupResponseDto>.Fail(400, "User identifier not found"));
        }
        
        try 
        {
            var createdGroup = await _groupService.CreateGroupAsync(groupDto, userGuid);
            var response = ApiResponse<GroupResponseDto>.Success(createdGroup, "Group created successfully");
            return CreatedAtAction(nameof(GetGroup), new { guid = createdGroup.strGroupGUID }, response);
        }
        catch (BusinessException ex) 
        {
            // Handle duplicate group name or other business validation errors
            return BadRequest(ApiResponse<GroupResponseDto>.Fail(400, ex.Message, ex.ErrorCode));
        }
        catch (Exception ex)
        {
            // Handle other unexpected errors
            return StatusCode(500, ApiResponse<GroupResponseDto>.Fail(500, $"An error occurred while creating the group: {ex.Message}"));
        }
    }

    [HttpPut("{guid}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<GroupResponseDto>>> UpdateGroup(Guid guid, [FromForm] GroupUpdateDto groupDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<GroupResponseDto>.Fail(400, "Invalid request data"));

        try
        {
            var group = await _groupService.UpdateGroupAsync(guid, groupDto);
            if (group == null)
                return NotFound(ApiResponse<GroupResponseDto>.Fail(404, $"Group with GUID {guid} not found"));

            return Ok(ApiResponse<GroupResponseDto>.Success(group, "Group updated successfully"));
        }
        catch (BusinessException ex) 
        {
            // Handle duplicate group name or other business validation errors
            return BadRequest(ApiResponse<GroupResponseDto>.Fail(400, ex.Message, ex.ErrorCode));
        }
        catch (Exception ex)
        {
            // Handle other unexpected errors
            return StatusCode(500, ApiResponse<GroupResponseDto>.Fail(500, $"An error occurred while updating the group: {ex.Message}"));
        }
    }

    [HttpDelete("{guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteGroup(Guid guid)
    {
        _logger.LogInformation($"DELETE REQUEST: Processing delete for Group with GUID {guid}");
            
        try 
        {
            // Use SafeDeleteAsync to validate and perform the deletion
            _logger.LogInformation($"Validating and deleting Group with GUID {guid}");
            return await SafeDeleteAsync(
                guid,
                "Group",
                async (id) => {
                    _logger.LogInformation($"Executing actual delete operation for Group with GUID {id}");
                    return await _groupService.DeleteGroupAsync(id);
                });
        }
        catch (BusinessException ex)
        {
            _logger.LogWarning(ex, $"Business validation failed in DeleteGroup with GUID {guid}");
            return BadRequest(ApiResponse<bool>.Fail(400, $"{ex.Message}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Unexpected error in DeleteGroup with GUID {guid}");
            return StatusCode(500, ApiResponse<bool>.Fail(500, $"An error occurred during delete: {ex.Message}"));
        }
    }

    [HttpGet("export")]
    [Authorize(Policy = "SuperAdminOnly")]
    public async Task<IActionResult> ExportGroups([FromQuery] string format)
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

            var (fileContents, contentType, fileName) = await _groupService.ExportGroupsAsync(format);

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
            _logger.LogError(ex, "Error occurred during group export");
            return StatusCode(500, new ApiResponse<object> 
            { 
                statusCode = 500, 
                Message = "An error occurred while processing your request."
            });
        }
    }
} 