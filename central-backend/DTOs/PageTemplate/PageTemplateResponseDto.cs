namespace AuditSoftware.DTOs.PageTemplate
{
    public class PageTemplateResponseDto
    {
        public string strPageTemplateGUID { get; set; } = string.Empty;
        
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
