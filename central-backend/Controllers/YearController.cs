using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuditSoftware.DTOs.Year;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Attributes;
using System.Linq;

namespace AuditSoftware.Controllers
{   
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class YearController : BaseDeletionController<Models.Entities.MstYear>
    {
        private readonly IYearService _yearService;

        public YearController(
            IYearService yearService,
            IDeleteValidationService deleteValidationService,
            Microsoft.Extensions.Logging.ILogger<BaseDeletionController<Models.Entities.MstYear>> logger)
            : base(deleteValidationService, logger)
        {
            _yearService = yearService ?? throw new ArgumentNullException(nameof(yearService));
        }

        [HttpPost]
        [AuthorizePermission("year", PermissionType.CanSave, "Year")]
        public async Task<ActionResult<YearResponseDto>> Create([FromBody] YearCreateDto createDto)
        {
            try
            {
                // Check if user is authenticated and has claims
                if (User?.Identity == null || !User.Identity.IsAuthenticated)
                    throw new BusinessException("User is not authenticated");

                var userGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strUserGUID");
                if (userGuidClaim == null)
                    throw new BusinessException("User GUID claim is missing from token");

                var groupGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strGroupGUID");
                if (groupGuidClaim == null)
                    throw new BusinessException("Group GUID claim is missing from token");

                var organizationGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID");
                if (organizationGuidClaim == null)
                    throw new BusinessException("Organization GUID claim is missing from token");

                var currentUserGuid = Guid.Parse(userGuidClaim.Value);
                var groupGuid = Guid.Parse(groupGuidClaim.Value);
                var organizationGuid = Guid.Parse(organizationGuidClaim.Value);

                var result = await _yearService.CreateAsync(createDto, currentUserGuid, groupGuid, organizationGuid);
                return Ok(new ApiResponse<YearResponseDto>
                {
                    statusCode = 200,
                    Message = "Year created successfully",
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
                    Message = "An error occurred while creating the year"
                });
            }
        }

        [HttpGet("{guid}")]
        [AuthorizePermission("year", PermissionType.CanView, "Year")]
        public async Task<ActionResult<YearResponseDto>> GetById(Guid guid)
        {
            var result = await _yearService.GetByIdAsync(guid);
            return Ok(new ApiResponse<YearResponseDto>
            {
                statusCode = 200,
                Message = "Year retrieved successfully",
                Data = result
            });
        }

        [HttpGet]
        [AuthorizePermission("year", PermissionType.CanView, "Year")]
        public async Task<ActionResult<PagedResponse<YearResponseDto>>> GetAll(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true,
            [FromQuery] string? search = null,
            [FromQuery] bool? bolIsActive = null,
            [FromQuery(Name = "strOrganizationGUIDs")] string? organizationGUIDsStr = null,
            [FromQuery(Name = "strCreatedByGUIDs")] string? createdByGUIDsStr = null,
            [FromQuery(Name = "strUpdatedByGUIDs")] string? updatedByGUIDsStr = null)
        {
            try
            {
                var groupGuidString = User.FindFirst("strGroupGUID")?.Value;
                var organizationGuidString = User.FindFirst("strOrganizationGUID")?.Value;

                if (string.IsNullOrEmpty(groupGuidString))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Group information not found in token"
                    });
                }
                
                if (string.IsNullOrEmpty(organizationGuidString))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Organization information not found in token"
                    });
                }
                
                Guid groupGuid = Guid.Parse(groupGuidString);
                Guid organizationGuid = Guid.Parse(organizationGuidString);

                // Parse comma-separated values into lists of Guid
                List<Guid>? organizationGUIDs = null;
                if (!string.IsNullOrWhiteSpace(organizationGUIDsStr))
                {
                    organizationGUIDs = organizationGUIDsStr.Split(',')
                        .Select(s => s.Trim())
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Select(s => Guid.Parse(s))
                        .ToList();
                }
                
                List<Guid>? createdByGUIDs = null;
                if (!string.IsNullOrWhiteSpace(createdByGUIDsStr))
                {
                    createdByGUIDs = createdByGUIDsStr.Split(',')
                        .Select(s => s.Trim())
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Select(s => Guid.Parse(s))
                        .ToList();
                }
                
                List<Guid>? updatedByGUIDs = null;
                if (!string.IsNullOrWhiteSpace(updatedByGUIDsStr))
                {
                    updatedByGUIDs = updatedByGUIDsStr.Split(',')
                        .Select(s => s.Trim())
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Select(s => Guid.Parse(s))
                        .ToList();
                }

                var timeZone = User.FindFirst("strTimeZone")?.Value ?? DateTimeProvider.DefaultTimeZone;
                _logger.LogInformation($"Using timezone: {timeZone} for years list");

                var filterDto = new YearFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    ascending = ascending,
                    Search = search,
                    bolIsActive = bolIsActive,
                    OrganizationGUIDs = organizationGUIDs,
                    CreatedByGUIDs = createdByGUIDs,
                    UpdatedByGUIDs = updatedByGUIDs,
                    GroupGUID = groupGuid
                };

                var result = await _yearService.GetAllAsync(filterDto, organizationGuid);
                
                // Convert dates to user's timezone
                foreach (var year in result.Items)
                {
                    year.ConvertToTimeZone(timeZone);
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Years retrieved successfully",
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
                    Message = "An error occurred while retrieving years"
                });
            }
        }

        [HttpPut("{guid}")]
        [AuthorizePermission("year", PermissionType.CanEdit, "Year")]
        public async Task<ActionResult<YearResponseDto>> Update(Guid guid, [FromBody] YearUpdateDto updateDto)
        {
            try
            {
                if (User?.Identity == null || !User.Identity.IsAuthenticated)
                    throw new BusinessException("User is not authenticated");

                var userGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strUserGUID");
                if (userGuidClaim == null)
                    throw new BusinessException("User GUID claim is missing from token");

                var yearGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strYearGUID");
                var currentUserGuid = Guid.Parse(userGuidClaim.Value);
                var result = await _yearService.UpdateAsync(guid, updateDto, currentUserGuid);
                
                return Ok(new ApiResponse<YearResponseDto>
                {
                    statusCode = 200,
                    Message = "Year updated successfully",
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
                    Message = "An error occurred while updating the year"
                });
            }
        }

        [HttpDelete("{guid}")]
        [AuthorizePermission("year", PermissionType.CanDelete, "Year")]
        public async Task<ActionResult> Delete(Guid guid)
        {
            try 
            {
                await _yearService.DeleteAsync(guid);
                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Year deleted successfully"
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
                    Message = "An error occurred while deleting the year"
                });
            }
        }

        [HttpGet("organization/{strOrganizationGUIDs}")]
        public async Task<ActionResult<List<YearSimpleResponseDto>>> GetYearsByOrganization(Guid strOrganizationGUIDs)
        {
            try
            {
                // Get the user GUID from the token
                var userGuidStr = User?.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidStr))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "User GUID not found in token"
                    });
                }

                Guid userGuid = Guid.Parse(userGuidStr);
                
                // Use the method that fetches active years from MstUserDetails
                var result = await _yearService.GetSimpleYearsByOrganizationAndUserAsync(strOrganizationGUIDs, userGuid);
                return Ok(new ApiResponse<List<YearSimpleResponseDto>>
                {
                    statusCode = 200,
                    Message = "Active years for organization and user retrieved successfully",
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
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = $"An error occurred while retrieving years for the organization: {ex.Message}"
                });
            }
        }

        [HttpGet("active-years")]
        public async Task<ActionResult<List<YearSimpleResponseDto>>> GetActiveYearsByOrganization([FromQuery] Guid strOrganizationGUID, [FromQuery] Guid? strYearGUID = null)
        {
            try
            {
                List<YearSimpleResponseDto> result;
                if (strYearGUID.HasValue)
                {
                    // If strYearGUID is provided, get all active years for the organization except the specified one
                    // Get all active years
                    var allYears = await _yearService.GetActiveYearsByOrganizationAsync(strOrganizationGUID);
                    
                    // Filter out the specified year
                    result = allYears.Where(y => y.strYearGUID != strYearGUID.Value).ToList();
                }
                else
                {
                    // If no strYearGUID is provided, get all active years for the organization
                    result = await _yearService.GetActiveYearsByOrganizationAsync(strOrganizationGUID);
                }
                
                return Ok(new ApiResponse<List<YearSimpleResponseDto>>
                {
                    statusCode = 200,
                    Message = "Active years for organization retrieved successfully",
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
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = $"An error occurred while retrieving active years for the organization: {ex.Message}"
                });
            }
        }

        [HttpGet("export")]
        [Authorize]
        [AuthorizePermission("year", PermissionType.CanExport, "Year")]
        public async Task<IActionResult> ExportYears([FromQuery] string format)
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
                Guid groupGuid = Guid.Parse(groupGuidString);

                // Get organization GUID from user claims
                var organizationGuidString = User.FindFirst("strOrganizationGUID")?.Value;
                if (string.IsNullOrEmpty(organizationGuidString))
                {
                    return BadRequest(new {
                        statusCode = 400,
                        message = "Organization GUID not found in token"
                    });
                }
                Guid organizationGuid = Guid.Parse(organizationGuidString);
                
                (byte[] fileContents, string contentType, string fileName) = await _yearService.ExportYearsAsync(format, groupGuid, organizationGuid);

                // Ensure fileContents is not null
                if (fileContents == null)
                {
                    return StatusCode(500, new { statusCode = 500, message = "Export operation failed: null file contents" });
                }

                // Set appropriate headers for file download
                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                
                // Return the file
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                // For format exceptions, provide more helpful response
                if (ex is FormatException || ex.InnerException is FormatException)
                {
                    return BadRequest(new { 
                        statusCode = 400, 
                        message = "A formatting error occurred while exporting years. This may be due to invalid data in year records.",
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
