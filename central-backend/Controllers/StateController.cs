using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.State;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Models.Entities;
using AuditSoftware.Helpers;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StateController : BaseDeletionController<MstState>
    {
        private readonly IStateService _stateService;

        public StateController(
            IStateService stateService,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<MstState>> logger)
            : base(deleteValidationService, logger)
        {
            _stateService = stateService ?? throw new ArgumentNullException(nameof(stateService));
        }

        [HttpPost]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Create([FromBody] StateCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _stateService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<StateResponseDto>
                {
                    statusCode = 200,
                    Message = "State created successfully",
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
        public async Task<IActionResult> GetAll([FromQuery] StateFilterDto filterDto)
        {
            try
            {
                var result = await _stateService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "States retrieved successfully",
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
                var result = await _stateService.GetByIdAsync(guid);
                return Ok(new ApiResponse<StateResponseDto>
                {
                    statusCode = 200,
                    Message = "State retrieved successfully",
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
        public async Task<IActionResult> Update(string guid, [FromBody] StateUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _stateService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<StateResponseDto>
                {
                    statusCode = 200,
                    Message = "State updated successfully",
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
                _logger.LogInformation($"Validating and deleting State with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "State",
                    async (id) => await _stateService.DeleteAsync(id.ToString()));
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

        [HttpGet("by-country/{countryGuid}")]
        [Authorize]
        public async Task<IActionResult> GetStatesByCountry(string countryGuid, [FromQuery] string? search = null)
        {
            try
            {
                var result = await _stateService.GetStatesByCountryAsync(countryGuid, search);
                
                return Ok(new ApiResponse<List<StateSimpleDto>>
                {
                    statusCode = 200,
                    Message = "States retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("active")]
        [Authorize]
        public async Task<IActionResult> GetActiveStates([FromQuery] string? search = null)
        {
            try
            {
                var result = await _stateService.GetActiveStatesAsync(search);
                
                return Ok(new ApiResponse<List<StateSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active states retrieved successfully",
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
        public async Task<IActionResult> ExportStates([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _stateService.ExportStatesAsync(format);

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
                _logger.LogError(ex, "Error occurred during state export");
                return StatusCode(500, new ApiResponse<object> { statusCode = 500, Message = "An error occurred during export" });
            }
        }

        [HttpPost("import")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ImportStates(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new ApiResponse<object> { statusCode = 400, Message = "No file uploaded" });

                // Validate file extension
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (fileExtension != ".xlsx")
                    return BadRequest(new ApiResponse<object> { statusCode = 400, Message = "Only .xlsx files are allowed" });

                var userGuid = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuid))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _stateService.ImportStatesAsync(file, userGuid);

                return Ok(new ApiResponse<ImportStateResultDto>
                {
                    statusCode = 200,
                    Message = $"Import completed. {result.SuccessCount} states imported successfully, {result.FailureCount} failures.",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during state import");
                return StatusCode(500, new ApiResponse<object> { statusCode = 500, Message = "An error occurred during import" });
            }
        }
    }
}
