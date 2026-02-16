using AuditSoftware.DTOs.Country;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Models.Entities;

namespace AuditSoftware.Interfaces
{
    public interface ICountryService
    {
        Task<CountryResponseDto> CreateCountryAsync(CountryCreateDto dto, string userGuid);
        Task<CountryResponseDto> UpdateCountryAsync(string countryGuid, CountryUpdateDto dto, string userGuid);
        Task<CountryResponseDto> GetCountryByGuidAsync(string countryGuid);
        Task<PagedResponse<CountryResponseDto>> GetAllCountriesAsync(CountryFilterDto filter);
        Task<List<CountrySimpleDto>> GetActiveCountriesAsync(string? search = null);
        Task<bool> DeleteCountryAsync(string countryGuid, string userGuid);
        Task<bool> CountryExistsAsync(string countryGuid);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportCountriesAsync(string format);
        Task<ImportCountryResultDto> ImportCountriesAsync(IFormFile file, string userGuid);

        /// <summary>
        /// Gets the country and its currency by country GUID.
        /// </summary>
        /// <param name="countryGuid">Country GUID</param>
        /// <returns>Tuple of country and currency (null if not found)</returns>
        Task<(MstCountry? country, MstCurrencyType? currency)> GetCurrencyByCountryGuidAsync(Guid countryGuid);
    }
}
