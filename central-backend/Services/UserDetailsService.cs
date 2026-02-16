using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.UserDetails;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;

namespace AuditSoftware.Services
{
    public class UserDetailsService :  ServiceBase, IUserDetailsService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UserDetailsService> _logger;

        public UserDetailsService(AppDbContext context, IMapper mapper, ILogger<UserDetailsService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<UserDetailsResponseDto> CreateAsync(UserDetailsCreateDto createDto, Guid createdByGUID, Guid groupGUID, Guid organizationGUID, Guid? moduleGUID = null)
        {
            try 
            {
                if (createDto.strUserGUID == Guid.Empty)
                    throw new BusinessException("User GUID is required");

                if (createDto.strUserRoleGUID == Guid.Empty)
                    throw new BusinessException("User Role GUID is required");

                if (groupGUID == Guid.Empty)
                    throw new BusinessException("Group GUID is required");

                if (organizationGUID == Guid.Empty)
                    throw new BusinessException("Organization GUID is required");

                // First check if the user is already assigned to this organization
                var existingUserDetail = await _context.MstUserDetails
                    .FirstOrDefaultAsync(ud => ud.strUserGUID == createDto.strUserGUID && 
                                             ud.strOrganizationGUID == organizationGUID);
                
                if (existingUserDetail != null)
                {
                    throw new BusinessException("This user is already assigned to this organization.");
                }

                // Validate that the user exists
                var user = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == createDto.strUserGUID);

                if (user == null)
                    throw new BusinessException("User not found");

                // Validate that the role exists and belongs to the group
                var role = await _context.MstUserRoles
                    .FirstOrDefaultAsync(r => r.strUserRoleGUID == createDto.strUserRoleGUID && r.strGroupGUID == groupGUID);

                if (role == null)
                    throw new BusinessException("User role not found or does not belong to your group");

                var userDetail = new MstUserDetails
                {
                    strUserDetailGUID = Guid.NewGuid(),
                    strUserGUID = createDto.strUserGUID,
                    strOrganizationGUID = organizationGUID,
                    strUserRoleGUID = createDto.strUserRoleGUID,
                    strGroupGUID = groupGUID,
                    strYearGUID = createDto.strYearGUID,
                    strModuleGUID = moduleGUID, // Now using the moduleGUID parameter passed from the token
                    bolIsActive = createDto.bolIsActive,
                    strCreatedByGUID = createdByGUID,
                    dtCreatedOn = CurrentDateTime,
                    strUpdatedByGUID = createdByGUID,
                    dtUpdatedOn = CurrentDateTime
                };

                _context.MstUserDetails.Add(userDetail);
                
                // Update the user's module info in MstUserInfo if applicable
                if (user != null && user.strLastModuleGUID != Guid.Empty)
                {
                    var userInfo = await _context.MstUserInfos
                        .FirstOrDefaultAsync(ui => ui.strUserGUID == createDto.strUserGUID && 
                                                 ui.strModuleGUID == user.strLastModuleGUID);
                    
                    if (userInfo != null)
                    {
                        userInfo.strLastOrganizationGUID = organizationGUID;
                        userInfo.strLastYearGUID = createDto.strYearGUID;
                        userInfo.strUpdatedByGUID = createdByGUID;
                        userInfo.dtUpdatedOn = CurrentDateTime;
                    }
                    else
                    {
                        // Create new userInfo record if module exists
                        _context.MstUserInfos.Add(new Models.Entities.MstUserInfo
                        {
                            strUserInfoGUID = Guid.NewGuid(),
                            strUserGUID = createDto.strUserGUID,
                            strModuleGUID = user.strLastModuleGUID,
                            strLastOrganizationGUID = organizationGUID,
                            strLastYearGUID = createDto.strYearGUID,
                            strCreatedByGUID = createdByGUID,
                            dtCreatedOn = CurrentDateTime
                        });
                    }
                }
                
                await _context.SaveChangesAsync();
                return await GetEnrichedUserDetailsResponseAsync(userDetail);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while creating user details. User: {UserGuid}, Organization: {OrgGuid}", 
                    createDto.strUserGUID, organizationGUID);
                
                if (ex.InnerException?.Message?.Contains("IX_mstUserDetails_strUserGUID_strOrganizationGUID_strYearGUID_strModuleGUID") ?? false)
                {
                    throw new BusinessException("This user is already assigned to this organization with the same year and module.");
                }
                throw new BusinessException("An error occurred while creating user details 123: " + ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating user details. User: {UserGuid}, Organization: {OrgGuid}", 
                    createDto.strUserGUID, organizationGUID);
                throw new BusinessException("An unexpected error occurred while creating user details.");
            }
        }

        public async Task<UserDetailsResponseDto> UpdateAsync(Guid guid, UserDetailsUpdateDto updateDto, Guid updatedByGUID)
        {
            if (guid == Guid.Empty)
                throw new BusinessException("User Detail GUID is required");

            var userDetail = await _context.MstUserDetails
                .FirstOrDefaultAsync(ud => ud.strUserDetailGUID == guid);

            if (userDetail == null)
                throw new BusinessException("User detail not found");

            // Validate that the role exists and belongs to the group
            var role = await _context.MstUserRoles
                .FirstOrDefaultAsync(r => r.strUserRoleGUID == updateDto.strUserRoleGUID && r.strGroupGUID == userDetail.strGroupGUID);

            if (role == null)
                throw new BusinessException("User role not found or does not belong to your group");

            userDetail.strUserRoleGUID = updateDto.strUserRoleGUID;
            userDetail.strYearGUID = updateDto.strYearGUID ?? Guid.Empty;
            userDetail.bolIsActive = updateDto.bolIsActive;
            userDetail.strUpdatedByGUID = updatedByGUID;
            userDetail.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return await GetEnrichedUserDetailsResponseAsync(userDetail);
        }

        public async Task<UserDetailsResponseDto> GetByIdAsync(Guid guid)
        {
            var userDetail = await _context.MstUserDetails
                .FirstOrDefaultAsync(ud => ud.strUserDetailGUID == guid);

            if (userDetail == null)
                throw new BusinessException("User detail not found");

            return await GetEnrichedUserDetailsResponseAsync(userDetail);
        }

        public async Task<PagedResponse<UserDetailsResponseDto>> GetAllAsync(UserDetailsFilterDto filterDto)
        {
            if (filterDto.PageNumber < 1)
                throw new BusinessException("Page number must be greater than 0");
            if (filterDto.PageSize < 1)
                throw new BusinessException("Page size must be greater than 0");

            // Build the base query
            var query = _context.MstUserDetails.AsQueryable();

            // Apply group filter
            if (!string.IsNullOrEmpty(filterDto.strGroupGUID) && Guid.TryParse(filterDto.strGroupGUID, out Guid groupGuid))
            {
                query = query.Where(ud => ud.strGroupGUID == groupGuid);
            }

            // Apply organization filter
            if (!string.IsNullOrEmpty(filterDto.strOrganizationGUID) && Guid.TryParse(filterDto.strOrganizationGUID, out Guid orgGuid))
            {
                query = query.Where(ud => ud.strOrganizationGUID == orgGuid);
            }
            
            // Apply module filter
            if (!string.IsNullOrEmpty(filterDto.strModuleGUID) && Guid.TryParse(filterDto.strModuleGUID, out Guid moduleGuid))
            {
                query = query.Where(ud => ud.strModuleGUID == moduleGuid);
            }

            // Apply user role filter
            if (!string.IsNullOrEmpty(filterDto.strUserRoleGUID))
            {
                var roleGuidStrings = filterDto.strUserRoleGUID.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(guid => guid.Trim());
                var roleGuids = new List<Guid>();
                
                foreach (var guidStr in roleGuidStrings)
                {
                    if (Guid.TryParse(guidStr, out Guid parsedGuid))
                    {
                        roleGuids.Add(parsedGuid);
                    }
                }
                
                if (roleGuids.Any())
                {
                    query = query.Where(ud => roleGuids.Contains(ud.strUserRoleGUID));
                }
            }

            // Apply user filter
            if (!string.IsNullOrEmpty(filterDto.strUserGUID))
            {
                var userGuidStrings = filterDto.strUserGUID.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(guid => guid.Trim());
                var userGuids = new List<Guid>();
                
                foreach (var guidStr in userGuidStrings)
                {
                    if (Guid.TryParse(guidStr, out Guid parsedGuid))
                    {
                        userGuids.Add(parsedGuid);
                    }
                }
                
                if (userGuids.Any())
                {
                    query = query.Where(ud => userGuids.Contains(ud.strUserGUID));
                }
            }
            
            // Apply year filter
            if (!string.IsNullOrEmpty(filterDto.strYearGUID))
            {
                var yearGuidStrings = filterDto.strYearGUID.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(guid => guid.Trim());
                var yearGuids = new List<Guid>();
                
                foreach (var guidStr in yearGuidStrings)
                {
                    if (Guid.TryParse(guidStr, out Guid parsedGuid))
                    {
                        yearGuids.Add(parsedGuid);
                    }
                }
                
                if (yearGuids.Any())
                {
                    query = query.Where(ud => yearGuids.Contains(ud.strYearGUID));
                }
            }

            // Apply active status filter
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(ud => ud.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Apply search if provided - search on enriched name fields after fetching data
            // We'll apply search after enrichment since we search on name fields, not GUIDs
            var searchQuery = !string.IsNullOrWhiteSpace(filterDto.Search) ? filterDto.Search.ToLower().Trim() : null;

            // Apply sorting
            query = ApplySorting(query, filterDto.SortBy ?? "", filterDto.ascending);

            // Get all matching items (we need to enrich them first for search and sort on name fields)
            var items = await query.ToListAsync();

            // Enrich all items with name fields
            var enrichedDtos = new List<UserDetailsResponseDto>();
            foreach (var item in items)
            {
                enrichedDtos.Add(await GetEnrichedUserDetailsResponseAsync(item));
            }

            // Apply search on enriched name fields
            if (!string.IsNullOrWhiteSpace(searchQuery))
            {
                enrichedDtos = enrichedDtos.Where(dto => 
                    dto.strUserName.ToLower().Contains(searchQuery) ||
                    dto.strUserRoleName.ToLower().Contains(searchQuery) ||
                    dto.strOrganizationName.ToLower().Contains(searchQuery) ||
                    (dto.strYearName != null && dto.strYearName.ToLower().Contains(searchQuery)) ||
                    dto.strCreatedBy.ToLower().Contains(searchQuery) ||
                    dto.strUpdatedBy.ToLower().Contains(searchQuery) ||
                    dto.bolIsActive.ToString().ToLower().Contains(searchQuery)
                ).ToList();
            }

            // Apply sorting on enriched fields
            enrichedDtos = ApplySortingOnEnrichedData(enrichedDtos, filterDto.SortBy ?? "", filterDto.ascending);

            var totalCount = enrichedDtos.Count;
            var pagedDtos = enrichedDtos
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToList();

            return new PagedResponse<UserDetailsResponseDto>
            {
                Items = pagedDtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
            };
        }

        public async Task<bool> DeleteAsync(Guid guid, Guid currentUserGuid, Guid currentOrganizationGuid, Guid currentYearGuid)
        {
            try
            {
                if (guid == Guid.Empty)
                    throw new BusinessException("User Detail GUID is required");

                var userDetail = await _context.MstUserDetails
                    .FirstOrDefaultAsync(ud => ud.strUserDetailGUID == guid);

                if (userDetail == null)
                    throw new BusinessException($"User detail with GUID {guid} not found");

                // Check if the user is trying to delete their own active user detail for the current org and year
                if (userDetail.strUserGUID == currentUserGuid && 
                    userDetail.strOrganizationGUID == currentOrganizationGuid && 
                    userDetail.strYearGUID == currentYearGuid)
                {
                    _logger.LogWarning("User attempted to delete their currently active user detail. UserGUID: {UserGUID}, OrganizationGUID: {OrgGUID}, YearGUID: {YearGUID}",
                        currentUserGuid, currentOrganizationGuid, currentYearGuid);
                    throw new BusinessException("Cannot delete your currently active user detail for this organization and year");
                }

                // Get the user whose detail is being deleted
                var affectedUser = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == userDetail.strUserGUID);
                
                // Check if we're removing their current active organization/year based on MstUserInfo
                bool isRemovingActiveSettings = false;
                if (affectedUser != null && affectedUser.strLastModuleGUID.HasValue && affectedUser.strLastModuleGUID != Guid.Empty)
                {
                    var userInfo = await _context.MstUserInfos
                        .FirstOrDefaultAsync(ui => ui.strUserGUID == userDetail.strUserGUID && 
                                                ui.strModuleGUID == affectedUser.strLastModuleGUID);
                    isRemovingActiveSettings = userInfo != null && 
                        userInfo.strLastOrganizationGUID == userDetail.strOrganizationGUID && 
                        userInfo.strLastYearGUID == userDetail.strYearGUID;
                }
                
                // Remove the user detail
                _context.MstUserDetails.Remove(userDetail);
                await _context.SaveChangesAsync();

                // If we're removing the user's active org/year, we need to update their settings in MstUserInfo
                if (isRemovingActiveSettings && affectedUser != null && affectedUser.strLastModuleGUID.HasValue && affectedUser.strLastModuleGUID != Guid.Empty)
                {
                    _logger.LogInformation("Removed active organization/year for user {UserGUID}. Finding alternative assignment...", userDetail.strUserGUID);
                    
                    // Find all remaining user details for this user, ordered by most recently updated
                    var remainingUserDetails = await _context.MstUserDetails
                        .Where(ud => ud.strUserGUID == userDetail.strUserGUID)
                        .OrderByDescending(ud => ud.dtUpdatedOn)
                        .ToListAsync();
                    
                    // Find the user info record
                    var userInfo = await _context.MstUserInfos
                        .FirstOrDefaultAsync(ui => ui.strUserGUID == userDetail.strUserGUID && 
                                                ui.strModuleGUID == affectedUser.strLastModuleGUID);
                    
                    if (userInfo != null)
                    {
                        if (remainingUserDetails.Any())
                        {
                            // Get the most recently updated user detail
                            var latestUserDetail = remainingUserDetails.First();
                            
                            _logger.LogInformation("Updating user {UserGUID} last organization to {OrgGUID} and year to {YearGUID}",
                                userDetail.strUserGUID, latestUserDetail.strOrganizationGUID, latestUserDetail.strYearGUID);
                                
                            // Update the user info with the new organization and year
                            userInfo.strLastOrganizationGUID = latestUserDetail.strOrganizationGUID;
                            userInfo.strLastYearGUID = latestUserDetail.strYearGUID;
                            userInfo.dtUpdatedOn = CurrentDateTime;
                            await _context.SaveChangesAsync();
                            
                            _logger.LogInformation("Successfully updated user's last organization and year settings");
                        }
                        else
                        {
                            _logger.LogInformation("User {UserGUID} has no remaining organization assignments", userDetail.strUserGUID);
                            
                            // Clear the organization and year settings in user info
                            userInfo.strLastOrganizationGUID = null;
                            userInfo.strLastYearGUID = null;
                            userInfo.dtUpdatedOn = CurrentDateTime;
                            await _context.SaveChangesAsync();
                        }
                    }
                }

                _logger.LogInformation("Successfully deleted user detail with GUID: {Guid}", guid);
                return true;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Database error while deleting user detail. GUID: {Guid}", guid);
                throw new BusinessException("An error occurred while deleting the user detail: " + ex.Message);
            }
            catch (BusinessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while deleting user detail. GUID: {Guid}", guid);
                throw new BusinessException("An unexpected error occurred while deleting the user detail.");
            }
        }

        public async Task<UserDetailsResponseDto> UpsertAsync(UserDetailsCreateDto createDto, Guid userGuid, Guid groupGUID, Guid moduleGUID)
        {
            try
            {
                _logger.LogInformation($"Starting UpsertAsync with userGuid: {userGuid}, groupGUID: {groupGUID}, moduleGUID: {moduleGUID}");
                
                if (createDto.strUserGUID == Guid.Empty)
                {
                    _logger.LogError("User GUID is required");
                    throw new BusinessException("User GUID is required");
                }

                if (createDto.strUserRoleGUID == Guid.Empty)
                {
                    _logger.LogError("User Role GUID is required");
                    throw new BusinessException("User Role GUID is required");
                }

                if (createDto.strOrganizationGUID == Guid.Empty)
                {
                    _logger.LogError("Organization GUID is required");
                    throw new BusinessException("Organization GUID is required");
                }
                    
                if (createDto.strYearGUID == Guid.Empty)
                {
                    _logger.LogError("Year GUID is required");
                    throw new BusinessException("Year GUID is required");
                }

                if (groupGUID == Guid.Empty)
                {
                    _logger.LogError("Group GUID is required");
                    throw new BusinessException("Group GUID is required");
                }

                // Validate that the user exists
                var user = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == createDto.strUserGUID);

                if (user == null)
                {
                    _logger.LogError($"User not found with GUID: {createDto.strUserGUID}");
                    throw new BusinessException("User not found");
                }

                // Validate that the role exists and belongs to the group
                var role = await _context.MstUserRoles
                    .FirstOrDefaultAsync(r => r.strUserRoleGUID == createDto.strUserRoleGUID && r.strGroupGUID == groupGUID);

                if (role == null)
                {
                    _logger.LogError($"User role not found or does not belong to group. RoleGUID: {createDto.strUserRoleGUID}, GroupGUID: {groupGUID}");
                    throw new BusinessException("User role not found or does not belong to your group");
                }

                // Validate that the organization exists and belongs to the group
                var organization = await _context.MstOrganizations
                    .FirstOrDefaultAsync(o => o.strOrganizationGUID == createDto.strOrganizationGUID && o.strGroupGUID == groupGUID);

                if (organization == null)
                {
                    _logger.LogError($"Organization not found or does not belong to group. OrganizationGUID: {createDto.strOrganizationGUID}, GroupGUID: {groupGUID}");
                    throw new BusinessException("Organization not found or does not belong to your group");
                }

                // Validate that the year exists and belongs to the organization
                try
                {
                    // Use the Guid values directly without parsing
                    var yearGuid = createDto.strYearGUID;
                    var organizationGuid = createDto.strOrganizationGUID;
                    var groupGuidParsed = groupGUID;
                    
                    var year = await _context.MstYears
                        .FirstOrDefaultAsync(y => y.strYearGUID == yearGuid && 
                                                y.strOrganizationGUID == organizationGuid &&
                                                y.strGroupGUID == groupGuidParsed);

                    if (year == null)
                    {
                        _logger.LogError($"Year not found or does not belong to organization. YearGUID: {createDto.strYearGUID}, OrganizationGUID: {createDto.strOrganizationGUID}");
                        throw new BusinessException("Year not found or does not belong to your organization");
                    }
                }
                catch (FormatException ex)
                {
                    _logger.LogError(ex, "Invalid GUID format while validating year");
                    throw new BusinessException("Invalid GUID format in request");
                }

                // Check if a user detail already exists for this user, organization, year, and module combination
                var existingUserDetail = await _context.MstUserDetails
                    .FirstOrDefaultAsync(ud => ud.strUserGUID == createDto.strUserGUID && 
                                             ud.strOrganizationGUID == createDto.strOrganizationGUID &&
                                             ud.strYearGUID == createDto.strYearGUID && 
                                             ud.strModuleGUID == moduleGUID);

                if (existingUserDetail != null)
                {
                    _logger.LogInformation($"Updating existing user detail for user-organization-year-module combination. UserDetailGUID: {existingUserDetail.strUserDetailGUID}");
                    // Update existing record
                    existingUserDetail.strUserRoleGUID = createDto.strUserRoleGUID;
                    existingUserDetail.bolIsActive = createDto.bolIsActive;
                    existingUserDetail.strUpdatedByGUID = userGuid;
                    existingUserDetail.dtUpdatedOn = CurrentDateTime;

                    try
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Successfully updated user detail");
                        
                        // Process the userInfo separately after the user detail is updated
                        await UpdateUserInfoFromRequest(createDto.strUserGUID, createDto.strOrganizationGUID, createDto.strYearGUID, userGuid, moduleGUID);
                        
                        return await GetEnrichedUserDetailsResponseAsync(existingUserDetail);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error updating existing user detail");
                        throw new BusinessException("An error occurred while updating user details");
                    }
                }
                else
                {
                    _logger.LogInformation("Creating new user detail for user-organization-year-module combination");
                    // Create new record
                    var newUserDetail = new MstUserDetails
                    {
                        strUserDetailGUID = Guid.NewGuid(),
                        strUserGUID = createDto.strUserGUID,
                        strOrganizationGUID = createDto.strOrganizationGUID,
                        strUserRoleGUID = createDto.strUserRoleGUID,
                        strGroupGUID = groupGUID,
                        strYearGUID = createDto.strYearGUID,
                        strModuleGUID = moduleGUID, // Now using the moduleGUID from token
                        bolIsActive = createDto.bolIsActive,
                        strCreatedByGUID = userGuid,
                        dtCreatedOn = CurrentDateTime,
                        strUpdatedByGUID = userGuid,
                        dtUpdatedOn = CurrentDateTime
                    };

                    try
                    {
                        _context.MstUserDetails.Add(newUserDetail);
                        
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Successfully created new user detail. UserDetailGUID: {newUserDetail.strUserDetailGUID}");
                        
                        // Process the userInfo separately after the user detail is created
                        await UpdateUserInfoFromRequest(createDto.strUserGUID, createDto.strOrganizationGUID, createDto.strYearGUID, userGuid, moduleGUID);
                        
                        return await GetEnrichedUserDetailsResponseAsync(newUserDetail);
                    }
                    catch (DbUpdateException ex)
                    {
                        _logger.LogError(ex, "Database error while creating new user detail");
                        if (ex.InnerException?.Message?.Contains("IX_mstUserDetails_strUserGUID_strOrganizationGUID_strYearGUID_strModuleGUID") ?? false)
                        {
                            throw new BusinessException("A user detail record already exists for this user, organization, year, and module combination");
                        }
                        throw new BusinessException("Database constraint violation occurred while creating user details");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error creating new user detail");
                        throw new BusinessException("An error occurred while creating user details qwe", ex.Message);
                    }
                } 
            }
            catch (BusinessException)
            {
                throw; // Re-throw business exceptions as they are
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in UpsertAsync");
                throw new BusinessException($"An unexpected error occurred: {ex.Message}");
            }
        }

        // Method to handle user info updates using the module GUID from token
        private async Task UpdateUserInfoFromRequest(Guid userGUID, Guid organizationGUID, Guid yearGUID, Guid createdByGUID, Guid moduleGUID)
        {
            _logger.LogInformation($"Starting UpdateUserInfoFromRequest for user: {userGUID}, module: {moduleGUID}");
            
            if (moduleGUID == Guid.Empty)
            {
                _logger.LogWarning("Module GUID is required but was not provided");
                return;
            }
            
            try
            {
                // Look for existing user info record with the moduleGUID from token
                var userInfo = await _context.MstUserInfos
                    .FirstOrDefaultAsync(ui => ui.strUserGUID == userGUID && 
                                             ui.strModuleGUID == moduleGUID);
                
                if (userInfo != null)
                {
                    _logger.LogInformation($"Updating existing user info for user {userGUID}, module {moduleGUID}");
                    userInfo.strLastOrganizationGUID = organizationGUID;
                    userInfo.strLastYearGUID = yearGUID;
                    userInfo.strUpdatedByGUID = createdByGUID;
                    userInfo.dtUpdatedOn = CurrentDateTime;
                }
                else
                {
                    _logger.LogInformation($"Creating new user info for user {userGUID}, module {moduleGUID}");
                    _context.MstUserInfos.Add(new Models.Entities.MstUserInfo
                    {
                        strUserInfoGUID = Guid.NewGuid(),
                        strUserGUID = userGUID,
                        strModuleGUID = moduleGUID,
                        strLastOrganizationGUID = organizationGUID,
                        strLastYearGUID = yearGUID,
                        strCreatedByGUID = createdByGUID,
                        dtCreatedOn = CurrentDateTime
                    });
                }
                
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Successfully updated user info for user: {userGUID}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user info for user: {userGUID}");
                // Don't throw the exception - we don't want to fail the whole operation if this part fails
            }
        }
        
        private IQueryable<MstUserDetails> ApplySorting(IQueryable<MstUserDetails> query, string sortBy, bool ascending)
        {
            Expression<Func<MstUserDetails, object>> keySelector = sortBy?.ToLower() switch
            {
                "struserdetailguid" => ud => ud.strUserDetailGUID,
                "struserguid" => ud => ud.strUserGUID,
                "strorganizationguid" => ud => ud.strOrganizationGUID,
                "struserroleguid" => ud => ud.strUserRoleGUID,
                "strGroupGUID" => ud => ud.strGroupGUID,
                "bolisactive" => ud => ud.bolIsActive,
                "dtcreatedon" => ud => ud.dtCreatedOn,
                "dtupdatedon" => ud => ud.dtUpdatedOn ?? DateTime.MaxValue,
                _ => ud => ud.dtCreatedOn // Default sorting by creation date
            };

            return ascending ? query.OrderBy(keySelector) : query.OrderByDescending(keySelector);
        }

        private List<UserDetailsResponseDto> ApplySortingOnEnrichedData(List<UserDetailsResponseDto> dtos, string sortBy, bool ascending)
        {
            var sortedQuery = sortBy?.ToLower() switch
            {
                "strusername" => ascending ? dtos.OrderBy(d => d.strUserName).ToList() : dtos.OrderByDescending(d => d.strUserName).ToList(),
                "struserrolename" => ascending ? dtos.OrderBy(d => d.strUserRoleName).ToList() : dtos.OrderByDescending(d => d.strUserRoleName).ToList(),
                "strorganizationname" => ascending ? dtos.OrderBy(d => d.strOrganizationName).ToList() : dtos.OrderByDescending(d => d.strOrganizationName).ToList(),
                "stryearname" => ascending ? dtos.OrderBy(d => d.strYearName).ToList() : dtos.OrderByDescending(d => d.strYearName).ToList(),
                "bolisactive" => ascending ? dtos.OrderBy(d => d.bolIsActive).ToList() : dtos.OrderByDescending(d => d.bolIsActive).ToList(),
                "strcreatedby" => ascending ? dtos.OrderBy(d => d.strCreatedBy).ToList() : dtos.OrderByDescending(d => d.strCreatedBy).ToList(),
                "strupdatedby" => ascending ? dtos.OrderBy(d => d.strUpdatedBy).ToList() : dtos.OrderByDescending(d => d.strUpdatedBy).ToList(),
                "dtcreatedon" => ascending ? dtos.OrderBy(d => d.dtCreatedOn).ToList() : dtos.OrderByDescending(d => d.dtCreatedOn).ToList(),
                "dtupdatedon" => ascending ? dtos.OrderBy(d => d.dtUpdatedOn ?? DateTime.MaxValue).ToList() : dtos.OrderByDescending(d => d.dtUpdatedOn ?? DateTime.MaxValue).ToList(),
                _ => ascending ? dtos.OrderBy(d => d.dtCreatedOn).ToList() : dtos.OrderByDescending(d => d.dtCreatedOn).ToList() // Default sorting by creation date
            };

            return sortedQuery;
        }

        public async Task<UserRoleInfoDto> GetUserRoleInfoAsync(Guid userGUID, Guid organizationGUID, Guid yearGUID)
        {
            try
            {
                if (userGUID == Guid.Empty)
                    throw new BusinessException("User GUID is required");

                if (organizationGUID == Guid.Empty)
                    throw new BusinessException("Organization GUID is required");

                if (yearGUID == Guid.Empty)
                    throw new BusinessException("Year GUID is required");

                // First get the user details for this combination
                var userDetail = await _context.MstUserDetails
                    .FirstOrDefaultAsync(ud => ud.strUserGUID == userGUID && 
                                             ud.strOrganizationGUID == organizationGUID &&
                                             ud.strYearGUID == yearGUID);

                if (userDetail == null)
                    throw new BusinessException("No user details found for this combination of user, organization, and year");

                // Get the role information
                var role = await _context.MstUserRoles
                    .FirstOrDefaultAsync(r => r.strUserRoleGUID == userDetail.strUserRoleGUID);

                if (role == null)
                    throw new BusinessException("Role not found");

                return new UserRoleInfoDto
                {
                    strUserRoleGUID = userDetail.strUserRoleGUID,
                    strRoleName = role.strName,
                    bolIsActive = userDetail.bolIsActive
                };
            }
            catch (BusinessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting role info. UserGUID: {UserGUID}, OrganizationGUID: {OrgGUID}, YearGUID: {YearGUID}", 
                    userGUID, organizationGUID, yearGUID);
                throw new BusinessException("An unexpected error occurred while getting role information");
            }
        }

        private async Task<UserDetailsResponseDto> GetEnrichedUserDetailsResponseAsync(MstUserDetails userDetail)
        {
            var dto = _mapper.Map<UserDetailsResponseDto>(userDetail);

            // Enrich with user name
            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strUserGUID == userDetail.strUserGUID);
            if (user != null)
            {
                dto.strUserName = user.strName;
            }

            // Enrich with role name
            var role = await _context.MstUserRoles
                .FirstOrDefaultAsync(r => r.strUserRoleGUID == userDetail.strUserRoleGUID);
            if (role != null)
            {
                dto.strUserRoleName = role.strName;
            }

            // Enrich with organization name
            var organization = await _context.MstOrganizations
                .FirstOrDefaultAsync(o => o.strOrganizationGUID == userDetail.strOrganizationGUID);
            if (organization != null)
            {
                dto.strOrganizationName = organization.strOrganizationName;
            }

            // Enrich with year name
            if (userDetail.strYearGUID != Guid.Empty)
            {
                var yearGuid = userDetail.strYearGUID;
                var year = await _context.Set<MstYear>()
                    .FirstOrDefaultAsync(y => y.strYearGUID == yearGuid);
                if (year != null)
                {
                    dto.strYearName = year.strName;
                }
            }

            // Enrich with creator name
            if (dto.strCreatedByGUID != Guid.Empty)
            {
                var creator = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == dto.strCreatedByGUID);
                dto.strCreatedBy = creator?.strName ?? "";
            }

            // Enrich with updater name
            if (dto.strUpdatedByGUID.HasValue && dto.strUpdatedByGUID.Value != Guid.Empty)
            {
                var updater = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == dto.strUpdatedByGUID.Value);
                dto.strUpdatedBy = updater?.strName ?? "";
            }

            return dto;
        }

        public async Task<BulkUserDetailsResponseDto> BulkUpsertAsync(UserDetailsBulkCreateDto bulkCreateDto, Guid userGuid, Guid groupGUID, Guid moduleGUID)
        {
            var response = new BulkUserDetailsResponseDto
            {
                TotalRequested = bulkCreateDto.strUserGUIDs.Count
            };

            try
            {
                _logger.LogInformation($"Starting BulkUpsertAsync for {bulkCreateDto.strUserGUIDs.Count} users with groupGUID: {groupGUID}, moduleGUID: {moduleGUID}");

                // Validate common fields once
                if (bulkCreateDto.strUserRoleGUID == Guid.Empty)
                {
                    throw new BusinessException("User Role GUID is required");
                }

                if (bulkCreateDto.strOrganizationGUID == Guid.Empty)
                {
                    throw new BusinessException("Organization GUID is required");
                }

                if (bulkCreateDto.strYearGUID == Guid.Empty)
                {
                    throw new BusinessException("Year GUID is required");
                }

                if (groupGUID == Guid.Empty)
                {
                    throw new BusinessException("Group GUID is required");
                }

                // Validate that the role exists and belongs to the group (once for all users)
                var role = await _context.MstUserRoles
                    .FirstOrDefaultAsync(r => r.strUserRoleGUID == bulkCreateDto.strUserRoleGUID && r.strGroupGUID == groupGUID);

                if (role == null)
                {
                    throw new BusinessException("User role not found or does not belong to your group");
                }

                // Validate that the organization exists and belongs to the group (once for all users)
                var organization = await _context.MstOrganizations
                    .FirstOrDefaultAsync(o => o.strOrganizationGUID == bulkCreateDto.strOrganizationGUID && o.strGroupGUID == groupGUID);

                if (organization == null)
                {
                    throw new BusinessException("Organization not found or does not belong to your group");
                }

                // Validate that the year exists and belongs to the organization (once for all users)
                var year = await _context.MstYears
                    .FirstOrDefaultAsync(y => y.strYearGUID == bulkCreateDto.strYearGUID && 
                                            y.strOrganizationGUID == bulkCreateDto.strOrganizationGUID &&
                                            y.strGroupGUID == groupGUID);

                if (year == null)
                {
                    throw new BusinessException("Year not found or does not belong to your organization");
                }

                // Get all existing user details for the given users in one query
                var existingUserDetails = await _context.MstUserDetails
                    .Where(ud => bulkCreateDto.strUserGUIDs.Contains(ud.strUserGUID) && 
                               ud.strOrganizationGUID == bulkCreateDto.strOrganizationGUID &&
                               ud.strYearGUID == bulkCreateDto.strYearGUID && 
                               ud.strModuleGUID == moduleGUID)
                    .ToListAsync();

                // Get all users in one query to validate they exist
                var validUsers = await _context.MstUsers
                    .Where(u => bulkCreateDto.strUserGUIDs.Contains(u.strUserGUID))
                    .Select(u => u.strUserGUID)
                    .ToListAsync();

                // Process each user GUID
                foreach (var userGuidToProcess in bulkCreateDto.strUserGUIDs)
                {
                    try
                    {
                        // Check if user exists
                        if (!validUsers.Contains(userGuidToProcess))
                        {
                            response.Errors.Add(new BulkUserDetailsErrorDto
                            {
                                strUserGUID = userGuidToProcess,
                                ErrorMessage = "User not found"
                            });
                            response.FailureCount++;
                            continue;
                        }

                        // Check if user detail already exists
                        var existingUserDetail = existingUserDetails.FirstOrDefault(ud => ud.strUserGUID == userGuidToProcess);

                        if (existingUserDetail != null)
                        {
                            // Update existing record
                            existingUserDetail.strUserRoleGUID = bulkCreateDto.strUserRoleGUID;
                            existingUserDetail.bolIsActive = bulkCreateDto.bolIsActive;
                            existingUserDetail.strUpdatedByGUID = userGuid;
                            existingUserDetail.dtUpdatedOn = CurrentDateTime;

                            await _context.SaveChangesAsync();

                            // Update user info
                            await UpdateUserInfoFromRequest(userGuidToProcess, bulkCreateDto.strOrganizationGUID, bulkCreateDto.strYearGUID, userGuid, moduleGUID);

                            var enrichedResponse = await GetEnrichedUserDetailsResponseAsync(existingUserDetail);
                            response.SuccessfulRecords.Add(enrichedResponse);
                            response.SuccessCount++;
                        }
                        else
                        {
                            // Create new record
                            var newUserDetail = new MstUserDetails
                            {
                                strUserDetailGUID = Guid.NewGuid(),
                                strUserGUID = userGuidToProcess,
                                strOrganizationGUID = bulkCreateDto.strOrganizationGUID,
                                strUserRoleGUID = bulkCreateDto.strUserRoleGUID,
                                strGroupGUID = groupGUID,
                                strYearGUID = bulkCreateDto.strYearGUID,
                                strModuleGUID = moduleGUID,
                                bolIsActive = bulkCreateDto.bolIsActive,
                                strCreatedByGUID = userGuid,
                                dtCreatedOn = CurrentDateTime,
                                strUpdatedByGUID = userGuid,
                                dtUpdatedOn = CurrentDateTime
                            };

                            _context.MstUserDetails.Add(newUserDetail);
                            await _context.SaveChangesAsync();

                            // Update user info
                            await UpdateUserInfoFromRequest(userGuidToProcess, bulkCreateDto.strOrganizationGUID, bulkCreateDto.strYearGUID, userGuid, moduleGUID);

                            var enrichedResponse = await GetEnrichedUserDetailsResponseAsync(newUserDetail);
                            response.SuccessfulRecords.Add(enrichedResponse);
                            response.SuccessCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error processing user {userGuidToProcess} in bulk upsert");
                        response.Errors.Add(new BulkUserDetailsErrorDto
                        {
                            strUserGUID = userGuidToProcess,
                            ErrorMessage = ex.Message
                        });
                        response.FailureCount++;
                    }
                }

                _logger.LogInformation($"BulkUpsertAsync completed. Success: {response.SuccessCount}, Failures: {response.FailureCount}");
                return response;
            }
            catch (BusinessException ex)
            {
                _logger.LogError(ex, "Business validation error in BulkUpsertAsync");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in BulkUpsertAsync");
                throw new BusinessException($"An unexpected error occurred during bulk operation: {ex.Message}");
            }
        }
    }
}
