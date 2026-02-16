using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.UserDetails;

namespace AuditSoftware.Interfaces
{
    public interface IUserDetailsService
    {
        Task<UserDetailsResponseDto> CreateAsync(UserDetailsCreateDto createDto, Guid createdByGUID, Guid groupGUID, Guid organizationGUID, Guid? moduleGUID = null);
        Task<UserDetailsResponseDto> UpdateAsync(Guid guid, UserDetailsUpdateDto updateDto, Guid updatedByGUID);
        Task<UserDetailsResponseDto> GetByIdAsync(Guid guid);
        Task<PagedResponse<UserDetailsResponseDto>> GetAllAsync(UserDetailsFilterDto filterDto);
        Task<bool> DeleteAsync(Guid guid, Guid currentUserGuid, Guid currentOrganizationGuid, Guid currentYearGuid);
        Task<UserDetailsResponseDto> UpsertAsync(UserDetailsCreateDto createDto, Guid userGuid, Guid groupGUID, Guid moduleGUID);
        Task<UserRoleInfoDto> GetUserRoleInfoAsync(Guid userGUID, Guid organizationGUID, Guid yearGUID);
        Task<BulkUserDetailsResponseDto> BulkUpsertAsync(UserDetailsBulkCreateDto bulkCreateDto, Guid userGuid, Guid groupGUID, Guid moduleGUID);
    }
} 