using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AuditSoftware.Models.Entities;

[Table("mstPageTemplate")]
[Index(nameof(strPageTemplateName), IsUnique = true, Name = "IX_mstPageTemplate_Name")]
public class MstPageTemplate
{
    [Key]
    public Guid strPageTemplateGUID { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string strPageTemplateName { get; set; } = string.Empty;
    
    public bool bolIsSave { get; set; } = false;
    
    public bool bolIsView { get; set; } = false;
    
    public bool bolIsEdit { get; set; } = false;
    
    public bool bolIsDelete { get; set; } = false;
    
    public bool bolIsPrint { get; set; } = false;
    
    public bool bolIsExport { get; set; } = false;
    
    public bool bolIsImport { get; set; } = false;
    
    public bool bolIsApprove { get; set; } = false;
    
    [StringLength(50)]
    public Guid? strCreatedByGUID { get; set; }
    
    public DateTime? dtCreated { get; set; }
    
    [StringLength(50)]
    public Guid? strModifiedByGUID { get; set; }
    
    public DateTime? dtModified { get; set; }
    
    public bool? bolIsSystemCreated { get; set; } = false;
}
