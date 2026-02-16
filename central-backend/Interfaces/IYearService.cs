using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuditSoftware.DTOs.Year;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.Interfaces
{
    public interface IYearService
    {
        Task<YearResponseDto> CreateAsync(YearCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid);
        Task<YearResponseDto> CreateWithoutTransactionAsync(YearCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, bool isSystemCreated = false);
        Task<YearResponseDto> GetByIdAsync(Guid yearGuid);
        Task<PagedResponse<YearResponseDto>> GetAllAsync(BaseFilterDto filterDto);
        Task<PagedResponse<YearResponseDto>> GetAllAsync(BaseFilterDto filterDto, Guid organizationGuid);
        Task<PagedResponse<YearResponseDto>> GetAllAsync(YearFilterDto filterDto, Guid organizationGuid);
        Task<PagedResponse<YearResponseDto>> GetYearsByOrganizationAsync(Guid organizationGuid, BaseFilterDto filterDto);
        Task<List<YearSimpleResponseDto>> GetSimpleYearsByOrganizationAsync(Guid organizationGuid);
        Task<List<YearSimpleResponseDto>> GetSimpleYearsByOrganizationAndUserAsync(Guid organizationGuid, Guid userGuid);
        Task<List<YearSimpleResponseDto>> GetActiveYearsByOrganizationAsync(Guid organizationGuid);
        Task<YearResponseDto> UpdateAsync(Guid yearGuid, YearUpdateDto updateDto, Guid currentUserGuid);
        Task<bool> DeleteAsync(Guid yearGuid);
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportYearsAsync(string format, Guid groupGuid, Guid organizationGuid);
    }
} 