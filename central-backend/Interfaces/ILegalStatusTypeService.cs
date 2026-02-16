using System.Threading.Tasks;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.LegalStatusType;

namespace AuditSoftware.Interfaces
{
    public interface ILegalStatusTypeService
    {
        Task<LegalStatusTypeResponseDto> CreateAsync(LegalStatusTypeCreateDto createDto, string createdByGUID);
        Task<LegalStatusTypeResponseDto> UpdateAsync(string guid, LegalStatusTypeUpdateDto updateDto, string updatedByGUID);
        Task<LegalStatusTypeResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<LegalStatusTypeResponseDto>> GetAllAsync(LegalStatusTypeFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<LegalStatusTypeSimpleDto>> GetActiveLegalStatusTypesAsync(string search = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportLegalStatusTypesAsync(string format);
    }
}
