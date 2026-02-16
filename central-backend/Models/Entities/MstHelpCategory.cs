using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstHelpCategory")]
    public class MstHelpCategory
    {
        public MstHelpCategory()
        {
            strCategoryGUID = Guid.NewGuid();
            dtCreatedOn = Helpers.DateTimeHelper.GetCurrentUtcTime();
            bolIsActive = true;
        }

        [Key]
        [Required]
        public Guid strCategoryGUID { get; set; }

        [Required]
        [MaxLength(100)]
        public string strCategoryName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? strDescription { get; set; }

        [MaxLength(50)]
        public string? strIcon { get; set; }

        public Guid? strModuleGUID { get; set; }

        [Required]
        public int intOrder { get; set; } = 0;

        [Required]
        public bool bolIsActive { get; set; }

        // Navigation property
        public virtual ICollection<MstHelpArticle>? Articles { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strModifiedByGUID { get; set; }

        public DateTime? dtModifiedOn { get; set; }
    }
}
