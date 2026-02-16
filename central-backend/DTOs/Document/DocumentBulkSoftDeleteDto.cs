using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Document
{
    /// <summary>
    /// DTO for bulk document soft deletion
    /// </summary>
    public class DocumentBulkSoftDeleteDto
    {
        /// <summary>
        /// List of document GUIDs to soft delete
        /// </summary>
        public List<Guid> strDocumentGUIDs { get; set; } = new List<Guid>();
    }
}