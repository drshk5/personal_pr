using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.City;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Models.Entities;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using System.Linq;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CityController : BaseDeletionController<MstCity>
    {
        private readonly ICityService _cityService;

        public CityController(
            ICityService cityService,
            IDeleteValidationService deleteValidationService,
            ILogger<CityController> logger) : base(deleteValidationService, logger)
        {
            _cityService = cityService;
        }

        [HttpPost("import")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<ApiResponse<ImportCityResultDto>>> ImportCities(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(ApiResponse<ImportCityResultDto>.Fail(400, "No file uploaded"));

                if (!file.FileName.ToLower().EndsWith(".xlsx"))
                    return BadRequest(ApiResponse<ImportCityResultDto>.Fail(400, "Only .xlsx files are allowed"));

                var userGuid = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuid))
                    return Unauthorized(ApiResponse<ImportCityResultDto>.Fail(401, "Unauthorized"));

                var result = await _cityService.ImportCitiesAsync(file, userGuid);
                return Ok(new ApiResponse<ImportCityResultDto>
                {
                    statusCode = 200,
                    Message = $"Import completed. {result.SuccessCount} cities imported successfully, {result.FailureCount} cities already exists.",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<ImportCityResultDto>.Fail(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing cities");
                return StatusCode(500, ApiResponse<ImportCityResultDto>.Fail(500, "Error importing cities"));
            }
        }

        [HttpGet]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<ApiResponse<PagedList<CityResponseDto>>>> GetAll([FromQuery] CityFilterDto? filter = null)
        {
            try
            {
                filter = filter ?? new CityFilterDto();
                var result = await _cityService.GetAllAsync(filter);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Cities retrieved successfully",
                    data = new
                    {
                        items = result.Items,
                        totalCount = result.TotalCount,
                        pageNumber = result.PageNumber,
                        pageSize = result.PageSize,
                        totalPages = result.TotalPages,
                        hasPrevious = result.HasPreviousPage,
                        hasNext = result.HasNextPage
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cities");
                return StatusCode(500, new ApiResponse<PagedList<CityResponseDto>>
                {
                    statusCode = 500,
                    Message = "Error retrieving cities"
                });
            }
        }

        [HttpGet("{guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<ApiResponse<CityResponseDto>>> GetById(string guid)
        {
            try
            {
                var result = await _cityService.GetByIdAsync(guid);
                return Ok(new ApiResponse<CityResponseDto>
                {
                    statusCode = 200,
                    Data = result,
                    Message = "City retrieved successfully"
                });
            }
            catch (BusinessException ex)
            {
                return NotFound(new ApiResponse<CityResponseDto>
                {
                    statusCode = 404,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving city");
                return StatusCode(500, new ApiResponse<CityResponseDto>
                {
                    statusCode = 500,
                    Message = "Error retrieving city"
                });
            }
        }

        [HttpPost]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<ApiResponse<CityResponseDto>>> Create([FromBody] CityCreateDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<CityResponseDto>.Fail(400, "Invalid model state"));
            }

            try
            {
                var userId = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return StatusCode(401, ApiResponse<CityResponseDto>.Fail(401, "User GUID not found in token"));

                var result = await _cityService.CreateAsync(dto, userId);
                return Ok(ApiResponse<CityResponseDto>.Success(result, "City created successfully"));
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<CityResponseDto>.Fail(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating city");
                return StatusCode(500, ApiResponse<CityResponseDto>.Fail(500, "Error creating city"));
            }
        }

        [HttpPut("{guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<ApiResponse<CityResponseDto>>> Update(string guid, [FromBody] CityUpdateDto dto)
        {
            if (guid != dto.strCityGUID)
            {
                return BadRequest(ApiResponse<CityResponseDto>.Fail(400, "ID mismatch"));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<CityResponseDto>.Fail(400, "Invalid model state"));
            }

            try
            {
                var userId = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userId))
                    return StatusCode(401, ApiResponse<CityResponseDto>.Fail(401, "User GUID not found in token"));

                var result = await _cityService.UpdateAsync(dto, userId);
                return Ok(ApiResponse<CityResponseDto>.Success(result, "City updated successfully"));
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<CityResponseDto>.Fail(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating city");
                return StatusCode(500, ApiResponse<CityResponseDto>.Fail(500, "Error updating city"));
            }
        }

        [HttpDelete("{guid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(string guid)
        {
            return await SafeDeleteAsync(
                GuidHelper.ToGuid(guid),
                "City",
                async (guid) => await _cityService.DeleteAsync(guid.ToString())
            );
        }

        [HttpGet("by-country-and-state")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<List<CitySimpleDto>>>> GetCitiesByCountryAndState([FromQuery] string countryGuid, [FromQuery] string stateGuid, [FromQuery] string? search = null)
        {
            if (string.IsNullOrWhiteSpace(countryGuid) || string.IsNullOrWhiteSpace(stateGuid))
            {
                return BadRequest(ApiResponse<List<CitySimpleDto>>.Fail(400, "Both countryGuid and stateGuid are required parameters"));
            }

            try
            {
                var result = await _cityService.GetCitiesByCountryAndStateAsync(countryGuid, stateGuid, search);
                return Ok(ApiResponse<List<CitySimpleDto>>.Success(result, "Cities retrieved successfully"));
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<List<CitySimpleDto>>.Fail(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cities by country and state");
                return StatusCode(500, ApiResponse<List<CitySimpleDto>>.Fail(500, "Error retrieving cities by country and state"));
            }
        }

        [HttpGet("export")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ExportCities([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _cityService.ExportCitiesAsync(format);

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
                _logger.LogError(ex, "Error occurred during city export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
    }
}
