using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.TaxRate;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.EntityFrameworkCore;
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
    public class TaxRateService : ServiceBase, ITaxRateService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public TaxRateService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<TaxRateResponseDto> CreateAsync(TaxRateCreateDto createDto, string createdByGUID)
        {
            // Validate and parse Tax Type GUID
            if (string.IsNullOrWhiteSpace(createDto.strTaxTypeGUID))
                throw new BusinessException("Tax Type GUID is required");

            if (!Guid.TryParse(createDto.strTaxTypeGUID, out var taxTypeGuid))
                throw new BusinessException($"Invalid Tax Type GUID format: '{createDto.strTaxTypeGUID}'. Please provide a valid GUID.");

            // Validate and parse Tax Category GUID
            if (string.IsNullOrWhiteSpace(createDto.strTaxCategoryGUID))
                throw new BusinessException("Tax Category GUID is required");

            if (!Guid.TryParse(createDto.strTaxCategoryGUID, out var taxCategoryGuid))
                throw new BusinessException($"Invalid Tax Category GUID format: '{createDto.strTaxCategoryGUID}'. Please provide a valid GUID.");

            // Validate and parse Schedule GUID
            if (string.IsNullOrWhiteSpace(createDto.strScheduleGUID))
                throw new BusinessException("Schedule GUID is required");

            if (!Guid.TryParse(createDto.strScheduleGUID, out var scheduleGuid))
                throw new BusinessException($"Invalid Schedule GUID format: '{createDto.strScheduleGUID}'. Please provide a valid GUID.");

            // Validate and parse Created By GUID
            if (string.IsNullOrWhiteSpace(createdByGUID))
                throw new BusinessException("User GUID is required");

            if (!Guid.TryParse(createdByGUID, out var createdByGuidParsed))
                throw new BusinessException("Invalid user GUID format");

            // Check for duplicate tax rate code
            var existsByCode = await _context.MstTaxRates
                .AnyAsync(x => x.strTaxRateCode.ToLower() == createDto.strTaxRateCode.ToLower());

            if (existsByCode)
                throw new BusinessException($"A tax rate with code '{createDto.strTaxRateCode}' already exists");

            // Validate tax type exists in database
            var taxTypeExists = await _context.MstTaxTypes
                .AnyAsync(x => x.strTaxTypeGUID == taxTypeGuid);

            if (!taxTypeExists)
                throw new BusinessException($"Tax Type with GUID '{createDto.strTaxTypeGUID}' does not exist in the system. Please provide a valid Tax Type GUID.");

            // Validate tax category exists in database
            var taxCategoryExists = await _context.MstTaxCategories
                .AnyAsync(x => x.strTaxCategoryGUID == taxCategoryGuid);

            if (!taxCategoryExists)
                throw new BusinessException($"Tax Category with GUID '{createDto.strTaxCategoryGUID}' does not exist in the system. Please provide a valid Tax Category GUID.");

            // Validate schedule exists in database
            var scheduleExists = await _context.MstSchedules
                .AnyAsync(x => x.strScheduleGUID == scheduleGuid);

            if (!scheduleExists)
                throw new BusinessException($"Schedule with GUID '{createDto.strScheduleGUID}' does not exist in the system. Please provide a valid Schedule GUID from the mstSchedule table.");

            // Validate state if provided
            Guid? stateGuid = null;
            if (!string.IsNullOrWhiteSpace(createDto.strStateGUID))
            {
                if (!Guid.TryParse(createDto.strStateGUID, out var parsedStateGuid))
                    throw new BusinessException($"Invalid State GUID format: '{createDto.strStateGUID}'. Please provide a valid GUID.");

                var stateExists = await _context.MstState
                    .AnyAsync(x => x.strStateGUID == parsedStateGuid);

                if (!stateExists)
                    throw new BusinessException($"State with GUID '{createDto.strStateGUID}' does not exist in the system. Please provide a valid State GUID from the mstState table.");

                stateGuid = parsedStateGuid;
            }

            // Validate date range
            if (createDto.dtEffectiveFrom.HasValue && createDto.dtEffectiveTo.HasValue)
            {
                if (createDto.dtEffectiveFrom.Value > createDto.dtEffectiveTo.Value)
                    throw new BusinessException("Effective from date cannot be greater than effective to date");
            }

            var taxRate = new MstTaxRate
            {
                strTaxRateGUID = Guid.NewGuid(),
                strTaxTypeGUID = taxTypeGuid,
                strTaxCategoryGUID = taxCategoryGuid,
                strScheduleGUID = scheduleGuid,
                strTaxRateName = createDto.strTaxRateName,
                decTaxPercentage = createDto.decTaxPercentage,
                strTaxRateCode = createDto.strTaxRateCode,
                strStateGUID = stateGuid,
                intDisplayOrder = createDto.intDisplayOrder,
                dtEffectiveFrom = createDto.dtEffectiveFrom,
                dtEffectiveTo = createDto.dtEffectiveTo,
                bolIsActive = createDto.bolIsActive,
                strCreatedByGUID = createdByGuidParsed,
                dtCreatedOn = CurrentDateTime,
                strUpdatedByGUID = createdByGuidParsed,
                dtUpdatedOn = CurrentDateTime
            };

            _context.MstTaxRates.Add(taxRate);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(taxRate.strTaxRateGUID.ToString());
        }

        public async Task<TaxRateResponseDto> UpdateAsync(string guid, TaxRateUpdateDto updateDto, string updatedByGUID)
        {
            // Validate and parse Tax Rate GUID
            if (string.IsNullOrWhiteSpace(guid))
                throw new BusinessException("Tax Rate GUID is required");

            if (!Guid.TryParse(guid, out var taxRateGuid))
                throw new BusinessException($"Invalid Tax Rate GUID format: '{guid}'. Please provide a valid GUID.");

            // Validate and parse Tax Type GUID
            if (string.IsNullOrWhiteSpace(updateDto.strTaxTypeGUID))
                throw new BusinessException("Tax Type GUID is required");

            if (!Guid.TryParse(updateDto.strTaxTypeGUID, out var taxTypeGuid))
                throw new BusinessException($"Invalid Tax Type GUID format: '{updateDto.strTaxTypeGUID}'. Please provide a valid GUID.");

            // Validate and parse Tax Category GUID
            if (string.IsNullOrWhiteSpace(updateDto.strTaxCategoryGUID))
                throw new BusinessException("Tax Category GUID is required");

            if (!Guid.TryParse(updateDto.strTaxCategoryGUID, out var taxCategoryGuid))
                throw new BusinessException($"Invalid Tax Category GUID format: '{updateDto.strTaxCategoryGUID}'. Please provide a valid GUID.");

            // Validate and parse Schedule GUID
            if (string.IsNullOrWhiteSpace(updateDto.strScheduleGUID))
                throw new BusinessException("Schedule GUID is required");

            if (!Guid.TryParse(updateDto.strScheduleGUID, out var scheduleGuid))
                throw new BusinessException($"Invalid Schedule GUID format: '{updateDto.strScheduleGUID}'. Please provide a valid GUID.");

            // Validate and parse Updated By GUID
            if (string.IsNullOrWhiteSpace(updatedByGUID))
                throw new BusinessException("User GUID is required");

            if (!Guid.TryParse(updatedByGUID, out var updatedByGuidParsed))
                throw new BusinessException("Invalid user GUID format");

            var taxRate = await _context.MstTaxRates.FindAsync(taxRateGuid);
            if (taxRate == null)
                throw new BusinessException($"Tax rate with GUID '{guid}' not found");

            // Check for duplicate tax rate code (excluding current record)
            var existsByCode = await _context.MstTaxRates
                .AnyAsync(x => x.strTaxRateCode.ToLower() == updateDto.strTaxRateCode.ToLower() 
                            && x.strTaxRateGUID != taxRateGuid);

            if (existsByCode)
                throw new BusinessException($"A tax rate with code '{updateDto.strTaxRateCode}' already exists");

            // Validate tax type exists in database
            var taxTypeExists = await _context.MstTaxTypes
                .AnyAsync(x => x.strTaxTypeGUID == taxTypeGuid);

            if (!taxTypeExists)
                throw new BusinessException($"Tax Type with GUID '{updateDto.strTaxTypeGUID}' does not exist in the system. Please provide a valid Tax Type GUID.");

            // Validate tax category exists in database
            var taxCategoryExists = await _context.MstTaxCategories
                .AnyAsync(x => x.strTaxCategoryGUID == taxCategoryGuid);

            if (!taxCategoryExists)
                throw new BusinessException($"Tax Category with GUID '{updateDto.strTaxCategoryGUID}' does not exist in the system. Please provide a valid Tax Category GUID.");

            // Validate schedule exists in database
            var scheduleExists = await _context.MstSchedules
                .AnyAsync(x => x.strScheduleGUID == scheduleGuid);

            if (!scheduleExists)
                throw new BusinessException($"Schedule with GUID '{updateDto.strScheduleGUID}' does not exist in the system. Please provide a valid Schedule GUID from the mstSchedule table.");

            // Validate state if provided
            Guid? stateGuid = null;
            if (!string.IsNullOrWhiteSpace(updateDto.strStateGUID))
            {
                if (!Guid.TryParse(updateDto.strStateGUID, out var parsedStateGuid))
                    throw new BusinessException($"Invalid State GUID format: '{updateDto.strStateGUID}'. Please provide a valid GUID.");

                var stateExists = await _context.MstState
                    .AnyAsync(x => x.strStateGUID == parsedStateGuid);

                if (!stateExists)
                    throw new BusinessException($"State with GUID '{updateDto.strStateGUID}' does not exist in the system. Please provide a valid State GUID from the mstState table.");

                stateGuid = parsedStateGuid;
            }

            // Validate date range
            if (updateDto.dtEffectiveFrom.HasValue && updateDto.dtEffectiveTo.HasValue)
            {
                if (updateDto.dtEffectiveFrom.Value > updateDto.dtEffectiveTo.Value)
                    throw new BusinessException("Effective from date cannot be greater than effective to date");
            }

            taxRate.strTaxTypeGUID = taxTypeGuid;
            taxRate.strTaxCategoryGUID = taxCategoryGuid;
            taxRate.strScheduleGUID = scheduleGuid;
            taxRate.strTaxRateName = updateDto.strTaxRateName;
            taxRate.decTaxPercentage = updateDto.decTaxPercentage;
            taxRate.strTaxRateCode = updateDto.strTaxRateCode;
            taxRate.strStateGUID = stateGuid;
            taxRate.intDisplayOrder = updateDto.intDisplayOrder;
            taxRate.dtEffectiveFrom = updateDto.dtEffectiveFrom;
            taxRate.dtEffectiveTo = updateDto.dtEffectiveTo;
            taxRate.bolIsActive = updateDto.bolIsActive;
            taxRate.strUpdatedByGUID = updatedByGuidParsed;
            taxRate.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(guid);
        }

        public async Task<TaxRateResponseDto> GetByIdAsync(string guid)
        {
            if (!Guid.TryParse(guid, out var taxRateGuid))
                throw new BusinessException($"Invalid Tax Rate GUID format: '{guid}'. Please provide a valid GUID.");

            var taxRate = await _context.MstTaxRates
                .Include(t => t.TaxType)
                .Include(t => t.TaxCategory)
                .Include(t => t.Schedule)
                .Include(t => t.State)
                .Include(t => t.CreatedBy)
                .Include(t => t.UpdatedBy)
                .FirstOrDefaultAsync(t => t.strTaxRateGUID == taxRateGuid);

            if (taxRate == null)
                throw new BusinessException("Tax rate not found");

            return new TaxRateResponseDto
            {
                strTaxRateGUID = taxRate.strTaxRateGUID.ToString(),
                strTaxTypeGUID = taxRate.strTaxTypeGUID.ToString(),
                strTaxTypeName = taxRate.TaxType?.strTaxTypeName,
                strTaxTypeCode = taxRate.TaxType?.strTaxTypeCode,
                strTaxCategoryGUID = taxRate.strTaxCategoryGUID.ToString(),
                strTaxCategoryName = taxRate.TaxCategory?.strCategoryName,
                strScheduleGUID = taxRate.strScheduleGUID.ToString(),
                strScheduleName = taxRate.Schedule?.strScheduleName,
                strTaxRateName = taxRate.strTaxRateName,
                decTaxPercentage = taxRate.decTaxPercentage,
                strTaxRateCode = taxRate.strTaxRateCode,
                strStateGUID = taxRate.strStateGUID?.ToString(),
                strStateName = taxRate.State?.strName,
                intDisplayOrder = taxRate.intDisplayOrder,
                dtEffectiveFrom = taxRate.dtEffectiveFrom,
                dtEffectiveTo = taxRate.dtEffectiveTo,
                bolIsActive = taxRate.bolIsActive,
                dtCreatedOn = taxRate.dtCreatedOn,
                strCreatedByName = taxRate.CreatedBy?.strName,
                dtUpdatedOn = taxRate.dtUpdatedOn,
                strUpdatedByName = taxRate.UpdatedBy?.strName
            };
        }

        public async Task<PagedResponse<TaxRateResponseDto>> GetAllAsync(TaxRateFilterDto filterDto)
        {
            var query = _context.MstTaxRates
                .Include(t => t.TaxType)
                .Include(t => t.TaxCategory)
                .Include(t => t.Schedule)
                .Include(t => t.State)
                .Include(t => t.CreatedBy)
                .Include(t => t.UpdatedBy)
                .AsQueryable();

            // Apply IsActive filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Apply TaxType filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strTaxTypeGUID))
            {
                if (Guid.TryParse(filterDto.strTaxTypeGUID, out var taxTypeGuid))
                {
                    query = query.Where(x => x.strTaxTypeGUID == taxTypeGuid);
                }
            }

            // Apply TaxCategory filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strTaxCategoryGUID))
            {
                if (Guid.TryParse(filterDto.strTaxCategoryGUID, out var taxCategoryGuid))
                {
                    query = query.Where(x => x.strTaxCategoryGUID == taxCategoryGuid);
                }
            }
            // Apply Schedule filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strScheduleGUID))
            {
                if (Guid.TryParse(filterDto.strScheduleGUID, out var scheduleGuid))
                {
                    query = query.Where(x => x.strScheduleGUID == scheduleGuid);
                }
            }
            // Apply Schedule filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strScheduleGUID))
            {
                if (Guid.TryParse(filterDto.strScheduleGUID, out var scheduleGuid))
                {
                    query = query.Where(x => x.strScheduleGUID == scheduleGuid);
                }
            }

            // Apply State filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strStateGUID))
            {
                if (Guid.TryParse(filterDto.strStateGUID, out var stateGuid))
                {
                    query = query.Where(x => x.strStateGUID == stateGuid);
                }
            }

            // Apply general search if provided
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    query = query.Where(x => x.bolIsActive == false);
                }
                else
                {
                    // Regular search across fields
                    query = query.Where(x => 
                        x.strTaxRateCode.ToLower().Contains(searchTerm) ||
                        x.strTaxRateName.ToLower().Contains(searchTerm) ||
                        (x.TaxType != null && x.TaxType.strTaxTypeName.ToLower().Contains(searchTerm)) ||
                        (x.TaxCategory != null && x.TaxCategory.strCategoryName.ToLower().Contains(searchTerm)) ||
                        (x.Schedule != null && x.Schedule.strScheduleName.ToLower().Contains(searchTerm)) ||
                        (x.State != null && x.State.strName.ToLower().Contains(searchTerm)));
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                string sortField = filterDto.SortBy.ToLower() switch
                {
                    "code" => "strTaxRateCode",
                    "name" => "strTaxRateName",
                    "percentage" => "decTaxPercentage",
                    "taxtype" => "TaxType.strTaxTypeName",
                    "taxcategory" => "TaxCategory.strCategoryName",
                    "state" => "State.strName",
                    "displayorder" => "intDisplayOrder",
                    "isactive" => "bolIsActive",
                    "status" => "bolIsActive",
                    _ => "intDisplayOrder"
                };
                
                bool isStatusSort = sortField == "bolIsActive";
                bool actualAscending = isStatusSort ? !filterDto.ascending : filterDto.ascending;
                var sortOrder = actualAscending ? "ascending" : "descending";
                
                try
                {
                    query = query.OrderBy($"{sortField} {sortOrder}");
                }
                catch
                {
                    query = filterDto.ascending 
                        ? query.OrderBy(x => x.intDisplayOrder).ThenBy(x => x.strTaxRateCode)
                        : query.OrderByDescending(x => x.intDisplayOrder).ThenByDescending(x => x.strTaxRateCode);
                }
            }
            else
            {
                query = filterDto.ascending 
                    ? query.OrderBy(x => x.intDisplayOrder).ThenBy(x => x.strTaxRateCode)
                    : query.OrderByDescending(x => x.intDisplayOrder).ThenByDescending(x => x.strTaxRateCode);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var dtos = items.Select(taxRate => new TaxRateResponseDto
            {
                strTaxRateGUID = taxRate.strTaxRateGUID.ToString(),
                strTaxTypeGUID = taxRate.strTaxTypeGUID.ToString(),
                strTaxTypeName = taxRate.TaxType?.strTaxTypeName,
                strTaxTypeCode = taxRate.TaxType?.strTaxTypeCode,
                strTaxCategoryGUID = taxRate.strTaxCategoryGUID.ToString(),
                strTaxCategoryName = taxRate.TaxCategory?.strCategoryName,
                strScheduleGUID = taxRate.strScheduleGUID.ToString(),
                strScheduleName = taxRate.Schedule?.strScheduleName,
                strTaxRateName = taxRate.strTaxRateName,
                decTaxPercentage = taxRate.decTaxPercentage,
                strTaxRateCode = taxRate.strTaxRateCode,
                strStateGUID = taxRate.strStateGUID?.ToString(),
                strStateName = taxRate.State?.strName,
                intDisplayOrder = taxRate.intDisplayOrder,
                dtEffectiveFrom = taxRate.dtEffectiveFrom,
                dtEffectiveTo = taxRate.dtEffectiveTo,
                bolIsActive = taxRate.bolIsActive,
                dtCreatedOn = taxRate.dtCreatedOn,
                strCreatedByName = taxRate.CreatedBy?.strName,
                dtUpdatedOn = taxRate.dtUpdatedOn,
                strUpdatedByName = taxRate.UpdatedBy?.strName
            }).ToList();

            var response = new PagedResponse<TaxRateResponseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
            };
            
            return response;
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            if (!Guid.TryParse(guid, out var taxRateGuid))
                throw new BusinessException($"Invalid Tax Rate GUID format: '{guid}'. Please provide a valid GUID.");

            var taxRate = await _context.MstTaxRates
                .FirstOrDefaultAsync(t => t.strTaxRateGUID == taxRateGuid);

            if (taxRate == null)
                return false;

            _context.MstTaxRates.Remove(taxRate);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<TaxRateSimpleDto>> GetActiveTaxRatesAsync(string? searchTerm, string strTaxTypeGUID)
        {
            // Validate and parse Tax Type GUID
            if (string.IsNullOrWhiteSpace(strTaxTypeGUID))
                throw new BusinessException("Tax Type GUID is required");

            if (!Guid.TryParse(strTaxTypeGUID, out var taxTypeGuid))
                throw new BusinessException($"Invalid Tax Type GUID format: '{strTaxTypeGUID}'. Please provide a valid GUID.");

            // Validate tax type exists in database
            var taxTypeExists = await _context.MstTaxTypes
                .AnyAsync(x => x.strTaxTypeGUID == taxTypeGuid);

            if (!taxTypeExists)
                throw new BusinessException($"Tax Type with GUID '{strTaxTypeGUID}' does not exist in the system. Please provide a valid Tax Type GUID.");

            var query = _context.MstTaxRates
                .Include(t => t.TaxType)
                .Include(t => t.TaxCategory)
                .Include(t => t.Schedule)
                .Include(t => t.State)
                .Where(x => x.bolIsActive == true && x.strTaxTypeGUID == taxTypeGuid);

            // Filter by effective date (current date should be within the range)
            var currentDate = DateTime.UtcNow;
            query = query.Where(x => 
                (!x.dtEffectiveFrom.HasValue || x.dtEffectiveFrom.Value <= currentDate) &&
                (!x.dtEffectiveTo.HasValue || x.dtEffectiveTo.Value >= currentDate));

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.ToLower();
                query = query.Where(x => 
                    x.strTaxRateCode.ToLower().Contains(term) ||
                    x.strTaxRateName.ToLower().Contains(term));
            }

            query = query.OrderBy(x => x.intDisplayOrder).ThenBy(x => x.strTaxRateCode);

            var result = await query
                .Select(x => new TaxRateSimpleDto
                {
                    strTaxRateGUID = x.strTaxRateGUID.ToString(),
                    strTaxRateName = x.strTaxRateName,
                    strTaxRateCode = x.strTaxRateCode,
                    decTaxPercentage = x.decTaxPercentage,
                    strTaxTypeName = x.TaxType != null ? x.TaxType.strTaxTypeName : null,
                    strTaxCategoryName = x.TaxCategory != null ? x.TaxCategory.strCategoryName : null,
                    strStateName = x.State != null ? x.State.strName : null
                })
                .ToListAsync();

            return result;
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportTaxRatesAsync(string format)
        {
            var taxRates = await _context.MstTaxRates
                .Include(t => t.TaxType)
                .Include(t => t.TaxCategory)
                .Include(t => t.Schedule)
                .Include(t => t.State)
                .OrderBy(x => x.intDisplayOrder)
                .ThenBy(x => x.strTaxRateCode)
                .ToListAsync();
            
            if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
            {
                throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
            }

            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            
            if (format.ToLower() == "excel")
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Tax Rates");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Code";
                worksheet.Cell(1, 2).Value = "Name";
                worksheet.Cell(1, 3).Value = "Percentage";
                worksheet.Cell(1, 4).Value = "Tax Type";
                worksheet.Cell(1, 5).Value = "Tax Category";
                worksheet.Cell(1, 6).Value = "Schedule";
                worksheet.Cell(1, 7).Value = "State";
                worksheet.Cell(1, 8).Value = "Display Order";
                worksheet.Cell(1, 9).Value = "Effective From";
                worksheet.Cell(1, 10).Value = "Effective To";
                worksheet.Cell(1, 11).Value = "Status";
                worksheet.Cell(1, 12).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < taxRates.Count; i++)
                {
                    var taxRate = taxRates[i];
                    int row = i + 2;
                    
                    worksheet.Cell(row, 1).Value = taxRate.strTaxRateCode;
                    worksheet.Cell(row, 2).Value = taxRate.strTaxRateName;
                    worksheet.Cell(row, 3).Value = taxRate.decTaxPercentage;
                    worksheet.Cell(row, 4).Value = taxRate.TaxType?.strTaxTypeName ?? "";
                    worksheet.Cell(row, 5).Value = taxRate.TaxCategory?.strCategoryName ?? "";
                    worksheet.Cell(row, 6).Value = taxRate.Schedule?.strScheduleName ?? "";
                    worksheet.Cell(row, 7).Value = taxRate.State?.strName ?? "";
                    worksheet.Cell(row, 8).Value = taxRate.intDisplayOrder;
                    worksheet.Cell(row, 9).Value = taxRate.dtEffectiveFrom?.ToString("yyyy-MM-dd") ?? "";
                    worksheet.Cell(row, 10).Value = taxRate.dtEffectiveTo?.ToString("yyyy-MM-dd") ?? "";
                    worksheet.Cell(row, 11).Value = taxRate.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 12).Value = taxRate.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                worksheet.Columns().AdjustToContents();
                
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"TaxRates_{timestamp}.xlsx");
            }
            else // CSV
            {
                var csv = new StringBuilder();
                csv.AppendLine("Code,Name,Percentage,Tax Type,Tax Category,Schedule,State,Display Order,Effective From,Effective To,Status,Created On");
                
                foreach (var taxRate in taxRates)
                {
                    csv.AppendLine($"\"{taxRate.strTaxRateCode.Replace("\"", "\"\"")}\",\"{taxRate.strTaxRateName.Replace("\"", "\"\"")}\",{taxRate.decTaxPercentage},\"{(taxRate.TaxType?.strTaxTypeName ?? "").Replace("\"", "\"\"")}\",\"{(taxRate.TaxCategory?.strCategoryName ?? "").Replace("\"", "\"\"")}\",\"{(taxRate.Schedule?.strScheduleName ?? "").Replace("\"", "\"\"")}\",\"{(taxRate.State?.strName ?? "").Replace("\"", "\"\"")}\",{taxRate.intDisplayOrder},\"{taxRate.dtEffectiveFrom?.ToString("yyyy-MM-dd") ?? ""}\",\"{taxRate.dtEffectiveTo?.ToString("yyyy-MM-dd") ?? ""}\",{(taxRate.bolIsActive ? "Active" : "Inactive")},{taxRate.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return (bytes, "text/csv", $"TaxRates_{timestamp}.csv");
            }
        }
    }
}
