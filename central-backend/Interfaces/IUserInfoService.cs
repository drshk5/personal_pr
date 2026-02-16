using System;
using System.Threading.Tasks;
using AuditSoftware.DTOs.UserInfo;

namespace AuditSoftware.Interfaces
{
    public interface IUserInfoService
    {
        Task<UserInfoResponseDto> CreateAsync(UserInfoCreateDto createDto, Guid currentUserGuid);
        Task<UserInfoResponseDto?> GetByUserIdAsync(Guid userGuid);
        Task<UserInfoResponseDto> UpdateAsync(Guid userInfoGuid, UserInfoUpdateDto updateDto, Guid currentUserGuid);
        Task<bool> DeleteAsync(Guid userInfoGuid);
        Task<UserInfoResponseDto?> GetByUserAndModuleAsync(Guid userGuid, Guid moduleGuid);
    }
}
