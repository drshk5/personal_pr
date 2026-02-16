using AuditSoftware.DTOs.UserRole;
using AuditSoftware.DTOs.Common;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuditSoftware.Interfaces;

public interface IUserRoleService
{
    Task<PagedResponse<UserRoleResponseDto>> GetAllUserRolesAsync(
        int pageNumber, 
        int pageSize, 
        string? sortBy, 
        bool isDescending, 
        string? search, 
        Guid groupGuid,
        string? strModuleGUID = null,
        bool? bolIsActive = null,
        string? strCreatedByGUIDs = null,
        string? strUpdatedByGUIDs = null);
    Task<UserRoleResponseDto?> GetUserRoleByIdAsync(Guid guid, Guid groupGuid, Guid? moduleGuid = null);
    Task<UserRoleResponseDto> CreateUserRoleAsync(UserRoleCreateDto userRoleDto, Guid userGuid, Guid groupGuid, Guid? moduleGuid = null);
    Task<UserRoleResponseDto?> UpdateUserRoleAsync(Guid guid, UserRoleUpdateDto userRoleDto, Guid userGuid, Guid groupGuid, Guid? moduleGuid = null);
    Task<bool> DeleteUserRoleAsync(Guid guid, Guid groupGuid);
    Task<PagedResponse<UserRoleResponseDto>> SearchRolesAsync(UserRoleSearchRequestDto searchDto, Guid groupGUID);
    Task<List<UserRoleResponseDto>> GetActiveRolesForDropdownAsync(Guid groupGUID, Guid? moduleGuid = null, string? search = null);
    Task<(byte[] FileContents, string ContentType, string FileName)> ExportUserRolesAsync(string format, Guid groupGuid, Guid? moduleGuid = null);
} 