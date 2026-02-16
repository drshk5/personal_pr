using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstMasterMenu")]
    public class MstMasterMenu
    {
        [Key]
        [Column("strMasterMenuGUID")]
        public Guid strMasterMenuGUID { get; set; }
        
        [Column("strParentMenuGUID")]
        public Guid? strParentMenuGUID { get; set; }

        [Column("strModuleGUID")]
        public Guid? strModuleGUID { get; set; }

        [ForeignKey(nameof(strParentMenuGUID))]
        public virtual MstMasterMenu? ParentMasterMenu { get; set; }

        [InverseProperty(nameof(ParentMasterMenu))]
        public virtual ICollection<MstMasterMenu> ChildMasterMenus { get; set; } = new List<MstMasterMenu>();

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

        /// <summary>
        /// Indicates if this is a single menu item (not part of a group)
        /// </summary>
        [Required]
        public bool bolIsSingleMenu { get; set; } = false;

    }
}
