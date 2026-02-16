using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuditSoftware.DTOs.UserRights;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Module;
using AuditSoftware.Interfaces;
using AuditSoftware.Attributes;
using AuditSoftware.Exceptions;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using AuditSoftware.Models.Entities;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Text.Json.Serialization;
using AuditSoftware.DTOs.Auth;
using System.Collections.Generic;
using System.Linq;
using AuditSoftware.Helpers;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserRightsController : BaseDeletionController<MstUserRights>
    {
        private readonly IUserRightsService _userRightsService;
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;
        private new readonly ILogger<UserRightsController> _logger;

        public UserRightsController(
            IUserRightsService userRightsService, 
            AppDbContext context, 
            ILogger<UserRightsController> logger, 
            ILogger<BaseDeletionController<MstUserRights>> baseLogger,
            IAuthService authService,
            IDeleteValidationService deleteValidationService)
            : base(deleteValidationService, baseLogger)
        {
            _userRightsService = userRightsService ?? throw new ArgumentNullException(nameof(userRightsService));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        }

        private async Task<List<MenuTreeDto>> BuildMenuTreeAsync(IEnumerable<MstMenu> allMenus, Guid? parentMenuGuid, Guid? roleGuid, bool isSuperAdmin)
        {
            var menuTree = new List<MenuTreeDto>();
            
            _logger.LogInformation("[Step 1] Building menu tree for Parent: {ParentGuid}, Super Admin: {IsSuperAdmin}",
                parentMenuGuid?.ToString() ?? "root", isSuperAdmin);

            // Step 2: Get direct children of the current parent, filtering out superAdminAccess menus for normal users
            var childMenus = allMenus
                .Where(m => m.strParentMenuGUID == parentMenuGuid)
                .Where(m => isSuperAdmin || !m.bolSuperAdminAccess) // Only include superAdminAccess menus for super admins
                .OrderBy(m => m.dblSeqNo)
                .ToList();
                
            _logger.LogInformation("[Step 2] Found {Count} child menus for parent {ParentGuid}", 
                childMenus.Count(), parentMenuGuid?.ToString() ?? "root");

            if (childMenus.Count == 0 && parentMenuGuid == null)
            {
                _logger.LogWarning("[Step 2.1] No root menu items found. This will result in an empty menu tree.");
            }

            int processedCount = 0;
            int includedCount = 0;

            // Step 3: Process each child menu
            foreach (var menu in childMenus)
            {
                processedCount++;
                _logger.LogInformation(
                    "[Step 3.{MenuNumber}] Processing menu: {MenuName}",
                    processedCount,
                    menu.strName
                );

                // Step 4: Determine permissions based on user type
                DTOs.Common.PermissionDto permission = new DTOs.Common.PermissionDto(); // Initialize with default values
                bool includeMenu = false;

                if (isSuperAdmin)
                {
                    // Step 4A: Super admin path - grant all permissions
                    permission = new DTOs.Common.PermissionDto
                    {
                        bolCanView = true,
                        bolCanEdit = true,
                        bolCanDelete = true,
                        bolCanSave = true,
                        bolCanPrint = true,
                        bolCanExport = true,
                        bolCanImport = true,
                        bolCanApprove = true,
                        // Set Is* fields to true for super admin
                        bolIsView = true,
                        bolIsEdit = true,
                        bolIsDelete = true,
                        bolIsSave = true,
                        bolIsPrint = true,
                        bolIsExport = true,
                        bolIsImport = true,
                        bolIsApprove = true
                    };
                    includeMenu = true;
                    _logger.LogInformation("[Step 4A] Super admin access granted for menu: {MenuName}", menu.strName);
                }
                else
                {
                    // Step 4B: Regular user path - check permissions from DB
                    _logger.LogInformation("[Step 4B] Checking rights for menu: {MenuName}", menu.strName);
                    
                    // Check if the roleGuid is valid
                    var roleGuidValid = roleGuid.HasValue;
                    
                    if (!roleGuidValid)
                    {
                        _logger.LogWarning("[Step 4B.1] Invalid Role GUID - skipping menu {MenuName}", menu.strName);
                        continue;
                    }
                    
                    try 
                    {
                        var rights = await _context.MstUserRights
                            .AsNoTracking() // Use AsNoTracking for better performance in read-only operations
                            .Where(r => r.strUserRoleGUID == roleGuid && r.strMenuGUID == menu.strMenuGUID)
                            .FirstOrDefaultAsync();
                                               
                        if (rights == null)
                        {
                            _logger.LogInformation("[Step 4B.2] No rights found for menu: {MenuName}", menu.strName);
                            continue;
                        }
                        else if (rights.bolCanView)
                        {
                            // Get page template for this menu if available
                            MstPageTemplate? pageTemplate = null;
                            if (menu.strPageTemplateGUID.HasValue)
                            {
                                try
                                {
                                    // Skip EF Core's GUID conversion by creating a default template model
                                    // with basic permissions that won't crash the application
                                    pageTemplate = new MstPageTemplate
                                    {
                                        bolIsView = true,
                                        bolIsEdit = false, 
                                        bolIsDelete = false,
                                        bolIsSave = false,
                                        bolIsPrint = false,
                                        bolIsExport = false,
                                        bolIsImport = false,
                                        bolIsApprove = false,
                                        strPageTemplateName = $"{menu.strName} Template"
                                    };
                                    
                                    _logger.LogInformation("[Step 4B.2.1] Created default page template for menu: {MenuName}", menu.strName);
                                }
                                catch (Exception ex)
                                {
                                    // Log the error but continue processing
                                    _logger.LogError(ex, "[Step 4B.ERROR] Error creating default page template for menu {MenuName}. Continuing without template.", menu.strName);
                                }
                            }

                            permission = new DTOs.Common.PermissionDto
                            {
                                bolCanView = rights.bolCanView,
                                bolCanEdit = rights.bolCanEdit,
                                bolCanDelete = rights.bolCanDelete,
                                bolCanSave = rights.bolCanSave,
                                bolCanPrint = rights.bolCanPrint,
                                bolCanExport = rights.bolCanExport,
                                bolCanImport = rights.bolCanImport,
                                bolCanApprove = rights.bolCanApprove,
                                // Set values from page template if available
                                bolIsView = pageTemplate?.bolIsView ?? false,
                                bolIsEdit = pageTemplate?.bolIsEdit ?? false,
                                bolIsDelete = pageTemplate?.bolIsDelete ?? false,
                                bolIsSave = pageTemplate?.bolIsSave ?? false,
                                bolIsPrint = pageTemplate?.bolIsPrint ?? false,
                                bolIsExport = pageTemplate?.bolIsExport ?? false,
                                bolIsImport = pageTemplate?.bolIsImport ?? false,
                                bolIsApprove = pageTemplate?.bolIsApprove ?? false
                            };
                            includeMenu = true;
                            _logger.LogInformation("[Step 4B.3] Menu {MenuName} has view permission", menu.strName);
                        }
                        else
                        {
                            _logger.LogInformation("[Step 4B.4] Menu {MenuName} lacks view permission", menu.strName);
                            continue;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[Step 4B.ERROR] Error checking rights for menu {MenuName}", menu.strName);
                        continue;
                    }
                }

                if (!includeMenu)
                {
                    _logger.LogInformation("[Step 5] Skipping menu {MenuName} due to permissions", menu.strName);
                    continue;
                }

                // Step 6: Create menu node and add to tree
                includedCount++;
                var menuNode = new MenuTreeDto
                {
                    strMapKey = menu.strMapKey,
                    strName = menu.strName,
                    strPath = menu.strPath,
                    strIconName = menu.strIconName ?? string.Empty,
                    bolHasSubMenu = menu.bolHasSubMenu,
                    bolIsSingleMenu = menu.bolIsSingleMenu,
                    strMenuPosition = menu.strMenuPosition,
                    dblSeqNo = menu.dblSeqNo,
                    permission = permission,
                    children = new List<MenuTreeDto>()
                };

                // Step 7: Check for children
                var hasChildren = allMenus.Any(m => m.strParentMenuGUID == menu.strMenuGUID);
                
                _logger.LogInformation("[Step 7] Menu {MenuName} has children: {HasChildren}", 
                    menu.strName, hasChildren);
                
                // Step 8: If it has children, recursively get them
                if (hasChildren)
                {
                    _logger.LogInformation("[Step 8] Getting children for menu {MenuName}", menu.strName);
                    
                    menuNode.children = await BuildMenuTreeAsync(allMenus, menu.strMenuGUID, roleGuid, isSuperAdmin);
                    
                    _logger.LogInformation("[Step 9] Retrieved {ChildCount} visible children for menu {MenuName}", 
                        menuNode.children.Count, menu.strName);
                    
                    // Update bolHasSubMenu based on actual children
                    menuNode.bolHasSubMenu = menuNode.children.Any();
                    
                    if (!menuNode.bolHasSubMenu)
                    {
                        _logger.LogInformation("[Step 9.1] Menu {MenuName} has no visible children", menu.strName);
                    }
                }

                menuTree.Add(menuNode);
                _logger.LogInformation("[Step 10] Added menu {MenuName} to menu tree", menu.strName);
            }

            _logger.LogInformation("[Step 11] Processed {Total} menus, included {Included} in tree for parent {ParentGuid}", 
                processedCount, includedCount, parentMenuGuid?.ToString() ?? "root");
                
            return menuTree;
        }

        [HttpPost]
        [AuthorizePermission("user_rights_form", PermissionType.CanSave, "UserRights")]
        public async Task<IActionResult> CreateUserRights([FromBody] UserRightsCreateDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Validation failed",
                        errors = errors
                    });
                }

                var result = await _userRightsService.CreateUserRightsAsync(request);
                return CreatedAtAction(nameof(GetUserRights), new { id = result.strUserRightGUID }, new
                {
                    statusCode = 201,
                    message = "User rights created successfully",
                    data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while creating user rights" });
            }
        }

        [HttpGet("{guid}")]
        [AuthorizePermission("user_rights_form", PermissionType.CanView, "UserRights")]
        public async Task<ActionResult<ApiResponse<UserRightsResponseDto>>> GetUserRights(Guid guid)
        {
            var userRights = await _userRightsService.GetUserRightsByIdAsync(guid);
            if (userRights == null)
                return NotFound(ApiResponse<UserRightsResponseDto>.Fail(404, $"User rights with GUID {guid} not found"));

            return Ok(ApiResponse<UserRightsResponseDto>.Success(userRights, "User rights retrieved successfully"));
        }

        [HttpPut("{guid}")]
        [AuthorizePermission("user_rights_form", PermissionType.CanEdit, "UserRights")]
        public async Task<ActionResult<ApiResponse<UserRightsResponseDto>>> UpdateUserRights(Guid guid, [FromBody] UserRightsCreateDto userRightsDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<UserRightsResponseDto>.Fail(400, "Invalid request data"));

            var userRights = await _userRightsService.UpdateUserRightsAsync(guid, userRightsDto);
            if (userRights == null)
                return NotFound(ApiResponse<UserRightsResponseDto>.Fail(404, $"User rights with GUID {guid} not found"));

            return Ok(ApiResponse<UserRightsResponseDto>.Success(userRights, "User rights updated successfully"));
        }

        [HttpDelete("{guid}")]
        [AuthorizePermission("user_rights_form", PermissionType.CanDelete, "UserRights")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteUserRights(Guid guid)
        {
            return await SafeDeleteAsync(
                guid, 
                "User Rights", 
                async (id) => await _userRightsService.DeleteUserRightsAsync(id));
        }

        [HttpGet]
        [AuthorizePermission("user_privilege", PermissionType.CanView, "UserRights")]
        public async Task<IActionResult> GetAllUserRights(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true,
            [FromQuery] string? strRoleGUID = null)
        {
            try
            {
                if (pageNumber < 1 || pageSize < 1)
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Page number and page size must be greater than 0"
                    });
                }

                var filterDto = new UserRightsFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    Search = search,
                    SortBy = sortBy,
                    ascending = ascending,
                    strUserRoleGUID = !string.IsNullOrEmpty(strRoleGUID) ? GuidHelper.ToNullableGuid(strRoleGUID) : null
                };

                var result = await _userRightsService.GetAllUserRightsAsync(filterDto);
                
                return Ok(new
                {
                    statusCode = 200,
                    message = "User rights retrieved successfully",
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
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user rights");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving user rights" });
            }
        }

 [HttpGet("role")]
[Authorize]
public async Task<IActionResult> GetUserRightsByRole()
{
    try
    {
        _logger.LogInformation("GetUserRightsByRole endpoint called");
        
        // Step 1: Get user GUID from token and check if user exists
        var userGuid = User?.FindFirst("strUserGUID")?.Value;

        if (string.IsNullOrEmpty(userGuid))
            return BadRequest(new { statusCode = 400, message = "User identifier not found in token" });

        var user = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == GuidHelper.ToGuid(userGuid));
        if (user == null)
            return BadRequest(new { statusCode = 400, message = "User not found" });

        // Step 2: Handle super admin flow - no organization/year required
        if (user.bolIsSuperAdmin)
        {
            // Get only Master Menus for super admin users where bolSuperAdminAccess is true
            var masterMenus = await _context.MstMasterMenus
                .Where(m => m.bolIsActive && m.bolSuperAdminAccess)
                .ToListAsync();
                
            // Convert MstMasterMenu to MstMenu format to be compatible with BuildMenuTreeAsync
            var masterMenusAsMenus = masterMenus.Select(mm => new MstMenu
            {
                strMenuGUID = mm.strMasterMenuGUID,
                strParentMenuGUID = mm.strParentMenuGUID,
                strModuleGUID = mm.strModuleGUID,
                dblSeqNo = mm.dblSeqNo,
                strName = mm.strName,
                strPath = mm.strPath,
                strMenuPosition = mm.strMenuPosition,
                bolHasSubMenu = mm.bolHasSubMenu,
                bolIsSingleMenu = mm.bolIsSingleMenu,
                strIconName = mm.strIconName,
                bolIsActive = mm.bolIsActive,
                strMapKey = mm.strMapKey,
                bolSuperAdminAccess = mm.bolSuperAdminAccess
            }).ToList();
            
            var superAdminMenuTree = await BuildMenuTreeAsync(masterMenusAsMenus, null, null, true);
            
            return Ok(new
            {
                statusCode = 200,
                message = "Master Menu tree retrieved for Super Admin",
                data = superAdminMenuTree
            });
        }
        
        // Step 3: For normal users - get module, organization, year, and group from token
        var organizationGuid = User?.FindFirst("strOrganizationGUID")?.Value;
        var yearGuid = User?.FindFirst("strYearGUID")?.Value;
        var moduleGuid = User?.FindFirst("strModuleGUID")?.Value;
        var groupGuid = User?.FindFirst("strGroupGUID")?.Value;

        _logger.LogInformation("Processing user rights request for User: {UserGuid}, Module: {ModuleGuid}, Organization: {OrgGuid}, Year: {YearGuid}, Group: {GroupGuid}",
            userGuid, moduleGuid, organizationGuid, yearGuid, groupGuid ?? "not provided");

        if (string.IsNullOrEmpty(organizationGuid) || string.IsNullOrEmpty(yearGuid) || string.IsNullOrEmpty(moduleGuid))
            return BadRequest(new { statusCode = 400, message = "Module, Organization and Year are required" });
            
        // Validate group if provided
        if (!string.IsNullOrEmpty(groupGuid))
        {
            var groupGuidParsed = Guid.TryParse(groupGuid, out var groupGuidObj) ? groupGuidObj : Guid.Empty;
            
            // Check if the group exists
            var groupExists = await _context.MstGroups
                .AsNoTracking()
                .AnyAsync(g => g.strGroupGUID == groupGuidParsed);
                
            if (!groupExists)
            {
                _logger.LogWarning("Group with GUID {GroupGuid} not found", groupGuid);
                return BadRequest(new { statusCode = 400, message = "Selected group not found" });
            }
        }
            
        // Step 4: Validate module, organization and year combination
        var organizationId = Guid.Parse(organizationGuid);
        var yearGuidParsed = Guid.TryParse(yearGuid, out var yearGuidObj) ? yearGuidObj : Guid.Empty;
        var moduleGuidParsed = Guid.TryParse(moduleGuid, out var moduleGuidObj) ? moduleGuidObj : Guid.Empty;
        
        // Validate that the module exists
        var module = await _context.MstModules
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.strModuleGUID == moduleGuidParsed && m.bolIsActive);
            
        if (module == null)
            return BadRequest(new { statusCode = 400, message = "Selected module not found or inactive" });
        
        var year = await _context.MstYears
            .AsNoTracking() // For better performance on read-only queries
            .FirstOrDefaultAsync(y => y.strYearGUID == yearGuidParsed && y.strOrganizationGUID == organizationId);

        if (year == null)
            return BadRequest(new { statusCode = 400, message = "Selected year not found for this organization" });

        // Step 5: Get user details for this module, organization, year and group (if provided)
        var userDetailsQuery = _context.MstUserDetails
            .AsNoTracking()
            .Where(ud =>
                ud.strUserGUID == GuidHelper.ToGuid(userGuid) &&
                ud.strOrganizationGUID == GuidHelper.ToGuid(organizationGuid) &&
                ud.strYearGUID == GuidHelper.ToGuid(yearGuid) &&
                ud.strModuleGUID == GuidHelper.ToGuid(moduleGuid));
                
        // Apply group filter if provided
        if (!string.IsNullOrEmpty(groupGuid))
        {
            userDetailsQuery = userDetailsQuery.Where(ud => ud.strGroupGUID == GuidHelper.ToGuid(groupGuid));
        }
        
        var userDetails = await userDetailsQuery.FirstOrDefaultAsync();

        if (userDetails == null)
            return BadRequest(new { statusCode = 400, message = "User details not found for this module, year, organization" + 
                (!string.IsNullOrEmpty(groupGuid) ? " and group" : "") });

        // Step 6: Get user role
        var userRole = await _context.MstUserRoles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.strUserRoleGUID == userDetails.strUserRoleGUID);

        if (userRole == null)
            return BadRequest(new { statusCode = 400, message = "User role not found" });

        // Step 7: Get active menus - filter by group from token if user is not super admin
        var menuQuery = _context.MstMenus
            .AsNoTracking()
            .Where(m => m.bolIsActive);
            
        // Apply group filter if group GUID is available and user is not a super admin
        if (!string.IsNullOrEmpty(groupGuid) && !user.bolIsSuperAdmin)
        {
            var groupGuidObj = Guid.Parse(groupGuid);
            // Include menus that match the group GUID or have null group GUID
            menuQuery = menuQuery.Where(m => m.strGroupGUID == groupGuidObj || m.strGroupGUID == null);
            _logger.LogInformation("Filtering menus by group GUID: {GroupGUID} or null group GUID", groupGuid);
        }
            
        var activeMenus = await menuQuery.ToListAsync();

        if (!activeMenus.Any())
            return Ok(new { statusCode = 200, message = "No active menus found", data = new List<MenuTreeDto>() });

        // Step 8: Build menu tree for user based on role permissions
        var menuTree = await BuildMenuTreeAsync(
            activeMenus,
            null,
            userDetails.strUserRoleGUID,
            false
        );

        // Return just the menu tree without additional info
        return Ok(new
        {
            statusCode = 200,
            message = "Menu tree retrieved successfully",
            data = menuTree
        });
    }
    catch (Exception ex)
    {
        var moduleGuid = User?.FindFirst("strModuleGUID")?.Value ?? "unknown";
        var userGroupGuid = User?.FindFirst("strGroupGUID")?.Value ?? "not provided";
        _logger.LogError(ex, "Error retrieving user rights by role for module {ModuleGUID}, group {GroupGUID}", moduleGuid, userGroupGuid);
        return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving menu structure" });
    }
}

        [HttpGet("tree")]
        [AuthorizePermission("user_privilege", PermissionType.CanView, "UserRights")]
        public async Task<IActionResult> GetUserRightsTree(
            [FromQuery] string? strRoleGUID = null,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] bool ascending = true,
            [FromQuery] string? strModuleGUID = null)
        {
            try
            {
                _logger.LogInformation("Retrieving menu tree for role GUID: {RoleGUID}, Module GUID: {ModuleGUID}", 
                    strRoleGUID ?? "not provided", strModuleGUID ?? "from token");

                // Check if the user is a super admin
                var userGuid = User?.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuid))
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "User identifier not found in token"
                    });
                }

                var user = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == GuidHelper.ToGuid(userGuid));
                if (user == null)
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "User not found"
                    });
                }

                bool isSuperAdmin = user.bolIsSuperAdmin;
                
                // Get module GUID from token if not provided as a query parameter
                if (string.IsNullOrEmpty(strModuleGUID))
                {
                    strModuleGUID = User?.FindFirst("strModuleGUID")?.Value;
                    _logger.LogInformation("Using module GUID from token: {ModuleGUID}", strModuleGUID ?? "not found");
                }
                
                // Get group GUID from token
                var strGroupGUID = User?.FindFirst("strGroupGUID")?.Value;
                _logger.LogInformation("Using group GUID from token: {GroupGUID}", strGroupGUID ?? "not found");

                // Step 1: Retrieve all menus, filtering out super admin menus for non-super admin users
                var menuQuery = _context.MstMenus
                    .Where(m => m.bolIsActive)
                    .Where(m => isSuperAdmin || !m.bolSuperAdminAccess); // Only include superAdminAccess menus for super admins
                
                // Apply module filter if module GUID is available and user is not a super admin
                if (!string.IsNullOrEmpty(strModuleGUID) && !isSuperAdmin)
                {
                    var moduleGuid = Guid.Parse(strModuleGUID);
                    // Include menus that match the module GUID or have null module GUID
                    menuQuery = menuQuery.Where(m => m.strModuleGUID == moduleGuid || m.strModuleGUID == null);
                    _logger.LogInformation("Filtering menus by module GUID: {ModuleGUID} or null module GUID", strModuleGUID);
                }
                
                // Apply group filter if group GUID is available and user is not a super admin
                if (!string.IsNullOrEmpty(strGroupGUID) && !isSuperAdmin)
                {
                    var groupGuid = Guid.Parse(strGroupGUID);
                    // Include menus that match the group GUID or have null group GUID
                    menuQuery = menuQuery.Where(m => m.strGroupGUID == groupGuid || m.strGroupGUID == null);
                    _logger.LogInformation("Filtering menus by group GUID: {GroupGUID} or null group GUID", strGroupGUID);
                }

                // Apply search if provided
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchTerm = search.ToLower();
                    menuQuery = menuQuery.Where(m => m.strName.ToLower().Contains(searchTerm));
                }

                var allMenus = await menuQuery.ToListAsync();

                if (!allMenus.Any())
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "No active menus found",
                        data = new
                        {
                            Items = new List<MenuUserRightsTreeDto>(),
                            TotalCount = 0
                        }
                    });
                }

                // Step 2: Get user rights for the specified role, if any
                string? roleName = null;
                if (!string.IsNullOrEmpty(strRoleGUID))
                {
                    var role = await _context.MstUserRoles
                        .FirstOrDefaultAsync(r => r.strUserRoleGUID == GuidHelper.ToGuid(strRoleGUID));
                    roleName = role?.strName;
                }

                // Step 3: Build the menu tree
                var menuTree = await BuildMenuUserRightsTreeAsync(allMenus, null, strRoleGUID != null ? GuidHelper.ToNullableGuid(strRoleGUID) : null, isSuperAdmin, roleName);

                // Step 4: Group items by category into a dictionary
                var categoryGroups = menuTree
                    .GroupBy(item => item.strCategory)
                    .ToDictionary(group => group.Key, group => group.ToList());

                return Ok(new
                {
                    statusCode = 200,
                    message = "Menu tree retrieved successfully",
                    data = new
                    {
                        Items = categoryGroups, // Return items grouped by category directly
                        TotalCount = menuTree.Count
                    }
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user rights tree");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving menu tree" });
            }
        }

        private int CountTreeItems(List<MenuUserRightsTreeDto> tree)
        {
            int count = tree.Count;
            foreach (var item in tree)
            {
                if (item.children != null && item.children.Any())
                {
                    count += CountTreeItems(item.children);
                }
            }
            return count;
        }

        private async Task<List<MenuUserRightsTreeDto>> BuildMenuUserRightsTreeAsync(
            IEnumerable<MstMenu> allMenus, 
            Guid? parentMenuGuid, 
            Guid? roleGuid, 
            bool isSuperAdmin,
            string? roleName = null)
        {
            var result = new List<MenuUserRightsTreeDto>();
            
            // Get direct children of the parent
            // Note: We've already filtered out super admin menus in the main method
            var childMenus = allMenus
                .Where(m => m.strParentMenuGUID == parentMenuGuid)
                .OrderBy(m => m.dblSeqNo)
                .ToList();
                
            foreach (var menu in childMenus)
            {
                // Get user rights for this menu and role if available
                MstUserRights? userRights = null;
                if (roleGuid.HasValue)
                {
                    userRights = await _context.MstUserRights
                        .FirstOrDefaultAsync(r => r.strUserRoleGUID == roleGuid.Value && r.strMenuGUID == menu.strMenuGUID);
                }
                
                // Get page template for this menu if available
                MstPageTemplate? pageTemplate = null;
                if (menu.strPageTemplateGUID.HasValue)
                {
                    pageTemplate = await _context.MstPageTemplates
                        .FirstOrDefaultAsync(pt => pt.strPageTemplateGUID == menu.strPageTemplateGUID);
                }
                
                // Create tree node
                var treeNode = new MenuUserRightsTreeDto
                {
                    strUserRightGUID = userRights?.strUserRightGUID.ToString() ?? string.Empty,
                    strUserRoleGUID = roleGuid.HasValue ? roleGuid.Value.ToString() : string.Empty,
                    strMenuGUID = menu.strMenuGUID.ToString(),
                    bolCanView = userRights?.bolCanView ?? false,
                    bolCanEdit = userRights?.bolCanEdit ?? false,
                    bolCanSave = userRights?.bolCanSave ?? false,
                    bolCanDelete = userRights?.bolCanDelete ?? false,
                    bolCanPrint = userRights?.bolCanPrint ?? false,
                    bolCanExport = userRights?.bolCanExport ?? false,
                    bolCanImport = userRights?.bolCanImport ?? false,
                    bolCanApprove = userRights?.bolCanApprove ?? false,
                    // Set new fields from page template
                    bolIsView = pageTemplate?.bolIsView ?? false,
                    bolIsEdit = pageTemplate?.bolIsEdit ?? false,
                    bolIsSave = pageTemplate?.bolIsSave ?? false,
                    bolIsDelete = pageTemplate?.bolIsDelete ?? false,
                    bolIsPrint = pageTemplate?.bolIsPrint ?? false,
                    bolIsExport = pageTemplate?.bolIsExport ?? false,
                    bolIsImport = pageTemplate?.bolIsImport ?? false,
                    bolIsApprove = pageTemplate?.bolIsApprove ?? false,
                    strUserRoleName = roleName ?? string.Empty,
                    strMenuName = menu.strName,
                    strCategory = menu.strCategory ?? "Uncategorized" // Include the menu's category, defaulting to "Uncategorized"
                };
                
                // Recursively get children
                treeNode.children = await BuildMenuUserRightsTreeAsync(
                    allMenus, 
                    menu.strMenuGUID, 
                    roleGuid, 
                    isSuperAdmin,
                    roleName);
                
                result.Add(treeNode);
            }
            
            return result;
        }

        // MenuUserRightsTreeDto class to represent the tree structure
        public class MenuUserRightsTreeDto
        {
            public string strUserRightGUID { get; set; } = string.Empty;
            public string strUserRoleGUID { get; set; } = string.Empty;
            public string strMenuGUID { get; set; } = string.Empty;
            public bool bolCanView { get; set; }
            public bool bolCanEdit { get; set; }
            public bool bolCanSave { get; set; }
            public bool bolCanDelete { get; set; }
            public bool bolCanPrint { get; set; }
            public bool bolCanExport { get; set; }
            public bool bolCanImport { get; set; }
            public bool bolCanApprove { get; set; }
            // New fields from page template
            public bool bolIsView { get; set; }
            public bool bolIsEdit { get; set; }
            public bool bolIsSave { get; set; }
            public bool bolIsDelete { get; set; }
            public bool bolIsPrint { get; set; }
            public bool bolIsExport { get; set; }
            public bool bolIsImport { get; set; }
            public bool bolIsApprove { get; set; }
            public string strUserRoleName { get; set; } = string.Empty;
            public string strMenuName { get; set; } = string.Empty;
            public string strCategory { get; set; } = string.Empty;
            public List<MenuUserRightsTreeDto> children { get; set; } = new List<MenuUserRightsTreeDto>();
        }

        [HttpGet("user-organization")]
        [Authorize]
        public async Task<IActionResult> GetUserOrganization()
        {
            try
            {
                // Get user GUID and module GUID from token
                var userGuid = User?.FindFirst("strUserGUID")?.Value;
                var moduleGuid = User?.FindFirst("strModuleGUID")?.Value;
                
                if (string.IsNullOrEmpty(userGuid))
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "User identifier not found in token"
                    });
                }

                // Log the module filter being applied
                _logger.LogInformation("GetUserOrganization called with userGuid: {UserGuid}, moduleGuid: {ModuleGuid}", 
                    userGuid, moduleGuid ?? "null");

                // Get all user details for this user with module filter if provided
                var userDetailsQuery = _context.MstUserDetails
                    .Where(ud => ud.strUserGUID == GuidHelper.ToGuid(userGuid) && ud.bolIsActive);
                    
                // Apply module filter if module GUID is provided
                if (!string.IsNullOrEmpty(moduleGuid))
                {
                    userDetailsQuery = userDetailsQuery.Where(ud => ud.strModuleGUID == GuidHelper.ToNullableGuid(moduleGuid));
                    _logger.LogInformation("Filtering organizations by moduleGuid: {ModuleGuid}", moduleGuid);
                }
                
                var userDetailsList = await userDetailsQuery.ToListAsync();
                
                if (userDetailsList == null || !userDetailsList.Any())
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "User details not found"
                    });
                }

                // Get all organization GUIDs from user details
                var organizationGuids = userDetailsList.Select(ud => ud.strOrganizationGUID).Distinct().ToList();

                // Get all organizations
                var organizations = await _context.MstOrganizations
                    .Where(o => organizationGuids.Contains(o.strOrganizationGUID) && o.bolIsActive)
                    .Select(o => new
                    {
                        strOrganizationGUID = o.strOrganizationGUID,
                        strOrganizationName = o.strOrganizationName
                    })
                    .ToListAsync();

                if (organizations == null || !organizations.Any())
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Organizations not found"
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "User organizations retrieved successfully",
                    data = organizations
                });
            }
            catch (BusinessException ex)
            {
                return NotFound(new { statusCode = 404, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving user organizations", error = ex.Message });
            }
        }

        [HttpPost("switch-organization")]
        [Authorize]
        public async Task<IActionResult> SwitchOrganization([FromBody] OrganizationSelectionRequestDto request)
        {
            try
            {
                // Get user GUID from token
                var userGuid = User?.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuid))
                {
                    _logger.LogWarning("User identifier not found in token during SwitchOrganization");
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "User identifier not found in token"
                    });
                }

                _logger.LogInformation("SwitchOrganization called for User: {UserGuid}, Organization: {OrgGuid}, Year: {YearGuid}",
                    userGuid, request.strOrganizationGUID, request.strYearGUID ?? "null");

                // Call the auth service to switch organization
                var result = await _authService.SwitchOrganizationAsync(
                    GuidHelper.ToGuid(userGuid), 
                    GuidHelper.ToGuid(request.strOrganizationGUID), 
                    !string.IsNullOrEmpty(request.strYearGUID) ? GuidHelper.ToNullableGuid(request.strYearGUID) : null);

                // Prepare cookies (only refresh token) and response token
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTime.UtcNow.AddDays(7)
                };

                if (!string.IsNullOrEmpty(result.Token))
                {
                    _logger.LogInformation("Encrypting token for response (no access token cookie)");
                    var encryptedToken = _authService.EncryptToken(result.Token);
                    
                    // Only set the refresh token in a cookie
                    if (!string.IsNullOrEmpty(result.RefreshToken))
                    {
                        _logger.LogInformation("Storing refresh token in cookie");
                        HttpContext.Response.Cookies.Append("RefreshToken", result.RefreshToken, cookieOptions);
                    }
                    
                    _logger.LogInformation("Organization switched successfully for User: {UserGuid} to Organization: {OrgGuid}",
                        userGuid, request.strOrganizationGUID);

                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Organization switched successfully",
                        data = new
                        {
                            strUserGUID = result.strUserGUID,
                            strEmailId = result.strEmailId,
                            strName = result.strName,
                            strGroupGUID = result.strGroupGUID,
                            strOrganizationGUID = result.strLastOrganizationGUID,
                            strRoleGUID = result.strRoleGUID,
                            token = encryptedToken
                            // RefreshToken is set in cookie, not returned in response
                        }
                    });
                }
                else
                {
                    _logger.LogWarning("No token returned from SwitchOrganizationAsync");
                    
                    _logger.LogInformation("Organization switched successfully for User: {UserGuid} to Organization: {OrgGuid}",
                        userGuid, request.strOrganizationGUID);

                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Organization switched successfully",
                        data = new
                        {
                            strUserGUID = result.strUserGUID,
                            strEmailId = result.strEmailId,
                            strName = result.strName,
                            strGroupGUID = result.strGroupGUID,
                            strOrganizationGUID = result.strLastOrganizationGUID,
                            strRoleGUID = result.strRoleGUID,
                            token = string.Empty
                            // RefreshToken is set in cookie, not returned in response
                        }
                    });
                }
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business exception during organization switch");
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error switching organization");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while switching organization", error = ex.Message });
            }
        }

        [HttpPost("switch-module")]
        [Authorize]
        public async Task<IActionResult> SwitchModule([FromBody] ModuleSelectionRequestDto request)
        {
            try
            {
                // Get user GUID from token
                var userGuid = User?.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuid))
                {
                    _logger.LogWarning("User identifier not found in token during SwitchModule");
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "User identifier not found in token"
                    });
                }

                // Check if the module exists
                var module = await _context.MstModules
                    .FirstOrDefaultAsync(m => m.strModuleGUID.ToString() == request.strModuleGUID);
                    
                if (module == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Module not found"
                    });
                }

                _logger.LogInformation("SwitchModule called for User: {UserGuid}, Module: {ModuleGuid}",
                    userGuid, request.strModuleGUID);

                // Find user info for this module to get the last organization and year
                var userInfo = await _context.MstUserInfos
                    .FirstOrDefaultAsync(ui => 
                        ui.strUserGUID == GuidHelper.ToGuid(userGuid) && 
                        ui.strModuleGUID == GuidHelper.ToNullableGuid(request.strModuleGUID));

                // Get the current values from the token
                var currentOrgGuid = User?.FindFirst("strOrganizationGUID")?.Value;
                var currentYearGuid = User?.FindFirst("strYearGUID")?.Value;
                
                // If userInfo exists, use its organization and year, otherwise keep the current ones
                string? organizationGuid = userInfo?.strLastOrganizationGUID.ToString() ?? currentOrgGuid;
                string? yearGuid = userInfo?.strLastYearGUID.ToString() ?? currentYearGuid;

                // Update user record with the new module
                var user = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strUserGUID == GuidHelper.ToGuid(userGuid));
                    
                if (user == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "User not found"
                    });
                }
                
                // Update the last module GUID
                user.strLastModuleGUID = GuidHelper.ToNullableGuid(request.strModuleGUID);
                
                // No need to insert into MstUserInfos as data is already being taken care of elsewhere
                
                await _context.SaveChangesAsync();
                
                // Now generate new tokens with the updated module, organization, and year
                string? groupGuidString = User?.FindFirst("strGroupGUID")?.Value;
                
                // Convert string GUIDs to Guid objects
                Guid? groupGuid = groupGuidString != null ? GuidHelper.ToNullableGuid(groupGuidString) : null;
                // Convert string GUIDs to Guid objects for database comparison
                Guid userGuidValue = GuidHelper.ToGuid(userGuid);
                Guid organizationGuidValue = GuidHelper.ToGuid(organizationGuid!);
                Guid? yearGuidValue = yearGuid != null ? GuidHelper.ToNullableGuid(yearGuid) : null;
                Guid? moduleGuidValue = !string.IsNullOrEmpty(request.strModuleGUID) ? GuidHelper.ToNullableGuid(request.strModuleGUID) : null;
                Guid? groupGuidValue = !string.IsNullOrEmpty(groupGuidString) ? GuidHelper.ToNullableGuid(groupGuidString) : null;
                
                // Get the correct role GUID from MstUserDetails based on the current context
                // Using direct GUID comparison that EF Core can translate to SQL
                var userDetails = await _context.MstUserDetails
                    .AsNoTracking()
                    .Where(ud => 
                        ud.strUserGUID == userGuidValue &&
                        ud.strOrganizationGUID == organizationGuidValue &&
                        (yearGuidValue == null || ud.strYearGUID == yearGuidValue) &&
                        (moduleGuidValue == null || ud.strModuleGUID == moduleGuidValue) &&
                        (groupGuidValue == null || ud.strGroupGUID == groupGuidValue))
                    .FirstOrDefaultAsync();
                
                Guid? roleGuid = userDetails?.strUserRoleGUID;
                string? roleGuidString = roleGuid?.ToString();
                
                // Log the role resolution for debugging
                if (roleGuid != null && roleGuid != Guid.Empty)
                {
                    _logger.LogInformation("Using role GUID from MstUserDetails for module switch: {RoleGuid}", roleGuidString);
                }
                
                // No fallback to token - if no role found, it's an error that needs to be fixed in data
                if (roleGuid == null || roleGuid == Guid.Empty)
                {
                    _logger.LogWarning("No role GUID found in MstUserDetails for module switch. User: {UserGuid}, Organization: {OrgGuid}, Year: {YearGuid}, Module: {ModuleGuid}, Group: {GroupGuid}", 
                        userGuid, organizationGuid, yearGuid, request.strModuleGUID, groupGuidString);
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Role information not found for this module in the current organization. Please contact your administrator to assign proper module permissions."
                    });
                }
                
                if (groupGuid == null)
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Group information not found in user details"
                    });
                }
                
                // Call auth service to generate new tokens
                var userEmail = User?.FindFirst("strEmailId")?.Value;
                
                if (string.IsNullOrEmpty(userEmail))
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "User email not found in token"
                    });
                }

                // Get the user's timezone
                var userTimeZone = user.strTimeZone;
                (string newToken, string newRefreshToken) = await _authService.GenerateTokensAsync(
                    userEmail,
                    groupGuid,
                    organizationGuidValue,
                    roleGuid.Value, // We've already validated it's not null above
                    userGuidValue,
                    yearGuidValue,
                    moduleGuidValue
                );
                
                // Prepare cookies (only refresh token) and response token
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTime.UtcNow.AddDays(7)
                };

                if (!string.IsNullOrEmpty(newToken))
                {
                    _logger.LogInformation("Encrypting token for response (no access token cookie)");
                    var encryptedToken = _authService.EncryptToken(newToken);
                    
                    // Only set the refresh token in a cookie
                    if (!string.IsNullOrEmpty(newRefreshToken))
                    {
                        _logger.LogInformation("Storing refresh token in cookie");
                        HttpContext.Response.Cookies.Append("RefreshToken", newRefreshToken, cookieOptions);
                    }
                    
                    // Use the encrypted token for the response
                    var encryptedTokenForResponse = encryptedToken;
                    
                    // Get user information to return in response
                    var userName = User?.FindFirst("strName")?.Value;

                    _logger.LogInformation("Module switched successfully for User: {UserGuid} to Module: {ModuleGuid}",
                        userGuid, request.strModuleGUID);

                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Module switched successfully",
                        data = new
                        {
                            strUserGUID = userGuid,
                            strEmailId = userEmail,
                            strName = userName,
                            strGroupGUID = groupGuid,
                            strModuleGUID = request.strModuleGUID,
                            strOrganizationGUID = organizationGuid,
                            strYearGUID = yearGuid,
                            strRoleGUID = roleGuid.Value, // We've already validated it's not null above
                            token = encryptedTokenForResponse
                            // RefreshToken is set in cookie, not returned in response
                        }
                    });
                }
                else
                {
                    _logger.LogWarning("No token generated during module switch");
                    
                    // Get user information to return in response
                    var userName = User?.FindFirst("strName")?.Value;

                    _logger.LogInformation("Module switched successfully for User: {UserGuid} to Module: {ModuleGuid}",
                        userGuid, request.strModuleGUID);

                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Module switched successfully",
                        data = new
                        {
                            strUserGUID = userGuid,
                            strEmailId = userEmail,
                            strName = userName,
                            strGroupGUID = groupGuid,
                            strModuleGUID = request.strModuleGUID,
                            strOrganizationGUID = organizationGuid,
                            strYearGUID = yearGuid,
                            strRoleGUID = roleGuid.Value, // We've already validated it's not null above
                            token = string.Empty
                            // RefreshToken is set in cookie, not returned in response
                        }
                    });
                }
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning(ex, "Business exception during module switch");
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error switching module");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while switching module", error = ex.Message });
            }
        }

        [HttpPost("batch")]
        [AuthorizePermission("user_privilege", PermissionType.CanSave, "UserRights")]
        public async Task<IActionResult> BatchUpsertUserRights([FromBody] UserRightsBatchRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Validation failed",
                        Data = new { errors }
                    });
                }

                if (request.UserRights == null || !request.UserRights.Any())
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "No user rights provided"
                    });
                }

                var result = await _userRightsService.BatchUpsertUserRightsAsync(request.UserRights);

                return Ok(new ApiResponse<UserRightsBatchResponseDto>
                {
                    statusCode = 200,
                    Message = "User rights processed successfully",
                    Data = result
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new ApiResponse<object>
                {
                    statusCode = 400,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing batch user rights");
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = "An error occurred while processing user rights"
                });
            }
        }

        [HttpGet("user-module")]
        [Authorize]
        public async Task<IActionResult> GetUserModules()
        {
            try
            {
                _logger.LogInformation("GetUserModules endpoint called");

                // Step 1: Get user GUID from token
                var userGuidStr = User?.FindFirst("strUserGUID")?.Value;

                if (string.IsNullOrEmpty(userGuidStr))
                    return BadRequest(new { statusCode = 400, message = "User identifier not found in token" });

                if (!Guid.TryParse(userGuidStr, out var userGuid))
                    return BadRequest(new { statusCode = 400, message = "Invalid user GUID format" });

                // Step 2: Get user details to check if super admin
                var user = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == userGuid);
                if (user == null)
                    return BadRequest(new { statusCode = 400, message = "User not found" });

                List<object> modules;

                if (user.bolIsSuperAdmin)
                {
                    // Step 3A: Super admin - get all active modules
                    _logger.LogInformation("User is super admin, retrieving all active modules");
                    modules = await _context.MstModules
                        .Where(m => m.bolIsActive)
                        .Select(m => new
                        {
                            strModuleGUID = m.strModuleGUID,
                            strModuleName = m.strName,
                            strDesc = m.strDesc,
                            strImagePath = m.strImagePath
                        })
                        .Cast<object>()
                        .ToListAsync();
                }
                else
                {
                    // Step 3B: Regular user - get assigned modules
                    _logger.LogInformation("User is regular user, retrieving assigned modules");
                    modules = await _context.MstUserDetails
                        .Where(ud => ud.strUserGUID == userGuid && ud.strModuleGUID != null)
                        .Join(_context.MstModules,
                              ud => ud.strModuleGUID,
                              m => m.strModuleGUID,
                              (ud, m) => new
                              {
                                  strModuleGUID = m.strModuleGUID,
                                  strModuleName = m.strName,
                                  strDesc = m.strDesc,
                                  strImagePath = m.strImagePath
                              })
                        .Distinct()
                        .Cast<object>()
                        .ToListAsync();
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "User modules retrieved successfully",
                    data = modules
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user modules");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving user modules", error = ex.Message });
            }
        }
    }

    // DTOs for menu tree
    public class MenuTreeDto
    {
        [JsonPropertyName("strMapKey")]
        public string strMapKey { get; set; } = string.Empty;
        
        [JsonPropertyName("strName")]
        public string strName { get; set; } = string.Empty;
        
        [JsonPropertyName("strPath")]
        public string strPath { get; set; } = string.Empty;
        
        [JsonPropertyName("strIconName")]
        public string strIconName { get; set; } = string.Empty;
        
        [JsonPropertyName("bolHasSubMenu")]
        public bool bolHasSubMenu { get; set; }

        [JsonPropertyName("bolIsSingleMenu")]
        public bool bolIsSingleMenu { get; set; }
        
        [JsonPropertyName("strMenuPosition")]
        public string strMenuPosition { get; set; } = string.Empty;
        
        [JsonPropertyName("dblSeqNo")]
        public double dblSeqNo { get; set; }
        
        [JsonPropertyName("permission")]
        public DTOs.Common.PermissionDto permission { get; set; } = new DTOs.Common.PermissionDto();
        
        [JsonPropertyName("children")]
        public List<MenuTreeDto> children { get; set; } = new List<MenuTreeDto>();
    }

}


