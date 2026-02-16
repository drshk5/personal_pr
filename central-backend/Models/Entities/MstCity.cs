using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace AuditSoftware.Models.Entities
{
    [Table("mstCity")]
    public class MstCity
    {
        [Key]
        public Guid strCityGUID { get; set; }
        
        public Guid strStateGUID { get; set; }
        
        [ForeignKey("strStateGUID")]
        [DeleteBehavior(DeleteBehavior.NoAction)]
        public MstState State { get; set; }
        
        public Guid strCountryGUID { get; set; }
        
        [ForeignKey("strCountryGUID")]
        [DeleteBehavior(DeleteBehavior.NoAction)]
        public MstCountry Country { get; set; }
        
        [Required]
        [StringLength(100)]
        public string strName { get; set; }
        
        public bool bolIsActive { get; set; } = true;
        
        public Guid? strCreatedByGUID { get; set; }
        
        public DateTime dtCreatedOn { get; set; } = DateTime.Now;
        
        public Guid? strUpdatedByGUID { get; set; }
        
        public DateTime? dtUpdatedOn { get; set; }
    }
}
