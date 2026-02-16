using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.UserRole;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Attributes;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserRoleController : BaseDeletionController<Models.Entities.MstUserRole>
{
    private readonly IUserRoleService _userRoleService;
    private new readonly ILogger<UserRoleController> _logger;

    public UserRoleController(
        IUserRoleService userRoleService,
        IDeleteValidationService deleteValidationService,
        Microsoft.Extensions.Logging.ILogger<BaseDeletionController<Models.Entities.MstUserRole>> baseLogger,
        ILogger<UserRoleController> logger)
        : base(deleteValidationService, baseLogger)
    {
        _userRoleService = userRoleService ?? throw new ArgumentNullException(nameof(userRoleService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    [HttpGet]
            [AuthorizePermission("user_role_list", PermissionType.CanView, "UserRole")]
    public async Task<IActionResult> GetUserRoles(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? sortBy = null,
        [FromQuery] bool ascending = true,
        [FromQuery] string? search = null,
        [FromQuery] bool? bolIsActive = null,
        [FromQuery] string? strCreatedByGUIDs = null,
        [FromQuery] string? strUpdatedByGUIDs = null)
    {
        try
        {
            if (pageNumber < 1 || pageSize < 1)
            {
                return BadRequest(new 
                { 
                    statusCode = 400, 
                    message = "Page number and page size must be greater than 0" 
                });
            }

            var groupGuidStr = User.FindFirst("strGroupGUID")?.Value;
            if (string.IsNullOrEmpty(groupGuidStr) || !Guid.TryParse(groupGuidStr, out var groupGuid))
            {
                return BadRequest(new 
                { 
                    statusCode = 400, 
                    message = "Invalid group identifier in token" 
                });
            }

            var strModuleGUID = User.FindFirst("strModuleGUID")?.Value;
            if (string.IsNullOrEmpty(strModuleGUID))
            {
                _logger.LogWarning("Module identifier not found in token");
            }

            var roles = await _userRoleService.GetAllUserRolesAsync(
                pageNumber, 
                pageSize, 
                sortBy, 
                !ascending, // Invert the ascending parameter because service expects isDescending
                search, 
                groupGuid,
                !string.IsNullOrEmpty(strModuleGUID) ? strModuleGUID : null,
                bolIsActive,
                strCreatedByGUIDs,
                strUpdatedByGUIDs);
                
            return Ok(new
            {
                statusCode = 200,
                message = "User roles retrieved successfully",
                data = new
                {
                    items = roles.Items,
                    totalCount = roles.TotalCount,
                    pageNumber = roles.PageNumber,
                    pageSize = roles.PageSize,
                    totalPages = roles.TotalPages,
                    hasPrevious = roles.HasPrevious,
                    hasNext = roles.HasNext
                }
            });
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { statusCode = 400, message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving user roles" });
        }
    }

    [HttpGet("{guid}")]
            [AuthorizePermission("user_role_form", PermissionType.CanView, "UserRole")]
    public async Task<IActionResult> GetUserRole(string guid)
    {
        try
        {
            var groupGuidStr = User.FindFirst("strGroupGUID")?.Value;
            if (string.IsNullOrEmpty(groupGuidStr) || !Guid.TryParse(groupGuidStr, out var groupGuid))
            {
                return BadRequest(new 
                { 
                    statusCode = 400, 
                    message = "Invalid group identifier in token" 
                });
            }
            
            var strModuleGUID = User.FindFirst("strModuleGUID")?.Value;
            if (string.IsNullOrEmpty(strModuleGUID))
            {
                _logger.LogWarning("Module identifier not found in token");
            }

            var role = await _userRoleService.GetUserRoleByIdAsync(
                GuidHelper.ToGuid(guid),
                groupGuid,
                !string.IsNullOrEmpty(strModuleGUID) ? GuidHelper.ToNullableGuid(strModuleGUID) : null);
                
            if (role == null)
            {
                return NotFound(new 
                { 
                    statusCode = 404, 
                    message = "User role not found" 
                });
            }

            return Ok(new
            {
                statusCode = 200,
                message = "User role retrieved successfully",
                data = role
            });
        }
        catch (BusinessException ex)
        {
            return NotFound(new { statusCode = 404, message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving the user role" });
        }
    }

    [HttpPost]
            [AuthorizePermission("user_role_form", PermissionType.CanSave, "UserRole")]
    public async Task<IActionResult> CreateUserRole([FromBody] UserRoleCreateDto userRoleDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new
                {
                    statusCode = 400,
                    message = "Validation failed",
                    errors = errors
                });
            }

            var groupGuidStr = User.FindFirst("strGroupGUID")?.Value;
            if (string.IsNullOrEmpty(groupGuidStr) || !Guid.TryParse(groupGuidStr, out var groupGuid))
            {
                return BadRequest(new 
                { 
                    statusCode = 400, 
                    message = "Invalid group identifier in token" 
                });
            }

            var createdByGuid = User.FindFirst("strUserGUID")?.Value;
            if (string.IsNullOrEmpty(createdByGuid))
            {
                return BadRequest(new 
                { 
                    statusCode = 400, 
                    message = "User identifier not found in token" 
                });
            }
            
            // Get module GUID from token
            var moduleGuidStr = User.FindFirst("strModuleGUID")?.Value;
            Guid? moduleGuid = null;
            
            if (!string.IsNullOrEmpty(moduleGuidStr))
            {
                if (!Guid.TryParse(moduleGuidStr, out var parsedModuleGuid))
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Invalid module identifier in token"
                    });
                }
                moduleGuid = parsedModuleGuid;
            }

            var result = await _userRoleService.CreateUserRoleAsync(
                userRoleDto,
                GuidHelper.ToGuid(createdByGuid),
                groupGuid,
                moduleGuid);
                
            return CreatedAtAction(nameof(GetUserRole), new { guid = result.strUserRoleGUID }, new
            {
                statusCode = 201,
                message = "User role created successfully",
                data = result
            });
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { statusCode = 400, message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { statusCode = 500, message = "An error occurred while creating the user role" });
        }
    }

    [HttpPut("{guid}")]
            [AuthorizePermission("user_role_form", PermissionType.CanEdit, "UserRole")]
    public async Task<IActionResult> UpdateUserRole(string guid, [FromBody] UserRoleUpdateDto userRoleDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new
                {
                    statusCode = 400,
                    message = "Validation failed",
                    errors = errors
                });
            }

            var groupGuidStr = User.FindFirst("strGroupGUID")?.Value;
            if (string.IsNullOrEmpty(groupGuidStr) || !Guid.TryParse(groupGuidStr, out var groupGuid))
            {
                return BadRequest(new 
                { 
                    statusCode = 400, 
                    message = "Invalid group identifier in token" 
                });
            }

            var updatedByGuid = User.FindFirst("strUserGUID")?.Value;
            if (string.IsNullOrEmpty(updatedByGuid))
            {
                return BadRequest(new 
                { 
                    statusCode = 400, 
                    message = "User identifier not found in token" 
                });
            }
            
            // Get module GUID from token
            var moduleGuidStr = User.FindFirst("strModuleGUID")?.Value;
            Guid? moduleGuid = null;
            
            if (!string.IsNullOrEmpty(moduleGuidStr))
            {
                if (!Guid.TryParse(moduleGuidStr, out var parsedModuleGuid))
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Invalid module identifier in token"
                    });
                }
                moduleGuid = parsedModuleGuid;
            }

            var result = await _userRoleService.UpdateUserRoleAsync(
                GuidHelper.ToGuid(guid),
                userRoleDto,
                GuidHelper.ToGuid(updatedByGuid),
                groupGuid,
                moduleGuid);
                
            return Ok(new
            {
                statusCode = 200,
                message = "User role updated successfully",
                data = result
            });
        }
        catch (BusinessException ex)
        {
            return NotFound(new { statusCode = 404, message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { statusCode = 500, message = "An error occurred while updating the user role" });
        }
    }

    [HttpDelete("{guid}")]
            [AuthorizePermission("user_role_form", PermissionType.CanDelete, "UserRole")]
    public async Task<IActionResult> DeleteUserRole(string guid)
    {
        try
        {
            var groupGuidStr = User.FindFirst("strGroupGUID")?.Value;
            if (string.IsNullOrEmpty(groupGuidStr) || !Guid.TryParse(groupGuidStr, out var groupGuid))
            {
                return BadRequest(new 
                { 
                    statusCode = 400, 
                    message = "Invalid group identifier in token" 
                });
            }
            
            return await SafeDeleteAsync(
                GuidHelper.ToGuid(guid),
                "User Role",
                async (id) => await _userRoleService.DeleteUserRoleAsync(id, groupGuid));
        }
        catch (BusinessException ex)
        {
            return BadRequest(new { statusCode = 400, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user role with GUID {Guid}", guid);
            return StatusCode(500, new { statusCode = 500, message = "An error occurred while deleting the user role" });
        }
    }
    
    [HttpGet("active")]
    
    public async Task<IActionResult> GetActiveRoles([FromQuery] string? search = null)
    {
        try
        {
            var groupGuidStr = User.FindFirst("strGroupGUID")?.Value;
            if (string.IsNullOrEmpty(groupGuidStr) || !Guid.TryParse(groupGuidStr, out var groupGuid))
            {
                return BadRequest(new { 
                    statusCode = 400, 
                    message = "Invalid group identifier in token" 
                });
            }
            
            var strModuleGUID = User.FindFirst("strModuleGUID")?.Value;
            if (string.IsNullOrEmpty(strModuleGUID))
            {
                _logger.LogWarning("Module identifier not found in token");
            }

            var roles = await _userRoleService.GetActiveRolesForDropdownAsync(
                groupGuid, 
                !string.IsNullOrEmpty(strModuleGUID) ? GuidHelper.ToNullableGuid(strModuleGUID) : null, 
                search);
                
            return Ok(new
            {
                statusCode = 200,
                message = "Active roles retrieved successfully",
                data = roles
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active roles");
            return StatusCode(500, new { 
                statusCode = 500, 
                message = "An error occurred while retrieving roles" 
            });
        }
    }

    [HttpGet("export")]
    [Authorize]
    [AuthorizePermission("user_role_list", PermissionType.CanExport, "UserRole")]
    public async Task<IActionResult> ExportUserRoles([FromQuery] string format)
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

            // Get group GUID from user claims
            var groupGuid = User.FindFirst("strGroupGUID")?.Value;
            if (string.IsNullOrEmpty(groupGuid))
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = "Group GUID not found in token"
                });
            }
            
            var strModuleGUID = User.FindFirst("strModuleGUID")?.Value;
            if (string.IsNullOrEmpty(strModuleGUID))
            {
                _logger.LogWarning("Module identifier not found in token");
            }

            byte[] fileContents;
            string contentType, fileName;
            
            (fileContents, contentType, fileName) = await _userRoleService.ExportUserRolesAsync(
                format, 
                GuidHelper.ToGuid(groupGuid), 
                !string.IsNullOrEmpty(strModuleGUID) ? GuidHelper.ToNullableGuid(strModuleGUID) : null);

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
            _logger.LogError(ex, "Error occurred during user role export");
            return StatusCode(500, new ApiResponse<object> 
            { 
                statusCode = 500, 
                Message = "An error occurred while processing your request."
            });
        }
    }
}