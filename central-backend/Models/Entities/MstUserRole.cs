using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities;

[Table("mstUserRoles")]
public class MstUserRole
{
    [Key]
    [Required]
    public Guid strUserRoleGUID { get; set; } = Guid.NewGuid();

    [Required]
    [StringLength(100)]
    public string strName { get; set; } = string.Empty;

    [StringLength(500)]
    public string? strDesc { get; set; }

    public bool bolIsActive { get; set; }
    
    [Required]
    public bool bolSystemCreated { get; set; } = false;

    [Required]
    public Guid strGroupGUID { get; set; }
    
    [ForeignKey("strGroupGUID")]
    public MstGroup MstGroup { get; set; } = null!;
    
    public Guid? strModuleGUID { get; set; }
    
    [ForeignKey("strModuleGUID")]
    public MstModule? Module { get; set; }

    public DateTime dtCreatedOn { get; set; }

    [Required]
    public Guid strCreatedByGUID { get; set; }
    
    [ForeignKey("strCreatedByGUID")]
    public MstUser CreatedByUser { get; set; } = null!;

    public DateTime? dtUpdatedOn { get; set; }

    public Guid? strUpdatedByGUID { get; set; }
    
    [ForeignKey("strUpdatedByGUID")]
    public MstUser? UpdatedByUser { get; set; }
} 