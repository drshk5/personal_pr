using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.DocType;
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
    public class DocTypeService : ServiceBase, IDocTypeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public DocTypeService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<DocTypeResponseDto> CreateAsync(DocTypeCreateDto createDto, string createdByGUID)
        {
            // Check for duplicate code
            var existsByCode = await _context.MstDocTypes
                .AnyAsync(x => x.strDocTypeCode.ToLower() == createDto.strDocTypeCode.ToLower());

            if (existsByCode)
                throw new BusinessException($"A document type with code '{createDto.strDocTypeCode}' already exists");

            // Check for duplicate name
            var existsByName = await _context.MstDocTypes
                .AnyAsync(x => x.strDocTypeName.ToLower() == createDto.strDocTypeName.ToLower());

            if (existsByName)
                throw new BusinessException($"A document type with name '{createDto.strDocTypeName}' already exists");

            var docType = _mapper.Map<MstDocType>(createDto);
            docType.strDocTypeGUID = Guid.NewGuid();
            docType.dtCreatedOn = CurrentDateTime;
            docType.strCreatedByGUID = Guid.Parse(createdByGUID);
            docType.strUpdatedByGUID = Guid.Parse(createdByGUID);
            docType.dtUpdatedOn = CurrentDateTime;

            _context.MstDocTypes.Add(docType);
            await _context.SaveChangesAsync();

            return _mapper.Map<DocTypeResponseDto>(docType);
        }

        public async Task<DocTypeResponseDto> UpdateAsync(string guid, DocTypeUpdateDto updateDto, string updatedByGUID)
        {
            var docType = await _context.MstDocTypes.FindAsync(Guid.Parse(guid));
            if (docType == null)
                throw new BusinessException("Document type not found");

            // Check for duplicate code if it changed
            if (!string.Equals(docType.strDocTypeCode, updateDto.strDocTypeCode, StringComparison.OrdinalIgnoreCase))
            {
                var existsByCode = await _context.MstDocTypes
                    .AnyAsync(x => x.strDocTypeGUID != Guid.Parse(guid) && 
                                   x.strDocTypeCode.ToLower() == updateDto.strDocTypeCode.ToLower());

                if (existsByCode)
                    throw new BusinessException($"A document type with code '{updateDto.strDocTypeCode}' already exists");
            }

            // Check for duplicate name if it changed
            if (!string.Equals(docType.strDocTypeName, updateDto.strDocTypeName, StringComparison.OrdinalIgnoreCase))
            {
                var existsByName = await _context.MstDocTypes
                    .AnyAsync(x => x.strDocTypeGUID != Guid.Parse(guid) && 
                                   x.strDocTypeName.ToLower() == updateDto.strDocTypeName.ToLower());

                if (existsByName)
                    throw new BusinessException($"A document type with name '{updateDto.strDocTypeName}' already exists");
            }

            _mapper.Map(updateDto, docType);
            docType.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            docType.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<DocTypeResponseDto>(docType);
        }

        public async Task<DocTypeResponseDto> GetByIdAsync(string guid)
        {
            var docType = await _context.MstDocTypes.FindAsync(Guid.Parse(guid));
            if (docType == null)
                throw new BusinessException("Document type not found");

            return _mapper.Map<DocTypeResponseDto>(docType);
        }

        public async Task<PagedResponse<DocTypeResponseDto>> GetAllAsync(DocTypeFilterDto filterDto)
        {
            var query = _context.MstDocTypes.AsQueryable();
            
            // Apply active/inactive filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(x => x.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower();
                query = query.Where(x => 
                    x.strDocTypeCode.ToLower().Contains(searchTerm) || 
                    x.strDocTypeName.ToLower().Contains(searchTerm));
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                var sortField = filterDto.SortBy;
                var sortDirection = filterDto.ascending ? "asc" : "desc";
                
                try
                {
                    query = query.OrderBy($"{sortField} {sortDirection}");
                }
                catch
                {
                    // If sorting fails, use default sort
                    query = query.OrderBy(x => x.strDocTypeName);
                }
            }
            else
            {
                // Default sort
                query = query.OrderBy(x => x.strDocTypeName);
            }

            var totalCount = await query.CountAsync();
            
            // Apply pagination
            var pagedData = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var response = new PagedResponse<DocTypeResponseDto>
            {
                Items = _mapper.Map<List<DocTypeResponseDto>>(pagedData),
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize
            };

            return response;
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var docType = await _context.MstDocTypes.FindAsync(Guid.Parse(guid));
            if (docType == null)
                throw new BusinessException("Document type not found");

            _context.MstDocTypes.Remove(docType);
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<List<DocTypeSimpleDto>> GetActiveDocTypesAsync(string? searchTerm = null)
        {
            var query = _context.MstDocTypes
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(x => 
                    x.strDocTypeCode.ToLower().Contains(searchTerm) || 
                    x.strDocTypeName.ToLower().Contains(searchTerm));
            }

            var docTypes = await query
                .OrderBy(x => x.strDocTypeName)
                .ToListAsync();

            return _mapper.Map<List<DocTypeSimpleDto>>(docTypes);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportDocTypesAsync(string format)
        {
            var docTypes = await _context.MstDocTypes
                .OrderBy(x => x.strDocTypeName)
                .ToListAsync();

            if (format.ToLower() == "excel")
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Document Types");

                // Add headers
                worksheet.Cell(1, 1).Value = "Code";
                worksheet.Cell(1, 2).Value = "Name";
                worksheet.Cell(1, 3).Value = "Status";
                worksheet.Cell(1, 4).Value = "Created On";

                // Add data
                var row = 2;
                foreach (var docType in docTypes)
                {
                    worksheet.Cell(row, 1).Value = docType.strDocTypeCode;
                    worksheet.Cell(row, 2).Value = docType.strDocTypeName;
                    worksheet.Cell(row, 3).Value = docType.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 4).Value = docType.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                    row++;
                }

                // Format the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;

                // Auto-fit columns
                worksheet.Columns().AdjustToContents();

                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                var content = stream.ToArray();

                return (content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "DocTypes.xlsx");
            }
            else // CSV format
            {
                var csv = new StringBuilder();
                csv.AppendLine("Code,Name,Status,Created On");

                foreach (var docType in docTypes)
                {
                    csv.AppendLine($"\"{docType.strDocTypeCode}\",\"{docType.strDocTypeName}\",\"{(docType.bolIsActive ? "Active" : "Inactive")}\",\"{docType.dtCreatedOn:yyyy-MM-dd HH:mm:ss}\"");
                }

                var bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return (bytes, "text/csv", "DocTypes.csv");
            }
        }
    }
}