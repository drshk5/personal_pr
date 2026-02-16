using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using AuditSoftware.Attributes;
using AuditSoftware.DTOs.GroupModule;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "SuperAdminOnly")]
    public class GroupModuleController : ControllerBase
    {
        private readonly IGroupModuleService _groupModuleService;
        private readonly IAuthService _authService;

        public GroupModuleController(IGroupModuleService groupModuleService, IAuthService authService)
        {
            _groupModuleService = groupModuleService;
            _authService = authService;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<GroupModuleResponseDto>>> Create([FromBody] GroupModuleCreateDto createDto)
        {
            var userGuid = User.GetUserGuid();
            var result = await _groupModuleService.CreateAsync(createDto, userGuid);
            return Ok(ApiResponse<GroupModuleResponseDto>.Success(result, "Group module created successfully"));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<GroupModuleResponseDto>>> Update(string id, [FromBody] GroupModuleUpdateDto updateDto)
        {
            var userGuid = User.GetUserGuid();
            var result = await _groupModuleService.UpdateAsync(id, updateDto, userGuid);
            return Ok(ApiResponse<GroupModuleResponseDto>.Success(result, "Group module updated successfully"));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<GroupModuleResponseDto>>> GetById(string id)
        {
            // Check if user has access to the module
            var userGuid = User.GetUserGuid();
            var module = await _groupModuleService.GetByIdAsync(id);
            
            // Only super admins or users with access to this module can view it
            if (!User.IsSuperAdmin() && !await _groupModuleService.CheckUserHasAccessToModule(userGuid, module.strModuleGUID))
            {
                return Forbid();
            }
            
            return Ok(ApiResponse<GroupModuleResponseDto>.Success(module, "Group module retrieved successfully"));
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<PagedResponse<GroupModuleResponseDto>>>> GetAll([FromQuery] GroupModuleFilterDto filter)
        {
            // Validate the required group GUID
            if (string.IsNullOrEmpty(filter.strGroupGUID))
            {
                return BadRequest(ApiResponse<PagedResponse<GroupModuleResponseDto>>.Fail(400, "Group GUID is required"));
            }
            
            var result = await _groupModuleService.GetAllAsync(filter);
            return Ok(new
            {
                statusCode = 200,
                message = "Group modules retrieved successfully",
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

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> Delete(string id)
        {
            var result = await _groupModuleService.DeleteAsync(id);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail(404, $"Group module with id {id} not found"));
            
            return Ok(ApiResponse<bool>.Success(true, "Group module deleted successfully"));
        }

        [HttpGet("group/{groupId}")]
        public async Task<ActionResult<ApiResponse<PagedResponse<GroupModuleSimpleDto>>>> GetByGroup(string groupId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            // Super admins can see all groups
            if (!User.IsSuperAdmin())
            {
                // Check if user belongs to this group
                var userGuid = User.GetUserGuid();
                var userGroups = await _authService.GetUserGroupsAsync(userGuid);
                
                if (!userGroups.Contains(groupId))
                {
                    return Forbid();
                }
            }
            
            var result = await _groupModuleService.GetGroupModulesByGroupAsync(groupId, page, pageSize);
            return Ok(ApiResponse<PagedResponse<GroupModuleSimpleDto>>.Success(result, "Group modules retrieved successfully"));
        }
        
        /// <summary>
        /// Gets only modules (GUID and name) for a specific group
        /// </summary>
        /// <param name="strGroupGUID">The GUID of the group to get modules for</param>
        /// <returns>List of modules with their GUIDs and names</returns>
        [HttpGet("group/{strGroupGUID}/modules")]
    
        public async Task<ActionResult<ApiResponse<List<ModuleInfoDto>>>> GetModulesByGroup(string strGroupGUID)
        {
            try
            {
                var modules = await _groupModuleService.GetModulesByGroupAsync(strGroupGUID);
                return Ok(ApiResponse<List<ModuleInfoDto>>.Success(modules, "Modules for group retrieved successfully"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error retrieving modules for group {strGroupGUID}: {ex.Message}");
                return BadRequest(ApiResponse<List<ModuleInfoDto>>.Fail(400, $"Error retrieving modules: {ex.Message}"));
            }
        }
    }
}
