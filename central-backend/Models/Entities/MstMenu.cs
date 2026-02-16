using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstMenu")]
    public class MstMenu
    {
        [Key]
        public Guid strMenuGUID { get; set; }
        
        public Guid? strMasterMenuGUID { get; set; }
        
        public Guid? strParentMenuGUID { get; set; }

        [ForeignKey("strParentMenuGUID")]
        public MstMenu? ParentMenu { get; set; }

        [Required]
        public double dblSeqNo { get; set; }

        [Required]
        [StringLength(100)]
        public string strName { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string strPath { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string strMenuPosition { get; set; } = string.Empty;

        [Required]
        public bool bolHasSubMenu { get; set; }

        [StringLength(50)]
        public string? strIconName { get; set; }

        [Required]
        public bool bolIsActive { get; set; }

        [Required]
        [StringLength(100)]
        public string strMapKey { get; set; } = string.Empty;

        [Required]
        public bool bolSuperAdminAccess { get; set; } = false;

        [StringLength(50)]
        public string? strCategory { get; set; }

        public Guid? strPageTemplateGUID { get; set; }

        [Required]
        public bool bolIsSingleMenu { get; set; } = false;

        public Guid? strGroupGUID { get; set; }
        
        [ForeignKey("strGroupGUID")]
        public virtual MstGroup? Group { get; set; }

        public Guid? strModuleGUID { get; set; }

        [ForeignKey("strModuleGUID")]
        public virtual MstModule? Module { get; set; }

        // Navigation property for child menus
        public virtual ICollection<MstMenu> ChildMenus { get; set; } = new List<MstMenu>();
    }
} 