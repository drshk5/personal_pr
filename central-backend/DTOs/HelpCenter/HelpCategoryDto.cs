using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.HelpCenter
{
    public class HelpCategoryDto
    {
        public string strCategoryGUID { get; set; } = string.Empty;
        public string strCategoryName { get; set; } = string.Empty;
        public string? strDescription { get; set; }
        public string? strIcon { get; set; }
        public string? strModuleGUID { get; set; }
        public string? strModuleName { get; set; }
        public int intOrder { get; set; }
        public bool bolIsActive { get; set; }
        public List<HelpArticleDto>? Articles { get; set; }
    }

    public class HelpCategoryCreateDto
    {
        [Required(ErrorMessage = "Category name is required")]
        [StringLength(100, ErrorMessage = "Category name cannot exceed 100 characters")]
        public string strCategoryName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? strDescription { get; set; }

        [StringLength(50, ErrorMessage = "Icon name cannot exceed 50 characters")]
        public string? strIcon { get; set; }

        public string? strModuleGUID { get; set; }

        public int intOrder { get; set; } = 0;

        public bool bolIsActive { get; set; } = true;
    }

    public class HelpCategoryUpdateDto
    {
        [Required(ErrorMessage = "Category name is required")]
        [StringLength(100, ErrorMessage = "Category name cannot exceed 100 characters")]
        public string strCategoryName { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? strDescription { get; set; }

        [StringLength(50, ErrorMessage = "Icon name cannot exceed 50 characters")]
        public string? strIcon { get; set; }

        public string? strModuleGUID { get; set; }

        public int intOrder { get; set; }

        public bool bolIsActive { get; set; }
    }
}
