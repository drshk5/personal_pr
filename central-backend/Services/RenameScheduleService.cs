using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.RenameSchedule;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using AuditSoftware.Models.Core;
using AuditSoftware.Helpers;
using System;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.Services
{
    public class RenameScheduleService : ServiceBase, IRenameScheduleService 
    {
        private readonly AppDbContext _dbContext;
        private readonly ILogger<RenameScheduleService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RenameScheduleService(
            AppDbContext dbContext,
            ILogger<RenameScheduleService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
        }

        public async Task<RenameScheduleResponseDto> CreateAsync(RenameScheduleCreateDto createDto, string createdByGUID, string groupGUID)
        {
            _logger.LogInformation($"Creating new Chart of Account with name: {createDto.strRenameScheduleName}");

            // Validate input
            if (string.IsNullOrWhiteSpace(createDto.strRenameScheduleName))
                throw new BusinessException("Chart of Account name is required");

            // Parse groupGUID from token
            var parsedGroupGUID = Guid.Parse(groupGUID);

            // Verify the schedule exists and is editable
            var schedule = await _dbContext.MstSchedules
                .Where(s => s.strScheduleGUID == createDto.strScheduleGUID)
                .FirstOrDefaultAsync();

            if (schedule == null)
                throw new BusinessException($"Schedule with GUID '{createDto.strScheduleGUID}' not found");

            if (!schedule.bolIsEditable)
                throw new BusinessException($"Schedule with GUID '{createDto.strScheduleGUID}' is not editable");

            // Check if entry already exists for this schedule and group
            var existingEntry = await _dbContext.MstRenameSchedules
                .AnyAsync(rs => rs.strScheduleGUID == createDto.strScheduleGUID && 
                                rs.strGroupGUID == parsedGroupGUID);

            if (existingEntry)
                throw new BusinessException($"A Chart of Account for this schedule already exists for the group");

            // Create execution strategy for the transaction
            var strategy = _dbContext.Database.CreateExecutionStrategy();
            
            try
            {
                // Execute all database operations within the strategy
                return await strategy.ExecuteAsync(async () =>
                {
                    // Start transaction
                    using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        // Create new entity
                        var renameSchedule = new MstRenameSchedule
                        {
                            strRenameScheduleName = createDto.strRenameScheduleName,
                            strScheduleGUID = createDto.strScheduleGUID,
                            strGroupGUID = parsedGroupGUID,
                            dteCreatedOn = DateTime.UtcNow,
                            strCreatedByGUID = createdByGUID
                        };

                        await _dbContext.MstRenameSchedules.AddAsync(renameSchedule);
                        await _dbContext.SaveChangesAsync();

                        // Create activity log
                        var (ipAddress, userAgent) = GetRequestDetails();
                        var activityLog = new MstUserActivityLog
                        {
                            ActivityLogGUID = Guid.NewGuid(),
                            UserGUID = Guid.Parse(createdByGUID),
                            GroupGUID = Guid.Parse(groupGUID),
                            ActivityType = "CREATE_CHART_OF_ACCOUNT",
                            Details = $"Created new Chart of Account '{createDto.strRenameScheduleName}' for schedule '{schedule.strScheduleName}'",
                            EntityType = "ChartOfAccount",
                            EntityGUID = renameSchedule.strRenameScheduleGUID,
                            IPAddress = ipAddress,
                            UserAgent = userAgent,
                            NewValue = JsonSerializer.Serialize(new
                            {
                                name = renameSchedule.strRenameScheduleName,
                                scheduleGuid = renameSchedule.strScheduleGUID,
                                scheduleName = schedule.strScheduleName
                            }),
                            CreatedByGUID = Guid.Parse(createdByGUID),
                            CreatedOn = DateTime.UtcNow,
                            ActivityTime = DateTime.UtcNow
                        };

                        await _dbContext.MstUserActivityLogs.AddAsync(activityLog);
                        await _dbContext.SaveChangesAsync();

                        await transaction.CommitAsync();
                        return await MapToResponseDto(renameSchedule);
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Chart of Account");
                throw;
            }
        }

        public async Task<PagedResponse<RenameScheduleResponseDto>> GetAllAsync(RenameScheduleFilterDto filterDto, string groupGUID)
        {
            _logger.LogInformation("Getting all Schedules with renamed entries if they exist");

            var groupGuid = Guid.Parse(groupGUID);
            
            // Create base query for rename entries with all related data
            var renameQuery = from rs in _dbContext.MstRenameSchedules
                            join s in _dbContext.MstSchedules on rs.strScheduleGUID equals s.strScheduleGUID
                            join createdBy in _dbContext.MstUsers on rs.strCreatedByGUID equals createdBy.strUserGUID.ToString() into createdByGroup
                            from cb in createdByGroup.DefaultIfEmpty()
                            join modifiedBy in _dbContext.MstUsers on rs.strModifiedByGUID equals modifiedBy.strUserGUID.ToString() into modifiedByGroup
                            from mb in modifiedByGroup.DefaultIfEmpty()
                            where rs.strGroupGUID == groupGuid && s.bolIsActive
                            select new { RenameSchedule = rs, Schedule = s, CreatedBy = cb, ModifiedBy = mb };

            // Get base query for active schedules not in rename entries
            var schedulesQuery = from s in _dbContext.MstSchedules
                               where s.bolIsActive && !_dbContext.MstRenameSchedules
                                    .Where(rs => rs.strGroupGUID == groupGuid)
                                    .Select(rs => rs.strScheduleGUID)
                                    .Contains(s.strScheduleGUID)
                               select s;

            // Apply search filter if provided
            var matchingScheduleGuids = new HashSet<Guid>();
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower();

                // Find all matching schedules first (both renamed and non-renamed)
                var matchingSchedules = await _dbContext.MstSchedules
                    .Where(s => s.bolIsActive && s.strScheduleName.ToLower().Contains(searchTerm))
                    .ToListAsync();

                var matchingRenames = await _dbContext.MstRenameSchedules
                    .Where(rs => rs.strGroupGUID == groupGuid && 
                           rs.strRenameScheduleName.ToLower().Contains(searchTerm))
                    .ToListAsync();

                // Add matching schedules to our set
                foreach (var schedule in matchingSchedules)
                {
                    matchingScheduleGuids.Add(schedule.strScheduleGUID);
                }

                // Add schedules from matching renames
                foreach (var rename in matchingRenames)
                {
                    matchingScheduleGuids.Add(rename.strScheduleGUID);
                }

                // Get all parent GUIDs for matching schedules
                var parentGuids = new HashSet<Guid>();
                foreach (var guid in matchingScheduleGuids.ToList())
                {
                    var currentSchedule = await _dbContext.MstSchedules.FindAsync(guid);
                    while (currentSchedule?.strParentScheduleGUID != null && currentSchedule.strParentScheduleGUID != Guid.Empty)
                    {
                        var parentGuid = currentSchedule.strParentScheduleGUID.Value; // Convert from Guid? to Guid
                        parentGuids.Add(parentGuid);
                        currentSchedule = await _dbContext.MstSchedules.FindAsync(parentGuid);
                    }
                }

                // Get all children GUIDs for matching schedules (recursively)
                var childrenGuids = new HashSet<Guid>();
                var guidsToProcess = new Queue<Guid>(matchingScheduleGuids);
                
                while (guidsToProcess.Count > 0)
                {
                    var currentGuid = guidsToProcess.Dequeue();
                    var children = await _dbContext.MstSchedules
                        .Where(s => s.strParentScheduleGUID == currentGuid && s.bolIsActive)
                        .Select(s => s.strScheduleGUID)
                        .ToListAsync();
                    
                    foreach (var childGuid in children)
                    {
                        if (childrenGuids.Add(childGuid))
                        {
                            guidsToProcess.Enqueue(childGuid);
                        }
                    }
                }

                // Combine matching, parent, and children GUIDs
                matchingScheduleGuids.UnionWith(parentGuids);
                matchingScheduleGuids.UnionWith(childrenGuids);

                // Filter queries based on matching GUIDs
                renameQuery = renameQuery.Where(x => matchingScheduleGuids.Contains(x.Schedule.strScheduleGUID));
                schedulesQuery = schedulesQuery.Where(s => matchingScheduleGuids.Contains(s.strScheduleGUID));
            }

            // Get total count
            var renameCount = await renameQuery.CountAsync();
            var scheduleCount = await schedulesQuery.CountAsync();
            var totalCount = renameCount + scheduleCount;

            // Get data
            var renameData = await renameQuery.ToListAsync();
            var scheduleData = await schedulesQuery.ToListAsync();

            // Create a dictionary to store all DTOs for quick access during tree building
            var dtoLookup = new Dictionary<Guid, RenameScheduleResponseDto>();

            // Map renamed schedules to DTOs
            foreach (var item in renameData)
            {
                var dto = new RenameScheduleResponseDto
                {
                    strRenameScheduleGUID = item.RenameSchedule.strRenameScheduleGUID,
                    strRenameScheduleName = item.RenameSchedule.strRenameScheduleName,
                    strScheduleGUID = item.Schedule.strScheduleGUID,
                    strScheduleName = item.RenameSchedule.strRenameScheduleName, // Use renamed name
                    strScheduleCode = item.Schedule.strScheduleCode,
                    strRefNo = item.Schedule.strRefNo,
                    strParentScheduleGUID = item.Schedule.strParentScheduleGUID,
                    bolIsEditable = item.Schedule.bolIsEditable,
                    dteCreatedOn = item.RenameSchedule.dteCreatedOn,
                    strCreatedByGUID = item.RenameSchedule.strCreatedByGUID,
                    strCreatedByName = item.CreatedBy?.strName ?? "Unknown",
                    dteModifiedOn = item.RenameSchedule.dteModifiedOn,
                    strModifiedByGUID = item.RenameSchedule.strModifiedByGUID,
                    strModifiedByName = item.ModifiedBy?.strName ?? "Unknown",
                    Children = new List<RenameScheduleResponseDto>()
                };

                dtoLookup[item.Schedule.strScheduleGUID] = dto;
            }

            // Map remaining schedules to DTOs
            foreach (var schedule in scheduleData)
            {
                var dto = await MapToScheduleResponseDto(schedule, groupGuid);
                dtoLookup[schedule.strScheduleGUID] = dto;
            }

            // Build the tree structure
            var rootItems = new List<RenameScheduleResponseDto>();
            foreach (var dto in dtoLookup.Values)
            {
                if (dto.strParentScheduleGUID == null || dto.strParentScheduleGUID == Guid.Empty)
                {
                    // This is a root item
                    rootItems.Add(dto);
                }
                else if (dtoLookup.TryGetValue(dto.strParentScheduleGUID.Value, out var parentDto))
                {
                    // Add this item as a child of its parent
                    parentDto.Children.Add(dto);
                }
                else
                {
                    // Parent not found, add as root
                    rootItems.Add(dto);
                }
            }

            // Sort items by strRefNo - no pagination
            var sortedRootItems = rootItems
                .OrderBy(r => r.strRefNo ?? string.Empty) // Sort by strRefNo, handle nulls
                .ToList();

            return new PagedResponse<RenameScheduleResponseDto>
            {
                Items = sortedRootItems,
                TotalCount = totalCount,
                // Provide default values for the pagination properties to maintain API compatibility
                PageNumber = 1,
                PageSize = totalCount,
                TotalPages = 1
            };
        }

        public async Task<RenameScheduleResponseDto> GetByIdAsync(string guid)
        {
            _logger.LogInformation($"Getting Chart of Account by GUID: {guid}");

            var renameScheduleGuid = Guid.Parse(guid);
            var renameSchedule = await _dbContext.MstRenameSchedules.FindAsync(renameScheduleGuid);
            
            if (renameSchedule == null)
                throw new BusinessException($"Chart of Account with GUID '{guid}' not found");

            return await MapToResponseDto(renameSchedule);
        }

        public async Task<RenameScheduleResponseDto> UpdateAsync(string guid, RenameScheduleUpdateDto updateDto, string updatedByGUID, string groupGUID)
        {
            _logger.LogInformation($"Updating Chart of Account with GUID: {guid}");

            // Validate input
            if (string.IsNullOrWhiteSpace(updateDto.strRenameScheduleName))
                throw new BusinessException("Chart of Account name is required");

            // Verify the schedule exists
            var schedule = await _dbContext.MstSchedules.FindAsync(updateDto.strScheduleGUID);
            if (schedule == null)
                throw new BusinessException($"Schedule with GUID '{updateDto.strScheduleGUID}' not found");

            var renameScheduleGuid = Guid.Parse(guid);
            var renameSchedule = await _dbContext.MstRenameSchedules.FindAsync(renameScheduleGuid);
            
            if (renameSchedule == null)
                throw new BusinessException($"Chart of Account with GUID '{guid}' not found");

            // Check if this belongs to the user's group
            var groupGuid = Guid.Parse(groupGUID);
            if (renameSchedule.strGroupGUID != groupGuid)
                throw new BusinessException("You don't have permission to update this Chart of Account");

            // Create execution strategy for the transaction
            var strategy = _dbContext.Database.CreateExecutionStrategy();
            
            try
            {
                // Execute all database operations within the strategy
                return await strategy.ExecuteAsync(async () =>
                {
                    // Start transaction
                    using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        var oldValue = JsonSerializer.Serialize(new
                        {
                            name = renameSchedule.strRenameScheduleName,
                            scheduleGuid = renameSchedule.strScheduleGUID,
                            scheduleName = schedule.strScheduleName
                        });

                        // Update the entity
                        renameSchedule.strRenameScheduleName = updateDto.strRenameScheduleName;
                        renameSchedule.strScheduleGUID = updateDto.strScheduleGUID;
                        renameSchedule.dteModifiedOn = DateTime.UtcNow;
                        renameSchedule.strModifiedByGUID = updatedByGUID;

                        // Create activity log
                        var (ipAddress, userAgent) = GetRequestDetails();
                        var activityLog = new MstUserActivityLog
                        {
                            ActivityLogGUID = Guid.NewGuid(),
                            UserGUID = Guid.Parse(updatedByGUID),
                            GroupGUID = Guid.Parse(groupGUID),
                            ActivityType = "UPDATE_CHART_OF_ACCOUNT",
                            Details = $"Updated Chart of Account name from '{renameSchedule.strRenameScheduleName}' to '{updateDto.strRenameScheduleName}'",
                            EntityType = "ChartOfAccount",
                            EntityGUID = renameSchedule.strRenameScheduleGUID,
                            IPAddress = ipAddress,
                            UserAgent = userAgent,
                            OldValue = oldValue,
                            NewValue = JsonSerializer.Serialize(new
                            {
                                name = updateDto.strRenameScheduleName,
                                scheduleGuid = updateDto.strScheduleGUID,
                                scheduleName = schedule.strScheduleName
                            }),
                            CreatedByGUID = Guid.Parse(updatedByGUID),
                            CreatedOn = DateTime.UtcNow,
                            ActivityTime = DateTime.UtcNow
                        };

                        await _dbContext.MstUserActivityLogs.AddAsync(activityLog);
                        await _dbContext.SaveChangesAsync();

                        await transaction.CommitAsync();
                        return await MapToResponseDto(renameSchedule);
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating Chart of Account");
                throw;
            }
        }

        public async Task<bool> DeleteAsync(string guid, string userGuid)
        {
            _logger.LogInformation($"Deleting Chart of Account with GUID: {guid}");

            var renameScheduleGuid = Guid.Parse(guid);
            var renameSchedule = await _dbContext.MstRenameSchedules.FindAsync(renameScheduleGuid);
            
            if (renameSchedule == null)
                throw new BusinessException($"Chart of Account with GUID '{guid}' not found");

            // Get the schedule first
            var schedule = await _dbContext.MstSchedules
                .FirstOrDefaultAsync(s => s.strScheduleGUID == renameSchedule.strScheduleGUID);

            if (schedule == null)
                throw new BusinessException("Associated schedule not found");

            // Check if any child schedules have been renamed for this group
            var childSchedules = await _dbContext.MstSchedules
                .Where(s => s.strParentScheduleGUID == schedule.strScheduleGUID)
                .ToListAsync();

            if (childSchedules.Any())
            {
                // Check if any of these children have rename entries for this group
                var childrenWithRenames = await _dbContext.MstRenameSchedules
                    .Where(rs => childSchedules.Select(cs => cs.strScheduleGUID).Contains(rs.strScheduleGUID)
                             && rs.strGroupGUID == renameSchedule.strGroupGUID)
                    .ToListAsync();

                if (childrenWithRenames.Any())
                {
                    // Get child schedule details for better error message
                    var childrenDetails = await Task.WhenAll(childrenWithRenames.Select(async cr => {
                        var childSchedule = await _dbContext.MstSchedules
                            .FirstOrDefaultAsync(s => s.strScheduleGUID == cr.strScheduleGUID);
                        return $"{childSchedule?.strScheduleCode} - {cr.strRenameScheduleName}";
                    }));

                    var childrenNames = string.Join(", ", childrenDetails);
                    throw new BusinessException(
                        $"Cannot delete this rename entry because the following child schedules are renamed: {childrenNames}. " +
                        "Please delete the child schedule rename entries first.");
                }
            }

            // Create execution strategy for the transaction
            var strategy = _dbContext.Database.CreateExecutionStrategy();
            
            try
            {
                // Execute all database operations within the strategy
                return await strategy.ExecuteAsync(async () =>
                {
                    // Start transaction
                    using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        // Create activity log
                        var (ipAddress, userAgent) = GetRequestDetails();
                        var activityLog = new MstUserActivityLog
                        {
                            ActivityLogGUID = Guid.NewGuid(),
                            UserGUID = Guid.Parse(userGuid),
                            GroupGUID = renameSchedule.strGroupGUID,
                            ActivityType = "DELETE_CHART_OF_ACCOUNT",
                            Details = $"Deleted Chart of Account '{renameSchedule.strRenameScheduleName}' for schedule '{schedule.strScheduleName}'",
                            EntityType = "ChartOfAccount",
                            EntityGUID = renameSchedule.strRenameScheduleGUID,
                            IPAddress = ipAddress,
                            UserAgent = userAgent,
                            OldValue = JsonSerializer.Serialize(new
                            {
                                name = renameSchedule.strRenameScheduleName,
                                scheduleGuid = renameSchedule.strScheduleGUID,
                                scheduleName = schedule.strScheduleName
                            }),
                            CreatedByGUID = Guid.Parse(userGuid),
                            CreatedOn = DateTime.UtcNow,
                            ActivityTime = DateTime.UtcNow
                        };

                        await _dbContext.MstUserActivityLogs.AddAsync(activityLog);
                        _dbContext.MstRenameSchedules.Remove(renameSchedule);
                        await _dbContext.SaveChangesAsync();

                        await transaction.CommitAsync();
                        return true;
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting Chart of Account");
                throw;
            }
        }

        public async Task<RenameScheduleResponseDto> UpsertAsync(RenameScheduleUpsertDto upsertDto, string userGUID, string groupGUID)
        {
            _logger.LogInformation($"Upserting Chart of Account with name: {upsertDto.strRenameScheduleName}");

            // Validate input
            if (string.IsNullOrWhiteSpace(upsertDto.strRenameScheduleName))
                throw new BusinessException("Chart of Account name is required");

            // Parse groupGUID from token
            var parsedGroupGUID = Guid.Parse(groupGUID);

            // Verify the schedule exists and is editable
            var schedule = await _dbContext.MstSchedules
                .Where(s => s.strScheduleGUID == upsertDto.strScheduleGUID)
                .FirstOrDefaultAsync();

            if (schedule == null)
                throw new BusinessException($"Schedule with GUID '{upsertDto.strScheduleGUID}' not found");

            // Check parent schedule validation
            if (schedule.strParentScheduleGUID != null && schedule.strParentScheduleGUID != Guid.Empty)
            {
                // First get the parent schedule to check its editable status
                var parentSchedule = await _dbContext.MstSchedules
                    .Where(s => s.strScheduleGUID == schedule.strParentScheduleGUID)
                    .FirstOrDefaultAsync();

                if (parentSchedule == null)
                    throw new BusinessException("Parent schedule not found");

                // If parent is editable, we need to check if it's renamed
                if (parentSchedule.bolIsEditable)
                {
                    // Check if parent schedule is renamed for this group
                    var parentRenamed = await _dbContext.MstRenameSchedules
                        .AnyAsync(rs => rs.strScheduleGUID == schedule.strParentScheduleGUID 
                                      && rs.strGroupGUID == parsedGroupGUID);

                    if (!parentRenamed)
                    {
                        var parentInfo = $"{parentSchedule.strScheduleCode} - {parentSchedule.strScheduleName}";
                        throw new BusinessException($"Parent schedule ({parentInfo}) must be renamed first before renaming this schedule");
                    }
                }
                // If parent is not editable (bolIsEditable = false), we don't need to check for rename entries
            }

            if (!schedule.bolIsEditable)
                throw new BusinessException($"Schedule with GUID '{upsertDto.strScheduleGUID}' is not editable");

            // Check for duplicate rename schedule names under the same parent within the same group
            var scheduleWithSameParent = await _dbContext.MstSchedules
                .Where(s => s.strScheduleGUID != upsertDto.strScheduleGUID && 
                           s.strParentScheduleGUID == schedule.strParentScheduleGUID)
                .ToListAsync();

            if (scheduleWithSameParent.Any())
            {
                // Get all rename entries for schedules under the same parent in the same group
                var existingRenames = await _dbContext.MstRenameSchedules
                    .Where(rs => scheduleWithSameParent.Select(s => s.strScheduleGUID).Contains(rs.strScheduleGUID) &&
                                rs.strGroupGUID == parsedGroupGUID &&
                                rs.strRenameScheduleName.ToLower() == upsertDto.strRenameScheduleName.ToLower() &&
                                (upsertDto.strRenameScheduleGUID == Guid.Empty || rs.strRenameScheduleGUID != upsertDto.strRenameScheduleGUID))
                    .FirstOrDefaultAsync();

                if (existingRenames != null)
                {
                    var duplicateSchedule = await _dbContext.MstSchedules
                        .FirstOrDefaultAsync(s => s.strScheduleGUID == existingRenames.strScheduleGUID);
                    throw new BusinessException(
                        $"A schedule with the name '{upsertDto.strRenameScheduleName}' already exists under the same parent " +
                        $"(Original Schedule: {duplicateSchedule?.strScheduleCode})");
                }
            }

            // First, check if there's an existing entry for this schedule and group
            var existingRenameSchedule = await _dbContext.MstRenameSchedules
                .FirstOrDefaultAsync(rs => rs.strScheduleGUID == upsertDto.strScheduleGUID && 
                                          rs.strGroupGUID == parsedGroupGUID);
            
            // If we're updating with a non-empty GUID
            if (upsertDto.strRenameScheduleGUID != Guid.Empty)
            {
                // Check if the provided GUID exists
                var specificRenameSchedule = await _dbContext.MstRenameSchedules
                    .FindAsync(upsertDto.strRenameScheduleGUID);

                if (specificRenameSchedule != null)
                {
                    // Check if this belongs to the user's group
                    if (specificRenameSchedule.strGroupGUID != parsedGroupGUID)
                        throw new BusinessException("You don't have permission to update this Chart of Account");

                    var updateByGuidStrategy = _dbContext.Database.CreateExecutionStrategy();
                    return await updateByGuidStrategy.ExecuteAsync(async () =>
                    {
                        using var transaction = await _dbContext.Database.BeginTransactionAsync();
                        try
                        {
                            var oldValue = JsonSerializer.Serialize(new
                            {
                                name = specificRenameSchedule.strRenameScheduleName,
                                scheduleGuid = specificRenameSchedule.strScheduleGUID,
                                scheduleName = schedule.strScheduleName
                            });

                            // Update the entity
                            specificRenameSchedule.strRenameScheduleName = upsertDto.strRenameScheduleName;
                            specificRenameSchedule.strScheduleGUID = upsertDto.strScheduleGUID;
                            specificRenameSchedule.dteModifiedOn = DateTime.UtcNow;
                            specificRenameSchedule.strModifiedByGUID = userGUID;

                            // Create activity log
                            var (ipAddress, userAgent) = GetRequestDetails();
                            var activityLog = new MstUserActivityLog
                            {
                                ActivityLogGUID = Guid.NewGuid(),
                                UserGUID = Guid.Parse(userGUID),
                                GroupGUID = parsedGroupGUID,
                                ActivityType = "UPDATE_CHART_OF_ACCOUNT",
                                Details = $"Updated Chart of Account name from '{specificRenameSchedule.strRenameScheduleName}' to '{upsertDto.strRenameScheduleName}'",
                                EntityType = "ChartOfAccount",
                                EntityGUID = specificRenameSchedule.strRenameScheduleGUID,
                                IPAddress = ipAddress,
                                UserAgent = userAgent,
                                OldValue = oldValue,
                                NewValue = JsonSerializer.Serialize(new
                                {
                                    name = upsertDto.strRenameScheduleName,
                                    scheduleGuid = upsertDto.strScheduleGUID,
                                    scheduleName = schedule.strScheduleName
                                }),
                                CreatedByGUID = Guid.Parse(userGUID),
                                CreatedOn = DateTime.UtcNow,
                                ActivityTime = DateTime.UtcNow
                            };

                            await _dbContext.MstUserActivityLogs.AddAsync(activityLog);
                            await _dbContext.SaveChangesAsync();

                            await transaction.CommitAsync();
                            return await MapToResponseDto(specificRenameSchedule);
                        }
                        catch (Exception ex)
                        {
                            await transaction.RollbackAsync();
                            _logger.LogError(ex, "Error updating Chart of Account during upsert by GUID");
                            throw;
                        }
                    });
                }
            }
            
            // If we found an existing entry for this schedule and group, update it
            if (existingRenameSchedule != null)
            {
                var updateStrategy = _dbContext.Database.CreateExecutionStrategy();
                return await updateStrategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _dbContext.Database.BeginTransactionAsync();
                    try
                    {
                        var oldValue = JsonSerializer.Serialize(new
                        {
                            name = existingRenameSchedule.strRenameScheduleName,
                            scheduleGuid = existingRenameSchedule.strScheduleGUID,
                            scheduleName = schedule.strScheduleName
                        });

                        // Update the entity
                        existingRenameSchedule.strRenameScheduleName = upsertDto.strRenameScheduleName;
                        existingRenameSchedule.dteModifiedOn = DateTime.UtcNow;
                        existingRenameSchedule.strModifiedByGUID = userGUID;

                        // Create activity log
                        var (ipAddress, userAgent) = GetRequestDetails();
                        var activityLog = new MstUserActivityLog
                        {
                            ActivityLogGUID = Guid.NewGuid(),
                            UserGUID = Guid.Parse(userGUID),
                            GroupGUID = parsedGroupGUID,
                            ActivityType = "UPDATE_CHART_OF_ACCOUNT",
                            Details = $"Updated Chart of Account name from '{existingRenameSchedule.strRenameScheduleName}' to '{upsertDto.strRenameScheduleName}'",
                            EntityType = "ChartOfAccount",
                            EntityGUID = existingRenameSchedule.strRenameScheduleGUID,
                            IPAddress = ipAddress,
                            UserAgent = userAgent,
                            OldValue = oldValue,
                            NewValue = JsonSerializer.Serialize(new
                            {
                                name = upsertDto.strRenameScheduleName,
                                scheduleGuid = existingRenameSchedule.strScheduleGUID,
                                scheduleName = schedule.strScheduleName
                            }),
                            CreatedByGUID = Guid.Parse(userGUID),
                            CreatedOn = DateTime.UtcNow,
                            ActivityTime = DateTime.UtcNow
                        };

                        await _dbContext.MstUserActivityLogs.AddAsync(activityLog);
                        await _dbContext.SaveChangesAsync();

                        await transaction.CommitAsync();
                        return await MapToResponseDto(existingRenameSchedule);
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, "Error updating Chart of Account during upsert");
                        throw;
                    }
                });
            }

            // Create execution strategy for the transaction
            var strategy = _dbContext.Database.CreateExecutionStrategy();
            
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    // Create new entity
                    var renameSchedule = new MstRenameSchedule
                    {
                        strRenameScheduleName = upsertDto.strRenameScheduleName,
                        strScheduleGUID = upsertDto.strScheduleGUID,
                        strGroupGUID = parsedGroupGUID,
                        dteCreatedOn = DateTime.UtcNow,
                        strCreatedByGUID = userGUID
                    };

                    await _dbContext.MstRenameSchedules.AddAsync(renameSchedule);
                    await _dbContext.SaveChangesAsync();

                    // Create activity log
                    var (ipAddress, userAgent) = GetRequestDetails();
                    var activityLog = new MstUserActivityLog
                    {
                        ActivityLogGUID = Guid.NewGuid(),
                        UserGUID = Guid.Parse(userGUID),
                        GroupGUID = parsedGroupGUID,
                        ActivityType = "CREATE_CHART_OF_ACCOUNT",
                        Details = $"Created new Chart of Account '{upsertDto.strRenameScheduleName}' for schedule '{schedule.strScheduleName}'",
                        EntityType = "ChartOfAccount",
                        EntityGUID = renameSchedule.strRenameScheduleGUID,
                        IPAddress = ipAddress,
                        UserAgent = userAgent,
                        NewValue = JsonSerializer.Serialize(new
                        {
                            name = renameSchedule.strRenameScheduleName,
                            scheduleGuid = renameSchedule.strScheduleGUID,
                            scheduleName = schedule.strScheduleName
                        }),
                        CreatedByGUID = Guid.Parse(userGUID),
                        CreatedOn = DateTime.UtcNow,
                        ActivityTime = DateTime.UtcNow
                    };

                    await _dbContext.MstUserActivityLogs.AddAsync(activityLog);
                    await _dbContext.SaveChangesAsync();

                    await transaction.CommitAsync();
                    return await MapToResponseDto(renameSchedule);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error creating Chart of Account during upsert");
                    throw;
                }
            });
        }

        private async Task<RenameScheduleResponseDto> MapToResponseDto(MstRenameSchedule renameSchedule)
        {
            var schedule = await _dbContext.MstSchedules.FindAsync(renameSchedule.strScheduleGUID);
            var scheduleName = schedule?.strScheduleName ?? "Unknown Schedule";

            string createdByName = "Unknown";
            if (!string.IsNullOrEmpty(renameSchedule.strCreatedByGUID))
            {
                var createdBy = await _dbContext.MstUsers.FindAsync(Guid.Parse(renameSchedule.strCreatedByGUID));
                createdByName = createdBy?.strName ?? "Unknown";
            }

            string modifiedByName = "Unknown";
            if (!string.IsNullOrEmpty(renameSchedule.strModifiedByGUID))
            {
                var modifiedBy = await _dbContext.MstUsers.FindAsync(Guid.Parse(renameSchedule.strModifiedByGUID));
                modifiedByName = modifiedBy?.strName ?? "Unknown";
            }

            return new RenameScheduleResponseDto
            {
                strRenameScheduleGUID = renameSchedule.strRenameScheduleGUID,
                strRenameScheduleName = renameSchedule.strRenameScheduleName,
                strScheduleGUID = renameSchedule.strScheduleGUID,
                strScheduleName = renameSchedule.strRenameScheduleName, // Use renamed schedule name instead of original
                strScheduleCode = schedule?.strScheduleCode ?? string.Empty, // Added for display purposes
                strRefNo = schedule?.strRefNo, // Added for sorting purposes
                strParentScheduleGUID = schedule?.strParentScheduleGUID, // Added for tree structure
                bolIsEditable = schedule?.bolIsEditable ?? false, // Added bolIsEditable from mstSchedule
                dteCreatedOn = renameSchedule.dteCreatedOn,
                strCreatedByGUID = renameSchedule.strCreatedByGUID,
                strCreatedByName = createdByName,
                dteModifiedOn = renameSchedule.dteModifiedOn,
                strModifiedByGUID = renameSchedule.strModifiedByGUID,
                strModifiedByName = modifiedByName,
                Children = new List<RenameScheduleResponseDto>() // Initialize empty children list
            };
        }

        private (string? ipAddress, string? userAgent) GetRequestDetails()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return (null, null);

            string? ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            string? userAgent = httpContext.Request.Headers["User-Agent"].ToString();
            
            return (ipAddress, userAgent);
        }

        private Task<RenameScheduleResponseDto> MapToScheduleResponseDto(MstSchedule schedule, Guid groupGuid)
        {
            var responseDto = new RenameScheduleResponseDto
            {
                strRenameScheduleGUID = Guid.Empty, // No rename entry exists
                strRenameScheduleName = string.Empty, // No rename entry exists
                strScheduleGUID = schedule.strScheduleGUID,
                strScheduleName = schedule.strScheduleName, // Use original schedule name
                strScheduleCode = schedule.strScheduleCode, // Added for display purposes
                strRefNo = schedule.strRefNo, // Added for sorting purposes
                strParentScheduleGUID = schedule.strParentScheduleGUID, // Added for tree structure
                bolIsEditable = schedule.bolIsEditable, // Added bolIsEditable from mstSchedule
                Children = new List<RenameScheduleResponseDto>() // Initialize empty children list
            };
            
            return Task.FromResult(responseDto);
        }
    }
}