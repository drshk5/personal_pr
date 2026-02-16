using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.PicklistValue
{
    public class PicklistValueUpdateDto
    {
        [Required(ErrorMessage = "Value is required")]
        [MaxLength(100, ErrorMessage = "Value cannot exceed 100 characters")]
        public string strValue { get; set; }

        [Required(ErrorMessage = "Picklist type is required")]
        public Guid strPicklistTypeGUID { get; set; }

        [Required(ErrorMessage = "Active status is required")]
        public bool bolIsActive { get; set; }
    }
} 