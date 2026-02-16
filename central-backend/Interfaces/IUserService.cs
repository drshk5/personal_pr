using System;
using System.Threading.Tasks;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.User;
using AuditSoftware.Models.Entities;

namespace AuditSoftware.Interfaces
{
    public interface IUserService
    {
        Task<UserResponseDto> CreateAsync(UserCreateDto createDto, Guid createdByGUID, Guid groupGuid, Guid organizationGuid, Guid? yearGuid = null);
        Task<UserResponseDto> UpdateAsync(Guid guid, UserUpdateDto updateDto, Guid updatedByGUID);
        Task<bool> DeleteAsync(Guid guid, Guid deletedByGUID);
        Task<UserResponseDto> GetByIdAsync(Guid guid);
        Task<PagedResponse<UserResponseDto>> GetAllAsync(UserFilterDto filterDto);
        Task<PagedResponse<UserResponseDto>> GetByOrganizationModuleAsync(UserFilterByOrgModuleDto filterDto);
        Task<bool> ValidateCredentialsAsync(string emailId, string password);
        Task<MstUser?> GetByEmailAsync(string emailId);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportUsersAsync(string format, Guid groupGuid);
    }
} 