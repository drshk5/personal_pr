using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Document
{
    /// <summary>
    /// DTO for bulk changing document delete status (delete or restore)
    /// </summary>
    public class DocumentBulkChangeDeleteStatusDto
    {
        /// <summary>
        /// List of document GUIDs to change status for
        /// </summary>
        public List<Guid> strDocumentGUIDs { get; set; } = new List<Guid>();
        
        /// <summary>
        /// Target status - true for delete, false for restore
        /// </summary>
        public bool bolIsDeleted { get; set; }
    }
}