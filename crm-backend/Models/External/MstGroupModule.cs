using System;
using System.ComponentModel.DataAnnotations;

namespace crm_backend.Models.External
{
    public class MstGroupModule
    {
        [Key]
        public Guid strGroupModuleGUID { get; set; }

        [Required]
        public Guid strGroupGUID { get; set; }

        [Required]
        public Guid strModuleGUID { get; set; }

        public int intVersion { get; set; }

        [Required]
        public string strConnectionString { get; set; } = string.Empty;

        public Guid strCreatedByGUID { get; set; }
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
    }
}
