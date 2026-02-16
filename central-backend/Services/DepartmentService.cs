using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Department;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;
using System.Text;
using System.IO;
using ClosedXML.Excel;

namespace AuditSoftware.Services
{
    public class DepartmentService : ServiceBase, IDepartmentService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public DepartmentService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<DepartmentResponseDto> CreateAsync(DepartmentCreateDto createDto, string createdByGUID, string groupGUID)
        {
            // validate required group
            if (string.IsNullOrWhiteSpace(groupGUID))
                throw new BusinessException("Group GUID is required");

            // Check duplicate within same group (case-insensitive)
            var exists = await _context.MstDepartments
                .AnyAsync(x => x.strDepartmentName.ToLower() == createDto.strDepartmentName.ToLower()
                    && x.strGroupGUID == Guid.Parse(groupGUID));

            if (exists)
                throw new BusinessException($"A department '{createDto.strDepartmentName}' already exists in your group");

            var department = _mapper.Map<MstDepartment>(createDto);
            department.strDepartmentGUID = Guid.NewGuid();
            department.dtCreatedOn = CurrentDateTime;
            department.strCreatedByGUID = Guid.Parse(createdByGUID);
            department.strUpdatedByGUID = Guid.Parse(createdByGUID);
            department.dtUpdatedOn = CurrentDateTime;
            department.strGroupGUID = Guid.Parse(groupGUID);

            try
            {
                _context.MstDepartments.Add(department);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new BusinessException("Failed to create department. Please ensure the name is unique within your group.");
            }

            return _mapper.Map<DepartmentResponseDto>(department);
        }

        public async Task<DepartmentResponseDto> UpdateAsync(string guid, DepartmentUpdateDto updateDto, string updatedByGUID, string groupGUID)
        {
            var department = await _context.MstDepartments
                .Where(x => x.strDepartmentGUID == Guid.Parse(guid) && x.strGroupGUID == Guid.Parse(groupGUID))
                .FirstOrDefaultAsync();

            if (department == null)
                throw new BusinessException("Department not found or you don't have permission to update it");

            // Check duplicate within same group excluding current
            var exists = await _context.MstDepartments
                .Where(x => x.strDepartmentGUID != Guid.Parse(guid) && x.strGroupGUID == Guid.Parse(groupGUID))
                .AnyAsync(x => x.strDepartmentName.ToLower() == updateDto.strDepartmentName.ToLower());

            if (exists)
                throw new BusinessException($"Another department with name '{updateDto.strDepartmentName}' already exists in your group");

            _mapper.Map(updateDto, department);
            department.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            department.dtUpdatedOn = CurrentDateTime;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new BusinessException("Failed to update department. Please ensure the name is unique within your group.");
            }

            return _mapper.Map<DepartmentResponseDto>(department);
        }

        public async Task<DepartmentResponseDto> GetByIdAsync(string guid)
        {
            var department = await _context.MstDepartments.FindAsync(Guid.Parse(guid));
            if (department == null)
                throw new BusinessException("Department not found");

            return _mapper.Map<DepartmentResponseDto>(department);
        }

        public async Task<PagedResponse<DepartmentResponseDto>> GetAllAsync(DepartmentFilterDto filterDto)
        {
            if (filterDto.PageNumber < 1)
                throw new BusinessException("Page number must be greater than 0");
            if (filterDto.PageSize < 1)
                throw new BusinessException("Page size must be greater than 0");

            var query = _context.MstDepartments.AsQueryable();

            if (!string.IsNullOrWhiteSpace(filterDto.strGroupGUID))
            {
                query = query.Where(x => x.strGroupGUID == Guid.Parse(filterDto.strGroupGUID));
            }

            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var term = filterDto.Search.ToLower().Trim();
                query = query.Where(x => x.strDepartmentName.ToLower().Contains(term));
            }

            if (filterDto.bolsActive.HasValue)
            {
                query = query.Where(x => x.bolsActive == filterDto.bolsActive.Value);
            }

            var totalCount = await query.CountAsync();

            var items = await query.OrderByDescending(x => x.bolsActive).ThenBy(x => x.strDepartmentName)
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var response = new PagedResponse<DepartmentResponseDto>
            {
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize),
                Items = _mapper.Map<List<DepartmentResponseDto>>(items)
            };

            return response;
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var department = await _context.MstDepartments.FindAsync(Guid.Parse(guid));
            if (department == null)
                throw new BusinessException("Department not found");

            _context.MstDepartments.Remove(department);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<DepartmentSimpleDto>> GetActiveDepartmentsAsync(string? search = null, string? groupGUID = null)
        {
            var query = _context.MstDepartments.Where(x => x.bolsActive);
            if (!string.IsNullOrWhiteSpace(groupGUID))
                query = query.Where(x => x.strGroupGUID == Guid.Parse(groupGUID));

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(x => x.strDepartmentName.ToLower().Contains(search.ToLower()));

            var list = await query.OrderBy(x => x.strDepartmentName).ToListAsync();
            return _mapper.Map<List<DepartmentSimpleDto>>(list);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportDepartmentsAsync(string format, string groupGuid)
        {
            var query = _context.MstDepartments.AsQueryable();
            if (!string.IsNullOrWhiteSpace(groupGuid))
                query = query.Where(x => x.strGroupGUID == Guid.Parse(groupGuid));

            var departments = await query.OrderBy(x => x.strDepartmentName).ToListAsync();

            if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
                throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");

            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");

            if (format.ToLower() == "excel")
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Departments");
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Status";
                worksheet.Cell(1, 3).Value = "Created On";
                for (int i = 0; i < departments.Count; i++)
                {
                    var d = departments[i];
                    int row = i + 2;
                    worksheet.Cell(row, 1).Value = d.strDepartmentName;
                    worksheet.Cell(row, 2).Value = d.bolsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 3).Value = d.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                worksheet.Columns().AdjustToContents();
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Departments_{timestamp}.xlsx");
            }

            var csv = new StringBuilder();
            csv.AppendLine("Name,Status,Created On");
            foreach (var d in departments)
            {
                csv.AppendLine($"\"{d.strDepartmentName.Replace("\"", "\"\"")}\",{(d.bolsActive ? "Active" : "Inactive")},{d.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
            }
            return (Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"Departments_{timestamp}.csv");
        }
    }
}
