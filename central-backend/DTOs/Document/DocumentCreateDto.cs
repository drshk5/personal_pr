using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.DTOs.Document
{
    public class DocumentCreateDto
    {
        /// <summary>
        /// Filename without extension
        /// </summary>
        [MaxLength(255)]
        public string? strFileName { get; set; }

        /// <summary>
        /// File extension without the leading dot
        /// </summary>
        [MaxLength(100)]
        public string? strFileType { get; set; }

        /// <summary>
        /// File size in bytes as a string
        /// </summary>
        [MaxLength(50)]
        public string? strFileSize { get; set; }

        /// <summary>
        /// Status of the document (e.g., "Uploaded")
        /// </summary>
        [MaxLength(50)]
        public string? strStatus { get; set; }

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

        // File upload properties
        /// <summary>
        /// Single file to upload (must be smaller than 10MB)
        /// </summary>
        public IFormFile? File { get; set; }
        
        /// <summary>
        /// Multiple files to upload (each must be smaller than 10MB)
        /// </summary>
        public List<IFormFile>? Files { get; set; }
    }
}


