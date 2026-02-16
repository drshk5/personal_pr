using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Document
{
    /// <summary>
    /// DTO for bulk moving documents to a different folder
    /// </summary>
    public class DocumentBulkMoveToFolderDto
    {
        /// <summary>
        /// List of document GUIDs to move
        /// </summary>
        public List<Guid> strDocumentGUIDs { get; set; } = new List<Guid>();
        
        /// <summary>
        /// Target folder GUID where documents will be moved
        /// </summary>
        public Guid strFolderGUID { get; set; }
    }
}