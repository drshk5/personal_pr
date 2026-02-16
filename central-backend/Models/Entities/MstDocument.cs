using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstDocument")]
    public class MstDocument
    {
        public MstDocument()
        {
            strDocumentGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            dtUploadedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            bolIsDeleted = false;
        }

        [Key]
        [Required]
        public Guid strDocumentGUID { get; set; }

        [Required]
        [MaxLength(255)]
        public string strFileName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? strFileType { get; set; }

        [MaxLength(50)]
        public string? strFileSize { get; set; }

        [MaxLength(50)]
        public string? strStatus { get; set; }

        [Required]
        public Guid strUploadByGUID { get; set; }

        [Required]
        public DateTime dtUploadedOn { get; set; }

        public Guid? strFolderGUID { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strModifiedByGUID { get; set; }

        public DateTime? strModifiedOn { get; set; }

        [Required]
        public bool bolIsDeleted { get; set; }

        [Required]
        public Guid strOrganizationGUID { get; set; }

        [Required]
        public Guid strGroupGUID { get; set; }

        public Guid? strYearGUID { get; set; }

        public Guid? strModuleGUID { get; set; }
        
        /// <summary>
        /// Physical file path to the document's storage location
        /// </summary>
        [MaxLength(500)]
        public string? strFilePath { get; set; }
    }
}


