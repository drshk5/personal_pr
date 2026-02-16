using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.UserRights
{
    public class UserRightsCreateDto
    {
        [Required]
        public Guid strUserRoleGUID { get; set; }

        [Required]
        public Guid strMenuGUID { get; set; }

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