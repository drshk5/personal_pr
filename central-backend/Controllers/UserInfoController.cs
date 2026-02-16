using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using AuditSoftware.DTOs.UserInfo;
using AuditSoftware.Interfaces;
using AuditSoftware.Attributes;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserInfoController : ControllerBase
    {
        private readonly IUserInfoService _userInfoService;
        private readonly ILogger<UserInfoController> _logger;

        public UserInfoController(IUserInfoService userInfoService, ILogger<UserInfoController> logger)
        {
            _userInfoService = userInfoService;
            _logger = logger;
        }

        [HttpPost]
        [AuthorizePermission("userinfo", PermissionType.CanSave)]
        public async Task<ActionResult<UserInfoResponseDto>> Create([FromBody] UserInfoCreateDto createDto)
        {
            try
            {
                var currentUserGuid = Guid.Parse(User.FindFirst("strUserGUID")?.Value ?? string.Empty);
                var result = await _userInfoService.CreateAsync(createDto, currentUserGuid);
                return CreatedAtAction(nameof(GetByUserId), new { userId = createDto.strUserGUID }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating user info: {ex.Message}");
                return StatusCode(500, $"An error occurred while creating user info: {ex.Message}");
            }
        }

        [HttpGet("user/{userId}")]
        [AuthorizePermission("userinfo", PermissionType.CanView)]
        public async Task<ActionResult<UserInfoResponseDto>> GetByUserId(string userId)
        {
            try
            {
                var userInfo = await _userInfoService.GetByUserIdAsync(GuidHelper.ToGuid(userId));
                if (userInfo == null)
                {
                    return NotFound($"User info for user {userId} not found");
                }
                return Ok(userInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving user info: {ex.Message}");
                return StatusCode(500, $"An error occurred while retrieving user info: {ex.Message}");
            }
        }

        [HttpGet("user/{userId}/module/{moduleId}")]
        [AuthorizePermission("userinfo", PermissionType.CanView)]
        public async Task<ActionResult<UserInfoResponseDto>> GetByUserAndModule(string userId, string moduleId)
        {
            try
            {
                var userInfo = await _userInfoService.GetByUserAndModuleAsync(GuidHelper.ToGuid(userId), GuidHelper.ToGuid(moduleId));
                if (userInfo == null)
                {
                    return NotFound($"User info for user {userId} and module {moduleId} not found");
                }
                return Ok(userInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving user info: {ex.Message}");
                return StatusCode(500, $"An error occurred while retrieving user info: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [AuthorizePermission("userinfo", PermissionType.CanEdit)]
        public async Task<ActionResult<UserInfoResponseDto>> Update(string id, [FromBody] UserInfoUpdateDto updateDto)
        {
            try
            {
                var currentUserGuid = GuidHelper.ToGuid(User.FindFirst("strUserGUID")?.Value ?? string.Empty);
                var result = await _userInfoService.UpdateAsync(GuidHelper.ToGuid(id), updateDto, currentUserGuid);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user info: {ex.Message}");
                return StatusCode(500, $"An error occurred while updating user info: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [AuthorizePermission("userinfo", PermissionType.CanDelete)]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var result = await _userInfoService.DeleteAsync(GuidHelper.ToGuid(id));
                if (!result)
                {
                    return NotFound($"User info with ID {id} not found");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user info: {ex.Message}");
                return StatusCode(500, $"An error occurred while deleting user info: {ex.Message}");
            }
        }
    }
}
