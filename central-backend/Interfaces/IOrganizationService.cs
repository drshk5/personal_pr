using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Organization;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IOrganizationService
    {
        Task<PagedResponse<OrganizationResponseDto>> GetAllOrganizationsAsync(OrganizationFilterDto filterDto, string timeZoneId = DateTimeProvider.DefaultTimeZone);
            
        Task<OrganizationResponseDto?> GetOrganizationByIdAsync(Guid guid, string timeZoneId = "Asia/Kolkata");
        
        Task<OrganizationResponseDto> CreateOrganizationAsync(
            OrganizationCreateDto organizationDto, Guid createdByGuid, Guid groupGuid, Guid? userRoleGuid = null, Guid? yearGuid = null, Guid? moduleGuid = null);
            
        Task<OrganizationResponseDto?> UpdateOrganizationAsync(
            Guid guid, OrganizationUpdateDto organizationDto, Guid updatedByGuid, Guid groupGuid);
            
        Task<bool> DeleteOrganizationAsync(Guid guid, Guid groupGuid);
        
        Task<List<OrganizationResponseDto>> GetActiveOrganizationsAsync(Guid groupGuid);
        
        Task<(byte[] FileContents, string ContentType, string FileName)> ExportOrganizationsAsync(string format, Guid groupGuid);

        Task<ExchangeRateResponseDto?> GetExchangeRateAsync(Guid strCurrencyTypeGUID, Guid strOrganizationGUID);
    }
} 