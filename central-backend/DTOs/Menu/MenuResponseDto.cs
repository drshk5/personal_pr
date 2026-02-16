namespace AuditSoftware.DTOs.Menu
{
    public class MenuResponseDto
    {
        public string strMenuGUID { get; set; } = string.Empty;
        public string? strParentMenuGUID { get; set; }
        public string? strParentMenuName { get; set; }
        public double dblSeqNo { get; set; }
        public string strName { get; set; } = string.Empty;
        public string strPath { get; set; } = string.Empty;
        public string strMenuPosition { get; set; } = string.Empty;
        public string strMapKey { get; set; } = string.Empty;
        public bool bolHasSubMenu { get; set; }
        public string? strIconName { get; set; }
        public bool bolIsActive { get; set; }
        public bool bolSuperAdminAccess { get; set; }
        public string? strCategory { get; set; }
        public string? strPageTemplateGUID { get; set; }
        public string? strGroupGUID { get; set; }
        public string? strGroupName { get; set; }
        public string? strModuleGUID { get; set; }
        public string? strModuleName { get; set; }
    }
} 