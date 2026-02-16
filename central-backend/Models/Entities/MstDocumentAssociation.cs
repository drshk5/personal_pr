using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstDocumentAssociation")]
    public class MstDocumentAssociation
    {
        public MstDocumentAssociation()
        {
            strDocumentAssociationGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
        }

        [Key]
        [Required]
        public Guid strDocumentAssociationGUID { get; set; }

        [Required]
        public Guid strDocumentGUID { get; set; }

        [Required]
        public Guid strEntityGUID { get; set; }

        [Required]
        [MaxLength(100)]
        public string strEntityName { get; set; } = string.Empty;
        
        [MaxLength(255)]
        public string? strEntityValue { get; set; }
        
        [MaxLength(500)]
        public string? strURL { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // Navigation property for Document
        [ForeignKey("strDocumentGUID")]
        public virtual MstDocument? Document { get; set; }
    }
}