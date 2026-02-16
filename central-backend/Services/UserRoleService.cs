using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;
using AuditSoftware.Data;
using AuditSoftware.DTOs.UserRole;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;
using ClosedXML.Excel;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using AuditSoftware.Models.Core;
using System.Text.Json;

namespace AuditSoftware.Services;

public class UserRoleService :  ServiceBase, IUserRoleService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<UserRoleService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserRoleService(
        AppDbContext context, 
        IMapper mapper,
        ILogger<UserRoleService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    private async Task EnrichWithUserNames(UserRoleResponseDto dto)
    {
        if (dto.strCreatedByGUID != Guid.Empty)
        {
            var creator = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == dto.strCreatedByGUID);
            dto.strCreatedBy = creator?.strName ?? string.Empty;
        }

        if (dto.strUpdatedByGUID.HasValue && dto.strUpdatedByGUID.Value != Guid.Empty)
        {
            var updater = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == dto.strUpdatedByGUID.Value);
            dto.strUpdatedBy = updater?.strName ?? string.Empty;
        }
    }

    private async Task EnrichWithUserNames(IEnumerable<UserRoleResponseDto> dtos)
    {
        foreach (var dto in dtos)
        {
            await EnrichWithUserNames(dto);
        }
    }

    private (string? ipAddress, string? userAgent) GetRequestDetails()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return (null, null);

        string? ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
        
        // If behind a proxy, check X-Forwarded-For header
        if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1" || ipAddress == "127.0.0.1")
        {
            var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                ipAddress = forwardedFor.Split(',')[0].Trim();
            }
        }

        string? userAgent = httpContext.Request.Headers["User-Agent"].ToString();
        return (ipAddress, userAgent);
    }

    public async Task<PagedResponse<UserRoleResponseDto>> GetAllUserRolesAsync(
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool isDescending, // This should be interpreted as "descending" if true
        string? search,
        Guid groupGuid,
        string? strModuleGUID = null,
        bool? bolIsActive = null,
        string? strCreatedByGUIDs = null,
        string? strUpdatedByGUIDs = null)
    {
        try
        {
            // Parse the module GUID if provided
            var query = _context.MstUserRoles
                .Include(r => r.Module)
                .Where(r => r.strGroupGUID == groupGuid)
                .AsQueryable();
                
            // Add module GUID filter if provided
            if (!string.IsNullOrEmpty(strModuleGUID))
            {
                Guid moduleGuid = Guid.Parse(strModuleGUID);
                query = query.Where(r => r.strModuleGUID == moduleGuid);
            }

            // Apply search if provided - only use database-compatible operations
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower().Trim();
                
                // Check for status keywords (match CityService approach)
                bool isActiveSearch = "active".StartsWith(searchLower) || searchLower == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchLower) || searchLower == "inact";
                
                if (isActiveSearch)
                {
                    // Show active user roles
                    query = query.Where(r => r.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive user roles
                    query = query.Where(r => r.bolIsActive == false);
                }
                else
                {
                    // Try to parse the search term as a date first
                    bool isDate = DateTime.TryParse(search, out DateTime parsedDate);
                    
                    if (isDate)
                    {
                        // Search for exact date matches in Created On and Updated On
                        DateTime startDate = parsedDate.Date;
                        DateTime endDate = startDate.AddDays(1);
                        
                        query = query.Where(r =>
                            (r.dtCreatedOn >= startDate && r.dtCreatedOn < endDate) || 
                            (r.dtUpdatedOn.HasValue && r.dtUpdatedOn.Value >= startDate && r.dtUpdatedOn.Value < endDate));
                    }
                    else
                    {
                        // Create a query that includes joins to the user tables for creator and updater names
                        var queryWithUserNames = _context.MstUserRoles
                            .Where(r => r.strGroupGUID == groupGuid)
                            .Join(
                                _context.MstUsers,
                                role => role.strCreatedByGUID,
                                user => user.strUserGUID,
                                (role, creator) => new { Role = role, Creator = creator }
                            )
                            .GroupJoin(
                                _context.MstUsers,
                                joined => joined.Role.strUpdatedByGUID,
                                user => user.strUserGUID,
                                (joined, updaters) => new { joined.Role, joined.Creator, Updaters = updaters }
                            )
                            .SelectMany(
                                x => x.Updaters.DefaultIfEmpty(),
                                (joined, updater) => new { joined.Role, joined.Creator, Updater = updater }
                            );

                        // Search on role fields and user names
                        var userNameSearchResults = queryWithUserNames
                            .Where(x => 
                                x.Role.strUserRoleGUID.ToString().ToLower().Contains(searchLower) ||
                                x.Role.strName.ToLower().Contains(searchLower) ||
                                (x.Role.strDesc != null && x.Role.strDesc.ToLower().Contains(searchLower)) ||
                                x.Creator.strName.ToLower().Contains(searchLower) ||
                                (x.Updater != null && x.Updater.strName.ToLower().Contains(searchLower))
                            )
                            .Select(x => x.Role);

                        // Search on text fields
                        var textSearchResults = query.Where(r =>
                            r.strUserRoleGUID.ToString().ToLower().Contains(searchLower) ||
                            r.strName.ToLower().Contains(searchLower) ||
                            (r.strDesc != null && r.strDesc.ToLower().Contains(searchLower)));

                        // Combine results from both searches
                        query = textSearchResults.Union(userNameSearchResults);
                    }
                    
                    // Try to parse date - if valid, we'll do separate date filtering
                    if (DateTime.TryParse(search, out DateTime searchDate))
                    {
                        // Get a query for date matches
                        var dateQuery = _context.MstUserRoles
                            .Where(r => r.strGroupGUID == groupGuid &&
                                (EF.Functions.DateDiffDay(r.dtCreatedOn, searchDate) == 0 || 
                                (r.dtUpdatedOn.HasValue && EF.Functions.DateDiffDay(r.dtUpdatedOn.Value, searchDate) == 0)));
                        
                        // Union the original query with date-specific results
                        query = query.Union(dateQuery);
                    }
                }
            }
            
            // Filter by active status if provided
            if (bolIsActive.HasValue)
            {
                query = query.Where(r => r.bolIsActive == bolIsActive.Value);
            }
            
            // Filter by created by GUIDs (comma-separated)
            if (!string.IsNullOrWhiteSpace(strCreatedByGUIDs))
            {
                var createdByGuids = strCreatedByGUIDs
                    .Split(',')
                    .Select(guid => guid.Trim())
                    .Where(guid => !string.IsNullOrWhiteSpace(guid))
                    .Select(guid => Guid.Parse(guid))
                    .ToList();

                if (createdByGuids.Any())
                {
                    query = query.Where(r => createdByGuids.Contains(r.strCreatedByGUID));
                }
            }
            
            // Filter by updated by GUIDs (comma-separated)
            if (!string.IsNullOrWhiteSpace(strUpdatedByGUIDs))
            {
                var updatedByGuids = strUpdatedByGUIDs
                    .Split(',')
                    .Select(guid => guid.Trim())
                    .Where(guid => !string.IsNullOrWhiteSpace(guid))
                    .Select(guid => Guid.Parse(guid))
                    .ToList();

                if (updatedByGuids.Any())
                {
                    query = query.Where(r => r.strUpdatedByGUID.HasValue && updatedByGuids.Contains(r.strUpdatedByGUID.Value));
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                // Convert sortBy to lowercase for case-insensitive comparison
                var sortByLower = sortBy.ToLower();
                
                switch (sortByLower)
                {
                    case "strname":
                        // For Name field sorting - ensure descending works correctly
                        query = isDescending 
                            ? query.OrderByDescending(r => r.strName)
                            : query.OrderBy(r => r.strName);
                        break;
                    case "strdesc":
                        // For Description field sorting
                        query = isDescending 
                            ? query.OrderByDescending(r => r.strDesc)
                            : query.OrderBy(r => r.strDesc);
                        break;
                    case "status":
                    case "bolisactive":
                        // For Status field sorting
                        query = isDescending 
                            ? query.OrderBy(r => r.bolIsActive)            // Inactive first when descending
                            : query.OrderByDescending(r => r.bolIsActive); // Active first when ascending
                        break;
                    case "dtcreatedon":
                    case "createdon":
                        // For Created On field sorting
                        query = isDescending 
                            ? query.OrderByDescending(r => r.dtCreatedOn)
                            : query.OrderBy(r => r.dtCreatedOn);
                        break;
                    case "dtupdatedon":
                    case "updatedon":
                        // For Updated On field sorting
                        query = isDescending 
                            ? query.OrderByDescending(r => r.dtUpdatedOn)
                            : query.OrderBy(r => r.dtUpdatedOn);
                        break;
                    case "strcreatedby":
                    case "createdby":
                        // For Created By field sorting - Join with Users table to sort by name
                        var createdByJoin = from role in query
                            join user in _context.MstUsers
                                on role.strCreatedByGUID equals user.strUserGUID into userGroup
                            from user in userGroup.DefaultIfEmpty()
                            select new { role, userName = user != null ? user.strName : "" };
                        
                        query = isDescending
                            ? createdByJoin.OrderByDescending(x => x.userName).Select(x => x.role)
                            : createdByJoin.OrderBy(x => x.userName).Select(x => x.role);
                        break;
                    case "strupdatedby":
                    case "updatedby":
                        // For Updated By field sorting - Join with Users table to sort by name
                        var updatedByJoin = from role in query
                            join user in _context.MstUsers
                                on role.strUpdatedByGUID equals user.strUserGUID into userGroup
                            from user in userGroup.DefaultIfEmpty()
                            select new { role, userName = user != null ? user.strName : "" };
                        
                        query = isDescending
                            ? updatedByJoin.OrderByDescending(x => x.userName).Select(x => x.role)
                            : updatedByJoin.OrderBy(x => x.userName).Select(x => x.role);
                        break;
                    default:
                        // Default to name sorting
                        query = isDescending 
                            ? query.OrderByDescending(r => r.strName)
                            : query.OrderBy(r => r.strName);
                        break;
                }
            }
            else
            {
                // Default sorting by name
                query = isDescending 
                    ? query.OrderByDescending(r => r.strName)
                    : query.OrderBy(r => r.strName);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Map to DTOs
            var dtos = _mapper.Map<List<UserRoleResponseDto>>(items);
            
            await EnrichWithUserNames(dtos);

            return new PagedResponse<UserRoleResponseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }
        catch (Exception ex)
        {
            throw new BusinessException($"Error occurred while getting user roles: {ex.Message}");
        }
    }

    public async Task<UserRoleResponseDto?> GetUserRoleByIdAsync(Guid guid, Guid groupGuid, Guid? moduleGuid = null)
    {
        try
        {
            var query = _context.MstUserRoles
                .Include(r => r.Module)
                .Where(r => r.strUserRoleGUID == guid && r.strGroupGUID == groupGuid);
            
            // Add module GUID filter if provided
            if (moduleGuid.HasValue)
            {
                query = query.Where(r => r.strModuleGUID == moduleGuid.Value);
            }
            
            var userRole = await query.FirstOrDefaultAsync();
            
            if (userRole == null)
                return null;
                
            var dto = _mapper.Map<UserRoleResponseDto>(userRole);
            
            await EnrichWithUserNames(dto);
            return dto;
        }
        catch (Exception ex)
        {
            throw new BusinessException($"Error occurred while getting user role: {ex.Message}");
        }
    }

    public async Task<UserRoleResponseDto> CreateUserRoleAsync(UserRoleCreateDto userRoleDto, Guid userGuid, Guid groupGuid, Guid? moduleGuid = null)
    {
        try
        {
            // Check for duplicate user role with same name at group AND module level
            var existingRoleQuery = _context.MstUserRoles
                .Where(r => r.strGroupGUID == groupGuid &&
                           r.strName.ToLower() == userRoleDto.strName.ToLower());
            
            // Add module filter if moduleGuid is provided
            if (moduleGuid.HasValue)
            {
                existingRoleQuery = existingRoleQuery.Where(r => r.strModuleGUID == moduleGuid.Value);
            }
            
            var existingRoleInGroupAndModule = await existingRoleQuery.AnyAsync();
            if (existingRoleInGroupAndModule)
            {
                var errorMessage = moduleGuid.HasValue
                    ? $"A user role with name '{userRoleDto.strName}' already exists in this group and module."
                    : $"A user role with name '{userRoleDto.strName}' already exists in this group.";
                throw new BusinessException(errorMessage);
            }

            // Verify module exists if moduleGuid is provided
            if (moduleGuid.HasValue)
            {
                var moduleExists = await _context.MstModules.AnyAsync(m => m.strModuleGUID == moduleGuid);
                if (!moduleExists)
                {
                    throw new BusinessException("The specified module does not exist.");
                }
            }

            var currentDateTime = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            var userRole = _mapper.Map<MstUserRole>(userRoleDto);
            userRole.strUserRoleGUID = Guid.NewGuid();
            userRole.strGroupGUID = groupGuid;
            
            // Set moduleGUID from token if provided
            if (moduleGuid.HasValue)
            {
                userRole.strModuleGUID = moduleGuid;
            }
            
            userRole.dtCreatedOn = currentDateTime;
            userRole.dtUpdatedOn = currentDateTime;
            userRole.strCreatedByGUID = userGuid;
            userRole.strUpdatedByGUID = userGuid;

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    _context.MstUserRoles.Add(userRole);
                    await _context.SaveChangesAsync();

                    // Build detailed creation message
                    var details = new List<string>();
                    details.Add($"name: '{userRole.strName}'");
                    
                    if (!string.IsNullOrEmpty(userRole.strDesc))
                        details.Add($"description: '{userRole.strDesc}'");
                    details.Add($"status: {(userRole.bolIsActive ? "Active" : "Inactive")}");
                    if (moduleGuid.HasValue)
                        details.Add("with module association");

                    // Log the activity
                    var (ipAddress, userAgent) = GetRequestDetails();
                    var activityLog = new MstUserActivityLog
                    {
                        UserGUID = userGuid,
                        GroupGUID = groupGuid,
                        ActivityType = "CREATE_USER_ROLE",
                        Details = $"Created new user role with {string.Join(", ", details)}",
                        EntityType = "UserRole",
                        EntityGUID = userRole.strUserRoleGUID,
                        ModuleGUID = moduleGuid,
                        IPAddress = ipAddress,
                        UserAgent = userAgent,
                        NewValue = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            name = userRole.strName,
                            description = userRole.strDesc,
                            isActive = userRole.bolIsActive,
                            moduleGuid = userRole.strModuleGUID
                        })
                    };

                    _context.MstUserActivityLogs.Add(activityLog);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    var dto = _mapper.Map<UserRoleResponseDto>(userRole);
                    await EnrichWithUserNames(dto);
                    return dto;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error during user role creation transaction");
                    throw new BusinessException($"Failed to create user role: {ex.Message}");
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user role creation");
            throw new BusinessException($"Failed to create user role: {ex.Message}");
        }
    }

    public async Task<UserRoleResponseDto?> UpdateUserRoleAsync(Guid guid, UserRoleUpdateDto userRoleDto, Guid userGuid, Guid groupGuid, Guid? moduleGuid = null)
    {
        try
        {
            var userRole = await _context.MstUserRoles
                .FirstOrDefaultAsync(r => r.strUserRoleGUID == guid);
            if (userRole == null)
                throw new BusinessException("User role not found");

            // Check if the role belongs to the group
            if (userRole.strGroupGUID != groupGuid)
                throw new BusinessException("User role does not belong to your group");

            // Check if name is being changed and if it already exists
            if (!string.Equals(userRole.strName, userRoleDto.strName, StringComparison.OrdinalIgnoreCase))
            {
                // Check for duplicate in group AND module
                var existingRoleQuery = _context.MstUserRoles
                    .Where(r => r.strGroupGUID == groupGuid &&
                               r.strUserRoleGUID != guid &&
                               r.strName.ToLower() == userRoleDto.strName.ToLower());
                
                // Add module filter if moduleGuid is provided
                if (moduleGuid.HasValue)
                {
                    existingRoleQuery = existingRoleQuery.Where(r => r.strModuleGUID == moduleGuid.Value);
                }
                
                var existingRoleInGroupAndModule = await existingRoleQuery.AnyAsync();
                if (existingRoleInGroupAndModule)
                {
                    var errorMessage = moduleGuid.HasValue
                        ? $"A user role with name '{userRoleDto.strName}' already exists in this group and module."
                        : $"A user role with name '{userRoleDto.strName}' already exists in this group.";
                    throw new BusinessException(errorMessage);
                }
            }

            // Verify module exists if moduleGuid is provided
            if (moduleGuid.HasValue)
            {
                var moduleExists = await _context.MstModules.AnyAsync(m => m.strModuleGUID == moduleGuid);
                if (!moduleExists)
                {
                    throw new BusinessException("The specified module does not exist.");
                }
            }

            // Store old values before update
            var oldValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                name = userRole.strName,
                isActive = userRole.bolIsActive,
                moduleGuid = userRole.strModuleGUID
            });

            _mapper.Map(userRoleDto, userRole);
            
            // Set moduleGUID from token if provided
            if (moduleGuid.HasValue)
            {
                userRole.strModuleGUID = moduleGuid;
            }
            
            userRole.dtUpdatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            userRole.strUpdatedByGUID = userGuid;

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    await _context.SaveChangesAsync();

                    // Build change description
                    var oldJson = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(oldValues);
                    var changes = new List<string>();

                    if (oldJson != null)
                    {
                        // Helper function to safely get string value
                        string GetSafeString(Dictionary<string, JsonElement> dict, string key)
                        {
                            return dict.TryGetValue(key, out var element) ? element.GetString() ?? "" : "";
                        }

                        // Helper function to safely get boolean value
                        bool GetSafeBoolean(Dictionary<string, JsonElement> dict, string key)
                        {
                            return dict.TryGetValue(key, out var element) && element.ValueKind == JsonValueKind.True;
                        }

                        var oldName = GetSafeString(oldJson, "name");
                        if (oldName != userRole.strName)
                        {
                            changes.Add($"name from '{oldName}' to '{userRole.strName}'");
                        }

                        var oldActive = GetSafeBoolean(oldJson, "isActive");
                        if (oldActive != userRole.bolIsActive)
                        {
                            changes.Add($"status from '{(oldActive ? "Active" : "Inactive")}' to '{(userRole.bolIsActive ? "Active" : "Inactive")}'");
                        }
                    }

                    string detailsMessage = $"Updated user role '{userRole.strName}'";
                    if (changes.Any())
                    {
                        detailsMessage += $": Changed {string.Join(", ", changes)}";
                    }

                    // Log the activity
                    var (ipAddress, userAgent) = GetRequestDetails();
                    var activityLog = new MstUserActivityLog
                    {
                        UserGUID = userGuid,
                        GroupGUID = groupGuid,
                        ActivityType = "UPDATE_USER_ROLE",
                        Details = detailsMessage,
                        EntityType = "UserRole",
                        EntityGUID = userRole.strUserRoleGUID,
                        ModuleGUID = moduleGuid,
                        IPAddress = ipAddress,
                        UserAgent = userAgent,
                        OldValue = oldValues,
                        NewValue = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            name = userRole.strName,
                            isActive = userRole.bolIsActive,
                            moduleGuid = userRole.strModuleGUID
                        })
                    };

                    _context.MstUserActivityLogs.Add(activityLog);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    var dto = _mapper.Map<UserRoleResponseDto>(userRole);
                    await EnrichWithUserNames(dto);
                    return dto;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error while updating user role");
                    throw new BusinessException($"Failed to update user role: {ex.Message}");
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user role update");
            throw new BusinessException($"Error occurred while updating user role: {ex.Message}");
        }
    }

    public async Task<bool> DeleteUserRoleAsync(Guid guid, Guid groupGuid)
    {
        try
        {
            var userRole = await _context.MstUserRoles
                .FirstOrDefaultAsync(r => r.strUserRoleGUID == guid);
            if (userRole == null)
                return false;

            if (userRole.bolSystemCreated)
            {
                throw new BusinessException("Cannot delete system-created user role");
            }

            // Delete associated user rights
            var userRights = await _context.MstUserRights
                .Where(r => r.strUserRoleGUID == guid)
                .ToListAsync();
            if (userRights.Any())
            {
                _context.MstUserRights.RemoveRange(userRights);
            }

            // Delete associated user details
            var userDetails = await _context.MstUserDetails
                .Where(ud => ud.strUserRoleGUID == guid)
                .ToListAsync();
            if (userDetails.Any())
            {
                _context.MstUserDetails.RemoveRange(userDetails);
            }

            _context.MstUserRoles.Remove(userRole);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new BusinessException($"Error occurred while deleting user role: {ex.Message}");
        }
    }
    
    public async Task<List<UserRoleResponseDto>> GetActiveRolesForDropdownAsync(Guid groupGuid, Guid? moduleGuid = null, string? search = null)
    {
        try
        {
            var query = _context.MstUserRoles
                .Include(r => r.Module)
                .Where(r => r.strGroupGUID == groupGuid && r.bolIsActive);
                
            // Add module GUID filter if provided
            if (moduleGuid.HasValue)
            {
                query = query.Where(r => r.strModuleGUID == moduleGuid.Value);
            }
            
            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower().Trim();
                
                // Check for status keywords (match CityService approach)
                bool isActiveSearch = "active".StartsWith(searchLower) || searchLower == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchLower) || searchLower == "inact";
                
                if (isActiveSearch)
                {
                    // Already filtering for active, no additional filter needed
                    // query remains the same as it's already filtering for active roles
                }
                else if (isInactiveSearch)
                {
                    // User is searching for inactive, but this method only returns active roles
                    // Return empty query since they're looking for inactive roles
                    query = query.Where(r => false); // This will return no results
                }
                else
                {
                    // Regular text search
                    query = query.Where(r => r.strName.ToLower().Contains(searchLower) || 
                                            (r.strDesc != null && r.strDesc.ToLower().Contains(searchLower)));
                }
            }
            
            // Get sorted results
            var roles = await query
                .OrderBy(r => r.strName)
                .ToListAsync();
            
            // Map to DTOs
            var dtos = _mapper.Map<List<UserRoleResponseDto>>(roles);
            
            await EnrichWithUserNames(dtos);
            
            return dtos;
        }
        catch (Exception ex)
        {
            throw new BusinessException($"Error retrieving active roles: {ex.Message}");
        }
    }

    public async Task<PagedResponse<UserRoleResponseDto>> SearchRolesAsync(
        UserRoleSearchRequestDto searchDto, 
        Guid groupGuid)
    {
        try
        {
            var query = _context.MstUserRoles
                .Include(r => r.Module)
                .Where(r => r.strGroupGUID == groupGuid);

            // Apply dynamic filters
            if (!string.IsNullOrWhiteSpace(searchDto.strName))
            {
                query = query.Where(r => r.strName.Contains(searchDto.strName));
            }

            if (!string.IsNullOrWhiteSpace(searchDto.strDesc))
            {
                query = query.Where(r => r.strDesc != null && r.strDesc.Contains(searchDto.strDesc));
            }

            if (searchDto.bolIsActive.HasValue)
            {
                query = query.Where(r => r.bolIsActive == searchDto.bolIsActive.Value);
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(searchDto.SortBy))
            {
                switch (searchDto.SortBy.ToLower())
                {
                    case "name":
                    case "strname":
                        query = searchDto.SortAscending 
                            ? query.OrderBy(r => r.strName)
                            : query.OrderByDescending(r => r.strName);
                        break;
                    case "description":
                    case "strdesc":
                        query = searchDto.SortAscending 
                            ? query.OrderBy(r => r.strDesc)
                            : query.OrderByDescending(r => r.strDesc);
                        break;
                    case "status":
                    case "isactive":
                    case "bolisactive":
                        // Reversed logic: true (1) comes before false (0) in ascending order
                        // When ascending=true, order should be: Active(true) then Inactive(false)
                        query = searchDto.SortAscending 
                            ? query.OrderByDescending(r => r.bolIsActive)
                            : query.OrderBy(r => r.bolIsActive);
                        break;
                    default:
                        query = query.OrderBy(r => r.strName);
                        break;
                }
            }
            else
            {
                query = query.OrderBy(r => r.strName);
            }

            // Calculate total count for pagination
            var totalCount = await query.CountAsync();
            
            // Apply pagination
            var items = await query
                .Skip((searchDto.PageNumber - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            // Map to DTOs
            var dtos = _mapper.Map<List<UserRoleResponseDto>>(items);
            
            await EnrichWithUserNames(dtos);

            // Create paged response
            return new PagedResponse<UserRoleResponseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = searchDto.PageNumber,
                PageSize = searchDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)searchDto.PageSize)
            };
        }
        catch (Exception ex)
        {
            throw new BusinessException($"Error searching roles: {ex.Message}");
        }
    }
    
    public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportUserRolesAsync(string format, Guid groupGuid, Guid? moduleGuid = null)
    {
        try
        {
            // Validate format
            if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
            {
                throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
            }

            // Get all user roles for the specified group
            var query = _context.MstUserRoles
                .Where(ur => ur.strGroupGUID == groupGuid);
                
            // Add module GUID filter if provided
            if (moduleGuid.HasValue)
            {
                query = query.Where(ur => ur.strModuleGUID == moduleGuid.Value);
            }
                
            var userRoles = await query
                .OrderBy(ur => ur.strName)
                .ToListAsync();
            
            if (userRoles == null || !userRoles.Any())
            {
                throw new BusinessException("No user roles found to export");
            }

            // Get user information for created by and updated by
            var userGuids = userRoles
                .SelectMany(ur => {
                    var guids = new List<Guid>();
                    guids.Add(ur.strCreatedByGUID);
                    if (ur.strUpdatedByGUID.HasValue)
                        guids.Add(ur.strUpdatedByGUID.Value);
                    return guids;
                })
                .Distinct()
                .ToList();

            var users = await _context.MstUsers
                .Where(u => userGuids.Contains(u.strUserGUID))
                .Select(u => new { u.strUserGUID, u.strName })
                .ToDictionaryAsync(u => u.strUserGUID, u => u.strName);

            string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            
            if (format.ToLower() == "excel")
            {
                // Create Excel file
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("User Roles");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Role Name";
                worksheet.Cell(1, 2).Value = "Description";
                worksheet.Cell(1, 3).Value = "Is Active";
                worksheet.Cell(1, 4).Value = "Created By";
                worksheet.Cell(1, 5).Value = "Created On";
                worksheet.Cell(1, 6).Value = "Updated By";
                worksheet.Cell(1, 7).Value = "Updated On";
                
                // Style header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < userRoles.Count; i++)
                {
                    var role = userRoles[i];
                    int row = i + 2;
                    
                    // Get user names
                    string createdByName = users.ContainsKey(role.strCreatedByGUID) 
                        ? users[role.strCreatedByGUID] 
                        : "";
                        
                    string updatedByName = role.strUpdatedByGUID.HasValue && users.ContainsKey(role.strUpdatedByGUID.Value) 
                        ? users[role.strUpdatedByGUID.Value] 
                        : "";

                    worksheet.Cell(row, 1).Value = role.strName;
                    worksheet.Cell(row, 2).Value = role.strDesc ?? "";
                    worksheet.Cell(row, 3).Value = role.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 4).Value = createdByName;
                    worksheet.Cell(row, 5).Value = role.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                    worksheet.Cell(row, 6).Value = updatedByName;
                    worksheet.Cell(row, 7).Value = role.dtUpdatedOn.HasValue ? role.dtUpdatedOn.Value.ToString("yyyy-MM-dd HH:mm:ss") : "";
                }

                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Convert to byte array
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"UserRoles_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Role Name,Description,Is Active,Created By,Created On,Updated By,Updated On");
                
                // Add data rows
                foreach (var role in userRoles)
                {
                    // Get user names
                    string createdByName = users.ContainsKey(role.strCreatedByGUID) 
                        ? users[role.strCreatedByGUID] 
                        : "";
                        
                    string updatedByName = role.strUpdatedByGUID.HasValue && users.ContainsKey(role.strUpdatedByGUID.Value) 
                        ? users[role.strUpdatedByGUID.Value] 
                        : "";
                    
                    // Escape fields with quotes if they contain commas or quotes
                    string EscapeField(string field)
                    {
                        if (string.IsNullOrEmpty(field)) return "";
                        return field.Contains(",") || field.Contains("\"") 
                            ? $"\"{field.Replace("\"", "\"\"")}\""
                            : field;
                    }
                    
                    csv.AppendLine(string.Join(",",
                        EscapeField(role.strName),
                        EscapeField(role.strDesc ?? ""),
                        role.bolIsActive ? "Active" : "Inactive",
                        EscapeField(createdByName),
                        role.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss"),
                        EscapeField(updatedByName),
                        role.dtUpdatedOn.HasValue ? role.dtUpdatedOn.Value.ToString("yyyy-MM-dd HH:mm:ss") : ""
                    ));
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"UserRoles_{timestamp}.csv");
            }
        }
        catch (Exception ex)
        {
            throw new BusinessException($"Error exporting user roles: {ex.Message}");
        }
    }
} 
