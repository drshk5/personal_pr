using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuditSoftware.DTOs.Folder;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Attributes;
using System.Linq;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FolderController : ControllerBase
    {
        private readonly IFolderService _folderService;
        private readonly IDeleteValidationService _deleteValidationService;
        private readonly ILogger<FolderController> _logger;

        public FolderController(
            IFolderService folderService,
            IDeleteValidationService deleteValidationService,
            ILogger<FolderController> logger)
        {
            _folderService = folderService ?? throw new ArgumentNullException(nameof(folderService));
            _deleteValidationService = deleteValidationService ?? throw new ArgumentNullException(nameof(deleteValidationService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost]
        [AuthorizePermission("folder", PermissionType.CanSave, "Folder")]
        public async Task<ActionResult<FolderResponseDto>> Create([FromBody] FolderCreateDto createDto)
        {
            try
            {
                // Check if user is authenticated and has claims
                if (User?.Identity == null || !User.Identity.IsAuthenticated)
                    throw new BusinessException("User is not authenticated");

                // Extract all required GUIDs from token claims
                var userGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strUserGUID");
                if (userGuidClaim == null)
                    throw new BusinessException("User GUID claim is missing from token");

                var groupGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strGroupGUID");
                if (groupGuidClaim == null)
                    throw new BusinessException("Group GUID claim is missing from token");

                var organizationGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID");
                if (organizationGuidClaim == null)
                    throw new BusinessException("Organization GUID claim is missing from token");
                
                var yearGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strYearGUID");
                if (yearGuidClaim == null)
                    throw new BusinessException("Year GUID claim is missing from token");
                
                var moduleGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strModuleGUID");
                if (moduleGuidClaim == null)
                    throw new BusinessException("Module GUID claim is missing from token");

                var userGuid = Guid.Parse(userGuidClaim.Value);
                var groupGuid = Guid.Parse(groupGuidClaim.Value);
                var organizationGuid = Guid.Parse(organizationGuidClaim.Value);
                var yearGuid = Guid.Parse(yearGuidClaim.Value);
                var moduleGuid = Guid.Parse(moduleGuidClaim.Value);

                // Use the new method that creates a folder in the hierarchy
                var folder = await _folderService.CreateFolderInHierarchyAsync(createDto, userGuid, groupGuid, organizationGuid, yearGuid, moduleGuid);
                return Ok(folder);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ErrorResponse { StatusCode = 400, Message = ex.Message });
            }
        }

        [HttpGet("{guid}")]
        [AuthorizePermission("folder", PermissionType.CanView, "Folder")]
        public async Task<ActionResult<FolderResponseDto>> Get(Guid guid)
        {
            try
            {
                var folder = await _folderService.GetByIdAsync(guid);
                
                // Get user's timezone from claims for date conversion
                var timeZoneIdClaim = User.Claims.FirstOrDefault(c => c.Type == "strTimeZoneId")?.Value;
                if (!string.IsNullOrEmpty(timeZoneIdClaim))
                {
                    folder.ConvertToTimeZone(timeZoneIdClaim);
                }
                
                return Ok(folder);
            }
            catch (BusinessException ex)
            {
                return NotFound(new ErrorResponse { Message = ex.Message });
            }
        }

        [HttpGet]
        [AuthorizePermission("folder", PermissionType.CanView, "Folder")]
        public async Task<ActionResult<PagedResponse<FolderResponseDto>>> GetAll([FromQuery] string? search = null)
        {
            try 
            {
                // Check if organization claim exists
                var organizationGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID");
                if (organizationGuidClaim == null)
                    return BadRequest(new ErrorResponse { StatusCode = 400, Message = "Organization GUID claim is missing from token" });

                // Get moduleGuid from token
                var moduleGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strModuleGUID");
                Guid? moduleGuid = moduleGuidClaim != null ? Guid.Parse(moduleGuidClaim.Value) : null;

                var organizationGuid = Guid.Parse(organizationGuidClaim.Value);

                // Create default filter with only search parameter
                var filter = new BaseFilterDto
                {
                    PageNumber = 1, 
                    PageSize = 1000, // Large page size to get all results
                    Search = search
                };

                // Get folders from service with moduleGuid from token
                var folders = await _folderService.GetAllAsync(filter, organizationGuid, moduleGuid);
                
                // Create a response with GUID, Name and intDocumentCount
                var simplifiedFolders = new PagedResponse<object>
                {
                    Items = folders.Items.Select(f => new { 
                        strFolderGUID = f.strFolderGUID, 
                        strFolderName = f.strFolderName,
                        intDocumentCount = f.intDocumentCount
                    }).ToList(),
                    PageNumber = folders.PageNumber,
                    PageSize = folders.PageSize,
                    TotalCount = folders.TotalCount,
                    TotalPages = folders.TotalPages
                };

                return Ok(new
                {
                    statusCode = 200,
                    message = "Folders retrieved successfully",
                    data = new
                    {
                        items = simplifiedFolders.Items,
                        totalCount = simplifiedFolders.TotalCount,
                        pageNumber = simplifiedFolders.PageNumber,
                        pageSize = simplifiedFolders.PageSize,
                        totalPages = simplifiedFolders.TotalPages,
                        hasPrevious = simplifiedFolders.HasPrevious,
                        hasNext = simplifiedFolders.HasNext
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving folder information");
                return StatusCode(500, new ErrorResponse { 
                    StatusCode = 500, 
                    Message = "An error occurred while retrieving folder information" 
                });
            }
        }

        

        [HttpPut("{guid}")]
        [AuthorizePermission("folder", PermissionType.CanEdit, "Folder")]

        public async Task<ActionResult<FolderResponseDto>> UpdateFolderName(Guid guid, [FromBody] SimpleFolderUpdateDto updateDto)
        {
            try
            {
                // Check if user is authenticated and has claims
                if (User?.Identity == null || !User.Identity.IsAuthenticated)
                    throw new BusinessException("User is not authenticated");

                // Extract all required GUIDs from token claims
                var userGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strUserGUID");
                if (userGuidClaim == null)
                    throw new BusinessException("User GUID claim is missing from token");

                var groupGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strGroupGUID");
                if (groupGuidClaim == null)
                    throw new BusinessException("Group GUID claim is missing from token");

                var organizationGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID");
                if (organizationGuidClaim == null)
                    throw new BusinessException("Organization GUID claim is missing from token");
                
                var yearGuidClaim = User.Claims.FirstOrDefault(c => c.Type == "strYearGUID");
                if (yearGuidClaim == null)
                    throw new BusinessException("Year GUID claim is missing from token");

                var userGuid = Guid.Parse(userGuidClaim.Value);
                var groupGuid = Guid.Parse(groupGuidClaim.Value);
                var organizationGuid = Guid.Parse(organizationGuidClaim.Value);
                var yearGuid = Guid.Parse(yearGuidClaim.Value);

                // Use the method that updates a folder in the hierarchy with just the folder name
                var folder = await _folderService.UpdateFolderInHierarchyAsync(guid, updateDto, userGuid, groupGuid, organizationGuid, yearGuid);
                
                // Get user's timezone from claims for date conversion
                var timeZoneIdClaim = User.Claims.FirstOrDefault(c => c.Type == "strTimeZoneId")?.Value;
                if (!string.IsNullOrEmpty(timeZoneIdClaim))
                {
                    folder.ConvertToTimeZone(timeZoneIdClaim);
                }
                
                return Ok(folder);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ErrorResponse { StatusCode = 400, Message = ex.Message });
            }
        }



        [HttpDelete("{guid}")]
        [AuthorizePermission("folder", PermissionType.CanDelete, "Folder")]
        public async Task<IActionResult> Delete(Guid guid)
        {
            try
            {
                // Skip validation with _deleteValidationService as it's using v_delete_check
                // Instead, rely on the FolderService's validation
                
                // Delete the folder
                await _folderService.DeleteAsync(guid);
                return NoContent();
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, $"Business validation failed when deleting folder {guid}");
                return BadRequest(new ErrorResponse { StatusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting folder {guid}");
                return StatusCode(500, new ErrorResponse { StatusCode = 500, Message = "An error occurred while deleting the folder" });
            }
        }
    }
}
