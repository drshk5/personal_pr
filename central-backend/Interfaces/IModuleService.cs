using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Module;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.Interfaces
{
    public interface IModuleService
    {
        Task<ModuleResponseDto> CreateAsync(ModuleCreateDto createDto, string createdByGUID);
        Task<ModuleResponseDto> UpdateAsync(string guid, ModuleUpdateDto updateDto, string updatedByGUID);
        Task<ModuleResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<ModuleResponseDto>> GetAllAsync(ModuleFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<ModuleSimpleDto>> GetActiveModulesAsync(string? searchTerm = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportModulesAsync(string format);
    }
}
