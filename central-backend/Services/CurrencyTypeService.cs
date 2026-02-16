using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.CurrencyType;
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
    public class CurrencyTypeService :  ServiceBase, ICurrencyTypeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public CurrencyTypeService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<CurrencyTypeResponseDto> CreateAsync(CurrencyTypeCreateDto createDto, string createdByGUID)
        {
            // Check for duplicate name
            var exists = await _context.MstCurrencyTypes
                .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower());

            if (exists)
                throw new BusinessException($"A currency type with the name '{createDto.strName}' already exists");

            var currencyType = _mapper.Map<MstCurrencyType>(createDto);
            currencyType.strCurrencyTypeGUID = Guid.NewGuid();
            currencyType.dtCreatedOn = CurrentDateTime;
            currencyType.strCreatedByGUID = Guid.Parse(createdByGUID);
            currencyType.strUpdatedByGUID = Guid.Parse(createdByGUID);  // Set updated by to the same as created by
            currencyType.dtUpdatedOn = CurrentDateTime;             // Set updated on to the same as created on

            _context.MstCurrencyTypes.Add(currencyType);
            await _context.SaveChangesAsync();

            // Reload with Country navigation property
            await _context.Entry(currencyType).Reference(ct => ct.Country).LoadAsync();

            var responseDto = _mapper.Map<CurrencyTypeResponseDto>(currencyType);
            responseDto.strCountryName = currencyType.Country?.strName;
            
            return responseDto;
        }

        public async Task<CurrencyTypeResponseDto> UpdateAsync(string guid, CurrencyTypeUpdateDto updateDto, string updatedByGUID)
        {
            var currencyType = await _context.MstCurrencyTypes.FindAsync(Guid.Parse(guid));
            if (currencyType == null)
                throw new BusinessException("Currency type not found");

            // Check for duplicate name with different GUID
            var exists = await _context.MstCurrencyTypes
                .AnyAsync(x => x.strName.ToLower() == updateDto.strName.ToLower() && 
                           x.strCurrencyTypeGUID != Guid.Parse(guid));

            if (exists)
                throw new BusinessException($"A currency type with the name '{updateDto.strName}' already exists");

            _mapper.Map(updateDto, currencyType);
            currencyType.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            currencyType.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            // Reload with Country navigation property
            await _context.Entry(currencyType).Reference(ct => ct.Country).LoadAsync();

            var responseDto = _mapper.Map<CurrencyTypeResponseDto>(currencyType);
            responseDto.strCountryName = currencyType.Country?.strName;
            
            return responseDto;
        }

        public async Task<CurrencyTypeResponseDto> GetByIdAsync(string guid)
        {
            var currencyType = await _context.MstCurrencyTypes
                .Include(ct => ct.Country)
                .FirstOrDefaultAsync(ct => ct.strCurrencyTypeGUID == Guid.Parse(guid));
            
            if (currencyType == null)
                throw new BusinessException("Currency type not found");

            var responseDto = _mapper.Map<CurrencyTypeResponseDto>(currencyType);
            responseDto.strCountryName = currencyType.Country?.strName;
            
            return responseDto;
        }

        public async Task<PagedResponse<CurrencyTypeResponseDto>> GetAllAsync(CurrencyTypeFilterDto filterDto)
        {
            var query = _context.MstCurrencyTypes
                .Include(ct => ct.Country)
                .AsQueryable();

            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords (match City/State service approach)
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active currency types
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive currency types
                    query = query.Where(x => x.bolIsActive == false);
                }
                else
                {
                    // Regular name search
                    query = query.Where(x => x.strName.ToLower().Contains(searchTerm));
                }
            }

            // Apply active status filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                var sortField = filterDto.SortBy.ToLower() switch
                {
                    "strname" => "strName",
                    "name" => "strName",
                    "bolisactive" => "bolIsActive", 
                    "status" => "bolIsActive",
                    "isactive" => "bolIsActive",
                    "createdon" => "dtCreatedOn",
                    "updatedon" => "dtUpdatedOn",
                    _ => "strName" // Default sort by name
                };

                // Handle sorting
                string sortOrder;
                // Handle special case for status/bolIsActive to reverse the order
                if (sortField == "bolIsActive")
                {
                    // For bolIsActive/status, reverse the logic to show active first in ascending order
                    sortOrder = filterDto.ascending ? "descending" : "ascending";
                }
                else
                {
                    sortOrder = filterDto.ascending ? "ascending" : "descending";
                }
                query = query.OrderBy($"{sortField} {sortOrder}");
            }
            else
            {
                // Default sort by active status first (active records first), then by name
                query = query.OrderByDescending(x => x.bolIsActive).ThenBy(x => x.strName);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var dtos = items.Select(ct =>
            {
                var dto = _mapper.Map<CurrencyTypeResponseDto>(ct);
                dto.strCountryName = ct.Country?.strName;
                return dto;
            }).ToList();

            return new PagedResponse<CurrencyTypeResponseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
            };
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var currencyType = await _context.MstCurrencyTypes
                .FirstOrDefaultAsync(ct => ct.strCurrencyTypeGUID == Guid.Parse(guid));

            if (currencyType == null)
                return false;

            // Add any additional validation here if needed
            // For example, check if the currency type is used in other tables

            // Remove the currency type
            _context.MstCurrencyTypes.Remove(currencyType);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<CurrencyTypeSimpleDto>> GetActiveCurrencyTypesAsync(string searchTerm = null)
        {
            var query = _context.MstCurrencyTypes
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(term));
            }

            var currencyTypes = await query
                .OrderBy(x => x.strName)
                .ToListAsync();

            return _mapper.Map<List<CurrencyTypeSimpleDto>>(currencyTypes);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportCurrencyTypesAsync(string format)
        {
            // Get all currency types
            var currencyTypes = await _context.MstCurrencyTypes
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
                var worksheet = workbook.Worksheets.Add("Currency Types");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Status";
                worksheet.Cell(1, 3).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < currencyTypes.Count; i++)
                {
                    var currencyType = currencyTypes[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = currencyType.strName;
                    worksheet.Cell(row, 2).Value = currencyType.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 3).Value = currencyType.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"CurrencyTypes_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Name,Status,Created On");
                
                // Add data rows
                foreach (var currencyType in currencyTypes)
                {
                    csv.AppendLine($"\"{currencyType.strName.Replace("\"", "\"\"")}\",{(currencyType.bolIsActive ? "Active" : "Inactive")},{currencyType.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"CurrencyTypes_{timestamp}.csv");
            }
        }
    }
}

