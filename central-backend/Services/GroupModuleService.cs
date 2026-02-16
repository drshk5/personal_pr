using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.GroupModule;
using AuditSoftware.DTOs.UserInfo;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using AuditSoftware.Helpers;
using System.Text.RegularExpressions;

namespace AuditSoftware.Services
{
    public class GroupModuleService : ServiceBase, IGroupModuleService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<GroupModuleService> _logger;

        public GroupModuleService(
            AppDbContext context, 
            IMapper mapper, 
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<GroupModuleService> logger)
        {
            _context = context;
            _mapper = mapper;
            _configuration = configuration;
            _environment = environment;
            _logger = logger;
        }

        public async Task<GroupModuleResponseDto> CreateAsync(GroupModuleCreateDto createDto, string createdByGUID)
        {
            // Validate inputs
            if (string.IsNullOrEmpty(createDto.strGroupGUID))
                throw new BusinessException("Group GUID is required");
            
            if (string.IsNullOrEmpty(createDto.strModuleGUID))
                throw new BusinessException("Module GUID is required");

            // Check if the group exists
            var group = await _context.MstGroups.FindAsync(Guid.Parse(createDto.strGroupGUID));
            if (group == null)
                throw new BusinessException($"Group with GUID {createDto.strGroupGUID} does not exist");

            // Check if the module exists and get its SQL file path
            var module = await _context.MstModules
                .FirstOrDefaultAsync(m => m.strModuleGUID == Guid.Parse(createDto.strModuleGUID));
            if (module == null)
                throw new BusinessException($"Module with GUID {createDto.strModuleGUID} does not exist");

            // Check for duplicate group+module combination
            var exists = await _context.MstGroupModules
                .AnyAsync(gm => gm.strGroupGUID == Guid.Parse(createDto.strGroupGUID) && 
                               gm.strModuleGUID == Guid.Parse(createDto.strModuleGUID));
            
            if (exists)
                throw new BusinessException($"This module is already assigned to the selected group");
                
            MstGroupModule? groupModule = null;

            // Use execution strategy for reliable transaction handling
            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                // Begin transaction for the entire operation
                using var transaction = await _context.Database.BeginTransactionAsync();
                
                try
                {
                    // Create the new entity with all required properties
                    Console.WriteLine($"Creating new GroupModule entity");
                    
                    // Use the constructor to ensure all default values are properly initialized
                    groupModule = new MstGroupModule();
                    
                    // Then set the specific properties
                    groupModule.strGroupGUID = Guid.Parse(createDto.strGroupGUID);
                    groupModule.strModuleGUID = Guid.Parse(createDto.strModuleGUID);
                    groupModule.intVersion = createDto.intVersion ?? 1;
                    groupModule.strCreatedByGUID = Guid.Parse(createdByGUID);
                    groupModule.dtCreatedOn = CurrentDateTime;
                    
                    // Generate database name and connection string right away
                    var moduleDatabaseName = $"{module.strName}_{createDto.strGroupGUID.Replace("-", "")}";
                    groupModule.strConnectionString = GenerateConnectionString(moduleDatabaseName);
                    
                    Console.WriteLine($"GroupModule entity created in memory with properties:");
                    Console.WriteLine($"  - strGroupModuleGUID: {groupModule.strGroupModuleGUID}");
                    Console.WriteLine($"  - strGroupGUID: {groupModule.strGroupGUID}");
                    Console.WriteLine($"  - strModuleGUID: {groupModule.strModuleGUID}");
                    // SECURITY FIX: Don't log connection string
                    Console.WriteLine($"  - strCreatedByGUID: {groupModule.strCreatedByGUID}");
                    
                    Console.WriteLine($"GroupModule entity created in memory with properties:");
                    Console.WriteLine($"  - strGroupModuleGUID: {groupModule.strGroupModuleGUID}");
                    Console.WriteLine($"  - strGroupGUID: {groupModule.strGroupGUID}");
                    Console.WriteLine($"  - strModuleGUID: {groupModule.strModuleGUID}");
                    Console.WriteLine($"  - strCreatedByGUID: {groupModule.strCreatedByGUID}");

                    // The database name and connection string are already generated above
                    Console.WriteLine($"Using previously generated connection string");
                    
                    // Save the GroupModule entity first
                    try {
                        Console.WriteLine("Adding GroupModule entity to context");
                        _context.MstGroupModules.Add(groupModule);
                        Console.WriteLine("Saving GroupModule entity to database");
                        await _context.SaveChangesAsync();
                        Console.WriteLine("GroupModule entity saved successfully");
                    } catch (Exception ex) {
                        Console.WriteLine($"Error saving GroupModule entity: {ex.Message}");
                        if (ex.InnerException != null) {
                            Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                        }
                        throw;
                    }
                    
                    // Add a default Admin role for this module-group combination
                    // This should be done before database creation and initialization
                    Console.WriteLine("Adding default Admin role for module-group combination");
                    
                    // Find the system-created organization for this group to link with the role
                    var organizationForRole = await _context.MstOrganizations
                        .FirstOrDefaultAsync(o => o.strGroupGUID == groupModule.strGroupGUID && o.bolSystemCreated == true);
                    
                    if (organizationForRole == null)
                    {
                        throw new BusinessException($"System-created organization not found for group {groupModule.strGroupGUID}");
                    }
                    
                    await AddDefaultUserRolesForModuleAsync(groupModule.strGroupGUID, groupModule.strModuleGUID, organizationForRole.strOrganizationGUID, createdByGUID);

                    // Find the system-created user, organization, and year for this group
                    Console.WriteLine($"Finding system-created user for group {createDto.strGroupGUID}");
                    
                    try
                    {
                        var systemUser = await _context.MstUsers
                            .FirstOrDefaultAsync(u => u.strGroupGUID == GuidHelper.ToGuid(createDto.strGroupGUID) && u.bolSystemCreated == true);
                        
                        if (systemUser != null)
                        {
                            Console.WriteLine($"Found system-created user: {systemUser.strUserGUID}");
                            
                            // Find the system-created organization and year
                            var organization = await _context.MstOrganizations
                                .FirstOrDefaultAsync(o => o.strGroupGUID == GuidHelper.ToGuid(createDto.strGroupGUID) && o.bolSystemCreated == true);
                            
                            var year = await _context.MstYears
                                .FirstOrDefaultAsync(y => y.strGroupGUID.ToString() == createDto.strGroupGUID && y.bolSystemCreated == true);
                            
                            // Update the system user's Last Module GUID with the current module
                            Console.WriteLine($"Updating system user's last module GUID to {createDto.strModuleGUID}");
                            systemUser.strLastModuleGUID = GuidHelper.ToGuid(createDto.strModuleGUID);
                            await _context.SaveChangesAsync();
                            Console.WriteLine("System user's last module GUID updated successfully");
                            
                            // Check if an entry already exists for this user and module
                            var existingUserInfo = await _context.MstUserInfos
                                .FirstOrDefaultAsync(ui => ui.strUserGUID == systemUser.strUserGUID && 
                                                         ui.strModuleGUID == GuidHelper.ToGuid(createDto.strModuleGUID));
                            
                            if (existingUserInfo == null)
                            {
                                // Create an entry in mstUserInfo
                                var userInfo = new MstUserInfo
                                {
                                    strUserInfoGUID = Guid.NewGuid(),
                                    strUserGUID = systemUser.strUserGUID,
                                    strModuleGUID = GuidHelper.ToGuid(createDto.strModuleGUID),
                                    strLastOrganizationGUID = organization?.strOrganizationGUID,
                                    strLastYearGUID = year?.strYearGUID,
                                    strCreatedByGUID = GuidHelper.ToGuid(createdByGUID),
                                    dtCreatedOn = CurrentDateTime
                                };
                                
                                Console.WriteLine($"Creating UserInfo entry for system user with module {createDto.strModuleGUID}");
                                _context.MstUserInfos.Add(userInfo);
                                await _context.SaveChangesAsync();
                                Console.WriteLine("UserInfo entry created successfully");
                            }
                            else
                            {
                                Console.WriteLine($"UserInfo entry for this user and module already exists, skipping creation");
                            }
                        }
                        else
                        {
                            Console.WriteLine($"Warning: No system-created user found for group {createDto.strGroupGUID}");
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log the error but don't fail the entire group module creation process
                        Console.WriteLine($"Error creating UserInfo entry: {ex.Message}");
                        if (ex.InnerException != null)
                        {
                            Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                        }
                        // Continue with the rest of the process
                    }

                    // Create the module directory in uploads/documents folder
                    try
                    {
                        string baseUploadPath = Path.Combine(_environment.ContentRootPath, "Uploads", "documents");
                        
                        // Ensure the base uploads/documents folder exists
                        if (!Directory.Exists(baseUploadPath))
                        {
                            Directory.CreateDirectory(baseUploadPath);
                            _logger.LogInformation($"Created base upload directory: {baseUploadPath}");
                        }
                        
                        // Create group folder if it doesn't exist
                        string groupFolderPath = Path.Combine(baseUploadPath, groupModule.strGroupGUID.ToString());
                        if (!Directory.Exists(groupFolderPath))
                        {
                            Directory.CreateDirectory(groupFolderPath);
                            _logger.LogInformation($"Created group directory: {groupFolderPath}");
                        }
                        
                        // Create module folder inside the group folder
                        string moduleFolderPath = Path.Combine(groupFolderPath, groupModule.strModuleGUID.ToString());
                        if (!Directory.Exists(moduleFolderPath))
                        {
                            Directory.CreateDirectory(moduleFolderPath);
                            _logger.LogInformation($"Created module directory: {moduleFolderPath}");
                        }
                        
                        // Find the system-created organization for this group
                        var organization = await _context.MstOrganizations
                            .FirstOrDefaultAsync(o => o.strGroupGUID == groupModule.strGroupGUID && o.bolSystemCreated);
                            
                        if (organization != null)
                        {
                            _logger.LogInformation($"Found system-created organization {organization.strOrganizationGUID} for module {groupModule.strModuleGUID}");
                            
                            try
                            {
                                // Create organization folder inside the module folder
                                string orgFolderPath = Path.Combine(moduleFolderPath, organization.strOrganizationGUID.ToString());
                                if (!Directory.Exists(orgFolderPath))
                                {
                                    Directory.CreateDirectory(orgFolderPath);
                                    _logger.LogInformation($"Created organization directory inside module: {orgFolderPath}");
                                }
                                
                                // Find the system-created year for this organization
                                var year = await _context.MstYears
                                    .FirstOrDefaultAsync(y => y.strOrganizationGUID == organization.strOrganizationGUID && y.bolSystemCreated);
                                
                                if (year != null)
                                {
                                    _logger.LogInformation($"Found system-created year {year.strYearGUID} for organization {organization.strOrganizationGUID}");
                                    
                                    // Create year folder inside the organization folder
                                    string yearFolderPath = Path.Combine(orgFolderPath, year.strYearGUID.ToString());
                                    if (!Directory.Exists(yearFolderPath))
                                    {
                                        Directory.CreateDirectory(yearFolderPath);
                                        _logger.LogInformation($"Created year directory inside organization: {yearFolderPath}");
                                    }
                                }
                                else
                                {
                                    _logger.LogWarning($"No system-created year found for organization {organization.strOrganizationGUID}");
                                }
                            }
                            catch (Exception orgEx)
                            {
                                _logger.LogError(orgEx, $"Error creating folder structure for organization {organization.strOrganizationGUID}: {orgEx.Message}");
                            }
                        }
                        else
                        {
                            _logger.LogWarning($"No system-created organization found for group {groupModule.strGroupGUID}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error creating module directory: {ex.Message}");
                        // We don't want to fail the group-module creation if directory creation fails,
                        // just log the error and continue
                    }
                    
                    // Create the database
                    var databaseName = $"{module.strName}_{createDto.strGroupGUID.Replace("-", "")}";
                    await CreateDatabaseAsync(databaseName);
                    
                    // Get all organizations for this group
                    var organizations = await GetOrganizationsByGroupAsync(createDto.strGroupGUID.ToString());
                    
                    // Initialize database with SQL script for each organization if SQL file exists
                    if (!string.IsNullOrEmpty(module.strSQlfilePath) && organizations.Any())
                    {
                        foreach (var organization in organizations)
                        {
                            // Get the default year GUID for this organization
                            var defaultYear = await _context.MstYears
                                .FirstOrDefaultAsync(y => y.strOrganizationGUID == organization.strOrganizationGUID && y.bolSystemCreated);
                            
                            string? yearGuid = defaultYear?.strYearGUID.ToString();
                            string? countryGuid = organization.strCountryGUID?.ToString();
                            
                            await ExecuteSqlScriptForOrganizationAsync(
                                groupModule.strConnectionString, 
                                module.strSQlfilePath, 
                                organization.strOrganizationGUID.ToString(),
                                createDto.strGroupGUID.ToString(),
                                yearGuid,
                                countryGuid);
                        }
                    }
                    else if (!string.IsNullOrEmpty(module.strSQlfilePath))
                    {
                        // If no organizations found, still execute the script once with a default schema
                        Console.WriteLine("No organizations found for group. Creating default schema.");
                        await ExecuteSqlScriptAsync(groupModule.strConnectionString, module.strSQlfilePath);
                    }
                    
                    // Update the GroupModule with the connection string
                    Console.WriteLine("Saving final GroupModule entity state with connection string");
                    await _context.SaveChangesAsync();
                    
                    // Commit the transaction if everything succeeded
                    Console.WriteLine("Committing transaction");
                    await transaction.CommitAsync();
                    Console.WriteLine("Transaction committed successfully");
                }
                catch (DbUpdateException dbEx)
                {
                    // Rollback the transaction if anything fails
                    await transaction.RollbackAsync();
                    
                    // Log detailed information about the database exception
                    Console.WriteLine($"Database error in GroupModule creation: {dbEx.Message}");
                    if (dbEx.InnerException != null)
                    {
                        Console.WriteLine($"Inner exception: {dbEx.InnerException.Message}");
                        Console.WriteLine($"Inner exception stack trace: {dbEx.InnerException.StackTrace}");
                    }
                    
                    // Include inner exception details in the error message
                    string innerMessage = dbEx.InnerException != null ? dbEx.InnerException.Message : dbEx.Message;
                    throw new BusinessException($"Failed to create group module: {innerMessage}");
                }
                catch (Exception ex)
                {
                    // Rollback the transaction if anything fails
                    await transaction.RollbackAsync();
                    
                    Console.WriteLine($"Error in GroupModule creation transaction: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                        Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                    }
                    
                    throw new BusinessException($"Failed to create group module: {ex.Message}");
                }
            });
            
            // Return the created entity with navigation properties outside the transaction
            if (groupModule == null)
                throw new BusinessException("Failed to create group module - unexpected error occurred");

            return await GetResponseDtoWithNavigationProperties(groupModule);
        }

        public async Task<GroupModuleResponseDto> UpdateAsync(string guid, GroupModuleUpdateDto updateDto, string updatedByGUID)
        {
            // Find the entity
            var groupModule = await _context.MstGroupModules.FindAsync(Guid.Parse(guid));
            if (groupModule == null)
                throw new BusinessException($"Group Module with GUID {guid} not found");
            
            // Only update version number
            if (updateDto.intVersion.HasValue)
            {
                groupModule.intVersion = updateDto.intVersion.Value;
            }
            else
            {
                groupModule.intVersion += 1; // Increment version if not specified
            }
            
            // Update audit fields
            groupModule.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            groupModule.dtUpdatedOn = CurrentDateTime;
            
            await _context.SaveChangesAsync();
            
            return await GetResponseDtoWithNavigationProperties(groupModule);
        }

        public async Task<GroupModuleResponseDto> GetByIdAsync(string guid)
        {
            var groupModule = await _context.MstGroupModules
                .Include(gm => gm.Group)
                .Include(gm => gm.Module)
                .FirstOrDefaultAsync(gm => gm.strGroupModuleGUID == Guid.Parse(guid));
            
            if (groupModule == null)
                throw new BusinessException($"Group Module with GUID {guid} not found");
            
            return await GetResponseDtoWithNavigationProperties(groupModule);
        }

        public async Task<PagedResponse<GroupModuleResponseDto>> GetAllAsync(GroupModuleFilterDto filter)
        {
            // Ensure filter and group GUID are provided
            if (filter == null || string.IsNullOrEmpty(filter.strGroupGUID))
                throw new BusinessException("Group GUID is required");
                
            var query = _context.MstGroupModules
                .Include(gm => gm.Group)
                .Include(gm => gm.Module)
                .AsQueryable();
            
            // Apply filters - GroupGUID is now required
            query = query.Where(gm => gm.strGroupGUID == Guid.Parse(filter.strGroupGUID));
            
            if (!string.IsNullOrEmpty(filter.strModuleGUID))
                query = query.Where(gm => gm.strModuleGUID == Guid.Parse(filter.strModuleGUID));
            
            if (filter.intVersion.HasValue)
                query = query.Where(gm => gm.intVersion == filter.intVersion.Value);
            
            // Get total count
            var totalItems = await query.CountAsync();
            
            // Apply sorting
            string sortField = filter.SortBy;
            
            if (string.IsNullOrEmpty(sortField))
                sortField = "dtCreatedOn";
            
            // Handle navigation properties in sorting
            if (sortField == "strModuleName")
            {
                query = filter.ascending
                    ? query.OrderBy(gm => gm.Module.strName)
                    : query.OrderByDescending(gm => gm.Module.strName);
            }
            else if (sortField == "strGroupName")
            {
                query = filter.ascending
                    ? query.OrderBy(gm => gm.Group.strName)
                    : query.OrderByDescending(gm => gm.Group.strName);
            }
            else
            {
                string direction = filter.ascending ? "asc" : "desc";
                query = query.OrderBy($"{sortField} {direction}");
            }
            
            // Apply pagination
            var items = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();
            
            // Map to DTOs
            var itemDtos = new List<GroupModuleResponseDto>();
            foreach (var item in items)
            {
                itemDtos.Add(await GetResponseDtoWithNavigationProperties(item));
            }
            
            return new PagedResponse<GroupModuleResponseDto>
            {
                Items = itemDtos,
                TotalCount = totalItems,
                PageNumber = filter.Page,
                PageSize = filter.PageSize
            };
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var groupModule = await _context.MstGroupModules.FindAsync(Guid.Parse(guid));
            if (groupModule == null)
                return false;
            
            // Note: We don't delete the actual database, just the record
            _context.MstGroupModules.Remove(groupModule);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResponse<GroupModuleSimpleDto>> GetGroupModulesByGroupAsync(string groupGuid, int page = 1, int pageSize = 10)
        {
            var query = _context.MstGroupModules
                .Include(gm => gm.Group)
                .Include(gm => gm.Module)
                .Where(gm => gm.strGroupGUID == Guid.Parse(groupGuid))
                .OrderByDescending(gm => gm.dtCreatedOn);
            
            var totalItems = await query.CountAsync();
            
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            
            var itemDtos = items.Select(gm => new GroupModuleSimpleDto
            {
                strGroupModuleGUID = gm.strGroupModuleGUID.ToString(),
                strGroupGUID = gm.strGroupGUID.ToString(),
                strGroupName = gm.Group?.strName ?? "Unknown Group",
                strModuleGUID = gm.strModuleGUID.ToString(),
                strModuleName = gm.Module?.strName ?? "Unknown Module",
                intVersion = gm.intVersion
            }).ToList();
            
            return new PagedResponse<GroupModuleSimpleDto>
            {
                Items = itemDtos,
                TotalCount = totalItems,
                PageNumber = page,
                PageSize = pageSize
            };
        }

        public async Task<bool> CheckUserHasAccessToModule(string userGuid, string moduleGuid)
        {
            // Check if user exists
            var user = await _context.MstUsers.FindAsync(userGuid);
            if (user == null)
                return false;
            
            // Super admins have access to all modules
            if (user.bolIsSuperAdmin)
                return true;
            
            // For non-super admins, check if they have access through a group
            var userGroups = await _context.MstUserDetails
                .Where(ud => ud.strUserGUID == GuidHelper.ToGuid(userGuid) && ud.bolIsActive)
                .Select(ud => ud.strGroupGUID)
                .ToListAsync();
            
            // Check if any of the user's groups have this module
            return await _context.MstGroupModules
                .AnyAsync(gm => userGroups.Contains(gm.strGroupGUID) && 
                               gm.strModuleGUID == GuidHelper.ToGuid(moduleGuid));
        }

        // Helper methods
        private string GenerateConnectionString(string databaseName)
        {
            // Get the master connection string and replace the database name
            var masterConnectionString = _configuration.GetConnectionString("DefaultConnection");
            var builder = new SqlConnectionStringBuilder(masterConnectionString);
            builder.InitialCatalog = databaseName;
            
            return builder.ConnectionString;
        }

        private async Task CreateDatabaseAsync(string databaseName)
        {
            // Get the master connection string
            var masterConnectionString = _configuration.GetConnectionString("DefaultConnection");
            var builder = new SqlConnectionStringBuilder(masterConnectionString);
            
            Console.WriteLine($"Attempting to create database: {databaseName}");
            
            // Connect to master database
            builder.InitialCatalog = "master";
            
            SqlConnection? connection = null;
            try
            {
                connection = new SqlConnection(builder.ConnectionString);
                await connection.OpenAsync();
                Console.WriteLine($"Connected to master database for database creation.");
                
                // Check if database exists
                using (var checkCommand = new SqlCommand($"SELECT COUNT(*) FROM sys.databases WHERE name = '{databaseName}'", connection))
                {
                    var result = await checkCommand.ExecuteScalarAsync();
                    int dbCount = result != null ? Convert.ToInt32(result) : 0;
                    if (dbCount > 0)
                    {
                        // Database already exists
                        Console.WriteLine($"Database '{databaseName}' already exists.");
                        return;
                    }
                }
                
                // Create the database
                using (var command = new SqlCommand($"CREATE DATABASE [{databaseName}]", connection))
                {
                    await command.ExecuteNonQueryAsync();
                    Console.WriteLine($"Database '{databaseName}' created successfully.");
                }
            }
            finally
            {
                // Explicitly close and dispose the connection
                if (connection != null)
                {
                    if (connection.State != System.Data.ConnectionState.Closed)
                    {
                        Console.WriteLine("Explicitly closing master database connection.");
                        connection.Close();
                    }
                    Console.WriteLine("Disposing master database connection.");
                    connection.Dispose();
                    connection = null;
                }
            }
        }

        private async Task AddDefaultUserRolesForModuleAsync(Guid groupGUID, Guid moduleGUID, Guid organizationGUID, string createdByGUID)
        {
            Console.WriteLine($"Adding default Admin role for module {moduleGUID} in group {groupGUID} for organization {organizationGUID}");
            
            try
            {
                // Verify that the group exists
                var group = await _context.MstGroups.FindAsync(groupGUID);
                if (group == null)
                {
                    throw new BusinessException($"Group with GUID {groupGUID} does not exist");
                }

                // Verify that the user exists
                var createdBy = await _context.MstUsers.FindAsync(GuidHelper.ToGuid(createdByGUID));
                if (createdBy == null)
                {
                    throw new BusinessException($"User with GUID {createdByGUID} does not exist");
                }

                // Verify that the module exists
                var module = await _context.MstModules.FindAsync(moduleGUID);
                if (module == null)
                {
                    throw new BusinessException($"Module with GUID {moduleGUID} does not exist");
                }

                // Current datetime for consistency
                var currentDateTime = CurrentDateTime;
                
                // Check if an Admin role already exists for this group and module
                var existingRole = await _context.MstUserRoles
                    .FirstOrDefaultAsync(r => r.strName == "Admin" && 
                                          r.strGroupGUID == groupGUID && 
                                          r.strModuleGUID == moduleGUID);
                
                // Create only a single Admin role if it doesn't exist yet
                if (existingRole == null)
                {
                    // Create just the Admin role
                    var userRole = new MstUserRole
                    {
                        strUserRoleGUID = Guid.NewGuid(),
                        strName = "Admin",
                        strDesc = $"Administrator role with full access for module {module.strName}",
                        bolIsActive = true,
                        bolSystemCreated = true,
                        strGroupGUID = groupGUID,
                        strModuleGUID = moduleGUID,
                        dtCreatedOn = currentDateTime,
                        strCreatedByGUID = GuidHelper.ToGuid(createdByGUID)
                    };
                    
                    _context.MstUserRoles.Add(userRole);
                    Console.WriteLine($"Added Admin role for module {moduleGUID}");
                    
                    // Save the Admin role
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Successfully created Admin role for module {moduleGUID}");
                }
                else
                {
                    Console.WriteLine($"Admin role already exists for this group and module - skipping");
                }
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"Database error creating user roles: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating user roles: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }
        
        private async Task<GroupModuleResponseDto> GetResponseDtoWithNavigationProperties(MstGroupModule groupModule)
        {
            // Ensure navigation properties are loaded
            if (groupModule.Group == null)
            {
                await _context.Entry(groupModule)
                    .Reference(gm => gm.Group)
                    .LoadAsync();
            }
            
            if (groupModule.Module == null)
            {
                await _context.Entry(groupModule)
                    .Reference(gm => gm.Module)
                    .LoadAsync();
            }
            
            // Map to DTO with navigation property values
            var dto = new GroupModuleResponseDto
            {
                strGroupModuleGUID = groupModule.strGroupModuleGUID.ToString(),
                strGroupGUID = groupModule.strGroupGUID.ToString(),
                strGroupName = groupModule.Group?.strName ?? "Unknown Group",
                strModuleGUID = groupModule.strModuleGUID.ToString(),
                strModuleName = groupModule.Module?.strName ?? "Unknown Module",
                intVersion = groupModule.intVersion,
                strConnectionString = groupModule.strConnectionString,
                strCreatedByGUID = groupModule.strCreatedByGUID.ToString(),
                dtCreatedOn = groupModule.dtCreatedOn,
                strUpdatedByGUID = groupModule.strUpdatedByGUID?.ToString(),
                dtUpdatedOn = groupModule.dtUpdatedOn
            };
            
            return dto;
        }
        
        private async Task ExecuteSqlScriptAsync(string connectionString, string sqlFilePath)
        {
            if (string.IsNullOrEmpty(sqlFilePath))
            {
                Console.WriteLine($"No SQL file path provided.");
                return; // No SQL file to execute
            }
            
            try
            {
                Console.WriteLine($"Attempting to execute SQL script from path: {sqlFilePath}");
                
                // Resolve relative path if needed
                string fullPath = sqlFilePath;
                if (!System.IO.Path.IsPathRooted(sqlFilePath))
                {
                    // If path is relative, combine with application base path
                    string basePath = AppDomain.CurrentDomain.BaseDirectory;
                    fullPath = System.IO.Path.Combine(basePath, sqlFilePath);
                    Console.WriteLine($"Resolved relative path to: {fullPath}");
                    
                    // Debug: List files in the directory to confirm they exist
                    var directory = System.IO.Path.GetDirectoryName(fullPath);
                    if (System.IO.Directory.Exists(directory))
                    {
                        Console.WriteLine($"Directory exists: {directory}");
                        Console.WriteLine("Files in directory:");
                        foreach (var file in System.IO.Directory.GetFiles(directory))
                        {
                            Console.WriteLine($"  {file}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"Directory does not exist: {directory}");
                    }
                }
                
                // Check if file exists
                if (!System.IO.File.Exists(fullPath))
                {
                    Console.WriteLine($"SQL script file not found at: {fullPath}");
                    throw new BusinessException($"SQL script file not found at: {fullPath}");
                }
                
                Console.WriteLine($"SQL script file found. Reading content...");
                
                // Read the SQL script from file
                string sqlScript = await System.IO.File.ReadAllTextAsync(fullPath);
                
                if (string.IsNullOrWhiteSpace(sqlScript))
                {
                    Console.WriteLine($"SQL script is empty or whitespace only.");
                    return; // Empty script, nothing to execute
                }
                
                Console.WriteLine($"SQL script content read successfully. Length: {sqlScript.Length} characters.");
                // SECURITY FIX: Don't log connection string
                Console.WriteLine($"Connecting to database...");
                
                // Execute the script on the new database
                SqlConnection? connection = null;
                try
                {
                    connection = new SqlConnection(connectionString);
                    await connection.OpenAsync();
                    Console.WriteLine($"Database connection opened successfully.");
                    
                    // Split script by GO statements if present (common in SQL Server scripts)
                    string[] commandStrings = sqlScript.Split(new[] { "GO", "go", "Go" }, StringSplitOptions.RemoveEmptyEntries);
                    Console.WriteLine($"Split SQL script into {commandStrings.Length} command(s).");
                    
                    foreach (string commandString in commandStrings)
                    {
                        if (!string.IsNullOrWhiteSpace(commandString))
                        {
                            using (var command = new SqlCommand(commandString, connection))
                            {
                                try
                                {
                                    Console.WriteLine($"Executing SQL command, length: {commandString.Length} characters.");
                                    await command.ExecuteNonQueryAsync();
                                    Console.WriteLine($"SQL command executed successfully.");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"Error executing SQL command: {ex.Message}");
                                    throw new BusinessException($"Error executing SQL script command: {ex.Message}");
                                }
                            }
                        }
                    }
                }
                finally
                {
                    // Explicitly close and dispose the connection
                    if (connection != null)
                    {
                        if (connection.State != System.Data.ConnectionState.Closed)
                        {
                            Console.WriteLine("Explicitly closing database connection.");
                            connection.Close();
                        }
                        Console.WriteLine("Disposing database connection.");
                        connection.Dispose();
                        connection = null;
                    }
                }
                
                Console.WriteLine($"SQL script execution completed successfully.");
            }
            catch (Exception ex) when (!(ex is BusinessException))
            {
                Console.WriteLine($"Error processing SQL script: {ex.Message}");
                throw new BusinessException($"Error processing SQL script: {ex.Message}");
            }
        }

        private async Task<List<MstOrganization>> GetOrganizationsByGroupAsync(string groupGUID)
        {
            Console.WriteLine($"Fetching organizations for group: {groupGUID}");
            
            // Query to get all organizations that belong to the specified group
            var organizations = await _context.MstOrganizations
                .Where(o => o.strGroupGUID.ToString() == groupGUID)
                .ToListAsync();
            
            Console.WriteLine($"Found {organizations.Count} organizations for group {groupGUID}");
            
            return organizations;
        }

        public async Task ExecuteSqlScriptForOrganizationAsync(string connectionString, string sqlFilePath, string organizationGUID, string? groupGUID = null, string? yearGUID = null, string? countryGUID = null)
        {
            if (string.IsNullOrEmpty(sqlFilePath))
            {
                return; // No SQL file to execute
            }
            
            SqlConnection? connection = null;
            
            try
            {
                Console.WriteLine($"Attempting to execute SQL script for organization {organizationGUID} from path: {sqlFilePath}");
                
                // Resolve relative path if needed
                string fullPath = sqlFilePath;
                if (!System.IO.Path.IsPathRooted(sqlFilePath))
                {
                    // If path is relative, combine with application base path
                    string basePath = AppDomain.CurrentDomain.BaseDirectory;
                    fullPath = System.IO.Path.Combine(basePath, sqlFilePath);
                    Console.WriteLine($"Resolved relative path to: {fullPath}");
                }
                
                // Check if directory exists
                var directory = System.IO.Path.GetDirectoryName(fullPath);
                if (System.IO.Directory.Exists(directory))
                {
                    Console.WriteLine($"Directory exists: {directory}");
                    Console.WriteLine("Files in directory:");
                    foreach (var file in System.IO.Directory.GetFiles(directory))
                    {
                        Console.WriteLine($"  {file}");
                    }
                }
                else
                {
                    Console.WriteLine($"Directory does not exist: {directory}");
                }
                
                // Check if file exists
                if (!System.IO.File.Exists(fullPath))
                {
                    Console.WriteLine($"SQL script file not found at: {fullPath}");
                    throw new BusinessException($"SQL script file not found at: {fullPath}");
                }
                
                Console.WriteLine($"SQL script file found for organization {organizationGUID}. Reading content...");
                
                // Read the SQL script from file
                string sqlScript = await System.IO.File.ReadAllTextAsync(fullPath);
                
                if (string.IsNullOrWhiteSpace(sqlScript))
                {
                    Console.WriteLine($"SQL script is empty or whitespace only.");
                    return; // Empty script, nothing to execute
                }
                
                Console.WriteLine($"SQL script content read successfully. Length: {sqlScript.Length} characters.");
                var countryLogValue = string.IsNullOrEmpty(countryGUID) ? "NULL (not provided)" : countryGUID;
                var groupLogValue = string.IsNullOrEmpty(groupGUID) ? "NULL" : groupGUID;
                var yearLogValue = string.IsNullOrEmpty(yearGUID) ? "NULL" : yearGUID;
                var parameterSnapshot = $"SQL parameter snapshot -> Org: {organizationGUID}, Group: {groupLogValue}, Year: {yearLogValue}, Country: {countryLogValue}";
                Console.WriteLine(parameterSnapshot);
                _logger.LogInformation(parameterSnapshot);
                
                // Instead of replacing schema names directly, we'll now use SQL parameters to handle this
                Console.WriteLine($"Connecting to database using connection string: {connectionString}");
                
                // Execute the script on the database
                connection = new SqlConnection(connectionString);
                
                // Track if any SQL errors occurred
                var sqlErrors = new List<string>();
                
                connection.InfoMessage += (_, args) =>
                {
                    var printMessage = $"[SQL PRINT][Org {organizationGUID}] {args.Message}";
                    Console.WriteLine(printMessage);
                    _logger.LogInformation(printMessage);
                    
                    // Capture any ERROR messages from SQL
                    if (args.Message.Contains("Error") || args.Message.Contains("error") || args.Message.Contains("ERROR"))
                    {
                        sqlErrors.Add(args.Message);
                        _logger.LogError($"SQL ERROR captured: {args.Message}");
                    }
                };
                connection.FireInfoMessageEventOnUserErrors = true;
                
                _logger.LogInformation($"========== STARTING SQL SCRIPT EXECUTION FOR ORG {organizationGUID} ==========");
                Console.WriteLine($"========== STARTING SQL SCRIPT EXECUTION FOR ORG {organizationGUID} ==========");
                
                await connection.OpenAsync();
                Console.WriteLine($"Database connection opened successfully for organization {organizationGUID}.");
                
                var commandStrings = Regex.Split(sqlScript, @"^\s*GO\s*;?\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase)
                                           .Select(s => s?.Trim())
                                           .Where(s => !string.IsNullOrWhiteSpace(s))
                                           .ToArray();
                Console.WriteLine($"Split SQL script into {commandStrings.Length} command(s) using GO line boundaries.");
                _logger.LogInformation($"Split SQL script into {commandStrings.Length} command(s) for organization {organizationGUID}.");

                foreach (string commandString in commandStrings)
                {
                    if (string.IsNullOrWhiteSpace(commandString))
                    {
                        continue;
                    }

                    using (var command = new SqlCommand(commandString, connection))
                    {
                        try
                        {
                            command.Parameters.AddWithValue("@organizationGUID", organizationGUID);

                            // Always add these parameters, use DBNull.Value if null/empty
                            command.Parameters.AddWithValue("@groupGUID", 
                                string.IsNullOrEmpty(groupGUID) ? (object)DBNull.Value : groupGUID);

                            command.Parameters.AddWithValue("@yearGUID", 
                                string.IsNullOrEmpty(yearGUID) ? (object)DBNull.Value : yearGUID);

                            command.Parameters.AddWithValue("@countryGUID", 
                                string.IsNullOrEmpty(countryGUID) ? (object)DBNull.Value : countryGUID);

                            var executionMessage = $"Executing SQL command for organization {organizationGUID} with parameters @organizationGUID={organizationGUID}, @groupGUID={(groupGUID ?? "NULL")}, @yearGUID={(yearGUID ?? "NULL")}, @countryGUID={(countryGUID ?? "NULL")}";
                            Console.WriteLine(executionMessage);
                            _logger.LogInformation(executionMessage);

                            await command.ExecuteNonQueryAsync();

                            var successMessage = $"✓ SQL command completed for organization {organizationGUID}";
                            Console.WriteLine(successMessage);
                            _logger.LogInformation(successMessage);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error executing SQL command for organization {organizationGUID}: {ex.Message}");
                            _logger.LogError(ex, $"Error executing SQL command for organization {organizationGUID}");
                            throw new BusinessException($"Error executing SQL script command for organization {organizationGUID}: {ex.Message}");
                        }
                    }
                }
                
                // Check if any SQL errors were captured during execution
                if (sqlErrors.Count > 0)
                {
                    var errorSummary = $"SQL script execution completed but {sqlErrors.Count} error(s) were captured: {string.Join(" | ", sqlErrors)}";
                    _logger.LogError(errorSummary);
                    Console.WriteLine($"⚠️  WARNING: {errorSummary}");
                }

                var completionMessage = $"========== SQL SCRIPT EXECUTION COMPLETED FOR ORG {organizationGUID} ==========";
                Console.WriteLine(completionMessage);
                _logger.LogInformation(completionMessage);
            }
            catch (Exception ex) when (!(ex is BusinessException))
            {
                Console.WriteLine($"Error processing SQL script for organization {organizationGUID}: {ex.Message}");
                _logger.LogError(ex, $"Error processing SQL script for organization {organizationGUID}");
                throw new BusinessException($"Error processing SQL script for organization {organizationGUID}: {ex.Message}");
            }
            finally
            {
                if (connection != null)
                {
                    if (connection.State != System.Data.ConnectionState.Closed)
                    {
                        Console.WriteLine($"Explicitly closing database connection for organization {organizationGUID}.");
                        connection.Close();
                    }
                    Console.WriteLine($"Disposing database connection for organization {organizationGUID}.");
                    connection.Dispose();
                    connection = null;
                }
            }
        }

        public async Task<List<ModuleInfoDto>> GetModulesByGroupAsync(string groupGuid)
        {
            if (!Guid.TryParse(groupGuid, out var groupId))
            {
                throw new ValidationException($"Invalid group GUID format: {groupGuid}");
            }

            var modules = await _context.MstGroupModules
                .Include(gm => gm.Module)
                .Where(gm => gm.strGroupGUID == groupId)
                .Select(gm => new ModuleInfoDto
                {
                    strModuleGUID = gm.strModuleGUID.ToString(),
                    strModuleName = gm.Module != null ? gm.Module.strName : "Unknown Module"
                })
                .ToListAsync();

            return modules;
        }
    }
}
