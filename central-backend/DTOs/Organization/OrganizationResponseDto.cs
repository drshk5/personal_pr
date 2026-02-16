using System;

namespace AuditSoftware.DTOs.Organization
{
    public class OrganizationResponseDto
    {
        public Guid strOrganizationGUID { get; set; }
        public string strOrganizationName { get; set; } = string.Empty;
        public string? strDescription { get; set; }
        public string? strPAN { get; set; }
        public string? strTAN { get; set; }
        public string? strCIN { get; set; }
        public Guid? strParentOrganizationGUID { get; set; }
        public string? strParentOrganizationName { get; set; }
        public bool bolIsActive { get; set; }
        public bool bolIsTaxApplied { get; set; }
        public Guid? strIndustryGUID { get; set; }
        public string? strIndustryCodeName { get; set; }
        public string? strUDFCode { get; set; }
        public Guid? strLegalStatusTypeGUID { get; set; }
        public string? strLegalStatusCodeName { get; set; }
        public Guid? strCurrencyTypeGUID { get; set; }
        public string? strLogo { get; set; }
        public string? strCurrencyTypeName { get; set; }
        public DateTime? dtClientAcquiredDate { get; set; }
        public Guid strGroupGUID { get; set; }
        
        // Country field
        public Guid? strCountryGUID { get; set; }
        public string? strCountryName { get; set; }
        
        // Tax configuration fields
        public Guid? strTaxTypeGUID { get; set; }
        public string? strTaxTypeName { get; set; }
        public string? strTaxTypeCode { get; set; }
        public string? strTaxRegNo { get; set; }
        public Guid? strStateGUID { get; set; }
        public string? strStateName { get; set; }
        public DateTime? dtRegistrationDate { get; set; }
        public bool bolIsDefaultTaxConfig { get; set; }
        public string? jsonTaxSettings { get; set; }
        
        public Guid strCreatedByGUID { get; set; }
        public string? strCreatedBy { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public Guid? strUpdatedByGUID { get; set; }
        public string? strUpdatedBy { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
        public bool bolSystemCreated { get; set; }

        // =========================
        // BILLING ADDRESS
        // =========================
        public string? strAttention_billing { get; set; }
        public Guid? strCountryGUID_billing { get; set; }
        public string? strCountryName_billing { get; set; }
        public string? strAddress_billing { get; set; }
        public Guid? strStateGUID_billing { get; set; }
        public string? strStateName_billing { get; set; }
        public Guid? strCityGUID_billing { get; set; }
        public string? strCityName_billing { get; set; }
        public string? strPinCode_billing { get; set; }
        public string? strPhone_billing { get; set; }
        public string? strFaxNumber_billing { get; set; }

        // =========================
        // SHIPPING ADDRESS
        // =========================
        public string? strAttention_shipping { get; set; }
        public Guid? strCountryGUID_shipping { get; set; }
        public string? strCountryName_shipping { get; set; }
        public string? strAddress_shipping { get; set; }
        public Guid? strStateGUID_shipping { get; set; }
        public string? strStateName_shipping { get; set; }
        public Guid? strCityGUID_shipping { get; set; }
        public string? strCityName_shipping { get; set; }
        public string? strPinCode_shipping { get; set; }
        public string? strPhone_shipping { get; set; }
        public string? strFaxNumber_shipping { get; set; }

        // Formatted date properties for display
        public string strFormattedCreatedOn => AuditSoftware.Helpers.DateTimeProvider.ToIst(dtCreatedOn).ToString("dd-MMM-yyyy hh:mm:ss tt");
        public string? strFormattedUpdatedOn => dtUpdatedOn.HasValue ? AuditSoftware.Helpers.DateTimeProvider.ToIst(dtUpdatedOn.Value).ToString("dd-MMM-yyyy hh:mm:ss tt") : null;
        public string? strFormattedClientAcquiredDate => dtClientAcquiredDate.HasValue ? AuditSoftware.Helpers.DateTimeProvider.ToIst(dtClientAcquiredDate.Value).ToString("dd-MMM-yyyy") : null;
        public string? FormattedClientAcquiredDate => dtClientAcquiredDate?.ToString("dd-MMM-yyyy");
    }
} 