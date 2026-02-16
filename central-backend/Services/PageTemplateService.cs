using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using AuditSoftware.Data;
using AuditSoftware.Models.Entities;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.PageTemplate;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;
using ClosedXML.Excel;

namespace AuditSoftware.Services
{
    public class PageTemplateService : IPageTemplateService
    {
        private readonly AppDbContext _dbContext;
        private readonly ILogger<PageTemplateService> _logger;
        
        public PageTemplateService(
            AppDbContext dbContext,
            ILogger<PageTemplateService> logger)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }
        
        public async Task<PageTemplateResponseDto> CreateAsync(PageTemplateCreateDto createDto, string createdByGUID)
        {
            // Validate name uniqueness
            if (await _dbContext.MstPageTemplates.AnyAsync(pt => pt.strPageTemplateName.ToLower() == createDto.strPageTemplateName.ToLower()))
            {
                throw new BusinessException("Page template name already exists.");
            }
            
            var pageTemplate = new MstPageTemplate
            {
                strPageTemplateGUID = Guid.NewGuid(),
                strPageTemplateName = createDto.strPageTemplateName.Trim(),
                bolIsSave = createDto.bolIsSave,
                bolIsView = createDto.bolIsView,
                bolIsEdit = createDto.bolIsEdit,
                bolIsDelete = createDto.bolIsDelete,
                bolIsPrint = createDto.bolIsPrint,
                bolIsExport = createDto.bolIsExport,
                bolIsImport = createDto.bolIsImport,
                bolIsApprove = createDto.bolIsApprove,
                strCreatedByGUID = GuidHelper.ToNullableGuid(createdByGUID),
                dtCreated = DateTime.UtcNow
            };
            
            await _dbContext.MstPageTemplates.AddAsync(pageTemplate);
            await _dbContext.SaveChangesAsync();
            
            return MapToResponseDto(pageTemplate);
        }
        
        public async Task<PageTemplateResponseDto> UpdateAsync(string guid, PageTemplateUpdateDto updateDto, string updatedByGUID)
        {
            var pageTemplateGuid = Guid.Parse(guid);
            var pageTemplate = await _dbContext.MstPageTemplates
                .FirstOrDefaultAsync(pt => pt.strPageTemplateGUID == pageTemplateGuid);
                
            if (pageTemplate == null)
            {
                throw new BusinessException($"Page template with GUID {guid} not found.");
            }
            
            // Check name uniqueness if changed
            if (pageTemplate.strPageTemplateName.ToLower() != updateDto.strPageTemplateName.ToLower() &&
                await _dbContext.MstPageTemplates.AnyAsync(pt => 
                    pt.strPageTemplateName.ToLower() == updateDto.strPageTemplateName.ToLower() && 
                    pt.strPageTemplateGUID != pageTemplateGuid))
            {
                throw new BusinessException("Page template name already exists.");
            }
            
            pageTemplate.strPageTemplateName = updateDto.strPageTemplateName.Trim();
            pageTemplate.bolIsSave = updateDto.bolIsSave;
            pageTemplate.bolIsView = updateDto.bolIsView;
            pageTemplate.bolIsEdit = updateDto.bolIsEdit;
            pageTemplate.bolIsDelete = updateDto.bolIsDelete;
            pageTemplate.bolIsPrint = updateDto.bolIsPrint;
            pageTemplate.bolIsExport = updateDto.bolIsExport;
            pageTemplate.bolIsImport = updateDto.bolIsImport;
            pageTemplate.bolIsApprove = updateDto.bolIsApprove;
            pageTemplate.strModifiedByGUID = GuidHelper.ToNullableGuid(updatedByGUID);
            pageTemplate.dtModified = DateTime.UtcNow;
            
            await _dbContext.SaveChangesAsync();
            
            return MapToResponseDto(pageTemplate);
        }
        
        public async Task<PageTemplateResponseDto> GetByIdAsync(string guid)
        {
            var pageTemplateGuid = Guid.Parse(guid);
            var pageTemplate = await _dbContext.MstPageTemplates
                .FirstOrDefaultAsync(pt => pt.strPageTemplateGUID == pageTemplateGuid);
                
            if (pageTemplate == null)
            {
                throw new BusinessException($"Page template with GUID {guid} not found.");
            }
            
            return MapToResponseDto(pageTemplate);
        }
        
        public async Task<PagedResponse<PageTemplateResponseDto>> GetAllAsync(PageTemplateFilterDto filterDto)
        {
            IQueryable<MstPageTemplate> query = _dbContext.MstPageTemplates;
            
            // Apply search filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower();
                query = query.Where(pt => pt.strPageTemplateName.ToLower().Contains(searchTerm));
            }
            
            var totalCount = await query.CountAsync();
            
            // Apply pagination
            var pageSize = filterDto.PageSize == 0 ? 10 : filterDto.PageSize;
            var pageNumber = filterDto.PageNumber == 0 ? 1 : filterDto.PageNumber;
            
            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                string sortField = filterDto.SortBy;
                
                // Map common sort field names to actual property names if needed
                switch (sortField.ToLower())
                {
                    case "name":
                        sortField = "strPageTemplateName";
                        break;
                    case "save":
                        sortField = "bolIsSave";
                        break;
                    case "view":
                        sortField = "bolIsView";
                        break;
                    case "edit":
                        sortField = "bolIsEdit";
                        break;
                    case "delete":
                        sortField = "bolIsDelete";
                        break;
                    case "print":
                        sortField = "bolIsPrint";
                        break;
                    case "export":
                        sortField = "bolIsExport";
                        break;
                    case "import":
                        sortField = "bolIsImport";
                        break;
                    case "approve":
                        sortField = "bolIsApprove";
                        break;
                    case "createdat":
                    case "created":
                        sortField = "dtCreated";
                        break;
                    case "modifiedat":
                    case "modified":
                        sortField = "dtModified";
                        break;
                    // Keep original value if no mapping needed
                }
                
                // Case insensitive property name matching
                var sortProperty = typeof(MstPageTemplate).GetProperties()
                    .FirstOrDefault(p => string.Equals(p.Name, sortField, StringComparison.OrdinalIgnoreCase));
                
                if (sortProperty != null)
                {
                    var parameter = System.Linq.Expressions.Expression.Parameter(typeof(MstPageTemplate), "pt");
                    var property = System.Linq.Expressions.Expression.Property(parameter, sortProperty);
                    var lambda = System.Linq.Expressions.Expression.Lambda(property, parameter);
                    
                    var methodName = filterDto.ascending ? "OrderBy" : "OrderByDescending";
                    
                    var orderByMethod = typeof(Queryable).GetMethods()
                        .Where(m => m.Name == methodName && m.IsGenericMethodDefinition && m.GetParameters().Length == 2)
                        .Single();
                        
                    var genericMethod = orderByMethod.MakeGenericMethod(typeof(MstPageTemplate), sortProperty.PropertyType);
                    if (genericMethod != null)
                    {
                        var result = genericMethod.Invoke(null, new object[] { query, lambda });
                        if (result != null)
                        {
                            query = (IQueryable<MstPageTemplate>)result;
                        }
                    }
                }
                else
                {
                    // If the property doesn't exist, fall back to sorting by name
                    query = filterDto.ascending
                        ? query.OrderBy(pt => pt.strPageTemplateName)
                        : query.OrderByDescending(pt => pt.strPageTemplateName);
                }
            }
            else
            {
                // Default sorting by name if SortBy is not specified
                query = filterDto.ascending
                    ? query.OrderBy(pt => pt.strPageTemplateName)
                    : query.OrderByDescending(pt => pt.strPageTemplateName);
            }
            
            // Ensure query is not null before proceeding
            if (query == null)
            {
                // Reinitialize the query if it's somehow null
                query = _dbContext.MstPageTemplates;
            }

            List<MstPageTemplate> pageTemplates;
            try
            {
                pageTemplates = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (InvalidCastException ex)
            {
                _logger.LogError(ex, "Data type mismatch when querying page templates. This may be caused by a mismatch between database values and entity model types.");
                
                // Try a safer fallback approach using EF Core's projection to avoid casting issues
                try 
                {
                    // Recreate the query with explicit projection to avoid type casting issues
                    var fallbackQuery = _dbContext.MstPageTemplates.AsNoTracking()
                        .Select(pt => new MstPageTemplate
                        {
                            strPageTemplateGUID = GuidHelper.ToGuid(pt.strPageTemplateGUID.ToString()),
                            strPageTemplateName = pt.strPageTemplateName,
                            bolIsSave = pt.bolIsSave,
                            bolIsView = pt.bolIsView,
                            bolIsEdit = pt.bolIsEdit,
                            bolIsDelete = pt.bolIsDelete,
                            bolIsPrint = pt.bolIsPrint,
                            bolIsExport = pt.bolIsExport,
                            bolIsImport = pt.bolIsImport,
                            bolIsApprove = pt.bolIsApprove,
                            strCreatedByGUID = pt.strCreatedByGUID,
                            dtCreated = pt.dtCreated,
                            strModifiedByGUID = pt.strModifiedByGUID,
                            dtModified = pt.dtModified,
                            bolIsSystemCreated = pt.bolIsSystemCreated
                        });
                    
                    // Apply sorting
                    fallbackQuery = fallbackQuery.OrderBy(pt => pt.strPageTemplateName);
                    
                    // Apply pagination
                    pageTemplates = await fallbackQuery
                        .Skip((pageNumber - 1) * pageSize)
                        .Take(pageSize)
                        .ToListAsync();
                }
                catch (Exception fallbackEx) 
                {
                    _logger.LogError(fallbackEx, "Failed to recover from GUID conversion error with safe fallback approach");
                    throw new BusinessException("There was a data type mismatch error when retrieving page templates. Please contact your system administrator.");
                }
            }
                
            var pageTemplateResponses = pageTemplates.Select(MapToResponseDto).ToList();
            
            return new PagedResponse<PageTemplateResponseDto>
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                Items = pageTemplateResponses
            };
        }
        
        public async Task<bool> DeleteAsync(string guid)
        {
            var pageTemplateGuid = Guid.Parse(guid);
            var pageTemplate = await _dbContext.MstPageTemplates
                .FirstOrDefaultAsync(pt => pt.strPageTemplateGUID == pageTemplateGuid);
                
            if (pageTemplate == null)
            {
                return false;
            }
            
            _dbContext.MstPageTemplates.Remove(pageTemplate);
            await _dbContext.SaveChangesAsync();
            
            return true;
        }
        
        public async Task<List<PageTemplateSimpleDto>> GetActivePageTemplatesAsync(string? searchTerm = null)
        {
            IQueryable<MstPageTemplate> query = _dbContext.MstPageTemplates;
            
            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var searchTermLower = searchTerm.ToLower();
                query = query.Where(pt => pt.strPageTemplateName.ToLower().Contains(searchTermLower));
            }
            
            var pageTemplates = await query
                .OrderBy(pt => pt.strPageTemplateName)
                .ToListAsync();
                
            return pageTemplates.Select(pt => new PageTemplateSimpleDto
            {
                strPageTemplateGUID = pt.strPageTemplateGUID.ToString(),
                strPageTemplateName = pt.strPageTemplateName
            }).ToList();
        }
        
        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportPageTemplatesAsync(string format)
        {
            var pageTemplates = await _dbContext.MstPageTemplates
                .OrderBy(pt => pt.strPageTemplateName)
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
                var worksheet = workbook.Worksheets.Add("Page Templates");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Template Name";
                worksheet.Cell(1, 2).Value = "Save";
                worksheet.Cell(1, 3).Value = "View";
                worksheet.Cell(1, 4).Value = "Edit";
                worksheet.Cell(1, 5).Value = "Delete";
                worksheet.Cell(1, 6).Value = "Print";
                worksheet.Cell(1, 7).Value = "Export";
                worksheet.Cell(1, 8).Value = "Import";
                worksheet.Cell(1, 9).Value = "Approve";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < pageTemplates.Count; i++)
                {
                    var pageTemplate = pageTemplates[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = pageTemplate.strPageTemplateName;
                    worksheet.Cell(row, 2).Value = pageTemplate.bolIsSave ? "Yes" : "No";
                    worksheet.Cell(row, 3).Value = pageTemplate.bolIsView ? "Yes" : "No";
                    worksheet.Cell(row, 4).Value = pageTemplate.bolIsEdit ? "Yes" : "No";
                    worksheet.Cell(row, 5).Value = pageTemplate.bolIsDelete ? "Yes" : "No";
                    worksheet.Cell(row, 6).Value = pageTemplate.bolIsPrint ? "Yes" : "No";
                    worksheet.Cell(row, 7).Value = pageTemplate.bolIsExport ? "Yes" : "No";
                    worksheet.Cell(row, 8).Value = pageTemplate.bolIsImport ? "Yes" : "No";
                    worksheet.Cell(row, 9).Value = pageTemplate.bolIsApprove ? "Yes" : "No";
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"PageTemplates_{timestamp}.xlsx");
            }
            else // CSV
            {
                using var memoryStream = new MemoryStream();
                using var writer = new StreamWriter(memoryStream);
                
                // Write headers
                writer.WriteLine("Template Name,Save,View,Edit,Delete,Print,Export,Import,Approve");
                
                // Write data
                foreach (var pageTemplate in pageTemplates)
                {
                    writer.WriteLine($"{pageTemplate.strPageTemplateName}," +
                                     $"{(pageTemplate.bolIsSave ? "Yes" : "No")}," +
                                     $"{(pageTemplate.bolIsView ? "Yes" : "No")}," +
                                     $"{(pageTemplate.bolIsEdit ? "Yes" : "No")}," +
                                     $"{(pageTemplate.bolIsDelete ? "Yes" : "No")}," +
                                     $"{(pageTemplate.bolIsPrint ? "Yes" : "No")}," +
                                     $"{(pageTemplate.bolIsExport ? "Yes" : "No")}," +
                                     $"{(pageTemplate.bolIsImport ? "Yes" : "No")}," +
                                     $"{(pageTemplate.bolIsApprove ? "Yes" : "No")}");
                }
                
                writer.Flush();
                memoryStream.Position = 0;
                
                return (memoryStream.ToArray(), "text/csv", $"PageTemplates_{timestamp}.csv");
            }
        }
        
        private PageTemplateResponseDto MapToResponseDto(MstPageTemplate pageTemplate)
        {
            return new PageTemplateResponseDto
            {
                strPageTemplateGUID = pageTemplate.strPageTemplateGUID.ToString(),
                strPageTemplateName = pageTemplate.strPageTemplateName,
                bolIsSave = pageTemplate.bolIsSave,
                bolIsView = pageTemplate.bolIsView,
                bolIsEdit = pageTemplate.bolIsEdit,
                bolIsDelete = pageTemplate.bolIsDelete,
                bolIsPrint = pageTemplate.bolIsPrint,
                bolIsExport = pageTemplate.bolIsExport,
                bolIsImport = pageTemplate.bolIsImport,
                bolIsApprove = pageTemplate.bolIsApprove
            };
        }
    }
}
