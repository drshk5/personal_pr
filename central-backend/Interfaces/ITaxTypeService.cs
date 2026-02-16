using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.TaxType;

namespace AuditSoftware.Interfaces
{
    public interface ITaxTypeService
    {
        Task<TaxTypeResponseDto> CreateAsync(TaxTypeCreateDto createDto, string createdByGUID);
        Task<TaxTypeResponseDto> UpdateAsync(string guid, TaxTypeUpdateDto updateDto, string updatedByGUID);
        Task<TaxTypeResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<TaxTypeResponseDto>> GetAllAsync(TaxTypeFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<TaxTypeSimpleDto>> GetActiveTaxTypesAsync(string? searchTerm = null, string? strCountryGUID = null);
        Task<TaxTypeSimpleDto?> GetByCountryGuidAsync(string countryGuid);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportTaxTypesAsync(string format);
    }
}
