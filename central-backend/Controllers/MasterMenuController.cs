 using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AuditSoftware.DTOs.MasterMenu;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using Microsoft.Extensions.Logging;
using AuditSoftware.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Collections.Generic;
using AutoMapper;
using AuditSoftware.Services;

namespace AuditSoftware.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MasterMenuController : BaseDeletionController<Models.Entities.MstMasterMenu>
    {
        private readonly IMasterMenuService _masterMenuService;
        private new readonly ILogger<MasterMenuController> _logger;
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MasterMenuController(
            IMasterMenuService masterMenuService, 
            ILogger<MasterMenuController> logger,
            IDeleteValidationService deleteValidationService,
            ILogger<BaseDeletionController<Models.Entities.MstMasterMenu>> baseLogger,
            AppDbContext context,
            IMapper mapper)
            : base(deleteValidationService, baseLogger)
        {
            _masterMenuService = masterMenuService ?? throw new ArgumentNullException(nameof(masterMenuService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        [HttpGet("{guid}")]
        public async Task<IActionResult> GetMasterMenuById(Guid guid)
        {
            try
            {
                var result = await _masterMenuService.GetMasterMenuByIdAsync(guid);
                if (result == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = $"Master Menu with GUID {guid} not found"
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Master Menu retrieved successfully",
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
                    message = "An error occurred while retrieving master menu"
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMasterMenu([FromBody] MasterMenuCreateDto masterMenuDto)
        {
            try
            {
                var result = await _masterMenuService.CreateMasterMenuAsync(masterMenuDto);
                return CreatedAtAction(nameof(GetMasterMenuById), new { guid = Guid.Parse(result.strMasterMenuGUID) }, new
                {
                    statusCode = 201,
                    message = "Master Menu created successfully",
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
                    message = "An error occurred while creating master menu"
                });
            }
        }

        [HttpPut("{guid}")]
        public async Task<IActionResult> UpdateMasterMenu(Guid guid, [FromBody] MasterMenuCreateDto masterMenuDto)
        {
            try
            {
                var result = await _masterMenuService.UpdateMasterMenuAsync(guid, masterMenuDto);
                if (result == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = $"Master Menu with GUID {guid} not found"
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Master Menu updated successfully",
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
                    message = "An error occurred while updating master menu"
                });
            }
        }

        [HttpDelete("{guid}")]
        public async Task<IActionResult> DeleteMasterMenu(Guid guid)
        {
            return await SafeDeleteAsync(
                guid,
                "Master Menu",
                async (id) => await _masterMenuService.DeleteMasterMenuAsync(id));
        }

        [HttpGet]
        public async Task<IActionResult> GetAllMasterMenus(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = "dblSeqNo",
            [FromQuery] bool ascending = true,
            [FromQuery] string? search = null,
            [FromQuery] bool? bolIsActive = null,
            [FromQuery] string? strParentMenuGUID = null,
            [FromQuery] string? strPosition = null,
            [FromQuery] string? strCategory = null,
            [FromQuery] string? strPageTemplateGUID = null,
            [FromQuery] bool? bolIsSuperadmin = null)
        {
            try
            {
                var filter = new MasterMenuFilterDto
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    SortBy = sortBy,
                    ascending = ascending,
                    Search = search,
                    bolIsActive = bolIsActive,
                    strParentMenuGUID = strParentMenuGUID,
                    strPosition = strPosition,
                    strCategory = strCategory,
                    strPageTemplateGUID = strPageTemplateGUID,
                    bolIsSuperadmin = bolIsSuperadmin
                };

                var result = await _masterMenuService.GetAllMasterMenusAsync(filter);
                return Ok(new
                {
                    statusCode = 200,
                    message = "Master Menus retrieved successfully",
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
                    message = "An error occurred while retrieving master menus"
                });
            }
        }

        [HttpGet("by-group-module")]
        public async Task<IActionResult> GetMenusByGroupAndModule([FromQuery] string strGroupGUID, [FromQuery] string strModuleGUID)
        {
            try
            {
                if (string.IsNullOrEmpty(strGroupGUID))
                {
                    return BadRequest(new { statusCode = 400, message = "strGroupGUID is required" });
                }
                
                if (string.IsNullOrEmpty(strModuleGUID))
                {
                    return BadRequest(new { statusCode = 400, message = "strModuleGUID is required" });
                }
                
                // Parse GUIDs
                if (!Guid.TryParse(strGroupGUID, out Guid groupGuid))
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid strGroupGUID format" });
                }
                
                if (!Guid.TryParse(strModuleGUID, out Guid moduleGuid))
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid strModuleGUID format" });
                }

                // Check if group exists
                var groupExists = await _context.MstGroups.AnyAsync(g => g.strGroupGUID == groupGuid);
                if (!groupExists)
                {
                    return BadRequest(new { statusCode = 400, message = "Group not found" });
                }

                // Check if module exists
                var moduleExists = await _context.MstModules.AnyAsync(m => m.strModuleGUID == moduleGuid);
                if (!moduleExists)
                {
                    return BadRequest(new { statusCode = 400, message = "Module not found" });
                }

                // Query to get all master menus that match criteria and have bolSuperAdminAccess = false
                var masterMenusQuery = _context.MstMasterMenus
                    .Where(mm => mm.strModuleGUID == moduleGuid || mm.strModuleGUID == null)
                    .Where(mm => !mm.bolSuperAdminAccess) // Filter out super admin access menus
                    .OrderBy(mm => mm.dblSeqNo);

                var masterMenus = await masterMenusQuery.ToListAsync();

                // Get all menus for the specified group that have already been assigned
                var assignedMenus = await _context.MstMenus
                    .Where(m => m.strGroupGUID == groupGuid)
                    .ToListAsync();

                // First, build a dictionary of all menus for efficient parent lookup
                var menuDictionary = masterMenus.ToDictionary(m => m.strMasterMenuGUID);
                
                // Build the tree structure starting with root menus (those without a parent or with parent not in our filtered set)
                var rootMenus = masterMenus
                    .Where(m => m.strParentMenuGUID == null || !menuDictionary.ContainsKey(m.strParentMenuGUID.Value))
                    .ToList();

                var treeItems = new List<object>();
                
                foreach (var rootMenu in rootMenus)
                {
                    var menuTree = BuildMenuTree(rootMenu, masterMenus, assignedMenus, groupGuid);
                    treeItems.Add(menuTree);
                }
                
                return Ok(new
                {
                    statusCode = 200,
                    message = "Menus retrieved successfully",
                    data = new
                    {
                        items = treeItems,
                        totalCount = treeItems.Count
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting menus by group and module");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving menus"
                });
            }
        }
        
        /// <summary>
        /// Recursively builds a tree structure from the master menu hierarchy.
        /// </summary>
        /// <param name="menu">Current master menu to process</param>
        /// <param name="allMenus">All available master menus</param>
        /// <param name="assignedMenus">List of menus already assigned to the group</param>
        /// <param name="groupGuid">The group GUID for which the tree is built</param>
        /// <returns>A tree node representing the menu and its children</returns>
        private object BuildMenuTree(Models.Entities.MstMasterMenu menu, List<Models.Entities.MstMasterMenu> allMenus, List<Models.Entities.MstMenu> assignedMenus, Guid groupGuid)
        {
            // Find if this master menu is already assigned to the group
            var assignedMenu = assignedMenus.FirstOrDefault(m => m.strMasterMenuGUID == menu.strMasterMenuGUID);
            
            // Find children of this menu
            var children = allMenus
                .Where(m => m.strParentMenuGUID == menu.strMasterMenuGUID)
                .OrderBy(m => m.dblSeqNo)
                .ToList();
                
            // Map children recursively
            var childrenTree = new List<object>();
            foreach (var child in children)
            {
                childrenTree.Add(BuildMenuTree(child, allMenus, assignedMenus, groupGuid));
            }
            
            // Create tree node object with structure similar to UserRights/tree endpoint
            return new 
            {
                strMasterMenuGUID = menu.strMasterMenuGUID.ToString(),
                strParentMenuGUID = menu.strParentMenuGUID?.ToString(),
                strModuleGUID = menu.strModuleGUID?.ToString(),
                dblSeqNo = menu.dblSeqNo,
                strName = menu.strName,
                strPath = menu.strPath,
                strMenuPosition = menu.strMenuPosition,
                strMapKey = menu.strMapKey,
                bolHasSubMenu = menu.bolHasSubMenu || (childrenTree.Count > 0),
                strIconName = menu.strIconName,
                bolIsActive = menu.bolIsActive,
                bolIsSingleMenu = menu.bolIsSingleMenu,
                strGroupGUID = groupGuid.ToString(),
                strMenuGUID = assignedMenu?.strMenuGUID.ToString(),
                hasMenuRights = assignedMenu != null,
                bolRightGiven = !string.IsNullOrEmpty(assignedMenu?.strMenuGUID.ToString()),
                children = childrenTree
            };
        }

        [HttpGet("parent-menu")]
        [Authorize]
        public async Task<IActionResult> GetParentMasterMenus([FromQuery(Name = "strMasterMenuGUID")] string strMasterMenuGUID, [FromQuery] string? search = null)
        {
            try
            {
                if (string.IsNullOrEmpty(strMasterMenuGUID))
                {
                    _logger.LogWarning("Master Menu GUID is required but was not provided");
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Master Menu GUID is required"
                    });
                }

                // Parse masterMenuGUID to a Guid (now required)
                Guid excludeMasterMenuGuid;
                if (!Guid.TryParse(strMasterMenuGUID, out excludeMasterMenuGuid))
                {
                    _logger.LogWarning("Invalid strMasterMenuGUID format provided: {MasterMenuGuid}", strMasterMenuGUID);
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Invalid Master Menu GUID format"
                    });
                }
                
                _logger.LogInformation(
                    "Parent master menus request - Excluding master menu GUID: {MasterMenuGuid}",
                    excludeMasterMenuGuid.ToString());
                
                // Get active master menus that are not the specified one
                var query = _context.MstMasterMenus.Where(m => 
                    m.bolIsActive == true && 
                    m.strMasterMenuGUID != excludeMasterMenuGuid);
                
                // Apply search filter if provided
                if (!string.IsNullOrWhiteSpace(search))
                {
                    string searchLower = search.ToLower();
                    query = query.Where(m => 
                        m.strName.ToLower().Contains(searchLower) || 
                        (m.strPath != null && m.strPath.ToLower().Contains(searchLower)));
                    
                    _logger.LogInformation("Applying search filter to master menu: {SearchTerm}", search);
                }
                
                var masterMenus = await query
                    .Select(m => new
                    {
                        strMasterMenuGUID = m.strMasterMenuGUID.ToString(),
                        strName = m.strName,
                        strPath = m.strPath,
                        strMenuPosition = m.strMenuPosition,
                        dblSeqNo = m.dblSeqNo
                    })
                    .OrderBy(m => m.dblSeqNo)
                    .ToListAsync();

                if (masterMenus == null || !masterMenus.Any())
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "No parent master menus found",
                        data = new object[] { }
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Parent master menus retrieved successfully",
                    data = masterMenus,
                    totalCount = masterMenus.Count,
                    excludedMasterMenuGUID = excludeMasterMenuGuid.ToString(),
                    searchTerm = search
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving parent master menus");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving parent master menus",
                    error = ex.Message
                });
            }
        }

        [HttpGet("export")]
        [Authorize(Policy = "SuperAdminOnly")]
        public async Task<IActionResult> ExportMasterMenus([FromQuery] string format)
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

                var (fileContents, contentType, fileName) = await _masterMenuService.ExportMasterMenusAsync(format);

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
                _logger.LogError(ex, "Error occurred during master menu export");
                return StatusCode(500, new ApiResponse<object> 
                { 
                    statusCode = 500, 
                    Message = "An error occurred while processing your request."
                });
            }
        }
        
        [HttpGet("categories")]
        [Authorize]
        public async Task<IActionResult> GetMenuCategories([FromQuery] string? search = null)
        {
            try
            {
                _logger.LogInformation("Retrieving unique master menu categories");
                
                // Query to get all distinct non-null categories from active menu items
                var query = _context.MstMasterMenus
                    .Where(m => m.bolIsActive == true && m.strCategory != null && m.strCategory != "");
                
                // Apply search filter if provided
                if (!string.IsNullOrWhiteSpace(search))
                {
                    string searchLower = search.ToLower();
                    query = query.Where(m => m.strCategory.ToLower().Contains(searchLower));
                    
                    _logger.LogInformation("Applying search filter to categories: {SearchTerm}", search);
                }
                
                // Get distinct categories and order them alphabetically
                var categories = await query
                    .Select(m => m.strCategory)
                    .Distinct()
                    .OrderBy(c => c)
                    .ToListAsync();

                // Map categories to the expected format for dropdown
                var categoryItems = categories.Select(c => new
                {
                    value = c,
                    label = c
                }).ToList();

                if (!categoryItems.Any())
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "No categories found",
                        data = new object[] { }
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Menu categories retrieved successfully",
                    data = categoryItems,
                    totalCount = categoryItems.Count,
                    searchTerm = search
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving menu categories");
                return StatusCode(500, new
                { 
                    statusCode = 500, 
                    message = "An error occurred while retrieving menu categories."
                });
            }
        }
    }
}
