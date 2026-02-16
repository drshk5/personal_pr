using AuditSoftware.DTOs.DocumentAssociation;

namespace AuditSoftware.Interfaces
{
    public interface IDocumentAssociationService
    {
        Task<DocumentAssociationResponseDto> CreateAsync(DocumentAssociationCreateDto createDto, Guid currentUserGuid);
        Task<DocumentAssociationResponseDto> GetByIdAsync(Guid associationGuid);
        Task<List<DocumentAssociationResponseDto>> GetByDocumentGuidAsync(Guid documentGuid);
        Task<List<DocumentAssociationResponseDto>> GetByEntityGuidAsync(Guid entityGuid, string entityName);
        Task<bool> DeleteAsync(Guid associationGuid, Guid currentUserGuid);
    }
}