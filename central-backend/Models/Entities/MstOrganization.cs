using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstOrganization")]
    public class MstOrganization
    {
        [Key]
        [Required]
        public Guid strOrganizationGUID { get; set; } = Guid.NewGuid();
        
        [Required]
        [MaxLength(100)]
        public string strOrganizationName { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? strDescription { get; set; }
        
        [MaxLength(20)]
        public string? strPAN { get; set; }
        
        [MaxLength(20)]
        public string? strTAN { get; set; }
        
        [MaxLength(21)]
        public string? strCIN { get; set; }
        
        public Guid? strCountryGUID { get; set; }
        
        public Guid? strParentOrganizationGUID { get; set; }
        
        [Required]
        public bool bolIsActive { get; set; } = true;
        
        [Required]
        public bool bolSystemCreated { get; set; } = false;
        
        [Required]
        public bool bolIsTaxApplied { get; set; } = false;
        
        [MaxLength(255)]
        public string? strLogo { get; set; }
        
        public Guid? strIndustryGUID { get; set; }
        
        [StringLength(50)]
        public string? strUDFCode { get; set; }
        
        public Guid? strLegalStatusTypeGUID { get; set; }
        
        public Guid? strCurrencyTypeGUID { get; set; }
        
        public DateTime? dtClientAcquiredDate { get; set; }
        
        [Required]
        public Guid strGroupGUID { get; set; }
        
        [Required]
        public Guid strCreatedByGUID { get; set; }
        
        [Required]
        public DateTime dtCreatedOn { get; set; } = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
        
        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // =========================
        // BILLING ADDRESS
        // =========================
        [StringLength(150)]
        public string? strAttention_billing { get; set; }

        public Guid? strCountryGUID_billing { get; set; }

        [StringLength(500)]
        public string? strAddress_billing { get; set; }

        public Guid? strStateGUID_billing { get; set; }

        public Guid? strCityGUID_billing { get; set; }

        [StringLength(20)]
        public string? strPinCode_billing { get; set; }

        [StringLength(30)]
        public string? strPhone_billing { get; set; }

        [StringLength(30)]
        public string? strFaxNumber_billing { get; set; }

        // =========================
        // SHIPPING ADDRESS
        // =========================
        [StringLength(150)]
        public string? strAttention_shipping { get; set; }

        public Guid? strCountryGUID_shipping { get; set; }

        [StringLength(500)]
        public string? strAddress_shipping { get; set; }

        public Guid? strStateGUID_shipping { get; set; }

        public Guid? strCityGUID_shipping { get; set; }

        [StringLength(20)]
        public string? strPinCode_shipping { get; set; }

        [StringLength(30)]
        public string? strPhone_shipping { get; set; }

        [StringLength(30)]
        public string? strFaxNumber_shipping { get; set; }

        // =========================
        // BILLING ADDRESS - Navigation Properties
        // =========================
        [ForeignKey("strCountryGUID_billing")]
        public virtual MstCountry? Country_billing { get; set; }

        [ForeignKey("strStateGUID_billing")]
        public virtual MstState? State_billing { get; set; }

        [ForeignKey("strCityGUID_billing")]
        public virtual MstCity? City_billing { get; set; }

        // =========================
        // SHIPPING ADDRESS - Navigation Properties
        // =========================
        [ForeignKey("strCountryGUID_shipping")]
        public virtual MstCountry? Country_shipping { get; set; }

        [ForeignKey("strStateGUID_shipping")]
        public virtual MstState? State_shipping { get; set; }

        [ForeignKey("strCityGUID_shipping")]
        public virtual MstCity? City_shipping { get; set; }
    }
} 