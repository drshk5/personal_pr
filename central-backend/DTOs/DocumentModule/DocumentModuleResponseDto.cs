using System;

namespace AuditSoftware.DTOs.DocumentModule
{
    public class DocumentModuleResponseDto
    {
        public string strDocumentModuleGUID { get; set; } = string.Empty;
        public string strModuleGUID { get; set; } = string.Empty;
        public string strModuleName { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
    }
}

