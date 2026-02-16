using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Document;
using AuditSoftware.Interfaces;
using AuditSoftware.Helpers;
using AuditSoftware.Exceptions;
using AuditSoftware.Models.Entities;
using AutoMapper;
using AuditSoftware.DTOs.Document;

namespace AuditSoftware.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentController : BaseDeletionController<AuditSoftware.Models.Entities.MstDocument>
    {
        private readonly IDocumentService _documentService;
        private readonly IFileStorageService _fileStorageService;
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private new readonly ILogger<DocumentController> _logger;
        private readonly IMapper _mapper;

        public DocumentController(
            IDocumentService documentService,
            IFileStorageService fileStorageService,
            AppDbContext context,
            IDeleteValidationService deleteValidationService,
            IWebHostEnvironment environment,
            ILogger<DocumentController> logger,
            ILogger<BaseDeletionController<AuditSoftware.Models.Entities.MstDocument>> baseLogger,
            IMapper mapper)
            : base(deleteValidationService, baseLogger)
        {
            _documentService = documentService ?? throw new ArgumentNullException(nameof(documentService));
            _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        /// <summary>
        /// Bulk-assign existing documents to an entity (e.g., Invoice, JournalVoucher)
        /// </summary>
        [HttpPost("bulkAssign")]
        public async Task<ActionResult> BulkAssign([FromBody] DocumentBulkAssignDto dto)
        {
            if (dto == null || dto.strDocumentGUIDs == null || dto.strDocumentGUIDs.Count == 0)
            {
                return BadRequest(new { statusCode = 400, message = "No document GUIDs provided for assignment" });
            }

            try
            {
                var userGuidValue = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidValue))
                {
                    return BadRequest(new { statusCode = 400, message = "User GUID claim is missing from token" });
                }

                var currentUserGuid = GuidHelper.ToGuid(userGuidValue);
                var result = await _documentService.BulkAssignAsync(dto, currentUserGuid);

                if (result.FailureCount == 0)
                {
                    return Ok(new { statusCode = 200, message = $"Successfully associated {result.SuccessCount} documents" });
                }
                if (result.SuccessCount > 0)
                {
                    return Ok(new { statusCode = 207, message = $"Associated {result.SuccessCount} documents with {result.FailureCount} failures", details = result });
                }
                return BadRequest(new { statusCode = 400, message = "No documents were associated", details = result });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk document assignment");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while assigning documents" });
            }
        }

        /// <summary>
        /// Uploads one or more document files.
        /// </summary>
        /// <param name="dto">Document upload request containing files and metadata</param>
        /// <returns>Response with created document information</returns>
        /// <remarks>
        /// Each file must be smaller than 10MB.
        /// The total request size limit is 100MB.
        /// </remarks>
        [HttpPost]
        [RequestSizeLimit(100 * 1024 * 1024)] // 100MB total request size limit
        public async Task<ActionResult<ApiResponse<object>>> Create([FromForm] DocumentUploadRequestDto dto)
        {
            try
            {
                var userGuidValue = User.FindFirst("strUserGUID")?.Value;
                var groupGuidValue = User.FindFirst("strGroupGUID")?.Value;
                var organizationGuidValue = User.FindFirst("strOrganizationGUID")?.Value;
                var yearGuidStr = User.FindFirst("strYearGUID")?.Value;
                var moduleGuidStr = User.FindFirst("strModuleGUID")?.Value;
                
                if (string.IsNullOrEmpty(userGuidValue) || 
                    string.IsNullOrEmpty(groupGuidValue) || 
                    string.IsNullOrEmpty(organizationGuidValue))
                {
                    return BadRequest(ApiResponse<object>.Fail(400, "Required token claims are missing"));
                }
                
                var userGuid = GuidHelper.ToGuid(userGuidValue);
                var groupGuid = GuidHelper.ToGuid(groupGuidValue);
                var organizationGuid = GuidHelper.ToGuid(organizationGuidValue);
                Guid? yearGuid = string.IsNullOrWhiteSpace(yearGuidStr) ? (Guid?)null : GuidHelper.ToGuid(yearGuidStr);
                Guid? moduleGuid = string.IsNullOrWhiteSpace(moduleGuidStr) ? (Guid?)null : GuidHelper.ToGuid(moduleGuidStr);

                if (dto.Files == null || !dto.Files.Any())
                {
                    return BadRequest(ApiResponse<object>.Fail(400, "No files uploaded"));
                }

                return await HandleMultipleFileUpload(dto, userGuid, groupGuid, organizationGuid, yearGuid, moduleGuid);
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<object>.Fail(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating document");
                return StatusCode(500, ApiResponse<object>.Fail(500, "An error occurred while creating the document"));
            }
        }

        private async Task<ActionResult<ApiResponse<object>>> HandleMultipleFileUpload(
            DocumentUploadRequestDto dto, Guid userGuid, Guid groupGuid, Guid organizationGuid, Guid? yearGuid, Guid? moduleGuid)
        {
            // Validate file sizes (10MB per file)
            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            var oversizedFiles = dto.Files!.Where(f => f.Length > maxFileSize).ToList();
            if (oversizedFiles.Any())
            {
                var fileNames = string.Join(", ", oversizedFiles.Select(f => f.FileName));
                var fileSizesInMB = string.Join(", ", oversizedFiles.Select(f => $"{f.FileName}: {(f.Length / (1024.0 * 1024.0)):F2} MB"));
                _logger.LogWarning($"Rejected oversized files: {fileSizesInMB}");
                return BadRequest(ApiResponse<object>.Fail(400, 
                    $"The following files exceed the maximum allowed size of 10MB: {fileNames}. Each file must be smaller than 10MB."));
            }

            var createdDocuments = new List<DocumentResponseDto>();

            foreach (var file in dto.Files ?? Enumerable.Empty<IFormFile>())
            {
                try
                {
                    if (file == null || file.Length == 0)
                    {
                        _logger.LogWarning("Skipping empty file entry");
                        continue;
                    }
                    
                    // Double-check file size at the individual file level
                    if (!IsValidFileSize(file))
                    {
                        _logger.LogWarning($"Skipping file {file.FileName} with size {GetReadableFileSize(file.Length)} - exceeds 10MB limit");
                        continue;
                    }

                    // Determine file path based on folder GUID
                    string filePath;
                    if (!string.IsNullOrEmpty(dto.strFolderGUID))
                    {
                        // If folderGUID is provided, verify it's a valid GUID and get the folder path from the database
                        if (!Guid.TryParse(dto.strFolderGUID, out var folderGuid))
                        {
                            _logger.LogError($"Invalid folder GUID format: {dto.strFolderGUID}");
                            continue;
                        }
                        
                        var folder = await _context.Set<MstFolder>()
                            .Where(f => f.strFolderGUID == folderGuid)
                            .FirstOrDefaultAsync();

                        if (folder == null)
                        {
                            _logger.LogWarning($"Folder with GUID {dto.strFolderGUID} not found");
                            return BadRequest(ApiResponse<object>.Fail(400, $"Folder not found"));
                        }

                        // This method is now obsolete - we'll use our new method with document GUID
                    }
                    else
                    {
                        // If no folderGUID provided, save at the year level
                        if (!yearGuid.HasValue)
                        {
                            _logger.LogWarning("No year GUID available to save document");
                            return BadRequest(ApiResponse<object>.Fail(400, "Year information is required when no folder is specified"));
                        }

                        // Create hierarchical structure: group/module/organization/year
                        string directoryPath;
                        if (moduleGuid.HasValue)
                        {
                            directoryPath = _fileStorageService.CreateDirectoryStructure("documents", 
                                groupGuid.ToString(),
                                moduleGuid.Value.ToString(),
                                organizationGuid.ToString(), 
                                yearGuid.Value.ToString());
                        }
                        else
                        {
                            directoryPath = _fileStorageService.CreateDirectoryStructure("documents", 
                                groupGuid.ToString(),
                                organizationGuid.ToString(), 
                                yearGuid.Value.ToString());
                        }
                        
                        // We'll create the document first, then save the file using document GUID
                        filePath = directoryPath; // Just store directory path for now
                    }
                    
                    // No longer needed as we handle file path creation differently

                    // Create document DTO with file properties
                    var documentDto = new DocumentCreateDto
                    {
                        strFileName = Path.GetFileNameWithoutExtension(file.FileName), // Store only the filename without extension
                        strFileType = Path.GetExtension(file.FileName).TrimStart('.'),
                        strFileSize = GetReadableFileSize(file.Length), // Format file size to be human-readable
                        strStatus = "Uploaded",
                        strFolderGUID = dto.strFolderGUID,
                        strEntityGUID = dto.strEntityGUID,
                        strEntityName = dto.strEntityName,
                        strEntityValue = dto.strEntityValue,
                        strURL = dto.strURL
                    };

                    // Create document record to get the GUID
                    var created = await _documentService.CreateAsync(documentDto, userGuid, groupGuid, organizationGuid, yearGuid, moduleGuid);
                    
                    // Now save the file using the document GUID
                    if (!Guid.TryParse(created.strDocumentGUID, out var docGuid))
                    {
                        _logger.LogError($"Invalid document GUID format: {created.strDocumentGUID}");
                        continue;
                    }
                    string docFileName = $"{docGuid}_{Path.GetFileName(file.FileName)}";
                    
                    // Now save the file with the document GUID as name
                    string physicalFilePath;
                    
                    if (!string.IsNullOrEmpty(dto.strFolderGUID))
                    {
                        // If folder is specified, save to that folder
                        if (!Guid.TryParse(dto.strFolderGUID, out var folderGuid))
                        {
                            _logger.LogError($"Invalid folder GUID format: {dto.strFolderGUID}");
                            continue;
                        }
                        
                        var folder = await _context.Set<MstFolder>()
                            .Where(f => f.strFolderGUID == folderGuid)
                            .FirstOrDefaultAsync();

                        if (folder == null)
                        {
                            _logger.LogWarning($"Folder with GUID {dto.strFolderGUID} not found");
                            continue;
                        }

                        // Save to the folder's path
                        physicalFilePath = await SaveFileWithDocumentGuid(file, folder.strFolderPath, docFileName);
                    }
                    else
                    {
                        // If no folder, save at the group/module/org/year level
                        string directoryPath;
                        
                        // Check if we have a valid yearGuid
                        if (!yearGuid.HasValue)
                        {
                            _logger.LogWarning("No year GUID available to save document");
                            continue;
                        }
                        
                        if (moduleGuid.HasValue)
                        {
                            directoryPath = _fileStorageService.CreateDirectoryStructure("documents", 
                                groupGuid.ToString(),
                                moduleGuid.Value.ToString(),
                                organizationGuid.ToString(), 
                                yearGuid.Value.ToString());
                        }
                        else
                        {
                            directoryPath = _fileStorageService.CreateDirectoryStructure("documents", 
                                groupGuid.ToString(),
                                organizationGuid.ToString(), 
                                yearGuid.Value.ToString());
                        }
                        
                        physicalFilePath = await SaveFileWithDocumentGuid(file, directoryPath, docFileName);
                    }
                    
                    // Update the document with the physical file path
                    await UpdateDocumentFilePath(docGuid, physicalFilePath);
                    
                    createdDocuments.Add(created);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error processing file: {file?.FileName}");
                    // Continue with other files even if one fails
                }
            }

            if (!createdDocuments.Any())
            {
                return BadRequest(ApiResponse<object>.Fail(400, "Failed to upload any files"));
            }

            return Ok(ApiResponse<object>.Success(createdDocuments));
        }
        
        /// <summary>
        /// Saves a file to a specific folder path
        /// </summary>
        /// <param name="file">The file to save</param>
        /// <param name="folderPath">The folder path from the database</param>
        /// <returns>The relative path to the saved file</returns>
        private async Task<string> SaveFileWithDocumentGuid(IFormFile file, string directory, string fileName)
        {
            if (string.IsNullOrEmpty(directory))
            {
                throw new ArgumentException("Directory path cannot be null or empty", nameof(directory));
            }

            // Ensure directory exists
            string fullDirPath = Path.Combine(_environment.ContentRootPath, directory.TrimStart('/').TrimStart('\\'));
            if (!Directory.Exists(fullDirPath))
            {
                Directory.CreateDirectory(fullDirPath);
            }

            // Create the full path with the document GUID as filename
            var fullPath = Path.Combine(fullDirPath, fileName);
            
            // Save the file
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            
            // Return the relative path to be stored or referenced
            return $"{directory.Replace('\\', '/')}/{fileName}";
        }

        private async Task<string> SaveFileToFolderPath(IFormFile file, string folderPath, Guid documentGuid)
        {
            try
            {   
                // Use the document GUID for the file name
                var fileName = $"{documentGuid}_{Path.GetFileName(file.FileName)}";
                
                // Convert the folder path from database format to filesystem path
                string relativeFolderPath = folderPath.TrimStart('/');
                string fullFolderPath = Path.Combine(_environment.ContentRootPath, relativeFolderPath);
                
                // Ensure the directory exists
                if (!Directory.Exists(fullFolderPath))
                {
                    Directory.CreateDirectory(fullFolderPath);
                }
                
                // Full path where the file will be saved
                var fullFilePath = Path.Combine(fullFolderPath, fileName);
                
                // Save the file
                using (var stream = new FileStream(fullFilePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }
                
                // Return relative path to be stored in database
                return $"{folderPath}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving file {file.FileName} to folder path {folderPath}");
                return string.Empty;
            }
        }

        [HttpPut("{guid}")]
        public async Task<ActionResult<ApiResponse<DocumentResponseDto>>> Update(string guid, [FromBody] DocumentUpdateDto dto)
        {
            try
            {
                var userGuidValue = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidValue))
                {
                    return BadRequest(ApiResponse<DocumentResponseDto>.Fail(400, "User GUID claim is missing from token"));
                }
                
                // This endpoint allows users to change only the file name
                // All other document properties remain unchanged
                var userGuid = GuidHelper.ToGuid(userGuidValue);
                var updated = await _documentService.UpdateAsync(GuidHelper.ToGuid(guid), dto, userGuid);
                return Ok(ApiResponse<DocumentResponseDto>.Success(updated));
            }
            catch (BusinessException ex)
            {
                return BadRequest(ApiResponse<DocumentResponseDto>.Fail(400, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document {Guid}", guid);
                return StatusCode(500, ApiResponse<DocumentResponseDto>.Fail(500, "An error occurred while updating the document"));
            }
        }

        /// <summary>
        /// Gets a document by its GUID with extended information including folder name, user names, and associations
        /// </summary>
        /// <param name="guid">Document GUID</param>
        /// <returns>Document with extended information</returns>
        [HttpGet("{guid}")]
        public async Task<ActionResult<ApiResponse<DocumentExtendedResponseDto>>> GetById(string guid)
        {
            try
            {
                // Get the user context from the token claims
                var groupGuidValue = User.FindFirst("strGroupGUID")?.Value;
                var organizationGuidValue = User.FindFirst("strOrganizationGUID")?.Value;
                var yearGuidValue = User.FindFirst("strYearGUID")?.Value;
                var moduleGuidValue = User.FindFirst("strModuleGUID")?.Value;
                
                if (string.IsNullOrEmpty(groupGuidValue) || string.IsNullOrEmpty(organizationGuidValue))
                {
                    return BadRequest(ApiResponse<DocumentExtendedResponseDto>.Fail(400, "Required token claims are missing"));
                }
                
                var groupGuid = GuidHelper.ToGuid(groupGuidValue);
                var organizationGuid = GuidHelper.ToGuid(organizationGuidValue);
                Guid? yearGuid = string.IsNullOrWhiteSpace(yearGuidValue) ? (Guid?)null : GuidHelper.ToGuid(yearGuidValue);
                Guid? moduleGuid = string.IsNullOrWhiteSpace(moduleGuidValue) ? (Guid?)null : GuidHelper.ToGuid(moduleGuidValue);
                var documentGuid = GuidHelper.ToGuid(guid);
                
                // First get the basic document
                var document = await _context.Set<MstDocument>()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.strDocumentGUID == documentGuid);
                
                if (document == null)
                {
                    return NotFound(ApiResponse<DocumentExtendedResponseDto>.Fail(404, "Document not found"));
                }
                
                // Get folder information if applicable
                string? folderName = null;
                if (document.strFolderGUID.HasValue)
                {
                    var folder = await _context.Set<MstFolder>()
                        .AsNoTracking()
                        .FirstOrDefaultAsync(f => f.strFolderGUID == document.strFolderGUID.Value);
                    folderName = folder?.strFolderName;
                }
                
                // Get user information
                string? uploadedByName = null;
                string? createdByName = null;
                string? updatedByName = null;
                
                // Get uploader's name
                var uploader = await _context.Set<MstUser>()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.strUserGUID == document.strUploadByGUID);
                uploadedByName = uploader?.strName;
                
                // Get creator's name
                var creator = await _context.Set<MstUser>()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.strUserGUID == document.strCreatedByGUID);
                createdByName = creator?.strName;
                
                // Get modifier's name if modified
                if (document.strModifiedByGUID.HasValue)
                {
                    var modifier = await _context.Set<MstUser>()
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.strUserGUID == document.strModifiedByGUID.Value);
                    updatedByName = modifier?.strName;
                }
                
                // Get document associations
                var associations = await _context.Set<MstDocumentAssociation>()
                    .AsNoTracking()
                    .Where(a => a.strDocumentGUID == documentGuid)
                    .ToListAsync();
                    
                var associationDtos = associations.Select(a => new DocumentAssociationDto
                {
                    strDocumentAssociationGUID = a.strDocumentAssociationGUID.ToString(),
                    strEntityGUID = a.strEntityGUID.ToString(),
                    strEntityName = a.strEntityName,
                    strEntityValue = a.strEntityValue,
                    strURL = a.strURL
                }).ToList();
                
                // Map to response DTO using AutoMapper
                var response = _mapper.Map<DocumentExtendedResponseDto>(document);
                
                // Add extended properties
                response.strFolderName = folderName;
                response.strUploadedByName = uploadedByName;
                response.strCreatedByName = createdByName;
                response.strUpdatedByName = updatedByName;
                response.strModuleGUID = document.strModuleGUID?.ToString();
                response.AssociatedTo = associationDtos;
                
                // Convert dates to user's timezone (same pattern as Organization module)
                var userTimezone = HttpContext.GetUserTimeZone();
                var formattedUploadedOn = DateTimeHelper.ConvertToTimeZone(document.dtUploadedOn, userTimezone);
                response.dtUploadedOn = formattedUploadedOn;
                var formattedCreatedOn = DateTimeHelper.ConvertToTimeZone(document.dtCreatedOn, userTimezone);
                response.dtCreatedOn = formattedCreatedOn;
                
                return Ok(ApiResponse<DocumentExtendedResponseDto>.Success(response));
            }
            catch (BusinessException ex)
            {
                return NotFound(ApiResponse<DocumentExtendedResponseDto>.Fail(404, ex.Message));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document {Guid}", guid);
                return StatusCode(500, ApiResponse<DocumentExtendedResponseDto>.Fail(500, "An error occurred while fetching the document"));
            }
        }

        /// <summary>
        /// Gets a paginated list of documents with extended information including folder names, user names, and associations
        /// </summary>
        /// <param name="pageNumber">Page number (1-based)</param>
        /// <param name="pageSize">Number of items per page</param>
        /// <param name="sortBy">Property name to sort by</param>
        /// <param name="ascending">Sort direction (true for ascending, false for descending)</param>
        /// <param name="search">Search term for filtering by filename</param>
        /// <param name="bolIsDeleted">Filter by deleted status (defaults to false - shows only active documents)</param>
        /// <param name="strFolderGUID">Filter by folder GUID</param>
        /// <param name="strStatus">Filter by document status</param>
        /// <param name="strFileType">Filter by file type category (images, pdf, docs, sheets, all)</param>
        /// <returns>Paginated list of documents with extended information</returns>
        [HttpGet]
        public async Task<ActionResult<PagedResponse<DocumentExtendedResponseDto>>> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true,
            [FromQuery] string? search = null,
            [FromQuery] bool bolIsDeleted = false,
            [FromQuery] string? strFolderGUID = null,
            [FromQuery] string? strStatus = null,
            [FromQuery] string? strFileType = null)
        {
            try
            {
                // Get the user context from the token claims
                var groupGuidValue = User.FindFirst("strGroupGUID")?.Value;
                var organizationGuidValue = User.FindFirst("strOrganizationGUID")?.Value;
                var yearGuidValue = User.FindFirst("strYearGUID")?.Value;
                var moduleGuidValue = User.FindFirst("strModuleGUID")?.Value;
                
                if (string.IsNullOrEmpty(groupGuidValue) || string.IsNullOrEmpty(organizationGuidValue))
                {
                    return BadRequest(ApiResponse<object>.Fail(400, "Required token claims are missing"));
                }
                
                var groupGuid = GuidHelper.ToGuid(groupGuidValue);
                var organizationGuid = GuidHelper.ToGuid(organizationGuidValue);
                Guid? yearGuid = string.IsNullOrWhiteSpace(yearGuidValue) ? (Guid?)null : GuidHelper.ToGuid(yearGuidValue);
                Guid? moduleGuid = string.IsNullOrWhiteSpace(moduleGuidValue) ? (Guid?)null : GuidHelper.ToGuid(moduleGuidValue);
                
                // Get timezone from user claims (same pattern as Organization module)
                var userTimezone = HttpContext.GetUserTimeZone();
                _logger.LogInformation($"Using timezone: {userTimezone} for documents list");

                var filter = new DocumentFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    ascending = ascending,
                    Search = search,
                    bolIsDeleted = bolIsDeleted, // Already has default value of false from parameter
                    strFolderGUID = strFolderGUID,
                    strStatus = strStatus,
                    strFileType = strFileType
                };

                // Use the extended service method to get additional information
                var result = await _documentService.GetAllExtendedAsync(filter, groupGuid, organizationGuid, yearGuid, moduleGuid, userTimezone);
                
                // Follow the same response pattern as other controllers
                return Ok(new
                {
                    statusCode = 200,
                    message = "Documents retrieved successfully",
                    data = new
                    {
                        items = result.Items,
                        totalCount = result.TotalCount,
                        pageNumber = result.PageNumber,
                        pageSize = result.PageSize,
                        totalPages = result.TotalPages,
                        hasPrevious = result.HasPrevious,
                        hasNext = result.HasNext
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing documents");
                return StatusCode(500, new 
                { 
                    statusCode = 500,
                    message = "An error occurred while retrieving documents",
                    data = new
                    {
                        items = new List<DocumentExtendedResponseDto>(), 
                        totalCount = 0,
                        pageNumber = pageNumber, 
                        pageSize = pageSize, 
                        totalPages = 0,
                        hasPrevious = false,
                        hasNext = false
                    }
                });
            }
        }

        [HttpDelete("{guid}")]
        public async Task<ActionResult> Delete(string guid)
        {
            return await SafeDeleteAsync(GuidHelper.ToGuid(guid), "Document", async (g) =>
            {
                var userGuidValue = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidValue))
                {
                    throw new BusinessException("User GUID claim is missing from token");
                }
                
                var currentUserGuid = GuidHelper.ToGuid(userGuidValue);
                return await _documentService.DeleteAsync(g, currentUserGuid);
            });
        }
        
        /// <summary>
        /// Bulk delete multiple documents
        /// </summary>
        /// <param name="deleteDto">Object containing list of document GUIDs to delete</param>
        /// <returns>Result of the bulk delete operation</returns>
        [HttpDelete("bulk")]
        public async Task<ActionResult> BulkDelete([FromBody] DocumentBulkDeleteDto deleteDto)
        {
            if (deleteDto == null || deleteDto.strDocumentGUIDs == null || deleteDto.strDocumentGUIDs.Count == 0)
            {
                return BadRequest(new { statusCode = 400, message = "No document GUIDs provided for deletion" });
            }
            
            try
            {
                var userGuidValue = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidValue))
                {
                    return BadRequest(new { statusCode = 400, message = "User GUID claim is missing from token" });
                }
                
                var currentUserGuid = GuidHelper.ToGuid(userGuidValue);
                
                // Only validate deletion if we're not just removing an association
                if (!deleteDto.strEntityGUID.HasValue)
                {
                    // For each document, check if it can be deleted first
                    foreach (var guid in deleteDto.strDocumentGUIDs)
                    {
                        var validationResult = await ValidateDeleteAsync(guid, "Document");
                        if (validationResult != null)
                        {
                            // If validation fails for any document, return the error
                            return validationResult;
                        }
                    }
                }
                
                // If all validations pass, proceed with bulk delete
                var result = await _documentService.BulkDeleteAsync(deleteDto.strDocumentGUIDs, currentUserGuid, deleteDto.strEntityGUID);
                
                if (result.FailureCount == 0)
                {
                    return Ok(new { 
                        statusCode = 200, 
                        message = $"Successfully deleted {result.SuccessCount} documents"
                    });
                }
                else
                {
                    return Ok(new { 
                        statusCode = 207, // Partial success
                        message = $"Deleted {result.SuccessCount} documents with {result.FailureCount} failures",
                        details = result
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk document deletion");
                return StatusCode(500, new { 
                    statusCode = 500, 
                    message = "An error occurred while performing bulk delete operation"
                });
            }
        }
        
        /// <summary>
        /// Bulk change delete status for multiple documents (set or unset the deleted flag without removing files)
        /// </summary>
        /// <param name="statusDto">Object containing list of document GUIDs and the target delete status</param>
        /// <returns>Result of the bulk status change operation</returns>
        [HttpPost("bulkChangeDeleteStatus")]
        public async Task<ActionResult> BulkChangeDeleteStatus([FromBody] DocumentBulkChangeDeleteStatusDto statusDto)
        {
            if (statusDto == null || statusDto.strDocumentGUIDs == null || statusDto.strDocumentGUIDs.Count == 0)
            {
                return BadRequest(new { statusCode = 400, message = "No document GUIDs provided for status change" });
            }
            
            try
            {
                var userGuidValue = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidValue))
                {
                    return BadRequest(new { statusCode = 400, message = "User GUID claim is missing from token" });
                }
                
                var currentUserGuid = GuidHelper.ToGuid(userGuidValue);
                
                // If we're deleting (not restoring), perform validation checks
                if (statusDto.bolIsDeleted)
                {
                    // For each document, check if it can be deleted first using the same validation
                    foreach (var guid in statusDto.strDocumentGUIDs)
                    {
                        var validationResult = await ValidateDeleteAsync(guid, "Document");
                        if (validationResult != null)
                        {
                            // If validation fails for any document, return the error
                            return validationResult;
                        }
                    }
                }
                
                // Proceed with bulk status change
                var result = await _documentService.BulkChangeDeleteStatusAsync(statusDto.strDocumentGUIDs, statusDto.bolIsDeleted, currentUserGuid);
                
                string actionWord = statusDto.bolIsDeleted ? "deleted" : "restored";
                
                if (result.FailureCount == 0)
                {
                    return Ok(new { 
                        statusCode = 200, 
                        message = $"Successfully {actionWord} {result.SuccessCount} documents"
                    });
                }
                else
                {
                    return Ok(new { 
                        statusCode = 207, // Partial success
                        message = $"{actionWord} {result.SuccessCount} documents with {result.FailureCount} failures",
                        details = result
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk document delete status change");
                return StatusCode(500, new { 
                    statusCode = 500, 
                    message = "An error occurred while performing bulk delete status change operation"
                });
            }
        }
        
        /// <summary>
        /// Legacy endpoint for backwards compatibility - redirects to bulkChangeDeleteStatus with isDelete=true
        /// </summary>
        [HttpPost("bulkSoftDelete")]
        public async Task<ActionResult> BulkSoftDelete([FromBody] DocumentBulkSoftDeleteDto deleteDto)
        {
            // Convert old DTO to new format
            var statusDto = new DocumentBulkChangeDeleteStatusDto
            {
                strDocumentGUIDs = deleteDto.strDocumentGUIDs,
                bolIsDeleted = true // Always delete for the legacy endpoint
            };
            
            // Call the new endpoint
            return await BulkChangeDeleteStatus(statusDto);
        }
        
        /// <summary>
        /// Bulk move multiple documents to a different folder
        /// </summary>
        /// <param name="moveDto">Object containing list of document GUIDs to move and the target folder GUID</param>
        /// <returns>Result of the bulk move operation</returns>
        [HttpPost("bulkMoveFileToFolder")]
        public async Task<ActionResult> BulkMoveFileToFolder([FromBody] DocumentBulkMoveToFolderDto moveDto)
        {
            if (moveDto == null || moveDto.strDocumentGUIDs == null || moveDto.strDocumentGUIDs.Count == 0)
            {
                return BadRequest(new { statusCode = 400, message = "No document GUIDs provided for moving" });
            }
            
            try
            {
                var userGuidValue = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidValue))
                {
                    return BadRequest(new { statusCode = 400, message = "User GUID claim is missing from token" });
                }
                
                // Verify that the target folder exists
                var targetFolder = await _context.Set<MstFolder>()
                    .FirstOrDefaultAsync(f => f.strFolderGUID == moveDto.strFolderGUID);
                
                if (targetFolder == null)
                {
                    return BadRequest(new { statusCode = 400, message = $"Target folder with GUID {moveDto.strFolderGUID} does not exist" });
                }
                
                var currentUserGuid = GuidHelper.ToGuid(userGuidValue);
                
                // Proceed with bulk move
                var result = await _documentService.BulkMoveToFolderAsync(moveDto.strDocumentGUIDs, moveDto.strFolderGUID, currentUserGuid);
                
                if (result.FailureCount == 0)
                {
                    return Ok(new { 
                        statusCode = 200, 
                        message = $"Successfully moved {result.SuccessCount} documents to folder"
                    });
                }
                else
                {
                    return Ok(new { 
                        statusCode = 207, // Partial success
                        message = $"Moved {result.SuccessCount} documents with {result.FailureCount} failures",
                        details = result
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk document move operation");
                return StatusCode(500, new { 
                    statusCode = 500, 
                    message = "An error occurred while performing bulk move operation"
                });
            }
        }
        
        /// <summary>
        /// Validates if a file exceeds the maximum allowed size (10 MB)
        /// </summary>
        /// <param name="file">The file to validate</param>
        /// <returns>True if the file is valid (under size limit), false otherwise</returns>
        private bool IsValidFileSize(IFormFile file)
        {
            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            return file != null && file.Length > 0 && file.Length <= maxFileSize;
        }
        
        /// <summary>
        /// Updates the document's file path in the database
        /// </summary>
        /// <param name="documentGuid">The document GUID</param>
        /// <param name="filePath">The physical file path to store</param>
        /// <returns>A task representing the asynchronous operation</returns>
        private async Task UpdateDocumentFilePath(Guid documentGuid, string filePath)
        {
            try
            {
                var document = await _context.Set<MstDocument>()
                    .FirstOrDefaultAsync(d => d.strDocumentGUID == documentGuid);
                    
                if (document == null)
                {
                    _logger.LogWarning($"Could not find document with GUID {documentGuid} to update file path");
                    return;
                }
                
                document.strFilePath = filePath;
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Updated file path for document {documentGuid}: {filePath}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating file path for document {documentGuid}");
                // Don't throw, as we don't want to fail the whole operation just for this
            }
        }
        
        /// <summary>
        /// Gets a human-readable file size
        /// </summary>
        /// <param name="bytes">Size in bytes</param>
        /// <returns>Formatted size string (e.g., "5.25 MB")</returns>
        private string GetReadableFileSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB" };
            double len = bytes;
            int order = 0;
            
            while (len >= 1024 && order < sizes.Length - 1)
            {
                order++;
                len = len / 1024;
            }
            
            return $"{len:0.##} {sizes[order]}";
        }
    }
}


