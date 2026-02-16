using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.DTOs.Document
{
    public class DocumentUploadRequestDto
    {
        /// <summary>
        /// Files to upload. Each file must be smaller than 10MB.
        /// </summary>
        [Required(ErrorMessage = "At least one file is required")]
        public List<IFormFile>? Files { get; set; }
        
        /// <summary>
        /// Optional folder GUID where the document will be stored
        /// </summary>
        public string? strFolderGUID { get; set; }
        
        /// <summary>
        /// GUID of the entity to associate with the document
        /// </summary>
        public string? strEntityGUID { get; set; }
        
        /// <summary>
        /// Name/type of the entity to associate with the document
        /// </summary>
        public string? strEntityName { get; set; }
        
        /// <summary>
        /// Value of the entity associated with the document
        /// </summary>
        public string? strEntityValue { get; set; }
        
        /// <summary>
        /// URL associated with the document
        /// </summary>
        public string? strURL { get; set; }
    }
}


