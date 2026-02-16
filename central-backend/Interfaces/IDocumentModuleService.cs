using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.DocumentModule;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.Interfaces
{
    public interface IDocumentModuleService
    {
        Task<DocumentModuleResponseDto> CreateAsync(DocumentModuleCreateDto createDto, string createdByGUID);
        Task<DocumentModuleResponseDto> UpdateAsync(string guid, DocumentModuleUpdateDto updateDto, string updatedByGUID);
        Task<DocumentModuleResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<DocumentModuleResponseDto>> GetAllAsync(DocumentModuleFilterDto filterDto);
        Task<List<DocumentModuleResponseDto>> GetActiveByModuleGUIDAsync(Guid moduleGUID);
        Task<bool> DeleteAsync(string guid);
    }
}
