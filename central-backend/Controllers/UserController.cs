using AuditSoftware.DTOs.User;
using AuditSoftware.Interfaces;
using AuditSoftware.Attributes;
using AuditSoftware.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.Data;
using AuditSoftware.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : BaseDeletionController<Models.Entities.MstUser>
    {
        private readonly IUserService _userService;
        private readonly AppDbContext _context;
        private new readonly ILogger<UserController> _logger;

        public UserController(
            IUserService userService,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<Models.Entities.MstUser>> baseLogger,
            ILogger<UserController> logger,
            AppDbContext context)
            : base(deleteValidationService, baseLogger)
        {
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet("module-users")]
        [Authorize]
        public async Task<IActionResult> GetModuleUsers([FromQuery] bool? bolIsActive = null, [FromQuery] string? search = null)
        {
            try
            {
                // Read required GUIDs from token
                var groupGuidStr = User?.FindFirst("strGroupGUID")?.Value;
                var orgGuidStr = User?.FindFirst("strOrganizationGUID")?.Value;
                var yearGuidStr = User?.FindFirst("strYearGUID")?.Value;
                var moduleGuidStr = User?.FindFirst("strModuleGUID")?.Value;

                if (string.IsNullOrWhiteSpace(groupGuidStr) ||
                    string.IsNullOrWhiteSpace(orgGuidStr) ||
                    string.IsNullOrWhiteSpace(yearGuidStr) ||
                    string.IsNullOrWhiteSpace(moduleGuidStr))
                {
                    return BadRequest(new { statusCode = 400, message = "Required identifiers not found in token" });
                }

                var groupGuid = GuidHelper.ToGuid(groupGuidStr);
                var orgGuid = GuidHelper.ToGuid(orgGuidStr);
                var yearGuid = GuidHelper.ToGuid(yearGuidStr);
                var moduleGuid = GuidHelper.ToGuid(moduleGuidStr);

                // Filter mstUserDetails by context and optional active flag
                var detailsQuery = _context.MstUserDetails
                    .Where(d => d.strGroupGUID == groupGuid
                             && d.strOrganizationGUID == orgGuid
                             && d.strYearGUID == yearGuid
                             && d.strModuleGUID == moduleGuid);

                if (bolIsActive.HasValue)
                {
                    detailsQuery = detailsQuery.Where(d => d.bolIsActive == bolIsActive.Value);
                }

                var userGuids = await detailsQuery
                    .Select(d => d.strUserGUID)
                    .Distinct()
                    .ToListAsync();

                // Join with mstUser to return user info
                var usersQuery = _context.MstUsers
                    .Where(u => userGuids.Contains(u.strUserGUID));

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.Trim().ToLower();
                    usersQuery = usersQuery.Where(u =>
                        (!string.IsNullOrEmpty(u.strName) && u.strName.ToLower().Contains(searchLower)) ||
                        (!string.IsNullOrEmpty(u.strEmailId) && u.strEmailId.ToLower().Contains(searchLower)) ||
                        (!string.IsNullOrEmpty(u.strMobileNo) && u.strMobileNo.Contains(search)));
                }

                var users = await usersQuery
                    .OrderBy(u => u.strName)
                    .Select(u => new
                    {
                        strUserGUID = u.strUserGUID,
                        strName = u.strName,
                        strEmailId = u.strEmailId,
                        bolIsActive = u.bolIsActive,
                        strProfileImg = u.strProfileImg
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Module users retrieved successfully",
                    data = users,
                    totalCount = users.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving module users");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving module users" });
            }
        }

        [HttpPost]
        [AuthorizePermission("user_form", PermissionType.CanSave, "User")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] UserCreateDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid request data" });
                }

                // Get user GUID, group GUID, organization GUID, module GUID and year GUID from token
                var userGuid = User?.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuid))
                {
                    _logger.LogWarning("Create attempt without valid user GUID in token");
                    return StatusCode(401, new { statusCode = 401, message = "User GUID not found in token" });
                }
                
                var groupGuidString = User?.FindFirst("strGroupGUID")?.Value ?? "";
                var organizationGuidString = User?.FindFirst("strOrganizationGUID")?.Value ?? "";
                var moduleGuidString = User?.FindFirst("strModuleGUID")?.Value ?? "";
                var yearGuidString = User?.FindFirst("strYearGUID")?.Value;
                
                // Validate that year GUID is provided
                if (string.IsNullOrEmpty(yearGuidString))
                {
                    return BadRequest(new { statusCode = 400, message = "Year GUID is required when creating a user" });
                }

                // Convert string GUIDs to Guid objects
                Guid userGuidObj = GuidHelper.ToGuid(userGuid);
                Guid groupGuidObj = GuidHelper.ToGuid(groupGuidString);
                Guid organizationGuidObj = GuidHelper.ToGuid(organizationGuidString);
                Guid? yearGuidObj = GuidHelper.ToNullableGuid(yearGuidString);

                var result = await _userService.CreateAsync(createDto, userGuidObj, groupGuidObj, organizationGuidObj, yearGuidObj);
                return CreatedAtAction(nameof(GetById), new { guid = result.strUserGUID }, new
                {
                    statusCode = 201,
                    message = "User created successfully",
                    data = result
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning("Business exception while creating user: {Message}", ex.Message);
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error while creating user");
                if (dbEx.InnerException?.Message.Contains("IX_mstUser_strMobileNo") == true)
                {
                    return BadRequest(new { statusCode = 400, message = "This mobile number is already registered" });
                }
                if (dbEx.InnerException?.Message.Contains("IX_mstUser_strEmailId") == true)
                {
                    return BadRequest(new { statusCode = 400, message = "This email is already registered" });
                }
                return StatusCode(500, new { statusCode = 500, message = "A database error occurred while creating the user" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating user");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while creating the user" });
            }
        }

        [HttpPut("{guid}")]
        [AuthorizePermission("user_form", PermissionType.CanEdit, "User")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Update(string guid, [FromForm] UserUpdateDto updateDto)
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

                // Extract user GUID from token to track who made the update
                var updatedByGUIDString = User?.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUIDString))
                {
                    _logger.LogWarning("Update attempt without valid user GUID in token for user ID: {UserId}", guid);
                    return StatusCode(401, new { statusCode = 401, message = "User GUID not found in token" });
                }

                // Convert string GUIDs to Guid objects
                Guid guidObj = GuidHelper.ToGuid(guid);
                Guid updatedByGUIDObj = GuidHelper.ToGuid(updatedByGUIDString);

                var result = await _userService.UpdateAsync(guidObj, updateDto, updatedByGUIDObj);
                return Ok(new
                {
                    statusCode = 200,
                    message = "User updated successfully",
                    data = result
                });
            }
            catch (BusinessException ex)
            {
                return NotFound(new { statusCode = 404, message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while updating the user" });
            }
        }

        [HttpGet("{guid}")]
        [Authorize] // Changed from AuthorizePermission to simple Authorize - removed permission check
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                Guid guidObj = GuidHelper.ToGuid(guid);
                var result = await _userService.GetByIdAsync(guidObj);
                return Ok(new
                {
                    statusCode = 200,
                    message = "User retrieved successfully",
                    data = result
                });
            }
            catch (BusinessException ex)
            {
                return NotFound(new { statusCode = 404, message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving the user" });
            }
        }

        [HttpGet("by-organization-module")]
        [AuthorizePermission("user_list", PermissionType.CanView, "User")]
        public async Task<IActionResult> GetByOrganizationModule(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true,
            [FromQuery] bool? bolIsActive = null,
            [FromQuery] string? dtBirthDateFrom = null,
            [FromQuery] string? dtBirthDateUpto = null,
            [FromQuery(Name = "strCreatedByGUID")] string? strGUIDsCreatedByGUID = null,
            [FromQuery(Name = "strUpdatedByGUID")] string? strGUIDsUpdatedByGUID = null,
            [FromQuery(Name = "strDesignationGUID")] string? strGUIDsDesignation = null,
            [FromQuery(Name = "strDepartmentGUID")] string? strGUIDsDepartment = null)
        {
            try
            {
                // Get user GUID and module GUID from token
                var userGuid = User.FindFirst("strUserGUID")?.Value;
                var moduleGuid = User.FindFirst("strModuleGUID")?.Value;

                if (string.IsNullOrEmpty(userGuid))
                {
                    return BadRequest(new { statusCode = 400, message = "User GUID not found in token" });
                }

                if (string.IsNullOrEmpty(moduleGuid))
                {
                    return BadRequest(new { statusCode = 400, message = "Module GUID not found in token" });
                }

                // Parse birth date range (format: YYYY-MM-DD)
                DateTime? birthDateFrom = null;
                if (!string.IsNullOrWhiteSpace(dtBirthDateFrom) && DateTime.TryParse(dtBirthDateFrom.Trim(), out DateTime fromDate))
                {
                    // Convert to UTC date only (set time to 00:00:00)
                    birthDateFrom = new DateTime(fromDate.Year, fromDate.Month, fromDate.Day, 0, 0, 0, DateTimeKind.Utc);
                }
                
                DateTime? birthDateUpto = null;
                if (!string.IsNullOrWhiteSpace(dtBirthDateUpto) && DateTime.TryParse(dtBirthDateUpto.Trim(), out DateTime uptoDate))
                {
                    // Convert to UTC date only (set time to 23:59:59)
                    birthDateUpto = new DateTime(uptoDate.Year, uptoDate.Month, uptoDate.Day, 23, 59, 59, DateTimeKind.Utc);
                }

                // Parse comma-separated creator GUIDs
                List<string>? createdByGUIDs = string.IsNullOrWhiteSpace(strGUIDsCreatedByGUID)
                    ? null
                    : strGUIDsCreatedByGUID.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                // Parse comma-separated updater GUIDs
                List<string>? updatedByGUIDs = string.IsNullOrWhiteSpace(strGUIDsUpdatedByGUID)
                    ? null
                    : strGUIDsUpdatedByGUID.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                // Parse designation and department filters
                List<string>? designationGUIDStrings = string.IsNullOrWhiteSpace(strGUIDsDesignation)
                    ? null
                    : strGUIDsDesignation.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                List<string>? departmentGUIDStrings = string.IsNullOrWhiteSpace(strGUIDsDepartment)
                    ? null
                    : strGUIDsDepartment.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                // Convert string GUIDs to Guid objects
                List<Guid>? createdByGuidObjs = createdByGUIDs != null ? GuidHelper.ToGuidList(createdByGUIDs) : null;
                List<Guid>? updatedByGuidObjs = updatedByGUIDs != null ? GuidHelper.ToGuidList(updatedByGUIDs) : null;
                List<Guid>? designationGuidObjs = designationGUIDStrings != null ? GuidHelper.ToGuidList(designationGUIDStrings) : null;
                List<Guid>? departmentGuidObjs = departmentGUIDStrings != null ? GuidHelper.ToGuidList(departmentGUIDStrings) : null;

                var filterDto = new UserFilterByOrgModuleDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    Search = search,
                    SortBy = sortBy,
                    ascending = ascending,
                    bolIsActive = bolIsActive,
                    CurrentUserGUID = userGuid,
                    ModuleGUID = moduleGuid,
                    dtBirthDateFrom = birthDateFrom,
                    dtBirthDateUpto = birthDateUpto,
                    strGUIDsCreatedBy = createdByGuidObjs,
                    strGUIDsUpdatedBy = updatedByGuidObjs,
                    strDesignationGUIDs = designationGuidObjs,
                    strDepartmentGUIDs = departmentGuidObjs
                };

                var result = await _userService.GetByOrganizationModuleAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Users retrieved successfully",
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
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users by organization and module");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving users" });
            }
        }

        [HttpGet]
        [AuthorizePermission("user_list", PermissionType.CanView, "User")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true,
            [FromQuery] bool? bolIsActive = null,
            [FromQuery] string? dtBirthDateFrom = null,
            [FromQuery] string? dtBirthDateUpto = null,
            [FromQuery(Name = "strCreatedByGUID")] string? strGUIDsCreatedByGUID = null,
            [FromQuery(Name = "strUpdatedByGUID")] string? strGUIDsUpdatedByGUID = null,
            [FromQuery(Name = "strDesignationGUID")] string? strGUIDsDesignation = null,
            [FromQuery(Name = "strDepartmentGUID")] string? strGUIDsDepartment = null)
        {
            try
            {
                // Extract group GUID from token
                var groupGuid = User?.FindFirst("strGroupGUID")?.Value;
                
                // Parse birth date range (format: YYYY-MM-DD)
                DateTime? birthDateFrom = null;
                if (!string.IsNullOrWhiteSpace(dtBirthDateFrom) && DateTime.TryParse(dtBirthDateFrom.Trim(), out DateTime fromDate))
                {
                    // Convert to UTC date only (set time to 00:00:00)
                    birthDateFrom = new DateTime(fromDate.Year, fromDate.Month, fromDate.Day, 0, 0, 0, DateTimeKind.Utc);
                }
                
                DateTime? birthDateUpto = null;
                if (!string.IsNullOrWhiteSpace(dtBirthDateUpto) && DateTime.TryParse(dtBirthDateUpto.Trim(), out DateTime uptoDate))
                {
                    // Convert to UTC date only (set time to 23:59:59)
                    birthDateUpto = new DateTime(uptoDate.Year, uptoDate.Month, uptoDate.Day, 23, 59, 59, DateTimeKind.Utc);
                }

                // Parse comma-separated creator GUIDs
                List<string>? createdByGUIDs = string.IsNullOrWhiteSpace(strGUIDsCreatedByGUID)
                    ? null
                    : strGUIDsCreatedByGUID.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                // Parse comma-separated updater GUIDs
                List<string>? updatedByGUIDs = string.IsNullOrWhiteSpace(strGUIDsUpdatedByGUID)
                    ? null
                    : strGUIDsUpdatedByGUID.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                // Parse designation and department filters
                List<string>? designationGUIDStrings = string.IsNullOrWhiteSpace(strGUIDsDesignation)
                    ? null
                    : strGUIDsDesignation.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                List<string>? departmentGUIDStrings = string.IsNullOrWhiteSpace(strGUIDsDepartment)
                    ? null
                    : strGUIDsDepartment.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                // Convert string GUIDs to Guid objects
                Guid? groupGuidObj = groupGuid != null ? GuidHelper.ToNullableGuid(groupGuid) : null;
                List<Guid>? createdByGuidObjs = createdByGUIDs != null ? GuidHelper.ToGuidList(createdByGUIDs) : null;
                List<Guid>? updatedByGuidObjs = updatedByGUIDs != null ? GuidHelper.ToGuidList(updatedByGUIDs) : null;
                List<Guid>? designationGuidObjs = designationGUIDStrings != null ? GuidHelper.ToGuidList(designationGUIDStrings) : null;
                List<Guid>? departmentGuidObjs = departmentGUIDStrings != null ? GuidHelper.ToGuidList(departmentGUIDStrings) : null;

                var filterDto = new UserFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    Search = search,
                    SortBy = sortBy,
                    ascending = ascending,
                    GroupGUID = groupGuidObj,
                    bolIsActive = bolIsActive,
                    dtBirthDateFrom = birthDateFrom,
                    dtBirthDateUpto = birthDateUpto,
                    strGUIDsCreatedBy = createdByGuidObjs,
                    strGUIDsUpdatedBy = updatedByGuidObjs,
                    strDesignationGUIDs = designationGuidObjs,
                    strDepartmentGUIDs = departmentGuidObjs
                };

                var result = await _userService.GetAllAsync(filterDto);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Users retrieved successfully",
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
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving users" });
            }
        }

        [HttpDelete("{guid}")]
        [AuthorizePermission("user_form", PermissionType.CanDelete, "User")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                // Convert the user GUID
                if (!Guid.TryParse(guid, out Guid guidObj))
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid user ID format" });
                }

                // Get current user's GUID from claims
                var currentUserGuidString = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(currentUserGuidString))
                {
                    _logger.LogWarning("User GUID claim not found in token");
                    return Unauthorized(new { statusCode = 401, message = "User authentication information not found" });
                }
                
                if (!Guid.TryParse(currentUserGuidString, out Guid currentUserGuid))
                {
                    _logger.LogError("Invalid GUID format in user token: {UserGuid}", currentUserGuidString);
                    return Unauthorized(new { statusCode = 401, message = "Invalid user authentication format" });
                }

                // Validate that we're not trying to delete ourselves
                if (guidObj == currentUserGuid)
                {
                    return BadRequest(new { statusCode = 400, message = "Cannot delete your own user account" });
                }

                return await SafeDeleteAsync(
                    guidObj,
                    "User",
                    async (id) => await _userService.DeleteAsync(id, currentUserGuid));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {Guid}", guid);
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while deleting the user" });
            }
        }

        [HttpGet("active-users")]
        [Authorize]
        public async Task<IActionResult> GetActiveUsers([FromQuery] string? search = null)
        {
            try
            {
                // Get group GUID from token
                var groupGuidString = User?.FindFirst("strGroupGUID")?.Value;

                if (string.IsNullOrEmpty(groupGuidString))
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Group identifier not found in token"
                    });
                }

                // Convert string GUID to Guid object
                Guid groupGuidObj = GuidHelper.ToGuid(groupGuidString);

                // Build query for active users in the same group
                var query = _context.MstUsers
                    .Where(u => 
                        u.strGroupGUID == groupGuidObj && // Same group as authenticated user
                        u.bolIsActive == true); // Only active users
                
                // Apply search if provided
                if (!string.IsNullOrWhiteSpace(search))
                {
                    string searchLower = search.ToLower();
                    query = query.Where(u => 
                        u.strName.ToLower().Contains(searchLower) || 
                        u.strEmailId.ToLower().Contains(searchLower) ||
                        u.strMobileNo.Contains(search));
                }

                // Always sort by name for consistent dropdown ordering
                query = query.OrderBy(u => u.strName);
                
                // Get all matched users (no pagination for dropdown)
                var users = await query
                    .Select(u => new
                    {
                        value = u.strUserGUID,
                        label = u.strName,
                        email = u.strEmailId
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} active users for group {GroupGuid} for dropdown", 
                    users.Count, groupGuidString);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Active users retrieved successfully",
                    data = users,
                    totalCount = users.Count,
                    groupGuid = groupGuidString
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active users");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving active users",
                    error = ex.Message
                });
            }
        }
        
        [HttpGet("export")]
        [Authorize]
        [AuthorizePermission("user_list", PermissionType.CanExport, "User")]
        public async Task<IActionResult> ExportUsers([FromQuery] string format)
        {
            try
            {
                if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
                {
                    return BadRequest(new { 
                        statusCode = 400, 
                        message = "Invalid format specified. Supported formats are 'excel' and 'csv'."
                    });
                }

                // Get group GUID from user claims
                var groupGuidString = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(groupGuidString))
                {
                    return BadRequest(new {
                        statusCode = 400,
                        message = "Group GUID not found in token"
                    });
                }
                
                // Convert string GUID to Guid object
                Guid groupGuidObj = GuidHelper.ToGuid(groupGuidString);
                
                _logger.LogInformation("Exporting users for group GUID: {GroupGuid} in format: {Format}", groupGuidString, format);

                _logger.LogInformation("Attempting to export users with format: {Format} and groupGuid: {GroupGuid}", format, groupGuidString);
                
                byte[] fileContents;
                string contentType;
                string fileName;
                (fileContents, contentType, fileName) = await _userService.ExportUsersAsync(format, groupGuidObj);
                
                _logger.LogInformation("Export successful. Generated file: {FileName} with content type: {ContentType} and size: {Size} bytes", 
                    fileName, contentType, fileContents?.Length ?? 0);

                // Ensure fileContents is not null
                if (fileContents == null)
                {
                    _logger.LogError("Export operation returned null file contents");
                    return StatusCode(500, new { statusCode = 500, message = "Export operation failed: null file contents" });
                }

                // Set appropriate headers for file download
                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                
                // Return the file
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning("Business exception during users export: {Message}", ex.Message);
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception with detailed information
                _logger.LogError(ex, "Error occurred during users export. Type: {ExceptionType}, Message: {Message}", 
                    ex.GetType().Name, ex.Message);
                
                // For format exceptions, provide more helpful response
                if (ex is FormatException || ex.InnerException is FormatException)
                {
                    return BadRequest(new { 
                        statusCode = 400, 
                        message = "A formatting error occurred while exporting users. This may be due to invalid data in user records.",
                        detail = ex.Message
                    });
                }
                
                return StatusCode(500, new { 
                    statusCode = 500, 
                    message = "An error occurred while processing your request.",
                    detail = ex.Message
                });
            }
        }
    }
} 

