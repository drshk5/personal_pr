using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuditSoftware.DTOs.Menu;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using Microsoft.Extensions.Logging;
using AuditSoftware.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using AuditSoftware.Helpers;
using System.Collections.Generic;
using System;
using AuditSoftware.Models.Entities;

namespace AuditSoftware.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MenuController : BaseDeletionController<Models.Entities.MstMenu>
    {
        private readonly IMenuService _menuService;
        private new readonly ILogger<MenuController> _logger;
        private readonly AppDbContext _context;

        public MenuController(
            IMenuService menuService, 
            ILogger<MenuController> logger,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<Models.Entities.MstMenu>> baseLogger,
            AppDbContext context)
            : base(deleteValidationService, baseLogger)
        {
            _menuService = menuService ?? throw new ArgumentNullException(nameof(menuService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        [HttpGet("{guid}")]
        public async Task<IActionResult> GetMenuById(Guid guid)
        {
            try
            {
                var result = await _menuService.GetMenuByIdAsync(guid);
                if (result == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = $"Menu with GUID {guid} not found"
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Menu retrieved successfully",
                    data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving menu"
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMenu([FromBody] MenuCreateDto menuDto)
        {
            try
            {
                var result = await _menuService.CreateMenuAsync(menuDto);
                return CreatedAtAction(nameof(GetMenuById), new { guid = Guid.Parse(result.strMenuGUID) }, new
                {
                    statusCode = 201,
                    message = "Menu created successfully",
                    data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while creating menu"
                });
            }
        }

        [HttpPut("{guid}")]
        public async Task<IActionResult> UpdateMenu(Guid guid, [FromBody] MenuCreateDto menuDto)
        {
            try
            {
                var result = await _menuService.UpdateMenuAsync(guid, menuDto);
                if (result == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = $"Menu with GUID {guid} not found"
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Menu updated successfully",
                    data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while updating menu"
                });
            }
        }

        [HttpDelete("{guid}")]
        public async Task<IActionResult> DeleteMenu(Guid guid)
        {
            return await SafeDeleteAsync(
                guid,
                "Menu",
                async (id) => await _menuService.DeleteMenuAsync(id));
        }

        [HttpGet]
        public async Task<IActionResult> GetAllMenus(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = "dblSeqNo",
            [FromQuery] bool ascending = true,
            [FromQuery] string? search = null)
        {
            try
            {
                var filter = new MenuFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    ascending = ascending,
                    Search = search
                };

                var result = await _menuService.GetAllMenusAsync(filter);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Menus retrieved successfully",
                    data = new
                    {
                        items = result.Items,
                        totalCount = result.TotalCount,
                        pageNumber = result.PageNumber,
                        pageSize = result.PageSize,
                        totalPages = result.TotalPages,
                        hasPrevious = result.HasPrevious,
                        hasNext = result.HasNext
                    }
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving menus"
                });
            }
        }

        [HttpGet("parent-menu")]
        [Authorize]
        public async Task<IActionResult> GetParentMenus([FromQuery] string menuGUID, [FromQuery] string? search = null)
        {
            try
            {
                if (string.IsNullOrEmpty(menuGUID))
                {
                    _logger.LogWarning("Menu GUID is required but was not provided");
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Menu GUID is required"
                    });
                }

                // Parse menuGUID to a Guid (now required)
                Guid excludeMenuGuid;
                if (!Guid.TryParse(menuGUID, out excludeMenuGuid))
                {
                    _logger.LogWarning("Invalid menuGUID format provided: {MenuGuid}", menuGUID);
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Invalid Menu GUID format"
                    });
                }
                
                _logger.LogInformation(
                    "Parent menus request - Excluding menu GUID: {MenuGuid}",
                    excludeMenuGuid.ToString());
                
                // Get active menus that are not the specified one
                var query = _context.MstMenus.Where(m => 
                    m.bolIsActive == true && 
                    m.strMenuGUID != excludeMenuGuid);
                
                // Apply search filter if provided
                if (!string.IsNullOrWhiteSpace(search))
                {
                    string searchLower = search.ToLower();
                    query = query.Where(m => 
                        m.strName.ToLower().Contains(searchLower) || 
                        (m.strPath != null && m.strPath.ToLower().Contains(searchLower)));
                    
                    _logger.LogInformation("Applying search filter to menu: {SearchTerm}", search);
                }
                
                var menus = await query
                    .Select(m => new
                    {
                        strMenuGUID = m.strMenuGUID.ToString(),
                        strName = m.strName,
                        strPath = m.strPath,
                        strMenuPosition = m.strMenuPosition,
                        dblSeqNo = m.dblSeqNo
                    })
                    .OrderBy(m => m.dblSeqNo)
                    .ToListAsync();

                if (menus == null || !menus.Any())
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "No parent menus found",
                        data = new object[] { }
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Parent menus retrieved successfully",
                    data = menus,
                    totalCount = menus.Count,
                    excludedMenuGUID = excludeMenuGuid.ToString(),
                    searchTerm = search
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving parent menus");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving parent menus",
                    error = ex.Message
                });
            }
        }

        [HttpGet("searchPages")]
        [Authorize]
        public async Task<IActionResult> GetPageMenus([FromQuery] string? search = null)
        {
            try
            {
                _logger.LogInformation("Search pages request initiated. Search term: {SearchTerm}", search ?? "none");
                
                // Step 1: Get user GUID from token and check if user exists
                var userGuid = User?.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(userGuid))
                    return BadRequest(new { statusCode = 400, message = "User identifier not found in token" });

                var user = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == GuidHelper.ToGuid(userGuid));
                if (user == null)
                    return BadRequest(new { statusCode = 400, message = "User not found" });

                // Prepare list to hold menu pages with permissions
                var pageMenus = new List<MenuPageDto>();
                
                // Step 2: For super admins, get from MasterMenu, for regular users use Menu
                if (user.bolIsSuperAdmin)
                {
                    // Get Master Menus for super admin users where bolSuperAdminAccess is true
                    var masterParentGuidsQuery = _context.MstMasterMenus
                        .Where(c => c.strParentMenuGUID != null)
                        .Select(c => c.strParentMenuGUID!.Value);

                    var query = _context.MstMasterMenus.AsNoTracking()
                        .Where(m => m.bolIsActive && 
                               m.bolSuperAdminAccess &&
                               m.bolHasSubMenu == false && 
                               m.strMenuPosition != "hidden" &&
                               !masterParentGuidsQuery.Contains(m.strMasterMenuGUID));

                    // Apply search filter if provided
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        string searchLower = search.ToLower();
                        query = query.Where(m => 
                            m.strName.ToLower().Contains(searchLower) || 
                            (m.strPath != null && m.strPath.ToLower().Contains(searchLower)));
                        
                        _logger.LogInformation("Applying search filter to master page menus: {SearchTerm}", search);
                    }
                    
                    // Get all master menus for super admin with full permissions
                    var menus = await query.OrderBy(m => m.dblSeqNo).ToListAsync();
                    
                    foreach (var menu in menus)
                    {
                        pageMenus.Add(new MenuPageDto
                        {
                            strMenuGUID = menu.strMasterMenuGUID.ToString(),
                            strName = menu.strName,
                            strPath = menu.strPath,
                            strMapKey = menu.strMapKey,
                            strIconName = menu.strIconName ?? string.Empty,
                            dblSeqNo = menu.dblSeqNo,
                            strMenuPosition = menu.strMenuPosition,
                            strParentMenuGUID = menu.strParentMenuGUID?.ToString(),
                            permission = new DTOs.Common.PermissionDto
                            {
                                bolCanView = true,
                                bolCanEdit = true,
                                bolCanDelete = true,
                                bolCanSave = true,
                                bolCanPrint = true,
                                bolCanExport = true
                            }
                        });
                    }
                }
                else
                {
                    // Step 3: For normal users - get organization, year, module, and group from token
                    var organizationGuid = User?.FindFirst("strOrganizationGUID")?.Value;
                    var yearGuid = User?.FindFirst("strYearGUID")?.Value;
                    var moduleGuid = User?.FindFirst("strModuleGUID")?.Value; // Get moduleGuid from token
                    var groupGuid = User?.FindFirst("strGroupGUID")?.Value;   // Get groupGuid from token

                    if (string.IsNullOrEmpty(organizationGuid) || string.IsNullOrEmpty(yearGuid))
                        return BadRequest(new { statusCode = 400, message = "Organization and Year are required" });
                        
                    // Step 4: Get user details and role to apply permissions filtering if needed
                    var userDetails = await _context.MstUserDetails
                        .AsNoTracking()
                        .FirstOrDefaultAsync(ud =>
                            ud.strUserGUID == GuidHelper.ToGuid(userGuid) &&
                            ud.strOrganizationGUID == GuidHelper.ToGuid(organizationGuid) &&
                            ud.strYearGUID == GuidHelper.ToGuid(yearGuid) &&
                            (string.IsNullOrEmpty(moduleGuid) || ud.strModuleGUID == GuidHelper.ToGuid(moduleGuid)) &&
                            (string.IsNullOrEmpty(groupGuid) || ud.strGroupGUID == GuidHelper.ToGuid(groupGuid)));

                    if (userDetails == null)
                        return BadRequest(new { statusCode = 400, message = "User details not found for this organization, year, module and group" });

                    // Get user rights for this role
                    var userRights = await _context.MstUserRights
                        .AsNoTracking()
                        .Where(ur => ur.strUserRoleGUID == userDetails.strUserRoleGUID && ur.bolCanView)
                        .ToListAsync();

                    // Build query for regular menu structure (exclude parents even if bolHasSubMenu is false)
                    var parentMenuGuidsQuery = _context.MstMenus
                        .Where(c => c.strParentMenuGUID != null)
                        .Select(c => c.strParentMenuGUID!.Value);

                    var query = _context.MstMenus.AsNoTracking()
                        .Where(m => m.bolIsActive && 
                               m.bolHasSubMenu == false && 
                               m.strMenuPosition != "hidden" &&
                               !m.bolSuperAdminAccess &&
                               !parentMenuGuidsQuery.Contains(m.strMenuGUID)); // Filter out super admin menus and parent menus
                               
                    // Apply module filter - either match the user's module or be module-independent (null)
                    if (!string.IsNullOrEmpty(moduleGuid))
                    {
                        Guid parsedModuleGuid = Guid.Parse(moduleGuid);
                        query = query.Where(m => m.strModuleGUID == parsedModuleGuid || m.strModuleGUID == null);
                        _logger.LogInformation("Applying module filter to page menus: {ModuleGuid}", moduleGuid);
                    }

                    // Apply search filter if provided
                    if (!string.IsNullOrWhiteSpace(search))
                    {
                        string searchLower = search.ToLower();
                        query = query.Where(m => 
                            m.strName.ToLower().Contains(searchLower) || 
                            (m.strPath != null && m.strPath.ToLower().Contains(searchLower)));
                        
                        _logger.LogInformation("Applying search filter to page menus: {SearchTerm}", search);
                    }
                    
                    // Get all menus matching our criteria
                    var menus = await query.OrderBy(m => m.dblSeqNo).ToListAsync();
                    
                    // Filter and build menu with permissions
                    foreach (var menu in menus)
                    {
                        var rights = userRights.FirstOrDefault(r => r.strMenuGUID == menu.strMenuGUID);
                        if (rights != null && rights.bolCanView)
                        {
                            pageMenus.Add(new MenuPageDto
                            {
                                strMenuGUID = menu.strMenuGUID.ToString(),
                                strName = menu.strName,
                                strPath = menu.strPath,
                                strMapKey = menu.strMapKey,
                                strIconName = menu.strIconName ?? string.Empty,
                                dblSeqNo = menu.dblSeqNo,
                                strMenuPosition = menu.strMenuPosition,
                                strParentMenuGUID = menu.strParentMenuGUID?.ToString(),
                                permission = new DTOs.Common.PermissionDto
                                {
                                    bolCanView = rights.bolCanView,
                                    bolCanEdit = rights.bolCanEdit,
                                    bolCanDelete = rights.bolCanDelete,
                                    bolCanSave = rights.bolCanSave,
                                    bolCanPrint = rights.bolCanPrint,
                                    bolCanExport = rights.bolCanExport
                                }
                            });
                        }
                    }
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Page menus retrieved successfully",
                    data = pageMenus,
                    totalCount = pageMenus.Count,
                    searchTerm = search
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving page menus");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving page menus",
                    error = ex.Message
                });
            }
        }

        [HttpGet("export")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ExportMenus([FromQuery] string format)
        {
            try
            {
                if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
                {
                    return BadRequest(new ApiResponse<object> 
                    { 
                        statusCode = 400, 
                        Message = "Invalid format specified. Supported formats are 'excel' and 'csv'."
                    });
                }

                var (fileContents, contentType, fileName) = await _menuService.ExportMenusAsync(format);

                // Set appropriate headers for file download
                Response.Headers.Append("Content-Disposition", $"attachment; filename={fileName}");
                
                // Return the file
                return File(fileContents, contentType, fileName);
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object> { statusCode = 400, Message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the exception
                _logger.LogError(ex, "Error occurred during menu export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }

        /// <summary>
        /// Bulk update menu rights for a group
        /// </summary>
        /// <summary>
        /// Bulk update menu rights with optional user details creation
        /// </summary>
        /// <param name="request">The bulk menu rights update request</param>
        /// <param name="moduleGuid">The module GUID for UserDetails creation (from query string)</param>
        /// <param name="groupGuid">The group GUID for UserDetails creation (from query string)</param>
        /// <remarks>
        /// Example URL: POST /api/Menu/bulkRights?moduleGuid=00000000-0000-0000-0000-000000000000&amp;groupGuid=00000000-0000-0000-0000-000000000000
        /// </remarks>
        /// <returns>Result of the bulk update operation</returns>
        [HttpPost("bulkRights")]
        public async Task<IActionResult> BulkUpdateMenuRights([FromBody] MenuBulkRightsDto request, [FromQuery] string? moduleGuid = null, [FromQuery] string? groupGuid = null)
        {
            try
            {
                // Log the raw request with more details
                _logger.LogInformation("Received bulk rights update request");
                
                if (request == null || request.Items == null)
                {
                    _logger.LogWarning("Request body or items array is null");
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Request body cannot be null"
                    });
                }
                
                // Validate that we have items to process
                if (request.Items.Count == 0)
                {
                    _logger.LogWarning("Request contains an empty items array");
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "No menu items provided in the request"
                    });
                }
                
                // Validate required fields in each menu item
                foreach (var item in request.Items)
                {
                    if (item.strMasterMenuGUID == Guid.Empty)
                    {
                        return BadRequest(new
                        {
                            statusCode = 400,
                            message = "One or more menu items have an empty Master Menu GUID"
                        });
                    }
                    
                    if (item.strGroupGUID == Guid.Empty)
                    {
                        return BadRequest(new
                        {
                            statusCode = 400,
                            message = "One or more menu items have an empty Group GUID"
                        });
                    }
                }
                
                // Check if all required tables exist and are accessible
                try 
                {
                    bool tablesExist = await _context.MstMenus.AnyAsync() || true; // Just to check table access
                    bool userRightsTableAccess = await _context.MstUserRights.AnyAsync() || true; // Check user rights table access
                    bool userRolesTableAccess = await _context.MstUserRoles.AnyAsync() || true; // Check user roles table access
                    
                    _logger.LogInformation($"Database tables check: MstMenus={tablesExist}, MstUserRights={userRightsTableAccess}, MstUserRoles={userRolesTableAccess}");
                }
                catch (Exception dbCheckEx)
                {
                    _logger.LogError(dbCheckEx, "Error accessing database tables: {Message}", dbCheckEx.Message);
                    return StatusCode(500, new
                    {
                        statusCode = 500,
                        message = "Database access error: " + dbCheckEx.Message
                    });
                }

                // Validate moduleGUID if provided
                if (!string.IsNullOrEmpty(moduleGuid))
                {
                    _logger.LogInformation($"Validating module GUID: {moduleGuid}");
                    try
                    {
                        // Parse string to Guid for comparison
                        if (Guid.TryParse(moduleGuid, out Guid parsedModuleGuid))
                        {
                            var moduleExists = await _context.MstModules.AnyAsync(m => m.strModuleGUID == parsedModuleGuid);
                            if (!moduleExists)
                            {
                                _logger.LogWarning($"Module with GUID {moduleGuid} does not exist");
                                return BadRequest(new
                                {
                                    statusCode = 400,
                                    message = $"Module with GUID {moduleGuid} does not exist"
                                });
                            }
                        }
                        else
                        {
                            _logger.LogWarning($"Invalid module GUID format: {moduleGuid}");
                            return BadRequest(new
                            {
                                statusCode = 400,
                                message = $"Invalid module GUID format: {moduleGuid}"
                            });
                        }
                        _logger.LogInformation($"Module with GUID {moduleGuid} validated successfully");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error validating module GUID: {Message}", ex.Message);
                    }
                }

                // Validate groupGUID if provided
                if (!string.IsNullOrEmpty(groupGuid))
                {
                    _logger.LogInformation($"Validating group GUID: {groupGuid}");
                    try
                    {
                        // Parse string to Guid for comparison
                        if (Guid.TryParse(groupGuid, out Guid parsedGroupGuid))
                        {
                            var groupExists = await _context.MstGroups.AnyAsync(g => g.strGroupGUID == parsedGroupGuid);
                            if (!groupExists)
                            {
                                _logger.LogWarning($"Group with GUID {groupGuid} does not exist");
                                return BadRequest(new
                                {
                                    statusCode = 400,
                                    message = $"Group with GUID {groupGuid} does not exist"
                                });
                            }
                        }
                        else
                        {
                            _logger.LogWarning($"Invalid group GUID format: {groupGuid}");
                            return BadRequest(new
                            {
                                statusCode = 400,
                                message = $"Invalid group GUID format: {groupGuid}"
                            });
                        }
                        _logger.LogInformation($"Group with GUID {groupGuid} validated successfully");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error validating group GUID: {Message}", ex.Message);
                    }
                }

                _logger.LogInformation($"Processing bulk menu rights update with {request.Items.Count} items");
                
                // Clear any existing mappings
                _masterMenuToMenuGuidMap.Clear();
                
                // First pass: Pre-process to identify parent-child relationships
                foreach (var item in request.Items)
                {
                    _logger.LogInformation($"Pre-processing item with master menu GUID {item.strMasterMenuGUID}");
                    PreProcessParentChildRelationships(item);
                }
                
                // Log the identified parent-child relationships
                foreach (var mapping in _masterMenuToMenuGuidMap)
                {
                    _logger.LogInformation($"Parent mapping found: {mapping.Key} -> {mapping.Value}");
                }
                
                // Use the execution strategy provided by EF Core for proper retry handling
                var strategy = _context.Database.CreateExecutionStrategy();
                
                _logger.LogInformation("Starting execution strategy for bulk menu rights update");
                
                await strategy.ExecuteAsync(async () =>
                {
                    // Start transaction with explicit isolation level to ensure all operations succeed or fail together
                    using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
                    _logger.LogInformation("Transaction started with ReadCommitted isolation level");
                    
                    try
                    {
                        _logger.LogInformation("Transaction started for bulk menu rights update");
                        
                        // Module GUID is already passed as a parameter
                        _logger.LogInformation($"Using module GUID: {moduleGuid ?? "null"} for user details creation");
                        
                        // First pass: Process parent menus (just create/update menus without user rights)
                        foreach (var item in request.Items)
                        {
                            // Only process parent items first (those without a parent or with a parent that's not in our request)
                            if (item.strParentMenuGUID == null || !request.Items.Any(i => i.strMasterMenuGUID == item.strParentMenuGUID))
                            {
                                if (item.bolRightGiven)
                                {
                                    _logger.LogInformation($"Processing parent menu item: {item.strMasterMenuGUID}");
                                    await ProcessMenuItemWithoutRights(item);
                                }
                            }
                        }
                        
                        // Second pass: Process child menus, now that parents are created
                        foreach (var item in request.Items)
                        {
                            // Process items with parents
                            if (item.strParentMenuGUID != null && request.Items.Any(i => i.strMasterMenuGUID == item.strParentMenuGUID))
                            {
                                if (item.bolRightGiven)
                                {
                                    // Update parent menu GUID if available
                                    Guid parentMasterMenuGuid = item.strParentMenuGUID.Value;
                                    if (_masterMenuToMenuGuidMap.TryGetValue(parentMasterMenuGuid, out Guid parentMenuGuid))
                                    {
                                        _logger.LogInformation($"Setting parent menu GUID for {item.strMasterMenuGUID} to {parentMenuGuid}");
                                        item.strParentMenuGUID = parentMenuGuid;
                                    }
                                    
                                    await ProcessMenuItemWithoutRights(item);
                                }
                            }
                        }
                        
                        // Third pass: Process deletions
                        foreach (var item in request.Items)
                        {
                            if (!item.bolRightGiven && item.strMenuGUID.HasValue)
                            {
                                _logger.LogInformation($"Processing deletion for menu item: {item.strMenuGUID}");
                                await ProcessMenuItemDeletion(item.strMenuGUID.Value);
                            }
                        }
                        _logger.LogInformation("All menu operations completed successfully");
                        
                        // Fourth pass: Create user rights for menus matching specific conditions
                        if (!string.IsNullOrEmpty(moduleGuid) && !string.IsNullOrEmpty(groupGuid))
                        {
                            _logger.LogInformation($"Creating user rights for menus with specified conditions");
                            await CreateUserRightsForMenus(moduleGuid, groupGuid);
                        }
                        
                        // Process UserDetails creation if both moduleGuid and groupGuid are provided
                        if (!string.IsNullOrEmpty(moduleGuid) && !string.IsNullOrEmpty(groupGuid))
                        {
                            _logger.LogInformation($"Creating UserDetails for module {moduleGuid} and group {groupGuid}");
                            await CreateUserDetailsEntry(moduleGuid, groupGuid);
                        }
                        else
                        {
                            _logger.LogInformation("Skipping UserDetails creation as either moduleGuid or groupGuid is missing");
                        }
                        
                        _logger.LogInformation("Committing transaction");
                        // Commit the transaction if all operations succeeded
                        await transaction.CommitAsync();
                        
                        _logger.LogInformation("Successfully committed all menu rights changes");
                    }
                    catch (Exception ex)
                    {
                        // Roll back the transaction if any operation failed
                        await transaction.RollbackAsync();
                        _logger.LogError(ex, "Error during bulk menu rights update transaction: {Message}, {StackTrace}", ex.Message, ex.StackTrace);
                        
                        // Check for inner exception
                        if (ex.InnerException != null)
                        {
                            _logger.LogError("Inner exception: {Message}, {StackTrace}", ex.InnerException.Message, ex.InnerException.StackTrace);
                        }
                        throw;
                    }
                });
                
                // Let's collect some summary statistics
                int totalMenusCount = 0;
                int totalUserRightsCount = 0;
                
                try 
                {
                    totalMenusCount = await _context.MstMenus.CountAsync();
                    totalUserRightsCount = await _context.MstUserRights.CountAsync();
                }
                catch (Exception statEx)
                {
                    _logger.LogWarning(statEx, "Error collecting statistics: {Message}", statEx.Message);
                }
                
                _logger.LogInformation($"OPERATION SUMMARY: Total menus in system: {totalMenusCount}, Total user rights in system: {totalUserRightsCount}");
                
                return Ok(new
                {
                    statusCode = 200,
                    message = "Menu rights updated successfully",
                    statistics = new
                    {
                        totalMenus = totalMenusCount,
                        totalUserRights = totalUserRightsCount
                    }
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning("Business exception in bulk rights update: {Message}", ex.Message);
                return BadRequest(new
                {
                    statusCode = 400,
                    message = ex.Message
                });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error in bulk update: {Message}", dbEx.Message);
                
                string errorMessage = "Database error: ";
                
                if (dbEx.InnerException != null)
                {
                    _logger.LogError("Inner exception: {Message}", dbEx.InnerException.Message);
                    errorMessage += dbEx.InnerException.Message;
                    
                    // Common database errors
                    if (dbEx.InnerException.Message.Contains("FK_") || 
                        dbEx.InnerException.Message.Contains("foreign key"))
                    {
                        errorMessage = "Foreign key constraint violation. Please ensure all referenced entities exist.";
                    }
                    else if (dbEx.InnerException.Message.Contains("IX_") || 
                             dbEx.InnerException.Message.Contains("unique") ||
                             dbEx.InnerException.Message.Contains("duplicate"))
                    {
                        errorMessage = "Menu with the same master menu and group already exists.";
                    }
                }
                else
                {
                    errorMessage += dbEx.Message;
                }
                
                return BadRequest(new
                {
                    statusCode = 400,
                    message = errorMessage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing bulk menu rights update: {Message}, {StackTrace}", ex.Message, ex.StackTrace);
                
                // Check for inner exception
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner exception: {Message}, {StackTrace}", ex.InnerException.Message, ex.InnerException.StackTrace);
                }
                
                var statusCode = ex is BusinessException ? 400 : 500;
                var message = ex is BusinessException ? ex.Message : "An error occurred while processing the bulk menu rights update: " + ex.Message;
                
                return StatusCode(statusCode, new
                {
                    statusCode = statusCode,
                    message = message
                });
            }
        }

        // Store a dictionary of master menu GUIDs to menu GUIDs for parent-child relationship mapping
        private readonly Dictionary<Guid, Guid> _masterMenuToMenuGuidMap = new Dictionary<Guid, Guid>();
        
        /// <summary>
        /// Create user rights for menus matching specified conditions
        /// </summary>
        /// <param name="moduleGuid">Module GUID from query parameter</param>
        /// <param name="groupGuid">Group GUID from query parameter</param>
        /// <returns>A task representing the asynchronous operation</returns>
        private async Task CreateUserRightsForMenus(string moduleGuid, string groupGuid)
        {
            try
            {
                _logger.LogInformation($"Starting bulk user rights creation for moduleGuid={moduleGuid}, groupGuid={groupGuid}");
                
                // Parse GUIDs
                if (!Guid.TryParse(groupGuid, out Guid parsedGroupGuid))
                {
                    _logger.LogError($"Invalid group GUID format: {groupGuid}");
                    throw new BusinessException($"Invalid group GUID format: {groupGuid}");
                }
                
                if (!Guid.TryParse(moduleGuid, out Guid parsedModuleGuid))
                {
                    _logger.LogError($"Invalid module GUID format: {moduleGuid}");
                    throw new BusinessException($"Invalid module GUID format: {moduleGuid}");
                }
                
                // Find menus with the specified conditions
                // 1. Group GUID matches the query parameter
                // 2. Module GUID matches the query parameter OR is NULL
                var menus = await _context.MstMenus
                    .Where(m => m.strGroupGUID == parsedGroupGuid && 
                                (m.strModuleGUID == parsedModuleGuid || m.strModuleGUID == null))
                    .ToListAsync();
                
                _logger.LogInformation($"Found {menus.Count} menus matching the specified conditions");
                
                if (menus.Count == 0)
                {
                    _logger.LogWarning("No menus found matching the conditions");
                    return;
                }
                
                // Find the user role with matching group GUID, module GUID and bolSystemCreated = true
                var userRole = await _context.MstUserRoles
                    .Where(ur => ur.strGroupGUID == parsedGroupGuid && 
                                ur.bolSystemCreated && 
                                ur.strModuleGUID == parsedModuleGuid)
                    .FirstOrDefaultAsync();
                
                if (userRole == null)
                {
                    _logger.LogError($"No role found for group {parsedGroupGuid} and module {parsedModuleGuid}");
                    throw new BusinessException($"No role found for group {parsedGroupGuid} and module {parsedModuleGuid}. Please create a role first.");
                }
                
                _logger.LogInformation($"Found role {userRole.strUserRoleGUID} for group {parsedGroupGuid} and module {parsedModuleGuid}");
                
                // Process each menu
                int createdCount = 0;
                int skippedCount = 0;
                
                foreach (var menu in menus)
                {
                    try
                    {
                        // Check if user rights already exist for this menu and role
                        var existingRights = await _context.MstUserRights
                            .AnyAsync(ur => ur.strUserRoleGUID == userRole.strUserRoleGUID && 
                                          ur.strMenuGUID == menu.strMenuGUID);
                        
                        if (existingRights)
                        {
                            _logger.LogInformation($"User rights already exist for menu {menu.strMenuGUID} and role {userRole.strUserRoleGUID}");
                            skippedCount++;
                            continue; // Skip to next menu
                        }
                        
                        // Create new user rights
                        string userRightGuid = Guid.NewGuid().ToString();
                        
                        var userRights = new MstUserRights
                        {
                            strUserRightGUID = GuidHelper.ToGuid(userRightGuid),
                            strUserRoleGUID = userRole.strUserRoleGUID,
                            strMenuGUID = menu.strMenuGUID,
                            bolCanView = true,      // Default permissions
                            bolCanEdit = true,
                            bolCanSave = true,
                            bolCanDelete = true,
                            bolCanPrint = true,
                            bolCanExport = true,
                            bolCanImport = true,
                            bolCanApprove = true
                        };
                        
                        _context.MstUserRights.Add(userRights);
                        await _context.SaveChangesAsync();
                        createdCount++;
                        
                        _logger.LogInformation($"Created user rights with GUID {userRights.strUserRightGUID} for menu {menu.strMenuGUID}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error creating user rights for menu {menu.strMenuGUID}: {ex.Message}");
                        // Continue with other menus, don't fail the entire operation
                    }
                }
                
                _logger.LogInformation($"User rights creation completed. Created: {createdCount}, Already existed: {skippedCount}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in CreateUserRightsForMenus: {ex.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Process menu item deletion
        /// </summary>
        /// <param name="menuGuid">The menu GUID to delete</param>
        /// <returns>A task representing the asynchronous operation</returns>
        private async Task ProcessMenuItemDeletion(Guid menuGuid)
        {
            try
            {
                _logger.LogInformation($"Processing deletion for menu with GUID {menuGuid}");
                
                // Find menu to delete
                var menuToDelete = await _context.MstMenus.FindAsync(menuGuid);
                if (menuToDelete == null)
                {
                    _logger.LogWarning($"Menu with GUID {menuGuid} not found for deletion");
                    return;
                }
                
                // Find all descendant menus recursively to ensure we delete the entire tree
                var allChildrenToDelete = new List<MstMenu>();
                await FindAllDescendantMenus(menuToDelete.strMenuGUID, allChildrenToDelete);
                
                _logger.LogInformation($"Found {allChildrenToDelete.Count} descendant menus to delete");
                
                // Delete descendants from deepest level first to avoid foreign key constraint issues
                foreach (var child in allChildrenToDelete.OrderByDescending(c => c.strMenuPosition == "hidden" ? 1 : 0))
                {
                    try
                    {
                        // First delete any user rights associated with this menu using direct SQL
                        _logger.LogInformation($"Deleting user rights for descendant menu with GUID {child.strMenuGUID}");
                        
                        string sqlDelete = $"DELETE FROM mstUserRights WHERE strMenuGUID = '{child.strMenuGUID}'";
                        int deletedCount = await _context.Database.ExecuteSqlRawAsync(sqlDelete);
                        
                        _logger.LogInformation($"Deleted {deletedCount} user rights records for menu {child.strMenuGUID}");
                        
                        // Then delete the menu itself
                        _context.MstMenus.Remove(child);
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error deleting descendant menu {child.strMenuGUID}: {ex.Message}");
                        // Continue with other deletions
                    }
                }
                
                // Delete the parent menu last
                try
                {
                    // First delete any user rights associated with the parent menu using direct SQL
                    _logger.LogInformation($"Deleting user rights for parent menu with GUID {menuToDelete.strMenuGUID}");
                    
                    string sqlParentDelete = $"DELETE FROM mstUserRights WHERE strMenuGUID = '{menuToDelete.strMenuGUID}'";
                    int parentDeletedCount = await _context.Database.ExecuteSqlRawAsync(sqlParentDelete);
                    
                    _logger.LogInformation($"Deleted {parentDeletedCount} user rights records for parent menu {menuToDelete.strMenuGUID}");
                    
                    // Then delete the parent menu
                    _context.MstMenus.Remove(menuToDelete);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Successfully deleted parent menu with GUID {menuToDelete.strMenuGUID}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error deleting parent menu {menuToDelete.strMenuGUID}: {ex.Message}");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in ProcessMenuItemDeletion: {ex.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Process menu item creation without creating user rights
        /// </summary>
        /// <param name="menuItem">The menu item to process</param>
        /// <returns>Newly created menu GUID if applicable, otherwise null</returns>
        private async Task<Guid?> ProcessMenuItemWithoutRights(MenuItemDto menuItem)
        {
            try
            {
                // Log the current menu item being processed
                _logger.LogInformation($"Processing menu item (without rights): MasterMenuGUID={menuItem.strMasterMenuGUID}, " +
                    $"MenuGUID={menuItem.strMenuGUID}, RightGiven={menuItem.bolRightGiven}, " +
                    $"GroupGUID={menuItem.strGroupGUID}, HasChildren={menuItem.Children?.Count ?? 0}");

                // Validate master menu exists before any operations
                var masterMenuExists = await _context.MstMasterMenus.AnyAsync(m => m.strMasterMenuGUID == menuItem.strMasterMenuGUID);
                if (!masterMenuExists)
                {
                    _logger.LogError($"Master menu with GUID {menuItem.strMasterMenuGUID} does not exist");
                    throw new BusinessException($"Master menu with GUID {menuItem.strMasterMenuGUID} does not exist");
                }
                
                // Validate group exists
                var groupExists = await _context.MstGroups.AnyAsync(g => g.strGroupGUID == menuItem.strGroupGUID);
                if (!groupExists)
                {
                    _logger.LogError($"Group with GUID {menuItem.strGroupGUID} does not exist");
                    throw new BusinessException($"Group with GUID {menuItem.strGroupGUID} does not exist");
                }

                // Check if a menu with this master menu GUID and group GUID already exists
                bool menuAlreadyExists = await _context.MstMenus.AnyAsync(m => 
                    m.strMasterMenuGUID == menuItem.strMasterMenuGUID && 
                    m.strGroupGUID == menuItem.strGroupGUID);
                
                if (menuAlreadyExists)
                {
                    _logger.LogWarning($"Menu for master menu {menuItem.strMasterMenuGUID} and group {menuItem.strGroupGUID} already exists, skipping creation");
                    
                    // Find the existing menu to use for child processing
                    var existingMenu = await _context.MstMenus
                        .FirstOrDefaultAsync(m => m.strMasterMenuGUID == menuItem.strMasterMenuGUID && 
                                                 m.strGroupGUID == menuItem.strGroupGUID);
                    
                    if (existingMenu != null)
                    {
                        // Add this to our mapping dictionary
                        _logger.LogInformation($"Adding mapping for existing menu: Master menu {menuItem.strMasterMenuGUID} -> Menu {existingMenu.strMenuGUID}");
                        _masterMenuToMenuGuidMap[menuItem.strMasterMenuGUID] = existingMenu.strMenuGUID;
                        
                        // Update existing menu with new fields if they exist
                        var existingMasterMenu = await _context.MstMasterMenus.FindAsync(menuItem.strMasterMenuGUID);
                        if (existingMasterMenu != null)
                        {
                            // Update the new fields from the master menu
                            existingMenu.strPageTemplateGUID = menuItem.strPageTemplateGUID ?? existingMasterMenu.strPageTemplateGUID;
                            existingMenu.strCategory = menuItem.strCategory ?? existingMasterMenu.strCategory;
                            
                            _logger.LogInformation($"Updating existing menu with GUID {existingMenu.strMenuGUID}, " +
                                $"PageTemplateGUID: {existingMenu.strPageTemplateGUID}, Category: {existingMenu.strCategory}");
                            
                            await _context.SaveChangesAsync();
                            _logger.LogInformation($"Updated existing menu with GUID {existingMenu.strMenuGUID} with page template GUID and category");
                        }
                        
                        // Process children if any, using the existing menu GUID
                        if (menuItem.Children != null && menuItem.Children.Count > 0)
                        {
                            _logger.LogInformation($"Processing {menuItem.Children.Count} children using existing menu {existingMenu.strMenuGUID}");
                            foreach (var child in menuItem.Children)
                            {
                                child.strParentMenuGUID = existingMenu.strMenuGUID;
                                await ProcessMenuItemWithoutRights(child);
                            }
                        }
                        
                        return existingMenu.strMenuGUID;
                    }
                }
                
                // Fetch the master menu to get strPageTemplateGUID and strCategory if not provided in the DTO
                var masterMenu = await _context.MstMasterMenus.FindAsync(menuItem.strMasterMenuGUID);
                if (masterMenu == null)
                {
                    _logger.LogError($"Master menu with GUID {menuItem.strMasterMenuGUID} not found");
                    throw new BusinessException($"Master menu with GUID {menuItem.strMasterMenuGUID} not found");
                }
                
                _logger.LogInformation($"Retrieved master menu with GUID {masterMenu.strMasterMenuGUID}, " +
                    $"PageTemplateGUID: {masterMenu.strPageTemplateGUID}, Category: {masterMenu.strCategory}");
                
                // Create menu
                var newMenu = new MstMenu
                {
                    strMenuGUID = Guid.NewGuid(),
                    strMasterMenuGUID = menuItem.strMasterMenuGUID,
                    strParentMenuGUID = menuItem.strParentMenuGUID,
                    strGroupGUID = menuItem.strGroupGUID,
                    strModuleGUID = menuItem.strModuleGUID,
                    dblSeqNo = menuItem.dblSeqNo,
                    strName = menuItem.strName ?? string.Empty,
                    strPath = menuItem.strPath ?? string.Empty,
                    strMenuPosition = menuItem.strMenuPosition ?? string.Empty,
                    strMapKey = menuItem.strMapKey ?? string.Empty,
                    bolHasSubMenu = menuItem.bolHasSubMenu,
                    strIconName = menuItem.strIconName,
                    bolIsActive = menuItem.bolIsActive,
                    bolSuperAdminAccess = false,
                    // Copy the new fields from the DTO if available, otherwise from the master menu
                    strPageTemplateGUID = menuItem.strPageTemplateGUID ?? masterMenu.strPageTemplateGUID,
                    strCategory = menuItem.strCategory ?? masterMenu.strCategory,
                    bolIsSingleMenu = masterMenu.bolIsSingleMenu
                };

                // If strModuleGUID is provided, validate it exists
                if (newMenu.strModuleGUID.HasValue)
                {
                    var moduleExists = await _context.MstModules.AnyAsync(m => m.strModuleGUID == newMenu.strModuleGUID);
                    if (!moduleExists)
                    {
                        _logger.LogWarning($"Module with GUID {newMenu.strModuleGUID} does not exist, setting to null");
                        newMenu.strModuleGUID = null;
                    }
                }
                
                // Check if parent menu exists if parent GUID is specified
                if (newMenu.strParentMenuGUID.HasValue)
                {
                    var parentExists = await _context.MstMenus.AnyAsync(m => m.strMenuGUID == newMenu.strParentMenuGUID);
                    if (!parentExists)
                    {
                        _logger.LogWarning($"Parent menu with GUID {newMenu.strParentMenuGUID} does not exist, setting to null");
                        newMenu.strParentMenuGUID = null;
                    }
                }

                try
                {
                    _logger.LogInformation($"Creating new menu with strMenuGUID: {newMenu.strMenuGUID}, " + 
                        $"strMasterMenuGUID: {newMenu.strMasterMenuGUID}, " +
                        $"strPageTemplateGUID: {newMenu.strPageTemplateGUID}, " +
                        $"strCategory: {newMenu.strCategory}");
                    
                    _context.MstMenus.Add(newMenu);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Successfully created menu with GUID {newMenu.strMenuGUID}");
                    
                    // Add this to our mapping dictionary for parent-child relationship
                    _masterMenuToMenuGuidMap[menuItem.strMasterMenuGUID] = newMenu.strMenuGUID;
                    _logger.LogInformation($"Added mapping: Master menu {menuItem.strMasterMenuGUID} -> Menu {newMenu.strMenuGUID}");

                    // Process children if any
                    if (menuItem.Children != null && menuItem.Children.Count > 0)
                    {
                        _logger.LogInformation($"Processing {menuItem.Children.Count} children of menu {newMenu.strMenuGUID}");
                        foreach (var child in menuItem.Children)
                        {
                            // Set parent relationship for children that need to be created
                            child.strParentMenuGUID = newMenu.strMenuGUID;
                            await ProcessMenuItemWithoutRights(child);
                        }
                    }

                    return newMenu.strMenuGUID;
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogError(dbEx, $"Error saving new menu: {dbEx.Message}");
                    
                    if (dbEx.InnerException != null)
                    {
                        _logger.LogError($"Inner exception: {dbEx.InnerException.Message}");
                        
                        // Check for unique constraint violation
                        if (dbEx.InnerException.Message.Contains("unique") || 
                            dbEx.InnerException.Message.Contains("duplicate") || 
                            dbEx.InnerException.Message.Contains("IX_"))
                        {
                            _logger.LogWarning("Possible duplicate menu entry, trying to find existing menu");
                            
                            // Try to find the existing menu
                            var existingMenu = await _context.MstMenus
                                .FirstOrDefaultAsync(m => m.strMasterMenuGUID == menuItem.strMasterMenuGUID && 
                                                       m.strGroupGUID == menuItem.strGroupGUID);
                            
                            if (existingMenu != null)
                            {
                                _logger.LogInformation($"Found existing menu with GUID {existingMenu.strMenuGUID}, using that instead");
                                
                                // Add to mapping dictionary
                                _masterMenuToMenuGuidMap[menuItem.strMasterMenuGUID] = existingMenu.strMenuGUID;
                                return existingMenu.strMenuGUID;
                            }
                        }
                    }
                    
                    // Re-throw if we can't handle it
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in ProcessMenuItemWithoutRights: {ex.Message}");
                throw;
            }
        }
        
        /// <summary>
        /// Create user rights entry for a newly created menu
        /// </summary>
        /// <param name="menuGuid">The menu GUID</param>
        /// <param name="groupGuid">The group GUID</param>
        /// <param name="moduleGuid">The module GUID for UserDetails creation</param>
        /// <returns>A task representing the asynchronous operation</returns>
        private async Task CreateUserRightsForMenu(Guid menuGuid, Guid groupGuid, string? moduleGuid, string? overrideGroupGuid = null)
        {
            try
            {
                // Use override group GUID if provided
                Guid effectiveGroupGuid = groupGuid;
                if (!string.IsNullOrEmpty(overrideGroupGuid) && Guid.TryParse(overrideGroupGuid, out Guid parsedOverrideGroupGuid))
                {
                    _logger.LogInformation($"Using override group GUID: {overrideGroupGuid} instead of {groupGuid}");
                    effectiveGroupGuid = parsedOverrideGroupGuid;
                }
                
                _logger.LogInformation($"Starting CreateUserRightsForMenu: menuGuid={menuGuid}, effectiveGroupGuid={effectiveGroupGuid}");
                
                // Check if parameters are valid
                if (menuGuid == Guid.Empty)
                {
                    _logger.LogError("Invalid menuGuid (empty GUID). Cannot create user rights.");
                    return;
                }
                
                if (effectiveGroupGuid == Guid.Empty)
                {
                    _logger.LogError("Invalid effectiveGroupGuid (empty GUID). Cannot create user rights.");
                    return;
                }
                
                // Verify the group exists
                var groupExists = await _context.MstGroups.AnyAsync(g => g.strGroupGUID == effectiveGroupGuid);
                if (!groupExists)
                {
                    _logger.LogError($"Group with GUID {effectiveGroupGuid} does not exist. Cannot create user rights.");
                    throw new BusinessException($"Group with GUID {effectiveGroupGuid} does not exist");
                }
                
                _logger.LogInformation($"Group {effectiveGroupGuid} exists, proceeding with user rights creation");
                
                // Parse module GUID if provided
                Guid parsedModuleGuid = Guid.Empty;
                if (!string.IsNullOrEmpty(moduleGuid))
                {
                    if (!Guid.TryParse(moduleGuid, out parsedModuleGuid))
                    {
                        _logger.LogError($"Invalid moduleGuid format: {moduleGuid}. Cannot create user rights.");
                        throw new BusinessException($"Invalid moduleGuid format: {moduleGuid}");
                    }
                }
                else
                {
                    _logger.LogError("Module GUID is required. Cannot create user rights.");
                    throw new BusinessException("Module GUID is required for user rights creation");
                }
                
                // Log the query we're about to make
                _logger.LogInformation($"Querying MstUserRoles for group {effectiveGroupGuid} and module {parsedModuleGuid} with bolSystemCreated=true");
                
                // Find the user role with the matching group GUID, module GUID and bolSystemCreated = true
                var userRole = await _context.MstUserRoles
                    .Where(ur => ur.strGroupGUID == effectiveGroupGuid && 
                                ur.bolSystemCreated && 
                                ur.strModuleGUID == parsedModuleGuid)
                    .FirstOrDefaultAsync();
                
                if (userRole == null)
                {
                    _logger.LogError($"No role found for group {effectiveGroupGuid} and module {parsedModuleGuid}. Cannot create user rights for this menu.");
                    throw new BusinessException($"No role found for group {effectiveGroupGuid} and module {parsedModuleGuid}. Please create a role first.");
                }
                
                _logger.LogInformation($"Found role {userRole.strUserRoleGUID} for group {effectiveGroupGuid} and module {parsedModuleGuid}");
                
                _logger.LogInformation($"Using user role {userRole.strUserRoleGUID} ({userRole.strName}) for group {effectiveGroupGuid}");
                
                // Handle module GUID for user details creation
                if (!string.IsNullOrEmpty(moduleGuid))
                {
                    _logger.LogInformation($"Calling CreateUserDetailsEntry for module GUID {moduleGuid} and group GUID {groupGuid}");
                    try
                    {
                        await CreateUserDetailsEntry(moduleGuid, groupGuid.ToString());
                        _logger.LogInformation($"Successfully created user details for module {moduleGuid} and group {groupGuid}");
                    }
                    catch (Exception userDetailsEx)
                    {
                        _logger.LogError(userDetailsEx, $"Error creating UserDetails entry: {userDetailsEx.Message}");
                        // Don't throw, continue with user rights creation
                    }
                }
                else
                {
                    _logger.LogInformation("No module GUID provided. Skipping UserDetails creation.");
                }
                
                // Check if user rights already exist for this menu and role
                try
                {
                    // First just try to count to verify database access works
                    var rightsCount = await _context.MstUserRights.CountAsync();
                    _logger.LogInformation($"Total user rights in system: {rightsCount}");
                    
                    // Now check for existing rights for this specific menu and role
                    var existingRights = await _context.MstUserRights
                        .Where(ur => ur.strUserRoleGUID == userRole.strUserRoleGUID && ur.strMenuGUID == menuGuid)
                        .ToListAsync();
                    
                    _logger.LogInformation($"Found {existingRights.Count} existing user rights for menu {menuGuid} and role {userRole.strUserRoleGUID}");
                    
                    if (existingRights.Any())
                    {
                        _logger.LogInformation($"User rights already exist for menu {menuGuid} and user role {userRole.strUserRoleGUID}");
                        return;
                    }
                    
                    // Double check with string comparison just in case
                    var existingRightsAlt = await _context.MstUserRights
                        .Where(ur => ur.strUserRoleGUID == userRole.strUserRoleGUID && ur.strMenuGUID.ToString() == menuGuid.ToString())
                        .ToListAsync();
                        
                    if (existingRightsAlt.Any())
                    {
                        _logger.LogInformation($"User rights already exist (string comparison) for menu {menuGuid} and user role {userRole.strUserRoleGUID}");
                        return;
                    }
                }
                catch (Exception exCheck)
                {
                    _logger.LogError(exCheck, "Error checking for existing user rights: {Message}", exCheck.Message);
                    // Continue with creation attempt even if check fails
                }
                
                _logger.LogInformation("Creating new user rights record");
                
                // Generate a new GUID for the user right
                string userRightGuid = Guid.NewGuid().ToString();
                _logger.LogInformation($"Generated new user right GUID: {userRightGuid}");
                
                // Create a new user rights record
                var userRights = new MstUserRights
                {
                    strUserRightGUID = GuidHelper.ToGuid(userRightGuid),
                    strUserRoleGUID = userRole.strUserRoleGUID,
                    strMenuGUID = menuGuid,
                    // strModuleGUID removed as requested
                    bolCanView = true,      // Default permissions
                    bolCanEdit = true,
                    bolCanSave = true,
                    bolCanDelete = true,
                    bolCanPrint = true,
                    bolCanExport = true,
                    bolCanImport = true,
                    bolCanApprove = true
                    // Add any other required fields here if needed
                };
                
                try
                {
                    // Log entity state before adding
                    _logger.LogInformation($"Creating MstUserRights entity with GUID: {userRights.strUserRightGUID}");
                    _logger.LogInformation($"Entity details: MenuGUID={userRights.strMenuGUID}, UserRoleGUID={userRights.strUserRoleGUID}");
                    
                    // Get tracking info before adding
                    var entityEntry = _context.MstUserRights.Add(userRights);
                    _logger.LogInformation($"Entity state: {entityEntry.State}");
                    
                    // Try to execute raw SQL for debugging (using parameterized query)
                    try 
                    {
                        var sql = $@"SELECT COUNT(*) FROM MstUserRights WHERE strUserRightGUID = '{userRights.strUserRightGUID}' 
                                    OR (strUserRoleGUID = '{userRights.strUserRoleGUID}' AND strMenuGUID = '{userRights.strMenuGUID}')";
                        
                        _logger.LogInformation($"Executing diagnostic SQL: {sql}");
                        
                        try {
                            // Using raw SQL to check if record exists already or will be duplicate
                            var result = await _context.Database.ExecuteSqlRawAsync(
                                "SELECT COUNT(*) FROM MstUserRights WHERE strUserRightGUID = {0} OR (strUserRoleGUID = {1} AND strMenuGUID = {2})",
                                userRights.strUserRightGUID, userRights.strUserRoleGUID, userRights.strMenuGUID);
                                
                            _logger.LogInformation($"SQL diagnostic result: {result}");
                        } 
                        catch (Exception paramSqlEx) 
                        {
                            _logger.LogError(paramSqlEx, "Error with parameterized SQL, trying alternative: {Message}", paramSqlEx.Message);
                            
                            // Try alternative formulation if the first one fails
                            try {
                                var altResult = await _context.MstUserRights
                                    .Where(ur => ur.strUserRightGUID == userRights.strUserRightGUID || 
                                          (ur.strUserRoleGUID == userRights.strUserRoleGUID && ur.strMenuGUID == userRights.strMenuGUID))
                                    .CountAsync();
                                    
                                _logger.LogInformation($"LINQ diagnostic result: {altResult}");
                            } 
                            catch (Exception altEx) {
                                _logger.LogError(altEx, "Alternative diagnostic query failed: {Message}", altEx.Message);
                            }
                        }
                    }
                    catch (Exception sqlEx)
                    {
                        _logger.LogError(sqlEx, "Error executing diagnostic SQL: {Message}", sqlEx.Message);
                    }
                    
                    _logger.LogInformation("Saving user rights to database");
                    var entriesBefore = await _context.SaveChangesAsync();
                    _logger.LogInformation($"Save completed. {entriesBefore} entities were saved to the database.");
                    
                    // Verify record exists after save
                    try
                    {
                        var verifyExists = await _context.MstUserRights.AnyAsync(ur => 
                            ur.strUserRightGUID == userRights.strUserRightGUID);
                            
                        _logger.LogInformation($"Verification after save - record exists: {verifyExists}");
                    }
                    catch (Exception verifyEx)
                    {
                        _logger.LogError(verifyEx, "Error verifying record exists: {Message}", verifyEx.Message);
                    }
                    
                    _logger.LogInformation($"Successfully created user rights with GUID {userRights.strUserRightGUID} for menu {menuGuid} and role {userRole.strUserRoleGUID}");
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogError(dbEx, $"Database error creating user rights: {dbEx.Message}");
                    
                    if (dbEx.InnerException != null)
                    {
                        _logger.LogError($"Inner exception: {dbEx.InnerException.Message}");
                        
                        if (dbEx.InnerException.InnerException != null)
                        {
                            _logger.LogError($"Inner inner exception: {dbEx.InnerException.InnerException.Message}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error saving user rights: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating user rights for menu {menuGuid}: {ex.Message}");
                // Don't throw the exception as this is a secondary operation
                // and we don't want it to prevent the main menu creation from succeeding
            }
        }
        
        /// <summary>
        /// Update parent menu references for any items that have the given master menu as their parent
        /// </summary>
        /// <param name="masterMenuGuid">The master menu GUID that other items may reference as parent</param>
        /// <param name="menuGuid">The actual menu GUID to set as the parent</param>
        private Task UpdateParentReferences(Guid masterMenuGuid, Guid menuGuid)
        {
            // Add the mapping to our dictionary
            _masterMenuToMenuGuidMap[masterMenuGuid] = menuGuid;
            
            // Log the mapping
            _logger.LogInformation($"Added mapping: Master menu {masterMenuGuid} -> Menu {menuGuid}");
            
            return Task.CompletedTask;
        }
        
        /// <summary>
        /// Pre-process a menu item to identify parent-child relationships
        /// </summary>
        /// <param name="menuItem">The menu item to pre-process</param>
        private void PreProcessParentChildRelationships(MenuItemDto menuItem)
        {
            // If this menu item has children, it's a potential parent
            if (menuItem.Children != null && menuItem.Children.Count > 0)
            {
                _logger.LogInformation($"Menu item {menuItem.strMasterMenuGUID} has {menuItem.Children.Count} children");
                
                // Process each child to identify the parent-child relationship
                foreach (var child in menuItem.Children)
                {
                    _logger.LogInformation($"Child menu item: {child.strMasterMenuGUID}, Parent: {menuItem.strMasterMenuGUID}");
                    
                    // Recursively process any children of this child
                    if (child.Children != null && child.Children.Count > 0)
                    {
                        PreProcessParentChildRelationships(child);
                    }
                }
            }
        }
        
        /// <summary>
        /// Recursively find all descendant menus of a given parent menu
        /// </summary>
        /// <param name="parentMenuGuid">The parent menu GUID</param>
        /// <param name="descendantMenus">List to collect all descendant menus</param>
        private async Task FindAllDescendantMenus(Guid parentMenuGuid, List<MstMenu> descendantMenus)
        {
            // Find immediate children
            var children = await _context.MstMenus
                .Where(m => m.strParentMenuGUID == parentMenuGuid)
                .ToListAsync();
                
            // Add all children to the list
            descendantMenus.AddRange(children);
            
            // Recursively find descendants of each child
            foreach (var child in children)
            {
                await FindAllDescendantMenus(child.strMenuGUID, descendantMenus);
            }
        }
        
        /// <summary>
        /// Recursively process a menu item and its children
        /// </summary>
        /// <param name="menuItem">The menu item to process</param>
        /// <param name="moduleGuid">The module GUID for UserDetails creation</param>
        /// <returns>Newly created menu GUID if applicable, otherwise null</returns>
        private async Task<Guid?> ProcessMenuItemRights(MenuItemDto menuItem, string? moduleGuid, string? groupGuid = null)
        {
            try
            {
                // Log the current menu item being processed
                _logger.LogInformation($"Processing menu item: MasterMenuGUID={menuItem.strMasterMenuGUID}, " +
                    $"MenuGUID={menuItem.strMenuGUID}, RightGiven={menuItem.bolRightGiven}, " +
                    $"GroupGUID={menuItem.strGroupGUID}, HasChildren={menuItem.Children?.Count ?? 0}");

                // Validate master menu exists before any operations
                var masterMenuExists = await _context.MstMasterMenus.AnyAsync(m => m.strMasterMenuGUID == menuItem.strMasterMenuGUID);
                if (!masterMenuExists)
                {
                    _logger.LogError($"Master menu with GUID {menuItem.strMasterMenuGUID} does not exist");
                    throw new BusinessException($"Master menu with GUID {menuItem.strMasterMenuGUID} does not exist");
                }
                
                // Validate group exists
                var groupExists = await _context.MstGroups.AnyAsync(g => g.strGroupGUID == menuItem.strGroupGUID);
                if (!groupExists)
                {
                    _logger.LogError($"Group with GUID {menuItem.strGroupGUID} does not exist");
                    throw new BusinessException($"Group with GUID {menuItem.strGroupGUID} does not exist");
                }

                // Check if menu should be created
                if (menuItem.strMenuGUID == null && menuItem.bolRightGiven)
                {
                    _logger.LogInformation($"Creating new menu for master menu {menuItem.strMasterMenuGUID}");
                    
                    // Update parent menu GUID if we have a mapping for it
                    if (menuItem.strParentMenuGUID.HasValue && 
                        menuItem.strParentMenuGUID.Value != Guid.Empty &&
                        _masterMenuToMenuGuidMap.TryGetValue(menuItem.strParentMenuGUID.Value, out Guid actualParentMenuGuid))
                    {
                        _logger.LogInformation($"Updating parent menu GUID from {menuItem.strParentMenuGUID} (master menu) to {actualParentMenuGuid} (actual menu)");
                        menuItem.strParentMenuGUID = actualParentMenuGuid;
                    }
                    
                    // Check if a menu with this master menu GUID and group GUID already exists
                    bool menuAlreadyExists = await _context.MstMenus.AnyAsync(m => 
                        m.strMasterMenuGUID == menuItem.strMasterMenuGUID && 
                        m.strGroupGUID == menuItem.strGroupGUID);
                    
                    if (menuAlreadyExists)
                    {
                        _logger.LogWarning($"Menu for master menu {menuItem.strMasterMenuGUID} and group {menuItem.strGroupGUID} already exists, skipping creation");
                        
                        // Find the existing menu to use for child processing
                        var existingMenu = await _context.MstMenus
                            .FirstOrDefaultAsync(m => m.strMasterMenuGUID == menuItem.strMasterMenuGUID && 
                                                     m.strGroupGUID == menuItem.strGroupGUID);
                        
                        if (existingMenu != null)
                        {
                            // Add this to our mapping dictionary
                            _logger.LogInformation($"Adding mapping for existing menu: Master menu {menuItem.strMasterMenuGUID} -> Menu {existingMenu.strMenuGUID}");
                            _masterMenuToMenuGuidMap[menuItem.strMasterMenuGUID] = existingMenu.strMenuGUID;
                            
                            // Create user rights for this existing menu if they don't exist
                            try 
                            {
                                _logger.LogInformation($"Creating user rights for existing menu: {existingMenu.strMenuGUID}, group: {menuItem.strGroupGUID}, moduleGuid: {moduleGuid ?? "null"}, overrideGroupGuid: {groupGuid ?? "null"}");
                                await CreateUserRightsForMenu(existingMenu.strMenuGUID, menuItem.strGroupGUID, moduleGuid, groupGuid);
                                _logger.LogInformation($"Successfully created user rights for existing menu: {existingMenu.strMenuGUID}");
                            }
                            catch (Exception urEx)
                            {
                                _logger.LogError(urEx, $"Error creating user rights for existing menu {existingMenu.strMenuGUID}: {urEx.Message}");
                                // Continue processing, don't fail the entire operation
                            }
                            
                            // Process children if any, using the existing menu GUID
                            if (menuItem.Children != null && menuItem.Children.Count > 0)
                            {
                                _logger.LogInformation($"Processing {menuItem.Children.Count} children using existing menu {existingMenu.strMenuGUID}");
                                foreach (var child in menuItem.Children)
                                {
                                    child.strParentMenuGUID = existingMenu.strMenuGUID;
                                    await ProcessMenuItemRights(child, moduleGuid, groupGuid);
                                }
                            }
                            
                            return existingMenu.strMenuGUID;
                        }
                        
                        // If we couldn't find the menu despite the check, continue with creation
                        _logger.LogWarning("Couldn't find the existing menu despite check, proceeding with creation");
                    }
                    
                    // Create menu
                    var newMenu = new MstMenu
                    {
                        strMenuGUID = Guid.NewGuid(),
                        strMasterMenuGUID = menuItem.strMasterMenuGUID,
                        strParentMenuGUID = menuItem.strParentMenuGUID, // Use parent menu GUID if provided
                        strGroupGUID = menuItem.strGroupGUID,
                        strModuleGUID = menuItem.strModuleGUID,
                        dblSeqNo = menuItem.dblSeqNo,
                        strName = menuItem.strName ?? string.Empty, // Ensure not null
                        strPath = menuItem.strPath ?? string.Empty, // Ensure not null
                        strMenuPosition = menuItem.strMenuPosition ?? string.Empty, // Ensure not null
                        strMapKey = menuItem.strMapKey ?? string.Empty, // Ensure not null
                        bolHasSubMenu = menuItem.bolHasSubMenu,
                        strIconName = menuItem.strIconName, // Can be null
                        bolIsActive = menuItem.bolIsActive,
                        bolSuperAdminAccess = false // Default value
                    };

                    // If strModuleGUID is provided, validate it exists
                    if (newMenu.strModuleGUID.HasValue)
                    {
                        var moduleExists = await _context.MstModules.AnyAsync(m => m.strModuleGUID == newMenu.strModuleGUID);
                        if (!moduleExists)
                        {
                            _logger.LogWarning($"Module with GUID {newMenu.strModuleGUID} does not exist, setting to null");
                            newMenu.strModuleGUID = null;
                        }
                    }
                    
                    // Check if parent menu exists if parent GUID is specified
                    if (newMenu.strParentMenuGUID.HasValue)
                    {
                        var parentExists = await _context.MstMenus.AnyAsync(m => m.strMenuGUID == newMenu.strParentMenuGUID);
                        if (!parentExists)
                        {
                            _logger.LogWarning($"Parent menu with GUID {newMenu.strParentMenuGUID} does not exist, setting to null");
                            newMenu.strParentMenuGUID = null;
                        }
                    }

                    try
                    {
                        _context.MstMenus.Add(newMenu);
                        await _context.SaveChangesAsync(); // No need to wrap in execution strategy as it's handled at the transaction level
                        _logger.LogInformation($"Successfully created menu with GUID {newMenu.strMenuGUID}");
                    }
                    catch (DbUpdateException dbEx)
                    {
                        _logger.LogError(dbEx, $"Error saving new menu: {dbEx.Message}");
                        
                        if (dbEx.InnerException != null)
                        {
                            _logger.LogError($"Inner exception: {dbEx.InnerException.Message}");
                            
                            // Check for unique constraint violation
                            if (dbEx.InnerException.Message.Contains("unique") || 
                                dbEx.InnerException.Message.Contains("duplicate") || 
                                dbEx.InnerException.Message.Contains("IX_"))
                            {
                                _logger.LogWarning("Possible duplicate menu entry, trying to find existing menu");
                                
                                // Try to find the existing menu
                                var existingMenu = await _context.MstMenus
                                    .FirstOrDefaultAsync(m => m.strMasterMenuGUID == menuItem.strMasterMenuGUID && 
                                                           m.strGroupGUID == menuItem.strGroupGUID);
                                
                                if (existingMenu != null)
                                {
                                    _logger.LogInformation($"Found existing menu with GUID {existingMenu.strMenuGUID}, using that instead");
                                    
                                    // Add to mapping dictionary
                                    _masterMenuToMenuGuidMap[menuItem.strMasterMenuGUID] = existingMenu.strMenuGUID;
                                    
                                    // Create user rights for this existing menu
                                    try 
                                    {
                                        _logger.LogInformation($"Creating user rights for duplicate-prevented menu: {existingMenu.strMenuGUID}, group: {menuItem.strGroupGUID}, moduleGuid: {moduleGuid ?? "null"}, overrideGroupGuid: {groupGuid ?? "null"}");
                                        await CreateUserRightsForMenu(existingMenu.strMenuGUID, menuItem.strGroupGUID, moduleGuid, groupGuid);
                                        _logger.LogInformation($"Successfully created user rights for duplicate-prevented menu: {existingMenu.strMenuGUID}");
                                    }
                                    catch (Exception urEx)
                                    {
                                        _logger.LogError(urEx, $"Error creating user rights for duplicate-prevented menu {existingMenu.strMenuGUID}: {urEx.Message}");
                                        // Continue processing, don't fail the entire operation
                                    }
                                    
                                    return existingMenu.strMenuGUID;
                                }
                            }
                        }
                        
                        // Re-throw if we can't handle it
                        throw;
                    }

                    _logger.LogInformation($"Created new menu with GUID {newMenu.strMenuGUID} for master menu {menuItem.strMasterMenuGUID}");
                    
                    // Add this to our mapping dictionary for parent-child relationship
                    _masterMenuToMenuGuidMap[menuItem.strMasterMenuGUID] = newMenu.strMenuGUID;
                    _logger.LogInformation($"Added mapping: Master menu {menuItem.strMasterMenuGUID} -> Menu {newMenu.strMenuGUID}");

                    // Create user rights for this menu
                    _logger.LogInformation($"Calling CreateUserRightsForMenu for newly created menu {newMenu.strMenuGUID}, moduleGuid: {moduleGuid ?? "null"}, overrideGroupGuid: {groupGuid ?? "null"}");
                    try
                    {
                        await CreateUserRightsForMenu(newMenu.strMenuGUID, menuItem.strGroupGUID, moduleGuid, groupGuid);
                        _logger.LogInformation($"Successfully created user rights for newly created menu: {newMenu.strMenuGUID}");
                    }
                    catch (Exception urEx)
                    {
                        _logger.LogError(urEx, $"Error creating user rights for newly created menu {newMenu.strMenuGUID}: {urEx.Message}");
                        if (urEx.InnerException != null)
                        {
                            _logger.LogError($"Inner exception: {urEx.InnerException.Message}");
                        }
                        // Continue processing, don't fail the entire operation
                    }

                    // Process children if any
                    if (menuItem.Children != null && menuItem.Children.Count > 0)
                    {
                        _logger.LogInformation($"Processing {menuItem.Children.Count} children of menu {newMenu.strMenuGUID}");
                        foreach (var child in menuItem.Children)
                        {
                            // Set parent relationship for children that need to be created
                            child.strParentMenuGUID = newMenu.strMenuGUID;
                            await ProcessMenuItemRights(child, moduleGuid, groupGuid);
                        }
                    }

                    return newMenu.strMenuGUID;
                }
                // Check if menu should be deleted
                else if (menuItem.strMenuGUID.HasValue && !menuItem.bolRightGiven)
                {
                    _logger.LogInformation($"Attempting to delete menu with GUID {menuItem.strMenuGUID}");
                    
                    try
                    {
                        // Find menu to delete
                        var menuToDelete = await _context.MstMenus.FindAsync(menuItem.strMenuGUID);
                        if (menuToDelete != null)
                        {
                            _logger.LogInformation($"Deleting menu with GUID {menuToDelete.strMenuGUID}");
                            
                            // Find all descendant menus recursively to ensure we delete the entire tree
                            var allChildrenToDelete = new List<MstMenu>();
                            await FindAllDescendantMenus(menuToDelete.strMenuGUID, allChildrenToDelete);
                            
                            _logger.LogInformation($"Found {allChildrenToDelete.Count} descendant menus to delete");
                            
                            // Delete descendants from deepest level first to avoid foreign key constraint issues
                            foreach (var child in allChildrenToDelete.OrderByDescending(c => c.strMenuPosition == "hidden" ? 1 : 0))
                            {
                                try
                                {
                                    // First delete any user rights associated with this menu using direct SQL to bypass EF Core restrictions
                                    _logger.LogInformation($"Deleting user rights for descendant menu with GUID {child.strMenuGUID}");
                                    
                                    // Use raw SQL to delete user rights to avoid potential EF Core tracking issues
                                    string sqlDelete = $"DELETE FROM mstUserRights WHERE strMenuGUID = '{child.strMenuGUID}'";
                                    int deletedCount = await _context.Database.ExecuteSqlRawAsync(sqlDelete);
                                    
                                    _logger.LogInformation($"Deleted {deletedCount} user rights records for menu {child.strMenuGUID} using SQL");
                                    
                                    // Then delete the menu itself
                                    _logger.LogInformation($"Deleting descendant menu with GUID {child.strMenuGUID}");
                                    _context.MstMenus.Remove(child);
                                    await _context.SaveChangesAsync();
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, $"Error deleting descendant menu {child.strMenuGUID} or its user rights: {ex.Message}");
                                    // Continue with other deletions
                                }
                            }
                            
                            // Delete the parent menu last
                            try
                            {
                                // First delete any user rights associated with the parent menu using direct SQL
                                _logger.LogInformation($"Deleting user rights for parent menu with GUID {menuToDelete.strMenuGUID}");
                                
                                // Use raw SQL to delete user rights for parent menu
                                string sqlParentDelete = $"DELETE FROM mstUserRights WHERE strMenuGUID = '{menuToDelete.strMenuGUID}'";
                                int parentDeletedCount = await _context.Database.ExecuteSqlRawAsync(sqlParentDelete);
                                
                                _logger.LogInformation($"Deleted {parentDeletedCount} user rights records for parent menu {menuToDelete.strMenuGUID} using SQL");
                                
                                // Then delete the parent menu
                                _context.MstMenus.Remove(menuToDelete);
                                await _context.SaveChangesAsync();
                                _logger.LogInformation($"Successfully deleted parent menu with GUID {menuToDelete.strMenuGUID} and its associated user rights");
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, $"Error deleting parent menu {menuToDelete.strMenuGUID} or its user rights: {ex.Message}");
                                throw;
                            }
                        }
                        else
                        {
                            _logger.LogWarning($"Menu with GUID {menuItem.strMenuGUID} not found for deletion");
                        }
                    }
                    catch (DbUpdateException ex)
                    {
                        _logger.LogError(ex, $"Database error deleting menu {menuItem.strMenuGUID}: {ex.Message}");
                        
                        if (ex.InnerException != null)
                        {
                            _logger.LogError($"Inner exception: {ex.InnerException.Message}");
                            
                            // If it's a constraint violation, the menu might be referenced somewhere else
                            if (ex.InnerException.Message.Contains("constraint") || 
                                ex.InnerException.Message.Contains("reference"))
                            {
                                _logger.LogWarning("Cannot delete menu due to constraint violation - it may be referenced by other entities");
                                throw new BusinessException("Cannot delete menu as it is referenced by other entities");
                            }
                        }
                        
                        throw;
                    }
                }
                // If the menu exists and rights are given, process its children
                else if (menuItem.strMenuGUID.HasValue && menuItem.bolRightGiven)
                {
                    _logger.LogInformation($"Menu with GUID {menuItem.strMenuGUID} already exists and rights are given");
                    
                    // Verify the menu exists
                    var existingMenu = await _context.MstMenus.FindAsync(menuItem.strMenuGUID);
                    if (existingMenu == null)
                    {
                        _logger.LogWarning($"Menu with GUID {menuItem.strMenuGUID} not found but marked as existing");
                        
                        // Fetch the master menu to get additional fields
                        var masterMenu = await _context.MstMasterMenus.FindAsync(menuItem.strMasterMenuGUID);
                        
                        // Create a new menu instead
                        var newMenu = new MstMenu
                        {
                            strMenuGUID = Guid.NewGuid(),
                            strMasterMenuGUID = menuItem.strMasterMenuGUID,
                            strParentMenuGUID = menuItem.strParentMenuGUID,
                            strGroupGUID = menuItem.strGroupGUID,
                            strModuleGUID = menuItem.strModuleGUID,
                            dblSeqNo = menuItem.dblSeqNo,
                            strName = menuItem.strName ?? string.Empty,
                            strPath = menuItem.strPath ?? string.Empty,
                            strMenuPosition = menuItem.strMenuPosition ?? string.Empty,
                            strMapKey = menuItem.strMapKey ?? string.Empty,
                            bolHasSubMenu = menuItem.bolHasSubMenu,
                            strIconName = menuItem.strIconName,
                            bolIsActive = menuItem.bolIsActive,
                            bolSuperAdminAccess = false,
                            bolIsSingleMenu = masterMenu?.bolIsSingleMenu ?? false
                        };

                        _context.MstMenus.Add(newMenu);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Created replacement menu with GUID {newMenu.strMenuGUID}");
                        
                        // Update the menuItem with the new GUID for child processing
                        menuItem.strMenuGUID = newMenu.strMenuGUID;
                    }
                    
                    // Process children if any
                    if (menuItem.Children != null && menuItem.Children.Count > 0)
                    {
                        _logger.LogInformation($"Processing {menuItem.Children.Count} children of existing menu {menuItem.strMenuGUID}");
                        foreach (var child in menuItem.Children)
                        {
                            await ProcessMenuItemRights(child, moduleGuid, groupGuid);
                        }
                    }
                }
                else
                {
                    _logger.LogInformation($"No action required for menu item with master GUID {menuItem.strMasterMenuGUID}");
                }

                return null;
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, $"Database error processing menu item {menuItem.strMasterMenuGUID}: {dbEx.Message}");
                
                // More detailed logging for database errors
                string innerDetails = "No inner exception details";
                if (dbEx.InnerException != null)
                {
                    innerDetails = $"Inner exception: {dbEx.InnerException.GetType().Name}: {dbEx.InnerException.Message}";
                    _logger.LogError($"{innerDetails}");
                    
                    // SQL Server errors often have another layer of inner exceptions
                    if (dbEx.InnerException.InnerException != null)
                    {
                        string deepInnerDetails = $"Deep inner exception: {dbEx.InnerException.InnerException.GetType().Name}: {dbEx.InnerException.InnerException.Message}";
                        _logger.LogError($"{deepInnerDetails}");
                        innerDetails += " | " + deepInnerDetails;
                    }
                }
                
                // Extract and log entity validation errors if any
                var entityErrors = dbEx.Entries
                    .SelectMany(entry => entry.Entity.GetType().Name)
                    .ToList();
                if (entityErrors.Any())
                {
                    _logger.LogError($"Entity validation errors for: {string.Join(", ", entityErrors)}");
                }
                
                throw new BusinessException($"Database error: {innerDetails}");
            }
            catch (InvalidOperationException ioEx) when (ioEx.Message.Contains("execution strategy"))
            {
                _logger.LogError(ioEx, "Execution strategy error: {Message}", ioEx.Message);
                throw new BusinessException($"Transaction error: Please retry your request");
            }
            catch (BusinessException)
            {
                // Re-throw business exceptions
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error processing menu item {menuItem.strMasterMenuGUID}: {ex.Message}");
                
                // More detailed logging
                if (ex.InnerException != null)
                {
                    _logger.LogError($"Inner exception: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
                }
                
                throw new BusinessException($"Error processing menu: {ex.Message}");
            }
        }
        
        /// <summary>
        /// Creates a user details entry for the specified module and group if it doesn't already exist.
        /// </summary>
        /// <param name="moduleGuid">The module GUID</param>
        /// <param name="groupGuid">The group GUID</param>
        /// <returns>A task representing the asynchronous operation</returns>
        private async Task CreateUserDetailsEntry(string moduleGuid, string groupGuid)
        {
            try
            {
                _logger.LogInformation($"Starting CreateUserDetailsEntry: moduleGuid={moduleGuid}, groupGuid={groupGuid}");
                
                // Validate and parse GUIDs
                if (!Guid.TryParse(groupGuid, out Guid parsedGroupGuid))
                {
                    throw new BusinessException($"Invalid group GUID format: {groupGuid}");
                }

                if (!Guid.TryParse(moduleGuid, out Guid parsedModuleGuid))
                {
                    throw new BusinessException($"Invalid module GUID format: {moduleGuid}");
                }
                
                // Get system created user for the specific group
                var systemUser = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.bolSystemCreated 
                                         && u.strGroupGUID == parsedGroupGuid);
                
                if (systemUser == null)
                {
                    throw new BusinessException($"System user not found for group {groupGuid}");
                }
                _logger.LogInformation($"Found system user: {systemUser.strUserGUID} for group {groupGuid}");
                
                // Get system created organization for the specific group
                var systemOrg = await _context.MstOrganizations
                    .FirstOrDefaultAsync(o => o.bolSystemCreated 
                                         && o.strGroupGUID == parsedGroupGuid);
                
                if (systemOrg == null)
                {
                    throw new BusinessException($"System organization not found for group {groupGuid}");
                }
                _logger.LogInformation($"Found system organization: {systemOrg.strOrganizationGUID} for group {groupGuid}");
                
                // Get system created year for the specific group
                var systemYear = await _context.MstYears
                    .FirstOrDefaultAsync(y => y.bolSystemCreated 
                                         && y.strGroupGUID == parsedGroupGuid);
                
                if (systemYear == null)
                {
                    throw new BusinessException($"System year not found for group {groupGuid}");
                }
                _logger.LogInformation($"Found system year: {systemYear.strYearGUID} for group {groupGuid}");
                
                // Get user role using both groupGuid and moduleGuid from request query
                Models.Entities.MstUserRole? userRole = null;
                // Get user role for the specific group and module with strict requirements
                var selectedRole = await _context.MstUserRoles
                    .FirstOrDefaultAsync(r => r.strModuleGUID.ToString() == moduleGuid 
                                         && r.strGroupGUID.ToString() == groupGuid 
                                         && r.bolSystemCreated);

                if (selectedRole == null)
                {
                    throw new BusinessException($"No system-created user role found for module {moduleGuid} and group {groupGuid}");
                }

                _logger.LogInformation($"Found user role: {selectedRole.strUserRoleGUID} ({selectedRole.strName}) " +
                    $"for module {moduleGuid} and group {groupGuid}");
                
                // Assign to userRole for use in the rest of the method
                userRole = selectedRole;

                // Check all existing user details for this combination
                var allUserDetails = await _context.MstUserDetails
                    .Where(ud => ud.strUserGUID == systemUser.strUserGUID &&
                               ud.strOrganizationGUID == systemOrg.strOrganizationGUID)
                    .ToListAsync();
                    
                _logger.LogInformation($"DEBUG - Found {allUserDetails.Count} existing user details for this user and organization");
                
                foreach (var detail in allUserDetails)
                {
                    _logger.LogInformation($"DEBUG - Existing Detail: ID={detail.strUserDetailGUID}, " +
                        $"Role={detail.strUserRoleGUID}, Group={detail.strGroupGUID}, " +
                        $"Module={(detail.strModuleGUID.HasValue ? detail.strModuleGUID.ToString() : "null")}");
                }

                // Now check for the exact combination - we know userRole is not null at this point
                var existingUserDetails = await _context.MstUserDetails
                    .FirstOrDefaultAsync(ud => 
                        ud.strUserGUID == systemUser.strUserGUID &&
                        ud.strOrganizationGUID == systemOrg.strOrganizationGUID &&
                        ud.strUserRoleGUID == userRole.strUserRoleGUID &&
                        ud.strGroupGUID == GuidHelper.ToGuid(groupGuid) &&
                        ud.strYearGUID == systemYear.strYearGUID &&
                        ud.strModuleGUID == GuidHelper.ToGuid(moduleGuid));
                
                if (existingUserDetails != null)
                {
                    _logger.LogInformation($"User details entry already exists for this combination: {existingUserDetails.strUserDetailGUID}");
                    return;
                }
                
                // Create a new user details entry
                var newUserDetails = new MstUserDetails
                {
                    strUserDetailGUID = Guid.NewGuid(),
                    strUserGUID = systemUser.strUserGUID,
                    strOrganizationGUID = systemOrg.strOrganizationGUID,
                    strUserRoleGUID = selectedRole.strUserRoleGUID,
                    strGroupGUID = GuidHelper.ToGuid(groupGuid),
                    strYearGUID = systemYear.strYearGUID,
                    strModuleGUID = GuidHelper.ToGuid(moduleGuid),
                    bolIsActive = true,
                    strCreatedByGUID = systemUser.strUserGUID,
                    dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()
                };
                
                _context.MstUserDetails.Add(newUserDetails);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation($"Successfully created user details entry with GUID: {newUserDetails.strUserDetailGUID}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating user details entry: {ex.Message}");
                // Don't throw the exception as this is a secondary operation
                // and we don't want it to prevent the menu rights update from succeeding
            }
        }
    }
} 