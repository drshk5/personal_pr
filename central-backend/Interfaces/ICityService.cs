using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.City;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.Interfaces
{
    public interface ICityService
    {
        Task<CityResponseDto> CreateAsync(CityCreateDto dto, string userId);
        Task<CityResponseDto> UpdateAsync(CityUpdateDto dto, string userId);
        Task<bool> DeleteAsync(string cityGuid);
        Task<CityResponseDto> GetByIdAsync(string cityGuid);
        Task<PagedList<CityResponseDto>> GetAllAsync(CityFilterDto filter);
        Task<List<CitySimpleDto>> GetCitiesByCountryAndStateAsync(string countryGuid, string stateGuid, string? search = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportCitiesAsync(string format);
        Task<ImportCityResultDto> ImportCitiesAsync(Microsoft.AspNetCore.Http.IFormFile file, string userGuid);
    }
}
