using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.AddressType;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Models.Entities;
using System.Linq;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AddressTypeController : BaseDeletionController<MstAddressType>
    {
        private readonly IAddressTypeService _addressTypeService;

        public AddressTypeController(
            IAddressTypeService addressTypeService,
            IDeleteValidationService deleteValidationService,
            Microsoft.Extensions.Logging.ILogger<BaseDeletionController<MstAddressType>> logger)
            : base(deleteValidationService, logger)
        {
            _addressTypeService = addressTypeService ?? throw new ArgumentNullException(nameof(addressTypeService));
        }

        [Authorize(Policy = "SuperAdminOnly")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AddressTypeCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _addressTypeService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<AddressTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Address type created successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [Authorize(Policy = "SuperAdminOnly")]
        [HttpPut("{guid}")]
        public async Task<IActionResult> Update(string guid, [FromBody] AddressTypeUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _addressTypeService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<AddressTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Address type updated successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [Authorize(Policy = "SuperAdminOnly")]
        [HttpGet("{guid}")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var result = await _addressTypeService.GetByIdAsync(guid);
                return Ok(new ApiResponse<AddressTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Address type retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [Authorize(Policy = "SuperAdminOnly")]
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] AddressTypeFilterDto filterDto)
        {
            try
            {
                var result = await _addressTypeService.GetAllAsync(filterDto);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Address types retrieved successfully",
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

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveAddressTypes([FromQuery] string search = null)
        {
            try
            {
                var result = await _addressTypeService.GetActiveAddressTypesAsync(search);
                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Active address types retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [Authorize(Policy = "SuperAdminOnly")]
        [HttpDelete("{guid}")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                // Validate if the entity can be deleted
                var validationResult = await ValidateDeleteAsync(GuidHelper.ToGuid(guid), "Address Type");
                if (validationResult != null)
                    return validationResult;

                var result = await _addressTypeService.DeleteAsync(guid);
                if (result)
                {
                    return Ok(new ApiResponse<object>
                    {
                        statusCode = 200,
                        Message = "Address type deleted successfully"
                    });
                }
                else
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = "Address type not found"
                    });
                }
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("export")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ExportAddressTypes([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _addressTypeService.ExportAddressTypesAsync(format);

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
                _logger.LogError(ex, "Error occurred during address type export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
