using crm_backend.DTOs.CustomerData;
using crm_backend.Models.Wrappers;

namespace crm_backend.ApplicationServices.Interfaces;

public interface IMstLeadApplicationService : IApplicationService
{
    Task<PagedResponse<LeadListDto>> GetLeadsAsync(LeadFilterParams filter);
    Task<LeadDetailDto> GetLeadByIdAsync(Guid id);
    Task<LeadDetailDto> CreateLeadAsync(CreateLeadDto dto);
    Task<LeadDetailDto> UpdateLeadAsync(Guid id, UpdateLeadDto dto);
    Task<bool> DeleteLeadAsync(Guid id);
    Task<LeadDetailDto> ChangeStatusAsync(Guid id, string newStatus);
    Task<bool> BulkArchiveAsync(LeadBulkArchiveDto dto);
    Task<bool> BulkRestoreAsync(LeadBulkArchiveDto dto);
    Task<LeadListDto> GetConversionPreviewAsync(Guid id);
    Task<LeadConversionResultDto> ConvertLeadAsync(ConvertLeadDto dto);
}
