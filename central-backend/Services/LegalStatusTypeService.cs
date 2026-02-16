using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.LegalStatusType;
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
    public class LegalStatusTypeService :  ServiceBase, ILegalStatusTypeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public LegalStatusTypeService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<LegalStatusTypeResponseDto> CreateAsync(LegalStatusTypeCreateDto createDto, string createdByGUID)
        {
            // Check for duplicate name across all legal status types
            var exists = await _context.MstLegalStatusTypes
                .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower());

            if (exists)
                throw new BusinessException($"A legal status type '{createDto.strName}' already exists");

            var legalStatusType = _mapper.Map<MstLegalStatusType>(createDto);
            legalStatusType.strLegalStatusTypeGUID = Guid.NewGuid();
            legalStatusType.dtCreatedOn = CurrentDateTime;
            legalStatusType.strCreatedByGUID = Guid.Parse(createdByGUID);
            legalStatusType.strUpdatedByGUID = Guid.Parse(createdByGUID);  // Set updated by to the same as created by
            legalStatusType.dtUpdatedOn = CurrentDateTime;             // Set updated on to the same as created on

            _context.MstLegalStatusTypes.Add(legalStatusType);
            await _context.SaveChangesAsync();

            return _mapper.Map<LegalStatusTypeResponseDto>(legalStatusType);
        }

        public async Task<LegalStatusTypeResponseDto> UpdateAsync(string guid, LegalStatusTypeUpdateDto updateDto, string updatedByGUID)
        {
            var legalStatusType = await _context.MstLegalStatusTypes.FindAsync(Guid.Parse(guid));
            if (legalStatusType == null)
                throw new BusinessException("Legal status type not found");

            // Check for duplicate name, but exclude the current one
            var exists = await _context.MstLegalStatusTypes
                .Where(x => x.strLegalStatusTypeGUID != Guid.Parse(guid) && 
                            x.strName.ToLower() == updateDto.strName.ToLower())
                .AnyAsync();

            if (exists)
                throw new BusinessException($"Another legal status type with name '{updateDto.strName}' already exists");

            _mapper.Map(updateDto, legalStatusType);
            legalStatusType.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            legalStatusType.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<LegalStatusTypeResponseDto>(legalStatusType);
        }

        public async Task<LegalStatusTypeResponseDto> GetByIdAsync(string guid)
        {
            var legalStatusType = await _context.MstLegalStatusTypes.FindAsync(Guid.Parse(guid));
            if (legalStatusType == null)
                throw new BusinessException("Legal status type not found");

            return _mapper.Map<LegalStatusTypeResponseDto>(legalStatusType);
        }

        public async Task<PagedResponse<LegalStatusTypeResponseDto>> GetAllAsync(LegalStatusTypeFilterDto filterDto)
        {
            var query = _context.MstLegalStatusTypes.AsQueryable();

            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active legal status types
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive legal status types
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

            var response = new PagedResponse<LegalStatusTypeResponseDto>
            {
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                Items = _mapper.Map<List<LegalStatusTypeResponseDto>>(items)
            };

            return response;
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var legalStatusType = await _context.MstLegalStatusTypes.FindAsync(Guid.Parse(guid));
            if (legalStatusType == null)
                throw new BusinessException("Legal status type not found");

            _context.MstLegalStatusTypes.Remove(legalStatusType);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<LegalStatusTypeSimpleDto>> GetActiveLegalStatusTypesAsync(string search = null)
        {
            var query = _context.MstLegalStatusTypes
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(search));
            }

            var legalStatusTypes = await query
                .OrderBy(x => x.strName)
                .ToListAsync();

            return _mapper.Map<List<LegalStatusTypeSimpleDto>>(legalStatusTypes);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportLegalStatusTypesAsync(string format)
        {
            // Get all legal status types
            var legalStatusTypes = await _context.MstLegalStatusTypes
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
                var worksheet = workbook.Worksheets.Add("Legal Status Types");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Status";
                worksheet.Cell(1, 3).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < legalStatusTypes.Count; i++)
                {
                    var legalStatusType = legalStatusTypes[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = legalStatusType.strName;
                    worksheet.Cell(row, 2).Value = legalStatusType.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 3).Value = legalStatusType.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"LegalStatusTypes_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Name,Status,Created On");
                
                // Add data rows
                foreach (var legalStatusType in legalStatusTypes)
                {
                    csv.AppendLine($"\"{legalStatusType.strName.Replace("\"", "\"\"")}\",{(legalStatusType.bolIsActive ? "Active" : "Inactive")},{legalStatusType.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"LegalStatusTypes_{timestamp}.csv");
            }
        }
    }
}

