using AutoMapper;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using AuditSoftware.DTOs.Menu;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using System.Linq.Dynamic.Core;
using System.Text;
using System.IO;
using ClosedXML.Excel;
using System.Collections.Generic;

namespace AuditSoftware.Services
{
    public class MenuService :  ServiceBase, IMenuService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MenuService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<MenuResponseDto> CreateMenuAsync(MenuCreateDto menuDto)
        {
            Guid? parentMenuGuid = null;

            // Handle parent menu GUID
            if (!string.IsNullOrEmpty(menuDto.strParentMenuGUID) && menuDto.strParentMenuGUID.ToLower() != "root")
            {
                if (!Guid.TryParse(menuDto.strParentMenuGUID, out Guid parsedGuid))
                {
                    throw new BusinessException("Invalid parent menu GUID format");
                }

                parentMenuGuid = parsedGuid;
                var parentMenu = await _context.MstMenus.FindAsync(parsedGuid);
                if (parentMenu == null)
                {
                    throw new BusinessException("Parent menu not found");
                }
            }

            // Check for duplicate name within same parent
            if (await _context.MstMenus.AnyAsync(m => 
                m.strParentMenuGUID == parentMenuGuid && 
                m.strName == menuDto.strName))
            {
                throw new BusinessException("Menu name already exists under the same parent menu");
            }

            // Check for duplicate path in entire table
            if (await _context.MstMenus.AnyAsync(m => m.strPath == menuDto.strPath))
            {
                throw new BusinessException("Menu path already exists");
            }

            // Check for duplicate map key
            if (await _context.MstMenus.AnyAsync(m => m.strMapKey == menuDto.strMapKey))
            {
                throw new BusinessException("Menu map key already exists");
            }

            // Parse group GUID if provided
            Guid? groupGuid = null;
            if (!string.IsNullOrEmpty(menuDto.strGroupGUID))
            {
                if (!Guid.TryParse(menuDto.strGroupGUID, out Guid parsedGroupGuid))
                {
                    throw new BusinessException("Invalid group GUID format");
                }
                
                // Check if group exists
                if (!await _context.MstGroups.AnyAsync(g => g.strGroupGUID == parsedGroupGuid))
                {
                    throw new BusinessException("Group not found");
                }
                
                groupGuid = parsedGroupGuid;
            }
            
            // Parse module GUID if provided
            Guid? moduleGuid = null;
            if (!string.IsNullOrEmpty(menuDto.strModuleGUID))
            {
                if (!Guid.TryParse(menuDto.strModuleGUID, out Guid parsedModuleGuid))
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
            
            // Parse page template GUID if provided
            Guid? pageTemplateGuid = null;
            if (!string.IsNullOrEmpty(menuDto.strPageTemplateGUID))
            {
                if (!Guid.TryParse(menuDto.strPageTemplateGUID, out Guid parsedTemplateGuid))
                {
                    throw new BusinessException("Invalid page template GUID format");
                }
                
                // Check if page template exists
                if (!await _context.MstPageTemplates.AnyAsync(pt => pt.strPageTemplateGUID == parsedTemplateGuid))
                {
                    throw new BusinessException("Page template not found");
                }
                
                pageTemplateGuid = parsedTemplateGuid;
            }
            
            var menu = new MstMenu
            {
                strMenuGUID = Guid.NewGuid(),
                strParentMenuGUID = parentMenuGuid,
                dblSeqNo = menuDto.dblSeqNo,
                strName = menuDto.strName,
                strPath = menuDto.strPath,
                strMenuPosition = menuDto.strMenuPosition,
                strMapKey = menuDto.strMapKey,
                bolHasSubMenu = menuDto.bolHasSubMenu,
                strIconName = menuDto.strIconName,
                bolIsActive = menuDto.bolIsActive,
                bolSuperAdminAccess = menuDto.bolSuperAdminAccess,
                strCategory = menuDto.strCategory,
                strPageTemplateGUID = pageTemplateGuid,
                strGroupGUID = groupGuid,
                strModuleGUID = moduleGuid
            };

            _context.MstMenus.Add(menu);
            await _context.SaveChangesAsync();

            return _mapper.Map<MenuResponseDto>(menu);
        }

        public async Task<MenuResponseDto> GetMenuByIdAsync(Guid guid)
        {
            var menu = await _context.MstMenus
                .Include(m => m.ParentMenu)
                .FirstOrDefaultAsync(m => m.strMenuGUID == guid);

            if (menu == null)
            {
                throw new BusinessException("Menu not found");
            }

            return _mapper.Map<MenuResponseDto>(menu);
        }

        public async Task<MenuResponseDto> UpdateMenuAsync(Guid guid, MenuCreateDto menuDto)
        {
            var menu = await _context.MstMenus.FindAsync(guid);
            if (menu == null)
            {
                throw new BusinessException("Menu not found");
            }

            Guid? parentMenuGuid = null;

            // Handle parent menu GUID
            if (!string.IsNullOrEmpty(menuDto.strParentMenuGUID) && menuDto.strParentMenuGUID.ToLower() != "root")
            {
                if (!Guid.TryParse(menuDto.strParentMenuGUID, out Guid parsedGuid))
                {
                    throw new BusinessException("Invalid parent menu GUID format");
                }

                if (parsedGuid == guid)
                {
                    throw new BusinessException("Menu cannot be its own parent");
                }

                parentMenuGuid = parsedGuid;
                var parentMenu = await _context.MstMenus.FindAsync(parsedGuid);
                if (parentMenu == null)
                {
                    throw new BusinessException("Parent menu not found");
                }
            }

            // Check for duplicate name within same parent (excluding current menu)
            if (await _context.MstMenus.AnyAsync(m => 
                m.strParentMenuGUID == parentMenuGuid && 
                m.strName == menuDto.strName &&
                m.strMenuGUID != guid))
            {
                throw new BusinessException("Menu name already exists under the same parent menu");
            }

            // Check for duplicate path in entire table (excluding current menu)
            if (await _context.MstMenus.AnyAsync(m => 
                m.strPath == menuDto.strPath && 
                m.strMenuGUID != guid))
            {
                throw new BusinessException("Menu path already exists");
            }

            // Check for duplicate map key (excluding current menu)
            if (await _context.MstMenus.AnyAsync(m => 
                m.strMapKey == menuDto.strMapKey && 
                m.strMenuGUID != guid))
            {
                throw new BusinessException("Menu map key already exists");
            }

            // Parse group GUID if provided
            Guid? groupGuid = null;
            if (!string.IsNullOrEmpty(menuDto.strGroupGUID))
            {
                if (!Guid.TryParse(menuDto.strGroupGUID, out Guid parsedGroupGuid))
                {
                    throw new BusinessException("Invalid group GUID format");
                }
                
                // Check if group exists
                if (!await _context.MstGroups.AnyAsync(g => g.strGroupGUID == parsedGroupGuid))
                {
                    throw new BusinessException("Group not found");
                }
                
                groupGuid = parsedGroupGuid;
            }
            
            // Parse module GUID if provided
            Guid? moduleGuid = null;
            if (!string.IsNullOrEmpty(menuDto.strModuleGUID))
            {
                if (!Guid.TryParse(menuDto.strModuleGUID, out Guid parsedModuleGuid))
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
            
            // Parse page template GUID if provided
            Guid? pageTemplateGuid = null;
            if (!string.IsNullOrEmpty(menuDto.strPageTemplateGUID))
            {
                if (!Guid.TryParse(menuDto.strPageTemplateGUID, out Guid parsedTemplateGuid))
                {
                    throw new BusinessException("Invalid page template GUID format");
                }
                
                // Check if page template exists
                if (!await _context.MstPageTemplates.AnyAsync(pt => pt.strPageTemplateGUID == parsedTemplateGuid))
                {
                    throw new BusinessException("Page template not found");
                }
                
                pageTemplateGuid = parsedTemplateGuid;
            }

            menu.strParentMenuGUID = parentMenuGuid;
            menu.dblSeqNo = menuDto.dblSeqNo;
            menu.strName = menuDto.strName;
            menu.strPath = menuDto.strPath;
            menu.strMenuPosition = menuDto.strMenuPosition;
            menu.strMapKey = menuDto.strMapKey;
            menu.bolHasSubMenu = menuDto.bolHasSubMenu;
            menu.strIconName = menuDto.strIconName;
            menu.bolIsActive = menuDto.bolIsActive;
            menu.bolSuperAdminAccess = menuDto.bolSuperAdminAccess;
            menu.strCategory = menuDto.strCategory;
            menu.strPageTemplateGUID = pageTemplateGuid;
            menu.strGroupGUID = groupGuid;
            menu.strModuleGUID = moduleGuid;

            await _context.SaveChangesAsync();

            return _mapper.Map<MenuResponseDto>(menu);
        }

        public async Task<bool> DeleteMenuAsync(Guid guid)
        {
            var menu = await _context.MstMenus
                .FirstOrDefaultAsync(m => m.strMenuGUID == guid);

            if (menu == null)
            {
                throw new BusinessException("Menu not found");
            }

            // Update child menus to become root menus
            var childMenus = await _context.MstMenus
                .Where(m => m.strParentMenuGUID == guid)
                .ToListAsync();

            if (childMenus.Any())
            {
                foreach (var childMenu in childMenus)
                {
                    childMenu.strParentMenuGUID = null;
                }
                await _context.SaveChangesAsync();
            }

            // Delete any user rights associated with this menu
            var userRights = await _context.MstUserRights
                .Where(r => r.strMenuGUID == guid)
                .ToListAsync();

            if (userRights.Any())
            {
                _context.MstUserRights.RemoveRange(userRights);
            }

            _context.MstMenus.Remove(menu);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<PagedResponse<MenuResponseDto>> GetAllMenusAsync(MenuFilterDto filterDto)
        {
            var query = _context.MstMenus
                .Include(m => m.ParentMenu)
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var searchLower = filterDto.Search.ToLower().Trim();
                var isActiveSearch = "active".StartsWith(searchLower) || searchLower == "act";
                var isInactiveSearch = "inactive".StartsWith(searchLower) || searchLower == "inact";

                if (isActiveSearch)
                {
                    // Only filter by active status if search indicates active
                    query = query.Where(m => m.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Only filter by inactive status if search indicates inactive
                    query = query.Where(m => m.bolIsActive == false);
                }
                else
                {
                    var isNumericSearch = double.TryParse(filterDto.Search, out var numericSearchValue);

                    query = query.Where(m =>
                        // Core string fields
                        m.strName.ToLower().Contains(searchLower) ||
                        m.strPath.ToLower().Contains(searchLower) ||
                        m.strMapKey.ToLower().Contains(searchLower) ||
                        // Position
                        m.strMenuPosition.ToLower().Contains(searchLower) ||
                        // Icon name (nullable)
                        (m.strIconName != null && m.strIconName.ToLower().Contains(searchLower)) ||
                        // Parent menu name (nullable navigation)
                        (m.ParentMenu != null && m.ParentMenu.strName.ToLower().Contains(searchLower)) ||
                        // Sequence number (numeric search exact match)
                        (isNumericSearch && m.dblSeqNo == numericSearchValue)
                    );
                }
            }

            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                var sortField = filterDto.SortBy.ToLower() switch
                {
                    "name" => "strName",
                    "path" => "strPath",
                    "position" => "strMenuPosition",
                    "mapkey" => "strMapKey",
                    "seqno" => "dblSeqNo",
                    _ => "dblSeqNo"
                };

                var sortOrder = filterDto.ascending ? "ascending" : "descending";
                query = query.OrderBy($"{sortField} {sortOrder}");
            }
            else
            {
                query = filterDto.ascending 
                    ? query.OrderBy(m => m.dblSeqNo)
                    : query.OrderByDescending(m => m.dblSeqNo);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            var dtos = _mapper.Map<List<MenuResponseDto>>(items);

            return new PagedResponse<MenuResponseDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize
            };
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportMenusAsync(string format)
        {
            // Get all menus with parent menu information
            var menus = await _context.MstMenus
                .Include(m => m.ParentMenu)
                .OrderBy(x => x.dblSeqNo)
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
                var worksheet = workbook.Worksheets.Add("Menus");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Name";
                worksheet.Cell(1, 2).Value = "Path";
                worksheet.Cell(1, 3).Value = "Parent Menu";
                worksheet.Cell(1, 4).Value = "Menu Position";
                worksheet.Cell(1, 5).Value = "Sequence No";
                worksheet.Cell(1, 6).Value = "Has Sub Menu";
                worksheet.Cell(1, 7).Value = "Icon Name";
                worksheet.Cell(1, 8).Value = "Map Key";
                worksheet.Cell(1, 9).Value = "Super Admin Access";
                worksheet.Cell(1, 10).Value = "Status";
                worksheet.Cell(1, 11).Value = "Category";
                worksheet.Cell(1, 12).Value = "Page Template GUID";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < menus.Count; i++)
                {
                    var menu = menus[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    worksheet.Cell(row, 1).Value = menu.strName;
                    worksheet.Cell(row, 2).Value = menu.strPath;
                    worksheet.Cell(row, 3).Value = menu.ParentMenu?.strName ?? "Root";
                    worksheet.Cell(row, 4).Value = menu.strMenuPosition;
                    worksheet.Cell(row, 5).Value = menu.dblSeqNo;
                    worksheet.Cell(row, 6).Value = menu.bolHasSubMenu ? "Yes" : "No";
                    worksheet.Cell(row, 7).Value = menu.strIconName ?? "";
                    worksheet.Cell(row, 8).Value = menu.strMapKey;
                    worksheet.Cell(row, 9).Value = menu.bolSuperAdminAccess ? "Yes" : "No";
                    worksheet.Cell(row, 10).Value = menu.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 11).Value = menu.strCategory ?? "";
                    worksheet.Cell(row, 12).Value = menu.strPageTemplateGUID.HasValue ? menu.strPageTemplateGUID.ToString() : "";
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Menus_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Name,Path,Parent Menu,Menu Position,Sequence No,Has Sub Menu,Icon Name,Map Key,Super Admin Access,Status,Category,Page Template GUID");
                
                // Add data rows
                foreach (var menu in menus)
                {
                    csv.AppendLine($"\"{menu.strName.Replace("\"", "\"\"")}\",\"{menu.strPath.Replace("\"", "\"\"")}\",\"{(menu.ParentMenu?.strName ?? "Root").Replace("\"", "\"\"")}\",\"{menu.strMenuPosition.Replace("\"", "\"\"")}\",{menu.dblSeqNo},{(menu.bolHasSubMenu ? "Yes" : "No")},\"{(menu.strIconName ?? "").Replace("\"", "\"\"")}\",\"{menu.strMapKey.Replace("\"", "\"\"")}\",{(menu.bolSuperAdminAccess ? "Yes" : "No")},{(menu.bolIsActive ? "Active" : "Inactive")},\"{(menu.strCategory ?? "").Replace("\"", "\"\"")}\",\"{(menu.strPageTemplateGUID.HasValue ? menu.strPageTemplateGUID.ToString() : "")}\"");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"Menus_{timestamp}.csv");
            }
        }

        public async Task<List<MenuResponseDto>> UpdateBulkMenuRightsAsync(List<DTOs.Menu.MenuRightsBatchDto> menuRightsBatch)
        {
            var updatedMenus = new List<MenuResponseDto>();
            
            // Validate input data first
            if (menuRightsBatch == null || !menuRightsBatch.Any())
            {
                throw new BusinessException("No menu rights data provided.");
            }
            
            // Create an execution strategy for handling retries properly
            var strategy = _context.Database.CreateExecutionStrategy();
            
            await strategy.ExecuteAsync(async () => 
            {
                // Begin a transaction
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        foreach (var menuRightItem in menuRightsBatch)
                        {
                            // Case 1: If menuGUID is null and bolRightGiven is true, create a new menu entry
                            if (menuRightItem.strMenuGUID == null && menuRightItem.bolRightGiven)
                            {
                                // Verify required data for menu creation
                                if (menuRightItem.strMasterMenuGUID == null)
                                {
                                    throw new BusinessException($"Master Menu GUID is required when creating a new menu item for '{menuRightItem.strName}'");
                                }
                                
                                // Create a new menu based on master menu data
                                var newMenu = new MstMenu
                                {
                                    strMenuGUID = Guid.NewGuid(),
                                    strMasterMenuGUID = menuRightItem.strMasterMenuGUID,
                                    strParentMenuGUID = menuRightItem.strParentMenuGUID,
                                    strModuleGUID = menuRightItem.strModuleGUID,
                                    dblSeqNo = menuRightItem.dblSeqNo,
                                    strName = menuRightItem.strName ?? string.Empty, // Ensure non-null value
                                    strPath = menuRightItem.strPath ?? string.Empty, // Ensure non-null value
                                    strMenuPosition = menuRightItem.strMenuPosition ?? string.Empty, // Ensure non-null value
                                    strMapKey = menuRightItem.strMapKey ?? string.Empty, // Ensure non-null value
                                    bolHasSubMenu = menuRightItem.bolHasSubMenu,
                                    strIconName = menuRightItem.strIconName,
                                    bolIsActive = menuRightItem.bolIsActive,
                                    strGroupGUID = menuRightItem.strGroupGUID,
                                    bolSuperAdminAccess = false, // Default value, adjust as needed
                                    strCategory = menuRightItem.strCategory,
                                    strPageTemplateGUID = menuRightItem.strPageTemplateGUID
                                };

                                _context.MstMenus.Add(newMenu);
                                await _context.SaveChangesAsync();
                                
                                // Add the updated menu to result list
                                updatedMenus.Add(_mapper.Map<MenuResponseDto>(newMenu));
                            }
                            // Case 2: If menuGUID is not null and bolRightGiven is false, delete the menu
                            else if (menuRightItem.strMenuGUID != null && !menuRightItem.bolRightGiven)
                            {
                                var menuGuid = menuRightItem.strMenuGUID.Value;
                                var menuToDelete = await _context.MstMenus.FindAsync(menuGuid);
                                
                                if (menuToDelete != null)
                                {
                                    try
                                    {
                                        // Check if there are any user rights associated with this menu
                                        var userRightsToDelete = await _context.MstUserRights
                                            .Where(ur => ur.strMenuGUID == menuToDelete.strMenuGUID)
                                            .ToListAsync();
                                        
                                        if (userRightsToDelete.Any())
                                        {
                                            // Delete associated user rights first
                                            _context.MstUserRights.RemoveRange(userRightsToDelete);
                                            await _context.SaveChangesAsync();
                                        }
                                        
                                        // Check for child menus and fail if they exist (to prevent foreign key violations)
                                        var childMenus = await _context.MstMenus
                                            .Where(m => m.strParentMenuGUID == menuToDelete.strMenuGUID)
                                            .ToListAsync();
                                        
                                        if (childMenus.Any())
                                        {
                                            throw new BusinessException($"Cannot delete menu '{menuToDelete.strName}' because it has {childMenus.Count} child menu(s). Please delete the child menus first.");
                                        }
                                        
                                        // Delete the menu
                                        _context.MstMenus.Remove(menuToDelete);
                                        await _context.SaveChangesAsync();
                                        
                                        // Add the deleted menu info to result list
                                        updatedMenus.Add(_mapper.Map<MenuResponseDto>(menuToDelete));
                                    }
                                    catch (Exception ex)
                                    {
                                        throw new BusinessException($"Failed to delete menu '{menuToDelete.strName}': {ex.Message}");
                                    }
                                }
                            }
                        }
                        
                        // If we made it here without exceptions, commit the transaction
                        await transaction.CommitAsync();
                    }
                    catch (Exception ex)
                    {
                        // If any operation fails, roll back the transaction
                        await transaction.RollbackAsync();
                        
                        // Include inner exception details for debugging
                        if (ex.InnerException != null)
                        {
                            throw new BusinessException($"Failed to update menu rights: {ex.Message}. Inner exception: {ex.InnerException.Message}");
                        }
                        else
                        {
                            throw new BusinessException($"Failed to update menu rights: {ex.Message}");
                        }
                    }
                }
            });
            
            return updatedMenus;
        }
    }
}
