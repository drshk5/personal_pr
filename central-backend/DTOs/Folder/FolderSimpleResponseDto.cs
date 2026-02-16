using System;

namespace AuditSoftware.DTOs.Folder
{
    public class FolderSimpleResponseDto
    {
        public Guid strFolderGUID { get; set; }
        public string strFolderName { get; set; } = string.Empty;
        public Guid strYearGUID { get; set; }
        public string? strYearName { get; set; }
    }
}