using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.DocumentModule;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Models.Entities;
using AuditSoftware.Helpers;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentModuleController : BaseDeletionController<MstDocumentModule>
    {
        private readonly IDocumentModuleService _documentModuleService;
        private readonly ILogger<DocumentModuleController> _logger;

        public DocumentModuleController(
            IDocumentModuleService documentModuleService,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<MstDocumentModule>> baseLogger,
            ILogger<DocumentModuleController> logger)
            : base(deleteValidationService, baseLogger)
        {
            _documentModuleService = documentModuleService ?? throw new ArgumentNullException(nameof(documentModuleService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [Authorize(Policy = "SuperAdminOnly")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DocumentModuleCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _documentModuleService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<DocumentModuleResponseDto>
                {
                    statusCode = 200,
                    Message = "Document module created successfully",
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
        public async Task<IActionResult> Update(string guid, [FromBody] DocumentModuleUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _documentModuleService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<DocumentModuleResponseDto>
                {
                    statusCode = 200,
                    Message = "Document module updated successfully",
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
                var result = await _documentModuleService.GetByIdAsync(guid);
                return Ok(new ApiResponse<DocumentModuleResponseDto>
                {
                    statusCode = 200,
                    Message = "Document module retrieved successfully",
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
        public async Task<IActionResult> GetAll([FromQuery] DocumentModuleFilterDto filterDto)
        {
            try
            {
                var result = await _documentModuleService.GetAllAsync(filterDto);

                // Augment items sequentially to avoid concurrent DbContext operations
                var augmentedItems = new List<object>(result.Items.Count());
                foreach (var item in result.Items)
                {
                    var dm = await _documentModuleService.GetByIdAsync(item.strDocumentModuleGUID);
                    augmentedItems.Add(new
                    {
                        item.strDocumentModuleGUID,
                        item.strModuleGUID,
                        // strModuleName from mstModule
                        item.strModuleName,
                        // Original name from mstDocumentModule
                        strDocumentModuleName = dm.strModuleName,
                        item.bolIsActive
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Document modules retrieved successfully",
                    data = new
                    {
                        items = augmentedItems,
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
        [Authorize]
        public async Task<IActionResult> GetActiveDocumentModules([FromQuery] string? search = null)
        {
            try
            {
                // Extract moduleGUID from JWT token
                var moduleGuidStr = User?.FindFirst("strModuleGUID")?.Value;
                
                if (string.IsNullOrEmpty(moduleGuidStr))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Module GUID not found in token"
                    });
                }

                var moduleGUID = Guid.Parse(moduleGuidStr);
                
                // Get active document modules for this module
                var result = await _documentModuleService.GetActiveByModuleGUIDAsync(moduleGUID);
                
                // Apply search filter if provided
                if (!string.IsNullOrEmpty(search))
                {
                    result = result.Where(x => x.strModuleName.Contains(search, StringComparison.OrdinalIgnoreCase))
                                   .ToList();
                }

                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Active document modules retrieved successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active document modules");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while processing your request."
                });
            }
        }

        [Authorize(Policy = "SuperAdminOnly")]
        [HttpDelete("{guid}")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                var validationResult = await ValidateDeleteAsync(GuidHelper.ToGuid(guid), "Document Module");
                if (validationResult != null)
                    return validationResult;

                var result = await _documentModuleService.DeleteAsync(guid);
                if (result)
                {
                    return Ok(new ApiResponse<object>
                    {
                        statusCode = 200,
                        Message = "Document module deleted successfully"
                    });
                }
                else
                {
                    return NotFound(new ApiResponse<object>
                    {
                        statusCode = 404,
                        Message = "Document module not found"
                    });
                }
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }
    }
}
