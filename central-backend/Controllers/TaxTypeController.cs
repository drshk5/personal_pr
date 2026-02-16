using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.TaxType;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize(Policy = "SuperAdminOnly")]
    [ApiController]
    [Route("api/[controller]")]
    public class TaxTypeController : BaseDeletionController<Models.Entities.MstTaxType>
    {
        private readonly ITaxTypeService _taxTypeService;

        public TaxTypeController(
            ITaxTypeService taxTypeService,
            IDeleteValidationService deleteValidationService,
            Microsoft.Extensions.Logging.ILogger<BaseDeletionController<Models.Entities.MstTaxType>> logger)
            : base(deleteValidationService, logger)
        {
            _taxTypeService = taxTypeService ?? throw new ArgumentNullException(nameof(taxTypeService));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaxTypeCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _taxTypeService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<TaxTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Tax type created successfully",
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
        public async Task<IActionResult> GetAll([FromQuery] TaxTypeFilterDto filterDto)
        {
            try
            {
                var result = await _taxTypeService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Tax types retrieved successfully",
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
                var result = await _taxTypeService.GetByIdAsync(guid);
                return Ok(new ApiResponse<TaxTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Tax type retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return NotFound(new ApiResponse<object> { statusCode = 404, Message = ex.Message });
            }
        }

        [HttpPut("{guid}")]
        public async Task<IActionResult> Update(string guid, [FromBody] TaxTypeUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _taxTypeService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<TaxTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Tax type updated successfully",
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
                _logger.LogInformation($"Validating and deleting TaxType with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "Tax Type",
                    async (id) => await _taxTypeService.DeleteAsync(id.ToString()));
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
        public async Task<IActionResult> GetActiveTaxTypes([FromQuery] string? search = null, [FromQuery] string? strCountryGUID = null)
        {
            try
            {
                // If country GUID is provided, return tax type for that country
                if (!string.IsNullOrEmpty(strCountryGUID))
                {
                    var taxType = await _taxTypeService.GetByCountryGuidAsync(strCountryGUID);
                    
                    if (taxType == null)
                    {
                        return Ok(new ApiResponse<TaxTypeSimpleDto?>
                        {
                            statusCode = 200,
                            Message = "No active tax type found for the specified country",
                            Data = null
                        });
                    }
                    
                    return Ok(new ApiResponse<TaxTypeSimpleDto>
                    {
                        statusCode = 200,
                        Message = "Tax type retrieved successfully",
                        Data = taxType
                    });
                }
                
                // Otherwise, return all active tax types with optional search
                var result = await _taxTypeService.GetActiveTaxTypesAsync(search!);
                
                return Ok(new ApiResponse<List<TaxTypeSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active tax types retrieved successfully",
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
        public async Task<IActionResult> ExportTaxTypes([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _taxTypeService.ExportTaxTypesAsync(format);

                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during tax type export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
