using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.DocumentAssociation
{
    public class DocumentAssociationUpdateDto
    {
        [Required]
        public Guid strDocumentAssociationGUID { get; set; }
        
        [Required]
        public Guid strDocumentGUID { get; set; }

        [Required]
        public Guid strEntityGUID { get; set; }

        [Required]
        [MaxLength(100)]
        public string strEntityName { get; set; } = string.Empty;
    }
}