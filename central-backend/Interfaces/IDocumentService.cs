using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Document;

namespace AuditSoftware.Interfaces
{
    public interface IDocumentService
    {
        Task<DocumentResponseDto> CreateAsync(DocumentCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, Guid? yearGuid = null, Guid? moduleGuid = null);
        Task<DocumentResponseDto> UpdateAsync(Guid guid, DocumentUpdateDto updateDto, Guid currentUserGuid);
        Task<bool> DeleteAsync(Guid guid, Guid currentUserGuid);
        Task<BulkOperationResultDto> BulkDeleteAsync(List<Guid> strDocumentGUIDs, Guid currentUserGuid, Guid? entityGuid = null);
        Task<BulkOperationResultDto> BulkChangeDeleteStatusAsync(List<Guid> strDocumentGUIDs, bool bolIsDeleted, Guid currentUserGuid);
        Task<BulkOperationResultDto> BulkMoveToFolderAsync(List<Guid> strDocumentGUIDs, Guid strFolderGUID, Guid currentUserGuid);
        Task<DocumentResponseDto> GetByIdAsync(Guid guid);
        Task<PagedResponse<DocumentResponseDto>> GetAllAsync(DocumentFilterDto filterDto, Guid groupGuid, Guid organizationGuid, Guid? yearGuid = null);
        Task<PagedResponse<DocumentExtendedResponseDto>> GetAllExtendedAsync(DocumentFilterDto filterDto, Guid groupGuid, Guid organizationGuid, Guid? yearGuid = null, Guid? moduleGuid = null, string? timeZoneId = null);
        Task<BulkOperationResultDto> BulkAssignAsync(DocumentBulkAssignDto dto, Guid currentUserGuid);
    }
}


