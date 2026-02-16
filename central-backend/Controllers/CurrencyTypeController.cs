using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.CurrencyType;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Models.Entities;
using Microsoft.Extensions.Logging;
using System.Linq;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CurrencyTypeController : BaseDeletionController<MstCurrencyType>
    {
        private readonly ICurrencyTypeService _currencyTypeService;

        public CurrencyTypeController(
            ICurrencyTypeService currencyTypeService,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<MstCurrencyType>> logger)
            : base(deleteValidationService, logger)
        {
            _currencyTypeService = currencyTypeService ?? throw new ArgumentNullException(nameof(currencyTypeService));
        }

        [HttpPost]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Create([FromBody] CurrencyTypeCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _currencyTypeService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<CurrencyTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Currency type created successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> GetAll([FromQuery] CurrencyTypeFilterDto filterDto)
        {
            try
            {
                var result = await _currencyTypeService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Currency types retrieved successfully",
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
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var result = await _currencyTypeService.GetByIdAsync(guid);
                return Ok(new ApiResponse<CurrencyTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Currency type retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpPut("{guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Update(string guid, [FromBody] CurrencyTypeUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _currencyTypeService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<CurrencyTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Currency type updated successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpDelete("{guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                // Use SafeDeleteAsync to validate and perform the deletion
                _logger.LogInformation($"Validating and deleting Currency Type with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "Currency Type",
                    async (id) => await _currencyTypeService.DeleteAsync(id.ToString()));
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
        [Authorize]
        public async Task<IActionResult> GetActiveCurrencyTypes([FromQuery] string? search = null)
        {
            try
            {
                var result = await _currencyTypeService.GetActiveCurrencyTypesAsync(search!);
                
                return Ok(new ApiResponse<List<CurrencyTypeSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active currency types retrieved successfully",
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
        public async Task<IActionResult> ExportCurrencyTypes([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _currencyTypeService.ExportCurrencyTypesAsync(format);

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
                _logger.LogError(ex, "Error occurred during currency type export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
