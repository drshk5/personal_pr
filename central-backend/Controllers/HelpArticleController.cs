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
    public class HelpArticleController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<HelpArticleController> _logger;

        public HelpArticleController(AppDbContext context, ILogger<HelpArticleController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/HelpArticle
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllArticles(
            [FromQuery] HelpArticleSearchDto searchDto,
            [FromQuery] bool includeInactive = false,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Set<MstHelpArticle>()
                    .Include(a => a.Category)
                    .Include(a => a.Module)
                    .AsQueryable();

                if (!includeInactive)
                {
                    query = query.Where(a => a.bolIsActive);
                }

                // Filter by category

                if (!string.IsNullOrEmpty(searchDto.strCategoryGUID) && Guid.TryParse(searchDto.strCategoryGUID, out var categoryGuid))
                {
                    query = query.Where(a => a.strCategoryGUID == categoryGuid);
                }

                // Filter by module
                if (!string.IsNullOrEmpty(searchDto.strModuleGUID) && Guid.TryParse(searchDto.strModuleGUID, out var moduleGuid))
                {
                    query = query.Where(a => a.strModuleGUID == moduleGuid);
                }

                // Filter by featured
                if (searchDto.bolIsFeatured.HasValue)
                {
                    query = query.Where(a => a.bolIsFeatured == searchDto.bolIsFeatured.Value);
                }

                // Search in title and content
                if (!string.IsNullOrWhiteSpace(searchDto.searchTerm))
                {
                    var searchTermLower = searchDto.searchTerm.ToLower();
                    query = query.Where(a =>
                        a.strTitle.ToLower().Contains(searchTermLower) ||
                        a.strContent.ToLower().Contains(searchTermLower)
                    );
                }

                // Get total count
                var totalCount = await query.CountAsync();

                // Apply pagination
                var articles = await query
                    .OrderBy(a => a.intOrder)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new HelpArticleDto
                    {
                        strArticleGUID = a.strArticleGUID.ToString(),
                        strCategoryGUID = a.strCategoryGUID.ToString(),
                        strCategoryName = a.Category != null ? a.Category.strCategoryName : null,
                        strModuleGUID = a.strModuleGUID.HasValue ? a.strModuleGUID.Value.ToString() : null,
                        strModuleName = a.Module != null ? a.Module.strName : null,
                        strTitle = a.strTitle,
                        strContent = a.strContent,
                        strVideoUrl = a.strVideoUrl,
                        intOrder = a.intOrder,
                        bolIsActive = a.bolIsActive,
                        bolIsFeatured = a.bolIsFeatured,
                        dtCreatedOn = a.dtCreatedOn,
                        dtModifiedOn = a.dtModifiedOn
                    })
                    .ToListAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                return Ok(new
                {
                    statusCode = 200,
                    message = "Articles retrieved successfully",
                    data = new
                    {
                        items = articles,
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
                _logger.LogError(ex, "Error retrieving help articles");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving articles"
                });
            }
        }

        // GET: api/HelpArticle/categories-with-articles
        [HttpGet("categories-with-articles")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoriesWithArticles()
        {
            try
            {
                // Get the user's module GUID from the token
                Guid? userModuleGuid = null;
                var moduleGuidClaim = User.FindFirst("strModuleGUID")?.Value;
                if (!string.IsNullOrEmpty(moduleGuidClaim) && Guid.TryParse(moduleGuidClaim, out var parsedModuleGuid))
                {
                    userModuleGuid = parsedModuleGuid;
                }

                // Fetch categories for current module and common (module-less)

                var categories = (await _context.Set<MstHelpCategory>()
                    .Where(c => c.bolIsActive && (c.strModuleGUID == userModuleGuid || c.strModuleGUID == null))
                    .OrderBy(c => c.intOrder)
                    .Select(c => new HelpCategoryDto
                    {
                        strCategoryGUID = c.strCategoryGUID.ToString(),
                        strCategoryName = c.strCategoryName,
                        strDescription = c.strDescription,
                        strIcon = c.strIcon,
                        strModuleGUID = c.strModuleGUID.HasValue ? c.strModuleGUID.ToString() : null,
                        intOrder = c.intOrder,
                        bolIsActive = c.bolIsActive,
                        Articles = c.Articles
                            .Where(a => a.bolIsActive && (a.strModuleGUID == userModuleGuid || a.strModuleGUID == null))
                            .OrderBy(a => a.intOrder)
                            .Select(a => new HelpArticleDto
                            {
                                strArticleGUID = a.strArticleGUID.ToString(),
                                strCategoryGUID = a.strCategoryGUID.ToString(),
                                strModuleGUID = a.strModuleGUID.HasValue ? a.strModuleGUID.Value.ToString() : null,
                                strModuleName = a.Module != null ? a.Module.strName : null,
                                strTitle = a.strTitle,
                                strContent = a.strContent,
                                strVideoUrl = a.strVideoUrl,
                                intOrder = a.intOrder,
                                bolIsActive = a.bolIsActive,
                                bolIsFeatured = a.bolIsFeatured,
                                dtCreatedOn = a.dtCreatedOn
                            })
                            .ToList()
                    })
                    .ToListAsync())
                    .Where(c => c.Articles != null && c.Articles.Count > 0)
                    .ToList();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Categories with articles retrieved successfully",
                    data = categories
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving categories with articles");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving data"
                });
            }
        }

        // GET: api/HelpArticle/active/dropdown
        [HttpGet("active/dropdown")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActiveArticles()
        {
            try
            {
                var articles = await _context.Set<MstHelpArticle>()
                    .Include(a => a.Category)
                    .Include(a => a.Module)
                    .Where(a => a.bolIsActive)
                    .OrderBy(a => a.intOrder)
                    .Select(a => new HelpArticleDto
                    {
                        strArticleGUID = a.strArticleGUID.ToString(),
                        strCategoryGUID = a.strCategoryGUID.ToString(),
                        strCategoryName = a.Category != null ? a.Category.strCategoryName : null,
                        strModuleGUID = a.strModuleGUID.HasValue ? a.strModuleGUID.Value.ToString() : null,
                        strModuleName = a.Module != null ? a.Module.strName : null,
                        strTitle = a.strTitle,
                        strContent = a.strContent,
                        strVideoUrl = a.strVideoUrl,
                        intOrder = a.intOrder,
                        bolIsActive = a.bolIsActive,
                        bolIsFeatured = a.bolIsFeatured,
                        dtCreatedOn = a.dtCreatedOn,
                        dtModifiedOn = a.dtModifiedOn
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Active articles retrieved successfully",
                    data = articles
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active help articles");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving active articles"
                });
            }
        }

        // GET: api/HelpArticle/{guid}
        [HttpGet("{guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArticleById(Guid guid)
        {
            try
            {
                var article = await _context.Set<MstHelpArticle>()
                    .Include(a => a.Category)
                    .Include(a => a.Module)
                    .Where(a => a.strArticleGUID == guid)
                    .Select(a => new HelpArticleDto
                    {
                        strArticleGUID = a.strArticleGUID.ToString(),
                        strCategoryGUID = a.strCategoryGUID.ToString(),
                        strCategoryName = a.Category != null ? a.Category.strCategoryName : null,
                        strModuleGUID = a.strModuleGUID.HasValue ? a.strModuleGUID.Value.ToString() : null,
                        strModuleName = a.Module != null ? a.Module.strName : null,
                        strTitle = a.strTitle,
                        strContent = a.strContent,
                        strVideoUrl = a.strVideoUrl,
                        intOrder = a.intOrder,
                        bolIsActive = a.bolIsActive,
                        bolIsFeatured = a.bolIsFeatured,
                        dtCreatedOn = a.dtCreatedOn,
                        dtModifiedOn = a.dtModifiedOn
                    })
                    .FirstOrDefaultAsync();

                if (article == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Article not found"
                    });
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = "Article retrieved successfully",
                    data = article
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving help article {ArticleGUID}", guid);
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving the article"
                });
            }
        }

        // POST: api/HelpArticle
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateArticle([FromBody] HelpArticleCreateDto dto)
        {
            try
            {
                var userGuidClaim = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidClaim) || !Guid.TryParse(userGuidClaim, out var userGuid))
                {
                    return Unauthorized(new { statusCode = 401, message = "Invalid user" });
                }

                if (!Guid.TryParse(dto.strCategoryGUID, out var categoryGuid))
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid category GUID" });
                }

                // Check if category exists
                var categoryExists = await _context.Set<MstHelpCategory>()
                    .AnyAsync(c => c.strCategoryGUID == categoryGuid);

                if (!categoryExists)
                {
                    return BadRequest(new { statusCode = 400, message = "Category not found" });
                }

                Guid? moduleGuid = null;
                if (!string.IsNullOrEmpty(dto.strModuleGUID) && Guid.TryParse(dto.strModuleGUID, out var parsedModuleGuid))
                {
                    var moduleExists = await _context.Set<MstModule>()
                        .AnyAsync(m => m.strModuleGUID == parsedModuleGuid);
                    
                    if (!moduleExists)
                    {
                        return BadRequest(new { statusCode = 400, message = "Module not found" });
                    }
                    moduleGuid = parsedModuleGuid;
                }

                var article = new MstHelpArticle
                {
                    strCategoryGUID = categoryGuid,
                    strModuleGUID = moduleGuid,
                    strTitle = dto.strTitle,
                    strContent = dto.strContent,
                    strVideoUrl = dto.strVideoUrl,
                    intOrder = dto.intOrder,
                    bolIsActive = dto.bolIsActive,
                    bolIsFeatured = dto.bolIsFeatured,
                    strCreatedByGUID = userGuid
                };

                _context.Set<MstHelpArticle>().Add(article);
                await _context.SaveChangesAsync();

                var result = new HelpArticleDto
                {
                    strArticleGUID = article.strArticleGUID.ToString(),
                    strCategoryGUID = article.strCategoryGUID.ToString(),
                    strTitle = article.strTitle,
                    strContent = article.strContent,
                    strVideoUrl = article.strVideoUrl,
                    intOrder = article.intOrder,
                    bolIsActive = article.bolIsActive,
                    bolIsFeatured = article.bolIsFeatured,
                    dtCreatedOn = article.dtCreatedOn
                };

                return CreatedAtAction(nameof(GetArticleById), new { guid = article.strArticleGUID }, new
                {
                    statusCode = 201,
                    message = "Article created successfully",
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating help article");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while creating the article"
                });
            }
        }

        // PUT: api/HelpArticle/{guid}
        [HttpPut("{guid}")]
        [Authorize]
        public async Task<IActionResult> UpdateArticle(Guid guid, [FromBody] HelpArticleUpdateDto dto)
        {
            try
            {
                var userGuidClaim = User.FindFirst("strUserGUID")?.Value;
                if (string.IsNullOrEmpty(userGuidClaim) || !Guid.TryParse(userGuidClaim, out var userGuid))
                {
                    return Unauthorized(new { statusCode = 401, message = "Invalid user" });
                }

                if (!Guid.TryParse(dto.strCategoryGUID, out var categoryGuid))
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid category GUID" });
                }

                var article = await _context.Set<MstHelpArticle>()
                    .FirstOrDefaultAsync(a => a.strArticleGUID == guid);

                if (article == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Article not found"
                    });
                }

                // Check if category exists
                var categoryExists = await _context.Set<MstHelpCategory>()
                    .AnyAsync(c => c.strCategoryGUID == categoryGuid);

                if (!categoryExists)
                {
                    return BadRequest(new { statusCode = 400, message = "Category not found" });
                }

                Guid? moduleGuid = null;
                if (!string.IsNullOrEmpty(dto.strModuleGUID) && Guid.TryParse(dto.strModuleGUID, out var parsedModuleGuid))
                {
                    var moduleExists = await _context.Set<MstModule>()
                        .AnyAsync(m => m.strModuleGUID == parsedModuleGuid);
                    
                    if (!moduleExists)
                    {
                        return BadRequest(new { statusCode = 400, message = "Module not found" });
                    }
                    moduleGuid = parsedModuleGuid;
                }

                article.strCategoryGUID = categoryGuid;
                article.strModuleGUID = moduleGuid;
                article.strTitle = dto.strTitle;
                article.strContent = dto.strContent;
                article.strVideoUrl = dto.strVideoUrl;
                article.intOrder = dto.intOrder;
                article.bolIsActive = dto.bolIsActive;
                article.bolIsFeatured = dto.bolIsFeatured;
                article.strModifiedByGUID = userGuid;
                article.dtModifiedOn = DateTimeHelper.GetCurrentUtcTime();

                await _context.SaveChangesAsync();

                var result = new HelpArticleDto
                {
                    strArticleGUID = article.strArticleGUID.ToString(),
                    strCategoryGUID = article.strCategoryGUID.ToString(),
                    strTitle = article.strTitle,
                    strContent = article.strContent,
                    strVideoUrl = article.strVideoUrl,
                    intOrder = article.intOrder,
                    bolIsActive = article.bolIsActive,
                    bolIsFeatured = article.bolIsFeatured,
                    dtCreatedOn = article.dtCreatedOn,
                    dtModifiedOn = article.dtModifiedOn
                };

                return Ok(new
                {
                    statusCode = 200,
                    message = "Article updated successfully",
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating help article {ArticleGUID}", guid);
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while updating the article"
                });
            }
        }

        // DELETE: api/HelpArticle/{guid}
        [HttpDelete("{guid}")]
        [Authorize]
        public async Task<IActionResult> DeleteArticle(Guid guid)
        {
            try
            {
                var article = await _context.Set<MstHelpArticle>()
                    .FirstOrDefaultAsync(a => a.strArticleGUID == guid);

                if (article == null)
                {
                    return NotFound(new
                    {
                        statusCode = 404,
                        message = "Article not found"
                    });
                }

                _context.Set<MstHelpArticle>().Remove(article);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Article deleted successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting help article {ArticleGUID}", guid);
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while deleting the article"
                });
            }
        }

        // GET: api/HelpArticle/widget/for-current-page
        [HttpGet("widget/for-current-page")]
        [Authorize]
        public async Task<IActionResult> GetArticlesForCurrentPage([FromQuery] string? moduleGuid)
        {
            try
            {
                if (string.IsNullOrEmpty(moduleGuid))
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "Articles retrieved successfully",
                        data = new List<HelpArticleDto>()
                    });
                }

                if (!Guid.TryParse(moduleGuid, out var parsedModuleGuid))
                {
                    return BadRequest(new { statusCode = 400, message = "Invalid module GUID" });
                }

                // Get user's accessible module GUIDs from token
                var userModuleGuidsJson = User.FindFirst("ModuleGUIDs")?.Value;
                List<Guid> userModuleGuids = new List<Guid>();

                if (!string.IsNullOrEmpty(userModuleGuidsJson))
                {
                    try
                    {
                        userModuleGuids = System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(userModuleGuidsJson) ?? new List<Guid>();
                    }
                    catch
                    {
                        // If parsing fails, continue with empty list
                    }
                }

                // Check if user has access to the requested module
                if (!userModuleGuids.Contains(parsedModuleGuid))
                {
                    return Ok(new
                    {
                        statusCode = 200,
                        message = "No articles available for this page",
                        data = new List<HelpArticleDto>()
                    });
                }

                // Get articles for this specific page/module OR articles with no module assigned
                var articles = await _context.Set<MstHelpArticle>()
                    .Include(a => a.Category)
                    .Include(a => a.Module)
                    .Where(a => a.bolIsActive && 
                                (a.strModuleGUID == parsedModuleGuid || !a.strModuleGUID.HasValue))
                    .OrderBy(a => a.intOrder)
                    .Take(10)
                    .Select(a => new HelpArticleDto
                    {
                        strArticleGUID = a.strArticleGUID.ToString(),
                        strCategoryGUID = a.strCategoryGUID.ToString(),
                        strCategoryName = a.Category != null ? a.Category.strCategoryName : null,
                        strModuleGUID = a.strModuleGUID.HasValue ? a.strModuleGUID.Value.ToString() : null,
                        strModuleName = a.Module != null ? a.Module.strName : null,
                        strTitle = a.strTitle,
                        strContent = a.strContent,
                        strVideoUrl = a.strVideoUrl,
                        intOrder = a.intOrder,
                        bolIsFeatured = a.bolIsFeatured
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Articles retrieved successfully",
                    data = articles
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving articles for widget");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving articles"
                });
            }
        }

        // GET: api/HelpArticle/widget/featured
        [HttpGet("widget/featured")]
        [Authorize]
        public async Task<IActionResult> GetFeaturedArticlesForWidget()
        {
            try
            {
                // Get user's accessible module GUIDs from token
                var userModuleGuidsJson = User.FindFirst("ModuleGUIDs")?.Value;
                List<Guid> userModuleGuids = new List<Guid>();

                if (!string.IsNullOrEmpty(userModuleGuidsJson))
                {
                    try
                    {
                        userModuleGuids = System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(userModuleGuidsJson) ?? new List<Guid>();
                    }
                    catch
                    {
                        // If parsing fails, show general articles
                    }
                }

                var query = _context.Set<MstHelpArticle>()
                    .Include(a => a.Category)
                    .Include(a => a.Module)
                    .Where(a => a.bolIsActive && a.bolIsFeatured);

                // Filter by user's accessible modules if available
                if (userModuleGuids.Any())
                {
                    query = query.Where(a => !a.strModuleGUID.HasValue || userModuleGuids.Contains(a.strModuleGUID.Value));
                }

                var articles = await query
                    .OrderBy(a => a.intOrder)
                    .Take(10)
                    .Select(a => new HelpArticleDto
                    {
                        strArticleGUID = a.strArticleGUID.ToString(),
                        strCategoryGUID = a.strCategoryGUID.ToString(),
                        strCategoryName = a.Category != null ? a.Category.strCategoryName : null,
                        strModuleGUID = a.strModuleGUID.HasValue ? a.strModuleGUID.Value.ToString() : null,
                        strModuleName = a.Module != null ? a.Module.strName : null,
                        strTitle = a.strTitle,
                        strContent = a.strContent,
                        strVideoUrl = a.strVideoUrl,
                        intOrder = a.intOrder,
                        bolIsFeatured = a.bolIsFeatured
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Featured articles retrieved successfully",
                    data = articles
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving featured articles for widget");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving featured articles"
                });
            }
        }

        // GET: api/HelpArticle/widget/quick-actions
        [HttpGet("widget/quick-actions")]
        [AllowAnonymous]
        public async Task<IActionResult> GetQuickActionCategories()
        {
            try
            {
                var categories = await _context.Set<MstHelpCategory>()
                    .Where(c => c.bolIsActive)
                    .OrderBy(c => c.intOrder)
                    .Take(6)
                    .Select(c => new HelpCategoryDto
                    {
                        strCategoryGUID = c.strCategoryGUID.ToString(),
                        strCategoryName = c.strCategoryName,
                        strDescription = c.strDescription,
                        strIcon = c.strIcon,
                        intOrder = c.intOrder,
                        bolIsActive = c.bolIsActive
                    })
                    .ToListAsync();

                return Ok(new
                {
                    statusCode = 200,
                    message = "Quick action categories retrieved successfully",
                    data = categories
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving quick action categories");
                return StatusCode(500, new
                {
                    statusCode = 500,
                    message = "An error occurred while retrieving quick action categories"
                });
            }
        }
    }
}

