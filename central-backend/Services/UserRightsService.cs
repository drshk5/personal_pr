using AutoMapper;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using AuditSoftware.DTOs.UserRights;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;

namespace AuditSoftware.Services
{
    public class UserRightsService :  ServiceBase, IUserRightsService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public UserRightsService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        private async Task ValidateMenuAndUserRole(Guid userRoleGuid, Guid menuGuid)
        {
            // Validate UserRole exists
            var userRole = await _context.MstUserRoles.FindAsync(userRoleGuid);
            if (userRole == null)
            {
                throw new BusinessException($"User role with GUID '{userRoleGuid}' does not exist");
            }

            // Validate Menu exists
            var menu = await _context.MstMenus.FindAsync(menuGuid);
            if (menu == null)
            {
                throw new BusinessException($"Menu with GUID '{menuGuid}' does not exist");
            }
        }

        public async Task<UserRightsResponseDto> CreateUserRightsAsync(UserRightsCreateDto userRightsDto)
        {
            // Validate both GUIDs exist
            await ValidateMenuAndUserRole(userRightsDto.strUserRoleGUID, userRightsDto.strMenuGUID);

            // No need to parse the menu GUID as it's already a Guid
            var menuGuid = userRightsDto.strMenuGUID;

            // Check if rights already exist for this role and menu
            var existingRights = await _context.MstUserRights
                .AnyAsync(r => r.strUserRoleGUID == userRightsDto.strUserRoleGUID && 
                              r.strMenuGUID == menuGuid);
            if (existingRights)
            {
                throw new BusinessException($"Rights already exist for role '{userRightsDto.strUserRoleGUID}' and menu '{userRightsDto.strMenuGUID}'");
            }

            var userRights = new MstUserRights
            {
                strUserRightGUID = Guid.NewGuid(),
                strUserRoleGUID = userRightsDto.strUserRoleGUID,
                strMenuGUID = menuGuid,
                // strModuleGUID removed
                bolCanView = userRightsDto.bolCanView,
                bolCanEdit = userRightsDto.bolCanEdit,
                bolCanSave = userRightsDto.bolCanSave,
                bolCanDelete = userRightsDto.bolCanDelete,
                bolCanPrint = userRightsDto.bolCanPrint,
                bolCanExport = userRightsDto.bolCanExport,
                bolCanImport = userRightsDto.bolCanImport,
                bolCanApprove = userRightsDto.bolCanApprove
            };

            _context.MstUserRights.Add(userRights);
            await _context.SaveChangesAsync();

            return await GetUserRightsByIdAsync(userRights.strUserRightGUID);
        }

        public async Task<UserRightsResponseDto> UpdateUserRightsAsync(Guid userRightId, UserRightsCreateDto userRightsDto)
        {
            var userRights = await _context.MstUserRights.FindAsync(userRightId);
            if (userRights == null)
            {
                throw new BusinessException($"User rights with GUID '{userRightId}' not found");
            }

            // Validate both GUIDs exist
            await ValidateMenuAndUserRole(userRightsDto.strUserRoleGUID, userRightsDto.strMenuGUID);

            // No need to parse the menu GUID as it's already a Guid
            var menuGuid = userRightsDto.strMenuGUID;

            // Check if rights already exist for this role and menu (excluding current record)
            var existingRights = await _context.MstUserRights
                .AnyAsync(r => r.strUserRoleGUID == userRightsDto.strUserRoleGUID && 
                              r.strMenuGUID == menuGuid &&
                              r.strUserRightGUID != userRightId);
            if (existingRights)
            {
                throw new BusinessException($"Rights already exist for role '{userRightsDto.strUserRoleGUID}' and menu '{userRightsDto.strMenuGUID}'");
            }

            userRights.strUserRoleGUID = userRightsDto.strUserRoleGUID;
            userRights.strMenuGUID = menuGuid;
            // strModuleGUID removed
            userRights.bolCanView = userRightsDto.bolCanView;
            userRights.bolCanEdit = userRightsDto.bolCanEdit;
            userRights.bolCanSave = userRightsDto.bolCanSave;
            userRights.bolCanDelete = userRightsDto.bolCanDelete;
            userRights.bolCanPrint = userRightsDto.bolCanPrint;
            userRights.bolCanExport = userRightsDto.bolCanExport;
            userRights.bolCanImport = userRightsDto.bolCanImport;
            userRights.bolCanApprove = userRightsDto.bolCanApprove;

            await _context.SaveChangesAsync();

            return await GetUserRightsByIdAsync(userRightId);
        }

        public async Task<UserRightsResponseDto> GetUserRightsByIdAsync(Guid userRightId)
        {
            var userRights = await _context.MstUserRights
                .Include(r => r.MstUserRole)
                .Include(r => r.MstMenu)
                .FirstOrDefaultAsync(r => r.strUserRightGUID == userRightId);

            if (userRights == null)
            {
                throw new BusinessException($"User rights with GUID '{userRightId}' not found");
            }

            var response = _mapper.Map<UserRightsResponseDto>(userRights);
            response.strUserRoleName = userRights.MstUserRole.strName;
            response.strMenuName = userRights.MstMenu.strName;

            return response;
        }

        public async Task<bool> DeleteUserRightsAsync(Guid userRightId)
        {
            var userRights = await _context.MstUserRights.FindAsync(userRightId);
            if (userRights == null)
            {
                throw new BusinessException($"User rights with GUID '{userRightId}' not found");
            }

            _context.MstUserRights.Remove(userRights);
            await _context.SaveChangesAsync();

            return true;
        }

        private UserRightsResponseDto GetEnrichedUserDetailsResponseAsync(MstUserRights userRights)
        {
            var dto = _mapper.Map<UserRightsResponseDto>(userRights);
            dto.strUserRoleName = userRights.MstUserRole.strName;
            dto.strMenuName = userRights.MstMenu.strName;
            return dto;
        }

        public async Task<PagedResponse<UserRightsResponseDto>> GetAllUserRightsAsync(UserRightsFilterDto filterDto)
        {
            if (filterDto.PageNumber < 1)
                throw new BusinessException("Page number must be greater than 0");
            if (filterDto.PageSize < 1)
                throw new BusinessException("Page size must be greater than 0");

            // Get all menus first, excluding super admin menus
            var menuQuery = _context.MstMenus
                .Where(m => m.bolSuperAdminAccess != true);

            // Apply search if provided
            if (!string.IsNullOrWhiteSpace(filterDto.Search))
            {
                var search = filterDto.Search.ToLower();
                menuQuery = menuQuery.Where(m => m.strName.ToLower().Contains(search));
            }
            
            // Get total count before pagination
            var totalCount = await menuQuery.CountAsync();
            
            // Apply sorting
            if (!string.IsNullOrWhiteSpace(filterDto.SortBy))
            {
                switch (filterDto.SortBy.ToLower())
                {
                    case "menuname":
                        menuQuery = filterDto.ascending ? 
                            menuQuery.OrderBy(m => m.strName) : 
                            menuQuery.OrderByDescending(m => m.strName);
                        break;
                    case "menupath":
                        menuQuery = filterDto.ascending ? 
                            menuQuery.OrderBy(m => m.strPath) : 
                            menuQuery.OrderByDescending(m => m.strPath);
                        break;
                    default:
                        menuQuery = menuQuery.OrderBy(m => m.strName);
                        break;
                }
            }
            else
            {
                // Default sorting by menu name
                menuQuery = menuQuery.OrderBy(m => m.strName);
            }
            
            // Apply pagination
            var menus = await menuQuery
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            // Create result list
            var userRightsDtos = new List<UserRightsResponseDto>();

            foreach (var menu in menus)
            {
                // Look for existing user rights
                var userRights = await _context.MstUserRights
                    .Include(r => r.MstUserRole)
                    .FirstOrDefaultAsync(r => 
                        r.strMenuGUID == menu.strMenuGUID && 
                        (!filterDto.strUserRoleGUID.HasValue || r.strUserRoleGUID == filterDto.strUserRoleGUID));

                // Create DTO with menu info and user rights if they exist
                var dto = new UserRightsResponseDto
                {
                    strMenuGUID = menu.strMenuGUID,
                    strMenuName = menu.strName
                };

                if (userRights != null)
                {
                    dto.strUserRightGUID = userRights.strUserRightGUID;
                    dto.strUserRoleGUID = userRights.strUserRoleGUID;
                    dto.strUserRoleName = userRights.MstUserRole?.strName;
                    dto.bolCanView = userRights.bolCanView;
                    dto.bolCanEdit = userRights.bolCanEdit;
                    dto.bolCanSave = userRights.bolCanSave;
                    dto.bolCanDelete = userRights.bolCanDelete;
                    dto.bolCanPrint = userRights.bolCanPrint;
                    dto.bolCanExport = userRights.bolCanExport;
                    dto.bolCanImport = userRights.bolCanImport;
                    dto.bolCanApprove = userRights.bolCanApprove;
                }
                else 
                {
                    // Default values when no user rights exist
                    dto.strUserRightGUID = Guid.Empty;
                    dto.strUserRoleGUID = filterDto.strUserRoleGUID ?? Guid.Empty;
                    dto.strUserRoleName = filterDto.strUserRoleGUID.HasValue ? 
                        await _context.MstUserRoles
                            .Where(r => r.strUserRoleGUID == filterDto.strUserRoleGUID)
                            .Select(r => r.strName)
                            .FirstOrDefaultAsync() : null;
                    dto.bolCanView = false;
                    dto.bolCanEdit = false;
                    dto.bolCanSave = false;
                    dto.bolCanDelete = false;
                    dto.bolCanPrint = false;
                    dto.bolCanExport = false;
                    dto.bolCanImport = false;
                    dto.bolCanApprove = false;
                }

                userRightsDtos.Add(dto);
            }

            return new PagedResponse<UserRightsResponseDto>
            {
                Items = userRightsDtos,
                TotalCount = totalCount,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize)
            };
        }

        public async Task<IEnumerable<UserRightsResponseDto>> GetUserRightsByRoleAsync(Guid userRoleId)
        {
            var userRights = await _context.MstUserRights
                .Include(r => r.MstUserRole)
                .Include(r => r.MstMenu)
                .Where(r => r.strUserRoleGUID == userRoleId)
                .ToListAsync();

            return userRights.Select(r =>
            {
                var dto = _mapper.Map<UserRightsResponseDto>(r);
                dto.strUserRoleName = r.MstUserRole.strName;
                dto.strMenuName = r.MstMenu.strName;
                return dto;
            }).ToList();
        }

        public async Task<UserRightsBatchResponseDto> BatchUpsertUserRightsAsync(List<UserRightsBatchItemDto> userRights)
        {
            var response = new UserRightsBatchResponseDto
            {
                ProcessedRights = new List<UserRightsResponseDto>(),
                Errors = new List<string>()
            };

            foreach (var item in userRights)
            {
                try
                {
                    // Validate that menu exists - no need to parse as it's already a Guid
                    var menuGuid = item.strMenuGUID;
                    
                    var menu = await _context.MstMenus.FindAsync(menuGuid);
                    if (menu == null)
                    {
                        response.Errors.Add($"Menu with GUID '{item.strMenuGUID}' not found");
                        continue;
                    }

                    // Validate that role exists
                    var role = await _context.MstUserRoles.FindAsync(item.strUserRoleGUID);
                    if (role == null)
                    {
                        response.Errors.Add($"User role with GUID '{item.strUserRoleGUID}' not found");
                        continue;
                    }

                    if (!item.strUserRightGUID.HasValue || item.strUserRightGUID == Guid.Empty)
                    {
                        // Check if rights already exist for this role and menu to prevent duplicates
                        var existingRights = await _context.MstUserRights
                            .FirstOrDefaultAsync(r => r.strUserRoleGUID == item.strUserRoleGUID && 
                                                   r.strMenuGUID == menuGuid);

                        if (existingRights != null)
                        {
                            // Update existing record instead of creating new
                            existingRights.bolCanView = item.bolCanView;
                            existingRights.bolCanEdit = item.bolCanEdit;
                            existingRights.bolCanSave = item.bolCanSave;
                            existingRights.bolCanDelete = item.bolCanDelete;
                            existingRights.bolCanPrint = item.bolCanPrint;
                            existingRights.bolCanExport = item.bolCanExport;
                            existingRights.bolCanImport = item.bolCanImport;
                            existingRights.bolCanApprove = item.bolCanApprove;
                            
                            await _context.SaveChangesAsync();
                            response.UpdatedCount++;
                            
                            var updatedDto = _mapper.Map<UserRightsResponseDto>(existingRights);
                            updatedDto.strMenuName = menu.strName;
                            updatedDto.strUserRoleName = role.strName;
                            response.ProcessedRights.Add(updatedDto);
                        }
                        else
                        {
                            // Create new record
                            var userRight = new MstUserRights
                            {
                                strUserRightGUID = Guid.NewGuid(),
                                strUserRoleGUID = item.strUserRoleGUID,
                                strMenuGUID = menuGuid,
                                bolCanView = item.bolCanView,
                                bolCanEdit = item.bolCanEdit,
                                bolCanSave = item.bolCanSave,
                                bolCanDelete = item.bolCanDelete,
                                bolCanPrint = item.bolCanPrint,
                                bolCanExport = item.bolCanExport,
                                bolCanImport = item.bolCanImport,
                                bolCanApprove = item.bolCanApprove
                            };

                            _context.MstUserRights.Add(userRight);
                            await _context.SaveChangesAsync();
                            response.InsertedCount++;
                            
                            var newDto = _mapper.Map<UserRightsResponseDto>(userRight);
                            newDto.strMenuName = menu.strName;
                            newDto.strUserRoleName = role.strName;
                            response.ProcessedRights.Add(newDto);
                        }
                    }
                    else
                    {
                        // Update existing record
                        var existingRight = await _context.MstUserRights.FindAsync(item.strUserRightGUID);
                        if (existingRight == null)
                        {
                            response.Errors.Add($"User right with GUID '{item.strUserRightGUID}' not found");
                            continue;
                        }

                        existingRight.strUserRoleGUID = item.strUserRoleGUID;
                        existingRight.strMenuGUID = menuGuid;
                        existingRight.bolCanView = item.bolCanView;
                        existingRight.bolCanEdit = item.bolCanEdit;
                        existingRight.bolCanSave = item.bolCanSave;
                        existingRight.bolCanDelete = item.bolCanDelete;
                        existingRight.bolCanPrint = item.bolCanPrint;
                        existingRight.bolCanExport = item.bolCanExport;
                        existingRight.bolCanImport = item.bolCanImport;
                        existingRight.bolCanApprove = item.bolCanApprove;

                        await _context.SaveChangesAsync();
                        response.UpdatedCount++;
                        
                        var updatedDto = _mapper.Map<UserRightsResponseDto>(existingRight);
                        updatedDto.strMenuName = menu.strName;
                        updatedDto.strUserRoleName = role.strName;
                        response.ProcessedRights.Add(updatedDto);
                    }
                }
                catch (Exception ex)
                {
                    response.Errors.Add($"Error processing item: {ex.Message}");
                }
            }

            // If no errors occurred, set to null for cleaner response
            if (response.Errors.Count == 0)
            {
                response.Errors = null;
            }

            return response;
        }
    }
} 
