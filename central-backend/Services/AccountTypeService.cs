using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.AccountType;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;
using System.Text;
using System.IO;
using ClosedXML.Excel;

namespace AuditSoftware.Services
{
    public class AccountTypeService : ServiceBase, IAccountTypeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public AccountTypeService(AppDbContext context, IMapper mapper)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        public async Task<AccountTypeResponseDto> CreateAsync(AccountTypeCreateDto createDto, string createdByGUID)
        {
            // Check for duplicate name
            var exists = await _context.MstAccountTypes
                .AnyAsync(x => x.strName.ToLower() == createDto.strName.ToLower());

            if (exists)
                throw new BusinessException("An account type with this name already exists");

            var accountType = _mapper.Map<MstAccountType>(createDto);
            accountType.strAccountTypeGUID = Guid.NewGuid();
            accountType.dtCreatedOn = CurrentDateTime;
            accountType.strCreatedByGUID = Guid.Parse(createdByGUID);
            accountType.strUpdatedByGUID = Guid.Parse(createdByGUID);
            accountType.dtUpdatedOn = CurrentDateTime;

            _context.MstAccountTypes.Add(accountType);
            await _context.SaveChangesAsync();

            return _mapper.Map<AccountTypeResponseDto>(accountType);
        }

        public async Task<AccountTypeResponseDto> UpdateAsync(string guid, AccountTypeUpdateDto updateDto, string updatedByGUID)
        {
            var accountType = await _context.MstAccountTypes.FindAsync(Guid.Parse(guid));
            if (accountType == null)
                throw new BusinessException("Account type not found");

            // Check for duplicate name, excluding current record
            var exists = await _context.MstAccountTypes
                .AnyAsync(x => x.strName.ToLower() == updateDto.strName.ToLower() 
                           && x.strAccountTypeGUID != accountType.strAccountTypeGUID);

            if (exists)
                throw new BusinessException("An account type with this name already exists");

            _mapper.Map(updateDto, accountType);
            accountType.strUpdatedByGUID = Guid.Parse(updatedByGUID);
            accountType.dtUpdatedOn = CurrentDateTime;

            await _context.SaveChangesAsync();

            return _mapper.Map<AccountTypeResponseDto>(accountType);
        }

        public async Task<AccountTypeResponseDto> GetByIdAsync(string guid)
        {
            var accountType = await _context.MstAccountTypes.FindAsync(Guid.Parse(guid));
            if (accountType == null)
                throw new BusinessException("Account type not found");

            return _mapper.Map<AccountTypeResponseDto>(accountType);
        }

        public async Task<PagedResponse<AccountTypeResponseDto>> GetAllAsync(AccountTypeFilterDto filterDto)
        {
            var query = _context.MstAccountTypes.AsQueryable();

            // Apply filters
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == 
                "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm 
                == "inact";
                
                if (isActiveSearch)
                {
                    // Show active account types
                    query = query.Where(x => x.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive account types
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
                        query = filterDto.ascending
                            ? query.OrderBy(x => x.strName)
                            : query.OrderByDescending(x => x.strName);
                        break;
                    case "bolisactive":
                    case "status":
                        query = filterDto.ascending
                            ? query.OrderByDescending(x => x.bolIsActive) // Show active first in ascending order
                            : query.OrderBy(x => x.bolIsActive); // Show inactive first in descending order
                        break;
                    case "createdon":
                        query = filterDto.ascending
                            ? query.OrderBy(x => x.dtCreatedOn)
                            : query.OrderByDescending(x => x.dtCreatedOn);
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

            return new PagedResponse<AccountTypeResponseDto>
            {
                Items = _mapper.Map<List<AccountTypeResponseDto>>(items),
                TotalCount = totalRecords,
                PageNumber = filterDto.pageNumber,
                PageSize = filterDto.pageSize
            };
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            var accountType = await _context.MstAccountTypes.FindAsync(Guid.Parse(guid));
            if (accountType == null)
                return false;

            _context.MstAccountTypes.Remove(accountType);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<AccountTypeSimpleDto>> GetActiveAccountTypesAsync(string? search = null)
        {
            var query = _context.MstAccountTypes
                .Where(x => x.bolIsActive);

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x => x.strName.ToLower().Contains(search.ToLower()));
            }

            var accountTypes = await query
                .OrderBy(x => x.strName)
                .ToListAsync();

            return _mapper.Map<List<AccountTypeSimpleDto>>(accountTypes);
        }
        
        public async Task<List<AccountTypeSimpleDto>> GetOnlyBankAccountTypesAsync(string? search = null)
        {
            var query = _context.MstAccountTypes
                .Where(x => x.bolIsActive && (x.strName == "Bank" || x.strName == "Credit Card"));

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x => x.strName.ToLower().Contains(search.ToLower()));
            }

            var accountTypes = await query
                .OrderBy(x => x.strName)
                .ToListAsync();

            return _mapper.Map<List<AccountTypeSimpleDto>>(accountTypes);
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportAccountTypesAsync(string format)
        {
            // Get all account types
            var accountTypes = await _context.MstAccountTypes
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
                var worksheet = workbook.Worksheets.Add("Account Types");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Status";
                worksheet.Cell(1, 3).Value = "Created On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < accountTypes.Count; i++)
                {
                    var accountType = accountTypes[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = accountType.strName;
                    worksheet.Cell(row, 2).Value = accountType.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 3).Value = accountType.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"AccountTypes_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Name,Status,Created On");
                
                // Add data rows
                foreach (var accountType in accountTypes)
                {
                    csv.AppendLine($"\"{accountType.strName.Replace("\"", "\"\"")}\",{(accountType.bolIsActive ? "Active" : "Inactive")},{accountType.dtCreatedOn:yyyy-MM-dd HH:mm:ss}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"AccountTypes_{timestamp}.csv");
            }
        }
    }
}

