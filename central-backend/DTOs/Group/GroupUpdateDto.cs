using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.DTOs.Group;

public class GroupUpdateDto
{
    [Required(ErrorMessage = "Group name is required")]
    [MaxLength(100, ErrorMessage = "Group name cannot exceed 100 characters")]
    public string strName { get; set; } = string.Empty;
    
    [MaxLength(50, ErrorMessage = "License number cannot exceed 50 characters")]
    public string? strLicenseNo { get; set; }
    
    [MaxLength(20, ErrorMessage = "PAN cannot exceed 20 characters")]
    public string? strPAN { get; set; }
    
    [MaxLength(20, ErrorMessage = "TAN cannot exceed 20 characters")]
    public string? strTAN { get; set; }
    
    [MaxLength(50, ErrorMessage = "CIN cannot exceed 50 characters")]
    public string? strCIN { get; set; }
    
    public DateTime? dtLicenseIssueDate { get; set; }
    
    public DateTime? dtLicenseExpired { get; set; }
    
    // Tax Configuration fields
    public bool bolTaxApplicable { get; set; } = false;
    public bool bolGSTApplicable { get; set; } = false;
    public bool bolIGSTApplicable { get; set; } = false;
    public bool bolSGSTApplicable { get; set; } = false;
    public bool bolCGSTApplicable { get; set; } = false;
    public bool bolVATApplicable { get; set; } = false;
    
    // This property is used for file upload but is not stored in the database directly
    public IFormFile? LogoFile { get; set; }
    
    // Internal property not exposed in request body, will be set by the service based on the uploaded file
    [System.Text.Json.Serialization.JsonIgnore]
    internal string? strLogo { get; set; }
}