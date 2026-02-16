using AuditSoftware.DTOs.Group;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.Interfaces;

public interface IGroupService
{
    Task<PagedResponse<GroupResponseDto>> GetAllGroupsAsync(int pageNumber, int pageSize, string? sortBy, bool ascending, string? search);
    Task<GroupResponseDto?> GetGroupByIdAsync(Guid guid);
    Task<GroupResponseDto> CreateGroupAsync(GroupCreateDto groupDto, string createdByGuid);
    Task<GroupResponseDto?> UpdateGroupAsync(Guid guid, GroupUpdateDto groupDto);
    Task<bool> DeleteGroupAsync(Guid guid);
    Task<(byte[] FileContents, string ContentType, string FileName)> ExportGroupsAsync(string format);
} 