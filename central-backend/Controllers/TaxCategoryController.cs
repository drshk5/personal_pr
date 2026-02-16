using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.TaxCategory;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.Controllers
{
    [Authorize(Policy = "SuperAdminOnly")]
    [ApiController]
    [Route("api/[controller]")]
    public class TaxCategoryController : BaseDeletionController<MstTaxCategory>
    {
        private readonly ITaxCategoryService _taxCategoryService;

        public TaxCategoryController(
            ITaxCategoryService taxCategoryService,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<MstTaxCategory>> logger)
            : base(deleteValidationService, logger)
        {
            _taxCategoryService = taxCategoryService;
        }

        /// <summary>
        /// Create a new tax category
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ApiResponse<TaxCategoryResponseDto>>> Create([FromBody] TaxCategoryCreateDto dto)
        {
            try
            {
                var createdByGuid = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGuid))
                    return BadRequest(new ApiResponse<object> { statusCode = 400, Message = "User GUID not found in token" });

                var result = await _taxCategoryService.CreateAsync(dto, createdByGuid);
                
                return Ok(new ApiResponse<TaxCategoryResponseDto> 
                { 
                    statusCode = 200, 
                    Message = "Tax category created successfully", 
                    Data = result 
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        /// <summary>
        /// Get all tax categories with filtering and pagination
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ApiResponse<PagedResponse<TaxCategoryResponseDto>>>> GetAll([FromQuery] TaxCategoryFilterDto filter)
        {
            try
            {
                var result = await _taxCategoryService.GetAllAsync(filter);
                
                return Ok(new ApiResponse<PagedResponse<TaxCategoryResponseDto>> 
                { 
                    statusCode = 200, 
                    Message = "Tax categories retrieved successfully", 
                    Data = result 
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        /// <summary>
        /// Get tax category by GUID
        /// </summary>
        [HttpGet("{guid}")]
        public async Task<ActionResult<ApiResponse<TaxCategoryResponseDto>>> GetById(string guid)
        {
            try
            {
                var result = await _taxCategoryService.GetByIdAsync(guid);
                
                return Ok(new ApiResponse<TaxCategoryResponseDto> 
                { 
                    statusCode = 200, 
                    Message = "Tax category retrieved successfully", 
                    Data = result 
                });
            }
            catch (BusinessException ex)
            {
                return NotFound(new ApiResponse<object> { statusCode = 404, Message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing tax category by GUID
        /// </summary>
        [HttpPut("{guid}")]
        public async Task<ActionResult<ApiResponse<TaxCategoryResponseDto>>> Update(string guid, [FromBody] TaxCategoryUpdateDto dto)
        {
            try
            {
                var updatedByGuid = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGuid))
                    return BadRequest(new ApiResponse<object> { statusCode = 400, Message = "User GUID not found in token" });

                var result = await _taxCategoryService.UpdateAsync(guid, dto, updatedByGuid);
                
                return Ok(new ApiResponse<TaxCategoryResponseDto> 
                { 
                    statusCode = 200, 
                    Message = "Tax category updated successfully", 
                    Data = result 
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        /// <summary>
        /// Delete a tax category (soft delete) by GUID
        /// </summary>
        [HttpDelete("{guid}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(string guid)
        {
            try
            {
                var result = await _taxCategoryService.DeleteAsync(guid);
                
                return Ok(new ApiResponse<bool> 
                { 
                    statusCode = 200, 
                    Message = "Tax category deleted successfully", 
                    Data = result 
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        /// <summary>
        /// Get active tax categories for dropdown (required tax type filter)
        /// </summary>
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<List<TaxCategorySimpleDto>>>> GetActiveTaxCategories(
            [FromQuery(Name = "strTaxTypeGUID")] [Required] string strTaxTypeGUID,
            [FromQuery(Name = "search")] string? search = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(strTaxTypeGUID))
                {
                    return BadRequest(new ApiResponse<object> { statusCode = 400, Message = "Tax Type GUID (strTaxTypeGUID) is required" });
                }

                var result = await _taxCategoryService.GetActiveTaxCategoriesAsync(strTaxTypeGUID, search);
                
                return Ok(new ApiResponse<List<TaxCategorySimpleDto>> 
                { 
                    statusCode = 200, 
                    Message = "Active tax categories retrieved successfully", 
                    Data = result 
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        /// <summary>
        /// Export tax categories to Excel or CSV
        /// </summary>
        [HttpPost("export/{format}")]
        public async Task<IActionResult> Export(string format, [FromBody] TaxCategoryFilterDto filter)
        {
            try
            {
                var (fileContents, contentType, fileName) = await _taxCategoryService.ExportTaxCategoriesAsync(format, filter);
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }
    }
}
