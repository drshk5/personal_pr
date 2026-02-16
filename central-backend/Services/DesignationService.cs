using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Designation;
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
    public class DesignationService :  ServiceBase, IDesignationService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public DesignationService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<DesignationResponseDto> CreateAsync(DesignationCreateDto createDto, string createdByGUID, string groupGUID)
        {
            // Check for duplicate name within the same group (case-insensitive)
            var parsedGroupGuid = Guid.Empty;
            if (!string.IsNullOrWhiteSpace(groupGUID) && Guid.TryParse(groupGUID, out var g))
                parsedGroupGuid = g;

            var exists = await _context.MstDesignations
                .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower() && x.strGroupGUID == parsedGroupGuid);

            if (exists)
                throw new BusinessException($"A designation '{createDto.strName}' already exists in your group");

            var designation = _mapper.Map<MstDesignation>(createDto);
            designation.strDesignationGUID = Guid.NewGuid();
            designation.dtCreatedOn = CurrentDateTime;
            designation.strCreatedByGUID = Guid.Parse(createdByGUID);
            designation.strUpdatedByGUID = Guid.Parse(createdByGUID);  // Set updated by to the same as created by
            designation.dtUpdatedOn = CurrentDateTime;             // Set updated on to the same as created on
            // assign group
            if (parsedGroupGuid != Guid.Empty)
                designation.strGroupGUID = parsedGroupGuid;

            _context.MstDesignations.Add(designation);
            await _context.SaveChangesAsync();

            return _mapper.Map<DesignationResponseDto>(designation);
        }

        public async Task<DesignationResponseDto> UpdateAsync(string guid, DesignationUpdateDto updateDto, string updatedByGUID, string? groupGUID = null)
        {
            Guid parsedGroupGuid = Guid.Empty;
            if (!string.IsNullOrWhiteSpace(groupGUID) && Guid.TryParse(groupGUID, out var gg))
                parsedGroupGuid = gg;

            var designation = await _context.MstDesignations.FindAsync(Guid.Parse(guid));
            if (designation == null)
                throw new BusinessException("Designation not found");

            // Check for duplicate name within the same group, but exclude the current one
            var existsQuery = _context.MstDesignations
                .Where(x => x.strDesignationGUID != Guid.Parse(guid) && x.strName.ToLower() == updateDto.strName.ToLower());
            if (parsedGroupGuid != Guid.Empty)
            {
                existsQuery = existsQuery.Where(x => x.strGroupGUID == parsedGroupGuid);
            }

            var exists = await existsQuery.AnyAsync();

            if (exists)
                throw new BusinessException($"Another designation with name '{updateDto.strName}' already exists in your group");

            _mapper.Map(updateDto, designation);
            designation.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            designation.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<DesignationResponseDto>(designation);
        }

        public async Task<DesignationResponseDto> GetByIdAsync(string guid)
        {
            var designation = await _context.MstDesignations.FindAsync(Guid.Parse(guid));
            if (designation == null)
                throw new BusinessException("Designation not found");

            return _mapper.Map<DesignationResponseDto>(designation);
        }

        public async Task<PagedResponse<DesignationResponseDto>> GetAllAsync(DesignationFilterDto filterDto)
        {
            var query = _context.MstDesignations.AsQueryable();

            // Restrict to provided group GUID if supplied
            if (!string.IsNullOrWhiteSpace(filterDto.strGroupGUID) &&
                Guid.TryParse(filterDto.strGroupGUID, out var parsedGroupGuid))
            {
                query = query.Where(x => x.strGroupGUID == parsedGroupGuid);
            }

            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active designations
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive designations
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

            // Get total count for pagination
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var response = new PagedResponse<DesignationResponseDto>
            {
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                Items = _mapper.Map<List<DesignationResponseDto>>(items)
            };

            return response;
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var designation = await _context.MstDesignations.FindAsync(Guid.Parse(guid));
            if (designation == null)
                throw new BusinessException("Designation not found");

            _context.MstDesignations.Remove(designation);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<DesignationSimpleDto>> GetActiveDesignationsAsync(string? search = null, string? groupGUID = null)
        {
            var query = _context.MstDesignations
                .Where(x => x.bolIsActive);

            // Filter by group if provided
            if (!string.IsNullOrWhiteSpace(groupGUID) && Guid.TryParse(groupGUID, out var parsedGroupGuid))
            {
                query = query.Where(x => x.strGroupGUID == parsedGroupGuid);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(search));
            }

            var designations = await query
                .OrderBy(x => x.strName)
                .ToListAsync();

            return _mapper.Map<List<DesignationSimpleDto>>(designations);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportDesignationsAsync(string format)
        {
            // Get all designations
            var designations = await _context.MstDesignations
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
                var worksheet = workbook.Worksheets.Add("Designations");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Status";
                worksheet.Cell(1, 3).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < designations.Count; i++)
                {
                    var designation = designations[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = designation.strName;
                    worksheet.Cell(row, 2).Value = designation.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 3).Value = designation.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Designations_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Name,Status,Created On");
                
                // Add data rows
                foreach (var designation in designations)
                {
                    csv.AppendLine($"\"{designation.strName.Replace("\"", "\"\"")}\",{(designation.bolIsActive ? "Active" : "Inactive")},{designation.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"Designations_{timestamp}.csv");
            }
        }
    }
}

