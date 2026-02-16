using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Folder
{
    public class FolderCreateDto
    {
        [Required]
        [StringLength(100)]
        public string strFolderName { get; set; } = string.Empty;
        
        // No strYearGUID - we get everything from token now
    }
}