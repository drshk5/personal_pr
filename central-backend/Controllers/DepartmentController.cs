using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AuditSoftware.Attributes;
using AuditSoftware.DTOs.Department;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using System.Security.Claims;
using Microsoft.Extensions.Logging;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : BaseDeletionController<Models.Entities.MstDepartment>
    {
    private readonly IDepartmentService _departmentService;
    private new readonly ILogger<DepartmentController> _logger;

        public DepartmentController(
            IDepartmentService departmentService,
            IDeleteValidationService deleteValidationService,
            ILogger<DepartmentController> logger,
            ILogger<BaseDeletionController<Models.Entities.MstDepartment>> baseLogger)
            : base(deleteValidationService, baseLogger)
        {
            _departmentService = departmentService ?? throw new ArgumentNullException(nameof(departmentService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        [AuthorizePermission("department", PermissionType.CanView, "Department")]
        public async Task<IActionResult> GetAll([FromQuery] DepartmentFilterDto filterDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                filterDto.strGroupGUID = groupGUID;
                var result = await _departmentService.GetAllAsync(filterDto);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Departments retrieved successfully",
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
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        [HttpGet("{guid}")]
        [AuthorizePermission("department", PermissionType.CanView, "Department")]
        public async Task<IActionResult> GetById(string guid)
        {
            try
            {
                var result = await _departmentService.GetByIdAsync(guid);
                return Ok(new { statusCode = 200, message = "Department retrieved successfully", data = result });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        [HttpPost]
        [AuthorizePermission("department", PermissionType.CanSave, "Department")]
        public async Task<IActionResult> Create([FromBody] DepartmentCreateDto createDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var createdByGUID = User.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(groupGUID) || string.IsNullOrEmpty(createdByGUID))
                    return Unauthorized(new { statusCode = 401, message = "Required claims not found in token" });

                var response = await _departmentService.CreateAsync(createDto, createdByGUID, groupGUID);
                return CreatedAtAction(nameof(GetById), new { guid = response.strDepartmentGUID }, new { statusCode = 201, message = "Department created successfully", data = response });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        [HttpPut("{guid}")]
        [AuthorizePermission("department", PermissionType.CanEdit, "Department")]
        public async Task<IActionResult> Update(string guid, [FromBody] DepartmentUpdateDto updateDto)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var updatedByGUID = User.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(groupGUID) || string.IsNullOrEmpty(updatedByGUID))
                    return Unauthorized(new { statusCode = 401, message = "Required claims not found in token" });

                var response = await _departmentService.UpdateAsync(guid, updateDto, updatedByGUID, groupGUID);
                return Ok(new { statusCode = 200, message = "Department updated successfully", data = response });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        [HttpDelete("{guid}")]
        [AuthorizePermission("department", PermissionType.CanDelete, "Department")]
        public async Task<IActionResult> Delete(string guid)
        {
            try
            {
                return await SafeDeleteAsync(GuidHelper.ToGuid(guid), "Department", async (id) => await _departmentService.DeleteAsync(id.ToString()));
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive([FromQuery] string? search = null)
        {
            try
            {
                var groupGUID = User.FindFirst("strGroupGUID")?.Value;
                var result = await _departmentService.GetActiveDepartmentsAsync(search, groupGUID);
                return Ok(new { statusCode = 200, message = "Active departments retrieved successfully", data = result });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
        }

        [HttpGet("export")]
        [AuthorizePermission("department", PermissionType.CanExport, "Department")]
        public async Task<IActionResult> Export([FromQuery] string format)
        {
            try
            {
                if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
                    return BadRequest(new { statusCode = 400, message = "Invalid format specified. Supported formats are 'excel' and 'csv'." });

                var groupGuid = User.FindFirst("strGroupGUID")?.Value;
                if (string.IsNullOrEmpty(groupGuid))
                    return BadRequest(new { statusCode = 400, message = "Group GUID not found in token" });

                var (fileContents, contentType, fileName) = await _departmentService.ExportDepartmentsAsync(format, groupGuid);
                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting departments");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while exporting departments" });
            }
        }
    }
}
