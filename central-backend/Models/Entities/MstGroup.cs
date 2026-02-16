using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AuditSoftware.Models.Entities;

[Table("mstGroup")]
[Index(nameof(strPAN), IsUnique = true, Name = "IX_mstGroup_PAN")]
[Index(nameof(strTAN), IsUnique = true, Name = "IX_mstGroup_TAN")]
[Index(nameof(strCIN), IsUnique = true, Name = "IX_mstGroup_CIN")]
[Index(nameof(strLicenseNo), IsUnique = true, Name = "IX_mstGroup_LicenseNo")]
public class MstGroup
{
    [Key]
    public Guid strGroupGUID { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string strName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(50)]
    public string strLicenseNo { get; set; } = string.Empty;
    
    [MaxLength(20)]
    public string? strPAN { get; set; }
    
    [MaxLength(20)]
    public string? strTAN { get; set; }
    
    [MaxLength(50)]
    public string? strCIN { get; set; }
    
    // strCurrencyTypeGUID has been removed as it doesn't exist in the database
    
    [Required]
    public DateTime dtLicenseIssueDate { get; set; }
    
    [Required]
    public DateTime dtLicenseExpired { get; set; }
    
    [MaxLength(255)]
    public string? strLogo { get; set; }
    
    [StringLength(50)]
    public string? strCreatedByGUID { get; set; }
    
    public DateTime dtCreatedOn { get; set; }
    
    [StringLength(50)]
    public string? strUpdatedByGUID { get; set; }
    
    public DateTime? dtUpdatedOn { get; set; }
} 