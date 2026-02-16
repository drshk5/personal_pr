using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.DocType
{
    public class DocTypeCreateDto
    {
        [Required(ErrorMessage = "Document type code is required")]
        [MaxLength(50, ErrorMessage = "Document type code cannot exceed 50 characters")]
        public string strDocTypeCode { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Document type name is required")]
        [MaxLength(100, ErrorMessage = "Document type name cannot exceed 100 characters")]
        public string strDocTypeName { get; set; } = string.Empty;
        
        public bool bolIsActive { get; set; } = true;
    }
}