using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.TaxRate;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.Controllers
{
    [Authorize(Policy = "SuperAdminOnly")]
    [ApiController]
    [Route("api/[controller]")]
    public class TaxRateController : BaseDeletionController<Models.Entities.MstTaxRate>
    {
        private readonly ITaxRateService _taxRateService;

        public TaxRateController(
            ITaxRateService taxRateService,
            IDeleteValidationService deleteValidationService,
            Microsoft.Extensions.Logging.ILogger<BaseDeletionController<Models.Entities.MstTaxRate>> logger)
            : base(deleteValidationService, logger)
        {
            _taxRateService = taxRateService ?? throw new ArgumentNullException(nameof(taxRateService));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaxRateCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _taxRateService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<TaxRateResponseDto>
                {
                    statusCode = 200,
                    Message = "Tax rate created successfully",
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
        public async Task<IActionResult> GetAll([FromQuery] TaxRateFilterDto filterDto)
        {
            try
            {
                var result = await _taxRateService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Tax rates retrieved successfully",
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
                var result = await _taxRateService.GetByIdAsync(guid);
                return Ok(new ApiResponse<TaxRateResponseDto>
                {
                    statusCode = 200,
                    Message = "Tax rate retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return NotFound(new ApiResponse<object> { statusCode = 404, Message = ex.Message });
            }
        }

        [HttpPut("{guid}")]
        public async Task<IActionResult> Update(string guid, [FromBody] TaxRateUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _taxRateService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<TaxRateResponseDto>
                {
                    statusCode = 200,
                    Message = "Tax rate updated successfully",
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
                _logger.LogInformation($"Validating and deleting TaxRate with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "Tax Rate",
                    async (id) => await _taxRateService.DeleteAsync(id.ToString()));
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
        public async Task<IActionResult> GetActiveTaxRates(
            [FromQuery(Name = "strTaxTypeGUID")] [Required] string strTaxTypeGUID,
            [FromQuery(Name = "search")] string? search = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(strTaxTypeGUID))
                {
                    return BadRequest(new ApiResponse<object> { statusCode = 400, Message = "Tax Type GUID (strTaxTypeGUID) is required" });
                }

                var result = await _taxRateService.GetActiveTaxRatesAsync(search, strTaxTypeGUID);
                
                return Ok(new ApiResponse<List<TaxRateSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active tax rates retrieved successfully",
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
        public async Task<IActionResult> ExportTaxRates([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _taxRateService.ExportTaxRatesAsync(format);

                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during tax rate export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
