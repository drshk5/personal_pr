using System;

namespace AuditSoftware.DTOs.DocumentAssociation
{
    public class DocumentAssociationResponseDto
    {
        public Guid strDocumentAssociationGUID { get; set; }
        public Guid strDocumentGUID { get; set; }
        public Guid strEntityGUID { get; set; }
        public string strEntityName { get; set; } = string.Empty;
        public string? strEntityValue { get; set; }
        public string? strURL { get; set; }
        public Guid strCreatedByGUID { get; set; }
        public string strCreatedByName { get; set; } = string.Empty;
        public DateTime dtCreatedOn { get; set; }
        public Guid? strUpdatedByGUID { get; set; }
        public string? strUpdatedByName { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
        
        // Document details
        public string strFileName { get; set; } = string.Empty;
        public string? strFileType { get; set; }
        public string? strFileSize { get; set; }
    }
}