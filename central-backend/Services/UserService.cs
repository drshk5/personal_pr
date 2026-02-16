using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.User;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Core;
using AuditSoftware.Models.Entities;
using Microsoft.Extensions.Logging;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using AuditSoftware.Helpers;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.Services
{
    public class UserService : ServiceBase, IUserService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IUserInfoService _userInfoService;
        private readonly IUserDetailsService _userDetailsService;
        private readonly IFileStorageService _fileStorageService;
        private readonly IActivityLogService _activityLogService;
        private readonly ILogger<UserService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserService(
            AppDbContext context, 
            IMapper mapper,
            IUserInfoService userInfoService,
            IUserDetailsService userDetailsService,
            IFileStorageService fileStorageService,
            IActivityLogService activityLogService,
            ILogger<UserService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _userInfoService = userInfoService;
            _userDetailsService = userDetailsService;
            _fileStorageService = fileStorageService;
            _activityLogService = activityLogService;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }


        public async Task<UserResponseDto> CreateAsync(UserCreateDto createDto, Guid createdByGUID, Guid groupGuid, Guid organizationGuid, Guid? yearGuid = null)
        {
            // Initial validations and setup
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(createDto.strPassword);
            var currentDateTime = CurrentDateTime;
            
            if (createDto.ProfileImgFile != null && createDto.ProfileImgFile.Length > 0)
            {
                try
                {
                    var imagePath = await _fileStorageService.SaveFileAsync(createDto.ProfileImgFile, "ProfileImages");
                    createDto.strProfileImg = imagePath;
                }
                catch (Exception ex)
                {
                    throw new BusinessException(
                        $"Failed to upload profile image file. Please try again. {ex.Message}",
                        "PROFILE_IMAGE_UPLOAD_FAILED"
                    );
                }
            }
            
            // Get moduleGUID from the current user
            Guid? moduleGuid = null;
            try 
            {
                moduleGuid = await _context.MstUsers
                    .Where(u => u.strUserGUID == createdByGUID)
                    .Select(u => u.strLastModuleGUID)
                    .FirstOrDefaultAsync() ?? Guid.Empty;
            } 
            catch (Exception) 
            {
                // Silently ignore if module guid not found
            }
            
            // Check for duplicate email
            var existingEmailUser = await _context.MstUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.strEmailId.ToLower() == createDto.strEmailId.ToLower());
            if (existingEmailUser != null)
            {
                throw new BusinessException("Email address already exists. Please use a different email.");
            }
            
            // Check for duplicate mobile
            if (!string.IsNullOrEmpty(createDto.strMobileNo))
            {
                var existingMobileUser = await _context.MstUsers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.strMobileNo == createDto.strMobileNo);
                if (existingMobileUser != null)
                {
                    throw new BusinessException("Mobile number already exists. Please use a different mobile number.");
                }
            }

            // Prepare user entity
            var user = _mapper.Map<MstUser>(createDto);
            user.strUserGUID = Guid.NewGuid();
            user.strPassword = passwordHash;
            user.strGroupGUID = groupGuid;
            // Map optional designation and department if provided
            user.strDesignationGUID = createDto.strDesignationGUID;
            user.strDepartmentGUID = createDto.strDepartmentGUID;
            user.strCreatedByGUID = createdByGUID;
            user.dtCreatedOn = currentDateTime;
            user.dtUpdatedOn = currentDateTime;
            user.strLastModuleGUID = moduleGuid;
            user.strProfileImg = createDto.strProfileImg;

            // Create execution strategy for the transaction
            var strategy = _context.Database.CreateExecutionStrategy();
            
            try
            {
                // Execute all database operations within the strategy
                return await strategy.ExecuteAsync(async () =>
                {
                    // Start transaction
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Add user to database
                        _context.MstUsers.Add(user);
                        await _context.SaveChangesAsync();

                        // Create activity log
                        var (ipAddress, userAgent) = GetRequestDetails();
                        var newLog = new MstUserActivityLog
                        {
                            UserGUID = createdByGUID,
                            GroupGUID = groupGuid,
                            ActivityType = "CREATE_USER",
                            Details = $"Created new user: {user.strName}",
                            OrganizationGUID = organizationGuid,
                            YearGUID = yearGuid,
                            ModuleGUID = moduleGuid,
                            EntityType = "User",
                            EntityGUID = user.strUserGUID,
                            IPAddress = ipAddress,
                            UserAgent = userAgent,
                            NewValue = System.Text.Json.JsonSerializer.Serialize(new 
                            {
                                name = user.strName,
                                email = user.strEmailId,
                                mobile = user.strMobileNo,
                                isActive = user.bolIsActive,
                                birthDate = user.dtBirthDate,
                                workingStartTime = user.dtWorkingStartTime?.ToString(),
                                workingEndTime = user.dtWorkingEndTime?.ToString(),
                                strDesignationGUID = user.strDesignationGUID,
                                strDepartmentGUID = user.strDepartmentGUID
                            })
                        };

                        _context.MstUserActivityLogs.Add(newLog);
                        await _context.SaveChangesAsync();
                        
                        // Create UserInfo entry
                        var userInfoDto = new DTOs.UserInfo.UserInfoCreateDto
                        {
                            strUserGUID = user.strUserGUID,
                            strModuleGUID = moduleGuid,
                            strLastOrganizationGUID = organizationGuid,
                            strLastYearGUID = yearGuid
                        };
                        
                        await _userInfoService.CreateAsync(userInfoDto, createdByGUID);
                        
                        // Create UserDetails entry
                        var userDetailsDto = new DTOs.UserDetails.UserDetailsCreateDto
                        {
                            strUserGUID = user.strUserGUID,
                            strUserRoleGUID = createDto.strRoleGUID,
                            strOrganizationGUID = organizationGuid,
                            strYearGUID = yearGuid ?? Guid.Empty,
                            bolIsActive = true
                        };
                        
                        await _userDetailsService.CreateAsync(userDetailsDto, createdByGUID, groupGuid, organizationGuid, moduleGuid);

                        // Commit transaction only if all operations succeed
                        await transaction.CommitAsync();

                        var responseDto = _mapper.Map<UserResponseDto>(user);
                        await EnrichWithUserNames(responseDto);
                        await EnrichWithDepartmentAndDesignationAsync(responseDto);
                        return responseDto;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during user creation transaction");
                        await transaction.RollbackAsync();
                        throw new BusinessException($"Failed to create user: {ex.Message}");
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user creation process");
                throw new BusinessException($"Failed to create user: {ex.Message}");
            }
        }

        private async Task EnrichWithUserNames(UserResponseDto response)
        {
            if (response.strCreatedByGUID != Guid.Empty)
            {
                var creator = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == response.strCreatedByGUID);
                response.strCreatedBy = creator?.strName ?? string.Empty;
            }

            if (response.strUpdatedByGUID != Guid.Empty)
            {
                var updater = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == response.strUpdatedByGUID);
                response.strUpdatedBy = updater?.strName ?? string.Empty;
            }
        }

        private async Task EnrichWithUserNames(IEnumerable<UserResponseDto> responses)
        {
            foreach (var response in responses)
            {
                await EnrichWithUserNames(response);
            }
        }

        private async Task EnrichWithDepartmentAndDesignationAsync(UserResponseDto response)
        {
            await EnrichWithDepartmentAndDesignationAsync(new List<UserResponseDto> { response });
        }

        private async Task EnrichWithDepartmentAndDesignationAsync(IEnumerable<UserResponseDto> responses)
        {
            var responseList = responses?.ToList() ?? new List<UserResponseDto>();
            if (!responseList.Any())
            {
                return;
            }

            var designationIds = responseList
                .Where(r => r.strDesignationGUID.HasValue)
                .Select(r => r.strDesignationGUID!.Value)
                .Distinct()
                .ToList();

            var departmentIds = responseList
                .Where(r => r.strDepartmentGUID.HasValue)
                .Select(r => r.strDepartmentGUID!.Value)
                .Distinct()
                .ToList();

            var designationLookup = designationIds.Any()
                ? await _context.MstDesignations
                    .Where(d => designationIds.Contains(d.strDesignationGUID))
                    .Select(d => new { d.strDesignationGUID, d.strName })
                    .ToDictionaryAsync(d => d.strDesignationGUID, d => d.strName)
                : new Dictionary<Guid, string>();

            var departmentLookup = departmentIds.Any()
                ? await _context.MstDepartments
                    .Where(d => departmentIds.Contains(d.strDepartmentGUID))
                    .Select(d => new { d.strDepartmentGUID, d.strDepartmentName })
                    .ToDictionaryAsync(d => d.strDepartmentGUID, d => d.strDepartmentName)
                : new Dictionary<Guid, string>();

            foreach (var response in responseList)
            {
                if (response.strDesignationGUID.HasValue &&
                    designationLookup.TryGetValue(response.strDesignationGUID.Value, out var designationName))
                {
                    response.strDesignationName = designationName;
                }
                else
                {
                    response.strDesignationName = null;
                }

                if (response.strDepartmentGUID.HasValue &&
                    departmentLookup.TryGetValue(response.strDepartmentGUID.Value, out var departmentName))
                {
                    response.strDepartmentName = departmentName;
                }
                else
                {
                    response.strDepartmentName = null;
                }
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

        public async Task<UserResponseDto> CreateUserAsync(UserCreateDto userDto, Guid createdByGuid, Guid groupGuid)
        {
            // Check if email already exists
            var emailExists = await _context.MstUsers.AnyAsync(u => u.strEmailId.ToLower() == userDto.strEmailId.ToLower());
            if (emailExists)
            {
                throw new BusinessException("Email already exists");
            }
            
            // Check if mobile number already exists
            if (!string.IsNullOrEmpty(userDto.strMobileNo))
            {
                var mobileExists = await _context.MstUsers.AnyAsync(u => u.strMobileNo == userDto.strMobileNo);
                if (mobileExists)
                {
                    throw new BusinessException("Mobile number already exists");
                }
            }

            // Hash the password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(userDto.strPassword);
            
            var currentDateTime = CurrentDateTime; // Use ServiceBase's CurrentDateTime
            
            // Map DTO to entity and set additional properties
            var user = _mapper.Map<MstUser>(userDto);
            user.strPassword = passwordHash;
            user.dtCreatedOn = currentDateTime;
            user.dtUpdatedOn = currentDateTime;
            
            // Set additional properties
            user.strUserGUID = Guid.NewGuid();
            user.strGroupGUID = groupGuid;
            user.strDesignationGUID = userDto.strDesignationGUID;
            user.strDepartmentGUID = userDto.strDepartmentGUID;
            user.strCreatedByGUID = createdByGuid;
            
            // Add to database
            _context.MstUsers.Add(user);
            await _context.SaveChangesAsync();
            
            var responseDto = _mapper.Map<UserResponseDto>(user);
            await EnrichWithUserNames(responseDto);
            await EnrichWithDepartmentAndDesignationAsync(responseDto);
            return responseDto;
        }

                public async Task<UserResponseDto> UpdateAsync(Guid guid, UserUpdateDto updateDto, Guid updatedByGUID)
        {
            try
            {
                var user = await _context.MstUsers.FindAsync(guid);
                if (user == null)
                {
                    throw new BusinessException("User not found");
                }

                // Check for duplicate email
                var emailUser = await _context.MstUsers
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.strEmailId.ToLower() == updateDto.strEmailId.ToLower() && u.strUserGUID != guid);
                if (emailUser != null)
                {
                    throw new BusinessException("Email address already exists");
                }

                // Check for duplicate mobile
                if (!string.IsNullOrEmpty(updateDto.strMobileNo))
                {
                    var mobileUser = await _context.MstUsers
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.strMobileNo == updateDto.strMobileNo && u.strUserGUID != guid);
                    if (mobileUser != null)
                    {
                        throw new BusinessException("Mobile number already exists");
                    }
                }

                // Store old values before any changes (including designation/department)
                var oldValues = System.Text.Json.JsonSerializer.Serialize(new
                {
                    name = user.strName,
                    email = user.strEmailId,
                    mobile = user.strMobileNo,
                    isActive = user.bolIsActive,
                    birthDate = user.dtBirthDate,
                    workingStartTime = user.dtWorkingStartTime?.ToString(),
                    workingEndTime = user.dtWorkingEndTime?.ToString(),
                    timeZone = user.strTimeZone,
                    strDesignationGUID = user.strDesignationGUID,
                    strDepartmentGUID = user.strDepartmentGUID
                });

                // Handle profile image
                bool isEmptyFile = updateDto.ProfileImgFile != null && updateDto.ProfileImgFile.Length == 0;
                bool isRemoveRequested = updateDto.RemoveProfileImage == true || isEmptyFile;

                if (isRemoveRequested)
                {
                    // User wants to remove the profile image
                    if (!string.IsNullOrEmpty(user.strProfileImg))
                    {
                        _fileStorageService.DeleteFile(user.strProfileImg);
                        // Set to empty string to remove from database
                        updateDto.strProfileImg = "";
                    }
                }
                else if (updateDto.ProfileImgFile != null && updateDto.ProfileImgFile.Length > 0)
                {
                    // User is uploading a new profile image
                    if (!string.IsNullOrEmpty(user.strProfileImg))
                    {
                        _fileStorageService.DeleteFile(user.strProfileImg);
                    }
                    updateDto.strProfileImg = await _fileStorageService.SaveFileAsync(updateDto.ProfileImgFile, "ProfileImages");
                }

                var strategy = _context.Database.CreateExecutionStrategy();
                return await strategy.ExecuteAsync(async () =>
                {
                    using var transaction = await _context.Database.BeginTransactionAsync();
                    try
                    {
                        // Update user fields
                        user.strName = updateDto.strName;
                        user.strMobileNo = updateDto.strMobileNo;
                        user.strEmailId = updateDto.strEmailId;
                        user.bolIsActive = updateDto.bolIsActive;
                        user.dtBirthDate = updateDto.dtBirthDate.HasValue ? 
                            new DateTime(updateDto.dtBirthDate.Value.Year, updateDto.dtBirthDate.Value.Month, updateDto.dtBirthDate.Value.Day, 0, 0, 0, DateTimeKind.Utc) : 
                            null;
                        user.dtWorkingStartTime = updateDto.dtWorkingStartTime;
                        user.dtWorkingEndTime = updateDto.dtWorkingEndTime;
                        // Update designation and department if provided
                        user.strDesignationGUID = updateDto.strDesignationGUID;
                        user.strDepartmentGUID = updateDto.strDepartmentGUID;
                        user.strTimeZone = updateDto.strTimeZone;
                        user.strUpdatedByGUID = updatedByGUID;
                        user.dtUpdatedOn = CurrentDateTime;

                        // Handle setting profile image path
                        if (updateDto.strProfileImg != null)
                        {
                            user.strProfileImg = updateDto.strProfileImg;
                        }

                        await _context.SaveChangesAsync();

                        // Track what fields were changed
                        var changedFields = new List<string>();
                        var oldUser = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(oldValues);
                        
                        if (oldUser != null)
                        {
                            var oldName = oldUser.GetValueOrDefault("name").GetString();
                            if (oldName != user.strName) 
                                changedFields.Add($"name from '{oldName ?? "not set"}' to '{user.strName}'");
                            
                            var oldEmail = oldUser.GetValueOrDefault("email").GetString();
                            if (oldEmail != user.strEmailId) 
                                changedFields.Add($"email from '{oldEmail ?? "not set"}' to '{user.strEmailId}'");
                            
                            var oldMobile = oldUser.GetValueOrDefault("mobile").GetString();
                            if (oldMobile != user.strMobileNo) 
                                changedFields.Add($"mobile number from '{oldMobile ?? "not set"}' to '{user.strMobileNo ?? "not set"}'");
                            
                            if (oldUser.TryGetValue("isActive", out var isActiveElement) && 
                                isActiveElement.ValueKind == JsonValueKind.True || isActiveElement.ValueKind == JsonValueKind.False)
                            {
                                var oldIsActive = isActiveElement.GetBoolean();
                                if (oldIsActive != user.bolIsActive)
                                    changedFields.Add($"active status from '{(oldIsActive ? "active" : "inactive")}' to '{(user.bolIsActive ? "active" : "inactive")}'");
                            }
                            
                            // Track profile image changes
                            bool isEmptyFile = updateDto.ProfileImgFile != null && updateDto.ProfileImgFile.Length == 0;
                            bool isRemoveRequested = updateDto.RemoveProfileImage == true || isEmptyFile;
                            
                            if (isRemoveRequested)
                                changedFields.Add("removed profile image");
                            else if (updateDto.ProfileImgFile != null && updateDto.ProfileImgFile.Length > 0) 
                                changedFields.Add("profile image");
                            
                            if (oldUser.TryGetValue("workingStartTime", out var startTimeElement))
                            {
                                var oldStartTime = startTimeElement.ValueKind != JsonValueKind.Null ? startTimeElement.GetString() : null;
                                var newStartTime = user.dtWorkingStartTime?.ToString();
                                if (oldStartTime != newStartTime)
                                    changedFields.Add($"working start time from '{oldStartTime ?? "not set"}' to '{newStartTime ?? "not set"}'");
                            }
                            
                            if (oldUser.TryGetValue("workingEndTime", out var endTimeElement))
                            {
                                var oldEndTime = endTimeElement.ValueKind != JsonValueKind.Null ? endTimeElement.GetString() : null;
                                var newEndTime = user.dtWorkingEndTime?.ToString();
                                if (oldEndTime != newEndTime)
                                    changedFields.Add($"working end time from '{oldEndTime ?? "not set"}' to '{newEndTime ?? "not set"}'");
                            }
                        }

                        // Format the details message
                        string details = changedFields.Count > 0 
                            ? $"Updated user {user.strName}'s {string.Join(", ", changedFields)}"
                            : $"Updated user {user.strName} (no fields changed)";

                        // Create activity log
                        var (ipAddress, userAgent) = GetRequestDetails();
                        var newLog = new MstUserActivityLog
                        {
                            UserGUID = updatedByGUID,
                            GroupGUID = user.strGroupGUID ?? Guid.Empty,
                            ActivityType = "UPDATE_USER",
                            Details = details,
                            EntityType = "User",
                            EntityGUID = user.strUserGUID,
                            OldValue = oldValues,
                            IPAddress = ipAddress,
                            UserAgent = userAgent,
                            NewValue = System.Text.Json.JsonSerializer.Serialize(new
                            {
                                name = user.strName,
                                email = user.strEmailId,
                                mobile = user.strMobileNo,
                                isActive = user.bolIsActive,
                                birthDate = user.dtBirthDate,
                                workingStartTime = user.dtWorkingStartTime?.ToString(),
                                workingEndTime = user.dtWorkingEndTime?.ToString(),
                                timeZone = user.strTimeZone,
                                strDesignationGUID = user.strDesignationGUID,
                                strDepartmentGUID = user.strDepartmentGUID
                            })
                        };

                        _context.MstUserActivityLogs.Add(newLog);
                        await _context.SaveChangesAsync();

                        await transaction.CommitAsync();

                        var response = _mapper.Map<UserResponseDto>(user);
                        await EnrichWithUserNames(response);
                        await EnrichWithDepartmentAndDesignationAsync(response);
                        return response;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error during user update transaction");
                        await transaction.RollbackAsync();
                        throw new BusinessException($"Failed to update user: {ex.Message}");
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user");
                throw new BusinessException($"Failed to update user: {ex.Message}");
            }
        }

        public async Task<bool> DeleteAsync(Guid guid, Guid deletedByGUID)
        {
            var user = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == guid);
            if (user == null)
            {
                return false;
            }

            if (user.bolSystemCreated)
            {
                throw new BusinessException("Cannot delete system-created user");
            }
            
            // Delete the profile image if it exists
            if (!string.IsNullOrEmpty(user.strProfileImg))
            {
                _fileStorageService.DeleteFile(user.strProfileImg);
            }

            // Create activity log before deletion
            var newLog = new MstUserActivityLog
            {
                UserGUID = deletedByGUID,
                GroupGUID = user.strGroupGUID ?? Guid.Empty,
                ActivityType = "DELETE_USER",
                Details = $"Deleted user: {user.strName}",
                EntityType = "User",
                EntityGUID = user.strUserGUID,
                OldValue = System.Text.Json.JsonSerializer.Serialize(new {
                    name = user.strName,
                    email = user.strEmailId,
                    mobile = user.strMobileNo,
                    isActive = user.bolIsActive,
                    birthDate = user.dtBirthDate,
                    workingStartTime = user.dtWorkingStartTime?.ToString("HH:mm:ss"),
                    workingEndTime = user.dtWorkingEndTime?.ToString("HH:mm:ss")
                })
            };
            _context.MstUserActivityLogs.Add(newLog);
            await _context.SaveChangesAsync();

            _context.MstUsers.Remove(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<UserResponseDto> GetByIdAsync(Guid guid)
        {
            var user = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == guid);
            if (user == null)
            {
                throw new BusinessException("User not found");
            }

            var response = _mapper.Map<UserResponseDto>(user);
            await EnrichWithUserNames(response);
            await EnrichWithDepartmentAndDesignationAsync(response);
            return response;
        }

        public async Task<PagedResponse<UserResponseDto>> GetAllAsync(UserFilterDto filterDto)
        {
            var query = _context.MstUsers.AsQueryable();

            // Filter by group GUID from token
            if (filterDto.GroupGUID.HasValue)
            {
                var guidToSearch = filterDto.GroupGUID.Value;
                query = query.Where(u => u.strGroupGUID == guidToSearch);
            }
            
            // Filter by active status if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(u => u.bolIsActive == filterDto.bolIsActive.Value);
            }
            
            // Filter by birth date range if provided
            if (filterDto.dtBirthDateFrom.HasValue)
            {
                query = query.Where(u => u.dtBirthDate.HasValue && u.dtBirthDate >= filterDto.dtBirthDateFrom);
            }
            
            if (filterDto.dtBirthDateUpto.HasValue)
            {
                query = query.Where(u => u.dtBirthDate.HasValue && u.dtBirthDate <= filterDto.dtBirthDateUpto);
            }
            
            // Filter by created by users if provided
            if (filterDto.strGUIDsCreatedBy != null && filterDto.strGUIDsCreatedBy.Any())
            {
                query = query.Where(u => filterDto.strGUIDsCreatedBy.Contains(u.strCreatedByGUID));
            }
            
            // Filter by updated by users if provided
            if (filterDto.strGUIDsUpdatedBy != null && filterDto.strGUIDsUpdatedBy.Any())
            {
                query = query.Where(u => u.strUpdatedByGUID != null && filterDto.strGUIDsUpdatedBy.Contains(u.strUpdatedByGUID.Value));
            }

            // Filter by designation(s) if provided
            if (filterDto.strDesignationGUIDs != null && filterDto.strDesignationGUIDs.Any())
            {
                query = query.Where(u => u.strDesignationGUID.HasValue && filterDto.strDesignationGUIDs.Contains(u.strDesignationGUID.Value));
            }

            // Filter by department(s) if provided
            if (filterDto.strDepartmentGUIDs != null && filterDto.strDepartmentGUIDs.Any())
            {
                query = query.Where(u => u.strDepartmentGUID.HasValue && filterDto.strDepartmentGUIDs.Contains(u.strDepartmentGUID.Value));
            }

            // Apply search filter across all fields (using the same pattern as PicklistValue)
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
                    // Show active users
                    query = query.Where(u => u.bolIsActive);
                    Console.WriteLine("Term matches 'active' pattern - will search for active records");
                }
                else if (isInactiveSearch)
                {
                    // Show inactive users
                    query = query.Where(u => !u.bolIsActive);
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
                        
                        query = query.Where(u => 
                            (u.dtCreatedOn >= startTime && u.dtCreatedOn <= endTime) ||
                            (u.dtUpdatedOn.HasValue && u.dtUpdatedOn.Value >= startTime && u.dtUpdatedOn.Value <= endTime) ||
                            (u.dtBirthDate.HasValue && u.dtBirthDate.Value >= startTime && u.dtBirthDate.Value <= endTime)
                        );
                    }
                    else
                    {
                        // Search for matching dates only (entire day)
                        var startOfDay = searchDate.Date;
                        var endOfDay = startOfDay.AddDays(1).AddTicks(-1);
                        
                        query = query.Where(u => 
                            (u.dtCreatedOn >= startOfDay && u.dtCreatedOn <= endOfDay) ||
                            (u.dtUpdatedOn.HasValue && u.dtUpdatedOn.Value >= startOfDay && u.dtUpdatedOn.Value <= endOfDay) ||
                            (u.dtBirthDate.HasValue && u.dtBirthDate.Value >= startOfDay && u.dtBirthDate.Value <= endOfDay)
                        );
                    }
                }
                                 else
                 {
                     // Check if the search term is a time - try multiple formats
                     bool isTime = false;
                     TimeSpan searchTime = TimeSpan.Zero;
                     
                     // Try different time formats
                     if (TimeSpan.TryParse(searchTerm, out searchTime))
                     {
                         isTime = true;
                     }
                     else if (searchTerm.Contains(":") && searchTerm.Split(':').Length >= 2)
                     {
                         // Try parsing HH:mm:ss format
                         var parts = searchTerm.Split(':');
                         if (parts.Length == 3 && 
                             int.TryParse(parts[0], out int hours) && 
                             int.TryParse(parts[1], out int minutes) && 
                             int.TryParse(parts[2], out int seconds))
                         {
                             searchTime = new TimeSpan(hours, minutes, seconds);
                             isTime = true;
                         }
                         else if (parts.Length == 2 && 
                                  int.TryParse(parts[0], out int h) && 
                                  int.TryParse(parts[1], out int m))
                         {
                             searchTime = new TimeSpan(h, m, 0);
                             isTime = true;
                         }
                     }
                     
                     if (isTime)
                     {
                         Console.WriteLine($"Time search detected: {searchTime}");
                         
                         // Search for time matches in working hours with more flexible matching
                         // Allow partial matches and different time formats
                         query = query.Where(u => 
                             (u.dtWorkingStartTime.HasValue && 
                              (u.dtWorkingStartTime.Value.ToString("HH:mm:ss").Contains(searchTerm) ||
                               u.dtWorkingStartTime.Value.ToString("HH:mm").Contains(searchTerm) ||
                               u.dtWorkingStartTime.Value.ToString("hh:mm tt").ToLower().Contains(searchTerm.ToLower()))) ||
                             (u.dtWorkingEndTime.HasValue && 
                              (u.dtWorkingEndTime.Value.ToString("HH:mm:ss").Contains(searchTerm) ||
                               u.dtWorkingEndTime.Value.ToString("HH:mm").Contains(searchTerm) ||
                               u.dtWorkingEndTime.Value.ToString("hh:mm tt").ToLower().Contains(searchTerm.ToLower())))
                         );
                     }
                     else
                     {
                         // Get users that match the search criteria (for Created By and Updated By)
                         var matchingUsers = await _context.MstUsers
                             .Where(u => u.strName != null && u.strName.ToLower().Contains(searchTerm))
                             .Select(u => u.strUserGUID)
                             .ToListAsync();

                         // Search on user fields and user names
                         query = query.Where(u =>
                             u.strUserGUID.ToString().ToLower().Contains(searchTerm) ||
                             u.strName.ToLower().Contains(searchTerm) ||
                             u.strEmailId.ToLower().Contains(searchTerm) ||
                             u.strMobileNo.Contains(searchTerm) ||
                             matchingUsers.Contains(u.strCreatedByGUID) ||
                             (u.strUpdatedByGUID != null && matchingUsers.Contains(u.strUpdatedByGUID.Value))
                         );
                     }
                 }
            }

            // Set default sort field if none provided
            string sortBy = !string.IsNullOrWhiteSpace(filterDto.SortBy) ? filterDto.SortBy.ToLower() : "strname";

            // Apply sorting
            switch (sortBy)
            {
                case "strname":
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.strName) : 
                        query.OrderByDescending(u => u.strName);
                    break;
                case "stremailid":
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.strEmailId) : 
                        query.OrderByDescending(u => u.strEmailId);
                    break;
                case "strmobileno":
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.strMobileNo) : 
                        query.OrderByDescending(u => u.strMobileNo);
                    break;
                case "dtworkingstarttime":
                case "starttime":
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.dtWorkingStartTime) : 
                        query.OrderByDescending(u => u.dtWorkingStartTime);
                    break;
                case "dtworkingendtime":
                case "endtime":
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.dtWorkingEndTime) : 
                        query.OrderByDescending(u => u.dtWorkingEndTime);
                    break;
                case "dtcreatedon":
                case "createdon":
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.dtCreatedOn) : 
                        query.OrderByDescending(u => u.dtCreatedOn);
                    break;
                case "dtupdatedon":
                case "updatedon":
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.dtUpdatedOn ?? DateTime.MaxValue) : 
                        query.OrderByDescending(u => u.dtUpdatedOn ?? DateTime.MaxValue);
                    break;
                case "strcreatedby":
                case "createdby":
                    query = filterDto.ascending ? 
                        query.Join(_context.MstUsers,
                            user => user.strCreatedByGUID,
                            creator => creator.strUserGUID,
                            (user, creator) => new { User = user, CreatorName = creator.strName })
                            .OrderBy(x => x.CreatorName)
                            .Select(x => x.User) :
                        query.Join(_context.MstUsers,
                            user => user.strCreatedByGUID,
                            creator => creator.strUserGUID,
                            (user, creator) => new { User = user, CreatorName = creator.strName })
                            .OrderByDescending(x => x.CreatorName)
                            .Select(x => x.User);
                    break;
                case "strupdatedby":
                case "updatedby":
                    query = filterDto.ascending ? 
                        query.GroupJoin(_context.MstUsers,
                            user => user.strUpdatedByGUID,
                            updater => updater.strUserGUID,
                            (user, updaters) => new { User = user, Updater = updaters.FirstOrDefault() })
                            .OrderBy(x => x.Updater != null ? x.Updater.strName : string.Empty)
                            .Select(x => x.User) :
                        query.GroupJoin(_context.MstUsers,
                            user => user.strUpdatedByGUID,
                            updater => updater.strUserGUID,
                            (user, updaters) => new { User = user, Updater = updaters.FirstOrDefault() })
                            .OrderByDescending(x => x.Updater != null ? x.Updater.strName : string.Empty)
                            .Select(x => x.User);
                    break;
                case "dtbirthdate":
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.dtBirthDate) : 
                        query.OrderByDescending(u => u.dtBirthDate);
                    break;
                case "status":
                case "bolisactive":
                    // Reversed logic: true (1) comes before false (0) in ascending order
                    // In SQL, this translates to: Active (true) comes before Inactive (false)
                    query = filterDto.ascending ? 
                        query.OrderByDescending(u => u.bolIsActive) : 
                        query.OrderBy(u => u.bolIsActive);
                    break;
                default:
                    query = filterDto.ascending ? 
                        query.OrderBy(u => u.strName) : 
                        query.OrderByDescending(u => u.strName);
                    break;
            }

            // Apply pagination and get total count
            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            // Map to DTOs and enrich with user names
            var dtos = _mapper.Map<List<UserResponseDto>>(items);
            await EnrichWithUserNames(dtos);
            await EnrichWithDepartmentAndDesignationAsync(dtos);

            return new PagedResponse<UserResponseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
            };
        }

        public async Task<PagedResponse<UserResponseDto>> GetByOrganizationModuleAsync(UserFilterByOrgModuleDto filterDto)
        {
            try
            {
                // Parse GUIDs
                if (!Guid.TryParse(filterDto.CurrentUserGUID, out var currentUserGuid))
                {
                    throw new BusinessException("Invalid user GUID format");
                }

                if (!Guid.TryParse(filterDto.ModuleGUID, out var moduleGuid))
                {
                    throw new BusinessException("Invalid module GUID format");
                }

                // Get organization GUID from current user's details for the specified module
                var userDetail = await _context.MstUserDetails
                    .FirstOrDefaultAsync(ud => ud.strUserGUID == currentUserGuid && ud.strModuleGUID == moduleGuid);

                if (userDetail == null)
                {
                    throw new BusinessException("User details not found for the specified module");
                }

                var organizationGuid = userDetail.strOrganizationGUID;

                // Get all users who have details for this organization and module
                var userGuidsInOrgModule = await _context.MstUserDetails
                    .Where(ud => ud.strOrganizationGUID == organizationGuid && ud.strModuleGUID == moduleGuid)
                    .Select(ud => ud.strUserGUID)
                    .Distinct()
                    .ToListAsync();

                // Get users with their details
                var query = _context.MstUsers
                    .Where(u => userGuidsInOrgModule.Contains(u.strUserGUID))
                    .AsQueryable();

                // Apply active filter if provided
                if (filterDto.bolIsActive.HasValue)
                {
                    query = query.Where(u => u.bolIsActive == filterDto.bolIsActive.Value);
                }

                // Apply birth date range filter
                if (filterDto.dtBirthDateFrom.HasValue)
                {
                    query = query.Where(u => u.dtBirthDate.HasValue && u.dtBirthDate.Value >= filterDto.dtBirthDateFrom.Value);
                }
                if (filterDto.dtBirthDateUpto.HasValue)
                {
                    query = query.Where(u => u.dtBirthDate.HasValue && u.dtBirthDate.Value <= filterDto.dtBirthDateUpto.Value);
                }

                // Apply created by filter
                if (filterDto.strGUIDsCreatedBy != null && filterDto.strGUIDsCreatedBy.Any())
                {
                    query = query.Where(u => filterDto.strGUIDsCreatedBy.Contains(u.strCreatedByGUID));
                }

                // Apply updated by filter
                if (filterDto.strGUIDsUpdatedBy != null && filterDto.strGUIDsUpdatedBy.Any())
                {
                    query = query.Where(u => u.strUpdatedByGUID.HasValue && filterDto.strGUIDsUpdatedBy.Contains(u.strUpdatedByGUID.Value));
                }

                // Apply designation filter
                if (filterDto.strDesignationGUIDs != null && filterDto.strDesignationGUIDs.Any())
                {
                    query = query.Where(u => u.strDesignationGUID.HasValue && filterDto.strDesignationGUIDs.Contains(u.strDesignationGUID.Value));
                }

                // Apply department filter
                if (filterDto.strDepartmentGUIDs != null && filterDto.strDepartmentGUIDs.Any())
                {
                    query = query.Where(u => u.strDepartmentGUID.HasValue && filterDto.strDepartmentGUIDs.Contains(u.strDepartmentGUID.Value));
                }

                // Get all filtered users
                var users = await query.ToListAsync();

                // Enrich with user details from the specific organization/module
                var enrichedDtos = new List<UserResponseDto>();
                foreach (var user in users)
                {
                    var userDetailForOrgModule = await _context.MstUserDetails
                        .FirstOrDefaultAsync(ud => ud.strUserGUID == user.strUserGUID && 
                                                  ud.strOrganizationGUID == organizationGuid && 
                                                  ud.strModuleGUID == moduleGuid);

                    var dto = _mapper.Map<UserResponseDto>(user);
                    
                    // Enrich with organization/role/year info
                    if (userDetailForOrgModule != null)
                    {
                        dto.strLastOrganizationGUID = userDetailForOrgModule.strOrganizationGUID.ToString();
                    }

                    enrichedDtos.Add(dto);
                }

                // Enrich with creator/updater names
                await EnrichWithUserNames(enrichedDtos);
                await EnrichWithDepartmentAndDesignationAsync(enrichedDtos);

                // Apply search on enriched data
                if (!string.IsNullOrWhiteSpace(filterDto.Search))
                {
                    var searchLower = filterDto.Search.ToLower().Trim();
                    enrichedDtos = enrichedDtos.Where(u =>
                        (u.strName?.ToLower().Contains(searchLower) ?? false) ||
                        (u.strEmailId?.ToLower().Contains(searchLower) ?? false) ||
                        (u.strMobileNo?.Contains(filterDto.Search) ?? false) ||
                        (u.strCreatedBy?.ToLower().Contains(searchLower) ?? false) ||
                        (u.strUpdatedBy?.ToLower().Contains(searchLower) ?? false) ||
                        (u.strDesignationName?.ToLower().Contains(searchLower) ?? false) ||
                        (u.strDepartmentName?.ToLower().Contains(searchLower) ?? false) ||
                        (u.bolIsActive.ToString().ToLower().Contains(searchLower))
                    ).ToList();
                }

                // Apply sorting on enriched data
                enrichedDtos = ApplySortingOnEnrichedData(enrichedDtos, filterDto.SortBy ?? "strname", filterDto.ascending);

                var totalCount = enrichedDtos.Count;
                var pagedDtos = enrichedDtos
                    .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                    .Take(filterDto.PageSize)
                    .ToList();

                return new PagedResponse<UserResponseDto>
                {
                    Items = pagedDtos,
                    TotalCount = totalCount,
                    PageNumber = filterDto.PageNumber,
                    PageSize = filterDto.PageSize,
                    TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
                };
            }
            catch (BusinessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetByOrganizationModuleAsync");
                throw new BusinessException("An error occurred while retrieving users by organization and module");
            }
        }

        private List<UserResponseDto> ApplySortingOnEnrichedData(List<UserResponseDto> users, string sortBy, bool ascending)
        {
            var sortedList = sortBy?.ToLower() switch
            {
                "strname" => ascending ? users.OrderBy(u => u.strName).ToList() : users.OrderByDescending(u => u.strName).ToList(),
                "stremailid" => ascending ? users.OrderBy(u => u.strEmailId).ToList() : users.OrderByDescending(u => u.strEmailId).ToList(),
                "strmobileno" => ascending ? users.OrderBy(u => u.strMobileNo).ToList() : users.OrderByDescending(u => u.strMobileNo).ToList(),
                "strcreatedby" or "createdby" => ascending ? users.OrderBy(u => u.strCreatedBy).ToList() : users.OrderByDescending(u => u.strCreatedBy).ToList(),
                "strupdatedby" or "updatedby" => ascending ? users.OrderBy(u => u.strUpdatedBy).ToList() : users.OrderByDescending(u => u.strUpdatedBy).ToList(),
                "strdesignationname" => ascending ? users.OrderBy(u => u.strDesignationName).ToList() : users.OrderByDescending(u => u.strDesignationName).ToList(),
                "strdepartmentname" => ascending ? users.OrderBy(u => u.strDepartmentName).ToList() : users.OrderByDescending(u => u.strDepartmentName).ToList(),
                "dtcreatedon" or "createdon" => ascending ? users.OrderBy(u => u.dtCreatedOn).ToList() : users.OrderByDescending(u => u.dtCreatedOn).ToList(),
                "dtupdatedon" or "updatedon" => ascending ? users.OrderBy(u => u.dtUpdatedOn ?? DateTime.MaxValue).ToList() : users.OrderByDescending(u => u.dtUpdatedOn ?? DateTime.MaxValue).ToList(),
                "dtbirthdate" => ascending ? users.OrderBy(u => u.dtBirthDate).ToList() : users.OrderByDescending(u => u.dtBirthDate).ToList(),
                "bolisactive" or "status" => ascending ? users.OrderByDescending(u => u.bolIsActive).ToList() : users.OrderBy(u => u.bolIsActive).ToList(),
                "dtworkingstarttime" or "starttime" => ascending ? users.OrderBy(u => u.dtWorkingStartTime).ToList() : users.OrderByDescending(u => u.dtWorkingStartTime).ToList(),
                "dtworkingendtime" or "endtime" => ascending ? users.OrderBy(u => u.dtWorkingEndTime).ToList() : users.OrderByDescending(u => u.dtWorkingEndTime).ToList(),
                _ => ascending ? users.OrderBy(u => u.strName).ToList() : users.OrderByDescending(u => u.strName).ToList()
            };

            return sortedList;
        }

        public async Task<bool> ValidateCredentialsAsync(string emailId, string password)
        {
            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strEmailId.ToLower() == emailId.ToLower());

            if (user == null)
            {
                return false;
            }

            var hashedPassword = HashPassword(password);
            return user.strPassword == hashedPassword;
        }

        public async Task<MstUser?> GetByEmailAsync(string emailId)
        {
            return await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strEmailId.ToLower() == emailId.ToLower());
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportUsersAsync(string format, Guid groupGuid)
        {
            try
            {
                // Validate format
                if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
                {
                    throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
                }
                
                // Validate groupGuid (Guid is a value type so it can't be null, but we keep the check for clarity)
                if (groupGuid == Guid.Empty)
                {
                    throw new BusinessException("Group GUID cannot be empty");
                }

                // Get all users for the specified group
                var users = await _context.MstUsers
                    .Where(u => u.strGroupGUID == groupGuid)
                    .OrderBy(u => u.strName)
                    .ToListAsync();
                
                if (users == null || !users.Any())
                {
                    throw new BusinessException("No users found to export");
                }

                // Get user information for created by and updated by
                var userGuids = new List<Guid>();
                foreach (var user in users)
                {
                    // strCreatedByGUID is required so we don't need a null check
                    userGuids.Add(user.strCreatedByGUID);
                    
                    // strUpdatedByGUID is nullable so we need to check
                    if (user.strUpdatedByGUID.HasValue)
                        userGuids.Add(user.strUpdatedByGUID.Value);
                }
                userGuids = userGuids.Distinct().ToList();

                // Dictionary to store user name lookups
                var userNames = new Dictionary<Guid, string>();
                
                if (userGuids.Any())
                {
                    var creatorUpdaters = await _context.MstUsers
                        .Where(u => userGuids.Contains(u.strUserGUID))
                        .Select(u => new { u.strUserGUID, u.strName })
                        .ToListAsync();
                        
                    foreach (var user in creatorUpdaters)
                    {
                        if (!userNames.ContainsKey(user.strUserGUID))
                        {
                            userNames.Add(user.strUserGUID, user.strName ?? "");
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
                        var worksheet = workbook.Worksheets.Add("Users");
                        
                        // Add headers
                        worksheet.Cell(1, 1).Value = "Name";
                        worksheet.Cell(1, 2).Value = "Email";
                        worksheet.Cell(1, 3).Value = "Mobile No";
                        worksheet.Cell(1, 4).Value = "Birth Date";
                        worksheet.Cell(1, 5).Value = "Working Start Time";
                        worksheet.Cell(1, 6).Value = "Working End Time";
                        worksheet.Cell(1, 7).Value = "Is Active";
                        worksheet.Cell(1, 8).Value = "Is Super Admin";
                        worksheet.Cell(1, 9).Value = "Created By";
                        worksheet.Cell(1, 10).Value = "Created On";
                        worksheet.Cell(1, 11).Value = "Updated By";
                        worksheet.Cell(1, 12).Value = "Updated On";
                        
                        // Style header row
                        var headerRow = worksheet.Row(1);
                        headerRow.Style.Font.Bold = true;
                        headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                        
                        // Add data
                        for (int i = 0; i < users.Count; i++)
                        {
                            try
                            {
                                var user = users[i];
                                int row = i + 2;
                                
                                // Get user names for created by and updated by
                                string createdByName = "";
                                if (userNames.ContainsKey(user.strCreatedByGUID))
                                {
                                    createdByName = userNames[user.strCreatedByGUID];
                                }
                                
                                string updatedByName = "";
                                if (user.strUpdatedByGUID.HasValue && userNames.ContainsKey(user.strUpdatedByGUID.Value))
                                {
                                    updatedByName = userNames[user.strUpdatedByGUID.Value];
                                }
                                
                                // Set values with explicit null checks
                                worksheet.Cell(row, 1).Value = user.strName ?? "";
                                worksheet.Cell(row, 2).Value = user.strEmailId ?? "";
                                worksheet.Cell(row, 3).Value = user.strMobileNo ?? "";
                                
                                // Handle dates carefully
                                if (user.dtBirthDate.HasValue)
                                {
                                    try { worksheet.Cell(row, 4).Value = user.dtBirthDate.Value.ToString("yyyy-MM-dd"); }
                                    catch { worksheet.Cell(row, 4).Value = ""; }
                                }
                                else
                                {
                                    worksheet.Cell(row, 4).Value = "";
                                }
                                
                                if (user.dtWorkingStartTime.HasValue)
                                {
                                    try { worksheet.Cell(row, 5).Value = user.dtWorkingStartTime.Value.ToString("HH:mm"); }
                                    catch { worksheet.Cell(row, 5).Value = ""; }
                                }
                                else
                                {
                                    worksheet.Cell(row, 5).Value = "";
                                }
                                
                                if (user.dtWorkingEndTime.HasValue)
                                {
                                    try { worksheet.Cell(row, 6).Value = user.dtWorkingEndTime.Value.ToString("HH:mm"); }
                                    catch { worksheet.Cell(row, 6).Value = ""; }
                                }
                                else
                                {
                                    worksheet.Cell(row, 6).Value = "";
                                }
                                
                                worksheet.Cell(row, 7).Value = user.bolIsActive ? "Active" : "Inactive";
                                worksheet.Cell(row, 8).Value = user.bolIsSuperAdmin ? "Yes" : "No";
                                worksheet.Cell(row, 9).Value = createdByName;
                                
                                try { worksheet.Cell(row, 10).Value = user.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss"); }
                                catch { worksheet.Cell(row, 10).Value = ""; }
                                
                                worksheet.Cell(row, 11).Value = updatedByName;
                                
                                if (user.dtUpdatedOn.HasValue)
                                {
                                    try { worksheet.Cell(row, 12).Value = user.dtUpdatedOn.Value.ToString("yyyy-MM-dd HH:mm:ss"); }
                                    catch { worksheet.Cell(row, 12).Value = ""; }
                                }
                                else
                                {
                                    worksheet.Cell(row, 12).Value = "";
                                }
                            }
                            catch (Exception ex)
                            {
                                // Log but continue with other rows
                                Console.WriteLine($"Error processing user row {i+1}: {ex.Message}");
                            }
                        }

                        // Auto-fit columns
                        worksheet.Columns().AdjustToContents();
                        
                        // Convert to byte array
                        using var stream = new MemoryStream();
                        workbook.SaveAs(stream);
                        stream.Position = 0;
                        
                        return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Users_{timestamp}.xlsx");
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
                        csv.AppendLine("Name,Email,Mobile No,Birth Date,Working Start Time,Working End Time,Is Active,Is Super Admin,Created By,Created On,Updated By,Updated On");
                    
                        // Add data rows
                        foreach (var user in users)
                        {
                            try
                            {
                                // Get user names for created by and updated by
                                string createdByName = "";
                                if (userNames.ContainsKey(user.strCreatedByGUID))
                                {
                                    createdByName = userNames[user.strCreatedByGUID];
                                }
                                
                                string updatedByName = "";
                                if (user.strUpdatedByGUID.HasValue && userNames.ContainsKey(user.strUpdatedByGUID.Value))
                                {
                                    updatedByName = userNames[user.strUpdatedByGUID.Value];
                                }
                                
                                // Format dates with try-catch to handle any potential issues
                                string birthDateStr = "";
                                if (user.dtBirthDate.HasValue)
                                {
                                    try { birthDateStr = user.dtBirthDate.Value.ToString("yyyy-MM-dd"); }
                                    catch { /* ignore formatting errors */ }
                                }
                                
                                string workStartStr = "";
                                if (user.dtWorkingStartTime.HasValue)
                                {
                                    try { workStartStr = user.dtWorkingStartTime.Value.ToString("HH:mm"); }
                                    catch { /* ignore formatting errors */ }
                                }
                                
                                string workEndStr = "";
                                if (user.dtWorkingEndTime.HasValue)
                                {
                                    try { workEndStr = user.dtWorkingEndTime.Value.ToString("HH:mm"); }
                                    catch { /* ignore formatting errors */ }
                                }
                                
                                string createdOnStr = "";
                                try { createdOnStr = user.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss"); }
                                catch { /* ignore formatting errors */ }
                                
                                string updatedOnStr = "";
                                if (user.dtUpdatedOn.HasValue)
                                {
                                    try { updatedOnStr = user.dtUpdatedOn.Value.ToString("yyyy-MM-dd HH:mm:ss"); }
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
                                    EscapeField(user.strName ?? ""),
                                    EscapeField(user.strEmailId ?? ""),
                                    EscapeField(user.strMobileNo ?? ""),
                                    birthDateStr,
                                    workStartStr,
                                    workEndStr,
                                    user.bolIsActive ? "Active" : "Inactive",
                                    user.bolIsSuperAdmin ? "Yes" : "No",
                                    EscapeField(createdByName),
                                    createdOnStr,
                                    EscapeField(updatedByName),
                                    updatedOnStr
                                ));
                            }
                            catch (Exception ex)
                            {
                                // Log error but continue with other rows
                                Console.WriteLine($"Error processing row for user {user.strUserGUID}: {ex.Message}");
                                // Add a placeholder row to maintain data integrity
                                csv.AppendLine($"\"{user.strName ?? "Unknown"}\",\"Error processing this user's data\",,,,,,,,,");
                            }
                        }
                        
                        // Convert to bytes
                        byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                        
                        return (bytes, "text/csv", $"Users_{timestamp}.csv");
                    }
                    catch (Exception ex)
                    {
                        throw new BusinessException($"Error creating CSV export: {ex.Message}");
                    }
                }
            }
            catch (FormatException ex)
            {
                throw new BusinessException($"Format error while exporting users: {ex.Message}. Please check data formats (especially dates and GUIDs).");
            }
            catch (Exception ex)
            {
                // Log detailed exception information for debugging
                Console.WriteLine($"Export error - Type: {ex.GetType().Name}, Message: {ex.Message}, StackTrace: {ex.StackTrace}");
                throw new BusinessException($"Error exporting users: {ex.Message}");
            }
        }
    }
}
