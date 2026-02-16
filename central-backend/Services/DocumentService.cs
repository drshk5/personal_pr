using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Document;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace AuditSoftware.Services
{
    public class DocumentService : ServiceBase, IDocumentService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<DocumentService> _logger;
        private readonly IWebHostEnvironment _environment;
        private readonly IFileStorageService _fileStorageService;
        private readonly IConfiguration _configuration;

        public DocumentService(AppDbContext context, IMapper mapper, ILogger<DocumentService> logger, 
            IWebHostEnvironment environment, IFileStorageService fileStorageService, IConfiguration configuration)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
            _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        /// <summary>
        /// Helper method to format datetime in the user's timezone
        /// </summary>
        private DateTime? FormatDateTimeForDisplay(DateTime? dateTime, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            if (!dateTime.HasValue)
                return null;
                
            // Treat Unspecified (from DB) as UTC, then convert to user's timezone
            var dt = dateTime.Value;
            if (dt.Kind == DateTimeKind.Unspecified)
            {
                dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }
                
            // Convert UTC to the user's timezone
            if (dt.Kind == DateTimeKind.Utc)
            {
                return dt.ToTimeZone(timeZoneId);
            }
            
            return dt;
        }

        /// <summary>
        /// Helper method to format non-nullable datetime in the user's timezone
        /// </summary>
        private DateTime FormatDateTimeForDisplay(DateTime dateTime, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            // Treat Unspecified (from DB) as UTC, then convert to user's timezone
            if (dateTime.Kind == DateTimeKind.Unspecified)
            {
                dateTime = DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
            }
            
            // Convert UTC to the user's timezone
            if (dateTime.Kind == DateTimeKind.Utc)
            {
                return dateTime.ToTimeZone(timeZoneId);
            }
            
            return dateTime;
        }

        public async Task<DocumentResponseDto> CreateAsync(DocumentCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, Guid? yearGuid = null, Guid? moduleGuid = null)
        {
            var entity = new MstDocument
            {
                strFileName = createDto.strFileName ?? string.Empty,
                strFileType = createDto.strFileType,
                strFileSize = createDto.strFileSize,
                strStatus = createDto.strStatus,
                strFolderGUID = string.IsNullOrWhiteSpace(createDto.strFolderGUID) ? null : Guid.Parse(createDto.strFolderGUID),
                strUploadByGUID = currentUserGuid,
                dtUploadedOn = CurrentDateTime,
                strCreatedByGUID = currentUserGuid,
                dtCreatedOn = CurrentDateTime,
                strOrganizationGUID = organizationGuid,
                strGroupGUID = groupGuid,
                strYearGUID = yearGuid,
                strModuleGUID = moduleGuid,
                bolIsDeleted = false,
                strFilePath = createDto.strURL // Initialize with URL if provided
            };

            _context.Add(entity);
            await _context.SaveChangesAsync();
            
            // Create document association if entityGUID and entityName are provided
            if (!string.IsNullOrEmpty(createDto.strEntityGUID) && !string.IsNullOrEmpty(createDto.strEntityName))
            {
                try
                {
                    // Prevent duplicate association of the same document to the same entity
                    var parsedEntityGuid = Guid.Parse(createDto.strEntityGUID);
                    bool assocExists = await _context.Set<MstDocumentAssociation>()
                        .AsNoTracking()
                        .AnyAsync(a => a.strDocumentGUID == entity.strDocumentGUID
                                    && a.strEntityGUID == parsedEntityGuid
                                    && a.strEntityName == createDto.strEntityName);

                    if (assocExists)
                    {
                        _logger.LogInformation("Skipping duplicate document association: {DocumentGuid} -> {EntityName}:{EntityGuid}",
                            entity.strDocumentGUID, createDto.strEntityName, parsedEntityGuid);
                    }
                    else
                    {
                    var documentAssociation = new MstDocumentAssociation
                    {
                        strDocumentGUID = entity.strDocumentGUID,
                        strEntityGUID = parsedEntityGuid,
                        strEntityName = createDto.strEntityName,
                        strEntityValue = createDto.strEntityValue,
                        strURL = createDto.strURL,
                        strCreatedByGUID = currentUserGuid,
                        dtCreatedOn = CurrentDateTime
                    };
                        
                        _context.Add(documentAssociation);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Created document association for document {entity.strDocumentGUID} with entity {createDto.strEntityName}:{createDto.strEntityGUID}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error creating document association for document {entity.strDocumentGUID}");
                    // We don't want to fail the whole operation if just the association fails
                    // The document has already been saved
                }
            }

            return _mapper.Map<DocumentResponseDto>(entity);
        }

        public async Task<DocumentResponseDto> UpdateAsync(Guid guid, DocumentUpdateDto updateDto, Guid currentUserGuid)
        {
            var entity = await _context.Set<MstDocument>()
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.strDocumentGUID == guid);
                
            if (entity == null)
                throw new BusinessException("Document not found");
            
            // Store the old and new filenames
            string oldFileName = entity.strFileName;
            string newFileName = updateDto.strFileName;
            
            // Get the physical file path by traversing the directory structure
            string physicalOldFileName = $"{entity.strDocumentGUID}_{oldFileName}.{entity.strFileType}";
            string physicalNewFileName = $"{entity.strDocumentGUID}_{newFileName}.{entity.strFileType}";
            
            // Look for the file in a few common locations based on folder structure
            string baseDir = _environment.ContentRootPath;
            
            // Check if this document is associated with a folder
            string? directoryPath = null;
            if (entity.strFolderGUID.HasValue)
            {
                // Get the folder path from the folder entity
                var folder = await _context.Set<MstFolder>()
                    .Where(f => f.strFolderGUID == entity.strFolderGUID.Value)
                    .FirstOrDefaultAsync();
                    
                if (folder != null)
                {
                    directoryPath = folder.strFolderPath;
                }
            }
            
            // If no folder, use the default structure: "documents/{groupGuid}/{orgGuid}/{yearGuid}"
            if (directoryPath == null)
            {
                if (entity.strModuleGUID.HasValue)
                {
                    directoryPath = $"/Uploads/documents/{entity.strGroupGUID}/{entity.strModuleGUID}/{entity.strOrganizationGUID}/{entity.strYearGUID}";
                }
                else
                {
                    directoryPath = $"/Uploads/documents/{entity.strGroupGUID}/{entity.strOrganizationGUID}/{entity.strYearGUID}";
                }
            }
            
            // Create the full paths to the files
            string oldFullPath = Path.Combine(baseDir, directoryPath.TrimStart('/').TrimStart('\\'), physicalOldFileName);
            string newFullPath = Path.Combine(baseDir, directoryPath.TrimStart('/').TrimStart('\\'), physicalNewFileName);
            
            // Try to find and rename the file
            try
            {
                if (File.Exists(oldFullPath))
                {
                    // Rename the file by moving it to a new filename
                    File.Move(oldFullPath, newFullPath, true); // Overwrite if file exists
                    _logger.LogInformation($"Renamed document file from {physicalOldFileName} to {physicalNewFileName}");
                }
                else
                {
                    // If we can't find the file in the expected location, search for it recursively in the uploads folder
                    string uploadsFolder = Path.Combine(baseDir, "Uploads");
                    var foundFiles = Directory.GetFiles(uploadsFolder, $"{entity.strDocumentGUID}_*", SearchOption.AllDirectories);
                    
                    if (foundFiles.Length > 0)
                    {
                        string foundFilePath = foundFiles[0];
                        string? foundFileDir = Path.GetDirectoryName(foundFilePath);
                        
                        if (!string.IsNullOrEmpty(foundFileDir))
                        {
                            string newPath = Path.Combine(foundFileDir, physicalNewFileName);
                            
                            File.Move(foundFilePath, newPath, true); // Overwrite if file exists
                            _logger.LogInformation($"Found and renamed document file from {Path.GetFileName(foundFilePath)} to {physicalNewFileName}");
                        }
                        else
                        {
                            _logger.LogWarning($"Could not determine directory for file: {foundFilePath}");
                        }
                    }
                    else
                    {
                        // If we can't find the file in the expected location, log it but continue with DB update
                        _logger.LogWarning($"Could not find document file to rename: {oldFullPath}");
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error renaming document file from {physicalOldFileName} to {physicalNewFileName}");
                // Continue with DB update even if file rename fails
            }
            
            // Update the database entity
            var entityToUpdate = await _context.Set<MstDocument>().FirstOrDefaultAsync(x => x.strDocumentGUID == guid);
            if (entityToUpdate == null)
                throw new BusinessException("Document not found");

            // Update only the file name since that's all that's in the DTO now
            entityToUpdate.strFileName = updateDto.strFileName;
            
            // Update modification tracking
            entityToUpdate.strModifiedByGUID = currentUserGuid;
            entityToUpdate.strModifiedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<DocumentResponseDto>(entityToUpdate);
        }

        public async Task<bool> DeleteAsync(Guid guid, Guid currentUserGuid)
        {
            var entity = await _context.Set<MstDocument>().FirstOrDefaultAsync(x => x.strDocumentGUID == guid);
            if (entity == null)
                return false;

            // Check if document is associated with other entities in MstDocumentAssociation table
            var hasAssociations = await _context.Set<MstDocumentAssociation>()
                .AnyAsync(x => x.strDocumentGUID == guid);

            if (hasAssociations)
            {
                throw new BusinessException("Cannot delete document because it is associated with other entities. Please remove all associations before deleting this document.");
            }
            
            // Get the physical file path and delete the file
            try 
            {
                string physicalFilePath = await GetDocumentPhysicalPath(entity);
                if (!string.IsNullOrEmpty(physicalFilePath))
                {
                    _fileStorageService.DeleteFile(physicalFilePath);
                    _logger.LogInformation($"Deleted document file: {physicalFilePath}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting document file for document {guid}");
                // Continue with soft delete even if file deletion fails
            }

            // Soft delete as requested
            entity.bolIsDeleted = true;
            entity.strModifiedByGUID = currentUserGuid;
            entity.strModifiedOn = CurrentDateTime;
            await _context.SaveChangesAsync();
            return true;
        }
        
        public async Task<BulkOperationResultDto> BulkDeleteAsync(List<Guid> strDocumentGUIDs, Guid currentUserGuid, Guid? entityGuid = null)
        {
            var result = new BulkOperationResultDto();
            
            // Process each document
            foreach (var guid in strDocumentGUIDs)
            {
                try
                {
                    var entity = await _context.Set<MstDocument>().FirstOrDefaultAsync(x => x.strDocumentGUID == guid);
                    if (entity == null)
                    {
                        result.Failures.Add(new BulkOperationFailure 
                        { 
                            ItemId = guid, 
                            ErrorMessage = "Document not found" 
                        });
                        result.FailureCount++;
                        continue;
                    }

                    // If entityGuid is provided, we need to delete only the association with that entity
                    if (entityGuid.HasValue)
                    {
                        // Find the specific document association
                        var association = await _context.Set<MstDocumentAssociation>()
                            .FirstOrDefaultAsync(x => x.strDocumentGUID == guid && x.strEntityGUID == entityGuid.Value);
                            
                        if (association != null)
                        {
                            // Remove the association
                            _context.Set<MstDocumentAssociation>().Remove(association);
                            
                            // Check if document has other associations
                            var hasOtherAssociations = await _context.Set<MstDocumentAssociation>()
                                .AnyAsync(x => x.strDocumentGUID == guid && x.strEntityGUID != entityGuid.Value);
                                
                            // If no other associations, delete the file and soft delete the document
                            if (!hasOtherAssociations)
                            {
                                // Get the physical file path and delete the file
                                try 
                                {
                                    string physicalFilePath = await GetDocumentPhysicalPath(entity);
                                    if (!string.IsNullOrEmpty(physicalFilePath))
                                    {
                                        _fileStorageService.DeleteFile(physicalFilePath);
                                        _logger.LogInformation($"Deleted document file: {physicalFilePath}");
                                    }
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, $"Error deleting document file for document {guid}");
                                    // Continue with soft delete even if file deletion fails
                                }
                                
                                entity.bolIsDeleted = true;
                                entity.strModifiedByGUID = currentUserGuid;
                                entity.strModifiedOn = CurrentDateTime;
                            }
                            
                            result.SuccessCount++;
                        }
                        else
                        {
                            result.Failures.Add(new BulkOperationFailure 
                            { 
                                ItemId = guid, 
                                ErrorMessage = "Document association with specified entity not found" 
                            });
                            result.FailureCount++;
                        }
                    }
                    else
                    {
                        // Original behavior - check if document is associated with any entities
                        var hasAssociations = await _context.Set<MstDocumentAssociation>()
                            .AnyAsync(x => x.strDocumentGUID == guid);

                        if (hasAssociations)
                        {
                            result.Failures.Add(new BulkOperationFailure 
                            { 
                                ItemId = guid, 
                                ErrorMessage = "Cannot delete document because it is associated with other entities"
                            });
                            result.FailureCount++;
                            continue;
                        }

                        // Get the physical file path and delete the file
                        try 
                        {
                            string physicalFilePath = await GetDocumentPhysicalPath(entity);
                            if (!string.IsNullOrEmpty(physicalFilePath))
                            {
                                _fileStorageService.DeleteFile(physicalFilePath);
                                _logger.LogInformation($"Deleted document file: {physicalFilePath}");
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error deleting document file for document {guid}");
                            // Continue with soft delete even if file deletion fails
                        }

                        // Hard delete from the database
                        _context.Set<MstDocument>().Remove(entity);
                        
                        // Delete any associated files in upload folders
                        try 
                        {
                            // Look for thumbnail or related files based on document GUID
                            string baseDir = _environment.ContentRootPath;
                            string uploadsFolder = Path.Combine(baseDir, "Uploads");
                            
                            if (Directory.Exists(uploadsFolder))
                            {
                                try
                                {
                                    // Search for any files with this document's GUID as part of the filename
                                    var relatedFiles = Directory.GetFiles(uploadsFolder, $"{entity.strDocumentGUID}*", SearchOption.AllDirectories);
                                    
                                    foreach (var file in relatedFiles)
                                    {
                                        File.Delete(file);
                                        _logger.LogInformation($"Deleted document file: {file}");
                                    }
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, $"Error searching for related files for document {guid}");
                                    // Continue with deletion even if related file search fails
                                }
                            }

                            // If we know the exact file location, make sure it's deleted
                            if (!string.IsNullOrEmpty(entity.strFilePath))
                            {
                                string fullPath = Path.Combine(baseDir, entity.strFilePath.TrimStart('/').TrimStart('\\'));
                                if (File.Exists(fullPath))
                                {
                                    File.Delete(fullPath);
                                    _logger.LogInformation($"Deleted document file: {fullPath}");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error deleting associated files for document {guid}");
                            // Continue with deletion even if file deletion fails
                        }
                        
                        result.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    result.Failures.Add(new BulkOperationFailure 
                    { 
                        ItemId = guid, 
                        ErrorMessage = $"Error deleting document: {ex.Message}" 
                    });
                    result.FailureCount++;
                }
            }
            
            // Save all changes at once for better performance
            await _context.SaveChangesAsync();
            
            return result;
        }
        
        public async Task<BulkOperationResultDto> BulkChangeDeleteStatusAsync(List<Guid> strDocumentGUIDs, bool bolIsDeleted, Guid currentUserGuid)
        {
            var result = new BulkOperationResultDto();
            
            // Process each document
            foreach (var guid in strDocumentGUIDs)
            {
                try
                {
                    var entity = await _context.Set<MstDocument>().FirstOrDefaultAsync(x => x.strDocumentGUID == guid);
                    if (entity == null)
                    {
                        result.Failures.Add(new BulkOperationFailure 
                        { 
                            ItemId = guid, 
                            ErrorMessage = "Document not found" 
                        });
                        result.FailureCount++;
                        continue;
                    }

                    // If we're deleting (not restoring), we need to check for associations
                    if (bolIsDeleted)
                    {
                        // Check if document is associated with other entities in MstDocumentAssociation table
                        var hasAssociations = await _context.Set<MstDocumentAssociation>()
                            .AnyAsync(x => x.strDocumentGUID == guid);

                        if (hasAssociations)
                        {
                            result.Failures.Add(new BulkOperationFailure 
                            { 
                                ItemId = guid, 
                                ErrorMessage = "Cannot delete document because it is associated with other entities"
                            });
                            result.FailureCount++;
                            continue;
                        }
                    }

                    // Update the status flag without touching the physical file
                    entity.bolIsDeleted = bolIsDeleted;
                    entity.strModifiedByGUID = currentUserGuid;
                    entity.strModifiedOn = CurrentDateTime;
                    
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    string action = bolIsDeleted ? "deleting" : "restoring";
                    result.Failures.Add(new BulkOperationFailure 
                    { 
                        ItemId = guid, 
                        ErrorMessage = $"Error {action} document: {ex.Message}" 
                    });
                    result.FailureCount++;
                }
            }
            
            // Save all changes at once for better performance
            await _context.SaveChangesAsync();
            
            return result;
        }
        
        public async Task<BulkOperationResultDto> BulkMoveToFolderAsync(List<Guid> strDocumentGUIDs, Guid strFolderGUID, Guid currentUserGuid)
        {
            var result = new BulkOperationResultDto();
            
            // First, verify that the target folder exists
            var targetFolder = await _context.Set<MstFolder>()
                .FirstOrDefaultAsync(f => f.strFolderGUID == strFolderGUID);
            
            if (targetFolder == null)
            {
                throw new BusinessException($"Target folder with GUID {strFolderGUID} does not exist");
            }
            
            // We will use the existing folder path from the folder entity
            // No need to create a new directory structure, as it should already exist
            
            // Process each document
            foreach (var guid in strDocumentGUIDs)
            {
                try
                {
                    // Get the document with its associations
                    var entity = await _context.Set<MstDocument>()
                        .FirstOrDefaultAsync(x => x.strDocumentGUID == guid);
                        
                    if (entity == null)
                    {
                        result.Failures.Add(new BulkOperationFailure 
                        { 
                            ItemId = guid, 
                            ErrorMessage = "Document not found" 
                        });
                        result.FailureCount++;
                        continue;
                    }

                    // If the document is already in the target folder, skip it
                    if (entity.strFolderGUID == strFolderGUID)
                    {
                        result.Failures.Add(new BulkOperationFailure 
                        { 
                            ItemId = guid, 
                            ErrorMessage = "Document is already in the target folder" 
                        });
                        result.FailureCount++;
                        continue;
                    }
                    
                    // Use our helper method to reliably find the document's physical file
                    string currentFilePath = await GetDocumentPhysicalPath(entity);
                    
                    // Get associations to update as well
                    var associations = await _context.Set<MstDocumentAssociation>()
                        .Where(a => a.strDocumentGUID == guid)
                        .ToListAsync();
                    
                    // Move the physical file to the new location if we found it
                    if (!string.IsNullOrEmpty(currentFilePath))
                    {
                        try
                        {
                            // Get the target folder path from the folder entity
                            // This should already follow the group/module/organization/year/folderName hierarchy
                            string targetFolderPath = targetFolder.strFolderPath;
                            
                            if (string.IsNullOrEmpty(targetFolderPath))
                            {
                                // If folder path is not set, construct it using the proper hierarchy
                                // This should match the structure: /Uploads/documents/{groupGuid}/{moduleGuid}/{organizationGuid}/{yearGuid}/{folderName}
                                targetFolderPath = $"/Uploads/documents/{targetFolder.strGroupGUID}/{targetFolder.strModuleGUID}/{targetFolder.strOrganizationGUID}/{targetFolder.strYearGUID}/{targetFolder.strFolderName}";
                                
                                // Update the folder record with the correct path for future use
                                targetFolder.strFolderPath = targetFolderPath;
                                _logger.LogInformation($"Updated folder {targetFolder.strFolderGUID} with path {targetFolderPath}");
                            }
                            
                            // Verify that the target folder physically exists
                            string physicalTargetPath = Path.Combine(_environment.ContentRootPath, targetFolderPath.TrimStart('/').TrimStart('\\'));
                            if (!Directory.Exists(physicalTargetPath))
                            {
                                _logger.LogError($"Target folder does not exist physically: {physicalTargetPath}");
                                result.Failures.Add(new BulkOperationFailure 
                                { 
                                    ItemId = guid, 
                                    ErrorMessage = $"Target folder '{targetFolder.strFolderName}' does not exist physically at path: {targetFolderPath}" 
                                });
                                result.FailureCount++;
                                continue;
                            }
                            
                            // Create the file name for the document in its new location
                            string fileName = $"{entity.strDocumentGUID}_{entity.strFileName}.{entity.strFileType}";
                            
                            // Move the file to the new folder
                            _logger.LogInformation($"Moving file from {currentFilePath} to folder: {targetFolderPath}");
                            
                            // Extract the directory path after "Uploads/" for FileStorageService
                            string targetDirectoryForService = targetFolderPath.TrimStart('/').Replace("Uploads/", "");
                            
                            var newFilePath = await _fileStorageService.MoveFileAsync(
                                currentFilePath, 
                                targetDirectoryForService
                            );
                            
                            _logger.LogInformation($"File moved successfully. New path: {newFilePath}");
                            
                            // Update all document associations with the new URL
                            foreach (var association in associations)
                            {
                                association.strURL = newFilePath;
                            }
                            
                            // Update document metadata
                            entity.strFolderGUID = strFolderGUID;
                            entity.strModifiedByGUID = currentUserGuid;
                            entity.strModifiedOn = CurrentDateTime;
                            // Update the file path
                            entity.strFilePath = newFilePath;
                            
                            result.SuccessCount++;
                        }
                        catch (FileNotFoundException ex)
                        {
                            // If the file doesn't exist physically, just update the database record
                            _logger.LogWarning($"Physical file not found for document {guid}. Updating database record only. Error: {ex.Message}");
                            
                            // Update the document entity's folder GUID only
                            entity.strFolderGUID = strFolderGUID;
                            entity.strModifiedByGUID = currentUserGuid;
                            entity.strModifiedOn = CurrentDateTime;
                            
                            result.SuccessCount++;
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Error moving file for document {guid}");
                            
                            // Still update the database record but add to failures
                            entity.strFolderGUID = strFolderGUID;
                            entity.strModifiedByGUID = currentUserGuid;
                            entity.strModifiedOn = CurrentDateTime;
                            
                            result.Failures.Add(new BulkOperationFailure 
                            { 
                                ItemId = guid, 
                                ErrorMessage = $"Database record updated but file move failed: {ex.Message}" 
                            });
                            result.FailureCount++;
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"No physical file found for document {guid}. Updating database record only.");
                        
                        // No file path to update, just update the folder reference
                        entity.strFolderGUID = strFolderGUID;
                        entity.strModifiedByGUID = currentUserGuid;
                        entity.strModifiedOn = CurrentDateTime;
                        
                        result.SuccessCount++;
                    }
                }
                catch (Exception ex)
                {
                    result.Failures.Add(new BulkOperationFailure 
                    { 
                        ItemId = guid, 
                        ErrorMessage = $"Error moving document: {ex.Message}" 
                    });
                    result.FailureCount++;
                }
            }
            
            // Save all changes at once for better performance
            await _context.SaveChangesAsync();
            
            return result;
        }

        public async Task<DocumentResponseDto> GetByIdAsync(Guid guid)
        {
            var entity = await _context.Set<MstDocument>()
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.strDocumentGUID == guid);

            if (entity == null)
                throw new BusinessException("Document not found");

            return _mapper.Map<DocumentResponseDto>(entity);
        }

        public async Task<PagedResponse<DocumentResponseDto>> GetAllAsync(DocumentFilterDto filterDto, Guid groupGuid, Guid organizationGuid, Guid? yearGuid = null)
        {
            var query = _context.Set<MstDocument>()
                .AsNoTracking()
                .Where(x => x.strGroupGUID == groupGuid && x.strOrganizationGUID == organizationGuid);

            if (yearGuid.HasValue)
                query = query.Where(x => x.strYearGUID == yearGuid);

            if (filterDto.bolIsDeleted.HasValue)
                query = query.Where(x => x.bolIsDeleted == filterDto.bolIsDeleted.Value);
            else
                query = query.Where(x => x.bolIsDeleted == false);

            if (!string.IsNullOrWhiteSpace(filterDto.strFolderGUID))
            {
                var folderGuid = Guid.Parse(filterDto.strFolderGUID);
                query = query.Where(x => x.strFolderGUID == folderGuid);
            }

            if (!string.IsNullOrWhiteSpace(filterDto.strStatus))
            {
                var status = filterDto.strStatus.ToLower();
                query = query.Where(x => (x.strStatus ?? "").ToLower() == status);
            }

            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var term = filterDto.Search.ToLower();
                query = query.Where(x => x.strFileName.ToLower().Contains(term));
            }

            // Sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                var ascending = filterDto.ascending;
                query = filterDto.SortBy switch
                {
                    "strFileName" => ascending ? query.OrderBy(x => x.strFileName) : query.OrderByDescending(x => x.strFileName),
                    "dtUploadedOn" => ascending ? query.OrderBy(x => x.dtUploadedOn) : query.OrderByDescending(x => x.dtUploadedOn),
                    _ => query.OrderByDescending(x => x.dtUploadedOn)
                };
            }
            else
            {
                query = query.OrderByDescending(x => x.dtUploadedOn);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            return new PagedResponse<DocumentResponseDto>
            {
                Items = _mapper.Map<List<DocumentResponseDto>>(items),
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
            };
        }
        
        public async Task<PagedResponse<DocumentExtendedResponseDto>> GetAllExtendedAsync(DocumentFilterDto filterDto, Guid groupGuid, Guid organizationGuid, Guid? yearGuid = null, Guid? moduleGuid = null, string? timeZoneId = null)
        {
            // Start with the base query filtering by group, organization
            var query = _context.Set<MstDocument>()
                .AsNoTracking()
                .Where(x => x.strGroupGUID == groupGuid && x.strOrganizationGUID == organizationGuid);

            // Apply additional filters from token claims
            if (yearGuid.HasValue)
                query = query.Where(x => x.strYearGUID == yearGuid);
                
            if (moduleGuid.HasValue)
                query = query.Where(x => x.strModuleGUID == moduleGuid);

            // Apply filter params
            if (filterDto.bolIsDeleted.HasValue)
                query = query.Where(x => x.bolIsDeleted == filterDto.bolIsDeleted.Value);
            else
                query = query.Where(x => x.bolIsDeleted == false);

            if (!string.IsNullOrWhiteSpace(filterDto.strFolderGUID))
            {
                var folderGuid = Guid.Parse(filterDto.strFolderGUID);
                query = query.Where(x => x.strFolderGUID == folderGuid);
            }

            if (!string.IsNullOrWhiteSpace(filterDto.strStatus))
            {
                var status = filterDto.strStatus.ToLower();
                query = query.Where(x => (x.strStatus ?? "").ToLower() == status);
            }

            // File type filtering
            if (!string.IsNullOrWhiteSpace(filterDto.strFileType))
            {
                var fileExtensions = GetFileExtensionsByType(filterDto.strFileType.ToLower());
                if (fileExtensions.Any())
                {
                    query = query.Where(x => !string.IsNullOrEmpty(x.strFileType) && fileExtensions.Contains(x.strFileType.ToLower()));
                }
            }

            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var term = filterDto.Search.ToLower();
                query = query.Where(x => x.strFileName.ToLower().Contains(term));
            }

            // Sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                var ascending = filterDto.ascending;
                query = filterDto.SortBy switch
                {
                    "strFileName" => ascending ? query.OrderBy(x => x.strFileName) : query.OrderByDescending(x => x.strFileName),
                    "dtUploadedOn" => ascending ? query.OrderBy(x => x.dtUploadedOn) : query.OrderByDescending(x => x.dtUploadedOn),
                    _ => query.OrderByDescending(x => x.dtUploadedOn)
                };
            }
            else
            {
                query = query.OrderByDescending(x => x.dtUploadedOn);
            }

            var totalCount = await query.CountAsync();
            var documents = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            // Get all the necessary related data
            var documentGuids = documents.Select(d => d.strDocumentGUID).ToList();
            
            // Get folder information
            var folderGuids = documents.Where(d => d.strFolderGUID.HasValue)
                                      .Select(d => d.strFolderGUID!.Value)
                                      .Distinct()
                                      .ToList();
                                      
            var folders = await _context.Set<MstFolder>()
                .AsNoTracking()
                .Where(f => folderGuids.Contains(f.strFolderGUID))
                .ToDictionaryAsync(f => f.strFolderGUID, f => f);

            // Get user information for created by, updated by, and uploaded by
            var userGuids = new HashSet<Guid>();
            foreach (var doc in documents)
            {
                userGuids.Add(doc.strCreatedByGUID);
                userGuids.Add(doc.strUploadByGUID);
                if (doc.strModifiedByGUID.HasValue)
                    userGuids.Add(doc.strModifiedByGUID.Value);
            }
            
            var users = await _context.Set<MstUser>()
                .AsNoTracking()
                .Where(u => userGuids.Contains(u.strUserGUID))
                .ToDictionaryAsync(u => u.strUserGUID, u => u);

            // Get document associations
            List<MstDocumentAssociation> associations = new List<MstDocumentAssociation>();
            Dictionary<Guid, List<MstDocumentAssociation>> associationsByDocument = new Dictionary<Guid, List<MstDocumentAssociation>>();
            
            try
            {
                // Try to get associations if the table exists
                associations = await _context.Set<MstDocumentAssociation>()
                    .AsNoTracking()
                    .Where(a => documentGuids.Contains(a.strDocumentGUID))
                    .ToListAsync();

                // Group associations by document GUID for easier access
                associationsByDocument = associations.GroupBy(a => a.strDocumentGUID)
                    .ToDictionary(g => g.Key, g => g.ToList());
            }
            catch (Exception ex)
            {
                // Log the error but continue execution
                _logger.LogWarning("Could not retrieve document associations: {Message}. This may be because the table doesn't exist yet.", ex.Message);
                // Keep empty collections for associations
            }

            // Map the documents to the extended DTOs with additional information
            var extendedDocuments = documents.Select(doc => 
            {
                var dto = _mapper.Map<DocumentExtendedResponseDto>(doc);
                
                // Add folder name if available
                if (doc.strFolderGUID.HasValue && folders.TryGetValue(doc.strFolderGUID.Value, out var folder))
                {
                    dto.strFolderName = folder.strFolderName;
                }
                
                // Add user names if available
                if (users.TryGetValue(doc.strUploadByGUID, out var uploader))
                {
                    dto.strUploadedByName = uploader.strName;
                }
                
                if (users.TryGetValue(doc.strCreatedByGUID, out var creator))
                {
                    dto.strCreatedByName = creator.strName;
                }
                
                if (doc.strModifiedByGUID.HasValue && users.TryGetValue(doc.strModifiedByGUID.Value, out var modifier))
                {
                    dto.strUpdatedByName = modifier.strName;
                }
                
                // Add module GUID
                dto.strModuleGUID = doc.strModuleGUID?.ToString();

                // Convert dates to user's timezone (same pattern as Organization module)
                dto.dtUploadedOn = FormatDateTimeForDisplay(doc.dtUploadedOn, timeZoneId);
                dto.dtCreatedOn = FormatDateTimeForDisplay(doc.dtCreatedOn, timeZoneId);
                
                // Add associations
                if (associationsByDocument.TryGetValue(doc.strDocumentGUID, out var docAssociations))
                {
                    dto.AssociatedTo = docAssociations.Select(a => new DocumentAssociationDto
                    {
                        strDocumentAssociationGUID = a.strDocumentAssociationGUID.ToString(),
                        strEntityGUID = a.strEntityGUID.ToString(),
                        strEntityName = a.strEntityName,
                        strEntityValue = a.strEntityValue,
                        strURL = a.strURL
                    }).ToList();
                }
                else
                {
                    dto.AssociatedTo = new List<DocumentAssociationDto>();
                }
                
                return dto;
            }).ToList();

            return new PagedResponse<DocumentExtendedResponseDto>
            {
                Items = extendedDocuments,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
            };
        }

        public async Task<BulkOperationResultDto> BulkAssignAsync(DocumentBulkAssignDto dto, Guid currentUserGuid)
        {
            var result = new BulkOperationResultDto();

            if (dto.strDocumentGUIDs == null || dto.strDocumentGUIDs.Count == 0)
            {
                return result;
            }

            string entityName = (dto.strEntityName ?? string.Empty).Trim();

            int maxPerEntity = entityName.Equals("Invoice", StringComparison.OrdinalIgnoreCase)
                ? _configuration.GetValue<int>("FileUpload:MaxFilesPerInvoice", 5)
                : entityName.Equals("JournalVoucher", StringComparison.OrdinalIgnoreCase)
                    ? _configuration.GetValue<int>("FileUpload:MaxFilesPerJournalVoucher", 5)
                    : _configuration.GetValue<int>("FileUpload:MaxFilesPerDefault", 5);

            int existingCount = await _context.Set<MstDocumentAssociation>()
                .AsNoTracking()
                .CountAsync(a => a.strEntityGUID == dto.strEntityGUID && a.strEntityName == entityName);

            int remainingSlots = Math.Max(0, maxPerEntity - existingCount);
            if (remainingSlots <= 0)
            {
                foreach (var g in dto.strDocumentGUIDs)
                {
                    result.Failures.Add(new BulkOperationFailure
                    {
                        ItemId = g,
                        ErrorMessage = $"Entity already has {existingCount} files. Max allowed is {maxPerEntity}."
                    });
                }
                result.FailureCount = dto.strDocumentGUIDs.Count;
                return result;
            }

            var validDocs = await _context.Set<MstDocument>()
                .AsNoTracking()
                .Where(d => dto.strDocumentGUIDs.Contains(d.strDocumentGUID) && !d.bolIsDeleted)
                .Select(d => d.strDocumentGUID)
                .ToListAsync();

            var notFound = dto.strDocumentGUIDs.Except(validDocs).ToList();
            foreach (var nf in notFound)
            {
                result.Failures.Add(new BulkOperationFailure { ItemId = nf, ErrorMessage = "Document not found or deleted" });
            }
            result.FailureCount += notFound.Count;

            var alreadyAssociated = await _context.Set<MstDocumentAssociation>()
                .AsNoTracking()
                .Where(a => a.strEntityGUID == dto.strEntityGUID && a.strEntityName == entityName && validDocs.Contains(a.strDocumentGUID))
                .Select(a => a.strDocumentGUID)
                .ToListAsync();

            foreach (var dup in alreadyAssociated)
            {
                result.Failures.Add(new BulkOperationFailure { ItemId = dup, ErrorMessage = "Already associated to this entity" });
            }
            result.FailureCount += alreadyAssociated.Count;

            var candidates = validDocs.Except(alreadyAssociated).Take(remainingSlots).ToList();
            var overflow = validDocs.Except(alreadyAssociated).Skip(remainingSlots).ToList();
            foreach (var ov in overflow)
            {
                result.Failures.Add(new BulkOperationFailure
                {
                    ItemId = ov,
                    ErrorMessage = $"Assigning would exceed limit {maxPerEntity}. Remaining slots: {remainingSlots}"
                });
            }
            result.FailureCount += overflow.Count;

            // Build URL automatically based on entity
            string? entityUrl = null;
            if (entityName.Equals("Invoice", StringComparison.OrdinalIgnoreCase))
            {
                entityUrl = $"/invoice/{dto.strEntityGUID}";
            }
            else if (entityName.Equals("JournalVoucher", StringComparison.OrdinalIgnoreCase))
            {
                entityUrl = $"/journal-voucher/{dto.strEntityGUID}";
            }

            foreach (var docGuid in candidates)
            {
                // Double-check for race-condition duplicates right before insert
                bool exists = await _context.Set<MstDocumentAssociation>()
                    .AsNoTracking()
                    .AnyAsync(a => a.strDocumentGUID == docGuid && a.strEntityGUID == dto.strEntityGUID && a.strEntityName == entityName);
                if (exists)
                {
                    result.FailureCount++;
                    result.Failures.Add(new BulkOperationFailure { ItemId = docGuid, ErrorMessage = "Already associated to this entity" });
                    continue;
                }
                var assoc = new MstDocumentAssociation
                {
                    strDocumentGUID = docGuid,
                    strEntityGUID = dto.strEntityGUID,
                    strEntityName = entityName,
                    strEntityValue = dto.strEntityValue,
                    strURL = entityUrl,
                    strCreatedByGUID = currentUserGuid,
                    dtCreatedOn = CurrentDateTime
                };
                _context.Add(assoc);
            }

            if (candidates.Count > 0)
            {
                await _context.SaveChangesAsync();
            }

            result.SuccessCount = candidates.Count;
            return result;
        }
        
        /// <summary>
        /// Gets the physical file path for a document
        /// </summary>
        /// <param name="document">The document entity</param>
        /// <returns>The relative path to the document file or empty string if not found</returns>
        private async Task<string> GetDocumentPhysicalPath(MstDocument document)
        {
            if (document == null)
                return string.Empty;
            
            // If strFilePath is already set and file exists, return it directly
            if (!string.IsNullOrEmpty(document.strFilePath))
            {
                string fullPath = Path.Combine(_environment.ContentRootPath, document.strFilePath.TrimStart('/').TrimStart('\\'));
                if (File.Exists(fullPath))
                {
                    return document.strFilePath;
                }
            }
                
            string baseDir = _environment.ContentRootPath;
            string docFileName = $"{document.strDocumentGUID}_{document.strFileName}.{document.strFileType}";
            string? directoryPath = null;
            
            // Check if document is associated with a folder
            if (document.strFolderGUID.HasValue)
            {
                // Get the folder path from the folder entity
                var folder = await _context.Set<MstFolder>()
                    .AsNoTracking()
                    .Where(f => f.strFolderGUID == document.strFolderGUID.Value)
                    .FirstOrDefaultAsync();
                    
                if (folder != null)
                {
                    directoryPath = folder.strFolderPath;
                    
                    // Check if the file exists in this folder
                    string fullPath = Path.Combine(baseDir, directoryPath.TrimStart('/').TrimStart('\\'), docFileName);
                    if (File.Exists(fullPath))
                    {
                        return $"{directoryPath}/{docFileName}";
                    }
                }
            }
            
            // If not in folder or folder not found, check the default path based on hierarchy
            string defaultPath;
            if (document.strModuleGUID.HasValue)
            {
                defaultPath = $"/Uploads/documents/{document.strGroupGUID}/{document.strModuleGUID}/{document.strOrganizationGUID}/{document.strYearGUID}";
            }
            else
            {
                defaultPath = $"/Uploads/documents/{document.strGroupGUID}/{document.strOrganizationGUID}/{document.strYearGUID}";
            }
            
            string defaultFullPath = Path.Combine(baseDir, defaultPath.TrimStart('/').TrimStart('\\'), docFileName);
            if (File.Exists(defaultFullPath))
            {
                return $"{defaultPath}/{docFileName}";
            }
            
            // If still not found, do a recursive search in the Uploads folder
            try
            {
                string uploadsFolder = Path.Combine(baseDir, "Uploads");
                if (Directory.Exists(uploadsFolder))
                {
                    var foundFiles = Directory.GetFiles(uploadsFolder, $"{document.strDocumentGUID}_*", SearchOption.AllDirectories);
                    
                    if (foundFiles.Length > 0)
                    {
                        string foundFilePath = foundFiles[0];
                        // Convert absolute path to relative path for the service
                        string relativePath = foundFilePath.Replace(baseDir, "")
                            .Replace("\\", "/")
                            .TrimStart('/');
                            
                        return $"/{relativePath}";
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error searching for document file: {document.strDocumentGUID}_{document.strFileName}.{document.strFileType}");
            }
            
            // If we couldn't find the file, log a warning and return empty string
            _logger.LogWarning($"Could not find physical file for document: {document.strDocumentGUID}");
            return string.Empty;
        }

        /// <summary>
        /// Maps file type category to actual file extensions
        /// </summary>
        /// <param name="fileTypeCategory">The file type category (images, pdf, docs, sheets)</param>
        /// <returns>List of file extensions for the given category</returns>
        private List<string> GetFileExtensionsByType(string fileTypeCategory)
        {
            return fileTypeCategory switch
            {
                "images" => new List<string> { "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "tiff", "tif", "ico" },
                "pdf" => new List<string> { "pdf" },
                "docs" => new List<string> { "doc", "docx", "txt", "rtf", "odt" },
                "sheets" => new List<string> { "xls", "xlsx", "csv", "ods" },
                "all" => new List<string>(), // Empty list means no filter applied
                _ => new List<string>() // Unknown category returns empty list (no results)
            };
        }
    }
}


