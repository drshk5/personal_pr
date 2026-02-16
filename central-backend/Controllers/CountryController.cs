using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using AuditSoftware.DTOs.Country;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Attributes;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CountryController : BaseDeletionController<MstCountry>
    {
        private readonly ICountryService _countryService;

        public CountryController(
            ICountryService countryService,
            IDeleteValidationService deleteValidationService,
            Microsoft.Extensions.Logging.ILogger<BaseDeletionController<MstCountry>> logger)
            : base(deleteValidationService, logger)
        {
            _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
        }

        private string GetUserGuid()
        {
            var userGuid = User.FindFirst("strUserGUID")?.Value;
            if (string.IsNullOrEmpty(userGuid))
            {
                throw new UnauthorizedAccessException("User GUID not found in token");
            }
            return userGuid;
        }

        [HttpPost]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> CreateCountry([FromBody] CountryCreateDto dto)
        {
            try 
            {
                var userGuid = GetUserGuid();
                var result = await _countryService.CreateCountryAsync(dto, userGuid);
                return Ok(new ApiResponse<CountryResponseDto>
                {
                    statusCode = 200,
                    Message = "Country created successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpPut("{countryGuid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> UpdateCountry(string countryGuid, [FromBody] CountryUpdateDto dto)
        {
            try
            {
                var userGuid = GetUserGuid();
                var result = await _countryService.UpdateCountryAsync(countryGuid, dto, userGuid);
                return Ok(new ApiResponse<CountryResponseDto>
                {
                    statusCode = 200,
                    Message = "Country updated successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("{countryGuid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> GetCountryByGuid(string countryGuid)
        {
            try
            {
                var result = await _countryService.GetCountryByGuidAsync(countryGuid);
                return Ok(new ApiResponse<CountryResponseDto>
                {
                    statusCode = 200,
                    Message = "Country retrieved successfully",
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
        public async Task<IActionResult> GetAllCountries([FromQuery] CountryFilterDto filter)
        {
            try
            {
                var result = await _countryService.GetAllCountriesAsync(filter);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Countries retrieved successfully",
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
        
        [HttpGet("export")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ExportCountries([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _countryService.ExportCountriesAsync(format);

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
                _logger.LogError(ex, "Error occurred during country export");
                return StatusCode(500, new ApiResponse<object> { statusCode = 500, Message = "An error occurred during export" });
            }
        }

        [HttpPost("import")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ImportCountries(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new ApiResponse<object> { statusCode = 400, Message = "No file uploaded" });

                // Validate file extension
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (fileExtension != ".xlsx")
                    return BadRequest(new ApiResponse<object> { statusCode = 400, Message = "Only .xlsx files are allowed" });

                var userGuid = GetUserGuid();
                var result = await _countryService.ImportCountriesAsync(file, userGuid);

                return Ok(new ApiResponse<ImportCountryResultDto>
                {
                    statusCode = 200,
                    Message = $"Import completed. {result.SuccessCount} countries imported successfully, {result.FailureCount} failures",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception
                _logger.LogError(ex, "Error occurred during country import");
                return StatusCode(500, new ApiResponse<object> { statusCode = 500, Message = "An error occurred during import" });
            }
        }

        [HttpGet("active")]
        [Authorize]
        public async Task<IActionResult> GetActiveCountries([FromQuery] string? search = null)
        {
            try
            {
                var result = await _countryService.GetActiveCountriesAsync(search);
                return Ok(new ApiResponse<List<CountrySimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active countries retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpDelete("{countryGuid}")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> DeleteCountry(string countryGuid)
        {
            try
            {
                var userGuid = GetUserGuid();
                
                // Check if the entity can be deleted
                var validationResult = await ValidateDeleteAsync(GuidHelper.ToGuid(countryGuid), "Country");
                if (validationResult != null)
                {
                    return validationResult;
                }

                var result = await _countryService.DeleteCountryAsync(countryGuid, userGuid);
                if (result)
                {
                    return Ok(new ApiResponse<object>
                    {
                        statusCode = 200,
                        Message = "Country deleted successfully"
                    });
                }
                else
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = "Country not found"
                    });
                }
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("fetchcurrencybycountry")]
        [AllowAnonymous]
        public async Task<IActionResult> FetchCurrencyByCountry([FromQuery] string strCountryGUID)
        {
            if (string.IsNullOrWhiteSpace(strCountryGUID) || !Guid.TryParse(strCountryGUID, out var countryGuid))
            {
                return BadRequest(new { statusCode = 400, message = "Invalid or missing strCountryGUID" });
            }

            var (country, currency) = await _countryService.GetCurrencyByCountryGuidAsync(countryGuid);
            if (country == null)
            {
                return NotFound(new { statusCode = 404, message = "Country not found or inactive" });
            }
            if (currency == null)
            {
                return NotFound(new { statusCode = 404, message = "No active currency found for this country" });
            }

            return Ok(new {
                statusCode = 200,
                data = new {
                    strCountryGUID = country.strCountryGUID,
                    strCurrencyTypeGUID = currency.strCurrencyTypeGUID
                }
            });
        }
    }
}
