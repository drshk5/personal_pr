using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Document
{
    /// <summary>
    /// DTO for bulk document deletion
    /// </summary>
    public class DocumentBulkDeleteDto
    {
        /// <summary>
        /// List of document GUIDs to delete
        /// </summary>
        public List<Guid> strDocumentGUIDs { get; set; } = new List<Guid>();
        
        /// <summary>
        /// Optional entity GUID to delete associations for specific entity only
        /// </summary>
        public Guid? strEntityGUID { get; set; }
    }
}