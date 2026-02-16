using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Menu
{
    public class MenuCreateDto
    {
        /// <summary>
        /// Parent menu GUID. 
        /// - If not provided (null), the menu will be created as a root menu
        /// - If set to "root", the menu will be created as a root menu
        /// - If a valid menu GUID is provided, the menu will be created as a child of that menu
        /// </summary>
        public string? strParentMenuGUID { get; set; }
        
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
        
        /// <summary>
        /// Category for the menu. This can be used to group menus by category.
        /// </summary>
        [StringLength(50)]
        public string? strCategory { get; set; }

        /// <summary>
        /// Page Template GUID. If provided, the menu will be associated with the specified page template.
        /// </summary>
        public string? strPageTemplateGUID { get; set; }
        
        /// <summary>
        /// Group GUID. If provided, the menu will be associated with the specified group.
        /// </summary>
        public string? strGroupGUID { get; set; }

        /// <summary>
        /// Module GUID. If provided, the menu will be associated with the specified module.
        /// </summary>
        public string? strModuleGUID { get; set; }
    }
} 