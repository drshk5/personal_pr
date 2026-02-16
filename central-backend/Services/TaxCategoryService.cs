using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.TaxCategory;
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
    public class TaxCategoryService : ServiceBase, ITaxCategoryService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public TaxCategoryService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<TaxCategoryResponseDto> CreateAsync(TaxCategoryCreateDto createDto, string createdByGUID)
        {
            // Validate and parse tax type GUID
            if (string.IsNullOrWhiteSpace(createDto.strTaxTypeGUID))
                throw new BusinessException("Tax Type GUID is required");

            if (!Guid.TryParse(createDto.strTaxTypeGUID, out var taxTypeGuid))
                throw new BusinessException($"Invalid Tax Type GUID format: '{createDto.strTaxTypeGUID}'. Please provide a valid GUID.");

            // Validate and parse created by GUID
            if (string.IsNullOrWhiteSpace(createdByGUID))
                throw new BusinessException("User GUID is required");

            if (!Guid.TryParse(createdByGUID, out var createdByGuidParsed))
                throw new BusinessException("Invalid user GUID format");

            // Validate tax type exists
            var taxTypeExists = await _context.MstTaxTypes
                .AnyAsync(t => t.strTaxTypeGUID == taxTypeGuid);

            if (!taxTypeExists)
                throw new BusinessException("Tax Type not found");

            // Check for duplicate category code
            var duplicateCode = await _context.MstTaxCategories
                .AnyAsync(c => c.strCategoryCode.ToLower() == createDto.strCategoryCode.ToLower() && c.bolIsActive);

            if (duplicateCode)
                throw new BusinessException($"Tax category with code '{createDto.strCategoryCode}' already exists");

            // Check for duplicate category name within same tax type
            var duplicateName = await _context.MstTaxCategories
                .AnyAsync(c => c.strTaxTypeGUID == taxTypeGuid && 
                              c.strCategoryName.ToLower() == createDto.strCategoryName.ToLower() && 
                              c.bolIsActive);

            if (duplicateName)
                throw new BusinessException($"Tax category with name '{createDto.strCategoryName}' already exists for this tax type");

            var taxCategory = _mapper.Map<MstTaxCategory>(createDto);
            taxCategory.strTaxCategoryGUID = Guid.NewGuid();
            taxCategory.strTaxTypeGUID = taxTypeGuid;
            taxCategory.dtCreatedOn = CurrentDateTime;
            taxCategory.strCreatedByGUID = createdByGuidParsed;
            taxCategory.strUpdatedByGUID = createdByGuidParsed;
            taxCategory.dtUpdatedOn = CurrentDateTime;

            _context.MstTaxCategories.Add(taxCategory);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(taxCategory.strTaxCategoryGUID.ToString());
        }

        public async Task<TaxCategoryResponseDto> UpdateAsync(string guid, TaxCategoryUpdateDto updateDto, string updatedByGUID)
        {
            if (!Guid.TryParse(guid, out var taxCategoryGuid))
                throw new BusinessException("Invalid tax category GUID format");

            if (string.IsNullOrWhiteSpace(updateDto.strTaxTypeGUID))
                throw new BusinessException("Tax Type GUID is required");

            if (!Guid.TryParse(updateDto.strTaxTypeGUID, out var taxTypeGuid))
                throw new BusinessException($"Invalid Tax Type GUID format: '{updateDto.strTaxTypeGUID}'. Please provide a valid GUID.");

            if (string.IsNullOrWhiteSpace(updatedByGUID))
                throw new BusinessException("User GUID is required");

            if (!Guid.TryParse(updatedByGUID, out var updatedByGuidParsed))
                throw new BusinessException("Invalid user GUID format");

            var taxCategory = await _context.MstTaxCategories
                .FindAsync(taxCategoryGuid);

            if (taxCategory == null)
                throw new BusinessException("Tax category not found");

            // Validate tax type exists
            var taxTypeExists = await _context.MstTaxTypes
                .AnyAsync(t => t.strTaxTypeGUID == taxTypeGuid);

            if (!taxTypeExists)
                throw new BusinessException("Tax Type not found");

            // Check for duplicate category code
            var duplicateCode = await _context.MstTaxCategories
                .AnyAsync(c => c.strCategoryCode.ToLower() == updateDto.strCategoryCode.ToLower() && 
                              c.strTaxCategoryGUID != taxCategoryGuid && 
                              c.bolIsActive);

            if (duplicateCode)
                throw new BusinessException($"Tax category with code '{updateDto.strCategoryCode}' already exists");

            // Check for duplicate category name within same tax type
            var duplicateName = await _context.MstTaxCategories
                .AnyAsync(c => c.strTaxTypeGUID == taxTypeGuid && 
                              c.strCategoryName.ToLower() == updateDto.strCategoryName.ToLower() && 
                              c.strTaxCategoryGUID != taxCategoryGuid && 
                              c.bolIsActive);

            if (duplicateName)
                throw new BusinessException($"Tax category with name '{updateDto.strCategoryName}' already exists for this tax type");

            _mapper.Map(updateDto, taxCategory);
            taxCategory.strTaxTypeGUID = taxTypeGuid;
            taxCategory.strUpdatedByGUID = updatedByGuidParsed;
            taxCategory.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(guid);
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            if (!Guid.TryParse(guid, out var taxCategoryGuid))
                throw new BusinessException("Invalid tax category GUID format");

            var taxCategory = await _context.MstTaxCategories
                .FindAsync(taxCategoryGuid);

            if (taxCategory == null)
                throw new BusinessException("Tax category not found");

            // Hard delete
            _context.MstTaxCategories.Remove(taxCategory);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<TaxCategoryResponseDto> GetByIdAsync(string guid)
        {
            if (!Guid.TryParse(guid, out var taxCategoryGuid))
                throw new BusinessException($"Invalid Tax Category GUID format: '{guid}'. Please provide a valid GUID.");

            var taxCategory = await _context.MstTaxCategories
                .Include(c => c.TaxType)
                .Include(c => c.CreatedBy)
                .Include(c => c.UpdatedBy)
                .FirstOrDefaultAsync(c => c.strTaxCategoryGUID == taxCategoryGuid);

            if (taxCategory == null)
                throw new BusinessException("Tax category not found");

            var responseDto = new TaxCategoryResponseDto
            {
                strTaxCategoryGUID = taxCategory.strTaxCategoryGUID.ToString(),
                strTaxTypeGUID = taxCategory.strTaxTypeGUID.ToString(),
                strTaxTypeName = taxCategory.TaxType?.strTaxTypeName ?? string.Empty,
                strCategoryCode = taxCategory.strCategoryCode,
                strCategoryName = taxCategory.strCategoryName,
                strDescription = taxCategory.strDescription,
                decTotalTaxPercentage = taxCategory.decTotalTaxPercentage,
                bolIsActive = taxCategory.bolIsActive,
                strCreatedByGUID = taxCategory.strCreatedByGUID.ToString(),
                strCreatedByName = taxCategory.CreatedBy?.strName,
                dtCreatedOn = taxCategory.dtCreatedOn,
                strUpdatedByGUID = taxCategory.strUpdatedByGUID?.ToString(),
                strUpdatedByName = taxCategory.UpdatedBy?.strName,
                dtUpdatedOn = taxCategory.dtUpdatedOn
            };

            return responseDto;
        }

        public async Task<PagedResponse<TaxCategoryResponseDto>> GetAllAsync(TaxCategoryFilterDto filter)
        {
            var query = _context.MstTaxCategories
                .Include(c => c.TaxType)
                .Include(c => c.CreatedBy)
                .Include(c => c.UpdatedBy)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filter.strTaxTypeGUID))
            {
                if (Guid.TryParse(filter.strTaxTypeGUID, out var taxTypeGuid))
                {
                    query = query.Where(c => c.strTaxTypeGUID == taxTypeGuid);
                }
            }

            if (filter.bolIsActive.HasValue)
            {
                query = query.Where(c => c.bolIsActive == filter.bolIsActive.Value);
            }

            if (filter.minPercentage.HasValue)
            {
                query = query.Where(c => c.decTotalTaxPercentage >= filter.minPercentage.Value);
            }

            if (filter.maxPercentage.HasValue)
            {
                query = query.Where(c => c.decTotalTaxPercentage <= filter.maxPercentage.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                query = query.Where(c =>
                    c.strCategoryCode.Contains(filter.Search) ||
                    c.strCategoryName.Contains(filter.Search) ||
                    (c.strDescription != null && c.strDescription.Contains(filter.Search)));
            }

            // Get total count
            var totalRecords = await query.CountAsync();

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filter.SortBy))
            {
                var sortOrder = filter.ascending ? "asc" : "desc";
                query = query.OrderBy($"{filter.SortBy} {sortOrder}");
            }
            else
            {
                query = query.OrderBy(c => c.strCategoryName);
            }

            // Apply pagination
            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(c => new TaxCategoryResponseDto
                {
                    strTaxCategoryGUID = c.strTaxCategoryGUID.ToString(),
                    strTaxTypeGUID = c.strTaxTypeGUID.ToString(),
                    strTaxTypeName = c.TaxType!.strTaxTypeName,
                    strCategoryCode = c.strCategoryCode,
                    strCategoryName = c.strCategoryName,
                    strDescription = c.strDescription,
                    decTotalTaxPercentage = c.decTotalTaxPercentage,
                    bolIsActive = c.bolIsActive,
                    strCreatedByGUID = c.strCreatedByGUID.ToString(),
                    strCreatedByName = c.CreatedBy!.strName,
                    dtCreatedOn = c.dtCreatedOn,
                    strUpdatedByGUID = c.strUpdatedByGUID.HasValue ? c.strUpdatedByGUID.Value.ToString() : null,
                    strUpdatedByName = c.UpdatedBy != null ? c.UpdatedBy.strName : null,
                    dtUpdatedOn = c.dtUpdatedOn
                })
                .ToListAsync();

            return new PagedResponse<TaxCategoryResponseDto>
            {
                Items = items,
                TotalCount = totalRecords,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)filter.PageSize)
            };
        }

        public async Task<List<TaxCategorySimpleDto>> GetActiveTaxCategoriesAsync(string strTaxTypeGUID, string? search = null)
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

            var query = _context.MstTaxCategories
                .Where(c => c.bolIsActive && c.strTaxTypeGUID == taxTypeGuid)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(c =>
                    c.strCategoryCode.Contains(search) ||
                    c.strCategoryName.Contains(search) ||
                    (c.strDescription != null && c.strDescription.Contains(search)));
            }

            var categories = await query
                .OrderBy(c => c.strCategoryName)
                .Select(c => new TaxCategorySimpleDto
                {
                    strTaxCategoryGUID = c.strTaxCategoryGUID.ToString(),
                    strCategoryCode = c.strCategoryCode,
                    strCategoryName = c.strCategoryName,
                    decTotalTaxPercentage = c.decTotalTaxPercentage
                })
                .ToListAsync();

            return categories;
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportTaxCategoriesAsync(string format, TaxCategoryFilterDto filter)
        {
            var query = _context.MstTaxCategories
                .Include(c => c.TaxType)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filter.strTaxTypeGUID))
            {
                if (Guid.TryParse(filter.strTaxTypeGUID, out var taxTypeGuid))
                {
                    query = query.Where(c => c.strTaxTypeGUID == taxTypeGuid);
                }
            }

            if (filter.bolIsActive.HasValue)
            {
                query = query.Where(c => c.bolIsActive == filter.bolIsActive.Value);
            }

            if (filter.minPercentage.HasValue)
            {
                query = query.Where(c => c.decTotalTaxPercentage >= filter.minPercentage.Value);
            }

            if (filter.maxPercentage.HasValue)
            {
                query = query.Where(c => c.decTotalTaxPercentage <= filter.maxPercentage.Value);
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                query = query.Where(c =>
                    c.strCategoryCode.Contains(filter.Search) ||
                    c.strCategoryName.Contains(filter.Search) ||
                    (c.strDescription != null && c.strDescription.Contains(filter.Search)));
            }

            var categories = await query
                .OrderBy(c => c.strCategoryName)
                .ToListAsync();

            if (format.ToLower() == "excel")
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Tax Categories");

                // Headers
                worksheet.Cell(1, 1).Value = "Category Code";
                worksheet.Cell(1, 2).Value = "Category Name";
                worksheet.Cell(1, 3).Value = "Tax Type";
                worksheet.Cell(1, 4).Value = "Description";
                worksheet.Cell(1, 5).Value = "Total Tax %";
                worksheet.Cell(1, 6).Value = "Active";
                worksheet.Cell(1, 7).Value = "Created On";

                // Style headers
                var headerRow = worksheet.Range(1, 1, 1, 7);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

                // Data
                for (int i = 0; i < categories.Count; i++)
                {
                    var category = categories[i];
                    var row = i + 2;

                    worksheet.Cell(row, 1).Value = category.strCategoryCode;
                    worksheet.Cell(row, 2).Value = category.strCategoryName;
                    worksheet.Cell(row, 3).Value = category.TaxType?.strTaxTypeName ?? string.Empty;
                    worksheet.Cell(row, 4).Value = category.strDescription ?? string.Empty;
                    worksheet.Cell(row, 5).Value = category.decTotalTaxPercentage;
                    worksheet.Cell(row, 6).Value = category.bolIsActive ? "Yes" : "No";
                    worksheet.Cell(row, 7).Value = category.dtCreatedOn.ToString("yyyy-MM-dd");
                }

                worksheet.Columns().AdjustToContents();

                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                var fileContents = stream.ToArray();
                
                return (fileContents, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"TaxCategories_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx");
            }
            else // CSV
            {
                var csv = new StringBuilder();
                csv.AppendLine("Category Code,Category Name,Tax Type,Description,Total Tax %,Active,Created On");

                foreach (var category in categories)
                {
                    csv.AppendLine($"\"{category.strCategoryCode}\",\"{category.strCategoryName}\",\"{category.TaxType?.strTaxTypeName ?? string.Empty}\",\"{category.strDescription ?? string.Empty}\",{category.decTotalTaxPercentage},\"{(category.bolIsActive ? "Yes" : "No")}\",\"{category.dtCreatedOn:yyyy-MM-dd}\"");
                }

                var fileContents = Encoding.UTF8.GetBytes(csv.ToString());
                return (fileContents, "text/csv", $"TaxCategories_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
            }
        }
    }
}
