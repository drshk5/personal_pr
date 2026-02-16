using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Industry;

namespace AuditSoftware.Interfaces
{
    public interface IIndustryService
    {
        Task<IndustryResponseDto> CreateAsync(IndustryCreateDto createDto, string createdByGUID);
        Task<IndustryResponseDto> UpdateAsync(string guid, IndustryUpdateDto updateDto, string updatedByGUID);
        Task<IndustryResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<IndustryResponseDto>> GetAllAsync(IndustryFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<IndustrySimpleDto>> GetActiveIndustriesAsync(string searchTerm = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportIndustriesAsync(string format);
    }
}
