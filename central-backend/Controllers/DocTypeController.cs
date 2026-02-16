using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.DTOs.DocType;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Attributes;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocTypeController : BaseDeletionController<Models.Entities.MstDocType>
    {
        private readonly IDocTypeService _docTypeService;

        public DocTypeController(
            IDocTypeService docTypeService,
            IDeleteValidationService deleteValidationService,
            Microsoft.Extensions.Logging.ILogger<BaseDeletionController<Models.Entities.MstDocType>> logger)
            : base(deleteValidationService, logger)
        {
            _docTypeService = docTypeService ?? throw new ArgumentNullException(nameof(docTypeService));
        }

        [HttpPost]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> Create([FromBody] DocTypeCreateDto createDto)
        {
            try
            {
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(createdByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _docTypeService.CreateAsync(createDto, createdByGUID);
                return Ok(new ApiResponse<DocTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Document type created successfully",
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
        public async Task<IActionResult> GetAll([FromQuery] DocTypeFilterDto filterDto)
        {
            try
            {
                var result = await _docTypeService.GetAllAsync(filterDto);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Document types retrieved successfully",
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
                var result = await _docTypeService.GetByIdAsync(guid);
                return Ok(new ApiResponse<DocTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Document type retrieved successfully",
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
        public async Task<IActionResult> Update(string guid, [FromBody] DocTypeUpdateDto updateDto)
        {
            try
            {
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(updatedByGUID))
                    return StatusCode(401, new ApiResponse<object> { statusCode = 401, Message = "User GUID not found in token" });

                var result = await _docTypeService.UpdateAsync(guid, updateDto, updatedByGUID);
                return Ok(new ApiResponse<DocTypeResponseDto>
                {
                    statusCode = 200,
                    Message = "Document type updated successfully",
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
                await _docTypeService.DeleteAsync(guid);
                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Document type deleted successfully"
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("active")]
        [Authorize] // Allow all authorized users to get active document types
        public async Task<IActionResult> GetActiveDocTypes([FromQuery] string? searchTerm = null)
        {
            try
            {
                var result = await _docTypeService.GetActiveDocTypesAsync(searchTerm);
                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Active document types retrieved successfully",
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
        public async Task<IActionResult> ExportDocTypes([FromQuery] string format = "excel")
        {
            try
            {
                var (fileContents, contentType, fileName) = await _docTypeService.ExportDocTypesAsync(format);
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
        }
    }
}