using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.MasterMenu
{
    public class MasterMenuCreateDto
    {
        /// <summary>
        /// Parent master menu GUID. 
        /// - If not provided (null), the menu will be created as a root menu
        /// - If set to "root", the menu will be created as a root menu
        /// - If a valid menu GUID is provided, the menu will be created as a child of that menu
        /// </summary>
        public string? strParentMenuGUID { get; set; }
        
        public string? strModuleGUID { get; set; }
        
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
        [StringLength(100)]
        public string strMapKey { get; set; } = string.Empty;

        [Required]
        public bool bolHasSubMenu { get; set; }

        [StringLength(50)]
        public string? strIconName { get; set; }

        [Required]
        public bool bolIsActive { get; set; } = true;

        [Required]
        public bool bolSuperAdminAccess { get; set; } = false;

        [StringLength(50)]
        public string? strCategory { get; set; }

        /// <summary>
        /// The GUID of the page template associated with this menu item, if any.
        /// </summary>
        public string? strPageTemplateGUID { get; set; }

        /// <summary>
        /// Indicates if this is a single menu item (not part of a group)
        /// </summary>
        public bool bolIsSingleMenu { get; set; } = false;
    }
}
