using System;

namespace AuditSoftware.DTOs.DocType
{
    public class DocTypeResponseDto
    {
        public string strDocTypeGUID { get; set; } = string.Empty;
        public string strDocTypeCode { get; set; } = string.Empty;
        public string strDocTypeName { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
    }
}