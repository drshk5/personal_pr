using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstAccountType")]
    public class MstAccountType
    {
        public MstAccountType()
        {
            strAccountTypeGUID = Guid.NewGuid();
            dtCreatedOn = DateTime.UtcNow;
            dtUpdatedOn = DateTime.UtcNow;
            bolIsActive = true;
        }

        [Key]
        public Guid strAccountTypeGUID { get; set; }

        [Required]
        [StringLength(100)]
        public string strName { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime dtUpdatedOn { get; set; }
    }
}
