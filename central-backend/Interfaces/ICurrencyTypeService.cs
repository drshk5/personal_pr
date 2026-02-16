using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.CurrencyType;

namespace AuditSoftware.Interfaces
{
    public interface ICurrencyTypeService
    {
        Task<CurrencyTypeResponseDto> CreateAsync(CurrencyTypeCreateDto createDto, string createdByGUID);
        Task<CurrencyTypeResponseDto> UpdateAsync(string guid, CurrencyTypeUpdateDto updateDto, string updatedByGUID);
        Task<CurrencyTypeResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<CurrencyTypeResponseDto>> GetAllAsync(CurrencyTypeFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<CurrencyTypeSimpleDto>> GetActiveCurrencyTypesAsync(string searchTerm = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportCurrencyTypesAsync(string format);
    }
}
