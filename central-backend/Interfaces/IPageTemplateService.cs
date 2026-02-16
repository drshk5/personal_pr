using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.PageTemplate;

namespace AuditSoftware.Interfaces
{
    public interface IPageTemplateService
    {
        Task<PageTemplateResponseDto> CreateAsync(PageTemplateCreateDto createDto, string createdByGUID);
        Task<PageTemplateResponseDto> UpdateAsync(string guid, PageTemplateUpdateDto updateDto, string updatedByGUID);
        Task<PageTemplateResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<PageTemplateResponseDto>> GetAllAsync(PageTemplateFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<PageTemplateSimpleDto>> GetActivePageTemplatesAsync(string? searchTerm = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportPageTemplatesAsync(string format);
    }
}
