using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AuditSoftware.Data;
using AuditSoftware.DTOs.City;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.IO;
using ClosedXML.Excel;

namespace AuditSoftware.Services
{
    public class CityService :  ServiceBase, ICityService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public CityService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ImportCityResultDto> ImportCitiesAsync(Microsoft.AspNetCore.Http.IFormFile file, string userGuid)
        {
            var result = new ImportCityResultDto();
            var missingLocationsCache = new HashSet<(string CountryName, string StateName)>();
            var duplicateCitiesCache = new HashSet<string>();
            List<MstCity> citiesToAdd = new List<MstCity>();

            try
            {
                // First parse the Excel file without database operations
                using var stream = file.OpenReadStream();
                using var workbook = new XLWorkbook(stream);
                var worksheet = workbook.Worksheet(1);
                
                var rowsUsed = worksheet.RowsUsed().Skip(1); // Skip header row
                result.TotalRows = rowsUsed.Count();

                // Create an execution strategy for our operations
                var strategy = _context.Database.CreateExecutionStrategy();
                
                // Process each row in the Excel file
                foreach (var row in rowsUsed)
                {
                    try
                    {
                        // Skip empty rows
                        if (row.IsEmpty() || row.Cells().Any(c => string.IsNullOrWhiteSpace(c.GetString())))
                        {
                            continue;
                        }

                        var countryName = row.Cell(1).GetString().Trim();
                        var stateName = row.Cell(2).GetString().Trim();
                        var cityName = row.Cell(3).GetString().Trim();
                        
                        // Parse status from column D
                        bool isActive;
                        var statusValue = row.Cell(4).GetString().Trim().ToLower();
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

                        await strategy.ExecuteAsync(async () => 
                        {
                            // Get country and state
                            var country = await _context.MstCountry
                                .FirstOrDefaultAsync(c => c.strName.ToLower() == countryName.ToLower());

                            if (country == null)
                            {
                                if (missingLocationsCache.Add((countryName, stateName)))
                                {
                                    result.MissingLocations.Add(new MissingLocation 
                                    { 
                                        CountryName = countryName, 
                                        StateName = stateName 
                                    });
                                }
                                result.ErrorMessages.Add($"Row {row.RowNumber()}: Country '{countryName}' not found");
                                result.FailureCount++;
                                return;
                            }

                            var state = await _context.MstState
                                .FirstOrDefaultAsync(s => s.strCountryGUID == country.strCountryGUID && 
                                                        s.strName.ToLower() == stateName.ToLower());

                            if (state == null)
                            {
                                if (missingLocationsCache.Add((countryName, stateName)))
                                {
                                    result.MissingLocations.Add(new MissingLocation 
                                    { 
                                        CountryName = countryName, 
                                        StateName = stateName 
                                    });
                                }
                                result.ErrorMessages.Add($"Row {row.RowNumber()}: State '{stateName}' not found for country '{countryName}'");
                                result.FailureCount++;
                                return;
                            }

                            // Check for duplicate city
                            var existingCity = await _context.MstCity
                                .FirstOrDefaultAsync(c => c.strCountryGUID == country.strCountryGUID && 
                                                        c.strStateGUID == state.strStateGUID && 
                                                        c.strName.ToLower() == cityName.ToLower());

                            if (existingCity != null)
                            {
                                var duplicateKey = $"{cityName} ({stateName}, {countryName})";
                                if (duplicateCitiesCache.Add(duplicateKey))
                                {
                                    result.DuplicateCities.Add(duplicateKey);
                                }
                                result.ErrorMessages.Add($"Row {row.RowNumber()}: City '{cityName}' already exists in {stateName}, {countryName}");
                                result.FailureCount++;
                                return;
                            }

                            // Create new city
                            var newCity = new MstCity
                            {
                                strCityGUID = Guid.NewGuid(),
                                strCountryGUID = country.strCountryGUID,
                                strStateGUID = state.strStateGUID,
                                strName = cityName,
                                bolIsActive = isActive,
                                strCreatedByGUID = Guid.Parse(userGuid),
                                dtCreatedOn = CurrentDateTime,
                                strUpdatedByGUID = Guid.Parse(userGuid),
                                dtUpdatedOn = CurrentDateTime
                            };
                            
                            await _context.MstCity.AddAsync(newCity);
                            await _context.SaveChangesAsync();
                            result.SuccessCount++;
                        });
                    }
                    catch (Exception ex)
                    {
                        result.ErrorMessages.Add($"Row {row.RowNumber()}: {ex.Message}");
                        result.FailureCount++;
                    }
                }
            }
            catch (Exception ex)
            {
                throw new BusinessException($"Import failed: {ex.Message}");
            }
            
            return result;
        }

        public async Task<CityResponseDto> CreateAsync(CityCreateDto dto, string userId)
        {
            // Validate country and state
            var countryExists = await _context.MstCountry.AnyAsync(c => c.strCountryGUID == Guid.Parse(dto.strCountryGUID));
            if (!countryExists)
                throw new BusinessException("Country not found");

            var stateExists = await _context.MstState.AnyAsync(s => s.strStateGUID == Guid.Parse(dto.strStateGUID) && 
                                                                 s.strCountryGUID == Guid.Parse(dto.strCountryGUID));
            if (!stateExists)
                throw new BusinessException("State not found for the specified country");

            // Check for duplicates (same name in same country and state)
            var duplicateExists = await _context.MstCity.AnyAsync(c => 
                c.strName.ToLower() == dto.strName.ToLower() && 
                c.strCountryGUID == Guid.Parse(dto.strCountryGUID) &&
                c.strStateGUID == Guid.Parse(dto.strStateGUID));

            if (duplicateExists)
                throw new BusinessException("City with the same name already exists for this country and state");

            // Create new city
            var city = new MstCity
            {
                strCityGUID = Guid.NewGuid(),
                strName = dto.strName,
                strStateGUID = Guid.Parse(dto.strStateGUID),
                strCountryGUID = Guid.Parse(dto.strCountryGUID),
                bolIsActive = dto.bolIsActive,
                dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime(),
                strCreatedByGUID = !string.IsNullOrEmpty(userId) ? Guid.Parse(userId) : null
            };

            await _context.MstCity.AddAsync(city);
            await _context.SaveChangesAsync();

            return await GetFullCityDetailsAsync(city.strCityGUID);
        }

        public async Task<CityResponseDto> UpdateAsync(CityUpdateDto dto, string userId)
        {
            var city = await _context.MstCity.FindAsync(Guid.Parse(dto.strCityGUID));
            if (city == null)
                throw new BusinessException("City not found");

            // Validate country and state
            var countryExists = await _context.MstCountry.AnyAsync(c => c.strCountryGUID == Guid.Parse(dto.strCountryGUID));
            if (!countryExists)
                throw new BusinessException("Country not found");

            var stateExists = await _context.MstState.AnyAsync(s => s.strStateGUID == Guid.Parse(dto.strStateGUID) && 
                                                                 s.strCountryGUID == Guid.Parse(dto.strCountryGUID));
            if (!stateExists)
                throw new BusinessException("State not found for the specified country");

            // Check for duplicates (same name in same country and state, different GUID)
            var duplicateExists = await _context.MstCity.AnyAsync(c => 
                c.strName.ToLower() == dto.strName.ToLower() && 
                c.strCountryGUID == Guid.Parse(dto.strCountryGUID) &&
                c.strStateGUID == Guid.Parse(dto.strStateGUID) &&
                c.strCityGUID != Guid.Parse(dto.strCityGUID));

            if (duplicateExists)
                throw new BusinessException("City with the same name already exists for this country and state");

            // Update city
            city.strName = dto.strName;
            city.strStateGUID = Guid.Parse(dto.strStateGUID);
            city.strCountryGUID = Guid.Parse(dto.strCountryGUID);
            city.bolIsActive = dto.bolIsActive;
            city.dtUpdatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            city.strUpdatedByGUID = !string.IsNullOrEmpty(userId) ? Guid.Parse(userId) : null;

            await _context.SaveChangesAsync();

            return await GetFullCityDetailsAsync(city.strCityGUID);
        }

        public async Task<bool> DeleteAsync(string cityGuid)
        {
            var city = await _context.MstCity.FindAsync(Guid.Parse(cityGuid));
            if (city == null)
                throw new BusinessException("City not found");

            _context.MstCity.Remove(city);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<CityResponseDto> GetByIdAsync(string cityGuid)
        {
            return await GetFullCityDetailsAsync(Guid.Parse(cityGuid));
        }

        public async Task<PagedList<CityResponseDto>> GetAllAsync(CityFilterDto filter)
        {
            var query = _context.MstCity.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var searchTerm = filter.Search.ToLower().Trim();
                
                // Check if searching for status keywords (match StateService approach)
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active cities
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive cities
                    query = query.Where(x => x.bolIsActive == false);
                }
                else
                {
                    // Join with State and Country to allow searching by their names and all fields
                    var states = _context.MstState.AsQueryable();
                    var countries = _context.MstCountry.AsQueryable();
                    
                    // Perform the search with the state and country joins
                    query = from city in query
                            join state in states on city.strStateGUID equals state.strStateGUID into stateJoin
                            from state in stateJoin.DefaultIfEmpty()
                            join country in countries on city.strCountryGUID equals country.strCountryGUID into countryJoin
                            from country in countryJoin.DefaultIfEmpty()
                            where 
                                  // City fields
                                  city.strName.ToLower().Contains(searchTerm) ||
                                  city.strCityGUID.ToString().Contains(searchTerm) ||
                                  
                                  // State fields
                                  (state != null && state.strName.ToLower().Contains(searchTerm)) ||
                                  (state != null && state.strStateGUID.ToString().Contains(searchTerm)) ||
                                  
                                  // Country fields
                                  (country != null && country.strName.ToLower().Contains(searchTerm)) ||
                                  (country != null && country.strCountryGUID.ToString().Contains(searchTerm))
                                  
                            select city;
                }
            }

            if (filter.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filter.bolIsActive.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.strCountryGUID))
            {
                // Handle comma-separated GUIDs for multi-select
                var countryIds = filter.strCountryGUID.Split(',')
                    .Where(g => !string.IsNullOrWhiteSpace(g))
                    .Select(g => Guid.Parse(g.Trim()))
                    .ToList();
                    
                if (countryIds.Any())
                {
                    query = query.Where(x => countryIds.Contains(x.strCountryGUID));
                }
            }

            if (!string.IsNullOrWhiteSpace(filter.strStateGUID))
            {
                // Handle comma-separated GUIDs for multi-select
                var stateIds = filter.strStateGUID.Split(',')
                    .Where(g => !string.IsNullOrWhiteSpace(g))
                    .Select(g => Guid.Parse(g.Trim()))
                    .ToList();
                    
                if (stateIds.Any())
                {
                    query = query.Where(x => stateIds.Contains(x.strStateGUID));
                }
            }

            // Apply sorting
            string sortBy = filter.SortBy ?? "strName";

            query = filter.ascending 
                ? ApplySorting(query, sortBy, true)
                : ApplySorting(query, sortBy, false);

            var totalCount = await query.CountAsync();
            
            // Apply pagination
            var cities = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            // Get country and state names for each city
            var cityResponses = new List<CityResponseDto>();
            foreach (var city in cities)
            {
                cityResponses.Add(await GetCityResponseDto(city));
            }

            return new PagedList<CityResponseDto>(
                cityResponses,
                totalCount,
                filter.PageNumber,
                filter.PageSize
            );
        }

        public async Task<List<CitySimpleDto>> GetCitiesByCountryAndStateAsync(string countryGuid, string stateGuid, string? search = null)
        {
            // Check if country exists
            var countryExists = await _context.MstCountry.AnyAsync(c => c.strCountryGUID == Guid.Parse(countryGuid));
            if (!countryExists)
                throw new BusinessException("Country not found");

            // Check if state exists
            var stateExists = await _context.MstState.AnyAsync(s => s.strStateGUID == Guid.Parse(stateGuid) &&
                                                               s.strCountryGUID == Guid.Parse(countryGuid));
            if (!stateExists)
                throw new BusinessException("State not found for the specified country");

            var query = _context.MstCity
                .Where(x => x.strCountryGUID == Guid.Parse(countryGuid) && 
                            x.strStateGUID == Guid.Parse(stateGuid) && 
                            x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(searchTerm));
            }

            var cities = await query.OrderBy(x => x.strName).ToListAsync();

            return cities.Select(city => new CitySimpleDto
            {
                strCityGUID = city.strCityGUID.ToString(),
                strName = city.strName
            }).ToList();
        }

        private async Task<CityResponseDto> GetFullCityDetailsAsync(Guid cityGuid)
        {
            var city = await _context.MstCity
                .FirstOrDefaultAsync(c => c.strCityGUID == cityGuid);

            if (city == null)
                throw new BusinessException("City not found");

            return await GetCityResponseDto(city);
        }

        private async Task<CityResponseDto> GetCityResponseDto(MstCity city)
        {
            var country = await _context.MstCountry.FindAsync(city.strCountryGUID);
            var state = await _context.MstState.FindAsync(city.strStateGUID);

            return new CityResponseDto
            {
                strCityGUID = city.strCityGUID.ToString(),
                strName = city.strName,
                strStateGUID = city.strStateGUID.ToString(),
                strStateName = state?.strName ?? "Unknown State",
                strCountryGUID = city.strCountryGUID.ToString(),
                strCountryName = country?.strName ?? "Unknown Country",
                bolIsActive = city.bolIsActive
            };
        }

        private IQueryable<MstCity> ApplySorting(IQueryable<MstCity> query, string sortBy, bool ascending)
        {
            // Get the normalized sort field
            var sortField = sortBy?.ToLower() ?? "strname";

            // Handle different sorting scenarios based on field name
            switch (sortField)
            {
                case "country":
                case "strcountryname":
                case "countryname":
                    // Handle sorting by country name with a join
                    var countries = _context.MstCountry.AsQueryable();
                    
                    var countryJoinedQuery = from city in query
                                     join country in countries on city.strCountryGUID equals country.strCountryGUID
                                     select new { City = city, CountryName = country.strName };
                    
                    return ascending
                        ? countryJoinedQuery.OrderBy(x => x.CountryName).Select(x => x.City)
                        : countryJoinedQuery.OrderByDescending(x => x.CountryName).Select(x => x.City);
                
                case "state":
                case "strstatename":
                case "statename":
                    // Handle sorting by state name with a join
                    var states = _context.MstState.AsQueryable();
                    
                    var stateJoinedQuery = from city in query
                                   join state in states on city.strStateGUID equals state.strStateGUID
                                   select new { City = city, StateName = state.strName };
                    
                    return ascending
                        ? stateJoinedQuery.OrderBy(x => x.StateName).Select(x => x.City)
                        : stateJoinedQuery.OrderByDescending(x => x.StateName).Select(x => x.City);
                
                case "status":
                case "bolisactive":
                case "isactive":
                    // Handle sorting by active status - show active first in ascending order
                    return ascending
                        ? query.OrderByDescending(x => x.bolIsActive) // Show active first in ascending order
                        : query.OrderBy(x => x.bolIsActive); // Show inactive first in descending order
                
                case "strname":
                case "name":
                    // Sort by name
                    return ascending 
                        ? query.OrderBy(x => x.strName) 
                        : query.OrderByDescending(x => x.strName);

                case "dtcreatedon":
                case "createdon":
                case "created":
                    // Sort by creation date
                    return ascending 
                        ? query.OrderBy(x => x.dtCreatedOn) 
                        : query.OrderByDescending(x => x.dtCreatedOn);

                case "dtupdatedon":
                case "updatedon":
                case "updated":
                    // Sort by update date
                    return ascending 
                        ? query.OrderBy(x => x.dtUpdatedOn) 
                        : query.OrderByDescending(x => x.dtUpdatedOn);

                default:
                    // Default sort by active status first (active records first), then by name
                    return ascending 
                        ? query.OrderByDescending(x => x.bolIsActive).ThenBy(x => x.strName)
                        : query.OrderByDescending(x => x.bolIsActive).ThenByDescending(x => x.strName);
            }
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportCitiesAsync(string format)
        {
            // Get all cities with country and state information
            var cities = await _context.MstCity
                .Include(x => x.Country)
                .Include(x => x.State)
                .OrderBy(x => x.Country.strName)
                .ThenBy(x => x.State.strName)
                .ThenBy(x => x.strName)
                .ToListAsync();
            
            if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
            {
                throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
            }

            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            
            if (format.ToLower() == "excel")
            {
                // Create Excel file
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Cities");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "City Name";
                worksheet.Cell(1, 2).Value = "State Name";
                worksheet.Cell(1, 3).Value = "Country Name";
                worksheet.Cell(1, 4).Value = "Status";
                worksheet.Cell(1, 5).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < cities.Count; i++)
                {
                    var city = cities[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = city.strName;
                    worksheet.Cell(row, 2).Value = city.State?.strName ?? "N/A";
                    worksheet.Cell(row, 3).Value = city.Country?.strName ?? "N/A";
                    worksheet.Cell(row, 4).Value = city.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 5).Value = city.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Cities_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("City Name,State Name,Country Name,Status,Created On");
                
                // Add data rows
                foreach (var city in cities)
                {
                    csv.AppendLine($"\"{city.strName.Replace("\"", "\"\"")}\",\"{(city.State?.strName ?? "N/A").Replace("\"", "\"\"")}\",\"{(city.Country?.strName ?? "N/A").Replace("\"", "\"\"")}\",{(city.bolIsActive ? "Active" : "Inactive")},{city.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"Cities_{timestamp}.csv");
            }
        }
    }
}

