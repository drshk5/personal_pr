using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Folder
{
    public class SimpleFolderUpdateDto
    {
        [Required]
        [StringLength(100)]
        public string strFolderName { get; set; } = string.Empty;
    }
}