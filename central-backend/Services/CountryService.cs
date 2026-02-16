// ...existing code...

using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using ClosedXML.Excel;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Country;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;

namespace AuditSoftware.Services
{
    public class CountryService :  ServiceBase, ICountryService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CountryService> _logger;

        public CountryService(
            AppDbContext context, 
            IMapper mapper,
            ILogger<CountryService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<(MstCountry? country, MstCurrencyType? currency)> GetCurrencyByCountryGuidAsync(Guid countryGuid)
        {
            var country = await _context.MstCountry.FirstOrDefaultAsync(c => c.strCountryGUID == countryGuid && c.bolIsActive);
            if (country == null)
            {
                return (null, null);
            }
            var currency = await _context.MstCurrencyTypes.FirstOrDefaultAsync(ct => ct.strCountryGUID == countryGuid && ct.bolIsActive);
            return (country, currency);
        }

        public async Task<CountryResponseDto> CreateCountryAsync(CountryCreateDto dto, string userGuid)
        {
            var existingCountry = await _context.MstCountry
                .FirstOrDefaultAsync(x => x.strName.ToLower() == dto.strName.ToLower());

            if (existingCountry != null)
            {
                throw new BusinessException("Country with this name already exists");
            }

            var country = new MstCountry
            {
                strCountryGUID = Guid.NewGuid(),
                strName = dto.strName,
                strCountryCode = dto.strCountryCode?.Trim(),
                strDialCode = dto.strDialCode?.Trim(),
                intPhoneMinLength = dto.intPhoneMinLength,
                intPhoneMaxLength = dto.intPhoneMaxLength,
                bolIsActive = dto.bolIsActive,
                strCreatedByGUID = Guid.Parse(userGuid),
                dtCreatedOn = CurrentDateTime,
                strUpdatedByGUID = Guid.Parse(userGuid),
                dtUpdatedOn = CurrentDateTime
            };

            _context.MstCountry.Add(country);
            await _context.SaveChangesAsync();

            return _mapper.Map<CountryResponseDto>(country);
        }

        public async Task<CountryResponseDto> UpdateCountryAsync(string countryGuid, CountryUpdateDto dto, string userGuid)
        {
            var country = await _context.MstCountry
                .FirstOrDefaultAsync(x => x.strCountryGUID == Guid.Parse(countryGuid));

            if (country == null)
            {
                throw new BusinessException("Country not found");
            }

            var existingCountry = await _context.MstCountry
                .FirstOrDefaultAsync(x => x.strName.ToLower() == dto.strName.ToLower() 
                    && x.strCountryGUID != Guid.Parse(countryGuid));

            if (existingCountry != null)
            {
                throw new BusinessException("Another country with this name already exists");
            }

            country.strName = dto.strName;
            country.strCountryCode = dto.strCountryCode?.Trim();
            country.strDialCode = dto.strDialCode?.Trim();
            country.intPhoneMinLength = dto.intPhoneMinLength;
            country.intPhoneMaxLength = dto.intPhoneMaxLength;
            country.bolIsActive = dto.bolIsActive;
            country.strUpdatedByGUID = Guid.Parse(userGuid);
            country.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<CountryResponseDto>(country);
        }

        public async Task<CountryResponseDto> GetCountryByGuidAsync(string countryGuid)
        {
            var country = await _context.MstCountry
                .FirstOrDefaultAsync(x => x.strCountryGUID == Guid.Parse(countryGuid));

            if (country == null)
            {
                throw new BusinessException("Country not found");
            }

            return _mapper.Map<CountryResponseDto>(country);
        }

        public async Task<PagedResponse<CountryResponseDto>> GetAllCountriesAsync(CountryFilterDto filter)
        {
            var query = _context.MstCountry.AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var searchTerm = filter.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active countries
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive countries
                    query = query.Where(x => x.bolIsActive == false);
                }
                else
                {
                    // Regular name search
                    query = query.Where(x => x.strName.ToLower().Contains(searchTerm));
                }
            }

            if (filter.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filter.bolIsActive.Value);
            }

            var totalRecords = await query.CountAsync();

            // Apply sorting
            query = filter.sortBy?.ToLower() switch
{
    "strname" or "name" => filter.ascending 
        ? query.OrderBy(x => x.strName)
        : query.OrderByDescending(x => x.strName),
    "status" or "bolisactive" => filter.ascending 
        ? query.OrderByDescending(x => x.bolIsActive) // Show active first in ascending order
        : query.OrderBy(x => x.bolIsActive), // Show inactive first in descending order
    _ => query.OrderByDescending(x => x.bolIsActive).ThenBy(x => x.strName)
};

            var items = await query
                .Skip((filter.pageNumber - 1) * filter.pageSize)
                .Take(filter.pageSize)
                .ToListAsync();

            var mapped = _mapper.Map<List<CountryResponseDto>>(items);

            return new PagedResponse<CountryResponseDto>
            {
                Items = mapped,
                TotalCount = totalRecords,
                PageNumber = filter.pageNumber,
                PageSize = filter.pageSize
            };
        }

        public async Task<List<CountrySimpleDto>> GetActiveCountriesAsync(string? search = null)
        {
            var query = _context.MstCountry
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x => x.strName.ToLower().Contains(search.ToLower()));
            }

            var countries = await query
                .OrderBy(x => x.strName)
                .ToListAsync();

            var mapped = _mapper.Map<List<CountrySimpleDto>>(countries);
            return mapped;
        }

        public async Task<bool> DeleteCountryAsync(string countryGuid, string userGuid)
        {
            var country = await _context.MstCountry
                .FirstOrDefaultAsync(x => x.strCountryGUID == Guid.Parse(countryGuid));

            if (country == null)
            {
                throw new BusinessException("Country not found");
            }

            _context.MstCountry.Remove(country);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> CountryExistsAsync(string countryGuid)
        {
            return await _context.MstCountry.AnyAsync(x => x.strCountryGUID == Guid.Parse(countryGuid));
        }
        
        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportCountriesAsync(string format)
        {
            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");

            // Get all countries
            var countries = await _context.MstCountry
                .OrderBy(x => x.strName)
                .ToListAsync();

            if (format.ToLower() == "excel")
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Countries");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Country Code";
                worksheet.Cell(1, 3).Value = "Dial Code";
                worksheet.Cell(1, 4).Value = "Phone Min Length";
                worksheet.Cell(1, 5).Value = "Phone Max Length";
                worksheet.Cell(1, 6).Value = "Currency GUID";
                worksheet.Cell(1, 7).Value = "Status";
                
                // Add data
                var row = 2;

                // Pre-fetch currencies to avoid N+1
                var countryGuids = countries.Select(c => c.strCountryGUID).ToList();
                var currencies = await _context.MstCurrencyTypes
                    .Where(ct => ct.strCountryGUID != null && countryGuids.Contains(ct.strCountryGUID.Value) && ct.bolIsActive)
                    .ToListAsync();
                var currencyMap = currencies.ToDictionary(c => c.strCountryGUID.Value, c => c.strCurrencyTypeGUID.ToString());

                foreach (var country in countries)
                {
                    worksheet.Cell(row, 1).Value = country.strName;
                    worksheet.Cell(row, 2).Value = country.strCountryCode ?? string.Empty;
                    worksheet.Cell(row, 3).Value = country.strDialCode ?? string.Empty;
                    worksheet.Cell(row, 4).Value = country.intPhoneMinLength;
                    worksheet.Cell(row, 5).Value = country.intPhoneMaxLength;

                    if (currencyMap.TryGetValue(country.strCountryGUID, out var cur))
                    {
                        worksheet.Cell(row, 6).Value = cur;
                    }
                    else
                    {
                        worksheet.Cell(row, 6).Value = string.Empty;
                    }

                    worksheet.Cell(row, 7).Value = country.bolIsActive;
                    row++;
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Generate Excel file
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                return (stream.ToArray(), 
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                    $"Countries_{timestamp}.xlsx");
            }
            
            // CSV format
            var csv = new StringBuilder();
            csv.AppendLine("Name,Country Code,Dial Code,Phone Min Length,Phone Max Length,Status");
            
            foreach (var country in countries)
            {
                var line = $"{country.strName},{country.strCountryCode},{country.strDialCode},{country.intPhoneMinLength},{country.intPhoneMaxLength},{country.bolIsActive}";
                csv.AppendLine(line);
            }
            
            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return (bytes, "text/csv", $"Countries_{timestamp}.csv");
        }

        public async Task<ImportCountryResultDto> ImportCountriesAsync(IFormFile file, string userGuid)
        {
            var result = new ImportCountryResultDto();
            
            using var stream = file.OpenReadStream();
            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheet(1);
            
            var rowsUsed = worksheet.RowsUsed().Skip(1); // Skip header row
            result.TotalRows = rowsUsed.Count();

            foreach (var row in rowsUsed)
            {
                try
                {
                    // Skip empty rows
                    if (row.IsEmpty() || string.IsNullOrWhiteSpace(row.Cell(1).GetString()))
                    {
                        continue;
                    }

                    var countryName = row.Cell(1).GetString().Trim();
                    bool isActive;

                    var statusValue = row.Cell(2).GetString().Trim().ToLower();
                    if (statusValue == "true" || statusValue == "1")
                        isActive = true;
                    else if (statusValue == "false" || statusValue == "0")
                        isActive = false;
                    else
                    {
                        result.ErrorMessages.Add($"Row {row.RowNumber()}: Invalid status value. Must be true/false or 1/0");
                        result.FailureCount++;
                        continue;
                    }

                    var countryCode = row.Cell(3).GetString().Trim();
                    var dialCode = row.Cell(4).GetString().Trim();

                    int? phoneMinLength = null;
                    int? phoneMaxLength = null;

                    var minLengthValue = row.Cell(5).GetString().Trim();
                    if (!string.IsNullOrEmpty(minLengthValue))
                    {
                        if (int.TryParse(minLengthValue, out var parsedMinLength))
                        {
                            phoneMinLength = parsedMinLength;
                        }
                        else
                        {
                            result.ErrorMessages.Add($"Row {row.RowNumber()}: Invalid phone min length; must be a whole number");
                            result.FailureCount++;
                            continue;
                        }
                    }

                    var maxLengthValue = row.Cell(6).GetString().Trim();
                    if (!string.IsNullOrEmpty(maxLengthValue))
                    {
                        if (int.TryParse(maxLengthValue, out var parsedMaxLength))
                        {
                            phoneMaxLength = parsedMaxLength;
                        }
                        else
                        {
                            result.ErrorMessages.Add($"Row {row.RowNumber()}: Invalid phone max length; must be a whole number");
                            result.FailureCount++;
                            continue;
                        }
                    }

                    // Check if country name is empty
                    if (string.IsNullOrWhiteSpace(countryName))
                    {
                        result.ErrorMessages.Add($"Row {row.RowNumber()}: Country name cannot be empty");
                        result.FailureCount++;
                        continue;
                    }

                    // Check if country already exists
                    var existingCountry = await _context.MstCountry
                        .FirstOrDefaultAsync(c => c.strName.ToLower() == countryName.ToLower());

                    if (existingCountry != null)
                    {
                        // Reject duplicate country
                        result.ErrorMessages.Add($"Row {row.RowNumber()}: Country '{countryName}' already exists in the system");
                        result.FailureCount++;
                        continue;
                    }

                    // Create new country
                    var newCountry = new MstCountry
                    {
                        strCountryGUID = Guid.NewGuid(),
                        strName = countryName,
                        strCountryCode = string.IsNullOrWhiteSpace(countryCode) ? null : countryCode,
                        strDialCode = string.IsNullOrWhiteSpace(dialCode) ? null : dialCode,
                        intPhoneMinLength = phoneMinLength,
                        intPhoneMaxLength = phoneMaxLength,
                        bolIsActive = isActive,
                        strCreatedByGUID = Guid.Parse(userGuid),
                        dtCreatedOn = CurrentDateTime,
                        strUpdatedByGUID = Guid.Parse(userGuid),
                        dtUpdatedOn = CurrentDateTime
                    };
                    await _context.MstCountry.AddAsync(newCountry);
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error processing row {row.RowNumber()}");
                    result.ErrorMessages.Add($"Row {row.RowNumber()}: {ex.Message}");
                    result.FailureCount++;
                }
            }

            await _context.SaveChangesAsync();
            return result;
        }
    }
}

