using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Folder
{
    public class FolderUpdateDto
    {
        [Required]
        [StringLength(100)]
        public string strFolderName { get; set; } = string.Empty;
        
        [Required]
        public Guid strYearGUID { get; set; }
    }
}