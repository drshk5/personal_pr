using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.DocumentModule
{
    public class DocumentModuleUpdateDto
    {
        [Required(ErrorMessage = "Module GUID is required")]
        public Guid strModuleGUID { get; set; }

        [Required(ErrorMessage = "Module name is required")]
        [MaxLength(255, ErrorMessage = "Module name cannot exceed 255 characters")]
        public string strModuleName { get; set; } = string.Empty;

        [Required]
        public bool bolIsActive { get; set; }
    }
}

