using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.PicklistValue;
using AuditSoftware.Interfaces;
using AuditSoftware.Attributes;
using System.Security.Claims;
using System.Collections.Generic;
using System.Linq;
using AuditSoftware.Helpers;
using AuditSoftware.Exceptions;
using AuditSoftware.DTOs.Common;
using Microsoft.Extensions.Logging;
using AuditSoftware.Models.Entities;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PicklistValueController : BaseDeletionController<MstPickListValue>
    {
        private readonly IPicklistValueService _picklistValueService;
        private new readonly ILogger<PicklistValueController> _logger;

        public PicklistValueController(
            IPicklistValueService picklistValueService,
            ILogger<PicklistValueController> logger,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<MstPickListValue>> baseLogger)
            : base(deleteValidationService, baseLogger)
        {
            _picklistValueService = picklistValueService ?? throw new ArgumentNullException(nameof(picklistValueService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        [AuthorizePermission("picklist_value_list", PermissionType.CanView, "PicklistValue")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery(Name = "strPicklistTypeGUIDs")] string? picklistTypeGUIDs = null,
            [FromQuery] bool? bolIsActive = null,
            [FromQuery(Name = "strCreatedByGUIDs")] string? createdByGUIDs = null,
            [FromQuery(Name = "strUpdatedByGUIDs")] string? updatedByGUIDs = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(groupGUID))
                    return Unauthorized(new
                    {
                        statusCode = 401,
                        message = "Group GUID not found in token"
                    });

                var filterDto = new PicklistValueFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    Search = search,
                    SortBy = sortBy,
                    ascending = ascending,
                    bolIsActive = bolIsActive,
                    PicklistTypeGUIDs = !string.IsNullOrWhiteSpace(picklistTypeGUIDs) 
                        ? picklistTypeGUIDs.Split(',').Select(x => x.Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToList()
                        : null,
                    CreatedByGUIDs = !string.IsNullOrWhiteSpace(createdByGUIDs)
                        ? createdByGUIDs.Split(',').Select(x => x.Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToList()
                        : null,
                    UpdatedByGUIDs = !string.IsNullOrWhiteSpace(updatedByGUIDs)
                        ? updatedByGUIDs.Split(',').Select(x => x.Trim()).Where(x => !string.IsNullOrWhiteSpace(x)).ToList()
                        : null,
                    strGroupGUID = groupGUID
                };

                var response = await _picklistValueService.GetAllAsync(filterDto);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Picklist values retrieved successfully",
                    data = new
                    {
                        items = response.Items,
                        totalCount = response.TotalCount,
                        pageNumber = response.PageNumber,
                        pageSize = response.PageSize,
                        totalPages = response.TotalPages,
                        hasPrevious = response.HasPrevious,
                        hasNext = response.HasNext
                    }
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving picklist values"
                });
            }
        }

        [HttpGet("{guid}")]
        [AuthorizePermission("picklist_value_form", PermissionType.CanView, "PicklistValue")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var response = await _picklistValueService.GetByIdAsync(guid);
                if (response == null)
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Picklist value not found"
                    });

                return Ok(new
                {
                    statusCode = 200,
                    message = "Picklist value retrieved successfully",
                    data = response
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving the picklist value"
                });
            }
        }

        [HttpPost]
        [AuthorizePermission("picklist_value_form", PermissionType.CanSave, "PicklistValue")]
        public async Task<IActionResult> Create([FromBody] PicklistValueCreateDto createDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(groupGUID) || string.IsNullOrEmpty(createdByGUID))
                    return Unauthorized(new
                    {
                        statusCode = 401,
                        message = "Required claims not found in token"
                    });

                var response = await _picklistValueService.CreateAsync(createDto, createdByGUID, groupGUID);
                return CreatedAtAction(nameof(GetById), new { guid = response.strPickListValueGUID }, new
                {
                    statusCode = 201,
                    message = "Picklist value created successfully",
                    data = response
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while creating the picklist value"
                });
            }
        }

        [HttpPut("{guid}")]
        [AuthorizePermission("picklist_value_form", PermissionType.CanEdit, "PicklistValue")]
        public async Task<IActionResult> Update(string guid, [FromBody] PicklistValueUpdateDto updateDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(groupGUID) || string.IsNullOrEmpty(updatedByGUID))
                    return Unauthorized(new
                    {
                        statusCode = 401,
                        message = "Required claims not found in token"
                    });

                var response = await _picklistValueService.UpdateAsync(guid, updateDto, updatedByGUID, groupGUID);
                if (response == null)
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Picklist value not found"
                    });

                return Ok(new
                {
                    statusCode = 200,
                    message = "Picklist value updated successfully",
                    data = response
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while updating the picklist value"
                });
            }
        }

        [HttpDelete("{guid}")]
        [AuthorizePermission("picklist_value_form", PermissionType.CanDelete, "PicklistValue")]
        public async Task<IActionResult> Delete(string guid)
        {
            return await SafeDeleteAsync(
                GuidHelper.ToGuid(guid),
                "Picklist Value",
                async (id) => await _picklistValueService.DeleteAsync(id.ToString()));
        }

        [HttpGet("active-by-type/{strType}")]
        public async Task<IActionResult> GetActivePicklistValuesByType(string strType, [FromQuery] string? search = null)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                
#pragma warning disable CS8604 // Possible null reference argument.
                var result = await _picklistValueService.GetActivePicklistValuesByTypeAsync(
                    strType, 
                    search, 
                    groupGUID);
#pragma warning restore CS8604 // Possible null reference argument.
                
                return Ok(new ApiResponse<List<PicklistValueSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active picklist values retrieved successfully",
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
                    Message = "An error occurred while retrieving picklist values"
                });
            }
        }

        [HttpGet("export")]
        [Authorize]
        [AuthorizePermission("picklist_value_list", PermissionType.CanExport, "PicklistValue")]
        public async Task<IActionResult> ExportPicklistValues([FromQuery] string format)
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
                var groupGuid = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(groupGuid))
                {
                    return BadRequest(new {
                        statusCode = 400,
                        message = "Group GUID not found in token"
                    });
                }
                
                _logger.LogInformation("Exporting picklist values for group GUID: {GroupGuid} in format: {Format}", groupGuid, format);
                
                var (fileContents, contentType, fileName) = await _picklistValueService.ExportPicklistValuesAsync(format, groupGuid);
                
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
                _logger.LogWarning("Business exception during picklist values export: {Message}", ex.Message);
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception with detailed information
                _logger.LogError(ex, "Error occurred during picklist values export. Type: {ExceptionType}, Message: {Message}", 
                    ex.GetType().Name, ex.Message);
                
                // For format exceptions, provide more helpful response
                if (ex is FormatException || ex.InnerException is FormatException)
                {
                    return BadRequest(new { 
                        statusCode = 400, 
                        message = "A formatting error occurred while exporting picklist values. This may be due to invalid data in records.",
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


