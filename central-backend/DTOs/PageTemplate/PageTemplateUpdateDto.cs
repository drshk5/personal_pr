using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.PageTemplate
{
    public class PageTemplateUpdateDto
    {
        [Required(ErrorMessage = "Page template name is required")]
        [MaxLength(100, ErrorMessage = "Page template name cannot exceed 100 characters")]
        public string strPageTemplateName { get; set; } = string.Empty;
        
        public bool bolIsSave { get; set; }
        
        public bool bolIsView { get; set; }
        
        public bool bolIsEdit { get; set; }
        
        public bool bolIsDelete { get; set; }
        
        public bool bolIsPrint { get; set; }
        
        public bool bolIsExport { get; set; }
        
        public bool bolIsImport { get; set; }
        
        public bool bolIsApprove { get; set; }
    }
}
