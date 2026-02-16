using System;

namespace AuditSoftware.DTOs.Document
{
    public class DocumentResponseDto
    {
        public string strDocumentGUID { get; set; } = string.Empty;
        public string strFileName { get; set; } = string.Empty;
        public string? strFileType { get; set; }
        public string? strFileSize { get; set; }
        public string? strStatus { get; set; }
        public string strUploadByGUID { get; set; } = string.Empty;
        public DateTime dtUploadedOn { get; set; }
        public string? strFolderGUID { get; set; }
        public string strCreatedByGUID { get; set; } = string.Empty;
        public DateTime dtCreatedOn { get; set; }
        public string? strModifiedByGUID { get; set; }
        public DateTime? strModifiedOn { get; set; }
        public bool bolIsDeleted { get; set; }
        public string strOrganizationGUID { get; set; } = string.Empty;
        public string strGroupGUID { get; set; } = string.Empty;
        public string? strYearGUID { get; set; }
        public string? strModuleGUID { get; set; }
        public string? strFilePath { get; set; }
    }
}


