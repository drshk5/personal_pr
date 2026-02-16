using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.PageTemplate
{
    public class PageTemplateCreateDto
    {
        [Required(ErrorMessage = "Page template name is required")]
        [MaxLength(100, ErrorMessage = "Page template name cannot exceed 100 characters")]
        public string strPageTemplateName { get; set; } = string.Empty;
        
        public bool bolIsSave { get; set; } = false;
        
        public bool bolIsView { get; set; } = false;
        
        public bool bolIsEdit { get; set; } = false;
        
        public bool bolIsDelete { get; set; } = false;
        
        public bool bolIsPrint { get; set; } = false;
        
        public bool bolIsExport { get; set; } = false;
        
        public bool bolIsImport { get; set; } = false;
        
        public bool bolIsApprove { get; set; } = false;
    }
}
