using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Module;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;
using System.Text;
using System.IO;
using ClosedXML.Excel;

namespace AuditSoftware.Services
{
    public class ModuleService : ServiceBase, IModuleService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<ModuleService> _logger;

        public ModuleService(
            AppDbContext context, 
            IMapper mapper, 
            IFileStorageService fileStorageService,
            ILogger<ModuleService> logger)
        {
            _context = context;
            _mapper = mapper;
            _fileStorageService = fileStorageService;
            _logger = logger;
        }

        public async Task<ModuleResponseDto> CreateAsync(ModuleCreateDto createDto, string createdByGUID)
        {
            // Check for duplicate name across all modules
            var exists = await _context.MstModules
                .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower());

            if (exists)
                throw new BusinessException($"A module '{createDto.strName}' already exists");
                
            // Handle image upload if provided
            if (createDto.ImageFile != null && createDto.ImageFile.Length > 0)
            {
                try
                {
                    var imagePath = await _fileStorageService.SaveFileAsync(createDto.ImageFile, "ModuleImages");
                    createDto.strImagePath = imagePath;
                    _logger.LogInformation($"Module image saved successfully at path: {imagePath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error uploading module image file");
                    throw new BusinessException(
                        "Failed to upload module image file. Please try again.",
                        "IMAGE_UPLOAD_FAILED"
                    );
                }
            }

            var module = _mapper.Map<MstModule>(createDto);
            module.strModuleGUID = Guid.NewGuid();
            module.dtCreatedOn = CurrentDateTime;
            module.strCreatedByGUID = Guid.Parse(createdByGUID);

            _context.MstModules.Add(module);
            await _context.SaveChangesAsync();

            return _mapper.Map<ModuleResponseDto>(module);
        }

        public async Task<ModuleResponseDto> UpdateAsync(string guid, ModuleUpdateDto updateDto, string updatedByGUID)
        {
            var module = await _context.MstModules.FindAsync(Guid.Parse(guid));
            if (module == null)
                throw new BusinessException("Module not found");

            // Check for duplicate name but with a different GUID
            var duplicate = await _context.MstModules
                .FirstOrDefaultAsync(x => x.strName.ToLower() == updateDto.strName.ToLower() && 
                                     x.strModuleGUID.ToString() != guid);

            if (duplicate != null)
                throw new BusinessException($"Another module with name '{updateDto.strName}' already exists");
                
            // Store the current image path before mapping
            string? currentImagePath = module.strImagePath;
            _logger.LogInformation($"Current image path before update: {currentImagePath ?? "null"}");

            // Handle image updates
            if (updateDto.ImageFile != null && updateDto.ImageFile.Length > 0)
            {
                var fileContent = new byte[updateDto.ImageFile.Length];
                await updateDto.ImageFile.OpenReadStream().ReadAsync(fileContent, 0, (int)updateDto.ImageFile.Length);

                // Check if this is an empty file (indicating image removal)
                if (fileContent.Length == 0 || (fileContent.Length == 1 && fileContent[0] == 0))
                {
                    // User wants to remove the image
                    if (!string.IsNullOrEmpty(module.strImagePath))
                    {
                        _fileStorageService.DeleteFile(module.strImagePath);
                        _logger.LogInformation($"Deleted module image: {module.strImagePath}");
                    }
                    updateDto.strImagePath = ""; // Clear the image path
                }
                else
                {
                    try
                    {
                        // If there's an existing image, delete it
                        if (!string.IsNullOrEmpty(module.strImagePath))
                        {
                            _fileStorageService.DeleteFile(module.strImagePath);
                        }

                        // Save the new image
                        var imagePath = await _fileStorageService.SaveFileAsync(updateDto.ImageFile, "ModuleImages");
                        updateDto.strImagePath = imagePath;
                        _logger.LogInformation($"Updated module image saved successfully at path: {imagePath}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error uploading module image file during update");
                        throw new BusinessException(
                            "Failed to upload module image file. Please try again.",
                            "IMAGE_UPLOAD_FAILED"
                        );
                    }
                }
            }
            else
            {
                // No new image provided, keep the existing one
                updateDto.strImagePath = currentImagePath ?? "";
                _logger.LogInformation("No new image provided, keeping existing image path");
            }

            _mapper.Map(updateDto, module);
            module.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            module.dtUpdatedOn = CurrentDateTime;
            
            // CRITICAL: Explicitly set the image path after mapping to ensure it's not lost
            module.strImagePath = updateDto.strImagePath ?? "";

            await _context.SaveChangesAsync();

            return _mapper.Map<ModuleResponseDto>(module);
        }

        public async Task<ModuleResponseDto> GetByIdAsync(string guid)
        {
            var module = await _context.MstModules.FindAsync(Guid.Parse(guid));
            if (module == null)
                throw new BusinessException("Module not found");

            return _mapper.Map<ModuleResponseDto>(module);
        }

        public async Task<PagedResponse<ModuleResponseDto>> GetAllAsync(ModuleFilterDto filterDto)
        {
            // Start with a clean, simple query without projections
            var query = _context.MstModules.AsQueryable();
            
            // Apply bolIsActive filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Apply specific field searches if provided
            if (!string.IsNullOrWhiteSpace(filterDto.NameSearch))
            {
                var nameTerm = filterDto.NameSearch.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(nameTerm));
            }

            if (!string.IsNullOrWhiteSpace(filterDto.SqlFilePathSearch))
            {
                var sqlFilePathTerm = filterDto.SqlFilePathSearch.ToLower();
                query = query.Where(x => x.strSQlfilePath.ToLower().Contains(sqlFilePathTerm));
            }

            // Apply general search if provided (across all fields)
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active modules
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive modules
                    query = query.Where(x => x.bolIsActive == false);
                }
                else
                {
                    // Search across name and SQL file path
                    query = query.Where(x => 
                        x.strName.ToLower().Contains(searchTerm) ||
                        x.strSQlfilePath.ToLower().Contains(searchTerm));
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                // Use strongly-typed LINQ methods for better Entity Framework support
                switch (filterDto.SortBy.ToLower())
                {
                    case "name":
                    case "strname":
                        query = filterDto.ascending
                            ? query.OrderBy(x => x.strName)
                            : query.OrderByDescending(x => x.strName);
                        break;
                        
                    case "sqlfilepath":
                    case "strsqlfilepath":
                    case "filepath":
                    case "path":
                        query = filterDto.ascending
                            ? query.OrderBy(x => x.strSQlfilePath)
                            : query.OrderByDescending(x => x.strSQlfilePath);
                        break;
                        
                    case "isactive":
                    case "bolisactive":
                    case "active":
                    case "inactive":
                    case "status":
                        // For status sort, we use the opposite logic for ascending/descending
                        // Active first when ascending, Inactive first when descending
                        query = filterDto.ascending 
                            ? query.OrderByDescending(x => x.bolIsActive)
                            : query.OrderBy(x => x.bolIsActive);
                        break;
                        
                    case "moduleguid":
                    case "strmoduleguid":
                    case "guid":
                        query = filterDto.ascending
                            ? query.OrderBy(x => x.strModuleGUID)
                            : query.OrderByDescending(x => x.strModuleGUID);
                        break;
                        
                    default:
                        // Default sort by name
                        query = filterDto.ascending
                            ? query.OrderBy(x => x.strName)
                            : query.OrderByDescending(x => x.strName);
                        break;
                }
            }
            else
            {
                // Default sort by strName ascending if no sort field is specified
                query = query.OrderBy(x => x.strName);
            }

            // Calculate total count for pagination
            var totalCount = await query.CountAsync();
            
            // Apply pagination
            var pagedList = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            // Map to DTOs
            var dtos = _mapper.Map<List<ModuleResponseDto>>(pagedList);

            // Return paged response
            return new PagedResponse<ModuleResponseDto>
            {
                Items = dtos,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount
            };
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var module = await _context.MstModules.FindAsync(Guid.Parse(guid));
            if (module == null)
                throw new BusinessException("Module not found");
                
            // Delete associated image if exists
            if (!string.IsNullOrEmpty(module.strImagePath))
            {
                try
                {
                    _fileStorageService.DeleteFile(module.strImagePath);
                    _logger.LogInformation($"Deleted module image: {module.strImagePath}");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to delete module image: {module.strImagePath}");
                    // We continue with the deletion even if image deletion fails
                }
            }

            _context.MstModules.Remove(module);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<ModuleSimpleDto>> GetActiveModulesAsync(string? searchTerm = null)
        {
            var query = _context.MstModules
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(term));
            }

            // Order by name
            query = query.OrderBy(x => x.strName);

            var modules = await query.ToListAsync();
            return _mapper.Map<List<ModuleSimpleDto>>(modules);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportModulesAsync(string format)
        {
            // Get all modules
            var modules = await _context.MstModules
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
                var worksheet = workbook.Worksheets.Add("Modules");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Module Name";
                worksheet.Cell(1, 2).Value = "SQL File Path";
                worksheet.Cell(1, 3).Value = "Status";
                worksheet.Cell(1, 4).Value = "Created On";
                worksheet.Cell(1, 5).Value = "Updated On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < modules.Count; i++)
                {
                    var module = modules[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = module.strName;
                    worksheet.Cell(row, 2).Value = module.strSQlfilePath ?? "-";
                    worksheet.Cell(row, 3).Value = module.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 4).Value = module.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                    worksheet.Cell(row, 5).Value = module.dtUpdatedOn?.ToString("yyyy-MM-dd HH:mm:ss") ?? "-";
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Modules_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Module Name,SQL File Path,Status,Created On,Updated On");
                
                // Add data rows
                foreach (var module in modules)
                {
                    var moduleName = module.strName.Replace("\"", "\"\"");
                    var sqlFilePath = (module.strSQlfilePath ?? "-").Replace("\"", "\"\"");
                    var status = module.bolIsActive ? "Active" : "Inactive";
                    var createdOn = module.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                    var updatedOn = module.dtUpdatedOn?.ToString("yyyy-MM-dd HH:mm:ss") ?? "-";
                    
                    csv.AppendLine($"\"{moduleName}\",\"{sqlFilePath}\",\"{status}\",\"{createdOn}\",\"{updatedOn}\"");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"Modules_{timestamp}.csv");
            }
        }
    }
}
