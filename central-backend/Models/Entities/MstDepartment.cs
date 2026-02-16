using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstDepartment")]
    public class MstDepartment
    {
        public MstDepartment()
        {
            strDepartmentGUID = Guid.NewGuid();
            dtCreatedOn = DateTime.UtcNow;
            strDepartmentName = string.Empty;
            bolsActive = true;
            strCreatedByGUID = Guid.Empty; // to be set when saving
        }

        [Key]
        [Required]
        public Guid strDepartmentGUID { get; set; }

        [Required]
        [MaxLength(450)]
        public string strDepartmentName { get; set; }

        // Note: naming follows the request (bolsActive). Most other models use bolIsActive.
        public bool bolsActive { get; set; }

        public Guid? strGroupGUID { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }
    }
}
