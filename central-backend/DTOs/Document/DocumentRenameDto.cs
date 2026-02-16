using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Document
{
    public class DocumentRenameDto
    {
        [Required]
        [MaxLength(255)]
        public string strFileName { get; set; } = string.Empty;
    }
}