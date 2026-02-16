using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.Menu
{
    public class MenuPageDto
    {
        public string strMenuGUID { get; set; } = string.Empty;
        public string strName { get; set; } = string.Empty;
        public string strPath { get; set; } = string.Empty;
        public string strMapKey { get; set; } = string.Empty;
        public string strIconName { get; set; } = string.Empty;
        public double dblSeqNo { get; set; }
        public string strMenuPosition { get; set; } = string.Empty;
        public string? strParentMenuGUID { get; set; }
        public PermissionDto? permission { get; set; }
    }
}
