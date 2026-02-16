using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using AuditSoftware.DTOs.DocumentModule;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Models.Entities;
using AuditSoftware.Exceptions;
using Microsoft.Extensions.Logging;
using AuditSoftware.Helpers;
using AuditSoftware.Interfaces;

namespace AuditSoftware.Services
{
    public class DocumentModuleService : IDocumentModuleService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DocumentModuleService> _logger;

        public DocumentModuleService(
            AppDbContext context,
            ILogger<DocumentModuleService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<DocumentModuleResponseDto> CreateAsync(DocumentModuleCreateDto createDto, string createdByGUID)
        {
            try
            {
                // Prevent duplicate entries: same strModuleName for the same strModuleGUID
                bool isDuplicate = await _context.Set<MstDocumentModule>()
                    .AsNoTracking()
                    .AnyAsync(x => x.strModuleGUID == createDto.strModuleGUID && x.strModuleName == createDto.strModuleName);

                if (isDuplicate)
                {
                    throw new BusinessException("Document module already exists for this module with the same name");
                }

                var entity = new MstDocumentModule
                {
                    strModuleGUID = createDto.strModuleGUID,
                    strModuleName = createDto.strModuleName,
                    bolIsActive = createDto.bolIsActive,
                    strCreatedByGUID = Guid.Parse(createdByGUID),
                    dtCreatedOn = DateTimeHelper.GetCurrentUtcTime()
                };

                _context.Set<MstDocumentModule>().Add(entity);
                await _context.SaveChangesAsync();

                return new DocumentModuleResponseDto
                {
                    strDocumentModuleGUID = entity.strDocumentModuleGUID.ToString(),
                    strModuleGUID = entity.strModuleGUID.ToString(),
                    strModuleName = entity.strModuleName,
                    bolIsActive = entity.bolIsActive
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating document module");
                throw new BusinessException("Error creating document module: " + ex.Message);
            }
        }

        public async Task<DocumentModuleResponseDto> UpdateAsync(string guid, DocumentModuleUpdateDto updateDto, string updatedByGUID)
        {
            try
            {
                var entity = await _context.Set<MstDocumentModule>()
                    .FirstOrDefaultAsync(x => x.strDocumentModuleGUID == Guid.Parse(guid));

                if (entity == null)
                    throw new BusinessException("Document module not found");

                entity.strModuleGUID = updateDto.strModuleGUID;
                entity.strModuleName = updateDto.strModuleName;
                entity.bolIsActive = updateDto.bolIsActive;
                entity.strUpdatedByGUID = Guid.Parse(updatedByGUID);
                entity.dtUpdatedOn = DateTimeHelper.GetCurrentUtcTime();

                await _context.SaveChangesAsync();

                return new DocumentModuleResponseDto
                {
                    strDocumentModuleGUID = entity.strDocumentModuleGUID.ToString(),
                    strModuleGUID = entity.strModuleGUID.ToString(),
                    strModuleName = entity.strModuleName,
                    bolIsActive = entity.bolIsActive
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document module");
                throw new BusinessException("Error updating document module: " + ex.Message);
            }
        }

        public async Task<DocumentModuleResponseDto> GetByIdAsync(string guid)
        {
            try
            {
                var entity = await _context.Set<MstDocumentModule>()
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.strDocumentModuleGUID == Guid.Parse(guid));

                if (entity == null)
                    throw new BusinessException("Document module not found");

                return new DocumentModuleResponseDto
                {
                    strDocumentModuleGUID = entity.strDocumentModuleGUID.ToString(),
                    strModuleGUID = entity.strModuleGUID.ToString(),
                    strModuleName = entity.strModuleName,
                    bolIsActive = entity.bolIsActive
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving document module");
                throw new BusinessException("Error retrieving document module: " + ex.Message);
            }
        }

        public async Task<PagedResponse<DocumentModuleResponseDto>> GetAllAsync(DocumentModuleFilterDto filterDto)
        {
            try
            {
                // Join mstDocumentModule with mstModule so strModuleName comes from mstModule.strName
                var query =
                    from dm in _context.Set<MstDocumentModule>().AsNoTracking()
                    join m in _context.Set<MstModule>().AsNoTracking()
                        on dm.strModuleGUID equals m.strModuleGUID
                    select new { dm, m };

                // Apply search filter against mstModule.strName
                if (!string.IsNullOrEmpty(filterDto.Search))
                {
                    query = query.Where(x => x.m.strName.Contains(filterDto.Search));
                }

                // Apply active filter from document module
                if (filterDto.bolIsActive.HasValue)
                {
                    query = query.Where(x => x.dm.bolIsActive == filterDto.bolIsActive.Value);
                }

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)filterDto.PageSize);

                var items = await query
                    .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                    .Take(filterDto.PageSize)
                    .Select(x => new DocumentModuleResponseDto
                    {
                        strDocumentModuleGUID = x.dm.strDocumentModuleGUID.ToString(),
                        strModuleGUID = x.dm.strModuleGUID.ToString(),
                        // source of name is mstModule.strName
                        strModuleName = x.m.strName,
                        bolIsActive = x.dm.bolIsActive
                    })
                    .ToListAsync();

                return new PagedResponse<DocumentModuleResponseDto>
                {
                    Items = items,
                    PageNumber = filterDto.PageNumber,
                    PageSize = filterDto.PageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving document modules");
                throw new BusinessException("Error retrieving document modules: " + ex.Message);
            }
        }

        public async Task<List<DocumentModuleResponseDto>> GetActiveByModuleGUIDAsync(Guid moduleGUID)
        {
            try
            {
                var entities = await _context.Set<MstDocumentModule>()
                    .AsNoTracking()
                    .Where(x => x.strModuleGUID == moduleGUID && x.bolIsActive == true)
                    .ToListAsync();

                return entities.Select(x => new DocumentModuleResponseDto
                {
                    strDocumentModuleGUID = x.strDocumentModuleGUID.ToString(),
                    strModuleGUID = x.strModuleGUID.ToString(),
                    strModuleName = x.strModuleName,
                    bolIsActive = x.bolIsActive
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active document modules for module {ModuleGUID}", moduleGUID);
                throw new BusinessException("Error retrieving active document modules: " + ex.Message);
            }
        }

        public async Task<bool> DeleteAsync(string guid)
        {
            try
            {
                var entity = await _context.Set<MstDocumentModule>()
                    .FirstOrDefaultAsync(x => x.strDocumentModuleGUID == Guid.Parse(guid));

                if (entity == null)
                    return false;

                _context.Set<MstDocumentModule>().Remove(entity);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document module");
                throw new BusinessException("Error deleting document module: " + ex.Message);
            }
        }
    }
}
