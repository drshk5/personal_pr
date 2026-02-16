using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.State;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text;
using System.IO;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using ClosedXML.Excel;

namespace AuditSoftware.Services
{
    public class StateService :  ServiceBase, IStateService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<StateService> _logger;

        public StateService(
            AppDbContext context, 
            IMapper mapper,
            ILogger<StateService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<StateResponseDto> CreateAsync(StateCreateDto createDto, string createdByGUID)
        {
            // Check if country exists
            var countryExists = await _context.MstCountry.AnyAsync(c => c.strCountryGUID == Guid.Parse(createDto.strCountryGUID));
            if (!countryExists)
                throw new BusinessException("Country not found");

            // Check for duplicate name within the same country
            var exists = await _context.MstState.AnyAsync(
                x => x.strName.ToLower() == createDto.strName.ToLower() && 
                     x.strCountryGUID == Guid.Parse(createDto.strCountryGUID));

            if (exists)
                throw new BusinessException($"A state with name '{createDto.strName}' already exists for this country");

            var state = new MstState
            {
                strStateGUID = Guid.NewGuid(),
                strName = createDto.strName,
                strCountryGUID = Guid.Parse(createDto.strCountryGUID),
                bolIsActive = createDto.bolIsActive,
                strCreatedByGUID = Guid.Parse(createdByGUID),
                dtCreatedOn = CurrentDateTime,
                strUpdatedByGUID = Guid.Parse(createdByGUID),
                dtUpdatedOn = CurrentDateTime
            };

            _context.MstState.Add(state);
            await _context.SaveChangesAsync();

            return await GetStateResponseWithCountryName(state);
        }

        public async Task<StateResponseDto> UpdateAsync(string guid, StateUpdateDto updateDto, string updatedByGUID)
        {
            var state = await _context.MstState.FindAsync(Guid.Parse(guid));
            if (state == null)
                throw new BusinessException("State not found");

            // Check if country exists
            var countryExists = await _context.MstCountry.AnyAsync(c => c.strCountryGUID == Guid.Parse(updateDto.strCountryGUID));
            if (!countryExists)
                throw new BusinessException("Country not found");

            // Check for duplicate name within the same country, excluding current state
            var exists = await _context.MstState.AnyAsync(
                x => x.strName.ToLower() == updateDto.strName.ToLower() && 
                     x.strCountryGUID == Guid.Parse(updateDto.strCountryGUID) && 
                     x.strStateGUID != state.strStateGUID);

            if (exists)
                throw new BusinessException($"Another state with name '{updateDto.strName}' already exists for this country");

            state.strName = updateDto.strName;
            state.strCountryGUID = Guid.Parse(updateDto.strCountryGUID);
            state.bolIsActive = updateDto.bolIsActive;
            state.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            state.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return await GetStateResponseWithCountryName(state);
        }

        public async Task<StateResponseDto> GetByIdAsync(string guid)
        {
            var state = await _context.MstState.FindAsync(Guid.Parse(guid));
            if (state == null)
                throw new BusinessException("State not found");

            return await GetStateResponseWithCountryName(state);
        }

        public async Task<PagedResponse<StateResponseDto>> GetAllAsync(StateFilterDto filterDto)
        {
            var query = _context.MstState.AsQueryable();

            // Apply search filter - handle searching for "active" or "inactive" status
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active states
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive states
                    query = query.Where(x => x.bolIsActive == false);
                }
                else
                {
                    // Regular name search or search by country name
                    var countries = await _context.MstCountry
                        .Where(c => c.strName.ToLower().Contains(searchTerm))
                        .Select(c => c.strCountryGUID)
                        .ToListAsync();
                        
                    query = query.Where(x => 
                        x.strName.ToLower().Contains(searchTerm) || 
                        countries.Contains(x.strCountryGUID)
                    );
                }
            }

            // Process country filter from comma-separated string
            List<Guid> countryGuids = new List<Guid>();
            
            // Check for comma-separated string input
            if (!string.IsNullOrWhiteSpace(filterDto.strCountryGUIDs))
            {
                var guidStrings = filterDto.strCountryGUIDs
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim());
                
                foreach (var guidString in guidStrings)
                {
                    if (Guid.TryParse(guidString, out Guid guid))
                    {
                        countryGuids.Add(guid);
                    }
                }
            }
            
            // Apply country filter if any guids were found
            if (countryGuids.Any())
            {
                query = query.Where(x => countryGuids.Contains(x.strCountryGUID));
            }

            // Apply active status filter
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Prepare for sorting by country name (join with country table)
            var queryWithCountry = query.Join(
                _context.MstCountry,
                state => state.strCountryGUID,
                country => country.strCountryGUID,
                (state, country) => new { State = state, Country = country }
            ).AsQueryable();

            // Apply sorting
            if (!string.IsNullOrEmpty(filterDto.sortBy))
            {
                switch (filterDto.sortBy.ToLower())
                {
                    case "strname":
                    case "name":
                        query = !filterDto.ascending
                            ? query.OrderByDescending(x => x.strName)
                            : query.OrderBy(x => x.strName);
                        break;
                    case "country":
                    case "countryname":
                    case "strcountryname":
                        // We need to collect all items, sort them manually, and then apply pagination
                        // because we need to sort by the country name which is obtained after query execution
                        return await SortByCountryName(query, filterDto);
                    case "status":
                    case "bolisactive":
                        query = !filterDto.ascending
                            ? query.OrderBy(x => x.bolIsActive) // Show inactive first in descending order
                            : query.OrderByDescending(x => x.bolIsActive); // Show active first in ascending order
                        break;
                    case "createdon":
                    case "dtcreatedon":
                        query = !filterDto.ascending
                            ? query.OrderByDescending(x => x.dtCreatedOn)
                            : query.OrderBy(x => x.dtCreatedOn);
                        break;
                    case "updatedon":
                    case "dtupdatedon":
                        query = !filterDto.ascending
                            ? query.OrderByDescending(x => x.dtUpdatedOn)
                            : query.OrderBy(x => x.dtUpdatedOn);
                        break;
                    default:
                        query = query.OrderByDescending(x => x.bolIsActive).ThenBy(x => x.strName);
                        break;
                }
            }
            else
            {
                query = query.OrderByDescending(x => x.bolIsActive).ThenBy(x => x.strName);
            }

            var totalRecords = await query.CountAsync();
            var items = await query
                .Skip((filterDto.pageNumber - 1) * filterDto.pageSize)
                .Take(filterDto.pageSize)
                .ToListAsync();

            var stateResponseDtos = new List<StateResponseDto>();
            foreach (var state in items)
            {
                stateResponseDtos.Add(await GetStateResponseWithCountryName(state));
            }

            return new PagedResponse<StateResponseDto>
            {
                Items = stateResponseDtos,
                TotalCount = totalRecords,
                PageNumber = filterDto.pageNumber,
                PageSize = filterDto.pageSize
            };
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var state = await _context.MstState.FindAsync(Guid.Parse(guid));
            if (state == null)
                return false;

            _context.MstState.Remove(state);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<StateSimpleDto>> GetStatesByCountryAsync(string countryGuid, string? search = null)
        {
            // Check if country exists
            var countryExists = await _context.MstCountry.AnyAsync(c => c.strCountryGUID == Guid.Parse(countryGuid));
            if (!countryExists)
                throw new BusinessException("Country not found");

            var query = _context.MstState
                .Where(x => x.strCountryGUID == Guid.Parse(countryGuid) && x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(searchTerm));
            }

            var states = await query.OrderBy(x => x.strName).ToListAsync();

            var stateSimpleDtos = new List<StateSimpleDto>();
            foreach (var state in states)
            {
                stateSimpleDtos.Add(new StateSimpleDto
                {
                    strStateGUID = state.strStateGUID.ToString(),
                    strName = state.strName
                });
            }

            return stateSimpleDtos;
        }

        public async Task<List<StateSimpleDto>> GetActiveStatesAsync(string? search = null)
        {
            var query = _context.MstState
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(searchTerm));
            }

            var states = await query.OrderBy(x => x.strName).ToListAsync();

            var stateSimpleDtos = new List<StateSimpleDto>();
            foreach (var state in states)
            {
                stateSimpleDtos.Add(new StateSimpleDto
                {
                    strStateGUID = state.strStateGUID.ToString(),
                    strName = state.strName
                });
            }

            return stateSimpleDtos;
        }

        private async Task<StateResponseDto> GetStateResponseWithCountryName(MstState state)
        {
            var country = await _context.MstCountry.FindAsync(state.strCountryGUID);
            
            var stateResponseDto = _mapper.Map<StateResponseDto>(state);
            stateResponseDto.strCountryName = country?.strName ?? "Unknown Country";
            
            return stateResponseDto;
        }
        
        private async Task<PagedResponse<StateResponseDto>> SortByCountryName(IQueryable<MstState> query, StateFilterDto filterDto)
        {
            // First, get all the states that match the filters
            var items = await query.ToListAsync();
            
            // Get all relevant countries
            var countryGuids = items.Select(x => x.strCountryGUID).Distinct().ToList();
            var countries = await _context.MstCountry
                .Where(c => countryGuids.Contains(c.strCountryGUID))
                .ToDictionaryAsync(c => c.strCountryGUID, c => c.strName);
                
            // Map states to response DTOs with country names
            var stateResponses = items.Select(state => {
                var dto = _mapper.Map<StateResponseDto>(state);
                dto.strCountryName = countries.ContainsKey(state.strCountryGUID) ? 
                    countries[state.strCountryGUID] : "Unknown Country";
                return dto;
            }).ToList();
            
            // Sort by country name
            if (!filterDto.ascending)
            {
                stateResponses = stateResponses
                    .OrderByDescending(x => x.strCountryName)
                    .ThenBy(x => x.strName) // Secondary sort by state name
                    .ToList();
            }
            else
            {
                stateResponses = stateResponses
                    .OrderBy(x => x.strCountryName)
                    .ThenBy(x => x.strName) // Secondary sort by state name
                    .ToList();
            }
            
            // Get total count
            int totalCount = stateResponses.Count;
            
            // Apply pagination
            var pagedItems = stateResponses
                .Skip((filterDto.pageNumber - 1) * filterDto.pageSize)
                .Take(filterDto.pageSize)
                .ToList();
                
            return new PagedResponse<StateResponseDto>
            {
                Items = pagedItems,
                TotalCount = totalCount,
                PageNumber = filterDto.pageNumber,
                PageSize = filterDto.pageSize
            };
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportStatesAsync(string format)
        {
            // Get all states with country information
            var states = await _context.MstState
                .Include(x => x.Country)
                .OrderBy(x => x.Country.strName)
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
                var worksheet = workbook.Worksheets.Add("States");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "State Name";
                worksheet.Cell(1, 2).Value = "Country Name";
                worksheet.Cell(1, 3).Value = "Status";
                worksheet.Cell(1, 4).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < states.Count; i++)
                {
                    var state = states[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = state.strName;
                    worksheet.Cell(row, 2).Value = state.Country?.strName ?? "N/A";
                    worksheet.Cell(row, 3).Value = state.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 4).Value = state.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"States_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("State Name,Country Name,Status,Created On");
                
                // Add data rows
                foreach (var state in states)
                {
                    csv.AppendLine($"\"{state.strName.Replace("\"", "\"\"")}\",\"{(state.Country?.strName ?? "N/A").Replace("\"", "\"\"")}\",{(state.bolIsActive ? "Active" : "Inactive")},{state.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"States_{timestamp}.csv");
            }
        }

        public async Task<ImportStateResultDto> ImportStatesAsync(IFormFile file, string userGuid)
{
    var result = new ImportStateResultDto();
    var countryCache = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
    var missingCountries = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

    // Use the execution strategy instead of user-initiated transaction
    var strategy = _context.Database.CreateExecutionStrategy();
    await strategy.ExecuteAsync(async () =>
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
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
                    var stateName = row.Cell(2).GetString().Trim();
                    
                    // Parse status from column C
                    bool isActive;
                    var statusValue = row.Cell(3).GetString().Trim().ToLower();
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

                    // Validate required fields
                    if (string.IsNullOrWhiteSpace(countryName) || string.IsNullOrWhiteSpace(stateName))
                    {
                        result.ErrorMessages.Add($"Row {row.RowNumber()}: Country name and State name are required");
                        result.FailureCount++;
                        continue;
                    }

                    // Get country GUID from cache or database
                    string countryGuid;
                    if (!countryCache.TryGetValue(countryName, out countryGuid))
                    {
                        var country = await _context.MstCountry
                            .FirstOrDefaultAsync(c => c.strName.ToLower() == countryName.ToLower());

                        if (country == null)
                        {
                            if (!missingCountries.Contains(countryName))
                            {
                                missingCountries.Add(countryName);
                                result.MissingCountries.Add(countryName);
                            }
                            result.ErrorMessages.Add($"Row {row.RowNumber()}: Country '{countryName}' not found");
                            result.FailureCount++;
                            continue;
                        }

                        countryGuid = country.strCountryGUID.ToString();
                        countryCache[countryName] = countryGuid;
                    }

                    if (countryGuid == null)
                    {
                        result.ErrorMessages.Add($"Row {row.RowNumber()}: Unable to get country GUID for '{countryName}'");
                        result.FailureCount++;
                        continue;
                    }

                    // Check if state already exists for this country
                    var existingState = await _context.MstState
                        .FirstOrDefaultAsync(s => s.strCountryGUID == Guid.Parse(countryGuid) && 
                                                s.strName.ToLower() == stateName.ToLower());

                    if (existingState != null)
                    {
                        // Reject duplicate state for the same country
                        result.ErrorMessages.Add($"Row {row.RowNumber()}: State '{stateName}' already exists for country '{countryName}'");
                        result.FailureCount++;
                        continue;
                    }

                    // Create new state
                    var newState = new MstState
                    {
                        strStateGUID = Guid.NewGuid(),
                        strName = stateName,
                        strCountryGUID = Guid.Parse(countryGuid),
                        bolIsActive = isActive,
                        strCreatedByGUID = Guid.Parse(userGuid),
                        dtCreatedOn = CurrentDateTime,
                        strUpdatedByGUID = Guid.Parse(userGuid),
                        dtUpdatedOn = CurrentDateTime
                    };
                    await _context.MstState.AddAsync(newState);
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
            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            throw new BusinessException($"Import failed: {ex.Message}");
        }
    });

    return result;
}
    }
}
