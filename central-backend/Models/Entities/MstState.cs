using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstState")]
    public class MstState
    {
        public MstState()
        {
            strStateGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            dtUpdatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            bolIsActive = true;
        }

        [Key]
        public Guid strStateGUID { get; set; }

        [Required]
        public Guid strCountryGUID { get; set; }

        [Required]
        [StringLength(100)]
        public string strName { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime dtUpdatedOn { get; set; }

        [ForeignKey("strCountryGUID")]
        public virtual MstCountry Country { get; set; }
    }
}
