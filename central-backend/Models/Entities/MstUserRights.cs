using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstUserRights")]
    public class MstUserRights
    {
    [Key]
    public Guid strUserRightGUID { get; set; } = Guid.NewGuid();

    [Required]
    public Guid strUserRoleGUID { get; set; }

        [ForeignKey("strUserRoleGUID")]
        public MstUserRole MstUserRole { get; set; } = null!;

        [Required]
        public Guid strMenuGUID { get; set; }

        [ForeignKey("strMenuGUID")]
        public MstMenu MstMenu { get; set; } = null!;

        [Required]
        public bool bolCanView { get; set; }

        [Required]
        public bool bolCanEdit { get; set; }

        [Required]
        public bool bolCanSave { get; set; }

        [Required]
        public bool bolCanDelete { get; set; }

        [Required]
        public bool bolCanPrint { get; set; }

        [Required]
        public bool bolCanExport { get; set; }

        [Required]
        public bool bolCanImport { get; set; }

        [Required]
        public bool bolCanApprove { get; set; }
    }
} 