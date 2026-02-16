using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.UserRights;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.Interfaces
{
    public interface IUserRightsService
    {
        Task<UserRightsResponseDto> CreateUserRightsAsync(UserRightsCreateDto userRightsDto);
        Task<UserRightsResponseDto> GetUserRightsByIdAsync(Guid userRightId);
        Task<UserRightsResponseDto> UpdateUserRightsAsync(Guid userRightId, UserRightsCreateDto userRightsDto);
        Task<bool> DeleteUserRightsAsync(Guid userRightId);
        Task<PagedResponse<UserRightsResponseDto>> GetAllUserRightsAsync(UserRightsFilterDto filterDto);
        Task<IEnumerable<UserRightsResponseDto>> GetUserRightsByRoleAsync(Guid userRoleId);
        Task<UserRightsBatchResponseDto> BatchUpsertUserRightsAsync(List<UserRightsBatchItemDto> userRights);
    }
} 