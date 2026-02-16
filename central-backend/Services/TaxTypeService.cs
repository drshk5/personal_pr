using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.TaxType;
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
    public class TaxTypeService : ServiceBase, ITaxTypeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public TaxTypeService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<TaxTypeResponseDto> CreateAsync(TaxTypeCreateDto createDto, string createdByGUID)
        {
            // Validate and parse country GUID
            if (!Guid.TryParse(createDto.strCountryGUID, out var countryGuid))
                throw new BusinessException("Invalid country GUID format");

            // Validate and parse created by GUID
            if (!Guid.TryParse(createdByGUID, out var createdByGuidParsed))
                throw new BusinessException("Invalid user GUID format");

            // Check for duplicate tax type code
            var existsByCode = await _context.MstTaxTypes
                .AnyAsync(x => x.strTaxTypeCode.ToLower() == createDto.strTaxTypeCode.ToLower());

            if (existsByCode)
                throw new BusinessException($"A tax type with code '{createDto.strTaxTypeCode}' already exists");

            // Check for duplicate tax type name
            var existsByName = await _context.MstTaxTypes
                .AnyAsync(x => x.strTaxTypeName.ToLower() == createDto.strTaxTypeName.ToLower());

            if (existsByName)
                throw new BusinessException($"A tax type with name '{createDto.strTaxTypeName}' already exists");

            // Validate country exists
            var countryExists = await _context.MstCountry
                .AnyAsync(x => x.strCountryGUID == countryGuid);

            if (!countryExists)
                throw new BusinessException("Invalid country specified");

            var taxType = new MstTaxType
            {
                strTaxTypeGUID = Guid.NewGuid(),
                strTaxTypeCode = createDto.strTaxTypeCode,
                strTaxTypeName = createDto.strTaxTypeName,
                strDescription = createDto.strDescription,
                strCountryGUID = countryGuid,
                bolIsCompound = createDto.bolIsCompound,
                bolIsActive = createDto.bolIsActive,
                strCreatedByGUID = createdByGuidParsed,
                dtCreatedOn = CurrentDateTime,
                strUpdatedByGUID = createdByGuidParsed,
                dtUpdatedOn = CurrentDateTime
            };

            _context.MstTaxTypes.Add(taxType);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(taxType.strTaxTypeGUID.ToString());
        }

        public async Task<TaxTypeResponseDto> UpdateAsync(string guid, TaxTypeUpdateDto updateDto, string updatedByGUID)
        {
            // Validate and parse GUIDs
            if (!Guid.TryParse(guid, out var taxTypeGuid))
                throw new BusinessException("Invalid tax type GUID format");

            if (!Guid.TryParse(updateDto.strCountryGUID, out var countryGuid))
                throw new BusinessException("Invalid country GUID format");

            if (!Guid.TryParse(updatedByGUID, out var updatedByGuidParsed))
                throw new BusinessException("Invalid user GUID format");

            var taxType = await _context.MstTaxTypes.FindAsync(taxTypeGuid);
            if (taxType == null)
                throw new BusinessException("Tax type not found");

            // Check for duplicate tax type code (excluding current record)
            var existsByCode = await _context.MstTaxTypes
                .AnyAsync(x => x.strTaxTypeCode.ToLower() == updateDto.strTaxTypeCode.ToLower() 
                            && x.strTaxTypeGUID != taxTypeGuid);

            if (existsByCode)
                throw new BusinessException($"A tax type with code '{updateDto.strTaxTypeCode}' already exists");

            // Check for duplicate tax type name (excluding current record)
            var existsByName = await _context.MstTaxTypes
                .AnyAsync(x => x.strTaxTypeName.ToLower() == updateDto.strTaxTypeName.ToLower() 
                            && x.strTaxTypeGUID != taxTypeGuid);

            if (existsByName)
                throw new BusinessException($"A tax type with name '{updateDto.strTaxTypeName}' already exists");

            // Validate country exists
            var countryExists = await _context.MstCountry
                .AnyAsync(x => x.strCountryGUID == countryGuid);

            if (!countryExists)
                throw new BusinessException("Invalid country specified");

            taxType.strTaxTypeCode = updateDto.strTaxTypeCode;
            taxType.strTaxTypeName = updateDto.strTaxTypeName;
            taxType.strDescription = updateDto.strDescription;
            taxType.strCountryGUID = countryGuid;
            taxType.bolIsCompound = updateDto.bolIsCompound;
            taxType.bolIsActive = updateDto.bolIsActive;
            taxType.strUpdatedByGUID = updatedByGuidParsed;
            taxType.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(guid);
        }

        public async Task<TaxTypeResponseDto> GetByIdAsync(string guid)
        {
            if (!Guid.TryParse(guid, out var taxTypeGuid))
                throw new BusinessException("Invalid tax type GUID format");

            var taxType = await _context.MstTaxTypes
                .Include(t => t.Country)
                .Include(t => t.CreatedBy)
                .Include(t => t.UpdatedBy)
                .FirstOrDefaultAsync(t => t.strTaxTypeGUID == taxTypeGuid);

            if (taxType == null)
                throw new BusinessException("Tax type not found");

            return new TaxTypeResponseDto
            {
                strTaxTypeGUID = taxType.strTaxTypeGUID.ToString(),
                strTaxTypeCode = taxType.strTaxTypeCode,
                strTaxTypeName = taxType.strTaxTypeName,
                strDescription = taxType.strDescription,
                strCountryGUID = taxType.strCountryGUID.ToString(),
                strCountryName = taxType.Country?.strName,
                bolIsCompound = taxType.bolIsCompound,
                bolIsActive = taxType.bolIsActive,
                dtCreatedOn = taxType.dtCreatedOn,
                strCreatedByName = taxType.CreatedBy?.strName,
                dtUpdatedOn = taxType.dtUpdatedOn,
                strUpdatedByName = taxType.UpdatedBy?.strName
            };
        }

        public async Task<PagedResponse<TaxTypeResponseDto>> GetAllAsync(TaxTypeFilterDto filterDto)
        {
            var query = _context.MstTaxTypes
                .Include(t => t.Country)
                .Include(t => t.CreatedBy)
                .Include(t => t.UpdatedBy)
                .AsQueryable();

            // Apply IsActive filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Apply Country filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strCountryGUID))
            {
                if (Guid.TryParse(filterDto.strCountryGUID, out var countryGuid))
                {
                    query = query.Where(x => x.strCountryGUID == countryGuid);
                }
            }

            // Apply IsCompound filter if provided
            if (filterDto.bolIsCompound.HasValue)
            {
                query = query.Where(x => x.bolIsCompound == filterDto.bolIsCompound.Value);
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
                        x.strTaxTypeCode.ToLower().Contains(searchTerm) ||
                        x.strTaxTypeName.ToLower().Contains(searchTerm) ||
                        (x.strDescription != null && x.strDescription.ToLower().Contains(searchTerm)) ||
                        (x.Country != null && x.Country.strName.ToLower().Contains(searchTerm)));
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                string sortField = filterDto.SortBy.ToLower() switch
                {
                    "code" => "strTaxTypeCode",
                    "name" => "strTaxTypeName",
                    "description" => "strDescription",
                    "country" => "Country.strName",
                    "iscompound" => "bolIsCompound",
                    "isactive" => "bolIsActive",
                    "status" => "bolIsActive",
                    _ => "strTaxTypeCode"
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
                        ? query.OrderBy(x => x.strTaxTypeCode)
                        : query.OrderByDescending(x => x.strTaxTypeCode);
                }
            }
            else
            {
                query = filterDto.ascending 
                    ? query.OrderBy(x => x.strTaxTypeCode)
                    : query.OrderByDescending(x => x.strTaxTypeCode);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var dtos = items.Select(taxType => new TaxTypeResponseDto
            {
                strTaxTypeGUID = taxType.strTaxTypeGUID.ToString(),
                strTaxTypeCode = taxType.strTaxTypeCode,
                strTaxTypeName = taxType.strTaxTypeName,
                strDescription = taxType.strDescription,
                strCountryGUID = taxType.strCountryGUID.ToString(),
                strCountryName = taxType.Country?.strName,
                bolIsCompound = taxType.bolIsCompound,
                bolIsActive = taxType.bolIsActive,
                dtCreatedOn = taxType.dtCreatedOn,
                strCreatedByName = taxType.CreatedBy?.strName,
                dtUpdatedOn = taxType.dtUpdatedOn,
                strUpdatedByName = taxType.UpdatedBy?.strName
            }).ToList();

            var response = new PagedResponse<TaxTypeResponseDto>
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
            if (!Guid.TryParse(guid, out var taxTypeGuid))
                throw new BusinessException("Invalid tax type GUID format");

            var taxType = await _context.MstTaxTypes
                .FirstOrDefaultAsync(t => t.strTaxTypeGUID == taxTypeGuid);

            if (taxType == null)
                return false;

            // Check for associated tax rates
            var hasTaxRates = await _context.MstTaxRates
                .AnyAsync(r => r.strTaxTypeGUID == taxTypeGuid);

            if (hasTaxRates)
                throw new BusinessException("Cannot delete tax type. There are associated tax rates. Please delete or reassign the tax rates first.");

            // Check for associated tax categories
            var hasTaxCategories = await _context.MstTaxCategories
                .AnyAsync(c => c.strTaxTypeGUID == taxTypeGuid);

            if (hasTaxCategories)
                throw new BusinessException("Cannot delete tax type. There are associated tax categories. Please delete or reassign the tax categories first.");

            // Check for associated organization tax configurations
            var hasOrgTaxConfigs = await _context.MstOrgTaxConfigs
                .AnyAsync(o => o.strTaxTypeGUID == taxTypeGuid);

            if (hasOrgTaxConfigs)
                throw new BusinessException("Cannot delete tax type. There are associated organization tax configurations. Please delete or reassign the configurations first.");

            _context.MstTaxTypes.Remove(taxType);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<TaxTypeSimpleDto>> GetActiveTaxTypesAsync(string? searchTerm = null, string? strCountryGUID = null)
        {
            var query = _context.MstTaxTypes
                .Include(t => t.Country)
                .Where(x => x.bolIsActive == true);

            // Optional country filter
            if (!string.IsNullOrWhiteSpace(strCountryGUID))
            {
                if (!Guid.TryParse(strCountryGUID, out var countryGuid))
                    throw new BusinessException($"Invalid Country GUID format: '{strCountryGUID}'. Please provide a valid GUID.");

                query = query.Where(x => x.strCountryGUID == countryGuid);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.ToLower();
                query = query.Where(x => 
                    x.strTaxTypeCode.ToLower().Contains(term) ||
                    x.strTaxTypeName.ToLower().Contains(term));
            }

            query = query.OrderBy(x => x.strTaxTypeCode);

            var result = await query
                .Select(x => new TaxTypeSimpleDto
                {
                    strTaxTypeGUID = x.strTaxTypeGUID.ToString(),
                    strTaxTypeCode = x.strTaxTypeCode,
                    strTaxTypeName = x.strTaxTypeName,
                    strCountryGUID = x.strCountryGUID.ToString(),
                    strCountryName = x.Country != null ? x.Country.strName : null,
                    bolIsCompound = x.bolIsCompound
                })
                .ToListAsync();

            return result;
        }

        public async Task<TaxTypeSimpleDto?> GetByCountryGuidAsync(string countryGuid)
        {
            // Validate and parse country GUID
            if (!Guid.TryParse(countryGuid, out var countryGuidParsed))
                throw new BusinessException("Invalid country GUID format");

            var taxType = await _context.MstTaxTypes
                .Include(t => t.Country)
                .Where(x => x.strCountryGUID == countryGuidParsed && x.bolIsActive == true)
                .Select(x => new TaxTypeSimpleDto
                {
                    strTaxTypeGUID = x.strTaxTypeGUID.ToString(),
                    strTaxTypeCode = x.strTaxTypeCode,
                    strTaxTypeName = x.strTaxTypeName,
                    strCountryGUID = x.strCountryGUID.ToString(),
                    strCountryName = x.Country != null ? x.Country.strName : null,
                    bolIsCompound = x.bolIsCompound
                })
                .FirstOrDefaultAsync();

            return taxType;
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportTaxTypesAsync(string format)
        {
            var taxTypes = await _context.MstTaxTypes
                .Include(t => t.Country)
                .OrderBy(x => x.strTaxTypeCode)
                .ToListAsync();
            
            if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
            {
                throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
            }

            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            
            if (format.ToLower() == "excel")
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Tax Types");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Code";
                worksheet.Cell(1, 2).Value = "Name";
                worksheet.Cell(1, 3).Value = "Description";
                worksheet.Cell(1, 4).Value = "Country";
                worksheet.Cell(1, 5).Value = "Is Compound";
                worksheet.Cell(1, 6).Value = "Status";
                worksheet.Cell(1, 7).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < taxTypes.Count; i++)
                {
                    var taxType = taxTypes[i];
                    int row = i + 2;
                    
                    worksheet.Cell(row, 1).Value = taxType.strTaxTypeCode;
                    worksheet.Cell(row, 2).Value = taxType.strTaxTypeName;
                    worksheet.Cell(row, 3).Value = taxType.strDescription ?? "";
                    worksheet.Cell(row, 4).Value = taxType.Country?.strName ?? "";
                    worksheet.Cell(row, 5).Value = taxType.bolIsCompound ? "Yes" : "No";
                    worksheet.Cell(row, 6).Value = taxType.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 7).Value = taxType.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                worksheet.Columns().AdjustToContents();
                
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"TaxTypes_{timestamp}.xlsx");
            }
            else // CSV
            {
                var csv = new StringBuilder();
                csv.AppendLine("Code,Name,Description,Country,Is Compound,Status,Created On");
                
                foreach (var taxType in taxTypes)
                {
                    csv.AppendLine($"\"{taxType.strTaxTypeCode.Replace("\"", "\"\"")}\",\"{taxType.strTaxTypeName.Replace("\"", "\"\"")}\",\"{(taxType.strDescription ?? "").Replace("\"", "\"\"")}\",\"{(taxType.Country?.strName ?? "").Replace("\"", "\"\"")}\",{(taxType.bolIsCompound ? "Yes" : "No")},{(taxType.bolIsActive ? "Active" : "Inactive")},{taxType.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return (bytes, "text/csv", $"TaxTypes_{timestamp}.csv");
            }
        }
    }
}
