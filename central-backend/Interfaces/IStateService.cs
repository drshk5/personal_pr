using AuditSoftware.DTOs.State;
using AuditSoftware.DTOs.Common;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IStateService
    {
        Task<StateResponseDto> CreateAsync(StateCreateDto createDto, string createdByGUID);
        Task<StateResponseDto> UpdateAsync(string guid, StateUpdateDto updateDto, string updatedByGUID);
        Task<StateResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<StateResponseDto>> GetAllAsync(StateFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<StateSimpleDto>> GetStatesByCountryAsync(string countryGuid, string? search = null);
        Task<List<StateSimpleDto>> GetActiveStatesAsync(string? search = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportStatesAsync(string format);
        Task<ImportStateResultDto> ImportStatesAsync(Microsoft.AspNetCore.Http.IFormFile file, string userGuid);
    }
}
