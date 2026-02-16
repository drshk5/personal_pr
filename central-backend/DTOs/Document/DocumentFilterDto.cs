using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.Document
{
    public class DocumentFilterDto : BaseFilterDto
    {
        public bool? bolIsDeleted { get; set; }
        public string? strFolderGUID { get; set; }
        public string? strStatus { get; set; }
        public string? strFileType { get; set; }
    }
}


