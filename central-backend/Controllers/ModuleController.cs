using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.Module;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Auth;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using System.Linq;
using AuditSoftware.Data;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ModuleController : BaseDeletionController<AuditSoftware.Models.Entities.MstModule>
    {
        private readonly IModuleService _moduleService;
        private readonly IAuthService _authService;
        private readonly AppDbContext _context;
        private readonly ILogger<ModuleController> _moduleLogger;

        public ModuleController(
            IModuleService moduleService,
            IAuthService authService,
            AppDbContext context,
            IDeleteValidationService deleteValidationService,
            ILogger<ModuleController> logger,
            ILogger<BaseDeletionController<AuditSoftware.Models.Entities.MstModule>> baseLogger)
            : base(deleteValidationService, baseLogger)
        {
            _moduleService = moduleService ?? throw new ArgumentNullException(nameof(moduleService));
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _moduleLogger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Create([FromForm] ModuleCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _moduleService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<ModuleResponseDto>
                {
                    statusCode = 200,
                    Message = "Module created successfully",
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
        public async Task<IActionResult> GetAll([FromQuery] ModuleFilterDto filterDto)
        {
            try
            {
                var result = await _moduleService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Modules retrieved successfully",
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
                var result = await _moduleService.GetByIdAsync(guid);
                return Ok(new ApiResponse<ModuleResponseDto>
                {
                    statusCode = 200,
                    Message = "Module retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpPut("{guid}")]
        [Consumes("multipart/form-data")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Update(string guid, [FromForm] ModuleUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _moduleService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<ModuleResponseDto>
                {
                    statusCode = 200,
                    Message = "Module updated successfully",
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
                _logger.LogInformation($"Validating and deleting Module with GUID {guid}");
                return await SafeDeleteAsync(
                    GuidHelper.ToGuid(guid),
                    "Module",
                    async (id) => await _moduleService.DeleteAsync(id.ToString()));
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
        [Authorize] // Allow any authenticated user to access this endpoint
        public async Task<IActionResult> GetActiveModules([FromQuery] string? search = null)
        {
            try
            {
                var result = await _moduleService.GetActiveModulesAsync(search);
                
                return Ok(new ApiResponse<List<ModuleSimpleDto>>
                {
                    statusCode = 200,
                    Message = "Active modules retrieved successfully",
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
        public async Task<IActionResult> ExportModules([FromQuery] string format = "excel")
        {
            try
            {
                var (fileContents, contentType, fileName) = await _moduleService.ExportModulesAsync(format);
                
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object> { statusCode = 500, Message = $"An error occurred while exporting modules: {ex.Message}" });
            }
        }

        // Module switcher endpoint has been moved to UserRightsController
    }
}
