using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Schedule;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AuditSoftware.Services
{
    public class ScheduleService : IScheduleService
    {
        private readonly AppDbContext _dbContext;
        private readonly ILogger<ScheduleService> _logger;

        public ScheduleService(AppDbContext dbContext, ILogger<ScheduleService> logger)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<ScheduleResponseDto> CreateAsync(ScheduleCreateDto createDto, string createdByGUID, string groupGUID)
        {
            _logger.LogInformation($"Creating new Schedule with name: {createDto.strScheduleName}");

            // Validate input
            if (string.IsNullOrWhiteSpace(createDto.strScheduleCode))
                throw new BusinessException("Schedule code is required");

            if (string.IsNullOrWhiteSpace(createDto.strScheduleName))
                throw new BusinessException("Schedule name is required");

            // Check if schedule code already exists in this group
            if (await _dbContext.MstSchedules.AnyAsync(s => s.strScheduleCode == createDto.strScheduleCode))
                throw new BusinessException($"Schedule with code '{createDto.strScheduleCode}' already exists");

            // Create new entity
            var schedule = new MstSchedule
            {
                code = createDto.code,
                strScheduleCode = createDto.strScheduleCode,
                strRefNo = createDto.strRefNo,
                strScheduleName = createDto.strScheduleName,
                strTemplateName = createDto.strTemplateName, // Corrected property name
                strUnderCode = createDto.strUnderCode,
                strParentScheduleGUID = createDto.strParentScheduleGUID,
                dblChartType = createDto.dblChartType,
                strDefaultAccountTypeGUID = createDto.strDefaultAccountTypeGUID,
                bolIsActive = createDto.bolIsActive,
                bolIsEditable = createDto.bolIsEditable
            };

            await _dbContext.MstSchedules.AddAsync(schedule);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation($"Created Schedule with GUID: {schedule.strScheduleGUID}");

            // Map to response DTO
            return MapToResponseDto(schedule);
        }

        public async Task<PagedResponse<ScheduleResponseDto>> GetAllAsync(ScheduleFilterDto filterDto, string groupGUID)
        {
            _logger.LogInformation($"Getting schedules with filter: {filterDto.Search}");

            // Start with a base query
            var query = _dbContext.MstSchedules.AsQueryable();

            // Group filter removed as we no longer have strGroupGUID in the model

            // Apply search filter
            if (!string.IsNullOrEmpty(filterDto.Search))
            {
                var search = filterDto.Search.ToLower();
                query = query.Where(s => 
                    s.strScheduleCode.ToLower().Contains(search) ||
                    s.strScheduleName.ToLower().Contains(search));
            }

            // Apply active filter
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(s => s.bolIsActive == filterDto.bolIsActive.Value);
            }
            
            // Apply editable filter
            if (filterDto.bolIsEditable.HasValue)
            {
                query = query.Where(s => s.bolIsEditable == filterDto.bolIsEditable.Value);
            }
            
            // Apply parent schedule GUIDs filter
            if (!string.IsNullOrEmpty(filterDto.ParentScheduleGUIDs))
            {
                var guidStrings = filterDto.ParentScheduleGUIDs.Split(',').Select(g => g.Trim()).Where(g => !string.IsNullOrEmpty(g));
                var guids = new List<Guid>();
                
                foreach (var guidString in guidStrings)
                {
                    if (Guid.TryParse(guidString, out Guid parsedGuid))
                    {
                        guids.Add(parsedGuid);
                    }
                }
                
                if (guids.Any())
                {
                    query = query.Where(s => s.strParentScheduleGUID.HasValue && guids.Contains(s.strParentScheduleGUID.Value));
                }
            }
            
            // Apply default account type GUIDs filter
            if (!string.IsNullOrEmpty(filterDto.DefaultAccountTypeGUIDs))
            {
                var guidStrings = filterDto.DefaultAccountTypeGUIDs.Split(',').Select(g => g.Trim()).Where(g => !string.IsNullOrEmpty(g));
                var guids = new List<Guid>();
                
                foreach (var guidString in guidStrings)
                {
                    if (Guid.TryParse(guidString, out Guid parsedGuid))
                    {
                        guids.Add(parsedGuid);
                    }
                }
                
                if (guids.Any())
                {
                    query = query.Where(s => s.strDefaultAccountTypeGUID.HasValue && guids.Contains(s.strDefaultAccountTypeGUID.Value));
                }
            }

            // Created by and updated by filters removed as we no longer have these fields

            // Apply sorting
            if (!string.IsNullOrEmpty(filterDto.SortBy))
            {
                query = filterDto.SortBy.ToLower() switch
                {
                    "code" => filterDto.ascending 
                        ? query.OrderBy(s => s.code) 
                        : query.OrderByDescending(s => s.code),
                    "schedulecode" => filterDto.ascending 
                        ? query.OrderBy(s => s.strScheduleCode) 
                        : query.OrderByDescending(s => s.strScheduleCode),
                    "schedulename" => filterDto.ascending 
                        ? query.OrderBy(s => s.strScheduleName) 
                        : query.OrderByDescending(s => s.strScheduleName),
                    "refno" => filterDto.ascending 
                        ? query.OrderBy(s => s.strRefNo) 
                        : query.OrderByDescending(s => s.strRefNo),
                    "active" => filterDto.ascending 
                        ? query.OrderBy(s => s.bolIsActive) 
                        : query.OrderByDescending(s => s.bolIsActive),
                    _ => filterDto.ascending 
                        ? query.OrderBy(s => s.code) 
                        : query.OrderByDescending(s => s.code)
                };
            }
            else
            {
                // Default sort by code descending
                query = query.OrderByDescending(s => s.code);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            query = query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize);

            // Execute query and map results
            var schedules = await query.ToListAsync();
            var scheduleDtos = schedules.Select(MapToResponseDto).ToList();

            // Create and return paged response
            return new PagedResponse<ScheduleResponseDto>
            {
                Items = scheduleDtos,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalCount
            };
        }

        public async Task<ScheduleResponseDto> GetByIdAsync(string guid)
        {
            _logger.LogInformation($"Getting Schedule by GUID: {guid}");

            if (!Guid.TryParse(guid, out Guid parsedGuid))
                throw new BusinessException("Invalid GUID format");

            var schedule = await _dbContext.MstSchedules
                .FirstOrDefaultAsync(s => s.strScheduleGUID == parsedGuid);

            if (schedule == null)
                throw new BusinessException($"Schedule with GUID {guid} not found");

            return MapToResponseDto(schedule);
        }

        public async Task<ScheduleResponseDto> UpdateAsync(string guid, ScheduleUpdateDto updateDto, string updatedByGUID, string groupGUID)
        {
            _logger.LogInformation($"Updating Schedule with GUID: {guid}");

            if (!Guid.TryParse(guid, out Guid parsedGuid))
                throw new BusinessException("Invalid GUID format");

            var schedule = await _dbContext.MstSchedules
                .FirstOrDefaultAsync(s => s.strScheduleGUID == parsedGuid);

            if (schedule == null)
                throw new BusinessException($"Schedule with GUID {guid} not found");

            // Check if the code already exists (if it's being changed)
            if (updateDto.strScheduleCode != schedule.strScheduleCode &&
                await _dbContext.MstSchedules.AnyAsync(s => 
                    s.strScheduleCode == updateDto.strScheduleCode &&
                    s.strScheduleGUID != parsedGuid))
            {
                throw new BusinessException($"Schedule with code '{updateDto.strScheduleCode}' already exists");
            }

            // Update properties
            schedule.code = updateDto.code;
            schedule.strScheduleCode = updateDto.strScheduleCode;
            schedule.strRefNo = updateDto.strRefNo;
            schedule.strScheduleName = updateDto.strScheduleName;
            schedule.strTemplateName = updateDto.strTemplateName; // Corrected property name
            schedule.strUnderCode = updateDto.strUnderCode;
            schedule.strParentScheduleGUID = updateDto.strParentScheduleGUID;
            schedule.dblChartType = updateDto.dblChartType;
            schedule.strDefaultAccountTypeGUID = updateDto.strDefaultAccountTypeGUID;
            schedule.bolIsActive = updateDto.bolIsActive;
            schedule.bolIsEditable = updateDto.bolIsEditable;

            _dbContext.MstSchedules.Update(schedule);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation($"Updated Schedule with GUID: {guid}");
            
            return MapToResponseDto(schedule);
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            _logger.LogInformation($"Deleting Schedule with GUID: {guid}");

            if (!Guid.TryParse(guid, out Guid parsedGuid))
                throw new BusinessException("Invalid GUID format");

            var schedule = await _dbContext.MstSchedules
                .FirstOrDefaultAsync(s => s.strScheduleGUID == parsedGuid);

            if (schedule == null)
                return false;

            _dbContext.MstSchedules.Remove(schedule);
            await _dbContext.SaveChangesAsync();

            _logger.LogInformation($"Deleted Schedule with GUID: {guid}");
            
            return true;
        }

        public async Task<List<ScheduleSimpleDto>> GetActiveSchedulesAsync(string? search, string groupGUID)
        {
            _logger.LogInformation($"Getting active schedules with search: {search ?? "(all)"}");

            var query = _dbContext.MstSchedules
                .Where(s => s.bolIsActive);

            // Apply search filter only if search parameter is provided
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.ToLower();
                
                // Create a combined search query including the virtual strScheduleInfo field
                query = query.Where(s => 
                    s.strScheduleCode.ToLower().Contains(searchLower) ||
                    s.strScheduleName.ToLower().Contains(searchLower) ||
                    (s.strScheduleCode + " - " + s.strScheduleName).ToLower().Contains(searchLower));
            }

            var schedules = await query
                .OrderBy(s => s.strScheduleName)
                .Select(s => new ScheduleSimpleDto
                {
                    strScheduleGUID = s.strScheduleGUID,
                    strScheduleCode = s.strScheduleCode,
                    strScheduleName = s.strScheduleName,
                    strScheduleInfo = s.strScheduleCode + " - " + s.strScheduleName
                })
                .ToListAsync();

            return schedules;
        }

        public async Task<(byte[] fileContents, string contentType, string fileName)> ExportSchedulesAsync(string format, string groupGUID)
        {
            _logger.LogInformation($"Exporting schedules in format: {format}");

            // Get all active schedules
            var schedules = await _dbContext.MstSchedules
                .OrderBy(s => s.strScheduleName)
                .ToListAsync();

            if (!schedules.Any())
                throw new BusinessException("No schedules found to export");

            // Convert schedules to exportable data format
            var data = schedules.Select(s => new
            {
                Code = s.code,
                ScheduleCode = s.strScheduleCode,
                RefNo = s.strRefNo,
                ScheduleName = s.strScheduleName,
                TemplateName = s.strTemplateName,
                UnderCode = s.strUnderCode,
                IsActive = s.bolIsActive ? "Yes" : "No",
                IsEditable = s.bolIsEditable ? "Yes" : "No"
            }).ToList();

            // Format would be implemented using a helper service to export to Excel or CSV
            // This is a placeholder for where that implementation would go
            byte[] fileContents;
            string contentType;
            string fileName;

            if (format.ToLower() == "excel")
            {
                // Implement Excel export (using a helper library like EPPlus)
                // fileContents = ExportHelper.ToExcel(data);
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                fileName = $"Schedules_Export_{DateTime.Now:yyyyMMdd}.xlsx";
                
                // Placeholder implementation - would need real implementation
                fileContents = new byte[] { };
            }
            else if (format.ToLower() == "csv")
            {
                // Implement CSV export
                // fileContents = ExportHelper.ToCsv(data);
                contentType = "text/csv";
                fileName = $"Schedules_Export_{DateTime.Now:yyyyMMdd}.csv";
                
                // Placeholder implementation - would need real implementation
                fileContents = new byte[] { };
            }
            else
            {
                throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
            }

            return (fileContents, contentType, fileName);
        }

        public async Task<(byte[] fileContents, string contentType, string fileName)> ExportActiveScheduleTreeToPdfAsync(string groupGUID)
        {
            _logger.LogInformation("Exporting active schedule tree to PDF");

            var tree = await GetActiveScheduleTreeAsync(groupGUID);
            if (tree == null || !tree.Any())
                throw new BusinessException("No schedules found to export");

            QuestPDF.Settings.License = LicenseType.Community;

            // Flatten tree with depth levels
            var nodes = new List<(int Level, string Code, string Name, string Type)>();
            void Flatten(ScheduleTreeDto node, int level)
            {
                nodes.Add((level, node.strScheduleCode ?? string.Empty, node.strScheduleName ?? string.Empty, node.type ?? string.Empty));
                foreach (var child in node.Children)
                    Flatten(child, level + 1);
            }

            foreach (var root in tree)
                Flatten(root, 0);

            var fileName = $"Schedules_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
            var generatedAt = DateTime.UtcNow;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(30);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Column(headerCol =>
                    {
                        headerCol.Item().AlignCenter().Text("Active Schedule Tree").SemiBold().FontSize(16);
                        headerCol.Item().AlignCenter().Text($"Generated: {generatedAt:yyyy-MM-dd HH:mm:ss} UTC").FontSize(8).FontColor(Colors.Grey.Darken1);
                    });

                    page.Content().PaddingTop(10).Column(content =>
                    {
                        foreach (var n in nodes)
                        {
                            content.Item().PaddingLeft(n.Level * 12).PaddingBottom(4).Text(t =>
                            {
                                t.Span(n.Code + " - ").SemiBold();
                                t.Span(n.Name);
                            });
                        }
                    });

                    page.Footer().AlignCenter().Text($"Page {{number}} of {{total}}").FontSize(9).FontColor(Colors.Grey.Darken1);
                });
            });

            using var ms = new MemoryStream();
            document.GeneratePdf(ms);
            return (ms.ToArray(), "application/pdf", fileName);
        }

        public async Task<(byte[] fileContents, string contentType, string fileName)> ExportActiveScheduleTreeToExcelAsync(string groupGUID)
        {
            _logger.LogInformation("Exporting active schedule tree to Excel");

            var tree = await GetActiveScheduleTreeAsync(groupGUID);
            if (tree == null || !tree.Any())
                throw new BusinessException("No schedules found to export");

            // Flatten tree with depth levels
            var nodes = new List<(int Level, string Code, string Name, string Type)>();
            void Flatten(ScheduleTreeDto node, int level)
            {
                nodes.Add((level, node.strScheduleCode ?? string.Empty, node.strScheduleName ?? string.Empty, node.type ?? string.Empty));
                foreach (var child in node.Children)
                    Flatten(child, level + 1);
            }

            foreach (var root in tree)
                Flatten(root, 0);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Active Schedule Tree");

            // Headers
            worksheet.Cell(1, 1).Value = "Level";
            worksheet.Cell(1, 2).Value = "Code";
            worksheet.Cell(1, 3).Value = "Name";
            worksheet.Cell(1, 4).Value = "Type";

            // Header styling
            worksheet.Row(1).Style.Font.Bold = true;
            worksheet.SheetView.FreezeRows(1);

            int row = 2;
            bool firstRoot = true;
            foreach (var n in nodes)
            {
                if (n.Level == 0)
                {
                    // Add a blank separator row between top-level sections
                    if (!firstRoot)
                    {
                        row++;
                    }
                    firstRoot = false;

                    // Merge Code and Name columns for section header
                    var headerRange = worksheet.Range(row, 2, row, 3);
                    headerRange.Merge();
                    headerRange.Value = string.IsNullOrWhiteSpace(n.Code)
                        ? n.Name
                        : $"{n.Code} - {n.Name}";
                    headerRange.Style.Font.Bold = true;
                    headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Left;
                    headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

                    // Keep level and type in their columns for reference
                    worksheet.Cell(row, 1).Value = n.Level;
                    worksheet.Cell(row, 4).Value = n.Type;

                    row++;
                    continue;
                }

                // Regular rows
                worksheet.Cell(row, 1).Value = n.Level;
                worksheet.Cell(row, 2).Value = n.Code;
                var nameCell = worksheet.Cell(row, 3);
                nameCell.Value = n.Name;

                // Indentation for deeper levels
                if (n.Level > 1)
                    nameCell.Style.Alignment.Indent = n.Level;

                // Slight visual separation for label-type rows
                if (string.Equals(n.Type, "label", StringComparison.OrdinalIgnoreCase))
                {
                    nameCell.Style.Font.Bold = true;
                    worksheet.Row(row).Style.Fill.BackgroundColor = XLColor.LightGray;
                }

                worksheet.Cell(row, 4).Value = n.Type;
                row++;
            }

            worksheet.Columns().AdjustToContents();

            using var msExcel = new MemoryStream();
            workbook.SaveAs(msExcel);
            var fileName = $"Schedules_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx";
            return (msExcel.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        // Helper method to map Entity to DTO
        private ScheduleResponseDto MapToResponseDto(MstSchedule schedule)
        {            // Get parent schedule name if there's a parent GUID
            string? parentScheduleName = null;
            if (schedule.strParentScheduleGUID.HasValue)
            {
                var parentSchedule = _dbContext.MstSchedules
                    .FirstOrDefault(s => s.strScheduleGUID == schedule.strParentScheduleGUID);
                
                if (parentSchedule != null)
                {
                    parentScheduleName = parentSchedule.strScheduleName;
                }
            }
            
            // Get account type name if there's an account type GUID
            string? accountTypeName = null;
            if (schedule.strDefaultAccountTypeGUID.HasValue)
            {
                var accountType = _dbContext.MstAccountTypes
                    .FirstOrDefault(a => a.strAccountTypeGUID == schedule.strDefaultAccountTypeGUID);
                
                if (accountType != null)
                {
                    accountTypeName = accountType.strName;
                }
            }

            return new ScheduleResponseDto
            {
                strScheduleGUID = schedule.strScheduleGUID,
                code = schedule.code,
                strScheduleCode = schedule.strScheduleCode,
                strRefNo = schedule.strRefNo,
                strScheduleName = schedule.strScheduleName,
                strTemplateName = schedule.strTemplateName,
                strUnderCode = schedule.strUnderCode,
                strParentScheduleGUID = schedule.strParentScheduleGUID,
                strParentScheduleName = parentScheduleName, // Include parent schedule name
                dblChartType = schedule.dblChartType,
                strDefaultAccountTypeGUID = schedule.strDefaultAccountTypeGUID,
                strAccountTypeName = accountTypeName, // Include account type name
                bolIsActive = schedule.bolIsActive,
                bolIsEditable = schedule.bolIsEditable
            };
        }

        public async Task<ImportScheduleResultDto> ImportSchedulesAsync(IFormFile file, string userGuid, string groupGUID)
        {
            var result = new ImportScheduleResultDto();
            var duplicateSchedulesCache = new HashSet<string>();
            var scheduleGuidMapping = new Dictionary<int, Guid>();  // Maps Code to GUID for parent-child relationships

            try
            {
                // First parse the Excel file without database operations
                using var stream = file.OpenReadStream();
                using var workbook = new XLWorkbook(stream);
                var worksheet = workbook.Worksheet(1);
                
                var rowsUsed = worksheet.RowsUsed().Skip(1); // Skip header row
                result.TotalRows = rowsUsed.Count();

                // Create an execution strategy for our operations
                var strategy = _dbContext.Database.CreateExecutionStrategy();
                
                // First pass: Create all schedule entries
                foreach (var row in rowsUsed)
                {
                    try
                    {
                        // Skip empty rows
                        if (row.IsEmpty() || row.Cells().Any(c => string.IsNullOrWhiteSpace(c.GetString())))
                        {
                            continue;
                        }

                        var code = int.Parse(row.Cell(1).GetString().Trim());
                        var udfCode = row.Cell(2).GetString().Trim();
                        var refNo = row.Cell(3).GetString().Trim();
                        var name = row.Cell(4).GetString().Trim();
                        var templateCode = row.Cell(5).GetString().Trim();
                        var underCodeValue = row.Cell(6).GetString().Trim();
                        var chartType = int.Parse(row.Cell(7).GetString().Trim());
                        var defaultAccountTypeCode = row.Cell(8).GetString().Trim();
                        
                        // Get RefNo as string - we now accept any format
                        string? refNoValue = null;
                        if (!string.IsNullOrEmpty(refNo))
                        {
                            refNoValue = refNo.Trim();
                        }
                        
                        // Parse active status from column I
                        bool isActive;
                        var activeValue = row.Cell(9).GetString().Trim();
                        if (activeValue == "1")
                            isActive = true;
                        else if (activeValue == "0")
                            isActive = false;
                        else
                        {
                            result.ErrorMessages.Add($"Row {row.RowNumber()}: Invalid active value. Must be 0 or 1");
                            result.FailureCount++;
                            continue;
                        }
                        
                        // Parse editable status from column J
                        bool editable;
                        var editableValue = row.Cell(10).GetString().Trim();
                        if (editableValue == "0")
                            editable = false;
                        else if (editableValue == "1")
                            editable = true;
                        else
                        {
                            result.ErrorMessages.Add($"Row {row.RowNumber()}: Invalid editable value. Must be 0 or 1");
                            result.FailureCount++;
                            continue;
                        }

                        await strategy.ExecuteAsync(async () => 
                        {
                            // Check for duplicate schedule code
                            var existingSchedule = await _dbContext.MstSchedules
                                .FirstOrDefaultAsync(s => s.strScheduleCode == udfCode);

                            if (existingSchedule != null)
                            {
                                var duplicateKey = $"{udfCode} - {name}";
                                if (duplicateSchedulesCache.Add(duplicateKey))
                                {
                                    result.DuplicateSchedules.Add(duplicateKey);
                                }
                                result.ErrorMessages.Add($"Row {row.RowNumber()}: Schedule code '{udfCode}' already exists");
                                result.FailureCount++;
                                return;
                            }

                            // Create new schedule
                            var scheduleGuid = Guid.NewGuid();
                            
                            // Use the previously parsed refNoValue (moved outside the lambda)
                            
                            // Resolve DefaultAccountTypeGUID from the code/name
                            Guid? defaultAccountTypeGuid = null;
                            if (!string.IsNullOrEmpty(defaultAccountTypeCode))
                            {
                                // First try to parse as direct GUID
                                if (Guid.TryParse(defaultAccountTypeCode, out Guid parsedGuid))
                                {
                                    // Check if this GUID exists in the database
                                    var accountTypeExists = await _dbContext.MstAccountTypes
                                        .AnyAsync(a => a.strAccountTypeGUID == parsedGuid);
                                    
                                    if (accountTypeExists)
                                    {
                                        defaultAccountTypeGuid = parsedGuid;
                                    }
                                    else
                                    {
                                        result.ErrorMessages.Add($"Row {row.RowNumber()}: Account type GUID '{defaultAccountTypeCode}' does not exist");
                                    }
                                }
                                else
                                {
                                    // Look up by name if not a GUID
                                    var accountType = await _dbContext.MstAccountTypes
                                        .FirstOrDefaultAsync(a => a.strName.ToLower() == defaultAccountTypeCode.ToLower());
                                    
                                    if (accountType != null)
                                    {
                                        defaultAccountTypeGuid = accountType.strAccountTypeGUID;
                                    }
                                    else
                                    {
                                        result.ErrorMessages.Add($"Row {row.RowNumber()}: Account type '{defaultAccountTypeCode}' not found");
                                    }
                                }
                            }
                            
                            var newSchedule = new MstSchedule
                            {
                                strScheduleGUID = scheduleGuid,
                                code = code,
                                strScheduleCode = udfCode,
                                strRefNo = refNoValue,
                                strScheduleName = name,
                                strTemplateName = templateCode, // Was renamed from strRemplateName
                                strUnderCode = underCodeValue, // Store as string without parsing
                                // Parent relationship will be set in second pass
                                strParentScheduleGUID = null, 
                                dblChartType = chartType,
                                strDefaultAccountTypeGUID = defaultAccountTypeGuid, // Now resolved from code/name
                                bolIsActive = isActive,
                                bolIsEditable = editable
                            };
                            
                            await _dbContext.MstSchedules.AddAsync(newSchedule);
                            await _dbContext.SaveChangesAsync();
                            
                            // Store the mapping of code to GUID for parent-child relationships
                            scheduleGuidMapping[code] = scheduleGuid;
                            result.SuccessCount++;
                        });
                    }
                    catch (Exception ex)
                    {
                        result.ErrorMessages.Add($"Row {row.RowNumber()}: {ex.Message}");
                        result.FailureCount++;
                    }
                }

                // Second pass: Update parent-child relationships
                await UpdateParentChildRelationships(scheduleGuidMapping, groupGUID);
            }
            catch (Exception ex)
            {
                throw new BusinessException($"Import failed: {ex.Message}");
            }
            
            return result;
        }

        private Guid GetDefaultGroupGuid()
        {
            // Try to get a default group from the database, or return a fixed GUID for super admin
            var defaultGroup = _dbContext.MstGroups.FirstOrDefault();
            return defaultGroup?.strGroupGUID ?? Guid.Empty;
        }

        private async Task UpdateParentChildRelationships(Dictionary<int, Guid> scheduleGuidMapping, string groupGUID)
        {
            // Get all schedules
            var query = _dbContext.MstSchedules.AsQueryable();
            
            var allSchedules = await query.ToListAsync();

            // Create a dictionary to map schedule codes to their respective schedules
            var schedulesByCode = allSchedules
                .Where(s => s.code > 0)
                .ToDictionary(s => s.code, s => s);

            // Also create a dictionary to map schedule strScheduleCode to their respective schedules
            var schedulesByStrCode = allSchedules
                .Where(s => !string.IsNullOrEmpty(s.strScheduleCode))
                .ToDictionary(s => s.strScheduleCode, s => s);

            // For each schedule, try to find its parent based on the UnderCode
            foreach (var schedule in allSchedules)
            {
                // If UnderCode is empty or "0", this is a top-level item
                if (string.IsNullOrEmpty(schedule.strUnderCode) || schedule.strUnderCode == "0")
                    continue;

                // For hierarchical codes like "1.2.3", the parent would be "1.2"
                string parentCodeString = schedule.strUnderCode;
                
                // If the code contains periods (hierarchical), get the parent part
                if (parentCodeString.Contains('.'))
                {
                    int lastDotIndex = parentCodeString.LastIndexOf('.');
                    if (lastDotIndex > 0)
                    {
                        parentCodeString = parentCodeString.Substring(0, lastDotIndex);
                    }
                }
                
                // First try to find parent by strScheduleCode (this could be a hierarchical code)
                if (schedulesByStrCode.TryGetValue(parentCodeString, out var parentByStrCode))
                {
                    schedule.strParentScheduleGUID = parentByStrCode.strScheduleGUID;
                    continue;
                }
                
                // If not found by strScheduleCode, try to parse as an integer for the mapping lookup
                if (int.TryParse(parentCodeString, out int parentCode))
                {
                    // Try to find the parent's GUID in our mapping
                    if (scheduleGuidMapping.TryGetValue(parentCode, out Guid parentGuid))
                    {
                        schedule.strParentScheduleGUID = parentGuid;
                        continue;
                    }
                    // Also check if we can find it by code in our schedulesByCode dictionary
                    else if (schedulesByCode.TryGetValue(parentCode, out var parentSchedule))
                    {
                        schedule.strParentScheduleGUID = parentSchedule.strScheduleGUID;
                        continue;
                    }
                }
                
                // If we get here, we couldn't find a parent match using any method
                _logger.LogWarning($"Could not find parent for schedule {schedule.strScheduleCode} with underCode {schedule.strUnderCode}");
            }

            // Save all changes
            await _dbContext.SaveChangesAsync();
        }

        public async Task<List<ScheduleTreeDto>> GetActiveScheduleTreeAsync(string groupGUID)
        {
            _logger.LogInformation($"Getting active schedule tree");

            Guid groupGuidParsed = Guid.Empty;
            if (!string.IsNullOrEmpty(groupGUID))
            {
                Guid.TryParse(groupGUID, out groupGuidParsed);
            }

            // Get all active schedules with their rename information
            var query = _dbContext.MstSchedules.Where(s => s.bolIsActive);

            // If a specific group context exists, apply logic to show only:
            // 1. Non-editable (standard) schedules
            // 2. Editable schedules that have been renamed/activated for this group
            if (groupGuidParsed != Guid.Empty)
            {
                query = query.Where(s =>
                    !s.bolIsEditable ||
                    _dbContext.MstRenameSchedules.Any(rs =>
                        rs.strScheduleGUID == s.strScheduleGUID &&
                        rs.strGroupGUID == groupGuidParsed
                    )
                );
            }

            var schedules = await query
                .OrderBy(s => s.strRefNo)
                .ToListAsync();

            // First, get all root schedules (schedules without parents or with null parent GUID)
            var rootSchedules = schedules
                .Where(s => s.strParentScheduleGUID == null || s.strParentScheduleGUID == Guid.Empty)
                .ToList();

            // Create a dictionary for quick lookup
            var scheduleMap = schedules.ToDictionary(s => s.strScheduleGUID, s => s);

            // Get all renamed schedules for the provided group
            var renameScheduleMap = new Dictionary<Guid, string>();
            if (groupGuidParsed != Guid.Empty)
            {
                var renamedSchedules = await _dbContext.MstRenameSchedules
                    .Where(rs => rs.strGroupGUID == groupGuidParsed)
                    .ToListAsync();

                renameScheduleMap = renamedSchedules.ToDictionary(rs => rs.strScheduleGUID, rs => rs.strRenameScheduleName);
            }

            // Build the tree
            var result = rootSchedules.Select(root => BuildScheduleTree(root, scheduleMap, schedules, renameScheduleMap)).ToList();

            return result;
        }

        // Helper method to recursively build the schedule tree
        private ScheduleTreeDto BuildScheduleTree(MstSchedule schedule, Dictionary<Guid, MstSchedule> scheduleMap, List<MstSchedule> allSchedules, Dictionary<Guid, string> renameScheduleMap)
        {
            // Find all children of this schedule
            var children = allSchedules
                .Where(s => s.strParentScheduleGUID == schedule.strScheduleGUID)
                .ToList();

            // Check if there is a renamed schedule for this schedule
            string displayName = schedule.strScheduleName;
            if (renameScheduleMap.TryGetValue(schedule.strScheduleGUID, out string? renamedName) && !string.IsNullOrEmpty(renamedName))
            {
                displayName = renamedName;
            }

            // Create the tree node
            var treeNode = new ScheduleTreeDto
            {
                strScheduleGUID = schedule.strScheduleGUID,
                strScheduleCode = schedule.strScheduleCode,
                strScheduleName = displayName,
                strScheduleInfo = $"{schedule.strScheduleCode} - {displayName}",
                type = children.Any() ? "label" : "data"  // Set to "label" if it has children, otherwise "data"
            };

            // Recursively build children trees
            foreach (var child in children)
            {
                treeNode.Children.Add(BuildScheduleTree(child, scheduleMap, allSchedules, renameScheduleMap));
            }

            return treeNode;
        }
    }
}
