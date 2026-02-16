using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.DocType;

namespace AuditSoftware.Interfaces
{
    public interface IDocTypeService
    {
        Task<DocTypeResponseDto> CreateAsync(DocTypeCreateDto createDto, string createdByGUID);
        Task<DocTypeResponseDto> UpdateAsync(string guid, DocTypeUpdateDto updateDto, string updatedByGUID);
        Task<DocTypeResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<DocTypeResponseDto>> GetAllAsync(DocTypeFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<DocTypeSimpleDto>> GetActiveDocTypesAsync(string? searchTerm = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportDocTypesAsync(string format);
    }
}