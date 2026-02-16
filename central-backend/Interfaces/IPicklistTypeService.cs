using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.PicklistType;

namespace AuditSoftware.Interfaces
{
    public interface IPicklistTypeService
    {
        Task<PicklistTypeResponseDto> CreateAsync(PicklistTypeCreateDto createDto, string createdByGUID);
        Task<PicklistTypeResponseDto> UpdateAsync(string guid, PicklistTypeUpdateDto updateDto, string updatedByGUID);
        Task<PicklistTypeResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<PicklistTypeResponseDto>> GetAllAsync(PicklistTypeFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<PicklistTypeSimpleDto>> GetActivePicklistTypesAsync(string? searchTerm = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportPicklistTypesAsync(string format);
    }
} 