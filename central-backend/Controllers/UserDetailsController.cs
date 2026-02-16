using System;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuditSoftware.DTOs.UserDetails;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using System.Text.Json;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UserDetailsController : BaseDeletionController<Models.Entities.MstUserDetails>
    {
        private readonly IUserDetailsService _userDetailsService;
        private new readonly ILogger<UserDetailsController> _logger;

        public UserDetailsController(
            IUserDetailsService userDetailsService,
            IDeleteValidationService deleteValidationService,
            ILogger<UserDetailsController> logger,
            ILogger<BaseDeletionController<Models.Entities.MstUserDetails>> baseLogger)
            : base(deleteValidationService, baseLogger)
        {
            _userDetailsService = userDetailsService ?? throw new ArgumentNullException(nameof(userDetailsService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] UserDetailsCreateDto createDto)
        {
            try
            {
                var userGuid = User.FindFirst("strUserGUID")?.Value;
                var groupGuid = User.FindFirst("strGroupGUID")?.Value;
                var moduleGuid = User.FindFirst("strModuleGUID")?.Value;
                
                _logger.LogInformation("Creating user details with payload: {Payload}", JsonSerializer.Serialize(createDto));
                _logger.LogInformation("User context - UserGUID: {UserGUID}, GroupGUID: {GroupGUID}, ModuleGUID: {ModuleGUID}", userGuid, groupGuid, moduleGuid);
                
                if (string.IsNullOrEmpty(userGuid) || string.IsNullOrEmpty(groupGuid))
                {
                    _logger.LogError("Missing required claims. UserGUID: {UserGUID}, GroupGUID: {GroupGUID}", userGuid, groupGuid);
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "User information not found in token"
                    });
                }
                
                if (string.IsNullOrEmpty(moduleGuid))
                {
                    _logger.LogError("Module GUID not found in token");
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Module information not found in token"
                    });
                }

                // Validate GUID formats before proceeding
                try
                {
                    // strUserGUID, strUserRoleGUID, etc. are already Guid types
                    // Just check if moduleGuid and groupGuid are valid GUIDs
                    GuidHelper.ToGuid(groupGuid);
                    GuidHelper.ToGuid(moduleGuid); // Validate the module GUID format
                }
                catch (FormatException ex)
                {
                    _logger.LogError(ex, "Invalid GUID format in request or token claims");
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "One or more GUIDs are in invalid format"
                    });
                }

                var result = await _userDetailsService.UpsertAsync(createDto, GuidHelper.ToGuid(userGuid), GuidHelper.ToGuid(groupGuid), GuidHelper.ToGuid(moduleGuid));

                return Ok(new ApiResponse<UserDetailsResponseDto>
                {
                    statusCode = 200,
                    Message = "User details created or updated successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business exception while creating user details");
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user details");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = $"An error occurred while creating user details: {ex.Message}"
                });
            }
        }

        [HttpPost("bulk")]
        [Authorize]
        public async Task<IActionResult> BulkCreate([FromBody] UserDetailsBulkCreateDto bulkCreateDto)
        {
            try
            {
                var userGuid = User.FindFirst("strUserGUID")?.Value;
                var groupGuid = User.FindFirst("strGroupGUID")?.Value;
                var moduleGuid = User.FindFirst("strModuleGUID")?.Value;
                
                _logger.LogInformation("Bulk creating user details for {Count} users", bulkCreateDto.strUserGUIDs.Count);
                _logger.LogInformation("User context - UserGUID: {UserGUID}, GroupGUID: {GroupGUID}, ModuleGUID: {ModuleGUID}", userGuid, groupGuid, moduleGuid);
                
                if (string.IsNullOrEmpty(userGuid) || string.IsNullOrEmpty(groupGuid))
                {
                    _logger.LogError("Missing required claims. UserGUID: {UserGUID}, GroupGUID: {GroupGUID}", userGuid, groupGuid);
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "User information not found in token"
                    });
                }
                
                if (string.IsNullOrEmpty(moduleGuid))
                {
                    _logger.LogError("Module GUID not found in token");
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Module information not found in token"
                    });
                }

                // Validate GUID formats before proceeding
                try
                {
                    GuidHelper.ToGuid(groupGuid);
                    GuidHelper.ToGuid(moduleGuid);
                }
                catch (FormatException ex)
                {
                    _logger.LogError(ex, "Invalid GUID format in request or token claims");
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "One or more GUIDs are in invalid format"
                    });
                }

                var result = await _userDetailsService.BulkUpsertAsync(bulkCreateDto, GuidHelper.ToGuid(userGuid), GuidHelper.ToGuid(groupGuid), GuidHelper.ToGuid(moduleGuid));

                return Ok(new ApiResponse<BulkUserDetailsResponseDto>
                {
                    statusCode = 200,
                    Message = $"Bulk operation completed. Success: {result.SuccessCount}, Failed: {result.FailureCount}",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business exception while bulk creating user details");
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error bulk creating user details");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = $"An error occurred while bulk creating user details: {ex.Message}"
                });
            }
        }


        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = null, [FromQuery] bool ascending = true, [FromQuery] string? search = null,
            [FromQuery] string? strOrganizationGUID = null, [FromQuery] bool? bolIsActive = null,
            [FromQuery] string? strUserRoleGUID = null, [FromQuery] string? strYearGUID = null, [FromQuery] string? strUserGUID = null)
        {
            try
            {
                var groupGuid = User.FindFirst("strGroupGUID")?.Value;
                var tokenOrganizationGuid = User.FindFirst("strOrganizationGUID")?.Value;
                var moduleGuid = User.FindFirst("strModuleGUID")?.Value;

                if (string.IsNullOrEmpty(groupGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Group information not found in token"
                    });
                }
                
                if (string.IsNullOrEmpty(moduleGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Module information not found in token"
                    });
                }

                // Use the organization GUID from the query parameter if provided, otherwise use from token
                var organizationGuid = !string.IsNullOrEmpty(strOrganizationGUID) ? strOrganizationGUID : tokenOrganizationGuid;
                
                if (string.IsNullOrEmpty(organizationGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Organization GUID not provided in query parameter or token"
                    });
                }

                var filterDto = new UserDetailsFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    ascending = ascending,
                    Search = search,
                    strGroupGUID = groupGuid,
                    strOrganizationGUID = organizationGuid,
                    strModuleGUID = moduleGuid,
                    bolIsActive = bolIsActive,
                    strUserRoleGUID = strUserRoleGUID,
                    strYearGUID = strYearGUID,
                    strUserGUID = strUserGUID
                };

                var result = await _userDetailsService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "User details retrieved successfully",
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
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving user details"
                });
            }
        }

        [HttpGet("{guid}")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var result = await _userDetailsService.GetByIdAsync(GuidHelper.ToGuid(guid));

                return Ok(new ApiResponse<UserDetailsResponseDto>
                {
                    statusCode = 200,
                    Message = "User details retrieved successfully",
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
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving user details"
                });
            }
        }

        [HttpPut("{guid}")]
        public async Task<IActionResult> Update(string guid, [FromBody] UserDetailsUpdateDto updateDto)
        {
            try
            {
                var userGuid = User.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(userGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "User information not found in token"
                    });
                }

                var result = await _userDetailsService.UpdateAsync(GuidHelper.ToGuid(guid), updateDto, GuidHelper.ToGuid(userGuid));

                return Ok(new ApiResponse<UserDetailsResponseDto>
                {
                    statusCode = 200,
                    Message = "User details updated successfully",
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
            catch (Exception)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while updating user details"
                });
            }
        }

        [HttpDelete("{guid}")]
        public async Task<IActionResult> Delete(string guid)
        {
            // Get the current user's context from claims
            var currentUserGuid = User.FindFirst("strUserGUID")?.Value;
            var currentOrganizationGuid = User.FindFirst("strOrganizationGUID")?.Value;
            var currentYearGuid = User.FindFirst("strYearGUID")?.Value;

            if (string.IsNullOrEmpty(currentUserGuid) || 
                string.IsNullOrEmpty(currentOrganizationGuid) || 
                string.IsNullOrEmpty(currentYearGuid))
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = "User context information not found in token"
                });
            }

            return await SafeDeleteAsync(
                GuidHelper.ToGuid(guid),
                "User Details",
                async (id) => await _userDetailsService.DeleteAsync(id, GuidHelper.ToGuid(currentUserGuid), GuidHelper.ToGuid(currentOrganizationGuid), GuidHelper.ToGuid(currentYearGuid)));
        }
    }
}


