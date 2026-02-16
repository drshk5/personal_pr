using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Document
{
    public class DocumentExtendedResponseDto : DocumentResponseDto
    {
        /// <summary>
        /// Name of the folder containing the document
        /// </summary>
        public string? strFolderName { get; set; }
        
        /// <summary>
        /// Name of the user who uploaded the document
        /// </summary>
        public string? strUploadedByName { get; set; }
        
        /// <summary>
        /// Name of the user who created the document
        /// </summary>
        public string? strCreatedByName { get; set; }
        
        /// <summary>
        /// Name of the user who last updated the document
        /// </summary>
        public string? strUpdatedByName { get; set; }
        
        /// <summary>
        /// Name of the module the document belongs to
        /// </summary>
        public string? strModuleGUID { get; set; }
        
        /// <summary>
        /// List of entities this document is associated with
        /// </summary>
        public List<DocumentAssociationDto>? AssociatedTo { get; set; }
    }
    
    public class DocumentAssociationDto
    {
        /// <summary>
        /// GUID of the document association
        /// </summary>
        public string strDocumentAssociationGUID { get; set; } = string.Empty;
        
        /// <summary>
        /// GUID of the entity this document is associated with
        /// </summary>
        public string strEntityGUID { get; set; } = string.Empty;
        
        /// <summary>
        /// Name of the entity this document is associated with
        /// </summary>
        public string strEntityName { get; set; } = string.Empty;
        
        /// <summary>
        /// Value of the entity this document is associated with
        /// </summary>
        public string? strEntityValue { get; set; }
        
        /// <summary>
        /// URL associated with this document
        /// </summary>
        public string? strURL { get; set; }
    }
}