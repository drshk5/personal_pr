using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Folder
{
    public class SimpleFolderCreateDto
    {
        [Required]
        [StringLength(100)]
        public string strFolderName { get; set; } = string.Empty;
        
        // Removed strModuleGUID as it will be fetched from token
    }
}