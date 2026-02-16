using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using AuditSoftware.DTOs.HelpCenter;
using AuditSoftware.Models.Entities;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HelpCategoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<HelpCategoryController> _logger;

        public HelpCategoryController(AppDbContext context, ILogger<HelpCategoryController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/HelpCategory
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllCategories(
            [FromQuery] bool includeInactive = false,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] string? strModuleGUID = null)
        {
            try
            {
                var query = _context.Set<MstHelpCategory>().AsQueryable();

                if (!includeInactive)
                {
                    query = query.Where(c => c.bolIsActive);
                }

                // Search filter
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.ToLower();
                    query = query.Where(c => 
                        c.strCategoryName.ToLower().Contains(searchLower) ||
                        (c.strDescription != null && c.strDescription.ToLower().Contains(searchLower))
                    );
                }

                // strModuleGUID filter
                if (!string.IsNullOrWhiteSpace(strModuleGUID) && Guid.TryParse(strModuleGUID, out var moduleGuid))
                {
                    query = query.Where(c => c.strModuleGUID == moduleGuid);
                }

                // Get total count
                var totalCount = await query.CountAsync();

                // Apply pagination with Module Join
                var categories = await query
                    .OrderBy(c => c.intOrder)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .GroupJoin(_context.Set<MstModule>(),
                        c => c.strModuleGUID,
                        m => m.strModuleGUID,
                        (c, modules) => new { Category = c, Modules = modules })
                    .SelectMany(
                        x => x.Modules.DefaultIfEmpty(),
                        (x, module) => new HelpCategoryDto
                        {
                            strCategoryGUID = x.Category.strCategoryGUID.ToString(),
                            strCategoryName = x.Category.strCategoryName,
                            strDescription = x.Category.strDescription,
                            strIcon = x.Category.strIcon,
                            strModuleGUID = x.Category.strModuleGUID.HasValue ? x.Category.strModuleGUID.ToString() : null,
                            strModuleName = module != null ? module.strName : null,
                            intOrder = x.Category.intOrder,
                            bolIsActive = x.Category.bolIsActive
                        })
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Categories retrieved successfully",
                    data = new
                    {
                        items = categories,
                        totalCount = totalCount,
                        pageNumber = pageNumber,
                        pageSize = pageSize,
                        totalPages = totalPages,
                        hasPrevious = pageNumber > 1,
                        hasNext = pageNumber < totalPages
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving help categories");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving categories"
                });
            }
        }

        // GET: api/HelpCategory/active/dropdown
        [HttpGet("active/dropdown")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveCategories()
        {
            try
            {
                var categories = await _context.Set<MstHelpCategory>()
                    .Where(c => c.bolIsActive)
                    .OrderBy(c => c.intOrder)
                    .GroupJoin(_context.Set<MstModule>(),
                        c => c.strModuleGUID,
                        m => m.strModuleGUID,
                        (c, modules) => new { Category = c, Modules = modules })
                    .SelectMany(
                        x => x.Modules.DefaultIfEmpty(),
                        (x, module) => new HelpCategoryDto
                        {
                            strCategoryGUID = x.Category.strCategoryGUID.ToString(),
                            strCategoryName = x.Category.strCategoryName,
                            strDescription = x.Category.strDescription,
                            strIcon = x.Category.strIcon,
                            strModuleGUID = x.Category.strModuleGUID.HasValue ? x.Category.strModuleGUID.ToString() : null,
                            strModuleName = module != null ? module.strName : null,
                            intOrder = x.Category.intOrder,
                            bolIsActive = x.Category.bolIsActive
                        })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Active categories retrieved successfully",
                    data = categories
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active help categories");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving active categories"
                });
            }
        }

        // GET: api/HelpCategory/{guid}
        [HttpGet("{guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryById(Guid guid)
        {
            try
            {
                var category = await _context.Set<MstHelpCategory>()
                    .Where(c => c.strCategoryGUID == guid)
                    .GroupJoin(_context.Set<MstModule>(),
                        c => c.strModuleGUID,
                        m => m.strModuleGUID,
                        (c, modules) => new { Category = c, Modules = modules })
                    .SelectMany(
                        x => x.Modules.DefaultIfEmpty(),
                        (x, module) => new HelpCategoryDto
                        {
                            strCategoryGUID = x.Category.strCategoryGUID.ToString(),
                            strCategoryName = x.Category.strCategoryName,
                            strDescription = x.Category.strDescription,
                            strIcon = x.Category.strIcon,
                            strModuleGUID = x.Category.strModuleGUID.HasValue ? x.Category.strModuleGUID.ToString() : null,
                            strModuleName = module != null ? module.strName : null,
                            intOrder = x.Category.intOrder,
                            bolIsActive = x.Category.bolIsActive
                        })
                    .FirstOrDefaultAsync();

                if (category == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Category not found"
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Category retrieved successfully",
                    data = category
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving help category {CategoryGUID}", guid);
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving the category"
                });
            }
        }

        // POST: api/HelpCategory
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateCategory([FromBody] HelpCategoryCreateDto dto)
        {
            try
            {
                var userGuidClaim = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidClaim) || !Guid.TryParse(userGuidClaim, out var userGuid))
                {
                    return Unauthorized(new { statusCode = 401, message = "Invalid user" });
                }

                Guid? moduleGuid = null;
                if (!string.IsNullOrWhiteSpace(dto.strModuleGUID))
                {
                    if (!Guid.TryParse(dto.strModuleGUID, out var parsedModuleGuid))
                    {
                        return BadRequest(new { statusCode = 400, message = "Invalid module GUID" });
                    }

                    moduleGuid = parsedModuleGuid;
                }

                var category = new MstHelpCategory
                {
                    strCategoryName = dto.strCategoryName,
                    strDescription = dto.strDescription,
                    strIcon = dto.strIcon,
                    strModuleGUID = moduleGuid,
                    intOrder = dto.intOrder,
                    bolIsActive = dto.bolIsActive,
                    strCreatedByGUID = userGuid
                };

                _context.Set<MstHelpCategory>().Add(category);
                await _context.SaveChangesAsync();

                var result = new HelpCategoryDto
                {
                    strCategoryGUID = category.strCategoryGUID.ToString(),
                    strCategoryName = category.strCategoryName,
                    strDescription = category.strDescription,
                    strIcon = category.strIcon,
                    strModuleGUID = category.strModuleGUID?.ToString(),
                    intOrder = category.intOrder,
                    bolIsActive = category.bolIsActive
                };

                return CreatedAtAction(nameof(GetCategoryById), new { guid = category.strCategoryGUID }, new
                {
                    statusCode = 201,
                    message = "Category created successfully",
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating help category");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while creating the category"
                });
            }
        }

        // PUT: api/HelpCategory/{guid}
        [HttpPut("{guid}")]
        [Authorize]
        public async Task<IActionResult> UpdateCategory(Guid guid, [FromBody] HelpCategoryUpdateDto dto)
        {
            try
            {
                var userGuidClaim = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidClaim) || !Guid.TryParse(userGuidClaim, out var userGuid))
                {
                    return Unauthorized(new { statusCode = 401, message = "Invalid user" });
                }

                Guid? moduleGuid = null;
                if (!string.IsNullOrWhiteSpace(dto.strModuleGUID))
                {
                    if (!Guid.TryParse(dto.strModuleGUID, out var parsedModuleGuid))
                    {
                        return BadRequest(new { statusCode = 400, message = "Invalid module GUID" });
                    }

                    moduleGuid = parsedModuleGuid;
                }

                var category = await _context.Set<MstHelpCategory>()
                    .FirstOrDefaultAsync(c => c.strCategoryGUID == guid);

                if (category == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Category not found"
                    });
                }

                category.strCategoryName = dto.strCategoryName;
                category.strDescription = dto.strDescription;
                category.strIcon = dto.strIcon;
                category.strModuleGUID = moduleGuid;
                category.intOrder = dto.intOrder;
                category.bolIsActive = dto.bolIsActive;
                category.strModifiedByGUID = userGuid;
                category.dtModifiedOn = DateTimeHelper.GetCurrentUtcTime();

                await _context.SaveChangesAsync();

                var result = new HelpCategoryDto
                {
                    strCategoryGUID = category.strCategoryGUID.ToString(),
                    strCategoryName = category.strCategoryName,
                    strDescription = category.strDescription,
                    strIcon = category.strIcon,
                    strModuleGUID = category.strModuleGUID?.ToString(),
                    intOrder = category.intOrder,
                    bolIsActive = category.bolIsActive
                };

                return Ok(new
                {
                    statusCode = 200,
                    message = "Category updated successfully",
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating help category {CategoryGUID}", guid);
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while updating the category"
                });
            }
        }

        // DELETE: api/HelpCategory/{guid}
        [HttpDelete("{guid}")]
        [Authorize]
        public async Task<IActionResult> DeleteCategory(Guid guid)
        {
            try
            {
                var category = await _context.Set<MstHelpCategory>()
                    .FirstOrDefaultAsync(c => c.strCategoryGUID == guid);

                if (category == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Category not found"
                    });
                }

                // Check if category has articles
                var hasArticles = await _context.Set<MstHelpArticle>()
                    .AnyAsync(a => a.strCategoryGUID == guid);

                if (hasArticles)
                {
                    return BadRequest(new
                    {
                        statusCode = 400,
                        message = "Cannot delete category with existing articles"
                    });
                }

                _context.Set<MstHelpCategory>().Remove(category);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Category deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting help category {CategoryGUID}", guid);
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while deleting the category"
                });
            }
        }
    }
}
