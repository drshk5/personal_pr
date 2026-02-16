using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.DTOs.Organization
{
public class OrganizationUpdateDto
{
    [Required(ErrorMessage = "Organization name is required")]
    [MaxLength(100, ErrorMessage = "Organization name cannot exceed 100 characters")]
    public string strOrganizationName { get; set; } = string.Empty;
    
    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? strDescription { get; set; }
    
    [MaxLength(20, ErrorMessage = "PAN cannot exceed 20 characters")]
    public string? strPAN { get; set; }
    
    [MaxLength(20, ErrorMessage = "TAN cannot exceed 20 characters")]
    public string? strTAN { get; set; }
    
    [MaxLength(21, ErrorMessage = "CIN cannot exceed 21 characters")]
    public string? strCIN { get; set; }
    
    public Guid? strParentOrganizationGUID { get; set; }
    
    // This property is used for file upload but is not stored in the database directly
    public IFormFile? LogoFile { get; set; }
    
    // Property to indicate if logo should be removed
    public bool? RemoveLogo { get; set; }
    
    // Frontend can send empty string to remove logo
    public string? LogoToRemove { get; set; }
    
    // Internal property not exposed in request body, will be set by the service based on the uploaded file
    [System.Text.Json.Serialization.JsonIgnore]
    internal string? strLogo { get; set; }        public bool bolIsActive { get; set; } = true;
        
        public bool bolIsTaxApplied { get; set; } = false;
        
        public Guid? strIndustryGUID { get; set; }
        
        [StringLength(50, ErrorMessage = "UDF code cannot exceed 50 characters")]
        public string? strUDFCode { get; set; }
        
        public Guid? strLegalStatusTypeGUID { get; set; }
        
        public Guid? strCurrencyTypeGUID { get; set; }
        
        public DateTime? dtClientAcquiredDate { get; set; }
        
        // Country for tax configuration
        public Guid? strCountryGUID { get; set; }
        
        // Tax Configuration fields (optional - only for organizations that need tax setup)
        public Guid? strTaxTypeGUID { get; set; }
        
        [MaxLength(50, ErrorMessage = "Tax registration number cannot exceed 50 characters")]
        public string? strTaxRegNo { get; set; }
        
        public Guid? strStateGUID { get; set; }
        
        public DateTime? dtRegistrationDate { get; set; }
        
        public bool bolIsDefaultTaxConfig { get; set; } = true;

        [MaxLength(4000, ErrorMessage = "Tax settings JSON cannot exceed 4000 characters")]
        public string? jsonTaxSettings { get; set; }

        // =========================
        // BILLING ADDRESS
        // =========================
        [MaxLength(150, ErrorMessage = "Billing attention cannot exceed 150 characters")]
        public string? strAttention_billing { get; set; }

        public Guid? strCountryGUID_billing { get; set; }

        [MaxLength(500, ErrorMessage = "Billing address cannot exceed 500 characters")]
        public string? strAddress_billing { get; set; }

        public Guid? strStateGUID_billing { get; set; }

        public Guid? strCityGUID_billing { get; set; }

        [MaxLength(20, ErrorMessage = "Billing pin code cannot exceed 20 characters")]
        public string? strPinCode_billing { get; set; }

        [MaxLength(30, ErrorMessage = "Billing phone cannot exceed 30 characters")]
        public string? strPhone_billing { get; set; }

        [MaxLength(30, ErrorMessage = "Billing fax number cannot exceed 30 characters")]
        public string? strFaxNumber_billing { get; set; }

        // =========================
        // SHIPPING ADDRESS
        // =========================
        [MaxLength(150, ErrorMessage = "Shipping attention cannot exceed 150 characters")]
        public string? strAttention_shipping { get; set; }

        public Guid? strCountryGUID_shipping { get; set; }

        [MaxLength(500, ErrorMessage = "Shipping address cannot exceed 500 characters")]
        public string? strAddress_shipping { get; set; }

        public Guid? strStateGUID_shipping { get; set; }

        public Guid? strCityGUID_shipping { get; set; }

        [MaxLength(20, ErrorMessage = "Shipping pin code cannot exceed 20 characters")]
        public string? strPinCode_shipping { get; set; }

        [MaxLength(30, ErrorMessage = "Shipping phone cannot exceed 30 characters")]
        public string? strPhone_shipping { get; set; }

        [MaxLength(30, ErrorMessage = "Shipping fax number cannot exceed 30 characters")]
        public string? strFaxNumber_shipping { get; set; }
    }
} 