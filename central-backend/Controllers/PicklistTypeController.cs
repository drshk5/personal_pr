using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.PicklistType;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using System.Security.Claims;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize(Policy = "SuperAdminOnly")]
    [ApiController]
    [Route("api/[controller]")]
    public class PicklistTypeController : BaseDeletionController<Models.Entities.MstPicklistType>
    {
        private readonly IPicklistTypeService _picklistTypeService;

        public PicklistTypeController(
            IPicklistTypeService picklistTypeService,
            IDeleteValidationService deleteValidationService,
            Microsoft.Extensions.Logging.ILogger<BaseDeletionController<Models.Entities.MstPicklistType>> logger)
            : base(deleteValidationService, logger)
        {
            _picklistTypeService = picklistTypeService ?? throw new ArgumentNullException(nameof(picklistTypeService));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PicklistTypeCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _picklistTypeService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<PicklistTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Picklist type created successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAll([FromQuery] PicklistTypeFilterDto filterDto)
        {
            try
            {
                var result = await _picklistTypeService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Picklist types retrieved successfully",
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
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("{guid}")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var result = await _picklistTypeService.GetByIdAsync(guid);
                return Ok(new ApiResponse<PicklistTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Picklist type retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpPut("{guid}")]
        public async Task<IActionResult> Update(string guid, [FromBody] PicklistTypeUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _picklistTypeService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<PicklistTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Picklist type updated successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpDelete("{guid}")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                // Use SafeDeleteAsync to validate and perform the deletion
                _logger.LogInformation($"Validating and deleting PicklistType with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "Picklist Type",
                    async (id) => await _picklistTypeService.DeleteAsync(id.ToString()));
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
        [AllowAnonymous]
        public async Task<IActionResult> GetActivePicklistTypes([FromQuery] string? search = null)
        {
            try
            {
                // Suppress the nullable warning with the null-forgiving operator since we know this method handles null
                var result = await _picklistTypeService.GetActivePicklistTypesAsync(search!);
                
                return Ok(new ApiResponse<List<PicklistTypeSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active picklist types retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("export")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ExportPicklistTypes([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _picklistTypeService.ExportPicklistTypesAsync(format);

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
                _logger.LogError(ex, "Error occurred during picklist type export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
