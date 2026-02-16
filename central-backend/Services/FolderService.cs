using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text;
using System.IO;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Folder;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;
using ClosedXML.Excel;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;

namespace AuditSoftware.Services
{
    public class FolderService : IFolderService
    {
        private readonly AppDbContext _context;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<FolderService> _logger;
        private readonly IWebHostEnvironment _environment;

        public FolderService(
            AppDbContext context, 
            IFileStorageService fileStorageService,
            ILogger<FolderService> logger,
            IWebHostEnvironment environment)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
        }

        public async Task<FolderResponseDto> CreateFolderInHierarchyAsync(FolderCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, Guid yearGuid, Guid moduleGuid)
        {
            try
            {
                // Always use the year from token
                
                // Validate the Year exists
                var year = await _context.MstYears.FirstOrDefaultAsync(y => 
                    y.strYearGUID == yearGuid && 
                    y.strOrganizationGUID == organizationGuid);
                    
                if (year == null)
                {
                    throw new BusinessException("Invalid Year GUID from token");
                }
                
                // Validate organization exists
                var organization = await _context.MstOrganizations.FirstOrDefaultAsync(o => 
                    o.strOrganizationGUID == organizationGuid);
                    
                if (organization == null)
                {
                    throw new BusinessException("Organization not found");
                }
                
                // Validate group exists
                var group = await _context.MstGroups.FirstOrDefaultAsync(g => 
                    g.strGroupGUID == groupGuid);
                    
                if (group == null)
                {
                    throw new BusinessException("Group not found");
                }
                
                // Validate module exists
                var module = await _context.Set<MstModule>().FirstOrDefaultAsync(m => 
                    m.strModuleGUID == moduleGuid);
                
                if (module == null)
                {
                    throw new BusinessException("Module not found");
                }
                
                // Define the paths for all components
                string baseUploadPath = Path.Combine(_environment.ContentRootPath, "Uploads", "documents");
                string groupFolderPath = Path.Combine(baseUploadPath, groupGuid.ToString());
                string moduleFolderPath = Path.Combine(groupFolderPath, moduleGuid.ToString());
                string orgFolderPath = Path.Combine(moduleFolderPath, organizationGuid.ToString());
                string yearFolderPath = Path.Combine(orgFolderPath, yearGuid.ToString());
                string newFolderPath = Path.Combine(yearFolderPath, createDto.strFolderName.Trim());
                
                // Check if the new folder exists in the file system
                bool newFolderExistsInFilesystem = Directory.Exists(newFolderPath);
                
                // Check if a folder with the same name already exists in the database
                var existingFolder = await _context.Set<MstFolder>().FirstOrDefaultAsync(f => 
                    f.strFolderName.Equals(createDto.strFolderName.Trim()) && 
                    f.strYearGUID == yearGuid &&
                    f.strOrganizationGUID == organizationGuid);
                
                // Handle database/filesystem synchronization issues
                if (existingFolder != null)
                {
                    // If folder exists in database but not in filesystem
                    if (!newFolderExistsInFilesystem)
                    {
                        _logger.LogWarning($"Found folder '{createDto.strFolderName}' in database but not on filesystem. Removing database entry.");
                        _context.Remove(existingFolder);
                        await _context.SaveChangesAsync();
                        // We'll continue to create the folder
                    }
                    else
                    {
                        // Both exist, can't create duplicate
                        throw new BusinessException($"A folder with the name '{createDto.strFolderName}' already exists for the selected year");
                    }
                }
                else if (newFolderExistsInFilesystem)
                {
                    // Folder exists in filesystem but not in database
                    _logger.LogWarning($"Folder '{createDto.strFolderName}' exists on filesystem but not in database. Will create database entry.");
                    // We'll continue and create the database entry
                }
                
                // Create directory structure
                // Step 1: Find/create group folder
                if (!Directory.Exists(groupFolderPath))
                {
                    Directory.CreateDirectory(groupFolderPath);
                    _logger.LogInformation($"Created group directory: {groupFolderPath}");
                }
                
                // Step 2: Find/create module folder
                if (!Directory.Exists(moduleFolderPath))
                {
                    Directory.CreateDirectory(moduleFolderPath);
                    _logger.LogInformation($"Created module directory: {moduleFolderPath}");
                }
                
                // Step 3: Find/create organization folder
                if (!Directory.Exists(orgFolderPath))
                {
                    Directory.CreateDirectory(orgFolderPath);
                    _logger.LogInformation($"Created organization directory: {orgFolderPath}");
                }
                
                // Step 4: Find/create year folder
                if (!Directory.Exists(yearFolderPath))
                {
                    Directory.CreateDirectory(yearFolderPath);
                    _logger.LogInformation($"Created year directory: {yearFolderPath}");
                }
                
                // Step 5: Create the new folder
                if (!Directory.Exists(newFolderPath))
                {
                    Directory.CreateDirectory(newFolderPath);
                    _logger.LogInformation($"Created folder: {newFolderPath}");
                }
                
                // Create relative path for storage in DB
                string relativePath = $"/Uploads/documents/{groupGuid}/{moduleGuid}/{organizationGuid}/{yearGuid}/{createDto.strFolderName.Trim()}";
                
                // Create folder entity
                var folder = new MstFolder
                {
                    strFolderGUID = Guid.NewGuid(),
                    strFolderName = createDto.strFolderName.Trim(),
                    strYearGUID = yearGuid,
                    strOrganizationGUID = organizationGuid,
                    strGroupGUID = groupGuid,
                    strModuleGUID = moduleGuid,
                    strCreatedByGUID = currentUserGuid,
                    dtCreatedOn = DateTime.UtcNow,
                    strFolderPath = relativePath
                };
                
                _context.Add(folder);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Created folder {folder.strFolderGUID} with path {relativePath}");
                
                return await GetByIdAsync(folder.strFolderGUID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating folder in hierarchy: {ex.Message}");
                throw new BusinessException($"{ex.Message}");
            }
        }
        
        // CreateSimplifiedAsync method has been removed as it's not being used anymore
        // We're now using CreateFolderInHierarchyAsync instead, which gets moduleGuid from token
        
        public async Task<FolderResponseDto> CreateAsync(FolderCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, Guid yearGuid)
        {
            try
            {
                // Validate the Year exists using yearGuid from token
                var year = await _context.MstYears.FirstOrDefaultAsync(y => 
                    y.strYearGUID == yearGuid && 
                    y.strOrganizationGUID == organizationGuid);
                    
                if (year == null)
                {
                    throw new BusinessException("Invalid Year GUID from token");
                }

                // Get organization name
                var organization = await _context.MstOrganizations.FirstOrDefaultAsync(o => 
                    o.strOrganizationGUID == organizationGuid);
                    
                if (organization == null)
                {
                    throw new BusinessException("Organization not found");
                }

                // Check if a folder with the same name already exists
                var existingFolder = await _context.Set<MstFolder>().FirstOrDefaultAsync(f => 
                    f.strFolderName.Equals(createDto.strFolderName.Trim()) && 
                    f.strYearGUID == yearGuid &&
                    f.strOrganizationGUID == organizationGuid);
                    
                if (existingFolder != null)
                {
                    throw new BusinessException($"A folder with the name '{createDto.strFolderName}' already exists for the selected year");
                }

                // Create physical folder structure
                // Path structure: /Uploads/documents/[Organization]/[Year]/[FolderName]
                string folderPath = _fileStorageService.CreateDirectoryStructure(
                    "documents", 
                    organization.strOrganizationName, 
                    year.strName, 
                    createDto.strFolderName.Trim()
                );
                
                var folder = new MstFolder
                {
                    strFolderGUID = Guid.NewGuid(),
                    strFolderName = createDto.strFolderName.Trim(),
                    strYearGUID = yearGuid,
                    strOrganizationGUID = organizationGuid,
                    strGroupGUID = groupGuid,
                    strCreatedByGUID = currentUserGuid,
                    dtCreatedOn = DateTime.UtcNow,
                    strFolderPath = folderPath
                };

                _context.Add(folder);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Created folder {folder.strFolderGUID} with path {folderPath}");

                return await GetByIdAsync(folder.strFolderGUID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating folder {createDto.strFolderName}");
                throw new BusinessException($"{ex.Message}");
            }
        }

        public async Task<FolderResponseDto> GetByIdAsync(Guid folderGuid)
        {
            var query = from f in _context.Set<MstFolder>()
                        join org in _context.MstOrganizations on f.strOrganizationGUID equals org.strOrganizationGUID into orgJoin
                        from org in orgJoin.DefaultIfEmpty()
                        join year in _context.MstYears on f.strYearGUID equals year.strYearGUID into yearJoin
                        from year in yearJoin.DefaultIfEmpty()
                        join createdBy in _context.MstUsers on f.strCreatedByGUID equals createdBy.strUserGUID into createdByJoin
                        from createdBy in createdByJoin.DefaultIfEmpty()
                        join updatedBy in _context.MstUsers on f.strUpdatedByGUID equals updatedBy.strUserGUID into updatedByJoin
                        from updatedBy in updatedByJoin.DefaultIfEmpty()
                        where f.strFolderGUID == folderGuid
                        select new FolderResponseDto
                        {
                            strFolderGUID = f.strFolderGUID,
                            strFolderName = f.strFolderName,
                            strOrganizationGUID = f.strOrganizationGUID,
                            strYearGUID = f.strYearGUID,
                            strGroupGUID = f.strGroupGUID,
                            strCreatedByGUID = f.strCreatedByGUID,
                            dtCreatedOn = f.dtCreatedOn,
                            strUpdatedByGUID = f.strUpdatedByGUID,
                            dtUpdatedOn = f.dtUpdatedOn,
                            
                            // Additional properties
                            strOrganizationName = org.strOrganizationName,
                            strYearName = year.strName,
                            strCreatedBy = createdBy.strName,
                            strUpdatedBy = updatedBy != null ? updatedBy.strName : null,
                            strFolderPath = f.strFolderPath
                        };

            var folder = await query.FirstOrDefaultAsync();
            if (folder == null)
            {
                throw new BusinessException("Folder not found");
            }

            return folder;
        }

        public async Task<PagedResponse<FolderResponseDto>> GetAllAsync(BaseFilterDto filterDto)
        {
            var query = GetAllFoldersQueryable(filterDto, null, null);
            
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize);

            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            return new PagedResponse<FolderResponseDto>
            {
                Items = items,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<PagedResponse<FolderResponseDto>> GetAllAsync(BaseFilterDto filterDto, Guid organizationGuid, Guid? moduleGuid = null)
        {
            var query = GetAllFoldersQueryable(filterDto, organizationGuid, moduleGuid);
            
            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize);

            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();
                
            // Get all folder GUIDs for the items
            var folderGuids = items.Select(f => f.strFolderGUID).ToList();
            
            // Get document counts for each folder (only non-deleted documents)
            var documentCounts = await _context.Set<MstDocument>()
                .Where(d => folderGuids.Contains(d.strFolderGUID ?? Guid.Empty) && !d.bolIsDeleted)
                .GroupBy(d => d.strFolderGUID)
                .Select(g => new { FolderGuid = g.Key, Count = g.Count() })
                .ToListAsync();
                
            // Map document counts to folders
            foreach (var item in items)
            {
                var docCount = documentCounts.FirstOrDefault(d => d.FolderGuid == item.strFolderGUID);
                item.intDocumentCount = docCount?.Count ?? 0;
            }

            return new PagedResponse<FolderResponseDto>
            {
                Items = items,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<PagedResponse<FolderResponseDto>> GetAllAsync(FolderFilterDto filterDto, Guid organizationGuid)
        {
            // Get moduleGuid parameter from the parent method
            var moduleGuid = (Guid?)null;
            
            var query = GetAllFoldersQueryable(filterDto, organizationGuid, moduleGuid);

            // Apply additional filters specific to FolderFilterDto
            if (!string.IsNullOrWhiteSpace(filterDto.strFolderName))
            {
                query = query.Where(f => f.strFolderName.Contains(filterDto.strFolderName));
            }

            if (filterDto.strYearGUID.HasValue)
            {
                query = query.Where(f => f.strYearGUID == filterDto.strYearGUID.Value);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize);

            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            return new PagedResponse<FolderResponseDto>
            {
                Items = items,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }

        public async Task<PagedResponse<FolderResponseDto>> GetFoldersByOrganizationAsync(Guid organizationGuid, BaseFilterDto filterDto, Guid? moduleGuid = null)
        {
            return await GetAllAsync(filterDto, organizationGuid, moduleGuid);
        }

        public async Task<List<FolderSimpleResponseDto>> GetSimpleFoldersByOrganizationAsync(Guid organizationGuid)
        {
            var query = from folder in _context.Set<MstFolder>()
                        join year in _context.MstYears on folder.strYearGUID equals year.strYearGUID into yearJoin
                        from year in yearJoin.DefaultIfEmpty()
                        where folder.strOrganizationGUID == organizationGuid
                        orderby folder.strFolderName
                        select new FolderSimpleResponseDto
                        {
                            strFolderGUID = folder.strFolderGUID,
                            strFolderName = folder.strFolderName,
                            strYearGUID = folder.strYearGUID,
                            strYearName = year.strName
                        };

            return await query.ToListAsync();
        }

        public async Task<List<FolderSimpleResponseDto>> GetSimpleFoldersByYearAsync(Guid yearGuid)
        {
            var query = from folder in _context.Set<MstFolder>()
                        join year in _context.MstYears on folder.strYearGUID equals year.strYearGUID into yearJoin
                        from year in yearJoin.DefaultIfEmpty()
                        where folder.strYearGUID == yearGuid
                        orderby folder.strFolderName
                        select new FolderSimpleResponseDto
                        {
                            strFolderGUID = folder.strFolderGUID,
                            strFolderName = folder.strFolderName,
                            strYearGUID = folder.strYearGUID,
                            strYearName = year.strName
                        };

            return await query.ToListAsync();
        }

        public async Task<FolderResponseDto> UpdateFolderInHierarchyAsync(Guid folderGuid, SimpleFolderUpdateDto updateDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, Guid yearGuid)
        {
            try
            {
                // Find the folder to update
                var folder = await _context.Set<MstFolder>()
                    .FirstOrDefaultAsync(f => f.strFolderGUID == folderGuid);

                if (folder == null)
                {
                    throw new BusinessException("Folder not found");
                }

                // Store original values for comparison
                string originalFolderName = folder.strFolderName;
                string originalFolderPath = folder.strFolderPath;
                
                // Validate that the user can update this folder (belongs to the correct org/year)
                if (folder.strOrganizationGUID != organizationGuid)
                {
                    throw new BusinessException("Folder does not belong to the current organization");
                }

                // We're enforcing that the folder stays in the same year when updated via this method
                if (folder.strYearGUID != yearGuid)
                {
                    throw new BusinessException("Folder does not belong to the current year");
                }

                // Validate the Year exists
                var year = await _context.MstYears.FirstOrDefaultAsync(y => 
                    y.strYearGUID == yearGuid && 
                    y.strOrganizationGUID == organizationGuid);
                    
                if (year == null)
                {
                    throw new BusinessException("Invalid Year GUID from token");
                }
                
                // Get organization name
                var organization = await _context.MstOrganizations.FirstOrDefaultAsync(o => 
                    o.strOrganizationGUID == organizationGuid);
                    
                if (organization == null)
                {
                    throw new BusinessException("Organization not found");
                }
                
                // Get group info
                var group = await _context.MstGroups.FirstOrDefaultAsync(g => 
                    g.strGroupGUID == groupGuid);
                    
                if (group == null)
                {
                    throw new BusinessException("Group not found");
                }
                
                // Check if a folder with the same name already exists (excluding this folder)
                var existingFolder = await _context.Set<MstFolder>().FirstOrDefaultAsync(f => 
                    f.strFolderName.Equals(updateDto.strFolderName.Trim()) && 
                    f.strYearGUID == yearGuid &&
                    f.strOrganizationGUID == organizationGuid &&
                    f.strFolderGUID != folderGuid);
                    
                if (existingFolder != null)
                {
                    throw new BusinessException($"A folder with the name '{updateDto.strFolderName}' already exists for the selected year");
                }
                
                // Define the paths for all components
                string baseUploadPath = Path.Combine(_environment.ContentRootPath, "Uploads", "documents");
                string groupFolderPath = Path.Combine(baseUploadPath, groupGuid.ToString());
                string moduleFolderPath = Path.Combine(groupFolderPath, folder.strModuleGUID.ToString());
                string orgFolderPath = Path.Combine(moduleFolderPath, organizationGuid.ToString());
                string yearFolderPath = Path.Combine(orgFolderPath, yearGuid.ToString());
                string newFolderPath = Path.Combine(yearFolderPath, updateDto.strFolderName.Trim());
                
                // Only rename the folder if the name has changed
                if (originalFolderName != updateDto.strFolderName.Trim())
                {
                    // Ensure the directory structure exists
                    if (!Directory.Exists(groupFolderPath))
                    {
                        Directory.CreateDirectory(groupFolderPath);
                        _logger.LogInformation($"Created group directory: {groupFolderPath}");
                    }
                    
                    if (!Directory.Exists(moduleFolderPath))
                    {
                        Directory.CreateDirectory(moduleFolderPath);
                        _logger.LogInformation($"Created module directory: {moduleFolderPath}");
                    }
                    
                    if (!Directory.Exists(orgFolderPath))
                    {
                        Directory.CreateDirectory(orgFolderPath);
                        _logger.LogInformation($"Created organization directory: {orgFolderPath}");
                    }
                    
                    if (!Directory.Exists(yearFolderPath))
                    {
                        Directory.CreateDirectory(yearFolderPath);
                        _logger.LogInformation($"Created year directory: {yearFolderPath}");
                    }
                    
                    // Get the actual path of the old folder
                    string oldFolderPath = Path.Combine(yearFolderPath, originalFolderName);
                    
                    // Check if the old folder exists in the filesystem
                    if (Directory.Exists(oldFolderPath))
                    {
                        // Rename the folder (move it to the new path)
                        Directory.Move(oldFolderPath, newFolderPath);
                        _logger.LogInformation($"Renamed folder from '{oldFolderPath}' to '{newFolderPath}'");
                    }
                    else
                    {
                        // If the old folder doesn't exist in the filesystem, create a new one
                        Directory.CreateDirectory(newFolderPath);
                        _logger.LogInformation($"Old folder not found in filesystem. Created new folder: {newFolderPath}");
                    }
                    
                    // Update the relative path in the database
                    string relativePath = $"/Uploads/documents/{groupGuid}/{folder.strModuleGUID}/{organizationGuid}/{yearGuid}/{updateDto.strFolderName.Trim()}";
                    folder.strFolderPath = relativePath;
                    
                    _logger.LogInformation($"Updated folder path from {originalFolderPath} to {relativePath}");
                }

                // Update the folder entity
                folder.strFolderName = updateDto.strFolderName.Trim();
                folder.strUpdatedByGUID = currentUserGuid;
                folder.dtUpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Updated folder {folderGuid} name from {originalFolderName} to {updateDto.strFolderName.Trim()}");
                
                return await GetByIdAsync(folderGuid);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating folder in hierarchy: {ex.Message}");
                throw new BusinessException($"Error updating folder: {ex.Message}");
            }
        }

        public async Task<FolderResponseDto> UpdateAsync(Guid folderGuid, FolderUpdateDto updateDto, Guid currentUserGuid)
        {
            try 
            {
                var folder = await _context.Set<MstFolder>()
                    .FirstOrDefaultAsync(f => f.strFolderGUID == folderGuid);

                if (folder == null)
                {
                    throw new BusinessException("Folder not found");
                }

                // Store the original folder name for comparison
                string originalFolderName = folder.strFolderName;
                string originalFolderPath = folder.strFolderPath;
                Guid originalYearGuid = folder.strYearGUID;

                // Validate the Year exists
                var year = await _context.MstYears.FirstOrDefaultAsync(y => 
                    y.strYearGUID == updateDto.strYearGUID && 
                    y.strOrganizationGUID == folder.strOrganizationGUID);
                    
                if (year == null)
                {
                    throw new BusinessException("Invalid Year GUID specified");
                }

                // Get organization
                var organization = await _context.MstOrganizations.FirstOrDefaultAsync(o => 
                    o.strOrganizationGUID == folder.strOrganizationGUID);
                    
                if (organization == null)
                {
                    throw new BusinessException("Organization not found");
                }

                // Check if a folder with the same name already exists (excluding this folder)
                var existingFolder = await _context.Set<MstFolder>().FirstOrDefaultAsync(f => 
                    f.strFolderName.Equals(updateDto.strFolderName.Trim()) && 
                    f.strYearGUID == updateDto.strYearGUID &&
                    f.strOrganizationGUID == folder.strOrganizationGUID &&
                    f.strFolderGUID != folderGuid);
                    
                if (existingFolder != null)
                {
                    throw new BusinessException($"A folder with the name '{updateDto.strFolderName}' already exists for the selected year");
                }

                // Check if folder name or year changed - requiring a physical folder change
                bool needsPhysicalUpdate = originalFolderName != updateDto.strFolderName.Trim() || 
                                        originalYearGuid != updateDto.strYearGUID;

                if (needsPhysicalUpdate)
                {
                    // Get the original year name
                    string yearName;
                    if (originalYearGuid == updateDto.strYearGUID)
                    {
                        // Same year, just use the current year object
                        yearName = year.strName;
                    }
                    else
                    {
                        // Year changed, get the original year name
                        var originalYear = await _context.MstYears.FirstOrDefaultAsync(y => 
                            y.strYearGUID == originalYearGuid);
                        if (originalYear == null)
                        {
                            throw new BusinessException("Original year not found");
                        }
                        yearName = originalYear.strName;
                    }

                    // Create the new physical folder structure
                    string newFolderPath = _fileStorageService.CreateDirectoryStructure(
                        "documents", 
                        organization.strOrganizationName, 
                        year.strName, 
                        updateDto.strFolderName.Trim()
                    );
                    
                    // Update the folder path in the entity
                    folder.strFolderPath = newFolderPath;
                    
                    _logger.LogInformation($"Updated folder {folder.strFolderGUID} path from {originalFolderPath} to {newFolderPath}");
                }

                // Update the database record
                folder.strFolderName = updateDto.strFolderName.Trim();
                folder.strYearGUID = updateDto.strYearGUID;
                folder.strUpdatedByGUID = currentUserGuid;
                folder.dtUpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating folder {folderGuid}");
                throw new BusinessException($"Error updating folder: {ex.Message}");
            }

            return await GetByIdAsync(folderGuid);
        }

        public async Task<bool> DeleteAsync(Guid folderGuid)
        {
            try
            {
                var folder = await _context.Set<MstFolder>()
                    .FirstOrDefaultAsync(f => f.strFolderGUID == folderGuid);

                if (folder == null)
                {
                    throw new BusinessException("Folder not found");
                }

                // Check if any documents reference this folder
                var hasDocumentsInFolder = await _context.Set<MstDocument>()
                    .AnyAsync(d => d.strFolderGUID == folderGuid);

                if (hasDocumentsInFolder)
                {
                    _logger.LogWarning($"Cannot delete folder {folderGuid} because it contains documents");
                    throw new BusinessException(
                        "Cannot delete this folder because it contains documents. Please move or delete all documents in this folder before deleting it.",
                        "FOLDER_HAS_DOCUMENTS"
                    );
                }
                
                // Store folder path before deletion
                string folderPath = folder.strFolderPath;
                
                // Delete from database
                _context.Remove(folder);
                await _context.SaveChangesAsync();
                
                // Delete the physical folder if it exists
                if (!string.IsNullOrEmpty(folderPath))
                {
                    try
                    {
                        // Delete folder from the Document Folder using the FileStorageService
                        bool deleted = _fileStorageService.DeleteDirectory(folderPath);
                        
                        if (deleted)
                        {
                            _logger.LogInformation($"Deleted folder at {folderPath}");
                        }
                        else
                        {
                            // If the standard path deletion failed, try with the full path construction
                            // This ensures we delete the folder even if the path in DB has issues
                            _logger.LogWarning($"Failed to delete folder using stored path. Attempting with constructed path.");
                            
                            // Try to construct the absolute path
                            string baseUploadPath = Path.Combine(_environment.ContentRootPath, "Uploads", "documents");
                            
                            // Guids are not nullable, so we check if they're not empty
                            if (folder.strGroupGUID != Guid.Empty && folder.strModuleGUID != Guid.Empty)
                            {
                                string constructedPath = Path.Combine(
                                    baseUploadPath, 
                                    folder.strGroupGUID.ToString(), 
                                    folder.strModuleGUID.ToString(), 
                                    folder.strOrganizationGUID.ToString(), 
                                    folder.strYearGUID.ToString(), 
                                    folder.strFolderName
                                );
                                
                                if (Directory.Exists(constructedPath))
                                {
                                    Directory.Delete(constructedPath, true);
                                    _logger.LogInformation($"Deleted folder at constructed path: {constructedPath}");
                                }
                                else
                                {
                                    _logger.LogWarning($"Folder not found at constructed path: {constructedPath}");
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error deleting physical folder at {folderPath}");
                        // Continue the process even if folder deletion fails
                    }
                }

                return true;
            }
            catch (BusinessException)
            {
                // Re-throw business exceptions without modification
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting folder {folderGuid}");
                throw new BusinessException(ex.Message);
            }
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportFoldersAsync(string format, Guid groupGuid, Guid organizationGuid)
        {
            var query = from folder in _context.Set<MstFolder>()
                        join org in _context.MstOrganizations on folder.strOrganizationGUID equals org.strOrganizationGUID into orgJoin
                        from org in orgJoin.DefaultIfEmpty()
                        join year in _context.MstYears on folder.strYearGUID equals year.strYearGUID into yearJoin
                        from year in yearJoin.DefaultIfEmpty()
                        where folder.strOrganizationGUID == organizationGuid
                        select new
                        {
                            Folder_Name = folder.strFolderName,
                            Organization = org.strOrganizationName,
                            Year = year.strName,
                            Created_On = folder.dtCreatedOn.ToString("dd-MMM-yyyy")
                        };

            var data = await query.ToListAsync();
            
            if (format.ToLowerInvariant() == "excel")
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Folders");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Folder Name";
                worksheet.Cell(1, 2).Value = "Organization";
                worksheet.Cell(1, 3).Value = "Year";
                worksheet.Cell(1, 4).Value = "Created On";
                
                // Add data
                int row = 2;
                foreach (var item in data)
                {
                    worksheet.Cell(row, 1).Value = item.Folder_Name;
                    worksheet.Cell(row, 2).Value = item.Organization;
                    worksheet.Cell(row, 3).Value = item.Year;
                    worksheet.Cell(row, 4).Value = item.Created_On;
                    row++;
                }
                
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Folders.xlsx");
            }
            else if (format.ToLowerInvariant() == "csv")
            {
                var csv = new StringBuilder();
                csv.AppendLine("Folder Name,Organization,Year,Created On");
                
                foreach (var item in data)
                {
                    csv.AppendLine($"\"{item.Folder_Name}\",\"{item.Organization}\",\"{item.Year}\",\"{item.Created_On}\"");
                }
                
                var bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return (bytes, "text/csv", "Folders.csv");
            }
            else
            {
                throw new BusinessException("Unsupported export format. Only excel and csv are supported.");
            }
        }

        private IQueryable<FolderResponseDto> GetAllFoldersQueryable(BaseFilterDto filterDto, Guid? organizationGuid = null, Guid? moduleGuid = null)
        {
            var query = from folder in _context.Set<MstFolder>()
                        join org in _context.MstOrganizations on folder.strOrganizationGUID equals org.strOrganizationGUID into orgJoin
                        from org in orgJoin.DefaultIfEmpty()
                        join year in _context.MstYears on folder.strYearGUID equals year.strYearGUID into yearJoin
                        from year in yearJoin.DefaultIfEmpty()
                        join createdBy in _context.MstUsers on folder.strCreatedByGUID equals createdBy.strUserGUID into createdByJoin
                        from createdBy in createdByJoin.DefaultIfEmpty()
                        join updatedBy in _context.MstUsers on folder.strUpdatedByGUID equals updatedBy.strUserGUID into updatedByJoin
                        from updatedBy in updatedByJoin.DefaultIfEmpty()
                        // Left join with MstDocument to get document count
                        select new FolderResponseDto
                        {
                            strFolderGUID = folder.strFolderGUID,
                            strFolderName = folder.strFolderName,
                            strOrganizationGUID = folder.strOrganizationGUID,
                            strYearGUID = folder.strYearGUID,
                            strGroupGUID = folder.strGroupGUID,
                            strModuleGUID = folder.strModuleGUID,
                            strCreatedByGUID = folder.strCreatedByGUID,
                            dtCreatedOn = folder.dtCreatedOn,
                            strUpdatedByGUID = folder.strUpdatedByGUID,
                            dtUpdatedOn = folder.dtUpdatedOn,
                            
                            // Additional properties
                            strOrganizationName = org.strOrganizationName,
                            strYearName = year.strName,
                            strCreatedBy = createdBy.strName,
                            // Document count is calculated in a separate step
                            strUpdatedBy = updatedBy != null ? updatedBy.strName : null
                        };

            // Apply organization filter if provided
            if (organizationGuid.HasValue)
            {
                query = query.Where(f => f.strOrganizationGUID == organizationGuid.Value);
            }

            // Apply module filter if provided
            if (moduleGuid.HasValue)
            {
                query = query.Where(f => f.strModuleGUID == moduleGuid.Value);
            }

            // Apply search filter
            if (!string.IsNullOrEmpty(filterDto.Search))
            {
                string search = filterDto.Search.ToLower();
                query = query.Where(f => 
                    f.strFolderName.ToLower().Contains(search) || 
                    (f.strYearName != null && f.strYearName.ToLower().Contains(search)));
            }

            // Apply sorting
            query = ApplySorting(query, filterDto.SortBy, filterDto.ascending ? "asc" : "desc");

            return query;
        }

        private IQueryable<FolderResponseDto> ApplySorting(IQueryable<FolderResponseDto> query, string? sortColumn, string sortOrder)
        {
            var isAscending = string.IsNullOrEmpty(sortOrder) || sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase);

            if (string.IsNullOrEmpty(sortColumn))
            {
                // Default sort if no sort column specified
                return isAscending ? query.OrderBy(f => f.strFolderName) : query.OrderByDescending(f => f.strFolderName);
            }
            
            return (sortColumn.ToLower()) switch
            {
                "strfoldername" => isAscending ? query.OrderBy(f => f.strFolderName) : query.OrderByDescending(f => f.strFolderName),
                "stryearname" => isAscending ? query.OrderBy(f => f.strYearName) : query.OrderByDescending(f => f.strYearName),
                "strorganizationname" => isAscending ? query.OrderBy(f => f.strOrganizationName) : query.OrderByDescending(f => f.strOrganizationName),
                "dtcreatedon" => isAscending ? query.OrderBy(f => f.dtCreatedOn) : query.OrderByDescending(f => f.dtCreatedOn),
                "strupdatedby" => isAscending ? query.OrderBy(f => f.strUpdatedBy) : query.OrderByDescending(f => f.strUpdatedBy),
                "dtupdatedon" => isAscending ? query.OrderBy(f => f.dtUpdatedOn) : query.OrderByDescending(f => f.dtUpdatedOn),
                _ => isAscending ? query.OrderBy(f => f.strFolderName) : query.OrderByDescending(f => f.strFolderName)
            };
        }
    }
}