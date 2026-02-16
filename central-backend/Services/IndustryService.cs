using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Industry;
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
    public class IndustryService :  ServiceBase, IIndustryService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public IndustryService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IndustryResponseDto> CreateAsync(IndustryCreateDto createDto, string createdByGUID)
        {
            // Check for duplicate name
            var exists = await _context.MstIndustries
                .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower());

            if (exists)
                throw new BusinessException($"An industry with name '{createDto.strName}' already exists");

            var industry = _mapper.Map<MstIndustry>(createDto);
            industry.strIndustryGUID = Guid.NewGuid();
            industry.dtCreatedOn = CurrentDateTime;
            industry.strCreatedByGUID = Guid.Parse(createdByGUID);
            industry.strUpdatedByGUID = Guid.Parse(createdByGUID);  // Set updated by to the same as created by
            industry.dtUpdatedOn = CurrentDateTime;             // Set updated on to the same as created on

            _context.MstIndustries.Add(industry);
            await _context.SaveChangesAsync();

            return _mapper.Map<IndustryResponseDto>(industry);
        }

        public async Task<IndustryResponseDto> UpdateAsync(string guid, IndustryUpdateDto updateDto, string updatedByGUID)
        {
            var industry = await _context.MstIndustries.FindAsync(Guid.Parse(guid));
            if (industry == null)
                throw new BusinessException("Industry not found");

            // Check for duplicate name
            var exists = await _context.MstIndustries
                .AnyAsync(x => x.strName.ToLower() == updateDto.strName.ToLower() && 
                           x.strIndustryGUID != Guid.Parse(guid));

            if (exists)
                throw new BusinessException($"An industry with name '{updateDto.strName}' already exists");

            _mapper.Map(updateDto, industry);
            industry.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            industry.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<IndustryResponseDto>(industry);
        }

        public async Task<IndustryResponseDto> GetByIdAsync(string guid)
        {
            var industry = await _context.MstIndustries.FindAsync(Guid.Parse(guid));
            if (industry == null)
                throw new BusinessException("Industry not found");

            return _mapper.Map<IndustryResponseDto>(industry);
        }

        public async Task<PagedResponse<IndustryResponseDto>> GetAllAsync(IndustryFilterDto filterDto)
        {
            var query = _context.MstIndustries.AsQueryable();

            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active industries
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive industries
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

            var dtos = _mapper.Map<List<IndustryResponseDto>>(items);

            return new PagedResponse<IndustryResponseDto>
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
            var industry = await _context.MstIndustries
                .FirstOrDefaultAsync(i => i.strIndustryGUID == Guid.Parse(guid));

            if (industry == null)
                return false;

            // Add additional validation here if needed, like checking for references in other tables

            // Remove the industry
            _context.MstIndustries.Remove(industry);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<IndustrySimpleDto>> GetActiveIndustriesAsync(string searchTerm = null)
        {
            var query = _context.MstIndustries
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.ToLower();
                query = query.Where(x => x.strName.ToLower().Contains(term));
            }

            var industries = await query
                .OrderBy(x => x.strName)
                .ToListAsync();

            return _mapper.Map<List<IndustrySimpleDto>>(industries);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportIndustriesAsync(string format)
        {
            // Get all industries
            var industries = await _context.MstIndustries
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
                var worksheet = workbook.Worksheets.Add("Industries");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Status";
                worksheet.Cell(1, 3).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < industries.Count; i++)
                {
                    var industry = industries[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = industry.strName;
                    worksheet.Cell(row, 2).Value = industry.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 3).Value = industry.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Industries_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Name,Status,Created On");
                
                // Add data rows
                foreach (var industry in industries)
                {
                    csv.AppendLine($"\"{industry.strName.Replace("\"", "\"\"")}\",{(industry.bolIsActive ? "Active" : "Inactive")},{industry.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"Industries_{timestamp}.csv");
            }
        }
    }
}

