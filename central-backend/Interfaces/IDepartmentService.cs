using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Department;

namespace AuditSoftware.Interfaces
{
    public interface IDepartmentService
    {
        Task<DepartmentResponseDto> CreateAsync(DepartmentCreateDto createDto, string createdByGUID, string groupGUID);
        Task<DepartmentResponseDto> UpdateAsync(string guid, DepartmentUpdateDto updateDto, string updatedByGUID, string groupGUID);
        Task<DepartmentResponseDto> GetByIdAsync(string guid);
        Task<PagedResponse<DepartmentResponseDto>> GetAllAsync(DepartmentFilterDto filterDto);
        Task<bool> DeleteAsync(string guid);
        Task<List<DepartmentSimpleDto>> GetActiveDepartmentsAsync(string? search = null, string? groupGUID = null);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportDepartmentsAsync(string format, string groupGuid);
    }
}
