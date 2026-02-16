using AuditSoftware.Attributes;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Organization;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using AuditSoftware.Data;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrganizationController : BaseDeletionController<Models.Entities.MstOrganization>
    {
        private readonly IOrganizationService _organizationService;
        private new readonly ILogger<OrganizationController> _logger;
        private readonly AppDbContext _context;

        public OrganizationController(
            IOrganizationService organizationService,
            ILogger<OrganizationController> logger,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<Models.Entities.MstOrganization>> baseLogger,
            AppDbContext context)
            : base(deleteValidationService, baseLogger)
        {
            _organizationService = organizationService ?? throw new ArgumentNullException(nameof(organizationService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanView, "Organization")]
        public async Task<ActionResult<ApiResponse<PagedResponse<OrganizationResponseDto>>>> GetAllOrganizations(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true,
            [FromQuery] bool? bolIsActive = null,
            [FromQuery(Name = "strIndustryGUID")] string? industryGUID = null,
            [FromQuery(Name = "strLegalStatusTypeGUID")] string? legalStatusTypeGUID = null,
            [FromQuery(Name = "strParentOrganizationGUID")] string? parentOrganizationGUID = null,
            [FromQuery(Name = "strCreatedByGUIDs")] string[]? createdByGUIDs = null,
            [FromQuery(Name = "strUpdatedByGUIDs")] string[]? updatedByGUIDs = null
        )
        {
            try
            {
                var groupGuid = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(groupGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Group GUID not found in token"
                    });
                }

                // Convert string GUIDs to Guid objects
                Guid groupGuidObj;
                if (!Guid.TryParse(groupGuid, out groupGuidObj))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid Group GUID format"
                    });
                }

                // Parse optional filter GUIDs
                Guid? industryGuidObj = null;
                Guid? legalStatusTypeGuidObj = null;
                Guid? parentOrganizationGuidObj = null;

                if (!string.IsNullOrEmpty(industryGUID) && !Guid.TryParse(industryGUID, out Guid industryGuidTemp))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid Industry GUID format"
                    });
                }
                else if (!string.IsNullOrEmpty(industryGUID))
                {
                    industryGuidObj = Guid.Parse(industryGUID);
                }

                if (!string.IsNullOrEmpty(legalStatusTypeGUID) && !Guid.TryParse(legalStatusTypeGUID, out Guid legalStatusGuidTemp))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid Legal Status Type GUID format"
                    });
                }
                else if (!string.IsNullOrEmpty(legalStatusTypeGUID))
                {
                    legalStatusTypeGuidObj = Guid.Parse(legalStatusTypeGUID);
                }

                if (!string.IsNullOrEmpty(parentOrganizationGUID) && !Guid.TryParse(parentOrganizationGUID, out Guid parentOrgGuidTemp))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid Parent Organization GUID format"
                    });
                }
                else if (!string.IsNullOrEmpty(parentOrganizationGUID))
                {
                    parentOrganizationGuidObj = Guid.Parse(parentOrganizationGUID);
                }
                
                // Convert CreatedByGUIDs and UpdatedByGUIDs from string to Guid lists
                List<Guid>? createdByGuidsObj = null;
                List<Guid>? updatedByGuidsObj = null;
                
                if (createdByGUIDs != null && createdByGUIDs.Any())
                {
                    createdByGuidsObj = createdByGUIDs.Select(g => Guid.Parse(g)).ToList();
                }
                
                if (updatedByGUIDs != null && updatedByGUIDs.Any())
                {
                    updatedByGuidsObj = updatedByGUIDs.Select(g => Guid.Parse(g)).ToList();
                }

                var filterDto = new OrganizationFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    Search = search,
                    SortBy = sortBy,
                    ascending = ascending,
                    bolIsActive = bolIsActive,
                    GroupGUID = groupGuidObj,
                    // Optional filters
                    IndustryGUID = industryGuidObj,
                    LegalStatusTypeGUID = legalStatusTypeGuidObj,
                    ParentOrganizationGUID = parentOrganizationGuidObj,
                    // User filters
                    CreatedByGUIDs = createdByGuidsObj,
                    UpdatedByGUIDs = updatedByGuidsObj
                };
                // Get timezone from user claims
                var userTimezone = HttpContext.GetUserTimeZone();
                _logger.LogInformation($"Using timezone: {userTimezone} for organizations list");

                var result = await _organizationService.GetAllOrganizationsAsync(filterDto, userTimezone);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Organizations retrieved successfully",
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
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = $"An error occurred while retrieving organizations: {ex.Message}"
                });
            }
        }

        [HttpGet("{guid}")]
        [Authorize]
        [AuthorizePermission("organization_form", PermissionType.CanView, "Organization")]
        public async Task<ActionResult<ApiResponse<OrganizationResponseDto>>> GetOrganization(Guid guid)
        {
            // Get timezone from user claims
            var userTimezone = HttpContext.GetUserTimeZone();
            _logger.LogInformation($"Using timezone: {userTimezone} for organization display");
            
            var organization = await _organizationService.GetOrganizationByIdAsync(guid, userTimezone);
            if (organization == null)
                return NotFound(ApiResponse<OrganizationResponseDto>.Fail(404, $"Organization with GUID {guid} not found"));

            return Ok(ApiResponse<OrganizationResponseDto>.Success(organization, "Organization retrieved successfully"));
        }

        [HttpPost]
        [Authorize]
        [AuthorizePermission("organization_form", PermissionType.CanSave, "Organization")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ApiResponse<OrganizationResponseDto>>> CreateOrganization(
            [FromForm] OrganizationCreateDto organizationDto)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join(", ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = $"Invalid data provided: {errors}"
                });
            }

            try
            {
                // Log all claims for debugging
                _logger.LogInformation("Claims in the request:");
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
                }
                
                var groupGuidString = User.FindFirst("strGroupGUID")?.Value;
                var createdByGuidString = User.FindFirst("strUserGUID")?.Value;
                var userRoleGuidString = User.FindFirst("strRoleGUID")?.Value; // Fix: Use strRoleGUID instead of strUserRoleGUID to match token
                var yearGuidString = User.FindFirst("strYearGUID")?.Value; // Get the year GUID from the token
                var moduleGuidString = User.FindFirst("strModuleGUID")?.Value; // Get the module GUID from the token
                
                _logger.LogInformation($"Found groupGuid: {groupGuidString ?? "null"}");
                _logger.LogInformation($"Found createdByGuid: {createdByGuidString ?? "null"}");
                _logger.LogInformation($"Found userRoleGuid: {userRoleGuidString ?? "null"}");
                _logger.LogInformation($"Found yearGuid: {yearGuidString ?? "null"}");
                _logger.LogInformation($"Found moduleGuid: {moduleGuidString ?? "null"}");

                if (string.IsNullOrEmpty(groupGuidString))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Group GUID is required"
                    });
                }

                if (string.IsNullOrEmpty(createdByGuidString))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Created by GUID is required"
                    });
                }

                // Convert string GUIDs to Guid objects
                Guid createdByGuid = Guid.Parse(createdByGuidString);
                Guid groupGuid = Guid.Parse(groupGuidString);
                
                // Parse optional GUIDs, which might be null
                Guid? userRoleGuid = !string.IsNullOrEmpty(userRoleGuidString) ? Guid.Parse(userRoleGuidString) : null;
                Guid? yearGuid = !string.IsNullOrEmpty(yearGuidString) ? Guid.Parse(yearGuidString) : null;
                Guid? moduleGuid = !string.IsNullOrEmpty(moduleGuidString) ? Guid.Parse(moduleGuidString) : null;

                // Pass the user role GUID, year GUID, and module GUID to ensure the correct role, currency, and module are assigned
                var createdOrganization = await _organizationService.CreateOrganizationAsync(
                    organizationDto, 
                    createdByGuid, 
                    groupGuid, 
                    userRoleGuid, 
                    yearGuid, 
                    moduleGuid);

                return Created($"api/Organization/{createdOrganization.strOrganizationGUID}", new ApiResponse<OrganizationResponseDto>
                {
                    statusCode = 201,
                    Message = "Organization created successfully",
                    Data = createdOrganization
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
                    Message = $"An error occurred while creating the organization: {ex.Message}"
                });
            }
        }

        [HttpPut("{guid}")]
        [Authorize]
        [AuthorizePermission("organization_form", PermissionType.CanEdit, "Organization")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ApiResponse<OrganizationResponseDto>>> UpdateOrganization(Guid guid, [FromForm] OrganizationUpdateDto organizationDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<OrganizationResponseDto>.Fail(400, "Invalid request data"));

            var updatedByGuidString = User.FindFirst("strUserGUID")?.Value;
            var groupGuidString = User.FindFirst("strGroupGUID")?.Value;
            var organizationFromToken = User.FindFirst("strOrganizationGUID")?.Value;

            if (string.IsNullOrEmpty(updatedByGuidString) || string.IsNullOrEmpty(groupGuidString))
                return BadRequest(ApiResponse<OrganizationResponseDto>.Fail(400, "User or group information not found in token"));

            try
            {
                // Convert string GUIDs to Guid objects
                Guid updatedByGuid = Guid.Parse(updatedByGuidString);
                Guid groupGuid = Guid.Parse(groupGuidString);
                
                var organization = await _organizationService.UpdateOrganizationAsync(guid, organizationDto, updatedByGuid, groupGuid);
                if (organization == null)
                    return NotFound(ApiResponse<OrganizationResponseDto>.Fail(404, $"Organization with GUID {guid} not found"));

                return Ok(ApiResponse<OrganizationResponseDto>.Success(organization, "Organization updated successfully"));
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<OrganizationResponseDto>.Fail(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating organization {Guid}", guid);
                return StatusCode(500, ApiResponse<OrganizationResponseDto>.Fail(500, "An error occurred while updating the organization"));
            }
        }
        
        [HttpDelete("{guid}")]
        [Authorize]
        [AuthorizePermission("organization_form", PermissionType.CanDelete, "Organization")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteOrganization(Guid guid)
        {
            var groupGuidString = User.FindFirst("strGroupGUID")?.Value;
            if (string.IsNullOrEmpty(groupGuidString))
                return BadRequest(ApiResponse<bool>.Fail(400, "Group information not found in token"));

            Guid groupGuid;
            if (!Guid.TryParse(groupGuidString, out groupGuid))
                return BadRequest(ApiResponse<bool>.Fail(400, "Invalid group GUID format in token"));

            return await SafeDeleteAsync(
                guid,
                "Organization",
                async (id) => await _organizationService.DeleteOrganizationAsync(id, groupGuid));
        }

        [HttpGet("diagnostics/picklists/{guid}")]
        [Authorize]
        public async Task<IActionResult> CheckPickListValue(Guid guid)
        {
            try
            {
                // Try to get the picklist value
                var pickListValue = await _context.MstPickListValues
                    .FirstOrDefaultAsync(p => p.strPickListValueGUID == guid);

                if (pickListValue != null)
                {
                    return Ok(new
                    {
                        PicklistFound = true,
                        Value = pickListValue.strValue,
                        GUID = pickListValue.strPickListValueGUID.ToString()
                    });
                }
                else
                {
                    // Try to find using string representation
                    var guidString = guid.ToString();
                    var allPickListValues = await _context.MstPickListValues.ToListAsync();
                    var matches = allPickListValues
                        .Where(p => p.strPickListValueGUID.ToString() == guidString)
                        .Select(p => new { GUID = p.strPickListValueGUID, Value = p.strValue })
                        .ToList();

                    return Ok(new
                    {
                        PicklistFound = false,
                        GuidSearched = guid.ToString(),
                        PossibleMatches = matches,
                        AllPickListCount = allPickListValues.Count
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Error = ex.Message,
                    StackTrace = ex.StackTrace
                });
            }
        }

        [HttpGet("parent-organization")]
        [Authorize]
        public async Task<IActionResult> GetParentOrganizations([FromQuery] string strOrganizationGUID, [FromQuery] string? search = null)
        {
            try
            {
                // Get group GUID from token
                var groupGuid = User?.FindFirst("strGroupGUID")?.Value;

                if (string.IsNullOrEmpty(groupGuid))
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Group identifier not found in token"
                    });
                }

                // Use the provided organization GUID directly (it's now required)
                var orgGuidToExclude = strOrganizationGUID;
                
                _logger.LogInformation(
                    "Parent organizations request - Using organization GUID: {OrgGuid} (From query param)",
                    orgGuidToExclude);
                
                if (string.IsNullOrEmpty(orgGuidToExclude))
                {
                    _logger.LogWarning("Organization GUID cannot be empty");
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "strOrganizationGUID is required"
                    });
                }

                // Parse string GUIDs to Guid objects
                Guid orgGuidToExcludeObj;
                Guid groupGuidObj;

                if (!Guid.TryParse(orgGuidToExclude, out orgGuidToExcludeObj))
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid organization GUID format" });
                }

                if (!Guid.TryParse(groupGuid, out groupGuidObj))
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid group GUID format" });
                }

                // Create base query for organizations
                var query = _context.MstOrganizations
                    .Where(o => 
                        o.strOrganizationGUID != orgGuidToExcludeObj && // Different from specified org
                        o.strGroupGUID == groupGuidObj && // Same group as user
                        o.bolIsActive == true); // Must be active
                
                // Apply search filter if provided
                if (!string.IsNullOrWhiteSpace(search))
                {
                    string searchLower = search.ToLower();
                    query = query.Where(o => 
                        o.strOrganizationName.ToLower().Contains(searchLower) || 
                        (o.strDescription != null && o.strDescription.ToLower().Contains(searchLower)));
                    
                    _logger.LogInformation("Applying search filter: {SearchTerm}", search);
                }
                
                // Execute query and transform results
                var organizations = await query
                    .Select(o => new
                    {
                        strOrganizationGUID = o.strOrganizationGUID,
                        strOrganizationName = o.strOrganizationName
                    })
                    .ToListAsync();

                if (organizations == null || !organizations.Any())
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "No parent organizations found",
                        data = new object[] { }
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Parent organizations retrieved successfully",
                    data = organizations,
                    totalCount = organizations.Count,
                    excludedOrganizationGUID = orgGuidToExclude,
                    searchTerm = search
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving parent organizations");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving parent organizations",
                    error = ex.Message
                });
            }
        }

        [HttpGet("active")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<List<OrganizationResponseDto>>>> GetActiveOrganizations()
        {
            try
            {
                var groupGuidString = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(groupGuidString))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Group GUID not found in token"
                    });
                }

                Guid groupGuid;
                if (!Guid.TryParse(groupGuidString, out groupGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid Group GUID format in token"
                    });
                }

                var result = await _organizationService.GetActiveOrganizationsAsync(groupGuid);
                return Ok(new ApiResponse<List<OrganizationResponseDto>>
                {
                    statusCode = 200,
                    Message = "Active organizations retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active organizations");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = $"An error occurred while retrieving active organizations: {ex.Message}"
                });
            }
        }

        [HttpGet("export")]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanExport, "Organization")]
        public async Task<IActionResult> ExportOrganizations([FromQuery] string format)
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
                var groupGuidString = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(groupGuidString))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Group GUID not found in token"
                    });
                }

                Guid groupGuid;
                if (!Guid.TryParse(groupGuidString, out groupGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid Group GUID format in token"
                    });
                }


                // Use explicit types for deconstruction
                (byte[] fileContents, string contentType, string fileName) = await _organizationService.ExportOrganizationsAsync(format, groupGuid);

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
                _logger.LogError(ex, "Error occurred during organization export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }

        [HttpGet("exchange-rate")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<ExchangeRateResponseDto>>> GetExchangeRate(
            [FromQuery] string strFromCurrencyGUID)
        {
            try
            {
                // Get organization GUID from token
                var organizationGuidStr = User.FindFirst("strOrganizationGUID")?.Value;
                if (string.IsNullOrEmpty(organizationGuidStr))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Organization GUID not found in token"
                    });
                }

                if (!Guid.TryParse(organizationGuidStr, out Guid organizationGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid Organization GUID format"
                    });
                }

                if (!Guid.TryParse(strFromCurrencyGUID, out Guid currencyGuid))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid Currency Type GUID format"
                    });
                }

                var exchangeRate = await _organizationService.GetExchangeRateAsync(currencyGuid, organizationGuid);

                if (exchangeRate == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = "Could not retrieve exchange rate"
                    });
                }

                return Ok(new ApiResponse<ExchangeRateResponseDto>
                {
                    statusCode = 200,
                    Message = "Exchange rate retrieved successfully",
                    Data = exchangeRate
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while getting exchange rate");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}

