using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.PicklistValue;

namespace AuditSoftware.Interfaces
{
    public interface IPicklistValueService
    {
        Task<PicklistValueResponseDto> CreateAsync(PicklistValueCreateDto createDto, string createdByGUID, string groupGUID);
        Task<PicklistValueResponseDto> UpdateAsync(string guid, PicklistValueUpdateDto updateDto, string updatedByGUID, string groupGUID);
        Task<PicklistValueResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<PicklistValueResponseDto>> GetAllAsync(PicklistValueFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<PicklistValueSimpleDto>> GetActivePicklistValuesByTypeAsync(string strType, string? search = null, string? groupGUID = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportPicklistValuesAsync(string format, string groupGuid);
    }
} 