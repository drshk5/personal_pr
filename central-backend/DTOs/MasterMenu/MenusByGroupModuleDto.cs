using System;

namespace AuditSoftware.DTOs.MasterMenu
{
    public class MenusByGroupModuleDto
    {
        public string strMasterMenuGUID { get; set; } = string.Empty;
        public string? strParentMenuGUID { get; set; }
        public string? strModuleGUID { get; set; }
        public double dblSeqNo { get; set; }
        public string strName { get; set; } = string.Empty;
        public string strPath { get; set; } = string.Empty;
        public string strMenuPosition { get; set; } = string.Empty;
        public string strMapKey { get; set; } = string.Empty;
        public bool bolHasSubMenu { get; set; }
        public string? strIconName { get; set; }
        public bool bolIsActive { get; set; }
        public bool bolSuperAdminAccess { get; set; }
        
        // If menu rights are already given, this will contain the menu GUID
        public string? strMenuGUID { get; set; }
        
        // Include Group information
        public string strGroupGUID { get; set; } = string.Empty;
    }
}
