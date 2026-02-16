using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Designation;

namespace AuditSoftware.Interfaces
{
    public interface IDesignationService
    {
    Task<DesignationResponseDto> CreateAsync(DesignationCreateDto createDto, string createdByGUID, string groupGUID);
    Task<DesignationResponseDto> UpdateAsync(string guid, DesignationUpdateDto updateDto, string updatedByGUID, string? groupGUID = null);
        Task<DesignationResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<DesignationResponseDto>> GetAllAsync(DesignationFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
    Task<List<DesignationSimpleDto>> GetActiveDesignationsAsync(string? search = null, string? groupGUID = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportDesignationsAsync(string format);
    }
}
