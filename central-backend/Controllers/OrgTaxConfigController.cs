using AuditSoftware.Attributes;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.OrgTaxConfig;
using AuditSoftware.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AuditSoftware.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrgTaxConfigController : ControllerBase
    {
        private readonly IOrgTaxConfigService _orgTaxConfigService;
        private readonly ILogger<OrgTaxConfigController> _logger;

        public OrgTaxConfigController(
            IOrgTaxConfigService orgTaxConfigService,
            ILogger<OrgTaxConfigController> logger)
        {
            _orgTaxConfigService = orgTaxConfigService ?? throw new ArgumentNullException(nameof(orgTaxConfigService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanView, "Organization")]
        public async Task<ActionResult<ApiResponse<PagedResponse<OrgTaxConfigResponseDto>>>> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool? isActive = null,
            [FromQuery] string? organizationGUID = null,
            [FromQuery] string? taxTypeGUID = null,
            [FromQuery] string? stateGUID = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true)
        {
            try
            {
                var filterDto = new OrgTaxConfigFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    IsActive = isActive,
                    OrganizationGUID = organizationGUID,
                    TaxTypeGUID = taxTypeGUID,
                    StateGUID = stateGUID,
                    SearchTerm = searchTerm,
                    SortBy = sortBy,
                    ascending = ascending
                };

                var result = await _orgTaxConfigService.GetAllAsync(filterDto);

                return Ok(new ApiResponse<PagedResponse<OrgTaxConfigResponseDto>>
                {
                    statusCode = 200,
                    Message = "Organization tax configurations retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving organization tax configurations");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving organization tax configurations"
                });
            }
        }

        [HttpGet("{guid}")]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanView, "Organization")]
        public async Task<ActionResult<ApiResponse<OrgTaxConfigResponseDto>>> GetById(string guid)
        {
            try
            {
                var result = await _orgTaxConfigService.GetByIdAsync(guid);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = "Organization tax configuration not found"
                    });
                }

                return Ok(new ApiResponse<OrgTaxConfigResponseDto>
                {
                    statusCode = 200,
                    Message = "Organization tax configuration retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving organization tax configuration {Guid}", guid);
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving organization tax configuration"
                });
            }
        }

        [HttpPost]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanSave, "Organization")]
        public async Task<ActionResult<ApiResponse<OrgTaxConfigResponseDto>>> Create(
            [FromBody] OrgTaxConfigCreateDto createDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid data provided",
                        Data = ModelState
                    });
                }

                var userGuid = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuid))
                {
                    return Unauthorized(new ApiResponse<object>
                    {
                        statusCode = 401,
                        Message = "User GUID not found in token"
                    });
                }

                var result = await _orgTaxConfigService.CreateAsync(createDto, userGuid);

                return CreatedAtAction(
                    nameof(GetById),
                    new { guid = result.strOrgTaxConfigGUID },
                    new ApiResponse<OrgTaxConfigResponseDto>
                    {
                        statusCode = 201,
                        Message = "Organization tax configuration created successfully",
                        Data = result
                    });
            }
            catch (Exceptions.BusinessException ex)
            {
                _logger.LogWarning(ex, "Business validation error creating organization tax configuration");
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating organization tax configuration");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while creating organization tax configuration"
                });
            }
        }

        [HttpPut("{guid}")]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanEdit, "Organization")]
        public async Task<ActionResult<ApiResponse<OrgTaxConfigResponseDto>>> Update(
            string guid,
            [FromBody] OrgTaxConfigUpdateDto updateDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Invalid data provided",
                        Data = ModelState
                    });
                }

                var result = await _orgTaxConfigService.UpdateAsync(guid, updateDto);

                if (result == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = "Organization tax configuration not found"
                    });
                }

                return Ok(new ApiResponse<OrgTaxConfigResponseDto>
                {
                    statusCode = 200,
                    Message = "Organization tax configuration updated successfully",
                    Data = result
                });
            }
            catch (Exceptions.BusinessException ex)
            {
                _logger.LogWarning(ex, "Business validation error updating organization tax configuration {Guid}", guid);
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating organization tax configuration {Guid}", guid);
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while updating organization tax configuration"
                });
            }
        }

        [HttpDelete("{guid}")]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanDelete, "Organization")]
        public async Task<ActionResult<ApiResponse<object>>> Delete(string guid)
        {
            try
            {
                var result = await _orgTaxConfigService.DeleteAsync(guid);

                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Organization tax configuration deleted successfully"
                });
            }
            catch (Exceptions.BusinessException ex)
            {
                _logger.LogWarning(ex, "Business validation error deleting organization tax configuration {Guid}", guid);
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting organization tax configuration {Guid}", guid);
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while deleting organization tax configuration"
                });
            }
        }

        [HttpGet("organization/{organizationGUID}/active")]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanView, "Organization")]
        public async Task<ActionResult<ApiResponse<List<OrgTaxConfigSimpleDto>>>> GetActiveByOrganization(string organizationGUID)
        {
            try
            {
                var result = await _orgTaxConfigService.GetActiveByOrganizationAsync(organizationGUID);

                return Ok(new ApiResponse<List<OrgTaxConfigSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active organization tax configurations retrieved successfully",
                    Data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active organization tax configurations for organization {OrganizationGUID}", organizationGUID);
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while retrieving active organization tax configurations"
                });
            }
        }

        [HttpGet("export")]
        [Authorize]
        [AuthorizePermission("organization_list", PermissionType.CanView, "Organization")]
        public async Task<IActionResult> Export(
            [FromQuery] string format = "excel",
            [FromQuery] bool? isActive = null,
            [FromQuery] string? organizationGUID = null,
            [FromQuery] string? taxTypeGUID = null,
            [FromQuery] string? stateGUID = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true)
        {
            try
            {
                var filterDto = new OrgTaxConfigFilterDto
                {
                    IsActive = isActive,
                    OrganizationGUID = organizationGUID,
                    TaxTypeGUID = taxTypeGUID,
                    StateGUID = stateGUID,
                    SearchTerm = searchTerm,
                    SortBy = sortBy,
                    ascending = ascending,
                    PageNumber = 1,
                    PageSize = int.MaxValue
                };

                var (fileContents, contentType, fileName) = await _orgTaxConfigService.ExportAsync(format, filterDto);
                return File(fileContents, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting organization tax configurations");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while exporting organization tax configurations"
                });
            }
        }
    }
}
