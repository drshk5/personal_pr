using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Document
{
    public class DocumentBulkAssignDto
    {
        [Required]
        public List<Guid> strDocumentGUIDs { get; set; } = new List<Guid>();

        [Required]
        public Guid strEntityGUID { get; set; }

        [Required]
        [MaxLength(100)]
        public string strEntityName { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? strEntityValue { get; set; }

        // URL is generated server-side based on entity; not accepted from client
    }
}


