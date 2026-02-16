using System;

namespace AuditSoftware.DTOs.Module
{
    public class ModuleResponseDto
    {
        public string strModuleGUID { get; set; } = string.Empty;
        public string strName { get; set; } = string.Empty;
        public string strDesc { get; set; } = string.Empty;
        public string strSQlfilePath { get; set; } = string.Empty;
        public string strImagePath { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
        public string strCreatedByGUID { get; set; } = string.Empty;
        public DateTime dtCreatedOn { get; set; }
        public string? strUpdatedByGUID { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
    }
}
