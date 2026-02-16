using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.OrgTaxConfig;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IOrgTaxConfigService
    {
        Task<PagedResponse<OrgTaxConfigResponseDto>> GetAllAsync(OrgTaxConfigFilterDto filterDto);
        Task<OrgTaxConfigResponseDto?> GetByIdAsync(string guid);
        Task<OrgTaxConfigResponseDto> CreateAsync(OrgTaxConfigCreateDto createDto, string createdByGUID);
        Task<OrgTaxConfigResponseDto?> UpdateAsync(string guid, OrgTaxConfigUpdateDto updateDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<OrgTaxConfigSimpleDto>> GetActiveByOrganizationAsync(string organizationGUID);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportAsync(string format, OrgTaxConfigFilterDto filterDto);
    }
}
