using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.TaxRate;

namespace AuditSoftware.Interfaces
{
    public interface ITaxRateService
    {
        Task<TaxRateResponseDto> CreateAsync(TaxRateCreateDto createDto, string createdByGUID);
        Task<TaxRateResponseDto> UpdateAsync(string guid, TaxRateUpdateDto updateDto, string updatedByGUID);
        Task<TaxRateResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<TaxRateResponseDto>> GetAllAsync(TaxRateFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<TaxRateSimpleDto>> GetActiveTaxRatesAsync(string? searchTerm, string strTaxTypeGUID);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportTaxRatesAsync(string format);
    }
}
