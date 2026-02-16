using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.PicklistValue
{
    public class PicklistValueCreateDto
    {
        [Required(ErrorMessage = "Picklist value is required")]
        [MaxLength(100, ErrorMessage = "Picklist value cannot exceed 100 characters")]
        public string strValue { get; set; }

        [Required(ErrorMessage = "Picklist type is required")]
        public Guid strPicklistTypeGUID { get; set; }

        [Required(ErrorMessage = "Active status is required")]
        public bool bolIsActive { get; set; }
    }
} 