using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.TaxCategory;

namespace AuditSoftware.Interfaces;

public interface ITaxCategoryService
{
    Task<TaxCategoryResponseDto> CreateAsync(TaxCategoryCreateDto dto, string createdByGUID);
    Task<TaxCategoryResponseDto> UpdateAsync(string guid, TaxCategoryUpdateDto dto, string updatedByGUID);
    Task<bool> DeleteAsync(string guid);
    Task<TaxCategoryResponseDto> GetByIdAsync(string guid);
    Task<PagedResponse<TaxCategoryResponseDto>> GetAllAsync(TaxCategoryFilterDto filter);
    Task<List<TaxCategorySimpleDto>> GetActiveTaxCategoriesAsync(string strTaxTypeGUID, string? search = null);
    Task<(byte[] FileContents, string ContentType, string FileName)> ExportTaxCategoriesAsync(string format, TaxCategoryFilterDto filter);
}
