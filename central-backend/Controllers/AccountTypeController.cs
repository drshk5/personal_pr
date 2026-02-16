using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.AccountType;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Helpers;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Models.Entities;
using System.Linq;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AccountTypeController : BaseDeletionController<MstAccountType>
    {
        private readonly IAccountTypeService _accountTypeService;

        public AccountTypeController(
            IAccountTypeService accountTypeService,
            IDeleteValidationService deleteValidationService,
            Microsoft.Extensions.Logging.ILogger<BaseDeletionController<MstAccountType>> logger)
            : base(deleteValidationService, logger)
        {
            _accountTypeService = accountTypeService ?? throw new ArgumentNullException(nameof(accountTypeService));
        }

        [Authorize(Policy = "SuperAdminOnly")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AccountTypeCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _accountTypeService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<AccountTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Account type created successfully",
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
        public async Task<IActionResult> Update(string guid, [FromBody] AccountTypeUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _accountTypeService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<AccountTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Account type updated successfully",
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
                var result = await _accountTypeService.GetByIdAsync(guid);
                return Ok(new ApiResponse<AccountTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Account type retrieved successfully",
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
        public async Task<IActionResult> GetAll([FromQuery] AccountTypeFilterDto filterDto)
        {
            try
            {
                var result = await _accountTypeService.GetAllAsync(filterDto);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Account types retrieved successfully",
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
        public async Task<IActionResult> GetActiveAccountTypes([FromQuery] string? search = null)
        {
            try
            {
                var result = await _accountTypeService.GetActiveAccountTypesAsync(search);
                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Active account types retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }
        
        [HttpGet("onlyBank")]
        public async Task<IActionResult> GetOnlyBankAccountTypes([FromQuery] string? search = null)
        {
            try
            {
                var result = await _accountTypeService.GetOnlyBankAccountTypesAsync(search);
                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Active account types retrieved successfully",
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
                var validationResult = await ValidateDeleteAsync(GuidHelper.ToGuid(guid), "Account Type");
                if (validationResult != null)
                    return validationResult;

                var result = await _accountTypeService.DeleteAsync(guid);
                if (result)
                {
                    return Ok(new ApiResponse<object>
                    {
                        statusCode = 200,
                        Message = "Account type deleted successfully"
                    });
                }
                else
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = "Account type not found"
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
        public async Task<IActionResult> ExportAccountTypes([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _accountTypeService.ExportAccountTypesAsync(format);

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
                _logger.LogError(ex, "Error occurred during account type export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
