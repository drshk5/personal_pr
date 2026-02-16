using System;
using System.Collections.Generic;
using AuditSoftware.DTOs.OrgTaxConfig;

namespace AuditSoftware.DTOs.Auth
{
    public class UserProfileResponseDto
    {
        // User basic information
        public required string strUserGUID { get; set; }
        public required string strName { get; set; }
        public required string strEmailId { get; set; }
        public required string strMobileNo { get; set; }
        public DateTime? dtBirthDate { get; set; }
        public bool bolIsActive { get; set; }
        public TimeSpan? dtWorkingStartTime { get; set; }
        public TimeSpan? dtWorkingEndTime { get; set; }
        public bool bolIsSuperAdmin { get; set; }
        public string? strProfileImg { get; set; }
        public string strTimeZone { get; set; } = "Asia/Kolkata";
        
        // Modules information
        public List<ModuleInfo>? modules { get; set; }
        
        // Group information
        public string? strGroupGUID { get; set; }
        public string? strGroupName { get; set; } // Changed from strCompanyName for consistency
        public string? strGroupLogo { get; set; }
        
        // Organization information
        public string? strLastOrganizationGUID { get; set; }
        public string? strLastOrganizationName { get; set; }
        public string? strLastOrganizationLogo { get; set; }
        public string? strCountryGUID { get; set; }
        public string? strCurrencyTypeGUID { get; set; }
        public string? strCurrencyTypeName { get; set; }
        public string? strTaxTypeGUID { get; set; }
        public string? strTaxTypeCode { get; set; }
        public bool? bolIsTaxApplied { get; set; }
        
        // Year information
        public string? strLastYearGUID { get; set; }
        public string? strLastYearName { get; set; }
        public DateTime? dtYearStartDate { get; set; }
        public DateTime? dtYearEndDate { get; set; }
        
        // Module information
        public string? strLastModuleGUID { get; set; }
        public string? strLastModuleName { get; set; }
        public string? strLastModuleDesc { get; set; }
        
        // Role information
        public string? strUserRoleGUID { get; set; }
        public string? strUserRoleName { get; set; }
        
        // Tax configuration for current organization
        public OrgTaxConfig.OrgTaxConfigResponseDto? tax { get; set; }
        
        // Additional audit information
        public required string strCreatedByGUID { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public string? strUpdatedByGUID { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
    }
}