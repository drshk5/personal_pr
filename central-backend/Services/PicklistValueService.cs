using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Linq.Expressions;
using System.Text;
using System.IO;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using ClosedXML.Excel;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.PicklistValue;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Models.Core;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;

namespace AuditSoftware.Services
{
    public class PicklistValueService :  ServiceBase, IPicklistValueService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public PicklistValueService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PicklistValueResponseDto> CreateAsync(PicklistValueCreateDto createDto, string createdByGUID, string groupGUID)
        {
            // Validate picklistType exists
            var picklistType = await _context.MstPicklistTypes
                .FirstOrDefaultAsync(x => x.strPicklistTypeGUID == createDto.strPicklistTypeGUID);

            if (picklistType == null)
                throw new BusinessException("Invalid picklist type");

            // Check for duplicate value
            var exists = await _context.MstPickListValues
                .AnyAsync(x => x.strValue.ToLower() == createDto.strValue.ToLower() 
                    && x.strPicklistTypeGUID == createDto.strPicklistTypeGUID 
                    && x.strGroupGUID == Guid.Parse(groupGUID));

            if (exists)
                throw new BusinessException($"A picklist value '{createDto.strValue}' already exists for this picklist type in your group");

            var picklistValue = _mapper.Map<MstPickListValue>(createDto);
            picklistValue.strPickListValueGUID = Guid.NewGuid();
            picklistValue.strCreatedByGUID = Guid.Parse(createdByGUID);
            picklistValue.strGroupGUID = Guid.Parse(groupGUID);
            picklistValue.dtCreatedOn = CurrentDateTime;
            picklistValue.strUpdatedByGUID = Guid.Parse(createdByGUID);  // Set updated by to the same as created by
            picklistValue.dtUpdatedOn = CurrentDateTime;                 // Set updated on to the same as created on

            try
            {
                // Build detailed creation message
                var details = new List<string>();
                details.Add($"value: '{picklistValue.strValue}'");
                details.Add($"picklist type: '{picklistType.strType}'");
                details.Add($"status: {(picklistValue.bolIsActive ? "Active" : "Inactive")}");

                // Store new value for activity log
                var newValue = System.Text.Json.JsonSerializer.Serialize(new
                {
                    value = picklistValue.strValue,
                    picklistTypeGuid = picklistValue.strPicklistTypeGUID,
                    picklistType = picklistType.strType,
                    isActive = picklistValue.bolIsActive
                });

                // Create activity log
                var activityLog = new MstUserActivityLog
                {
                    ActivityLogGUID = Guid.NewGuid(),
                    UserGUID = Guid.Parse(createdByGUID),
                    GroupGUID = Guid.Parse(groupGUID),
                    ActivityType = "CREATE_PICKLIST_VALUE",
                    Details = $"Created new picklist value with {string.Join(", ", details)}",
                    EntityType = "PicklistValue",
                    EntityGUID = picklistValue.strPickListValueGUID,
                    NewValue = newValue,
                    CreatedByGUID = Guid.Parse(createdByGUID),
                    CreatedOn = CurrentDateTime,
                    ActivityTime = CurrentDateTime
                };

                _context.MstPickListValues.Add(picklistValue);
                _context.MstUserActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new BusinessException("Failed to create picklist value. Please ensure the value is unique.");
            }

            var response = _mapper.Map<PicklistValueResponseDto>(picklistValue);
            await EnrichWithUserNames(response);
            return response;
        }

        public async Task<PicklistValueResponseDto> UpdateAsync(string guid, PicklistValueUpdateDto updateDto, string updatedByGUID, string groupGUID)
        {
            var picklistValue = await _context.MstPickListValues
                .Include(x => x.PicklistType)
                .Where(x => x.strPickListValueGUID == Guid.Parse(guid) && x.strGroupGUID == Guid.Parse(groupGUID))
                .FirstOrDefaultAsync();

            if (picklistValue == null)
                throw new BusinessException("Picklist value not found or you don't have permission to update it");

            // Validate that the picklist type exists
            var picklistType = await _context.MstPicklistTypes
                .FirstOrDefaultAsync(x => x.strPicklistTypeGUID == updateDto.strPicklistTypeGUID);

            if (picklistType == null)
                throw new BusinessException("Invalid picklist type");

            // Check for duplicate value if the value is being changed or the picklist type is being changed
            if (picklistValue.strValue.ToLower() != updateDto.strValue.ToLower() || 
                picklistValue.strPicklistTypeGUID != updateDto.strPicklistTypeGUID)
            {
                var exists = await _context.MstPickListValues
                    .AnyAsync(x => x.strValue.ToLower() == updateDto.strValue.ToLower() 
                        && x.strPicklistTypeGUID == updateDto.strPicklistTypeGUID 
                        && x.strGroupGUID == Guid.Parse(groupGUID)
                        && x.strPickListValueGUID != picklistValue.strPickListValueGUID);

                if (exists)
                    throw new BusinessException($"A picklist value '{updateDto.strValue}' already exists for this picklist type in your group");
            }

            try
            {
                // Store old values before update
                var oldValue = System.Text.Json.JsonSerializer.Serialize(new
                {
                    value = picklistValue.strValue,
                    picklistTypeGuid = picklistValue.strPicklistTypeGUID,
                    picklistType = picklistValue.PicklistType?.strType,
                    isActive = picklistValue.bolIsActive
                });

                // Store current values for change detection
                var oldPicklistValue = picklistValue.strValue;
                var oldPicklistTypeGuid = picklistValue.strPicklistTypeGUID;
                var oldIsActive = picklistValue.bolIsActive;

                // Apply updates
                _mapper.Map(updateDto, picklistValue);
                picklistValue.strUpdatedByGUID = Guid.Parse(updatedByGUID);
                picklistValue.dtUpdatedOn = CurrentDateTime;

                // Build change description
                var changes = new List<string>();
                if (oldPicklistValue != picklistValue.strValue)
                {
                    changes.Add($"value from '{oldPicklistValue}' to '{picklistValue.strValue}'");
                }

                if (oldPicklistTypeGuid != picklistValue.strPicklistTypeGUID)
                {
                    var oldType = await _context.MstPicklistTypes
                        .Where(x => x.strPicklistTypeGUID == oldPicklistTypeGuid)
                        .Select(x => x.strType)
                        .FirstOrDefaultAsync();
                    var newType = await _context.MstPicklistTypes
                        .Where(x => x.strPicklistTypeGUID == picklistValue.strPicklistTypeGUID)
                        .Select(x => x.strType)
                        .FirstOrDefaultAsync();
                    changes.Add($"picklist type from '{oldType ?? "unknown"}' to '{newType ?? "unknown"}'");
                }

                if (oldIsActive != picklistValue.bolIsActive)
                {
                    changes.Add($"status from '{(oldIsActive ? "Active" : "Inactive")}' to '{(picklistValue.bolIsActive ? "Active" : "Inactive")}'");
                }

                string detailsMessage = $"Updated picklist value '{picklistValue.strValue}'";
                if (changes.Any())
                {
                    detailsMessage += $": Changed {string.Join(", ", changes)}";
                }

                // Create activity log
                var activityLog = new MstUserActivityLog
                {
                    ActivityLogGUID = Guid.NewGuid(),
                    UserGUID = Guid.Parse(updatedByGUID),
                    GroupGUID = Guid.Parse(groupGUID),
                    ActivityType = "UPDATE_PICKLIST_VALUE",
                    Details = detailsMessage,
                    EntityType = "PicklistValue",
                    EntityGUID = picklistValue.strPickListValueGUID,
                    OldValue = oldValue,
                    NewValue = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        value = picklistValue.strValue,
                        picklistTypeGuid = picklistValue.strPicklistTypeGUID,
                        picklistType = picklistType.strType,
                        isActive = picklistValue.bolIsActive
                    }),
                    CreatedByGUID = Guid.Parse(updatedByGUID),
                    CreatedOn = CurrentDateTime,
                    ActivityTime = CurrentDateTime
                };

                _context.MstUserActivityLogs.Add(activityLog);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new BusinessException("Failed to update picklist value. Please ensure the value is unique.");
            }

            var response = _mapper.Map<PicklistValueResponseDto>(picklistValue);
            await EnrichWithUserNames(response);
            return response;
        }

        public async Task<PicklistValueResponseDto> GetByIdAsync(string guid)
        {
            var picklistValue = await _context.MstPickListValues
                .Include(x => x.PicklistType)
                .FirstOrDefaultAsync(x => x.strPickListValueGUID == Guid.Parse(guid));

            if (picklistValue == null)
                throw new BusinessException("Picklist value not found");

            var response = _mapper.Map<PicklistValueResponseDto>(picklistValue);
            await EnrichWithUserNames(response);
            return response;
        }

        public async Task<PagedResponse<PicklistValueResponseDto>> GetAllAsync(PicklistValueFilterDto filterDto)
        {
            if (filterDto.PageNumber < 1)
                throw new BusinessException("Page number must be greater than 0");
            if (filterDto.PageSize < 1)
                throw new BusinessException("Page size must be greater than 0");

            // Build the base query
            IQueryable<MstPickListValue> query = _context.MstPickListValues
                .Include(x => x.PicklistType);
                
            // Apply group filter if provided
            if (!string.IsNullOrEmpty(filterDto.strGroupGUID))
            {
                query = query.Where(x => x.strGroupGUID == Guid.Parse(filterDto.strGroupGUID));
            }

            // Apply picklist type filter if provided
            if (filterDto.PicklistTypeGUIDs != null && filterDto.PicklistTypeGUIDs.Any())
            {
                var guidList = filterDto.PicklistTypeGUIDs
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => 
                    {
                        if (Guid.TryParse(x.Trim(), out Guid guid))
                            return guid;
                        throw new BusinessException($"Invalid GUID format: {x.Trim()}");
                    })
                    .ToList();

                if (guidList.Any())
                {
                    query = query.Where(x => guidList.Contains(x.strPicklistTypeGUID));
                }
            }

            // Apply active status filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }
            
            // Apply createdBy filter if provided
            if (filterDto.CreatedByGUIDs != null && filterDto.CreatedByGUIDs.Any())
            {
                var createdByGuids = filterDto.CreatedByGUIDs
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => 
                    {
                        if (Guid.TryParse(x.Trim(), out Guid guid))
                            return guid;
                        throw new BusinessException($"Invalid GUID format for CreatedByGUIDs: {x.Trim()}");
                    })
                    .ToList();

                if (createdByGuids.Any())
                {
                    query = query.Where(x => createdByGuids.Contains(x.strCreatedByGUID));
                }
            }
            
                        // Apply updatedBy filter if provided
            if (filterDto.UpdatedByGUIDs != null && filterDto.UpdatedByGUIDs.Any())
            {
                var updatedByGuids = filterDto.UpdatedByGUIDs
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Select(x => 
                    {
                        if (Guid.TryParse(x.Trim(), out Guid guid))
                            return guid;
                        throw new BusinessException($"Invalid GUID format for UpdatedByGUIDs: {x.Trim()}");
                    })
                    .ToList();

                if (updatedByGuids.Any())
                {
                    query = query.Where(x => x.strUpdatedByGUID.HasValue && updatedByGuids.Contains(x.strUpdatedByGUID.Value));
                }
            }

            // Apply specific field searches if provided
            if (!string.IsNullOrWhiteSpace(filterDto.ValueSearch))
            {
                var valueTerm = filterDto.ValueSearch.ToLower();
                query = query.Where(x => x.strValue.ToLower().Contains(valueTerm));
            }

            if (!string.IsNullOrWhiteSpace(filterDto.DescriptionSearch))
            {
                var descTerm = filterDto.DescriptionSearch.ToLower();
                query = query.Where(x => x.strValue != null && x.strValue.ToLower().Contains(descTerm));
            }

            // Apply general search if provided (across all fields)
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                // Check if the search term is a date
                bool isDate = DateTime.TryParse(searchTerm, out DateTime searchDate);
                
                if (isActiveSearch)
                {
                    // Show active picklist values
                    query = query.Where(x => x.bolIsActive);
                    Console.WriteLine("Term matches 'active' pattern - will search for active records");
                }
                else if (isInactiveSearch)
                {
                    // Show inactive picklist values
                    query = query.Where(x => !x.bolIsActive);
                    Console.WriteLine("Term matches 'inactive' pattern - will search for inactive records");
                }
                                 else if (isDate)
                 {
                     // Check if the search term contains time information
                     bool hasTimeComponent = searchTerm.Contains(":") || searchTerm.ToLower().Contains("am") || searchTerm.ToLower().Contains("pm");
                     
                     if (hasTimeComponent)
                     {
                         // Search for exact date-time match (within 1 minute tolerance)
                         var searchDateTime = searchDate;
                         var startTime = searchDateTime.AddMinutes(-1);
                         var endTime = searchDateTime.AddMinutes(1);
                         
                         query = query.Where(x => 
                             (x.dtCreatedOn >= startTime && x.dtCreatedOn <= endTime) ||
                             (x.dtUpdatedOn.HasValue && x.dtUpdatedOn.Value >= startTime && x.dtUpdatedOn.Value <= endTime)
                         );
                     }
                     else
                     {
                         // Search for matching dates only (entire day)
                         var startOfDay = searchDate.Date;
                         var endOfDay = startOfDay.AddDays(1).AddTicks(-1);
                         
                         query = query.Where(x => 
                             (x.dtCreatedOn >= startOfDay && x.dtCreatedOn <= endOfDay) ||
                             (x.dtUpdatedOn.HasValue && x.dtUpdatedOn.Value >= startOfDay && x.dtUpdatedOn.Value <= endOfDay)
                         );
                     }
                 }
                                     else
                     {
                         // Get users that match the search criteria
                         var matchingUsers = await _context.MstUsers
                             .Where(u => u.strName != null && u.strName.ToLower().Contains(searchTerm))
                             .Select(u => u.strUserGUID)
                             .ToListAsync();

                         // Search on picklist value fields and user names
                         query = query.Where(x =>
                             x.strPickListValueGUID.ToString().ToLower().Contains(searchTerm) ||
                             x.strValue.ToLower().Contains(searchTerm) ||
                             (x.PicklistType != null && (
                                 (x.PicklistType.strType != null && x.PicklistType.strType.ToLower().Contains(searchTerm)) ||
                                 (x.PicklistType.strDescription != null && x.PicklistType.strDescription.ToLower().Contains(searchTerm))
                             )) ||
                             matchingUsers.Contains(x.strCreatedByGUID) ||
                             (x.strUpdatedByGUID.HasValue && matchingUsers.Contains(x.strUpdatedByGUID.Value))
                         );
                     }
            }

            // Apply sorting

            // Apply sorting
            query = ApplySorting(query, filterDto.SortBy ?? "strValue", filterDto.ascending);

            var totalCount = await query.CountAsync();
            Console.WriteLine($"Total count after search: {totalCount}");
            
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();
            
            Console.WriteLine($"Items returned: {items.Count}");

            var dtos = _mapper.Map<List<PicklistValueResponseDto>>(items);

            // Enrich each DTO with user names
            foreach (var dto in dtos)
            {
                await EnrichWithUserNames(dto);
            }

            return new PagedResponse<PicklistValueResponseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
            };
        }

        private IQueryable<MstPickListValue> ApplySorting(IQueryable<MstPickListValue> query, string sortBy, bool ascending)
        {
            // Join with Users table for better performance
            var queryWithUsers = query
                .GroupJoin(_context.MstUsers,
                    pv => pv.strCreatedByGUID,
                    u => u.strUserGUID,
                    (pv, createdByUsers) => new { PicklistValue = pv, CreatedByUsers = createdByUsers })
                .SelectMany(x => x.CreatedByUsers.DefaultIfEmpty(),
                    (x, createdByUser) => new { x.PicklistValue, CreatedByUser = createdByUser })
                .GroupJoin(_context.MstUsers,
                    x => x.PicklistValue.strUpdatedByGUID,
                    u => u.strUserGUID,
                    (x, updatedByUsers) => new { x.PicklistValue, x.CreatedByUser, UpdatedByUsers = updatedByUsers })
                .SelectMany(x => x.UpdatedByUsers.DefaultIfEmpty(),
                    (x, updatedByUser) => new { x.PicklistValue, x.CreatedByUser, UpdatedByUser = updatedByUser });

            var orderedQuery = sortBy?.ToLower() switch
            {
                "strvalue" => ascending 
                    ? queryWithUsers.OrderBy(x => x.PicklistValue.strValue)
                    : queryWithUsers.OrderByDescending(x => x.PicklistValue.strValue),
                "strpicklisttype" => ascending 
                    ? queryWithUsers.OrderBy(x => x.PicklistValue.PicklistType.strType)
                    : queryWithUsers.OrderByDescending(x => x.PicklistValue.PicklistType.strType),
                "bolisactive" => ascending 
                    ? queryWithUsers.OrderByDescending(x => x.PicklistValue.bolIsActive)  // Show active first when ascending
                    : queryWithUsers.OrderBy(x => x.PicklistValue.bolIsActive),  // Show inactive first when descending
                "createdby" => ascending 
                    ? queryWithUsers.OrderBy(x => x.CreatedByUser != null ? x.CreatedByUser.strName : string.Empty)
                    : queryWithUsers.OrderByDescending(x => x.CreatedByUser != null ? x.CreatedByUser.strName : string.Empty),
                "createdon" => ascending 
                    ? queryWithUsers.OrderBy(x => x.PicklistValue.dtCreatedOn)
                    : queryWithUsers.OrderByDescending(x => x.PicklistValue.dtCreatedOn),
                "updatedby" => ascending 
                    ? queryWithUsers.OrderBy(x => x.UpdatedByUser != null ? x.UpdatedByUser.strName : string.Empty)
                    : queryWithUsers.OrderByDescending(x => x.UpdatedByUser != null ? x.UpdatedByUser.strName : string.Empty),
                "updatedon" => ascending 
                    ? queryWithUsers.OrderBy(x => x.PicklistValue.dtUpdatedOn ?? DateTime.MaxValue)
                    : queryWithUsers.OrderByDescending(x => x.PicklistValue.dtUpdatedOn ?? DateTime.MaxValue),
                "picklisttype" => ascending 
                    ? queryWithUsers.OrderBy(x => x.PicklistValue.PicklistType.strType)
                    : queryWithUsers.OrderByDescending(x => x.PicklistValue.PicklistType.strType),
                _ => ascending 
                    ? queryWithUsers.OrderBy(x => x.PicklistValue.strValue)
                    : queryWithUsers.OrderByDescending(x => x.PicklistValue.strValue)
            };

            return orderedQuery.Select(x => x.PicklistValue);
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            try
            {
                var picklistValue = await _context.MstPickListValues.FindAsync(Guid.Parse(guid));
                if (picklistValue == null)
                    return false;

                _context.MstPickListValues.Remove(picklistValue);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                throw new BusinessException("Failed to delete picklist value. It might be referenced by other records.");
            }
        }

        public async Task<List<PicklistValueSimpleDto>> GetActivePicklistValuesByTypeAsync(string strType, string? search = null, string? groupGUID = null)
        {
            if (string.IsNullOrEmpty(strType))
                throw new BusinessException("Picklist type is required");

            try
            {
                // Find the specific picklist type (exact match, case-insensitive)
                var searchType = strType.Trim();
                var picklistType = await _context.MstPicklistTypes
                    .FirstOrDefaultAsync(pt => pt.strType != null && 
                                             pt.strType.ToUpper() == searchType.ToUpper() && 
                                             pt.bolIsActive);

                if (picklistType == null)
                    throw new BusinessException($"No active picklist type found with type: {strType}");

                // Build the base query for active picklist values
                var query = _context.MstPickListValues
                    .Where(x => x.strPicklistTypeGUID == picklistType.strPicklistTypeGUID && x.bolIsActive);

                // Apply group filter if provided
                if (!string.IsNullOrEmpty(groupGUID))
                {
                    if (!Guid.TryParse(groupGUID, out Guid groupGuid))
                        throw new BusinessException("Invalid group GUID format");

                    query = query.Where(x => x.strGroupGUID == groupGuid);
                }

                // Apply search if provided
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchTerm = search.Trim().ToLower();
                    // Get users that match the search criteria
                    var matchingUsers = await _context.MstUsers
                        .Where(u => 
                            u.strName.ToLower().Contains(searchTerm) ||
                            (!string.IsNullOrEmpty(u.strEmailId) && u.strEmailId.ToLower().Contains(searchTerm)) ||
                            (!string.IsNullOrEmpty(u.strMobileNo) && u.strMobileNo.ToLower().Contains(searchTerm))
                        )
                        .Select(u => u.strUserGUID)
                        .ToListAsync();

                    // Include related entities for searching
                    query = query.Include(x => x.PicklistType);

                    // Search across all relevant fields
                    query = query.Where(x =>
                        // Value field
                        (x.strValue != null && x.strValue.ToLower().Contains(searchTerm)) ||
                        
                        // Picklist Type fields
                        (x.PicklistType != null && (
                            (x.PicklistType.strType != null && x.PicklistType.strType.ToLower().Contains(searchTerm)) ||
                            (x.PicklistType.strDescription != null && x.PicklistType.strDescription.ToLower().Contains(searchTerm))
                        )) ||
                        
                        // User related fields - search by GUIDs
                        matchingUsers.Contains(x.strCreatedByGUID) ||
                        (x.strUpdatedByGUID.HasValue && matchingUsers.Contains(x.strUpdatedByGUID.Value)) ||
                        
                        // Date fields (with various formats)
                        x.dtCreatedOn.ToString("yyyy-MM-dd").Contains(searchTerm) ||
                        x.dtCreatedOn.ToString("dd-MM-yyyy").Contains(searchTerm) ||
                        x.dtCreatedOn.ToString("dd/MM/yyyy").Contains(searchTerm) ||
                        (x.dtUpdatedOn.HasValue && (
                            x.dtUpdatedOn.Value.ToString("yyyy-MM-dd").Contains(searchTerm) ||
                            x.dtUpdatedOn.Value.ToString("dd-MM-yyyy").Contains(searchTerm) ||
                            x.dtUpdatedOn.Value.ToString("dd/MM/yyyy").Contains(searchTerm)
                        )) ||

                        // Additional fields
                        x.strPickListValueGUID.ToString().Contains(searchTerm) ||
                        x.strPicklistTypeGUID.ToString().Contains(searchTerm) ||
                        x.strGroupGUID.ToString().Contains(searchTerm)
                    );
                }

                // Execute the final query with explicit ordering
                return await query
                    .OrderBy(x => x.strValue)
                    .Select(x => new PicklistValueSimpleDto
                    {
                        strPickListValueGUID = x.strPickListValueGUID.ToString(),
                        strValue = x.strValue
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                var errorMessage = $"Error in GetActivePicklistValuesByTypeAsync: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorMessage += $" Inner error: {ex.InnerException.Message}";
                }
                throw new BusinessException(errorMessage);
            }
        }

        private async Task EnrichWithUserNames(PicklistValueResponseDto dto)
        {
            // Get creator name
            var creator = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strUserGUID == dto.strCreatedByGUID);
            if (creator != null)
            {
                dto.strCreatedBy = creator.strName;
            }

            // Get updater name if exists
            if (dto.strUpdatedByGUID.HasValue)
            {
                var updater = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == dto.strUpdatedByGUID.Value);
                if (updater != null)
                {
                    dto.strUpdatedBy = updater.strName;
                }
            }
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportPicklistValuesAsync(string format, string groupGuid)
        {
            try
            {
                // Validate format
                if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
                {
                    throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
                }
                
                // Validate groupGuid
                if (string.IsNullOrEmpty(groupGuid))
                {
                    throw new BusinessException("Group GUID cannot be null or empty");
                }

                // Get all picklist values for the specified group
                var picklistValues = await _context.MstPickListValues
                    .Include(p => p.PicklistType)
                    .Where(p => p.strGroupGUID == Guid.Parse(groupGuid))
                    .OrderBy(p => p.strPicklistTypeGUID)
                    .ThenBy(p => p.strValue)
                    .ToListAsync();
                
                if (picklistValues == null || !picklistValues.Any())
                {
                    throw new BusinessException("No picklist values found to export");
                }

                // Get user information for created by and updated by
                var userGuids = new List<string>();
                foreach (var picklistValue in picklistValues)
                {
                    // Add created by GUID (always present as it's required)
                    userGuids.Add(picklistValue.strCreatedByGUID.ToString());
                    
                    // Add updated by GUID if present
                    if (picklistValue.strUpdatedByGUID.HasValue)
                        userGuids.Add(picklistValue.strUpdatedByGUID.Value.ToString());
                }
                userGuids = userGuids.Distinct().ToList();

                // Dictionary to store user name lookups
                var userNames = new Dictionary<string, string>();
                
                if (userGuids.Any())
                {
                    var creatorUpdaters = await _context.MstUsers
                        .Where(u => userGuids.Contains(u.strUserGUID.ToString()))
                        .Select(u => new { u.strUserGUID, u.strName })
                        .ToListAsync();
                        
                    foreach (var user in creatorUpdaters)
                    {
                        string userGuid = user.strUserGUID.ToString();
                        if (!userNames.ContainsKey(userGuid))
                        {
                            userNames.Add(userGuid, user.strName ?? "");
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
                        var worksheet = workbook.Worksheets.Add("Picklist Values");
                        
                        // Add headers
                        worksheet.Cell(1, 1).Value = "Value";
                        worksheet.Cell(1, 2).Value = "Type";
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
                        for (int i = 0; i < picklistValues.Count; i++)
                        {
                            try
                            {
                                var picklistValue = picklistValues[i];
                                int row = i + 2;
                                
                                // Get user names for created by and updated by
                                string createdByName = "";
                                if (userNames.ContainsKey(picklistValue.strCreatedByGUID.ToString()))
                                {
                                    createdByName = userNames[picklistValue.strCreatedByGUID.ToString()];
                                }
                                
                                string updatedByName = "";
                                if (picklistValue.strUpdatedByGUID.HasValue && 
                                    userNames.ContainsKey(picklistValue.strUpdatedByGUID.Value.ToString()))
                                {
                                    updatedByName = userNames[picklistValue.strUpdatedByGUID.Value.ToString()];
                                }
                                
                                // Set values with explicit null checks
                                worksheet.Cell(row, 1).Value = picklistValue.strValue ?? "";
                                worksheet.Cell(row, 2).Value = picklistValue.PicklistType?.strType ?? "";
                                worksheet.Cell(row, 3).Value = picklistValue.bolIsActive ? "Active" : "Inactive";
                                worksheet.Cell(row, 4).Value = createdByName;
                                
                                try { worksheet.Cell(row, 5).Value = picklistValue.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss"); }
                                catch { worksheet.Cell(row, 5).Value = ""; }
                                
                                worksheet.Cell(row, 6).Value = updatedByName;
                                
                                if (picklistValue.dtUpdatedOn.HasValue)
                                {
                                    try { worksheet.Cell(row, 7).Value = picklistValue.dtUpdatedOn.Value.ToString("yyyy-MM-dd HH:mm:ss"); }
                                    catch { worksheet.Cell(row, 7).Value = ""; }
                                }
                                else
                                {
                                    worksheet.Cell(row, 7).Value = "";
                                }
                            }
                            catch (Exception ex)
                            {
                                // Log but continue with other rows
                                Console.WriteLine($"Error processing picklistValue row {i+1}: {ex.Message}");
                            }
                        }

                        // Auto-fit columns
                        worksheet.Columns().AdjustToContents();
                        
                        // Convert to byte array
                        using var stream = new MemoryStream();
                        workbook.SaveAs(stream);
                        stream.Position = 0;
                        
                        return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"PicklistValues_{timestamp}.xlsx");
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
                        csv.AppendLine("Value,Type,Is Active,Created By,Created On,Updated By,Updated On");
                    
                        // Add data rows
                        foreach (var picklistValue in picklistValues)
                        {
                            try
                            {
                                // Get user names for created by and updated by
                                string createdByName = "";
                                if (userNames.ContainsKey(picklistValue.strCreatedByGUID.ToString()))
                                {
                                    createdByName = userNames[picklistValue.strCreatedByGUID.ToString()];
                                }
                                
                                string updatedByName = "";
                                if (picklistValue.strUpdatedByGUID.HasValue && 
                                    userNames.ContainsKey(picklistValue.strUpdatedByGUID.Value.ToString()))
                                {
                                    updatedByName = userNames[picklistValue.strUpdatedByGUID.Value.ToString()];
                                }
                                
                                string createdOnStr = "";
                                try { createdOnStr = picklistValue.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss"); }
                                catch { /* ignore formatting errors */ }
                                
                                string updatedOnStr = "";
                                if (picklistValue.dtUpdatedOn.HasValue)
                                {
                                    try { updatedOnStr = picklistValue.dtUpdatedOn.Value.ToString("yyyy-MM-dd HH:mm:ss"); }
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
                                    EscapeField(picklistValue.strValue ?? ""),
                                    EscapeField(picklistValue.PicklistType?.strType ?? ""),
                                    picklistValue.bolIsActive ? "Active" : "Inactive",
                                    EscapeField(createdByName),
                                    createdOnStr,
                                    EscapeField(updatedByName),
                                    updatedOnStr
                                ));
                            }
                            catch (Exception ex)
                            {
                                // Log error but continue with other rows
                                Console.WriteLine($"Error processing row for picklist value {picklistValue.strPickListValueGUID}: {ex.Message}");
                                // Add a placeholder row to maintain data integrity
                                csv.AppendLine($"\"{picklistValue.strValue ?? "Unknown"}\",\"Error processing this picklist value's data\",,,,,");
                            }
                        }
                        
                        // Convert to bytes
                        byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                        
                        return (bytes, "text/csv", $"PicklistValues_{timestamp}.csv");
                    }
                    catch (Exception ex)
                    {
                        throw new BusinessException($"Error creating CSV export: {ex.Message}");
                    }
                }
            }
            catch (FormatException ex)
            {
                throw new BusinessException($"Format error while exporting picklist values: {ex.Message}. Please check data formats (especially dates and GUIDs).");
            }
            catch (Exception ex)
            {
                // Log detailed exception information for debugging
                Console.WriteLine($"Export error - Type: {ex.GetType().Name}, Message: {ex.Message}, StackTrace: {ex.StackTrace}");
                throw new BusinessException($"Error exporting picklist values: {ex.Message}");
            }
        }
    }
} 
