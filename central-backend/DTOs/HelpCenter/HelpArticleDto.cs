using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.HelpCenter
{
    public class HelpArticleDto
    {
        public string strArticleGUID { get; set; } = string.Empty;
        public string strCategoryGUID { get; set; } = string.Empty;
        public string? strCategoryName { get; set; }
        public string? strModuleGUID { get; set; }
        public string? strModuleName { get; set; }
        public string strTitle { get; set; } = string.Empty;
        public string strContent { get; set; } = string.Empty;
        public string? strVideoUrl { get; set; }
        public int intOrder { get; set; }
        public bool bolIsActive { get; set; }
        public bool bolIsFeatured { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public DateTime? dtModifiedOn { get; set; }
    }

    public class HelpArticleCreateDto
    {
        [Required(ErrorMessage = "Category GUID is required")]
        public string strCategoryGUID { get; set; } = string.Empty;

        public string? strModuleGUID { get; set; }

        [Required(ErrorMessage = "Article title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string strTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Article content is required")]
        public string strContent { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Video URL cannot exceed 500 characters")]
        public string? strVideoUrl { get; set; }

        public int intOrder { get; set; } = 0;

        public bool bolIsActive { get; set; } = true;

        public bool bolIsFeatured { get; set; } = false;
    }

    public class HelpArticleUpdateDto
    {
        [Required(ErrorMessage = "Category GUID is required")]
        public string strCategoryGUID { get; set; } = string.Empty;

        public string? strModuleGUID { get; set; }

        [Required(ErrorMessage = "Article title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string strTitle { get; set; } = string.Empty;

        [Required(ErrorMessage = "Article content is required")]
        public string strContent { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Video URL cannot exceed 500 characters")]
        public string? strVideoUrl { get; set; }

        [StringLength(500, ErrorMessage = "Search keywords cannot exceed 500 characters")]
        public string? strSearchKeywords { get; set; }

        public int intOrder { get; set; }

        public bool bolIsActive { get; set; }

        public bool bolIsFeatured { get; set; }
    }

    public class HelpArticleSearchDto
    {
        public string? searchTerm { get; set; }
        public string? strCategoryGUID { get; set; }
        public bool? bolIsFeatured { get; set; }

        // Added for module filter
        public string? strModuleGUID { get; set; }
    }
}
