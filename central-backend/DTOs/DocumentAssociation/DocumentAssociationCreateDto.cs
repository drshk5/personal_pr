using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.DocumentAssociation
{
    public class DocumentAssociationCreateDto
    {
        [Required]
        public Guid strDocumentGUID { get; set; }

        [Required]
        public Guid strEntityGUID { get; set; }

        [Required]
        [MaxLength(100)]
        public string strEntityName { get; set; } = string.Empty;
        
        [MaxLength(255)]
        public string? strEntityValue { get; set; }
        
        [MaxLength(500)]
        public string? strURL { get; set; }
    }
}