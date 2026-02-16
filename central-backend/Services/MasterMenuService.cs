using AutoMapper;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using AuditSoftware.DTOs.MasterMenu;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using System.Linq.Dynamic.Core;
using System.Text;
using System.IO;
using ClosedXML.Excel;

namespace AuditSoftware.Services
{
    public class MasterMenuService : ServiceBase, IMasterMenuService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MasterMenuService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<MasterMenuResponseDto> CreateMasterMenuAsync(MasterMenuCreateDto masterMenuDto)
        {
            Guid? parentMasterMenuGuid = null;

            Guid? moduleGuid = null;

            // Validate module GUID if provided
            if (!string.IsNullOrEmpty(masterMenuDto.strModuleGUID))
            {
                if (!Guid.TryParse(masterMenuDto.strModuleGUID, out Guid parsedModuleGuid))
                {
                    throw new BusinessException("Invalid module GUID format");
                }

                // Check if module exists
                if (!await _context.MstModules.AnyAsync(m => m.strModuleGUID == parsedModuleGuid))
                {
                    throw new BusinessException("Module not found");
                }

                moduleGuid = parsedModuleGuid;
            }

            // Handle parent master menu GUID
            if (!string.IsNullOrEmpty(masterMenuDto.strParentMenuGUID) && masterMenuDto.strParentMenuGUID.ToLower() != "root")
            {
                if (!Guid.TryParse(masterMenuDto.strParentMenuGUID, out Guid parsedGuid))
                {
                    throw new BusinessException("Invalid parent master menu GUID format");
                }

                parentMasterMenuGuid = parsedGuid;
                var parentMasterMenu = await _context.MstMasterMenus.FindAsync(parsedGuid);
                if (parentMasterMenu == null)
                {
                    throw new BusinessException("Parent master menu not found");
                }
            }

            // Check for duplicate name within same parent and same module
            if (await _context.MstMasterMenus.AnyAsync(m => 
                m.strParentMenuGUID == parentMasterMenuGuid && 
                m.strName == masterMenuDto.strName &&
                m.strModuleGUID == moduleGuid))
            {
                throw new BusinessException("Master menu name already exists under the same parent menu");
            }

            // Check for duplicate path in entire table
            if (await _context.MstMasterMenus.AnyAsync(m => m.strPath == masterMenuDto.strPath))
            {
                throw new BusinessException("Master menu path already exists");
            }

            // Check for duplicate map key
            if (await _context.MstMasterMenus.AnyAsync(m => m.strMapKey == masterMenuDto.strMapKey))
            {
                throw new BusinessException("Master menu map key already exists");
            }

            // Parse page template GUID if provided
            Guid? pageTemplateGuid = null;
            if (!string.IsNullOrEmpty(masterMenuDto.strPageTemplateGUID))
            {
                if (Guid.TryParse(masterMenuDto.strPageTemplateGUID, out Guid parsedTemplateGuid))
                {
                    pageTemplateGuid = parsedTemplateGuid;
                }
                else
                {
                    throw new BusinessException("Invalid page template GUID format");
                }
            }

            var masterMenu = new MstMasterMenu
            {
                strMasterMenuGUID = Guid.NewGuid(),
                strParentMenuGUID = parentMasterMenuGuid,
                strModuleGUID = moduleGuid,
                dblSeqNo = masterMenuDto.dblSeqNo,
                strName = masterMenuDto.strName,
                strPath = masterMenuDto.strPath,
                strMenuPosition = masterMenuDto.strMenuPosition,
                strMapKey = masterMenuDto.strMapKey,
                bolHasSubMenu = masterMenuDto.bolHasSubMenu,
                strIconName = masterMenuDto.strIconName,
                bolIsActive = masterMenuDto.bolIsActive,
                bolSuperAdminAccess = masterMenuDto.bolSuperAdminAccess,
                strCategory = masterMenuDto.strCategory,
                strPageTemplateGUID = pageTemplateGuid,
                bolIsSingleMenu = masterMenuDto.bolIsSingleMenu
            };

            _context.MstMasterMenus.Add(masterMenu);
            await _context.SaveChangesAsync();

            return _mapper.Map<MasterMenuResponseDto>(masterMenu);
        }

        public async Task<MasterMenuResponseDto> GetMasterMenuByIdAsync(Guid guid)
        {
            var masterMenu = await _context.MstMasterMenus
                .FirstOrDefaultAsync(m => m.strMasterMenuGUID == guid);

            if (masterMenu == null)
            {
                throw new BusinessException("Master menu not found");
            }

            return _mapper.Map<MasterMenuResponseDto>(masterMenu);
        }

        public async Task<MasterMenuResponseDto> UpdateMasterMenuAsync(Guid guid, MasterMenuCreateDto masterMenuDto)
        {
            var existingMasterMenu = await _context.MstMasterMenus.FindAsync(guid);
            if (existingMasterMenu == null)
            {
                throw new BusinessException("Master menu not found");
            }

            Guid? moduleGuid = null;

            // Validate module GUID if provided
            if (!string.IsNullOrEmpty(masterMenuDto.strModuleGUID))
            {
                if (!Guid.TryParse(masterMenuDto.strModuleGUID, out Guid parsedModuleGuid))
                {
                    throw new BusinessException("Invalid module GUID format");
                }

                // Check if module exists
                if (!await _context.MstModules.AnyAsync(m => m.strModuleGUID == parsedModuleGuid))
                {
                    throw new BusinessException("Module not found");
                }

                moduleGuid = parsedModuleGuid;
            }

            Guid? parentMasterMenuGuid = null;

            // Handle parent master menu GUID
            if (!string.IsNullOrEmpty(masterMenuDto.strParentMenuGUID) && masterMenuDto.strParentMenuGUID.ToLower() != "root")
            {
                if (!Guid.TryParse(masterMenuDto.strParentMenuGUID, out Guid parsedGuid))
                {
                    throw new BusinessException("Invalid parent master menu GUID format");
                }

                parentMasterMenuGuid = parsedGuid;
                var parentMasterMenu = await _context.MstMasterMenus.FindAsync(parsedGuid);
                if (parentMasterMenu == null)
                {
                    throw new BusinessException("Parent master menu not found");
                }

                // Prevent circular reference
                if (parentMasterMenuGuid == guid)
                {
                    throw new BusinessException("A master menu cannot be its own parent");
                }
            }

            // Check for duplicate name within same parent and same module (excluding current menu)
            if (await _context.MstMasterMenus.AnyAsync(m => 
                m.strMasterMenuGUID != guid &&
                m.strParentMenuGUID == parentMasterMenuGuid && 
                m.strName == masterMenuDto.strName &&
                m.strModuleGUID == moduleGuid))
            {
                throw new BusinessException("Master menu name already exists under the same parent menu");
            }

            // Check for duplicate path in entire table (excluding current menu)
            if (await _context.MstMasterMenus.AnyAsync(m => 
                m.strMasterMenuGUID != guid &&
                m.strPath == masterMenuDto.strPath))
            {
                throw new BusinessException("Master menu path already exists");
            }

            // Check for duplicate map key (excluding current menu)
            if (await _context.MstMasterMenus.AnyAsync(m => 
                m.strMasterMenuGUID != guid &&
                m.strMapKey == masterMenuDto.strMapKey))
            {
                throw new BusinessException("Master menu map key already exists");
            }

            // Update properties
            // Parse page template GUID if provided
            Guid? pageTemplateGuid = null;
            if (!string.IsNullOrEmpty(masterMenuDto.strPageTemplateGUID))
            {
                if (Guid.TryParse(masterMenuDto.strPageTemplateGUID, out Guid parsedTemplateGuid))
                {
                    pageTemplateGuid = parsedTemplateGuid;
                }
                else
                {
                    throw new BusinessException("Invalid page template GUID format");
                }
            }

            existingMasterMenu.strParentMenuGUID = parentMasterMenuGuid;
            existingMasterMenu.strModuleGUID = moduleGuid;
            existingMasterMenu.dblSeqNo = masterMenuDto.dblSeqNo;
            existingMasterMenu.strName = masterMenuDto.strName;
            existingMasterMenu.strPath = masterMenuDto.strPath;
            existingMasterMenu.strMenuPosition = masterMenuDto.strMenuPosition;
            existingMasterMenu.strMapKey = masterMenuDto.strMapKey;
            existingMasterMenu.bolHasSubMenu = masterMenuDto.bolHasSubMenu;
            existingMasterMenu.strIconName = masterMenuDto.strIconName;
            existingMasterMenu.bolIsActive = masterMenuDto.bolIsActive;
            existingMasterMenu.bolSuperAdminAccess = masterMenuDto.bolSuperAdminAccess;
            existingMasterMenu.strCategory = masterMenuDto.strCategory;
            existingMasterMenu.strPageTemplateGUID = pageTemplateGuid;
            existingMasterMenu.bolIsSingleMenu = masterMenuDto.bolIsSingleMenu;

            await _context.SaveChangesAsync();

            return _mapper.Map<MasterMenuResponseDto>(existingMasterMenu);
        }

        public async Task<bool> DeleteMasterMenuAsync(Guid guid)
        {
            var masterMenu = await _context.MstMasterMenus.FindAsync(guid);
            if (masterMenu == null)
            {
                return false;
            }

            _context.MstMasterMenus.Remove(masterMenu);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResponse<MasterMenuResponseDto>> GetAllMasterMenusAsync(MasterMenuFilterDto filterDto)
        {
            var query = _context.MstMasterMenus
                .Include(m => m.ParentMasterMenu)
                .AsQueryable();

            // Apply status filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(m => m.bolIsActive == filterDto.bolIsActive.Value);
            }

            // Apply super admin filter if provided
            if (filterDto.bolIsSuperadmin.HasValue)
            {
                query = query.Where(m => m.bolSuperAdminAccess == filterDto.bolIsSuperadmin.Value);
            }

            // Apply parent menu GUID filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strParentMenuGUID))
            {
                // Handle comma-separated values
                var parentGuids = filterDto.strParentMenuGUID.Split(',')
                    .Select(g => g.Trim())
                    .Where(g => !string.IsNullOrEmpty(g))
                    .ToList();

                if (parentGuids.Any())
                {
                    var guidList = new List<Guid>();
                    foreach (var guidStr in parentGuids)
                    {
                        if (Guid.TryParse(guidStr, out Guid parsedGuid))
                        {
                            guidList.Add(parsedGuid);
                        }
                    }

                    if (guidList.Any())
                    {
                        query = query.Where(m => m.strParentMenuGUID.HasValue && guidList.Contains(m.strParentMenuGUID.Value));
                    }
                }
            }

            // Apply menu position filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strPosition))
            {
                // Handle comma-separated values
                var positions = filterDto.strPosition.Split(',')
                    .Select(p => p.Trim())
                    .Where(p => !string.IsNullOrEmpty(p))
                    .ToList();

                if (positions.Any())
                {
                    query = query.Where(m => positions.Contains(m.strMenuPosition));
                }
            }

            // Apply category filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strCategory))
            {
                // Handle comma-separated values
                var categories = filterDto.strCategory.Split(',')
                    .Select(c => c.Trim())
                    .Where(c => !string.IsNullOrEmpty(c))
                    .ToList();

                if (categories.Any())
                {
                    query = query.Where(m => m.strCategory != null && categories.Contains(m.strCategory));
                }
            }

            // Apply page template GUID filter if provided
            if (!string.IsNullOrWhiteSpace(filterDto.strPageTemplateGUID))
            {
                // Handle comma-separated values
                var templateGuids = filterDto.strPageTemplateGUID.Split(',')
                    .Select(g => g.Trim())
                    .Where(g => !string.IsNullOrEmpty(g))
                    .ToList();

                if (templateGuids.Any())
                {
                    var guidList = new List<Guid>();
                    foreach (var guidStr in templateGuids)
                    {
                        if (Guid.TryParse(guidStr, out Guid parsedGuid))
                        {
                            guidList.Add(parsedGuid);
                        }
                    }

                    if (guidList.Any())
                    {
                        query = query.Where(m => m.strPageTemplateGUID.HasValue && guidList.Contains(m.strPageTemplateGUID.Value));
                    }
                }
            }

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchTerm = filterDto.Search.Trim().ToLower();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active menus
                    query = query.Where(m => m.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive menus
                    query = query.Where(m => m.bolIsActive == false);
                }
                else
                {
                    var isNumericSearch = double.TryParse(filterDto.Search, out var numericSearchValue);
                    
                    query = query.Where(m => 
                        m.strName.ToLower().Contains(searchTerm) ||
                        m.strPath.ToLower().Contains(searchTerm) ||
                        m.strMapKey.ToLower().Contains(searchTerm) ||
                        m.strMenuPosition.ToLower().Contains(searchTerm) ||
                        (m.strIconName != null && m.strIconName.ToLower().Contains(searchTerm)) ||
                        (m.ParentMasterMenu != null && m.ParentMasterMenu.strName.ToLower().Contains(searchTerm)) ||
                        (isNumericSearch && m.dblSeqNo == numericSearchValue));
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                var sortExpression = filterDto.SortBy;
                if (filterDto.SortBy == "strParentMasterMenuName")
                {
                    sortExpression = "strName"; // Fallback to name since ParentMasterMenu is temporarily disabled
                }
                
                // Apply sorting with explicit type handling
                query = sortExpression switch
                {
                    "dblSeqNo" => filterDto.ascending 
                        ? query.OrderBy(m => m.dblSeqNo)
                        : query.OrderByDescending(m => m.dblSeqNo),
                    "strName" => filterDto.ascending 
                        ? query.OrderBy(m => m.strName)
                        : query.OrderByDescending(m => m.strName),
                    "strPath" => filterDto.ascending 
                        ? query.OrderBy(m => m.strPath)
                        : query.OrderByDescending(m => m.strPath),
                                        "ParentMasterMenu.strName" => filterDto.ascending
                        ? query.OrderBy(m => m.strName)
                        : query.OrderByDescending(m => m.strName),
                    _ => query.OrderBy(m => m.dblSeqNo) // Default sorting
                };
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination and include PageTemplate
            var masterMenus = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            // Map to DTOs
            var masterMenuDtos = _mapper.Map<List<MasterMenuResponseDto>>(masterMenus);

            // Fetch page template names
            var pageTemplateGuids = masterMenus
                .Where(m => m.strPageTemplateGUID.HasValue)
                .Select(m => m.strPageTemplateGUID!.Value)  // Using null-forgiving operator since we've checked with HasValue
                .Distinct()
                .ToList();

            if (pageTemplateGuids.Any())
            {
                var pageTemplates = await _context.MstPageTemplates
                    .Where(pt => pageTemplateGuids.Contains(pt.strPageTemplateGUID))
                    .ToDictionaryAsync(pt => pt.strPageTemplateGUID, pt => pt.strPageTemplateName);

                // Set page template names in the DTOs
                foreach (var dto in masterMenuDtos)
                {
                    if (!string.IsNullOrEmpty(dto.strPageTemplateGUID) &&
                        Guid.TryParse(dto.strPageTemplateGUID, out Guid pageTemplateGuid) &&
                        pageTemplates.ContainsKey(pageTemplateGuid))
                    {
                        dto.strPageTemplateName = pageTemplates[pageTemplateGuid];
                    }
                }
            }

            return new PagedResponse<MasterMenuResponseDto>
            {
                Items = masterMenuDtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / filterDto.PageSize)
            };
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportMasterMenusAsync(string format)
        {
            var masterMenus = await _context.MstMasterMenus
                .Include(m => m.ParentMasterMenu)
                .OrderBy(m => m.dblSeqNo)
                .ToListAsync();

            if (format.ToLower() == "excel")
            {
                return await ExportToExcelAsync(masterMenus);
            }
            else if (format.ToLower() == "csv")
            {
                return await ExportToCsvAsync(masterMenus);
            }
            else
            {
                throw new BusinessException("Unsupported export format. Supported formats are 'excel' and 'csv'.");
            }
        }

        private async Task<(byte[] FileContents, string ContentType, string FileName)> ExportToExcelAsync(List<MstMasterMenu> masterMenus)
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Master Menus");

            // Add headers
            worksheet.Cell("A1").Value = "Name";
            worksheet.Cell("B1").Value = "Path";
            worksheet.Cell("C1").Value = "Menu Position";
            worksheet.Cell("D1").Value = "Map Key";
            worksheet.Cell("E1").Value = "Sequence No";
            worksheet.Cell("F1").Value = "Has Sub Menu";
            worksheet.Cell("G1").Value = "Icon Name";
            worksheet.Cell("H1").Value = "Is Active";
            worksheet.Cell("I1").Value = "Super Admin Access";
            worksheet.Cell("J1").Value = "Category";
            worksheet.Cell("K1").Value = "Page Template GUID";
            worksheet.Cell("L1").Value = "Module GUID";
            worksheet.Cell("M1").Value = "Parent Menu";
            worksheet.Cell("N1").Value = "Is Single Menu";

            // Style headers
            var headerRange = worksheet.Range("A1:N1");
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.LightGray;

            // Add data
            for (int i = 0; i < masterMenus.Count; i++)
            {
                var row = i + 2;
                var masterMenu = masterMenus[i];

                worksheet.Cell($"A{row}").Value = masterMenu.strName;
                worksheet.Cell($"B{row}").Value = masterMenu.strPath;
                worksheet.Cell($"C{row}").Value = masterMenu.strMenuPosition;
                worksheet.Cell($"D{row}").Value = masterMenu.strMapKey;
                worksheet.Cell($"E{row}").Value = masterMenu.dblSeqNo;
                worksheet.Cell($"F{row}").Value = masterMenu.bolHasSubMenu ? "Yes" : "No";
                worksheet.Cell($"G{row}").Value = masterMenu.strIconName ?? "";
                worksheet.Cell($"H{row}").Value = masterMenu.bolIsActive ? "Yes" : "No";
                worksheet.Cell($"I{row}").Value = masterMenu.bolSuperAdminAccess ? "Yes" : "No";
                worksheet.Cell($"J{row}").Value = masterMenu.strCategory ?? "";
                worksheet.Cell($"K{row}").Value = masterMenu.strPageTemplateGUID.HasValue ? masterMenu.strPageTemplateGUID.ToString() : "";
                worksheet.Cell($"L{row}").Value = masterMenu.strModuleGUID.HasValue ? masterMenu.strModuleGUID.ToString() : "";
                worksheet.Cell($"M{row}").Value = masterMenu.ParentMasterMenu?.strName ?? "";
                worksheet.Cell($"N{row}").Value = masterMenu.bolIsSingleMenu ? "Yes" : "No";
            }

            // Auto-fit columns
            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            var fileName = $"MasterMenus_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
            return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        private async Task<(byte[] FileContents, string ContentType, string FileName)> ExportToCsvAsync(List<MstMasterMenu> masterMenus)
        {
            var csv = new StringBuilder();

            // Add headers
            csv.AppendLine("Name,Path,Menu Position,Map Key,Sequence No,Has Sub Menu,Icon Name,Is Active,Super Admin Access,Category,Page Template GUID,Module GUID,Parent Menu,Is Single Menu");

            // Add data
            foreach (var masterMenu in masterMenus)
            {
                var line = string.Join(",",
                    $"\"{masterMenu.strName}\"",
                    $"\"{masterMenu.strPath}\"",
                    $"\"{masterMenu.strMenuPosition}\"",
                    $"\"{masterMenu.strMapKey}\"",
                    masterMenu.dblSeqNo.ToString(),
                    $"\"{(masterMenu.bolHasSubMenu ? "Yes" : "No")}\"",
                    $"\"{masterMenu.strIconName ?? ""}\"",
                    $"\"{(masterMenu.bolIsActive ? "Yes" : "No")}\"",
                    $"\"{(masterMenu.bolSuperAdminAccess ? "Yes" : "No")}\"",
                    $"\"{masterMenu.strCategory ?? ""}\"",
                    $"\"{(masterMenu.strPageTemplateGUID.HasValue ? masterMenu.strPageTemplateGUID.ToString() : "")}\"",
                    $"\"{(masterMenu.strModuleGUID.HasValue ? masterMenu.strModuleGUID.ToString() : "")}\"",
                    $"\"{masterMenu.ParentMasterMenu?.strName ?? ""}\"",
                    $"\"{(masterMenu.bolIsSingleMenu ? "Yes" : "No")}\""
                );
                csv.AppendLine(line);
            }

            var fileName = $"MasterMenus_{DateTime.Now:yyyyMMdd_HHmmss}.csv";
            return (Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", fileName);
        }
    }
}
