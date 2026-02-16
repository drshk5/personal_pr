using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.GroupModule;

namespace AuditSoftware.Interfaces
{
    public interface IGroupModuleService
    {
        Task<GroupModuleResponseDto> CreateAsync(GroupModuleCreateDto createDto, string createdByGUID);
        Task<GroupModuleResponseDto> UpdateAsync(string guid, GroupModuleUpdateDto updateDto, string updatedByGUID);
        Task<GroupModuleResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<GroupModuleResponseDto>> GetAllAsync(GroupModuleFilterDto filter);
        Task<bool> DeleteAsync(string guid);
        Task<PagedResponse<GroupModuleSimpleDto>> GetGroupModulesByGroupAsync(string groupGuid, int page = 1, int pageSize = 10);
        Task<bool> CheckUserHasAccessToModule(string userGuid, string moduleGuid);
        Task<List<ModuleInfoDto>> GetModulesByGroupAsync(string groupGuid);
        Task ExecuteSqlScriptForOrganizationAsync(string connectionString, string sqlFilePath, string organizationGUID, string? groupGUID = null, string? yearGUID = null, string? countryGUID = null);
    }
}
