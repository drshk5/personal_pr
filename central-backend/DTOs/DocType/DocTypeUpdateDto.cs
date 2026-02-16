using System;

namespace AuditSoftware.DTOs.DocType
{
    public class DocTypeUpdateDto
    {
        public string strDocTypeCode { get; set; } = string.Empty;
        public string strDocTypeName { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
    }
}