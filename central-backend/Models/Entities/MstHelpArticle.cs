using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstHelpArticle")]
    public class MstHelpArticle
    {
        public MstHelpArticle()
        {
            strArticleGUID = Guid.NewGuid();
            dtCreatedOn = Helpers.DateTimeHelper.GetCurrentUtcTime();
            bolIsActive = true;
            bolIsFeatured = false;
        }

        [Key]
        [Required]
        public Guid strArticleGUID { get; set; }

        [Required]
        public Guid strCategoryGUID { get; set; }

        [ForeignKey("strCategoryGUID")]
        public virtual MstHelpCategory? Category { get; set; }

        public Guid? strModuleGUID { get; set; }

        [ForeignKey("strModuleGUID")]
        public virtual MstModule? Module { get; set; }

        [Required]
        [MaxLength(200)]
        public string strTitle { get; set; } = string.Empty;

        [Required]
        public string strContent { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? strVideoUrl { get; set; }

        [Required]
        public int intOrder { get; set; } = 0;

        [Required]
        public bool bolIsActive { get; set; }

        [Required]
        public bool bolIsFeatured { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strModifiedByGUID { get; set; }

        public DateTime? dtModifiedOn { get; set; }
    }
}
