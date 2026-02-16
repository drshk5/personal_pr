using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Linq.Dynamic.Core;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Group;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Organization;
using AuditSoftware.DTOs.UserRole;
using AuditSoftware.DTOs.User;
using AuditSoftware.DTOs.UserRights;
using AuditSoftware.DTOs.Year;
using AuditSoftware.DTOs.PicklistValue;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;
using System.ComponentModel.DataAnnotations;
using ClosedXML.Excel;
using AuditSoftware.Helpers;

namespace AuditSoftware.Services;

public class GroupService :  ServiceBase, IGroupService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GroupService> _logger;
    private readonly IPicklistValueService _picklistValueService;
    private readonly IWebHostEnvironment _environment;
    private readonly IFileStorageService _fileStorageService;

    public GroupService(
        AppDbContext context, 
        IMapper mapper, 
        ILogger<GroupService> logger,
        IPicklistValueService picklistValueService,
        IWebHostEnvironment environment,
        IFileStorageService fileStorageService)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
        _picklistValueService = picklistValueService;
        _environment = environment;
        _fileStorageService = fileStorageService;
    }

    public async Task<PagedResponse<GroupResponseDto>> GetAllGroupsAsync(
        int pageNumber,
        int pageSize,
        string? sortBy,
        bool ascending,
        string? search)
    {
        try
        {
            var query = _context.MstGroups.AsQueryable();

            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.ToLower().Trim();
                
                // Check for specialized search commands
                if (searchTerm.StartsWith("license:"))
                {
                    // Example search format: "license:expired" or "license:valid"
                    string licenseStatus = searchTerm.Substring(8).Trim();
                    DateTime today = DateTime.Today;
                    
                    if (licenseStatus == "expired")
                    {
                        query = query.Where(c => c.dtLicenseExpired < today);
                        _logger.LogInformation("Searching for groups with expired licenses");
                    }
                    else if (licenseStatus == "valid")
                    {
                        query = query.Where(c => c.dtLicenseExpired >= today);
                        _logger.LogInformation("Searching for groups with valid licenses");
                    }
                    else if (DateTime.TryParse(licenseStatus, out DateTime licenseDate))
                    {
                        // Search for specific license date (e.g., "license:2025-12-31")
                        query = query.Where(c => c.dtLicenseExpired.Date == licenseDate.Date || 
                                                c.dtLicenseIssueDate.Date == licenseDate.Date);
                        _logger.LogInformation($"Searching for groups with license date: {licenseDate.ToShortDateString()}");
                    }
                }
                // Check for date range search
                else if (searchTerm.StartsWith("created:"))
                {
                    string dateString = searchTerm.Substring(8).Trim();
                    if (DateTime.TryParse(dateString, out DateTime createdDate))
                    {
                        query = query.Where(c => c.dtCreatedOn.Date == createdDate.Date);
                        _logger.LogInformation($"Searching for groups created on: {createdDate.ToShortDateString()}");
                    }
                }
                else if (searchTerm.StartsWith("updated:"))
                {
                    string dateString = searchTerm.Substring(8).Trim();
                    if (DateTime.TryParse(dateString, out DateTime updatedDate))
                    {
                        query = query.Where(c => c.dtUpdatedOn.HasValue && c.dtUpdatedOn.Value.Date == updatedDate.Date);
                        _logger.LogInformation($"Searching for groups updated on: {updatedDate.ToShortDateString()}");
                    }
                }
                // Standard search across all text fields
                else
                {
                    // Check if search term is a valid date for separate date filtering
                    DateTime? searchDate = null;
                    if (searchTerm.Length >= 8)
                    {
                        try
                        {
                            searchDate = DateTime.Parse(searchTerm);
                            _logger.LogInformation($"Search term parsed as date: {searchDate.Value.ToShortDateString()}");
                        }
                        catch
                        {
                            _logger.LogInformation("Search term is not a valid date");
                        }
                    }
                    
                    // Comprehensive search across all text fields
                    query = query.Where(c =>
                        (c.strName != null && c.strName.ToLower().Contains(searchTerm)) ||
                        (c.strLicenseNo != null && c.strLicenseNo.ToLower().Contains(searchTerm)) ||
                        (c.strPAN != null && c.strPAN.ToLower().Contains(searchTerm)) ||
                        (c.strTAN != null && c.strTAN.ToLower().Contains(searchTerm)) ||
                        (c.strCIN != null && c.strCIN.ToLower().Contains(searchTerm)) ||
                        (c.strLogo != null && c.strLogo.ToLower().Contains(searchTerm)) ||
                        (c.strCreatedByGUID != null && c.strCreatedByGUID.ToLower().Contains(searchTerm)) ||
                        (c.strUpdatedByGUID != null && c.strUpdatedByGUID.ToLower().Contains(searchTerm))
                    );
                    
                    // Apply date filtering if the search term is a valid date
                    if (searchDate.HasValue)
                    {
                        DateTime dateValue = searchDate.Value.Date;
                        query = query.Where(c =>
                            c.dtLicenseIssueDate.Date == dateValue || 
                            c.dtLicenseExpired.Date == dateValue || 
                            c.dtCreatedOn.Date == dateValue || 
                            (c.dtUpdatedOn.HasValue && c.dtUpdatedOn.Value.Date == dateValue)
                        );
                    }
                    
                    _logger.LogInformation($"Performing comprehensive search with term: {searchTerm}");
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(sortBy))
            {
                var direction = ascending ? "asc" : "desc";
                query = query.OrderBy($"{sortBy} {direction}");
            }
            else
            {
                // Default sorting by name
                query = ascending 
                    ? query.OrderBy(c => c.strName)
                    : query.OrderByDescending(c => c.strName);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Map to DTOs
            var dtos = _mapper.Map<List<GroupResponseDto>>(items);

            return new PagedResponse<GroupResponseDto>
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
            _logger.LogError(ex, "Error occurred while getting groups");
            throw;
        }
    }

    public async Task<GroupResponseDto?> GetGroupByIdAsync(Guid guid)
    {
        var group = await _context.MstGroups
            .FirstOrDefaultAsync(g => g.strGroupGUID == guid);

        if (group == null)
            return null;

        return _mapper.Map<GroupResponseDto>(group);
    }

    public async Task<GroupResponseDto> CreateGroupAsync(GroupCreateDto groupDto, string userGuid)
    {
        try
        {
            // Check if group name already exists
            var existingName = await _context.MstGroups
                .AnyAsync(g => g.strName.ToLower() == groupDto.strName.ToLower());

            if (existingName)
            {
                throw new BusinessException(
                    $"A group with name '{groupDto.strName}' already exists.",
                    "DUPLICATE_NAME"
                );
            }

            // Check if PAN already exists
            if (!string.IsNullOrEmpty(groupDto.strPAN))
            {
                var existingPAN = await _context.MstGroups
                    .AnyAsync(g => g.strPAN != null && g.strPAN.ToLower() == groupDto.strPAN.ToLower());

                if (existingPAN)
                {
                    throw new BusinessException(
                        $"A group with PAN number '{groupDto.strPAN}' already exists.",
                        "DUPLICATE_PAN"
                    );
                }
            }

            // Check if TAN already exists
            if (!string.IsNullOrEmpty(groupDto.strTAN))
            {
                var existingTAN = await _context.MstGroups
                    .AnyAsync(g => g.strTAN != null && g.strTAN.ToLower() == groupDto.strTAN.ToLower());

                if (existingTAN)
                {
                    throw new BusinessException(
                        $"A group with TAN number '{groupDto.strTAN}' already exists.",
                        "DUPLICATE_TAN"
                    );
                }
            }

            // Check if CIN already exists
            if (!string.IsNullOrEmpty(groupDto.strCIN))
            {
                var existingCIN = await _context.MstGroups
                    .AnyAsync(g => g.strCIN != null && g.strCIN.ToLower() == groupDto.strCIN.ToLower());

                if (existingCIN)
                {
                    throw new BusinessException(
                        $"A group with CIN number '{groupDto.strCIN}' already exists.",
                        "DUPLICATE_CIN"
                    );
                }
            }

            // Check if License Number already exists
            if (!string.IsNullOrEmpty(groupDto.strLicenseNo))
            {
                var existingLicense = await _context.MstGroups
                    .AnyAsync(g => g.strLicenseNo != null && g.strLicenseNo.ToLower() == groupDto.strLicenseNo.ToLower());

                if (existingLicense)
                {
                    throw new BusinessException(
                        $"A group with License number '{groupDto.strLicenseNo}' already exists.",
                        "DUPLICATE_LICENSE"
                    );
                }
            }
            
            // Handle logo upload if provided
            if (groupDto.LogoFile != null && groupDto.LogoFile.Length > 0)
            {
                try
                {
                    var logoPath = await _fileStorageService.SaveFileAsync(groupDto.LogoFile, "GroupLogos");
                    groupDto.strLogo = logoPath;
                    _logger.LogInformation($"Logo saved successfully at path: {logoPath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error uploading logo file");
                    throw new BusinessException(
                        "Failed to upload logo file. Please try again.",
                        "LOGO_UPLOAD_FAILED"
                    );
                }
            }

            // Check if admin email already exists
            var existingEmail = await _context.MstUsers
                .AnyAsync(u => u.strEmailId.ToLower() == groupDto.strAdminEmailId.ToLower());

            if (existingEmail)
            {
                throw new BusinessException(
                    $"A user with email '{groupDto.strAdminEmailId}' already exists.",
                    "DUPLICATE_EMAIL"
                );
            }
            
            // Check if admin mobile number already exists
            var existingMobile = await _context.MstUsers
                .AnyAsync(u => u.strMobileNo == groupDto.strAdminMobileNo);
                
            if (existingMobile)
            {
                throw new BusinessException(
                    $"A group with this Mobile number already exists.",
                    "DUPLICATE_MOBILE"
                );
            }

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var currentDateTime = CurrentDateTime;

                    // Create group first
                    var group = _mapper.Map<MstGroup>(groupDto);
                    group.strGroupGUID = Guid.NewGuid();
                    group.dtCreatedOn = currentDateTime;
                    group.dtUpdatedOn = currentDateTime;
                    group.strCreatedByGUID = userGuid;
                    group.strUpdatedByGUID = userGuid;

                    _logger.LogInformation("About to add group to context: {@Group}", new {
                        group.strGroupGUID,
                        group.strName,
                        group.strLicenseNo,
                        group.strPAN,
                        group.strTAN,
                        group.strCIN,
                        group.dtLicenseIssueDate,
                        group.dtLicenseExpired
                    });

                    _context.MstGroups.Add(group);
                    
                    try 
                    {
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("Group saved successfully with GUID: {GroupGUID}", group.strGroupGUID);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to save group. Error details: {ErrorMessage}", ex.Message);
                        if (ex.InnerException != null)
                        {
                            _logger.LogError("Inner exception: {InnerMessage}", ex.InnerException.Message);
                        }
                        throw new BusinessException($"Failed to create group: {ex.Message}", "GROUP_CREATION_FAILED");
                    }

                    // Create admin user first
                    var adminUser = new MstUser
                    {
                        strUserGUID = Guid.NewGuid(),
                        strName = groupDto.strAdminName,
                        strMobileNo = groupDto.strAdminMobileNo,
                        strEmailId = groupDto.strAdminEmailId,
                        strPassword = HashPassword(groupDto.strAdminPassword),
                        strGroupGUID = group.strGroupGUID,
                        bolIsActive = true,
                        bolSystemCreated = true, // Set this flag to true as this user is created during group creation
                        strTimeZone = groupDto.strTimeZone, // Set timezone from the group DTO
                        dtCreatedOn = currentDateTime,
                        dtUpdatedOn = currentDateTime,
                        strCreatedByGUID = Guid.Parse(userGuid), // Created by super admin is correct since super admin is creating this user
                        strUpdatedByGUID = Guid.Parse(userGuid), // Updated by super admin is correct since super admin is creating this user
                        // Assign designation/department to admin user if provided in request
                        strDesignationGUID = !string.IsNullOrEmpty(groupDto.strDesignationGUID) ? Guid.Parse(groupDto.strDesignationGUID) : (Guid?)null,
                        strDepartmentGUID = !string.IsNullOrEmpty(groupDto.strDepartmentGUID) ? Guid.Parse(groupDto.strDepartmentGUID) : (Guid?)null,
                        bolIsSuperAdmin = false
                    };

                    _context.MstUsers.Add(adminUser);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Admin user created successfully with GUID: {UserGUID}", adminUser.strUserGUID);
                    
                    // Use the GUIDs directly from the request body
                    string? industryGUID = groupDto.strIndustryGUID;
                    string? legalStatusTypeGUID = groupDto.strLegalStatusTypeGUID;
                    // Currency type has been removed

                    // Create organization with same name as group using DTO
                    var organizationDto = new OrganizationCreateDto
                    {
                        strOrganizationName = group.strName,
                        strDescription = $"Default organization for {group.strName}",
                        strPAN = group.strPAN,
                        strTAN = group.strTAN,
                        strCIN = group.strCIN,
                        strUDFCode = groupDto.strUDFCode,
                        strParentOrganizationGUID = null,
                        strLogo = group.strLogo, // Set organization logo same as group logo
                        bolIsActive = true,
                        strIndustryGUID = !string.IsNullOrEmpty(industryGUID) ? Guid.Parse(industryGUID) : null, // Use directly from request
                        strLegalStatusTypeGUID = !string.IsNullOrEmpty(legalStatusTypeGUID) ? Guid.Parse(legalStatusTypeGUID) : null, // Use directly from request
                        strCurrencyTypeGUID = groupDto.strCurrencyGUID,
                        dtClientAcquiredDate = CurrentDateTime,
                        // Tax and country fields
                        strCountryGUID = groupDto.strCountryGUID,
                        strTaxTypeGUID = groupDto.strTaxTypeGUID,
                        strTaxRegNo = groupDto.strTaxRegNo,
                        strStateGUID = groupDto.strStateGUID,
                        dtRegistrationDate = groupDto.dtRegistrationDate,
                        bolIsDefaultTaxConfig = groupDto.bolIsDefaultTaxConfig,
                        bolIsTaxApplied = groupDto.bolIsTaxApplied,
                        jsonTaxSettings = groupDto.jsonTaxSettings
                    };

                    // Validate organizationDto
                    var orgValidationContext = new ValidationContext(organizationDto);
                    var orgValidationResults = new List<ValidationResult>();
                    bool isOrgValid = Validator.TryValidateObject(organizationDto, orgValidationContext, orgValidationResults, true);

                    if (!isOrgValid)
                    {
                        var errorMessages = string.Join(", ", orgValidationResults.Select(r => r.ErrorMessage));
                        throw new BusinessException($"OrganizationCreateDto validation failed: {errorMessages}", "VALIDATION_ERROR");
                    }
                    
                    // Map to entity - use admin user's GUID instead of super admin
                    var organization = _mapper.Map<MstOrganization>(organizationDto);
                    organization.strOrganizationGUID = Guid.NewGuid();
                    // UPDATED: Changed from group.strGUID to group.strGroupGUID to follow naming convention
                    organization.strGroupGUID = group.strGroupGUID;
                    organization.bolSystemCreated = true; // Set this flag to true as this organization is created during group creation
                    organization.strCreatedByGUID = adminUser.strUserGUID;
                    organization.dtCreatedOn = currentDateTime;
                    organization.strUpdatedByGUID = adminUser.strUserGUID;
                    organization.dtUpdatedOn = currentDateTime;
                    
                    _context.MstOrganizations.Add(organization);
                    await _context.SaveChangesAsync();

                    // Create tax configuration if tax type is provided
                    if (groupDto.strTaxTypeGUID.HasValue && !string.IsNullOrWhiteSpace(groupDto.strTaxRegNo))
                    {
                        _logger.LogInformation($"Creating tax configuration for organization {organization.strOrganizationGUID}");
                        
                        var taxConfig = new MstOrgTaxConfig
                        {
                            strOrgTaxConfigGUID = Guid.NewGuid(),
                            strOrganizationGUID = organization.strOrganizationGUID,
                            strTaxTypeGUID = groupDto.strTaxTypeGUID.Value,
                            strTaxRegNo = groupDto.strTaxRegNo,
                            strStateGUID = groupDto.strStateGUID,
                            dtRegistrationDate = groupDto.dtRegistrationDate,
                            bolIsDefault = groupDto.bolIsDefaultTaxConfig,
                            bolIsActive = true,
                            jsonSettings = groupDto.jsonTaxSettings,
                            strCreatedByGUID = adminUser.strUserGUID,
                            dtCreatedDate = currentDateTime,
                            strUpdatedByGUID = adminUser.strUserGUID,
                            dtUpdatedOn = currentDateTime
                        };
                        
                        _context.MstOrgTaxConfigs.Add(taxConfig);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Tax configuration created successfully for organization {organization.strOrganizationName}");
                    }

                    // Create folder structure for documents
                    // 1. Create Documents folder if it doesn't exist
                    // 2. Create group folder inside Documents
                    // 3. Create organization folder inside group folder
                    // 4. Create year folder inside organization folder
                    
                    try
                    {
                        // Create the base uploads/documents directory if it doesn't exist
                        string baseUploadPath = Path.Combine(_environment.ContentRootPath, "Uploads", "documents");
                        
                        if (!Directory.Exists(baseUploadPath))
                        {
                            Directory.CreateDirectory(baseUploadPath);
                            _logger.LogInformation($"Created base upload directory: {baseUploadPath}");
                        }
                        
                        // Create only the group folder using group GUID
                        string groupFolderPath = Path.Combine(baseUploadPath, group.strGroupGUID.ToString());
                        if (!Directory.Exists(groupFolderPath))
                        {
                            Directory.CreateDirectory(groupFolderPath);
                            _logger.LogInformation($"Created group directory: {groupFolderPath}");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error creating document folder structure");
                        // Continue with group creation even if folder creation fails
                    }
                    
                    // Note: User info record creation moved to group module
                    
                    // Create a new year entity using values from request body
                    var year = new MstYear
                    {
                        strYearGUID = Guid.NewGuid(),
                        strName = groupDto.strYearName,
                        dtStartDate = groupDto.dtStartDate,
                        dtEndDate = groupDto.dtEndDate,
                        bolIsActive = true,
                        strPreviousYearGUID = null,
                        strNextYearGUID = null,
                        strGroupGUID = group.strGroupGUID,
                        strOrganizationGUID = organization.strOrganizationGUID,
                        strCreatedByGUID = adminUser.strUserGUID,
                        dtCreatedOn = currentDateTime,
                        strUpdatedByGUID = adminUser.strUserGUID,
                        dtUpdatedOn = currentDateTime,
                        bolSystemCreated = true // System created since it's created during group creation
                    };
                    
                    _context.MstYears.Add(year);
                    await _context.SaveChangesAsync();
                    
                    // Note: User info update with year GUID moved to group module
                    
                    _logger.LogInformation($"Year '{groupDto.strYearName}' created successfully for group {group.strName}");

                    await transaction.CommitAsync();

                    return _mapper.Map<GroupResponseDto>(group);
                }
                catch
                {
                    await transaction.RollbackAsync();
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
            _logger.LogError(ex, "Error occurred while creating group with PAN {PAN}", groupDto.strPAN);
            throw;
        }
    }

    private string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    public async Task<GroupResponseDto?> UpdateGroupAsync(Guid guid, GroupUpdateDto groupDto)
    {
        var group = await _context.MstGroups
            .FirstOrDefaultAsync(g => g.strGroupGUID == guid);

        if (group == null)
            return null;
            
        // Check if group name is unique when it's being updated
        if (!string.IsNullOrEmpty(groupDto.strName) && 
            await _context.MstGroups.AnyAsync(g => 
                g.strName.ToLower() == groupDto.strName.ToLower() && 
                // UPDATED: Changed from g.strGUID to g.strGroupGUID to follow naming convention
                g.strGroupGUID != guid))
        {
            throw new BusinessException(
                $"A group with name '{groupDto.strName}' already exists.",
                "DUPLICATE_NAME"
            );
        }
        
        // Check if group name + PAN combination is unique when being updated
        if (!string.IsNullOrEmpty(groupDto.strName) && !string.IsNullOrEmpty(groupDto.strPAN) && 
            await _context.MstGroups.AnyAsync(g => 
                g.strName.ToLower() == groupDto.strName.ToLower() && 
                g.strPAN != null && g.strPAN.ToLower() == groupDto.strPAN.ToLower() && 
                // UPDATED: Changed from g.strGUID to g.strGroupGUID to follow naming convention
                g.strGroupGUID != guid))
        {
            throw new BusinessException(
                $"A group with name '{groupDto.strName}' and PAN '{groupDto.strPAN}' already exists.",
                "DUPLICATE_NAME_PAN"
            );
        }

        // Check if PAN is unique when it's being updated
        if (!string.IsNullOrEmpty(groupDto.strPAN) && 
            await _context.MstGroups.AnyAsync(g => 
                g.strPAN == groupDto.strPAN && 
                // UPDATED: Changed from g.strGUID to g.strGroupGUID to follow naming convention
                g.strGroupGUID != guid))
        {
            throw new BusinessException(
                $"A group with PAN number '{groupDto.strPAN}' already exists.",
                "DUPLICATE_PAN"
            );
        }
        
        // Store the current logo path before mapping
        string? currentLogoPath = group.strLogo;
        _logger.LogInformation($"Current logo path before update: {currentLogoPath ?? "null"}");

        // Handle logo upload if provided
        if (groupDto.LogoFile != null && groupDto.LogoFile.Length > 0)
        {
            try
            {
                // If there's an existing logo, delete it
                if (!string.IsNullOrEmpty(group.strLogo))
                {
                    _fileStorageService.DeleteFile(group.strLogo);
                }

                // Save the new logo
                var logoPath = await _fileStorageService.SaveFileAsync(groupDto.LogoFile, "GroupLogos");
                groupDto.strLogo = logoPath;
                _logger.LogInformation($"Updated logo saved successfully at path: {logoPath}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading logo file during update");
                throw new BusinessException(
                    "Failed to upload logo file. Please try again.",
                    "LOGO_UPLOAD_FAILED"
                );
            }
        }
        else
        {
            // If no new logo is uploaded, ensure we keep the existing logo path
            groupDto.strLogo = currentLogoPath;
            _logger.LogInformation("No new logo uploaded, preserving existing logo path");
        }

        // Map the DTO properties to the group entity
        _mapper.Map(groupDto, group);
        
        // CRITICAL: Explicitly set the logo path after mapping to ensure it's not lost
        group.strLogo = groupDto.strLogo;
        
        // Update the timestamp
        group.dtUpdatedOn = CurrentDateTime;

        await _context.SaveChangesAsync();

        // Verify only the group folder exists when updating a group
        {
            try
            {
                // Create the base uploads/documents directory if it doesn't exist
                string baseUploadPath = Path.Combine(_environment.ContentRootPath, "Uploads", "documents");
                
                if (!Directory.Exists(baseUploadPath))
                {
                    Directory.CreateDirectory(baseUploadPath);
                    _logger.LogInformation($"Created base upload directory: {baseUploadPath}");
                }
                
                // Create only the group folder using group GUID
                string groupFolderPath = Path.Combine(baseUploadPath, group.strGroupGUID.ToString());
                if (!Directory.Exists(groupFolderPath))
                {
                    Directory.CreateDirectory(groupFolderPath);
                    _logger.LogInformation($"Created group directory: {groupFolderPath}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating or updating document folder structure during group update");
                // Continue with group update even if folder creation fails
            }
        }

        return _mapper.Map<GroupResponseDto>(group);
    }

    public async Task<bool> DeleteGroupAsync(Guid guid)
    {
        var group = await _context.MstGroups
            .FirstOrDefaultAsync(g => g.strGroupGUID == guid);

        if (group == null)
            return false;

        // Delete the logo file if it exists
        if (!string.IsNullOrEmpty(group.strLogo))
        {
            _logger.LogInformation($"Deleting logo file at path: {group.strLogo}");
            _fileStorageService.DeleteFile(group.strLogo);
        }

        _context.MstGroups.Remove(group);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportGroupsAsync(string format)
    {
        // Get all groups
        var groups = await _context.MstGroups
            .OrderBy(x => x.strName)
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
            var worksheet = workbook.Worksheets.Add("Groups");
            
            // Add headers
            worksheet.Cell(1, 1).Value = "Name";
            worksheet.Cell(1, 2).Value = "License No";
            worksheet.Cell(1, 3).Value = "PAN";
            worksheet.Cell(1, 4).Value = "TAN";
            worksheet.Cell(1, 5).Value = "CIN";
            worksheet.Cell(1, 6).Value = "License Issue Date";
            worksheet.Cell(1, 7).Value = "License Expiry Date";
            worksheet.Cell(1, 8).Value = "Logo";
            worksheet.Cell(1, 9).Value = "Created On";
            
            // Style the header row
            var headerRow = worksheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
            
            // Add data
            for (int i = 0; i < groups.Count; i++)
            {
                var group = groups[i];
                int row = i + 2; // Start from row 2 (after header)
                
                worksheet.Cell(row, 1).Value = group.strName;
                worksheet.Cell(row, 2).Value = group.strLicenseNo;
                worksheet.Cell(row, 3).Value = group.strPAN;
                worksheet.Cell(row, 4).Value = group.strTAN;
                worksheet.Cell(row, 5).Value = group.strCIN;
                worksheet.Cell(row, 6).Value = group.dtLicenseIssueDate.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 7).Value = group.dtLicenseExpired.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 8).Value = group.strLogo ?? "";
                worksheet.Cell(row, 9).Value = group.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
            }
            
            // Auto-fit columns
            worksheet.Columns().AdjustToContents();
            
            // Save to memory stream
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Seek(0, SeekOrigin.Begin);
            
            return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Groups_{timestamp}.xlsx");
        }
        else // CSV
        {
            // Create CSV content
            var csv = new StringBuilder();
            
            // Add header row
            csv.AppendLine("Name,License No,PAN,TAN,CIN,License Issue Date,License Expiry Date,Logo,Created On");
            
            // Add data rows
            foreach (var group in groups)
            {
                csv.AppendLine($"\"{group.strName.Replace("\"", "\"\"")}\",\"{group.strLicenseNo.Replace("\"", "\"\"")}\",\"{(group.strPAN ?? "").Replace("\"", "\"\"")}\",\"{(group.strTAN ?? "").Replace("\"", "\"\"")}\",\"{(group.strCIN ?? "").Replace("\"", "\"\"")}\",{group.dtLicenseIssueDate:yyyy-MM-dd},{group.dtLicenseExpired:yyyy-MM-dd},\"{(group.strLogo ?? "").Replace("\"", "\"\"")}\",{group.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
            }
            
            // Convert to bytes
            byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
            
            return (bytes, "text/csv", $"Groups_{timestamp}.csv");
        }
    }
} 
