using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.PicklistType;
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
    public class PicklistTypeService :  ServiceBase, IPicklistTypeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public PicklistTypeService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PicklistTypeResponseDto> CreateAsync(PicklistTypeCreateDto createDto, string createdByGUID)
        {
            // Check for duplicate type across all picklist types
            var exists = await _context.MstPicklistTypes
                .AnyAsync(x => x.strType.ToLower() == createDto.strType.ToLower());

            if (exists)
                throw new BusinessException($"A picklist type '{createDto.strType}' already exists");

            var picklistType = _mapper.Map<MstPicklistType>(createDto);
            picklistType.strPicklistTypeGUID = Guid.NewGuid();
            picklistType.dtCreatedOn = CurrentDateTime;
            picklistType.strCreatedByGUID = Guid.Parse(createdByGUID);
            picklistType.strUpdatedByGUID = Guid.Parse(createdByGUID);  // Set updated by to the same as created by
            picklistType.dtUpdatedOn = CurrentDateTime;             // Set updated on to the same as created on

            _context.MstPicklistTypes.Add(picklistType);
            await _context.SaveChangesAsync();

            return _mapper.Map<PicklistTypeResponseDto>(picklistType);
        }

        public async Task<PicklistTypeResponseDto> UpdateAsync(string guid, PicklistTypeUpdateDto updateDto, string updatedByGUID)
        {
            var picklistType = await _context.MstPicklistTypes.FindAsync(Guid.Parse(guid));
            if (picklistType == null)
                throw new BusinessException("Picklist type not found");

            _mapper.Map(updateDto, picklistType);
            picklistType.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            picklistType.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<PicklistTypeResponseDto>(picklistType);
        }

        public async Task<PicklistTypeResponseDto> GetByIdAsync(string guid)
        {
            var picklistType = await _context.MstPicklistTypes.FindAsync(Guid.Parse(guid));
            if (picklistType == null)
                throw new BusinessException("Picklist type not found");

            return _mapper.Map<PicklistTypeResponseDto>(picklistType);
        }

        public async Task<PagedResponse<PicklistTypeResponseDto>> GetAllAsync(PicklistTypeFilterDto filterDto)
        {
            // Log simple search parameters
            Console.WriteLine($"Search term: '{filterDto.Search ?? "null"}', IsActive filter: {(filterDto.bolIsActive.HasValue ? filterDto.bolIsActive.Value.ToString() : "null")}");
            
            // Start with a clean, simple query without projections that could interfere with filtering
            var query = _context.MstPicklistTypes.AsQueryable();
            
            // Log the initial count to ensure we're starting with data
            var initialCount = await query.CountAsync();
            Console.WriteLine($"Initial query has {initialCount} records");
            
            // Report on active vs inactive counts in the database
            var initialActiveCount = await query.CountAsync(x => x.bolIsActive);
            var initialInactiveCount = await query.CountAsync(x => !x.bolIsActive);
            Console.WriteLine($"Database has {initialActiveCount} active records and {initialInactiveCount} inactive records");

            // Apply bolIsActive filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                // Filter directly by the bolIsActive value
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
                
                // Log for debugging
                Console.WriteLine($"Filtering by bolIsActive = {filterDto.bolIsActive.Value}");
                var debugCount = query.Count();
                Console.WriteLine($"Found {debugCount} records with bolIsActive = {filterDto.bolIsActive.Value}");
            }

            // Apply specific field searches if provided
            if (!string.IsNullOrWhiteSpace(filterDto.TypeSearch))
            {
                var typeTerm = filterDto.TypeSearch.ToLower();
                query = query.Where(x => x.strType.ToLower().Contains(typeTerm));
            }

            if (!string.IsNullOrWhiteSpace(filterDto.DescriptionSearch))
            {
                var descTerm = filterDto.DescriptionSearch.ToLower();
                query = query.Where(x => x.strDescription != null && x.strDescription.ToLower().Contains(descTerm));
            }

            // Apply general search if provided (across all fields)
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords (similar to AddressTypeService)
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active picklist types
                    query = query.Where(x => x.bolIsActive == true);
                    Console.WriteLine("Term matches 'active' pattern - will search for active records (bolIsActive=true)");
                }
                else if (isInactiveSearch)
                {
                    // Show inactive picklist types
                    query = query.Where(x => x.bolIsActive == false);
                    Console.WriteLine("Term matches 'inactive' pattern - will search for inactive records (bolIsActive=false)");
                }
                else
                {
                    // Regular name search
                    Console.WriteLine($"Term '{searchTerm}' did not match any status filters, using standard search");
                    query = query.Where(x => 
                        x.strType.ToLower().Contains(searchTerm) ||
                        (x.strDescription != null && x.strDescription.ToLower().Contains(searchTerm)));
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                // Determine the field to sort by
                string sortField = filterDto.SortBy.ToLower() switch
                {
                    "type" => "strType",
                    "strtype" => "strType",
                    "description" => "strDescription",
                    "strdescription" => "strDescription", 
                    "isactive" => "bolIsActive",
                    "bolisactive" => "bolIsActive",
                    "active" => "bolIsActive",
                    "inactive" => "bolIsActive", 
                    "status" => "bolIsActive",
                    "picklisttypeguid" => "strPicklistTypeGUID",
                    "strpicklisttypeguid" => "strPicklistTypeGUID",
                    "guid" => "strPicklistTypeGUID",
                    _ => "strType" // Default sort by type
                };
                
                // Determine if we need to reverse the sort direction for bolIsActive
                // This makes it more intuitive when sorting by status
                bool isStatusSort = sortField == "bolIsActive";
                bool actualAscending = isStatusSort ? !filterDto.ascending : filterDto.ascending;
                var sortOrder = actualAscending ? "ascending" : "descending";
                
                // Add logging to debug sorting issues
                Console.WriteLine($"Sorting by field: {sortField} {sortOrder} (Original direction: {filterDto.ascending})");
                
                try
                {
                    query = query.OrderBy($"{sortField} {sortOrder}");
                }
                catch (Exception ex)
                {
                    // Log any error and fall back to default sorting
                    Console.WriteLine($"Error sorting by {sortField}: {ex.Message}");
                    
                    // Handle special case for status sorting
                    if (isStatusSort)
                    {
                        // For status sort, we use the opposite logic for ascending/descending
                        query = filterDto.ascending 
                            ? query.OrderByDescending(x => x.bolIsActive)  // Active first when ascending
                            : query.OrderBy(x => x.bolIsActive);           // Inactive first when descending
                    }
                    else if (sortField == "strDescription")
                    {
                        // Handle null values when sorting by description
                        query = filterDto.ascending
                            ? query.OrderBy(x => x.strDescription ?? string.Empty)
                            : query.OrderByDescending(x => x.strDescription ?? string.Empty);
                    }
                    else
                    {
                        // Default fallback to type sorting
                        query = filterDto.ascending 
                            ? query.OrderBy(x => x.strType)
                            : query.OrderByDescending(x => x.strType);
                    }
                }
            }
            else
            {
                // Default sorting by type
                query = filterDto.ascending 
                    ? query.OrderBy(x => x.strType)
                    : query.OrderByDescending(x => x.strType);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var dtos = _mapper.Map<List<PicklistTypeResponseDto>>(items);

            // Log the final results for debugging
            Console.WriteLine($"Query returned {items.Count} results out of {totalCount} total matching records");
            
            // Count active vs inactive in the result set
            int resultActiveCount = items.Count(x => x.bolIsActive);
            int resultInactiveCount = items.Count(x => !x.bolIsActive);
            Console.WriteLine($"Results include {resultActiveCount} active and {resultInactiveCount} inactive records");
            
            var response = new PagedResponse<PicklistTypeResponseDto>
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
            var picklistType = await _context.MstPicklistTypes
                .Include(pt => pt.PicklistValues)
                .FirstOrDefaultAsync(pt => pt.strPicklistTypeGUID == Guid.Parse(guid));

            if (picklistType == null)
                return false;

            // Check if there are any associated picklist values
            if (picklistType.PicklistValues != null && picklistType.PicklistValues.Any())
            {
                throw new BusinessException("Cannot delete Picklist type has associated with Picklist value.");
            }

            // Remove the picklist type
            _context.MstPicklistTypes.Remove(picklistType);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<PicklistTypeSimpleDto>> GetActivePicklistTypesAsync(string? searchTerm = null)
        {
            var query = _context.MstPicklistTypes
                .Where(x => x.bolIsActive == true);

            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.ToLower();
                query = query.Where(x => x.strType.ToLower().Contains(term));
            }

            // Order by type name
            query = query.OrderBy(x => x.strType);

            // Select only the required fields
            var result = await query
                .Select(x => new PicklistTypeSimpleDto
                {
                    strPicklistTypeGUID = x.strPicklistTypeGUID.ToString(),
                    strType = x.strType
                })
                .ToListAsync();

            return result;
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportPicklistTypesAsync(string format)
        {
            // Get all picklist types
            var picklistTypes = await _context.MstPicklistTypes
                .OrderBy(x => x.strType)
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
                var worksheet = workbook.Worksheets.Add("Picklist Types");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Type";
                worksheet.Cell(1, 2).Value = "Description";
                worksheet.Cell(1, 3).Value = "Status";
                worksheet.Cell(1, 4).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < picklistTypes.Count; i++)
                {
                    var picklistType = picklistTypes[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = picklistType.strType;
                    worksheet.Cell(row, 2).Value = picklistType.strDescription ?? "";
                    worksheet.Cell(row, 3).Value = picklistType.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 4).Value = picklistType.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"PicklistTypes_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Type,Description,Status,Created On");
                
                // Add data rows
                foreach (var picklistType in picklistTypes)
                {
                    csv.AppendLine($"\"{picklistType.strType.Replace("\"", "\"\"")}\",\"{(picklistType.strDescription ?? "").Replace("\"", "\"\"")}\",{(picklistType.bolIsActive ? "Active" : "Inactive")},{picklistType.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"PicklistTypes_{timestamp}.csv");
            }
        }
    }
} 
