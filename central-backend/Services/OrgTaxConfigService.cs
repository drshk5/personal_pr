using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.OrgTaxConfig;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Services;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AuditSoftware.Services
{
    public class OrgTaxConfigService : ServiceBase, IOrgTaxConfigService
    {
        private readonly AppDbContext _context;

        public OrgTaxConfigService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<OrgTaxConfigResponseDto> CreateAsync(OrgTaxConfigCreateDto createDto, string createdByGUID)
        {
            // Validate and parse organization GUID
            if (string.IsNullOrWhiteSpace(createDto.strOrganizationGUID))
                throw new BusinessException("Organization GUID is required");

            if (!Guid.TryParse(createDto.strOrganizationGUID, out var organizationGuid))
                throw new BusinessException($"Invalid Organization GUID format: '{createDto.strOrganizationGUID}'. Please provide a valid GUID.");

            var organizationExists = await _context.MstOrganizations
                .AnyAsync(o => o.strOrganizationGUID == organizationGuid);

            if (!organizationExists)
                throw new BusinessException("Organization not found");

            // Validate and parse tax type GUID
            if (string.IsNullOrWhiteSpace(createDto.strTaxTypeGUID))
                throw new BusinessException("Tax Type GUID is required");

            if (!Guid.TryParse(createDto.strTaxTypeGUID, out var taxTypeGuid))
                throw new BusinessException($"Invalid Tax Type GUID format: '{createDto.strTaxTypeGUID}'. Please provide a valid GUID.");

            var taxTypeExists = await _context.MstTaxTypes
                .AnyAsync(t => t.strTaxTypeGUID == taxTypeGuid);

            if (!taxTypeExists)
                throw new BusinessException("Tax Type not found");

            // Validate and parse state GUID if provided
            Guid? stateGuid = null;
            if (!string.IsNullOrWhiteSpace(createDto.strStateGUID))
            {
                if (!Guid.TryParse(createDto.strStateGUID, out var parsedStateGuid))
                    throw new BusinessException($"Invalid State GUID format: '{createDto.strStateGUID}'. Please provide a valid GUID.");

                var stateExists = await _context.MstState
                    .AnyAsync(s => s.strStateGUID == parsedStateGuid);

                if (!stateExists)
                    throw new BusinessException("State not found");

                stateGuid = parsedStateGuid;
            }

            // Validate and parse created by GUID
            if (string.IsNullOrWhiteSpace(createdByGUID))
                throw new BusinessException("User GUID is required");

            if (!Guid.TryParse(createdByGUID, out var createdByGuidParsed))
                throw new BusinessException($"Invalid User GUID format: '{createdByGUID}'. Please provide a valid GUID.");

            // Check for duplicate configuration
            var duplicateExists = await _context.Set<MstOrgTaxConfig>()
                .AnyAsync(c => c.strOrganizationGUID == organizationGuid 
                    && c.strTaxTypeGUID == taxTypeGuid
                    && c.bolIsActive);

            if (duplicateExists)
                throw new BusinessException("Active tax configuration already exists for this organization and tax type");

            var config = new MstOrgTaxConfig
            {
                strOrgTaxConfigGUID = Guid.NewGuid(),
                strOrganizationGUID = organizationGuid,
                strTaxTypeGUID = taxTypeGuid,
                strTaxRegNo = createDto.strTaxRegNo,
                strStateGUID = stateGuid,
                dtRegistrationDate = createDto.dtRegistrationDate,
                bolIsActive = createDto.bolIsActive,
                jsonSettings = createDto.jsonSettings,
                strCreatedByGUID = createdByGuidParsed,
                dtCreatedDate = CurrentDateTime
            };

            _context.Set<MstOrgTaxConfig>().Add(config);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(config.strOrgTaxConfigGUID.ToString()) 
                ?? throw new BusinessException("Failed to retrieve created tax configuration");
        }

        public async Task<OrgTaxConfigResponseDto?> UpdateAsync(string guid, OrgTaxConfigUpdateDto updateDto)
        {
            // Validate and parse config GUID
            if (string.IsNullOrWhiteSpace(guid))
                throw new BusinessException("Tax Configuration GUID is required");

            if (!Guid.TryParse(guid, out var configGuid))
                throw new BusinessException($"Invalid Tax Configuration GUID format: '{guid}'. Please provide a valid GUID.");

            var config = await _context.Set<MstOrgTaxConfig>()
                .FirstOrDefaultAsync(c => c.strOrgTaxConfigGUID == configGuid);

            if (config == null)
                throw new BusinessException("Tax configuration not found");

            // Validate and parse tax type GUID
            if (string.IsNullOrWhiteSpace(updateDto.strTaxTypeGUID))
                throw new BusinessException("Tax Type GUID is required");

            if (!Guid.TryParse(updateDto.strTaxTypeGUID, out var taxTypeGuid))
                throw new BusinessException($"Invalid Tax Type GUID format: '{updateDto.strTaxTypeGUID}'. Please provide a valid GUID.");

            var taxTypeExists = await _context.MstTaxTypes
                .AnyAsync(t => t.strTaxTypeGUID == taxTypeGuid);

            if (!taxTypeExists)
                throw new BusinessException("Tax Type not found");

            // Validate and parse state GUID if provided
            Guid? stateGuid = null;
            if (!string.IsNullOrWhiteSpace(updateDto.strStateGUID))
            {
                if (!Guid.TryParse(updateDto.strStateGUID, out var parsedStateGuid))
                    throw new BusinessException($"Invalid State GUID format: '{updateDto.strStateGUID}'. Please provide a valid GUID.");

                var stateExists = await _context.MstState
                    .AnyAsync(s => s.strStateGUID == parsedStateGuid);

                if (!stateExists)
                    throw new BusinessException("State not found");

                stateGuid = parsedStateGuid;
            }

            config.strTaxTypeGUID = taxTypeGuid;
            config.strTaxRegNo = updateDto.strTaxRegNo;
            config.strStateGUID = stateGuid;
            config.dtRegistrationDate = updateDto.dtRegistrationDate;
            config.bolIsActive = updateDto.bolIsActive;
            config.jsonSettings = updateDto.jsonSettings;

            await _context.SaveChangesAsync();

            return await GetByIdAsync(guid);
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            // Validate and parse config GUID
            if (string.IsNullOrWhiteSpace(guid))
                throw new BusinessException("Tax Configuration GUID is required");

            if (!Guid.TryParse(guid, out var configGuid))
                throw new BusinessException($"Invalid Tax Configuration GUID format: '{guid}'. Please provide a valid GUID.");

            var config = await _context.Set<MstOrgTaxConfig>()
                .FirstOrDefaultAsync(c => c.strOrgTaxConfigGUID == configGuid);

            if (config == null)
                throw new BusinessException("Tax configuration not found");

            _context.Set<MstOrgTaxConfig>().Remove(config);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<OrgTaxConfigResponseDto?> GetByIdAsync(string guid)
        {
            // Validate and parse config GUID
            if (string.IsNullOrWhiteSpace(guid))
                throw new BusinessException("Tax Configuration GUID is required");

            if (!Guid.TryParse(guid, out var configGuid))
                throw new BusinessException($"Invalid Tax Configuration GUID format: '{guid}'. Please provide a valid GUID.");

            var config = await _context.Set<MstOrgTaxConfig>()
                .Include(c => c.Organization)
                .Include(c => c.TaxType)
                .Include(c => c.State)
                .FirstOrDefaultAsync(c => c.strOrgTaxConfigGUID == configGuid);

            if (config == null)
                return null;

            return new OrgTaxConfigResponseDto
            {
                strOrgTaxConfigGUID = config.strOrgTaxConfigGUID.ToString(),
                strOrganizationGUID = config.strOrganizationGUID.ToString(),
                strOrganizationName = config.Organization?.strOrganizationName,
                strTaxTypeGUID = config.strTaxTypeGUID.ToString(),
                strTaxTypeName = config.TaxType?.strTaxTypeName,
                strTaxTypeCode = config.TaxType?.strTaxTypeCode,
                strTaxRegNo = config.strTaxRegNo,
                strStateGUID = config.strStateGUID?.ToString(),
                strStateName = config.State?.strName,
                dtRegistrationDate = config.dtRegistrationDate,
                bolIsActive = config.bolIsActive,
                jsonSettings = config.jsonSettings,
                strCreatedByGUID = config.strCreatedByGUID.ToString(),
                dtCreatedDate = config.dtCreatedDate
            };
        }

        public async Task<PagedResponse<OrgTaxConfigResponseDto>> GetAllAsync(OrgTaxConfigFilterDto filterDto)
        {
            var query = _context.Set<MstOrgTaxConfig>()
                .Include(c => c.Organization)
                .Include(c => c.TaxType)
                .Include(c => c.State)
                .AsQueryable();

            // Apply IsActive filter if provided
            if (filterDto.IsActive.HasValue)
            {
                query = query.Where(c => c.bolIsActive == filterDto.IsActive.Value);
            }

            // Apply Organization filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.OrganizationGUID))
            {
                if (Guid.TryParse(filterDto.OrganizationGUID, out var orgGuid))
                {
                    query = query.Where(c => c.strOrganizationGUID == orgGuid);
                }
            }

            // Apply TaxType filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.TaxTypeGUID))
            {
                if (Guid.TryParse(filterDto.TaxTypeGUID, out var taxTypeGuid))
                {
                    query = query.Where(c => c.strTaxTypeGUID == taxTypeGuid);
                }
            }

            // Apply State filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.StateGUID))
            {
                if (Guid.TryParse(filterDto.StateGUID, out var stateGuid))
                {
                    query = query.Where(c => c.strStateGUID == stateGuid);
                }
            }

            // Apply general search if provided
            if (!string.IsNullOrWhiteSpace(filterDto.SearchTerm))
            {
                var searchTerm = filterDto.SearchTerm.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    query = query.Where(c => c.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    query = query.Where(c => c.bolIsActive == false);
                }
                else
                {
                    // Regular search across fields
                    query = query.Where(c => 
                        (c.strTaxRegNo != null && c.strTaxRegNo.ToLower().Contains(searchTerm)) ||
                        (c.Organization != null && c.Organization.strOrganizationName.ToLower().Contains(searchTerm)) ||
                        (c.TaxType != null && c.TaxType.strTaxTypeName.ToLower().Contains(searchTerm)) ||
                        (c.TaxType != null && c.TaxType.strTaxTypeCode.ToLower().Contains(searchTerm)) ||
                        (c.State != null && c.State.strName.ToLower().Contains(searchTerm)));
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                query = filterDto.SortBy.ToLower() switch
                {
                    "organization" => filterDto.ascending ? query.OrderBy(c => c.Organization.strOrganizationName) : query.OrderByDescending(c => c.Organization.strOrganizationName),
                    "taxtype" => filterDto.ascending ? query.OrderBy(c => c.TaxType.strTaxTypeName) : query.OrderByDescending(c => c.TaxType.strTaxTypeName),
                    "taxregno" => filterDto.ascending ? query.OrderBy(c => c.strTaxRegNo) : query.OrderByDescending(c => c.strTaxRegNo),
                    "state" => filterDto.ascending ? query.OrderBy(c => c.State.strName) : query.OrderByDescending(c => c.State.strName),
                    "registrationdate" => filterDto.ascending ? query.OrderBy(c => c.dtRegistrationDate) : query.OrderByDescending(c => c.dtRegistrationDate),
                    "isactive" or "status" => !filterDto.ascending ? query.OrderBy(c => c.bolIsActive) : query.OrderByDescending(c => c.bolIsActive),
                    _ => query.OrderByDescending(c => c.dtCreatedDate)
                };
            }
            else
            {
                query = query.OrderByDescending(c => c.dtCreatedDate);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var dtos = items.Select(config => new OrgTaxConfigResponseDto
            {
                strOrgTaxConfigGUID = config.strOrgTaxConfigGUID.ToString(),
                strOrganizationGUID = config.strOrganizationGUID.ToString(),
                strOrganizationName = config.Organization?.strOrganizationName,
                strTaxTypeGUID = config.strTaxTypeGUID.ToString(),
                strTaxTypeName = config.TaxType?.strTaxTypeName,
                strTaxTypeCode = config.TaxType?.strTaxTypeCode,
                strTaxRegNo = config.strTaxRegNo,
                strStateGUID = config.strStateGUID?.ToString(),
                strStateName = config.State?.strName,
                dtRegistrationDate = config.dtRegistrationDate,
                bolIsActive = config.bolIsActive,
                jsonSettings = config.jsonSettings,
                strCreatedByGUID = config.strCreatedByGUID.ToString(),
                dtCreatedDate = config.dtCreatedDate
            }).ToList();

            var response = new PagedResponse<OrgTaxConfigResponseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize
            };

            return response;
        }

        public async Task<List<OrgTaxConfigSimpleDto>> GetActiveByOrganizationAsync(string organizationGUID)
        {
            // Validate and parse organization GUID
            if (string.IsNullOrWhiteSpace(organizationGUID))
                throw new BusinessException("Organization GUID is required");

            if (!Guid.TryParse(organizationGUID, out var orgGuid))
                throw new BusinessException($"Invalid Organization GUID format: '{organizationGUID}'. Please provide a valid GUID.");
            
            var configs = await _context.Set<MstOrgTaxConfig>()
                .Include(c => c.Organization)
                .Include(c => c.TaxType)
                .Where(c => c.strOrganizationGUID == orgGuid && c.bolIsActive == true)
                .OrderBy(c => c.TaxType!.strTaxTypeName)
                .Select(c => new OrgTaxConfigSimpleDto
                {
                    strOrgTaxConfigGUID = c.strOrgTaxConfigGUID.ToString(),
                    strOrganizationGUID = c.strOrganizationGUID.ToString(),
                    strOrganizationName = c.Organization!.strOrganizationName,
                    strTaxTypeGUID = c.strTaxTypeGUID.ToString(),
                    strTaxTypeName = c.TaxType!.strTaxTypeName,
                    strTaxRegNo = c.strTaxRegNo
                })
                .ToListAsync();

            return configs;
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportAsync(
            string format, OrgTaxConfigFilterDto filterDto)
        {
            // Get all data without pagination for export
            var exportFilter = new OrgTaxConfigFilterDto
            {
                IsActive = filterDto.IsActive,
                OrganizationGUID = filterDto.OrganizationGUID,
                TaxTypeGUID = filterDto.TaxTypeGUID,
                StateGUID = filterDto.StateGUID,
                SearchTerm = filterDto.SearchTerm,
                SortBy = filterDto.SortBy,
                ascending = filterDto.ascending,
                PageNumber = 1,
                PageSize = int.MaxValue
            };

            var allData = await GetAllAsync(exportFilter);
            var configs = allData.Items;

            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");

            if (format.ToLower() == "excel")
            {
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("OrgTaxConfigs");

                // Add headers
                worksheet.Cell(1, 1).Value = "Organization";
                worksheet.Cell(1, 2).Value = "Tax Type";
                worksheet.Cell(1, 3).Value = "Tax Type Code";
                worksheet.Cell(1, 4).Value = "Tax Reg No";
                worksheet.Cell(1, 5).Value = "State";
                worksheet.Cell(1, 6).Value = "Registration Date";
                worksheet.Cell(1, 7).Value = "Status";
                worksheet.Cell(1, 8).Value = "Created Date";

                // Style header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;

                // Add data
                for (int i = 0; i < configs.Count(); i++)
                {
                    var config = configs.ElementAt(i);
                    int row = i + 2;
                    
                    worksheet.Cell(row, 1).Value = config.strOrganizationName ?? "";
                    worksheet.Cell(row, 2).Value = config.strTaxTypeName ?? "";
                    worksheet.Cell(row, 3).Value = config.strTaxTypeCode ?? "";
                    worksheet.Cell(row, 4).Value = config.strTaxRegNo ?? "";
                    worksheet.Cell(row, 5).Value = config.strStateName ?? "";
                    worksheet.Cell(row, 6).Value = config.dtRegistrationDate?.ToString("yyyy-MM-dd") ?? "";
                    worksheet.Cell(row, 7).Value = config.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 8).Value = config.dtCreatedDate.ToString("yyyy-MM-dd HH:mm:ss");
                }
                
                worksheet.Columns().AdjustToContents();
                
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"OrgTaxConfigs_{timestamp}.xlsx");
            }
            else // CSV
            {
                var csv = new StringBuilder();
                csv.AppendLine("Organization,Tax Type,Tax Type Code,Tax Reg No,State,Registration Date,Status,Created Date");
                
                foreach (var config in configs)
                {
                    csv.AppendLine($"\"{config.strOrganizationName?.Replace("\"", "\"\"\"") ?? ""}\",\"{config.strTaxTypeName?.Replace("\"", "\"\"\"") ?? ""}\",\"{config.strTaxTypeCode?.Replace("\"", "\"\"\"") ?? ""}\",\"{config.strTaxRegNo?.Replace("\"", "\"\"\"") ?? ""}\",\"{config.strStateName?.Replace("\"", "\"\"\"") ?? ""}\",\"{config.dtRegistrationDate?.ToString("yyyy-MM-dd") ?? ""}\",{(config.bolIsActive ? "Active" : "Inactive")},{config.dtCreatedDate:yyyy-MM-dd HH:mm:ss}");
                }
                
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                return (bytes, "text/csv", $"OrgTaxConfigs_{timestamp}.csv");
            }
        }
    }
}
