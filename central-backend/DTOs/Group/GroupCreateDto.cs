using System.ComponentModel.DataAnnotations;
using AutoMapper;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.DTOs.Group;

public class
GroupCreateDto
{
    [Required(ErrorMessage = "Group name is required")]
    [MaxLength(100, ErrorMessage = "Group name cannot exceed 100 characters")]
    public string strName { get; set; } = string.Empty;

    [MaxLength(50, ErrorMessage = "License number cannot exceed 50 characters")]
    public string? strLicenseNo { get; set; }

    [MaxLength(50, ErrorMessage = "Industry GUID cannot exceed 50 characters")]
    public string? strIndustryGUID { get; set; }
    
    [MaxLength(50, ErrorMessage = "Legal status type GUID cannot exceed 50 characters")]
    public string? strLegalStatusTypeGUID { get; set; }
    
    // strCurrencyTypeGUID has been removed as it doesn't exist in the database
    
    [MaxLength(20, ErrorMessage = "PAN cannot exceed 20 characters")]
    public string? strPAN { get; set; }

    [MaxLength(20, ErrorMessage = "TAN cannot exceed 20 characters")]
    public string? strTAN { get; set; }

    [MaxLength(50, ErrorMessage = "CIN cannot exceed 50 characters")]
    public string? strCIN { get; set; }

    [MaxLength(50, ErrorMessage = "UDF Code cannot exceed 50 characters")]
    public string? strUDFCode { get; set; }

    public DateTime? dtLicenseIssueDate { get; set; }

    public DateTime? dtLicenseExpired { get; set; }
    
    // This property is used for file upload but is not stored in the database directly
    public IFormFile? LogoFile { get; set; }
    
    // Internal property not exposed in request body, will be set by the service based on the uploaded file
    [System.Text.Json.Serialization.JsonIgnore]
    internal string? strLogo { get; set; }

    // Organization fields: Country for tax configuration
    public Guid? strCountryGUID { get; set; }
    
    // Organization fields: Currency
    public Guid? strCurrencyGUID { get; set; }
    
    // Organization fields: Tax Configuration (optional - only for organizations that need tax setup)
    public Guid? strTaxTypeGUID { get; set; }
    
    [MaxLength(50, ErrorMessage = "Tax registration number cannot exceed 50 characters")]
    public string? strTaxRegNo { get; set; }
    
    public Guid? strStateGUID { get; set; }
    
    public DateTime? dtRegistrationDate { get; set; }
    
    public bool bolIsDefaultTaxConfig { get; set; } = true;
    
    public bool bolIsTaxApplied { get; set; } = false;
    
    [MaxLength(4000, ErrorMessage = "Tax settings JSON cannot exceed 4000 characters")]
    public string? jsonTaxSettings { get; set; }

    [Required(ErrorMessage = "Admin name is required")]
    [MaxLength(100, ErrorMessage = "Admin name cannot exceed 100 characters")]
    public string strAdminName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Admin mobile number is required")]
    [MaxLength(15, ErrorMessage = "Mobile number cannot exceed 15 characters")]
    [Phone(ErrorMessage = "Please enter a valid mobile number")]
    public string strAdminMobileNo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Admin email is required")]
    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
    public string strAdminEmailId { get; set; } = string.Empty;

    [Required(ErrorMessage = "Admin password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    [MaxLength(100, ErrorMessage = "Password cannot exceed 100 characters")]
    public string strAdminPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Timezone is required")]
    [MaxLength(50, ErrorMessage = "Timezone cannot exceed 50 characters")]
    public string strTimeZone { get; set; } = "Asia/Kolkata";

    // Year creation fields
    [Required(ErrorMessage = "Year name is required")]
    [MaxLength(50, ErrorMessage = "Year name cannot exceed 50 characters")]
    public string strYearName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Year start date is required")]
    public DateTime dtStartDate { get; set; }

    [Required(ErrorMessage = "Year end date is required")]
    public DateTime dtEndDate { get; set; }

    // Optional: initial designation and department GUIDs to assign to the group's admin user
    public string? strDesignationGUID { get; set; }
    public string? strDepartmentGUID { get; set; }
} 