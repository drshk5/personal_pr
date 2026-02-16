using AutoMapper;
using AuditSoftware.Data;
using AuditSoftware.DTOs.DocumentAssociation;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AuditSoftware.Services
{
    public class DocumentAssociationService : ServiceBase, IDocumentAssociationService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<DocumentAssociationService> _logger;

        public DocumentAssociationService(
            AppDbContext context,
            IMapper mapper,
            ILogger<DocumentAssociationService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<DocumentAssociationResponseDto> CreateAsync(DocumentAssociationCreateDto createDto, Guid currentUserGuid)
        {
            var entity = new MstDocumentAssociation
            {
                strDocumentGUID = createDto.strDocumentGUID,
                strEntityGUID = createDto.strEntityGUID,
                strEntityName = createDto.strEntityName,
                strCreatedByGUID = currentUserGuid,
                dtCreatedOn = CurrentDateTime
            };

            _context.Add(entity);
            await _context.SaveChangesAsync();

            return await GetByIdAsync(entity.strDocumentAssociationGUID);
        }

        public async Task<bool> DeleteAsync(Guid associationGuid, Guid currentUserGuid)
        {
            var entity = await _context.Set<MstDocumentAssociation>()
                .FirstOrDefaultAsync(x => x.strDocumentAssociationGUID == associationGuid);

            if (entity == null)
                throw new BusinessException("Document association not found");

            _context.Remove(entity);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<DocumentAssociationResponseDto>> GetByDocumentGuidAsync(Guid documentGuid)
        {
            var entities = await _context.Set<MstDocumentAssociation>()
                .Include(da => da.Document)
                .Where(x => x.strDocumentGUID == documentGuid)
                .ToListAsync();

            var result = new List<DocumentAssociationResponseDto>();

            foreach (var entity in entities)
            {
                var dto = _mapper.Map<DocumentAssociationResponseDto>(entity);
                
                // Get creator name
                var creator = await _context.Set<MstUser>()
                    .FirstOrDefaultAsync(u => u.strUserGUID == entity.strCreatedByGUID);
                
                if (creator != null)
                {
                    dto.strCreatedByName = creator.strName;
                }

                // Get updater name if available
                if (entity.strUpdatedByGUID.HasValue)
                {
                    var updater = await _context.Set<MstUser>()
                        .FirstOrDefaultAsync(u => u.strUserGUID == entity.strUpdatedByGUID);
                    
                    if (updater != null)
                    {
                        dto.strUpdatedByName = updater.strName;
                    }
                }
                
                result.Add(dto);
            }

            return result;
        }

        public async Task<List<DocumentAssociationResponseDto>> GetByEntityGuidAsync(Guid entityGuid, string entityName)
        {
            var entities = await _context.Set<MstDocumentAssociation>()
                .Include(da => da.Document)
                .Where(x => x.strEntityGUID == entityGuid && x.strEntityName == entityName)
                .ToListAsync();

            var result = new List<DocumentAssociationResponseDto>();

            foreach (var entity in entities)
            {
                var dto = _mapper.Map<DocumentAssociationResponseDto>(entity);
                
                // Get creator name
                var creator = await _context.Set<MstUser>()
                    .FirstOrDefaultAsync(u => u.strUserGUID == entity.strCreatedByGUID);
                
                if (creator != null)
                {
                    dto.strCreatedByName = creator.strName;
                }

                // Get updater name if available
                if (entity.strUpdatedByGUID.HasValue)
                {
                    var updater = await _context.Set<MstUser>()
                        .FirstOrDefaultAsync(u => u.strUserGUID == entity.strUpdatedByGUID);
                    
                    if (updater != null)
                    {
                        dto.strUpdatedByName = updater.strName;
                    }
                }
                
                result.Add(dto);
            }

            return result;
        }

        public async Task<DocumentAssociationResponseDto> GetByIdAsync(Guid associationGuid)
        {
            var entity = await _context.Set<MstDocumentAssociation>()
                .Include(da => da.Document)
                .FirstOrDefaultAsync(x => x.strDocumentAssociationGUID == associationGuid);

            if (entity == null)
                throw new BusinessException("Document association not found");

            var dto = _mapper.Map<DocumentAssociationResponseDto>(entity);
            
            // Get creator name
            var creator = await _context.Set<MstUser>()
                .FirstOrDefaultAsync(u => u.strUserGUID == entity.strCreatedByGUID);
            
            if (creator != null)
            {
                dto.strCreatedByName = creator.strName;
            }

            // Get updater name if available
            if (entity.strUpdatedByGUID.HasValue)
            {
                var updater = await _context.Set<MstUser>()
                    .FirstOrDefaultAsync(u => u.strUserGUID == entity.strUpdatedByGUID);
                
                if (updater != null)
                {
                    dto.strUpdatedByName = updater.strName;
                }
            }
            
            return dto;
        }
    }
}