using System;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.Folder
{
    public class FolderFilterDto : BaseFilterDto
    {
        public string? strFolderName { get; set; }
        public Guid? strYearGUID { get; set; }
    }
}