using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using System.Text;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Year;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.UserDetails;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Models.Core;
using AuditSoftware.Exceptions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using AuditSoftware.Helpers;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.Services
{
    public class YearService :  ServiceBase, IYearService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<YearService> _logger;
        private readonly IUserDetailsService _userDetailsService;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IFileStorageService _fileStorageService;

        public YearService(
            AppDbContext context, 
            IMapper mapper, 
            ILogger<YearService> logger,
            IUserDetailsService userDetailsService,
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor,
            IFileStorageService fileStorageService)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _userDetailsService = userDetailsService;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
            _fileStorageService = fileStorageService;
        }

        public async Task<YearResponseDto> CreateAsync(YearCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid)
        {
            try
            {
                // Check if a year with the same name already exists for this organization and group
                bool duplicateExists = await _context.Set<MstYear>()
                    .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower() 
                              && x.strOrganizationGUID == organizationGuid 
                              && x.strGroupGUID == groupGuid);
                
                if (duplicateExists)
                {
                    throw new BusinessException($"A year with the name '{createDto.strName}' already exists for this organization");
                }
                
                // Use transaction to ensure both Year and UserDetails are created together
                var strategy = _context.Database.CreateExecutionStrategy();
                return await strategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        var year = _mapper.Map<MstYear>(createDto);
                        year.strYearGUID = Guid.NewGuid();
                        year.strCreatedByGUID = currentUserGuid;
                        year.dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
                        year.strGroupGUID = groupGuid;
                        year.strOrganizationGUID = organizationGuid;
                        
                        // Set update fields same as create fields by default
                        year.strUpdatedByGUID = year.strCreatedByGUID;
                        year.dtUpdatedOn = year.dtCreatedOn;
                        
                        // Build detailed creation message
                        var details = new List<string>();
                        details.Add($"name: '{year.strName}'");
                        details.Add($"start date: '{year.dtStartDate:yyyy-MM-dd}'");
                        details.Add($"end date: '{year.dtEndDate:yyyy-MM-dd}'");
                        details.Add($"status: {(year.bolIsActive ? "Active" : "Inactive")}");

                        // Create activity log
                        var activityLog = new MstUserActivityLog
                        {
                            ActivityLogGUID = Guid.NewGuid(),
                            UserGUID = currentUserGuid,
                            GroupGUID = groupGuid,
                            ActivityType = "CREATE_YEAR",
                            Details = $"Created new year with {string.Join(", ", details)}",
                            EntityType = "Year",
                            EntityGUID = year.strYearGUID,
                            OrganizationGUID = organizationGuid,
                            NewValue = JsonSerializer.Serialize(new
                            {
                                name = year.strName,
                                startDate = year.dtStartDate,
                                endDate = year.dtEndDate,
                                isActive = year.bolIsActive,
                                organizationGuid = year.strOrganizationGUID,
                                previousYearGuid = year.strPreviousYearGUID,
                                nextYearGuid = year.strNextYearGUID
                            }),
                            CreatedByGUID = currentUserGuid,
                            CreatedOn = year.dtCreatedOn,
                            ActivityTime = year.dtCreatedOn
                        };

                        _context.Add(year);
                        _context.MstUserActivityLogs.Add(activityLog);
                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation($"Year created successfully with GUID: {year.strYearGUID}");
                        
                        // Get user role GUID for the current user
                        var userDetails = await _context.MstUserDetails
                            .Where(ud => ud.strUserGUID == currentUserGuid)
                            .OrderByDescending(ud => ud.dtCreatedOn)
                            .FirstOrDefaultAsync();
                        
                        if (userDetails == null)
                        {
                            _logger.LogError($"Unable to find user details for user GUID: {currentUserGuid}");
                            throw new BusinessException("User details not found for the current user");
                        }
                        
                        Guid userRoleGUID = userDetails.strUserRoleGUID;
                        
                        // Create new UserDetails entry for the new year
                        var newUserDetails = new MstUserDetails
                        {
                            strUserDetailGUID = Guid.NewGuid(),
                            strUserGUID = currentUserGuid,
                            strOrganizationGUID = organizationGuid,
                            strUserRoleGUID = userRoleGUID,
                            strGroupGUID = groupGuid,
                            strYearGUID = year.strYearGUID,
                            strModuleGUID = userDetails.strModuleGUID, // Copy from existing user details
                            bolIsActive = true,
                            dtCreatedOn = year.dtCreatedOn,
                            dtUpdatedOn = year.dtCreatedOn,
                            strCreatedByGUID = currentUserGuid,
                            strUpdatedByGUID = currentUserGuid
                        };
                        
                        _context.MstUserDetails.Add(newUserDetails);
                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation($"UserDetails created for Year {year.strName} with GUID: {newUserDetails.strUserDetailGUID}");
                        
                        await transaction.CommitAsync();
                        
                        // Create folder structure for the newly created year
                        try
                        {
                            // We only need to create folders inside module folders, not directly under the group folder
                            // First create base documents and group folders
                            string documentsBasePath = _fileStorageService.CreateDirectoryStructure("Documents");
                            _logger.LogInformation($"Documents base folder created or verified at {documentsBasePath}");
                            
                            string groupFolderName = groupGuid.ToString();
                            string groupFolderPath = _fileStorageService.CreateDirectoryStructure("Documents", groupFolderName);
                            _logger.LogInformation($"Group folder created or verified at {groupFolderPath}");
                            
                            // Get all modules assigned to this group
                            var modulesFolders = await _context.MstGroupModules
                                .Where(gm => gm.strGroupGUID == groupGuid)
                                .ToListAsync();
                                
                            _logger.LogInformation($"Found {modulesFolders.Count} modules assigned to group {groupGuid}");
                            
                            // Create year folders inside each module's organization folder
                            foreach (var groupModule in modulesFolders)
                            {
                                try
                                {
                                    // Create module folder inside the group folder
                                    string moduleGuidStr = groupModule.strModuleGUID.ToString();
                                    string moduleFolderPath = _fileStorageService.CreateDirectoryStructure("Documents", groupFolderName, moduleGuidStr);
                                    _logger.LogInformation($"Created or verified module directory: {moduleFolderPath}");
                                    
                                    // Create organization folder inside the module folder
                                    string orgGuidStr = organizationGuid.ToString();
                                    string moduleOrgFolderPath = _fileStorageService.CreateDirectoryStructure("Documents", groupFolderName, moduleGuidStr, orgGuidStr);
                                    _logger.LogInformation($"Created or verified organization directory inside module: {moduleOrgFolderPath}");
                                    
                                    // Create year folder inside the organization folder
                                    string yearGuidStr = year.strYearGUID.ToString();
                                    string moduleYearFolderPath = _fileStorageService.CreateDirectoryStructure("Documents", groupFolderName, moduleGuidStr, orgGuidStr, yearGuidStr);
                                    _logger.LogInformation($"Created year directory inside module organization: {moduleYearFolderPath}");
                                }
                                catch (Exception moduleEx)
                                {
                                    _logger.LogError(moduleEx, $"Error creating folder structure for module {groupModule.strModuleGUID}");
                                    // Continue with other modules even if this one fails
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error creating document folder structure for year");
                            // Continue with year creation even if folder creation fails
                        }
                        
                        // No longer updating or creating MstUserInfos records during year creation
                        // This is consistent with the overall application design
                        // Users will need to explicitly switch to this organization/year using the UserRights/switch-organization endpoint
                        _logger.LogInformation($"Skipping MstUserInfo update for year: {year.strYearGUID} (consistent with application policy)");
                        
                        // Call accounting API to copy MstDocNo records for the new year
                        try
                        {
                            bool copyResult = await CopyMstDocNoForYearAsync(year.strYearGUID);
                            if (copyResult)
                            {
                                _logger.LogInformation($"Successfully copied MstDocNo records for year: {year.strYearGUID}");
                            }
                            else
                            {
                                _logger.LogWarning($"Failed to copy MstDocNo records for year: {year.strYearGUID}, but continuing with year creation");
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log error but don't fail the year creation process
                            _logger.LogError(ex, $"Error copying MstDocNo records for year: {year.strYearGUID}");
                        }
                        
                        // Note: Default accounts copying logic has been removed as per business requirements
                        
                        return _mapper.Map<YearResponseDto>(year);
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, "Error creating year and user details");
                        throw;
                    }
                });
            }
            catch (BusinessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in CreateAsync");
                throw new BusinessException($"Error creating year: {ex.Message}");
            }
        }

        public async Task<YearResponseDto> GetByIdAsync(Guid yearGuid)
        {
            var year = await _context.Set<MstYear>()
                .FirstOrDefaultAsync(x => x.strYearGUID == yearGuid);
                
            if (year == null)
                throw new BusinessException("Year not found");
                
            // Get names for related GUIDs
            var organization = await _context.Set<MstOrganization>()
                .FirstOrDefaultAsync(x => x.strOrganizationGUID == year.strOrganizationGUID);
                
            var createdByUser = await _context.Set<MstUser>()
                .FirstOrDefaultAsync(x => x.strUserGUID == year.strCreatedByGUID);
                
            var updatedByUser = year.strUpdatedByGUID.HasValue 
                ? await _context.Set<MstUser>().FirstOrDefaultAsync(x => x.strUserGUID == year.strUpdatedByGUID.Value)
                : null;
                
            var previousYear = year.strPreviousYearGUID.HasValue 
                ? await _context.Set<MstYear>().FirstOrDefaultAsync(x => x.strYearGUID.ToString() == year.strPreviousYearGUID.Value.ToString())
                : null;
                
            var nextYear = year.strNextYearGUID.HasValue 
                ? await _context.Set<MstYear>().FirstOrDefaultAsync(x => x.strYearGUID.ToString() == year.strNextYearGUID.Value.ToString())
                : null;
                
            // Map to DTO
            var yearDto = _mapper.Map<YearResponseDto>(year);
            
            // Set related entity names
            if (organization != null)
                yearDto.strOrganizationName = organization.strOrganizationName;
                
            if (createdByUser != null)
                yearDto.strCreatedBy = createdByUser.strName;
                
            if (updatedByUser != null)
                yearDto.strUpdatedBy = updatedByUser.strName;
                
            if (previousYear != null)
                yearDto.strPreviousYearName = previousYear.strName;
                
            if (nextYear != null)
                yearDto.strNextYearName = nextYear.strName;
            
            // No currency name field needed
                
            return yearDto;
        }
        
        // Implement the missing interface methods
        public async Task<PagedResponse<YearResponseDto>> GetAllAsync(BaseFilterDto filterDto)
        {
            var query = _context.Set<MstYear>().AsQueryable();

            if (!string.IsNullOrEmpty(filterDto.Search))
            {
                query = query.Where(x => x.strName.Contains(filterDto.Search));
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize);

            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var yearDtos = _mapper.Map<List<YearResponseDto>>(items);

            return new PagedResponse<YearResponseDto>
            {
                Items = yearDtos,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<PagedResponse<YearResponseDto>> GetAllAsync(BaseFilterDto filterDto, Guid organizationGuid)
        {
            var query = _context.Set<MstYear>()
                .Where(x => x.strOrganizationGUID == organizationGuid)
                .AsQueryable();

            if (!string.IsNullOrEmpty(filterDto.Search))
            {
                query = query.Where(x => x.strName.Contains(filterDto.Search));
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize);

            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var yearDtos = _mapper.Map<List<YearResponseDto>>(items);

            return new PagedResponse<YearResponseDto>
            {
                Items = yearDtos,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<PagedResponse<YearResponseDto>> GetAllAsync(YearFilterDto filterDto, Guid organizationGuid)
        {
            var query = _context.Set<MstYear>()
                .Where(x => x.strOrganizationGUID == organizationGuid)
                .AsQueryable();
                
            // Filter by organization GUIDs if provided
            if (filterDto.OrganizationGUIDs != null && filterDto.OrganizationGUIDs.Any())
            {
                query = query.Where(x => filterDto.OrganizationGUIDs.Contains(x.strOrganizationGUID));
            }
            
            // Filter by active status if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }
            
            // Filter by created by GUIDs if provided
            if (filterDto.CreatedByGUIDs != null && filterDto.CreatedByGUIDs.Any())
            {
                query = query.Where(x => filterDto.CreatedByGUIDs.Contains(x.strCreatedByGUID));
            }
            
            // Filter by updated by GUIDs if provided
            if (filterDto.UpdatedByGUIDs != null && filterDto.UpdatedByGUIDs.Any())
            {
                query = query.Where(x => x.strUpdatedByGUID.HasValue && filterDto.UpdatedByGUIDs.Contains(x.strUpdatedByGUID.Value));
            }

            // Filter by search term if provided
            if (!string.IsNullOrEmpty(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords (similar to other services)
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                // Try to parse the search term as a date if it looks like a date
                DateTime parsedDate = default(DateTime);
                bool isDateSearch = false;
                
                // Special handling for "Mar 31, 2025" format
                if (searchTerm.Contains("Jan ") || searchTerm.Contains("Feb ") || 
                    searchTerm.Contains("Mar ") || searchTerm.Contains("Apr ") || 
                    searchTerm.Contains("May ") || searchTerm.Contains("Jun ") || 
                    searchTerm.Contains("Jul ") || searchTerm.Contains("Aug ") || 
                    searchTerm.Contains("Sep ") || searchTerm.Contains("Oct ") || 
                    searchTerm.Contains("Nov ") || searchTerm.Contains("Dec "))
                {
                    // Try specific format parsing for "Mar 31, 2025" format
                    isDateSearch = DateTime.TryParse(searchTerm, System.Globalization.CultureInfo.InvariantCulture, 
                                                   System.Globalization.DateTimeStyles.None, out parsedDate);
                }
                
                // If not parsed yet, try standard date parsing
                if (!isDateSearch)
                {
                    isDateSearch = DateTime.TryParse(searchTerm, out parsedDate);
                }
                
                if (isActiveSearch)
                {
                    // Filter only active years
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Filter only inactive years
                    query = query.Where(x => x.bolIsActive == false);
                }
                else if (isDateSearch && parsedDate != default(DateTime)) 
                {
                    // If the search string is a valid date, filter years that contain this date
                    // Get all years first to handle date comparison more consistently
                    var allYears = await query.ToListAsync();
                    var yearIdsToInclude = new List<Guid>();
                    
                    // Special handling for "Mar 31, 2025" format
                    var searchMonth = parsedDate.Month;
                    var searchDay = parsedDate.Day;
                    var searchYear = parsedDate.Year;
                    
                    foreach (var year in allYears)
                    {
                        bool matches = false;
                        
                        // Exact date matching - check if date falls within the year's range
                        if (year.dtStartDate <= parsedDate && year.dtEndDate >= parsedDate)
                        {
                            matches = true;
                        }
                        
                        // Check if this exact date is the start date
                        if (!matches && year.dtStartDate.Month == searchMonth && 
                                        year.dtStartDate.Day == searchDay && 
                                        year.dtStartDate.Year == searchYear)
                        {
                            matches = true;
                        }
                        
                        // Check if this exact date is the end date
                        if (!matches && year.dtEndDate.Month == searchMonth && 
                                        year.dtEndDate.Day == searchDay && 
                                        year.dtEndDate.Year == searchYear)
                        {
                            matches = true;
                        }
                        
                        // Check if it's the creation date
                        if (!matches && year.dtCreatedOn.Month == searchMonth && 
                                        year.dtCreatedOn.Day == searchDay && 
                                        year.dtCreatedOn.Year == searchYear)
                        {
                            matches = true;
                        }
                        
                        // Check if it's the update date
                        if (!matches && year.dtUpdatedOn.HasValue && 
                                        year.dtUpdatedOn.Value.Month == searchMonth && 
                                        year.dtUpdatedOn.Value.Day == searchDay && 
                                        year.dtUpdatedOn.Value.Year == searchYear)
                        {
                            matches = true;
                        }
                        
                        if (matches)
                        {
                            yearIdsToInclude.Add(year.strYearGUID);
                        }
                    }
                    
                    // Apply the filtered IDs to the query
                    query = query.Where(x => yearIdsToInclude.Contains(x.strYearGUID));
                }
                else
                {
                    // Get the user names and organization names for searching with efficient loading
                    var organizationGuidsInQuery = await query.Select(x => x.strOrganizationGUID.ToString()).Distinct().ToListAsync();
                    var userGuidsInQuery = await query
                        .Select(x => x.strCreatedByGUID.ToString())
                        .Union(query
                            .Where(x => x.strUpdatedByGUID.HasValue)
                            .Select(x => x.strUpdatedByGUID!.Value.ToString()))
                        .Distinct()
                        .ToListAsync();
                    
                    // Convert the string GUIDs to actual Guid objects for comparison
                    var userGuidsAsGuid = userGuidsInQuery.Select(g => Guid.Parse(g)).ToList();
                    var relatedUsers = await _context.Set<MstUser>()
                        .Where(u => userGuidsAsGuid.Contains(u.strUserGUID))
                        .ToListAsync();
                    var userDict = relatedUsers.ToDictionary(u => u.strUserGUID, u => u.strName.ToLower());
                    
                    // Convert the string GUIDs to actual Guid objects for comparison
                    var orgGuidsAsGuid = organizationGuidsInQuery.Select(g => Guid.Parse(g)).ToList();
                    var relatedOrgs = await _context.Set<MstOrganization>()
                        .Where(o => orgGuidsAsGuid.Contains(o.strOrganizationGUID))
                        .ToListAsync();
                    var orgDict = relatedOrgs.ToDictionary(o => o.strOrganizationGUID, o => o.strOrganizationName.ToLower());
                    
                    // No currency type loading needed
                    
                    // Filter logic for all relevant fields
                    var yearsToInclude = new List<Guid>();
                    
                    // Process each year to determine if it matches the search criteria
                    foreach (var year in await query.ToListAsync())
                    {
                        bool matches = false;
                        
                        // Search in Year name
                        if (year.strName.ToLower().Contains(searchTerm))
                            matches = true;
                        
                        // Search in organization name
                        var orgGuid = year.strOrganizationGUID;
                        if (!matches && orgDict.ContainsKey(orgGuid) && orgDict[orgGuid].Contains(searchTerm))
                            matches = true;
                        
                        // Search in date fields (with formatting to make dates more searchable)
                        // Check start date with multiple formats
                        if (!matches && (year.dtStartDate.ToString("d/M/yyyy").Contains(searchTerm) || 
                                        year.dtStartDate.ToString("dd/MM/yyyy").Contains(searchTerm) ||
                                        year.dtStartDate.ToString("yyyy-MM-dd").Contains(searchTerm) ||
                                        year.dtStartDate.ToString("MMM dd, yyyy").Contains(searchTerm) ||
                                        year.dtStartDate.ToString("MMMM dd, yyyy").Contains(searchTerm) ||
                                        year.dtStartDate.ToString("M/d/yyyy").Contains(searchTerm) ||
                                        year.dtStartDate.ToString("MM/dd/yyyy").Contains(searchTerm) ||
                                        year.dtStartDate.ToString("dd-MMM-yyyy").Contains(searchTerm) ||
                                        // Check for just the month name
                                        searchTerm.Length >= 3 && year.dtStartDate.ToString("MMMM").ToLower().Contains(searchTerm) ||
                                        searchTerm.Length >= 3 && year.dtStartDate.ToString("MMM").ToLower().Contains(searchTerm) ||
                                        // Check for just the year
                                        year.dtStartDate.Year.ToString().Contains(searchTerm) ||
                                        // Special case for exact date match with abbreviated month format like "Mar 31, 2025"
                                        (isDateSearch && parsedDate != default(DateTime) && 
                                          year.dtStartDate.Month == parsedDate.Month &&
                                          year.dtStartDate.Day == parsedDate.Day && 
                                          year.dtStartDate.Year == parsedDate.Year)))
                            matches = true;
                            
                        // Check end date with multiple formats
                        if (!matches && (year.dtEndDate.ToString("d/M/yyyy").Contains(searchTerm) || 
                                        year.dtEndDate.ToString("dd/MM/yyyy").Contains(searchTerm) ||
                                        year.dtEndDate.ToString("yyyy-MM-dd").Contains(searchTerm) ||
                                        year.dtEndDate.ToString("MMM dd, yyyy").Contains(searchTerm) ||
                                        year.dtEndDate.ToString("MMMM dd, yyyy").Contains(searchTerm) ||
                                        year.dtEndDate.ToString("M/d/yyyy").Contains(searchTerm) ||
                                        year.dtEndDate.ToString("MM/dd/yyyy").Contains(searchTerm) ||
                                        year.dtEndDate.ToString("dd-MMM-yyyy").Contains(searchTerm) ||
                                        // Check for just the month name
                                        searchTerm.Length >= 3 && year.dtEndDate.ToString("MMMM").ToLower().Contains(searchTerm) ||
                                        searchTerm.Length >= 3 && year.dtEndDate.ToString("MMM").ToLower().Contains(searchTerm) ||
                                        // Check for just the year
                                        year.dtEndDate.Year.ToString().Contains(searchTerm) ||
                                        // Special case for exact date match with abbreviated month format like "Mar 31, 2025"
                                        (isDateSearch && parsedDate != default(DateTime) && 
                                          year.dtEndDate.Month == parsedDate.Month &&
                                          year.dtEndDate.Day == parsedDate.Day && 
                                          year.dtEndDate.Year == parsedDate.Year)))
                            matches = true;
                        
                        // Search in user names
                        var createdByGuid = year.strCreatedByGUID;
                        if (!matches && userDict.ContainsKey(createdByGuid) && userDict[createdByGuid].Contains(searchTerm))
                            matches = true;
                        
                        if (!matches && year.strUpdatedByGUID.HasValue)
                        {
                            var updatedByGuid = year.strUpdatedByGUID.Value;
                            if (userDict.ContainsKey(updatedByGuid) && userDict[updatedByGuid].Contains(searchTerm))
                                matches = true;
                        }
                        
                        // Search in created date fields with multiple formats
                        if (!matches && (year.dtCreatedOn.ToString("d/M/yyyy").Contains(searchTerm) || 
                                        year.dtCreatedOn.ToString("dd/MM/yyyy").Contains(searchTerm) ||
                                        year.dtCreatedOn.ToString("yyyy-MM-dd").Contains(searchTerm) ||
                                        year.dtCreatedOn.ToString("MMM dd, yyyy").Contains(searchTerm) ||
                                        year.dtCreatedOn.ToString("MMMM dd, yyyy").Contains(searchTerm) ||
                                        year.dtCreatedOn.ToString("M/d/yyyy").Contains(searchTerm) ||
                                        year.dtCreatedOn.ToString("MM/dd/yyyy").Contains(searchTerm) ||
                                        year.dtCreatedOn.ToString("dd-MMM-yyyy").Contains(searchTerm) ||
                                        // Include time formats if searching for time
                                        year.dtCreatedOn.ToString("HH:mm").Contains(searchTerm) ||
                                        year.dtCreatedOn.ToString("h:mm tt").Contains(searchTerm) ||
                                        // Check for just the month name
                                        searchTerm.Length >= 3 && year.dtCreatedOn.ToString("MMMM").ToLower().Contains(searchTerm) ||
                                        searchTerm.Length >= 3 && year.dtCreatedOn.ToString("MMM").ToLower().Contains(searchTerm) ||
                                        // Check for just the year
                                        year.dtCreatedOn.Year.ToString().Contains(searchTerm)))
                            matches = true;
                        
                        // Search in updated date fields with multiple formats (if available)
                        if (!matches && year.dtUpdatedOn.HasValue && 
                           (year.dtUpdatedOn.Value.ToString("d/M/yyyy").Contains(searchTerm) || 
                            year.dtUpdatedOn.Value.ToString("dd/MM/yyyy").Contains(searchTerm) ||
                            year.dtUpdatedOn.Value.ToString("yyyy-MM-dd").Contains(searchTerm) ||
                            year.dtUpdatedOn.Value.ToString("MMM dd, yyyy").Contains(searchTerm) ||
                            year.dtUpdatedOn.Value.ToString("MMMM dd, yyyy").Contains(searchTerm) ||
                            year.dtUpdatedOn.Value.ToString("M/d/yyyy").Contains(searchTerm) ||
                            year.dtUpdatedOn.Value.ToString("MM/dd/yyyy").Contains(searchTerm) ||
                            year.dtUpdatedOn.Value.ToString("dd-MMM-yyyy").Contains(searchTerm) ||
                            // Include time formats if searching for time
                            year.dtUpdatedOn.Value.ToString("HH:mm").Contains(searchTerm) ||
                            year.dtUpdatedOn.Value.ToString("h:mm tt").Contains(searchTerm) ||
                            // Check for just the month name
                            searchTerm.Length >= 3 && year.dtUpdatedOn.Value.ToString("MMMM").ToLower().Contains(searchTerm) ||
                            searchTerm.Length >= 3 && year.dtUpdatedOn.Value.ToString("MMM").ToLower().Contains(searchTerm) ||
                            // Check for just the year
                            year.dtUpdatedOn.Value.Year.ToString().Contains(searchTerm)))
                            matches = true;
                        
                        if (matches)
                            yearsToInclude.Add(year.strYearGUID);
                    }
                    
                    // Apply the filter
                    query = query.Where(x => yearsToInclude.Contains(x.strYearGUID));
                }
            }

            // Apply sorting
            query = ApplySorting(query, filterDto.SortBy, filterDto.ascending);

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize);

            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            if (!items.Any())
            {
                return new PagedResponse<YearResponseDto>
                {
                    Items = new List<YearResponseDto>(),
                    PageNumber = filterDto.PageNumber,
                    PageSize = filterDto.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages
                };
            }

            // Collect all unique GUIDs for batch queries
            var organizationGuids = items.Select(x => x.strOrganizationGUID.ToString()).Distinct().ToList();
            var userGuids = items.Select(x => x.strCreatedByGUID.ToString())
                .Union(items.Where(x => x.strUpdatedByGUID.HasValue).Select(x => x.strUpdatedByGUID!.Value.ToString()))
                .Where(x => !string.IsNullOrEmpty(x))
                .Distinct()
                .ToList();
            var yearGuids = items.Where(x => x.strPreviousYearGUID.HasValue).Select(x => x.strPreviousYearGUID!.Value)
                .Union(items.Where(x => x.strNextYearGUID.HasValue).Select(x => x.strNextYearGUID!.Value))
                .Distinct()
                .ToList();

            // Convert string GUIDs to Guid objects for comparison
            var orgGuids = organizationGuids.Select(g => Guid.Parse(g)).ToList();
            var userGuidObjects = userGuids.Select(g => Guid.Parse(g)).ToList();
            
            // Batch load related data
            var organizations = await _context.Set<MstOrganization>()
                .Where(o => orgGuids.Contains(o.strOrganizationGUID))
                .ToDictionaryAsync(o => o.strOrganizationGUID.ToString(), o => o.strOrganizationName);

            var users = await _context.Set<MstUser>()
                .Where(u => userGuidObjects.Contains(u.strUserGUID))
                .ToDictionaryAsync(u => u.strUserGUID.ToString(), u => u.strName);

            var years = await _context.Set<MstYear>()
                .Where(y => yearGuids.Contains(y.strYearGUID))
                .ToDictionaryAsync(y => y.strYearGUID.ToString(), y => y.strName);

            // No currency types needed

            var yearDtos = new List<YearResponseDto>();
            
            foreach (var item in items)
            {
                var yearDto = _mapper.Map<YearResponseDto>(item);
                
                // Get organization name
                yearDto.strOrganizationName = organizations.GetValueOrDefault(item.strOrganizationGUID.ToString());
                
                // Get previous year name
                if (item.strPreviousYearGUID.HasValue)
                {
                    yearDto.strPreviousYearName = years.GetValueOrDefault(item.strPreviousYearGUID.Value.ToString());
                }
                
                // Get next year name
                if (item.strNextYearGUID.HasValue)
                {
                    yearDto.strNextYearName = years.GetValueOrDefault(item.strNextYearGUID.Value.ToString());
                }
                
                // Get created by user name
                yearDto.strCreatedBy = users.GetValueOrDefault(item.strCreatedByGUID.ToString());
                
                // Get updated by user name
                if (item.strUpdatedByGUID.HasValue)
                {
                    yearDto.strUpdatedBy = users.GetValueOrDefault(item.strUpdatedByGUID.Value.ToString());
                }
                
                yearDtos.Add(yearDto);
            }

            return new PagedResponse<YearResponseDto>
            {
                Items = yearDtos,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<PagedResponse<YearResponseDto>> GetYearsByOrganizationAsync(Guid organizationGuid, BaseFilterDto filterDto)
        {
            var query = _context.Set<MstYear>()
                .Where(x => x.strOrganizationGUID == organizationGuid)
                .AsQueryable();

            if (!string.IsNullOrEmpty(filterDto.Search))
            {
                query = query.Where(x => x.strName.Contains(filterDto.Search));
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize);

            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var yearDtos = _mapper.Map<List<YearResponseDto>>(items);

            return new PagedResponse<YearResponseDto>
            {
                Items = yearDtos,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<YearResponseDto> UpdateAsync(Guid yearGuid, YearUpdateDto updateDto, Guid currentUserGuid)
        {
            var year = await _context.Set<MstYear>()
                .FirstOrDefaultAsync(x => x.strYearGUID == yearGuid);

            if (year == null)
                throw new BusinessException("Year not found");
            
            // Get the user's current year from the token
            var httpContext = _httpContextAccessor.HttpContext;
            var tokenYearGuidClaim = httpContext?.User.Claims.FirstOrDefault(c => c.Type == "strYearGUID");
            var tokenYearGuid = Guid.TryParse(tokenYearGuidClaim?.Value, out var parsedYearGuid) ? parsedYearGuid : Guid.Empty;
            
            // Check if user is trying to set their current active year to inactive
            if (tokenYearGuid == yearGuid && !updateDto.bolIsActive)
            {
                throw new BusinessException("You cannot make your current active year inactive. Please switch to another year first.");
            }
                
            // Check if the name is being changed
            if (!string.Equals(year.strName, updateDto.strName, StringComparison.OrdinalIgnoreCase))
            {
                // Check if a year with the same name already exists for this organization and group
                bool duplicateExists = await _context.Set<MstYear>()
                    .AnyAsync(x => x.strYearGUID != yearGuid 
                              && x.strName.ToLower() == updateDto.strName.ToLower()
                              && x.strOrganizationGUID == year.strOrganizationGUID
                              && x.strGroupGUID == year.strGroupGUID);
                
                if (duplicateExists)
                {
                    throw new BusinessException($"A year with the name '{updateDto.strName}' already exists for this organization");
                }
            }

            // Store old values before update
            var oldValues = JsonSerializer.Serialize(new
            {
                name = year.strName,
                startDate = year.dtStartDate,
                endDate = year.dtEndDate,
                isActive = year.bolIsActive,
                organizationGuid = year.strOrganizationGUID,
                previousYearGuid = year.strPreviousYearGUID,
                nextYearGuid = year.strNextYearGUID
            });

            // Store current values for change detection
            var oldName = year.strName;
            var oldStartDate = year.dtStartDate;
            var oldEndDate = year.dtEndDate;
            var oldIsActive = year.bolIsActive;
            var oldPreviousYearGuid = year.strPreviousYearGUID;
            var oldNextYearGuid = year.strNextYearGUID;

            // Apply updates
            _mapper.Map(updateDto, year);
            year.dtUpdatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            year.strUpdatedByGUID = currentUserGuid;

            // Build change description
            var changes = new List<string>();
            if (oldName != year.strName)
            {
                changes.Add($"name from '{oldName}' to '{year.strName}'");
            }
            if (oldStartDate != year.dtStartDate)
            {
                changes.Add($"start date from '{oldStartDate:yyyy-MM-dd}' to '{year.dtStartDate:yyyy-MM-dd}'");
            }
            if (oldEndDate != year.dtEndDate)
            {
                changes.Add($"end date from '{oldEndDate:yyyy-MM-dd}' to '{year.dtEndDate:yyyy-MM-dd}'");
            }
            if (oldIsActive != year.bolIsActive)
            {
                changes.Add($"status from '{(oldIsActive ? "Active" : "Inactive")}' to '{(year.bolIsActive ? "Active" : "Inactive")}'");
            }

            // Get previous and next year names if they've changed
            if (oldPreviousYearGuid != year.strPreviousYearGUID)
            {
                var oldPrevYear = oldPreviousYearGuid.HasValue ? 
                    await _context.MstYears.Where(y => y.strYearGUID == oldPreviousYearGuid.Value)
                        .Select(y => y.strName)
                        .FirstOrDefaultAsync() : null;
                var newPrevYear = year.strPreviousYearGUID.HasValue ? 
                    await _context.MstYears.Where(y => y.strYearGUID == year.strPreviousYearGUID.Value)
                        .Select(y => y.strName)
                        .FirstOrDefaultAsync() : null;
                changes.Add($"previous year from '{oldPrevYear ?? "none"}' to '{newPrevYear ?? "none"}'");
            }

            if (oldNextYearGuid != year.strNextYearGUID)
            {
                var oldNextYear = oldNextYearGuid.HasValue ? 
                    await _context.MstYears.Where(y => y.strYearGUID == oldNextYearGuid.Value)
                        .Select(y => y.strName)
                        .FirstOrDefaultAsync() : null;
                var newNextYear = year.strNextYearGUID.HasValue ? 
                    await _context.MstYears.Where(y => y.strYearGUID == year.strNextYearGUID.Value)
                        .Select(y => y.strName)
                        .FirstOrDefaultAsync() : null;
                changes.Add($"next year from '{oldNextYear ?? "none"}' to '{newNextYear ?? "none"}'");
            }

            string detailsMessage = $"Updated year '{year.strName}'";
            if (changes.Any())
            {
                detailsMessage += $": Changed {string.Join(", ", changes)}";
            }

            // Create activity log
            var activityLog = new MstUserActivityLog
            {
                ActivityLogGUID = Guid.NewGuid(),
                UserGUID = currentUserGuid,
                GroupGUID = year.strGroupGUID,
                ActivityType = "UPDATE_YEAR",
                Details = detailsMessage,
                EntityType = "Year",
                EntityGUID = year.strYearGUID,
                OrganizationGUID = year.strOrganizationGUID,
                OldValue = oldValues,
                NewValue = JsonSerializer.Serialize(new
                {
                    name = year.strName,
                    startDate = year.dtStartDate,
                    endDate = year.dtEndDate,
                    isActive = year.bolIsActive,
                    organizationGuid = year.strOrganizationGUID,
                    previousYearGuid = year.strPreviousYearGUID,
                    nextYearGuid = year.strNextYearGUID
                }),
                CreatedByGUID = currentUserGuid,
                CreatedOn = year.dtUpdatedOn ?? DateTime.UtcNow,
                ActivityTime = year.dtUpdatedOn ?? DateTime.UtcNow
            };

            _context.MstUserActivityLogs.Add(activityLog);
            await _context.SaveChangesAsync();

            return _mapper.Map<YearResponseDto>(year);
        }

        public async Task<bool> DeleteAsync(Guid yearGuid)
        {
            var year = await _context.Set<MstYear>()
                .FirstOrDefaultAsync(x => x.strYearGUID == yearGuid);

            if (year == null)
                throw new BusinessException("Year not found");

            if (year.bolSystemCreated)
                throw new BusinessException("Cannot delete system-created year");

            _context.Remove(year);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<YearSimpleResponseDto>> GetSimpleYearsByOrganizationAsync(Guid organizationGuid)
        {
            // This is the old implementation that queried mstYear directly
            var query = _context.Set<MstYear>()
                .Where(x => x.strOrganizationGUID == organizationGuid)
                .OrderBy(x => x.strName)
                .AsQueryable();
            
            var items = await query.ToListAsync();
            
            // We keep this for backwards compatibility, but the controller now uses GetSimpleYearsByOrganizationAndUserAsync
            return _mapper.Map<List<YearSimpleResponseDto>>(items);
        }
        
        public async Task<List<YearSimpleResponseDto>> GetSimpleYearsByOrganizationAndUserAsync(Guid organizationGuid, Guid userGuid)
        {
            // No need to parse Guid as it's already a Guid
            
            // Get the year GUIDs from user details
            var userDetails = await _context.MstUserDetails
                .Where(ud => ud.strUserGUID == userGuid && 
                           ud.strOrganizationGUID == organizationGuid &&
                           ud.bolIsActive)
                .ToListAsync();
                
            if (userDetails == null || !userDetails.Any())
            {
                return new List<YearSimpleResponseDto>();
            }
            
            // Get unique year GUIDs
            var yearGuids = userDetails
                .Where(ud => ud.strYearGUID != Guid.Empty)
                .Select(ud => ud.strYearGUID)
                .Distinct()
                .ToList();
                
            // Fetch only the active year names from the mstYear table
            var years = await _context.MstYears
                .Where(y => yearGuids.Contains(y.strYearGUID) && y.bolIsActive)
                .OrderBy(y => y.strName)
                .Select(y => new YearSimpleResponseDto 
                { 
                    strYearGUID = y.strYearGUID,
                    strName = y.strName 
                })
                .ToListAsync();
                
            return years;
        }

        public async Task<List<YearSimpleResponseDto>> GetActiveYearsByOrganizationAsync(Guid organizationGuid)
        {
            // Get active years from the organization
            var years = await _context.MstYears
                .Where(y => y.strOrganizationGUID == organizationGuid && y.bolIsActive)
                .OrderByDescending(y => y.dtCreatedOn)  // Most recently created first
                .Select(y => new YearSimpleResponseDto 
                {
                    strYearGUID = y.strYearGUID,
                    strName = y.strName
                })
                .ToListAsync();
                
            return years;
        }

        private IQueryable<MstYear> ApplySorting(IQueryable<MstYear> query, string? sortBy, bool ascending)
        {
            Expression<Func<MstYear, object>> keySelector = sortBy?.ToLower() switch
            {
                "stryearguid" => y => y.strYearGUID,
                "strorganizationguid" => y => y.strOrganizationGUID,
                "strname" => y => y.strName,
                "dtstartdate" => y => y.dtStartDate,
                "dtenddate" => y => y.dtEndDate,
                "bolisactive" => y => y.bolIsActive,
                "strGroupGUID" => y => y.strGroupGUID,
                "dtcreatedon" => y => y.dtCreatedOn,
                "dtupdatedon" => y => y.dtUpdatedOn ?? DateTime.MaxValue,
                _ => y => y.dtCreatedOn // Default sorting by creation date
            };

            return ascending ? query.OrderBy(keySelector) : query.OrderByDescending(keySelector);
        }
        
        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportYearsAsync(string format, Guid groupGuid, Guid organizationGuid)
        {
            try
            {
                // Validate format
                if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
                {
                    throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
                }
                
                // Validate groupGuid
                if (groupGuid == Guid.Empty)
                {
                    throw new BusinessException("Group GUID cannot be empty");
                }

                // Get all years for the specified group and organization
                var query = _context.Set<MstYear>()
                    .Where(y => y.strGroupGUID == groupGuid);
                    
                // Apply organization filter if provided
                if (organizationGuid != Guid.Empty)
                {
                    query = query.Where(y => y.strOrganizationGUID == organizationGuid);
                }
                
                var years = await query
                    .OrderBy(y => y.strName)
                    .ToListAsync();
                
                if (years == null || !years.Any())
                {
                    throw new BusinessException("No years found to export");
                }

                // Get user information for created by and updated by
                var userGuids = new List<string>();
                foreach (var year in years)
                {
                    userGuids.Add(year.strCreatedByGUID.ToString());
                    
                    if (year.strUpdatedByGUID.HasValue)
                        userGuids.Add(year.strUpdatedByGUID.Value.ToString());
                }
                userGuids = userGuids.Distinct().ToList();

                // Dictionary to store user name lookups
                var userNames = new Dictionary<string, string>();
                
                if (userGuids.Any())
                {
                    // Convert string GUIDs to Guid objects for comparison
                    var userGuidObjects = userGuids.Select(g => Guid.Parse(g)).ToList();
                    
                    var creatorUpdaters = await _context.Set<MstUser>()
                        .Where(u => userGuidObjects.Contains(u.strUserGUID))
                        .Select(u => new { u.strUserGUID, u.strName })
                        .ToListAsync();
                        
                    foreach (var user in creatorUpdaters)
                    {
                        var guidString = user.strUserGUID.ToString();
                        if (!userNames.ContainsKey(guidString))
                        {
                            userNames.Add(guidString, user.strName ?? "");
                        }
                    }
                }
                
                // Get organization names
                var organizationGuids = years.Select(y => y.strOrganizationGUID.ToString()).Distinct().ToList();
                var organizationNames = new Dictionary<string, string>();
                
                if (organizationGuids.Any())
                {
                    // Convert string GUIDs to Guid objects for comparison
                    var orgGuidObjects = organizationGuids.Select(g => Guid.Parse(g)).ToList();
                    
                    var organizations = await _context.Set<MstOrganization>()
                        .Where(o => orgGuidObjects.Contains(o.strOrganizationGUID))
                        .Select(o => new { o.strOrganizationGUID, o.strOrganizationName })
                        .ToListAsync();
                        
                    foreach (var org in organizations)
                    {
                        var guidString = org.strOrganizationGUID.ToString();
                        if (!organizationNames.ContainsKey(guidString))
                        {
                            organizationNames.Add(guidString, org.strOrganizationName ?? "");
                        }
                    }
                }
                string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                
                if (format.ToLower() == "excel")
                {
                    try
                    {
                        // Create Excel file
                        using var workbook = new XLWorkbook();
                        var worksheet = workbook.Worksheets.Add("Years");
                        
                        // Add headers
                        worksheet.Cell(1, 1).Value = "Name";
                        worksheet.Cell(1, 2).Value = "Organization";
                        worksheet.Cell(1, 3).Value = "Start Date";
                        worksheet.Cell(1, 4).Value = "End Date";
                        worksheet.Cell(1, 5).Value = "Is Active";
                        worksheet.Cell(1, 6).Value = "Created By";
                        worksheet.Cell(1, 7).Value = "Created On";
                        worksheet.Cell(1, 8).Value = "Updated By";
                        worksheet.Cell(1, 9).Value = "Updated On";
                        
                        // Style header row
                        var headerRow = worksheet.Row(1);
                        headerRow.Style.Font.Bold = true;
                        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                        
                        // Add data
                        for (int i = 0; i < years.Count; i++)
                        {
                            try
                            {
                                var year = years[i];
                                int row = i + 2;
                                
                                // Get related names
                                string organizationName = "";
                                if (organizationNames.ContainsKey(year.strOrganizationGUID.ToString()))
                                {
                                    organizationName = organizationNames[year.strOrganizationGUID.ToString()];
                                }
                                
                                string createdByName = "";
                                if (userNames.ContainsKey(year.strCreatedByGUID.ToString()))
                                {
                                    createdByName = userNames[year.strCreatedByGUID.ToString()];
                                }
                                
                                string updatedByName = "";
                                if (year.strUpdatedByGUID.HasValue && 
                                    userNames.ContainsKey(year.strUpdatedByGUID.Value.ToString()))
                                {
                                    updatedByName = userNames[year.strUpdatedByGUID.Value.ToString()];
                                }
                                
                                // Set values with explicit null checks
                                worksheet.Cell(row, 1).Value = year.strName ?? "";
                                worksheet.Cell(row, 2).Value = organizationName;
                                
                                // Format dates
                                try { worksheet.Cell(row, 3).Value = year.dtStartDate.ToString("yyyy-MM-dd"); }
                                catch { worksheet.Cell(row, 3).Value = ""; }
                                
                                try { worksheet.Cell(row, 4).Value = year.dtEndDate.ToString("yyyy-MM-dd"); }
                                catch { worksheet.Cell(row, 4).Value = ""; }
                                
                                worksheet.Cell(row, 5).Value = year.bolIsActive ? "Active" : "Inactive";
                                worksheet.Cell(row, 6).Value = createdByName;
                                
                                try { worksheet.Cell(row, 7).Value = year.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss"); }
                                catch { worksheet.Cell(row, 7).Value = ""; }
                                
                                worksheet.Cell(row, 8).Value = updatedByName;
                                
                                if (year.dtUpdatedOn.HasValue)
                                {
                                    try { worksheet.Cell(row, 9).Value = year.dtUpdatedOn.Value.ToString("yyyy-MM-dd HH:mm:ss"); }
                                    catch { worksheet.Cell(row, 9).Value = ""; }
                                }
                                else
                                {
                                    worksheet.Cell(row, 9).Value = "";
                                }
                            }
                            catch (Exception ex)
                            {
                                // Log but continue with other rows
                                Console.WriteLine($"Error processing year row {i+1}: {ex.Message}");
                            }
                        }

                        // Auto-fit columns
                        worksheet.Columns().AdjustToContents();
                        
                        // Convert to byte array
                        using var stream = new MemoryStream();
                        workbook.SaveAs(stream);
                        stream.Position = 0;
                        
                        return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Years_{timestamp}.xlsx");
                    }
                    catch (Exception ex)
                    {
                        throw new BusinessException($"Error creating Excel export: {ex.Message}");
                    }
                }
                else // CSV
                {
                    try
                    {
                        // Create CSV content
                        var csv = new StringBuilder();
                        
                        // Add header row
                        csv.AppendLine("Name,Organization,Start Date,End Date,Is Active,Created By,Created On,Updated By,Updated On");
                    
                        // Add data rows
                        foreach (var year in years)
                        {
                            try
                            {
                                // Get related names
                                string organizationName = "";
                                if (organizationNames.ContainsKey(year.strOrganizationGUID.ToString()))
                                {
                                    organizationName = organizationNames[year.strOrganizationGUID.ToString()];
                                }
                                
                                string createdByName = "";
                                if (userNames.ContainsKey(year.strCreatedByGUID.ToString()))
                                {
                                    createdByName = userNames[year.strCreatedByGUID.ToString()];
                                }
                                
                                string updatedByName = "";
                                if (year.strUpdatedByGUID.HasValue && 
                                    userNames.ContainsKey(year.strUpdatedByGUID.Value.ToString()))
                                {
                                    updatedByName = userNames[year.strUpdatedByGUID.Value.ToString()];
                                }
                                
                                // Format dates
                                string startDateStr = "";
                                try { startDateStr = year.dtStartDate.ToString("yyyy-MM-dd"); }
                                catch { /* ignore formatting errors */ }
                                
                                string endDateStr = "";
                                try { endDateStr = year.dtEndDate.ToString("yyyy-MM-dd"); }
                                catch { /* ignore formatting errors */ }
                                
                                string createdOnStr = "";
                                try { createdOnStr = year.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss"); }
                                catch { /* ignore formatting errors */ }
                                
                                string updatedOnStr = "";
                                if (year.dtUpdatedOn.HasValue)
                                {
                                    try { updatedOnStr = year.dtUpdatedOn.Value.ToString("yyyy-MM-dd HH:mm:ss"); }
                                    catch { /* ignore formatting errors */ }
                                }
                        
                                // Escape fields with quotes if they contain commas or quotes
                                string EscapeField(string field)
                                {
                                    if (string.IsNullOrEmpty(field)) return "";
                                    return field.Contains(",") || field.Contains("\"") 
                                        ? $"\"{field.Replace("\"", "\"\"")}\""
                                        : field;
                                }
                                
                                // Build the CSV line
                                csv.AppendLine(string.Join(",",
                                    EscapeField(year.strName ?? ""),
                                    EscapeField(organizationName),
                                    startDateStr,
                                    endDateStr,
                                    year.bolIsActive ? "Active" : "Inactive",
                                    EscapeField(createdByName),
                                    createdOnStr,
                                    EscapeField(updatedByName),
                                    updatedOnStr
                                ));
                            }
                            catch (Exception ex)
                            {
                                // Log error but continue with other rows
                                Console.WriteLine($"Error processing row for year {year.strYearGUID}: {ex.Message}");
                                // Add a placeholder row to maintain data integrity
                                csv.AppendLine($"\"{year.strName ?? "Unknown"}\",\"Error processing this year's data\",,,,,,,,");
                            }
                        }
                        
                        // Convert to bytes
                        byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                        
                        return (bytes, "text/csv", $"Years_{timestamp}.csv");
                    }
                    catch (Exception ex)
                    {
                        throw new BusinessException($"Error creating CSV export: {ex.Message}");
                    }
                }
            }
            catch (FormatException ex)
            {
                throw new BusinessException($"Format error while exporting years: {ex.Message}. Please check data formats (especially dates and GUIDs).");
            }
            catch (Exception ex)
            {
                // Log detailed exception information for debugging
                Console.WriteLine($"Export error - Type: {ex.GetType().Name}, Message: {ex.Message}, StackTrace: {ex.StackTrace}");
                throw new BusinessException($"Error exporting years: {ex.Message}");
            }
        }

        /// <summary>
        /// Creates a new year without starting a new transaction - used for operations that already have an open transaction
        /// </summary>
        /// <param name="createDto">The year creation data</param>
        /// <param name="currentUserGuid">Current user's GUID</param>
        /// <param name="groupGuid">Group GUID</param>
        /// <param name="organizationGuid">Organization GUID</param>
        /// <param name="isSystemCreated">Indicates if the year is being created by the system (e.g., during group creation). Default is false.</param>
        /// <returns>The created year</returns>
        public async Task<YearResponseDto> CreateWithoutTransactionAsync(YearCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, bool isSystemCreated = false)
        {
            try
            {
                // Check if a year with the same name already exists for this organization and group
                bool duplicateExists = await _context.Set<MstYear>()
                    .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower() 
                              && x.strOrganizationGUID == organizationGuid 
                              && x.strGroupGUID == groupGuid);
                
                if (duplicateExists)
                {
                    throw new BusinessException($"A year with the name '{createDto.strName}' already exists for this organization");
                }
                
                // No transaction management here - caller is responsible for transaction
                var year = _mapper.Map<MstYear>(createDto);
                year.strYearGUID = Guid.NewGuid();
                year.strCreatedByGUID = currentUserGuid;
                year.dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
                year.strGroupGUID = groupGuid;
                year.strOrganizationGUID = organizationGuid;
                year.bolSystemCreated = isSystemCreated; // Set the system created flag based on the parameter
                
                // Set update fields same as create fields by default
                year.strUpdatedByGUID = year.strCreatedByGUID;
                year.dtUpdatedOn = year.dtCreatedOn;
                
                _context.Add(year);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Year created successfully with GUID: {year.strYearGUID}");
                
                // Get user role GUID for the current user
                var userDetails = await _context.MstUserDetails
                    .Where(ud => ud.strUserGUID == currentUserGuid && 
                                ud.strGroupGUID == groupGuid)
                    .OrderByDescending(ud => ud.dtCreatedOn)
                    .FirstOrDefaultAsync();
                
                if (userDetails == null)
                {
                    _logger.LogError($"Unable to find user details for user GUID: {currentUserGuid} in group {groupGuid}");
                    throw new BusinessException("User details not found for the current user in this group");
                }
                
                Guid userRoleGUID = userDetails.strUserRoleGUID;
                
                // Check if user details already exists for this user, organization and year
                bool userDetailsExists = await _context.MstUserDetails
                    .AnyAsync(ud => ud.strUserGUID == currentUserGuid &&
                                   ud.strOrganizationGUID == organizationGuid &&
                                   ud.strYearGUID == year.strYearGUID);
                
                if (!userDetailsExists)
                {
                    // Skip creating new user details as they are already handled in GroupService
                    _logger.LogInformation($"Using existing user details for Year {year.strName}");
                }
                else
                {
                    _logger.LogInformation($"User details already exists for user {currentUserGuid}, organization {organizationGuid}, year {year.strYearGUID} - skipping creation");
                }
                
                // No longer updating or creating MstUserInfos records during year creation
                // This is consistent with the changes in OrganizationService
                // Users will need to explicitly switch to this organization/year using the UserRights/switch-organization endpoint
                _logger.LogInformation($"Skipping MstUserInfo update for year: {year.strYearGUID} (consistent with organization creation policy)");
                
                // Create folder structure for the newly created year
                try
                {
                    // We only need to create folders inside module folders, not directly under the group folder
                    // First create base documents and group folders
                    string documentsBasePath = _fileStorageService.CreateDirectoryStructure("Documents");
                    _logger.LogInformation($"Documents base folder created or verified at {documentsBasePath}");
                    
                    string groupFolderName = groupGuid.ToString();
                    string groupFolderPath = _fileStorageService.CreateDirectoryStructure("Documents", groupFolderName);
                    _logger.LogInformation($"Group folder created or verified at {groupFolderPath}");
                    
                    // Get all modules assigned to this group
                    var modulesFolders = await _context.MstGroupModules
                        .Where(gm => gm.strGroupGUID == groupGuid)
                        .ToListAsync();
                        
                    _logger.LogInformation($"Found {modulesFolders.Count} modules assigned to group {groupGuid}");
                    
                    // Create year folders inside each module's organization folder
                    foreach (var groupModule in modulesFolders)
                    {
                        try
                        {
                            // Create module folder inside the group folder
                            string moduleGuidStr = groupModule.strModuleGUID.ToString();
                            string moduleFolderPath = _fileStorageService.CreateDirectoryStructure("Documents", groupFolderName, moduleGuidStr);
                            _logger.LogInformation($"Created or verified module directory: {moduleFolderPath}");
                            
                            // Create organization folder inside the module folder
                            string orgGuidStr = organizationGuid.ToString();
                            string moduleOrgFolderPath = _fileStorageService.CreateDirectoryStructure("Documents", groupFolderName, moduleGuidStr, orgGuidStr);
                            _logger.LogInformation($"Created or verified organization directory inside module: {moduleOrgFolderPath}");
                            
                            // Create year folder inside the organization folder
                            string yearGuidStr = year.strYearGUID.ToString();
                            string moduleYearFolderPath = _fileStorageService.CreateDirectoryStructure("Documents", groupFolderName, moduleGuidStr, orgGuidStr, yearGuidStr);
                            _logger.LogInformation($"Created year directory inside module organization: {moduleYearFolderPath}");
                        }
                        catch (Exception moduleEx)
                        {
                            _logger.LogError(moduleEx, $"Error creating folder structure for module {groupModule.strModuleGUID}");
                            // Continue with other modules even if this one fails
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating document folder structure for year");
                    // Continue with year creation even if folder creation fails
                }
                
                // Call accounting API to copy MstDocNo records for the new year
                try
                {
                    bool copyResult = await CopyMstDocNoForYearAsync(year.strYearGUID);
                    if (copyResult)
                    {
                        _logger.LogInformation($"Successfully copied MstDocNo records for year: {year.strYearGUID}");
                    }
                    else
                    {
                        _logger.LogWarning($"Failed to copy MstDocNo records for year: {year.strYearGUID}, but continuing with year creation");
                    }
                }
                catch (Exception ex)
                {
                    // Log error but don't fail the year creation process
                    _logger.LogError(ex, $"Error copying MstDocNo records for year: {year.strYearGUID}");
                }
                
                return _mapper.Map<YearResponseDto>(year);
            }
            catch (BusinessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in CreateWithoutTransactionAsync");
                throw new BusinessException($"Error creating year: {ex.Message}");
            }
        }

        /// <summary>
        /// Calls the accounting backend API to copy MstDocNo records for a newly created year
        /// </summary>
        /// <param name="yearGuid">The GUID of the newly created year</param>
        /// <returns>True if the operation was successful, false otherwise</returns>
        private async Task<bool> CopyMstDocNoForYearAsync(Guid yearGuid)
        {
            try
            {
                _logger.LogInformation($"Starting CopyMstDocNoForYearAsync for yearGuid: {yearGuid}");
                
                // Get the accounting API base URL from configuration
                string? accountingApiBaseUrl = _configuration["ApiGateway:AccountingServiceBaseUrl"];
                _logger.LogInformation($"Configuration value for AccountingServiceBaseUrl: '{accountingApiBaseUrl}'");
                
                if (string.IsNullOrEmpty(accountingApiBaseUrl))
                {
                    accountingApiBaseUrl = "https://localhost:7089"; // Default fallback
                    _logger.LogWarning($"AccountingServiceBaseUrl not found in ApiGateway configuration, using default: {accountingApiBaseUrl}");
                }

                // Create the HTTP client
                var httpClient = _httpClientFactory.CreateClient();
                var apiUrl = $"{accountingApiBaseUrl}/api/accounting/MstDocNo/copyfrom";
                _logger.LogInformation($"Full API URL: {apiUrl}");
                
                // Get the current user's token from HttpContext
                var currentToken = ExtractTokenFromHttpContext();
                if (!string.IsNullOrEmpty(currentToken))
                {
                    _logger.LogInformation($"Adding Authorization header with token length: {currentToken.Length}");
                    httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {currentToken}");
                }
                else
                {
                    _logger.LogWarning("No token available to pass to accounting backend. Request may fail due to authentication.");
                }
                
                // Create the request payload
                var payload = new 
                {
                    strYearGUID = yearGuid
                };
                
                var payloadJson = JsonSerializer.Serialize(payload);
                _logger.LogInformation($"Request payload: {payloadJson}");

                // Adding authorization header
                // Note: The accounting backend might be expecting a token in the header
                // Since we don't have direct access to the token, we'll log this for now
                _logger.LogInformation("No authorization token is being passed to the accounting backend endpoint");
                _logger.LogWarning("This might cause authentication/authorization issues on the accounting backend");

                // Make the request to the accounting API
                _logger.LogInformation($"Calling accounting API to copy MstDocNo records for year: {yearGuid}");
                var response = await httpClient.PostAsJsonAsync(apiUrl, payload);

                // Log response details
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Response status: {response.StatusCode}, Content: {responseContent}");
                
                // Check if successful
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Successfully copied MstDocNo records for year: {yearGuid}");
                    return true;
                }
                else
                {
                    _logger.LogError($"Failed to copy MstDocNo records. Status: {response.StatusCode}, Error: {responseContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error calling accounting API to copy MstDocNo records for year: {yearGuid}");
                return false;
            }
        }

        /// <summary>
        /// Extracts the authentication token from the current HTTP context
        /// </summary>
        /// <returns>The token string or null if not found</returns>
        private string? ExtractTokenFromHttpContext()
        {
            if (_httpContextAccessor?.HttpContext == null)
            {
                _logger.LogWarning("HttpContext is not available");
                return null;
            }

            // Only accept from Authorization header
            string? authHeader = _httpContextAccessor.HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return authHeader.Substring("Bearer ".Length).Trim();
            }

            _logger.LogWarning("No Authorization header found in HttpContext");
            return null;
        }


    }
}
