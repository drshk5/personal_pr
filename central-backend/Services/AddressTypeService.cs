using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.AddressType;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;
using System.Text;
using System.IO;
using ClosedXML.Excel;

namespace AuditSoftware.Services
{
    public class AddressTypeService :  ServiceBase, IAddressTypeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public AddressTypeService(AppDbContext context, IMapper mapper)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        public async Task<AddressTypeResponseDto> CreateAsync(AddressTypeCreateDto createDto, string createdByGUID)
        {
            // Check for duplicate name
            var exists = await _context.MstAddressTypes
                .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower());

            if (exists)
                throw new BusinessException("An address type with this name already exists");

            var addressType = _mapper.Map<MstAddressType>(createDto);
            addressType.strAddressTypeGUID = Guid.NewGuid();
            addressType.dtCreatedOn = CurrentDateTime;
            addressType.strCreatedByGUID = Guid.Parse(createdByGUID);
            addressType.strUpdatedByGUID = Guid.Parse(createdByGUID);
            addressType.dtUpdatedOn = CurrentDateTime;

            _context.MstAddressTypes.Add(addressType);
            await _context.SaveChangesAsync();

            return _mapper.Map<AddressTypeResponseDto>(addressType);
        }

        public async Task<AddressTypeResponseDto> UpdateAsync(string guid, AddressTypeUpdateDto updateDto, string updatedByGUID)
        {
            var addressType = await _context.MstAddressTypes.FindAsync(Guid.Parse(guid));
            if (addressType == null)
                throw new BusinessException("Address type not found");

            // Check for duplicate name, excluding current record
            var exists = await _context.MstAddressTypes
                .AnyAsync(x => x.strName.ToLower() == updateDto.strName.ToLower() 
                           && x.strAddressTypeGUID != addressType.strAddressTypeGUID);

            if (exists)
                throw new BusinessException("An address type with this name already exists");

            _mapper.Map(updateDto, addressType);
            addressType.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            addressType.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<AddressTypeResponseDto>(addressType);
        }

        public async Task<AddressTypeResponseDto> GetByIdAsync(string guid)
        {
            var addressType = await _context.MstAddressTypes.FindAsync(Guid.Parse(guid));
            if (addressType == null)
                throw new BusinessException("Address type not found");

            return _mapper.Map<AddressTypeResponseDto>(addressType);
        }

        public async Task<PagedResponse<AddressTypeResponseDto>> GetAllAsync(AddressTypeFilterDto filterDto)
        {
            var query = _context.MstAddressTypes.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active address types
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive address types
                    query = query.Where(x => x.bolIsActive == false);
                }
                else
                {
                    // Regular name search
                    query = query.Where(x => x.strName.ToLower().Contains(searchTerm));
                }
            }

            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Apply sorting
            if (!string.IsNullOrEmpty(filterDto.sortBy))
            {
                switch (filterDto.sortBy.ToLower())
                {
                    case "strname":
                    case "name":
                        query = !filterDto.ascending
                            ? query.OrderByDescending(x => x.strName)
                            : query.OrderBy(x => x.strName);
                        break;
                    case "bolisactive":
                    case "status":
                        query = !filterDto.ascending
                            ? query.OrderBy(x => x.bolIsActive) // Show inactive first in descending order
                            : query.OrderByDescending(x => x.bolIsActive); // Show active first in ascending order
                        break;
                    case "createdon":
                        query = !filterDto.ascending
                            ? query.OrderByDescending(x => x.dtCreatedOn)
                            : query.OrderBy(x => x.dtCreatedOn);
                        break;
                    default:
                        query = query.OrderBy(x => x.strName);
                        break;
                }
            }
            else
            {
                // Default sort by active status first (active records first), then by name
                query = query.OrderByDescending(x => x.bolIsActive).ThenBy(x => x.strName);
            }

            var totalRecords = await query.CountAsync();
            var items = await query
                .Skip((filterDto.pageNumber - 1) * filterDto.pageSize)
                .Take(filterDto.pageSize)
                .ToListAsync();

            return new PagedResponse<AddressTypeResponseDto>
            {
                Items = _mapper.Map<List<AddressTypeResponseDto>>(items),
                TotalCount = totalRecords,
                PageNumber = filterDto.pageNumber,
                PageSize = filterDto.pageSize
            };
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var addressType = await _context.MstAddressTypes.FindAsync(Guid.Parse(guid));
            if (addressType == null)
                return false;

            _context.MstAddressTypes.Remove(addressType);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AddressTypeSimpleDto>> GetActiveAddressTypesAsync(string search = null)
        {
            var query = _context.MstAddressTypes
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x => x.strName.ToLower().Contains(search.ToLower()));
            }

            var addressTypes = await query
                .OrderBy(x => x.strName)
                .ToListAsync();

            return _mapper.Map<List<AddressTypeSimpleDto>>(addressTypes);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportAddressTypesAsync(string format)
        {
            // Get all address types
            var addressTypes = await _context.MstAddressTypes
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
                var worksheet = workbook.Worksheets.Add("Address Types");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Status";
                worksheet.Cell(1, 3).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < addressTypes.Count; i++)
                {
                    var addressType = addressTypes[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = addressType.strName;
                    worksheet.Cell(row, 2).Value = addressType.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 3).Value = addressType.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"AddressTypes_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Name,Status,Created On");
                
                // Add data rows
                foreach (var addressType in addressTypes)
                {
                    csv.AppendLine($"\"{addressType.strName.Replace("\"", "\"\"")}\",{(addressType.bolIsActive ? "Active" : "Inactive")},{addressType.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"AddressTypes_{timestamp}.csv");
            }
        }
    }
}

