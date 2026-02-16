using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.DTOs.Module
{
    public class ModuleUpdateDto
    {
        [Required(ErrorMessage = "Module name is required")]
        [MaxLength(450, ErrorMessage = "Module name cannot exceed 450 characters")]
        public string strName { get; set; } = string.Empty;
        
        [MaxLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string strDesc { get; set; } = string.Empty;

        public string strSQlfilePath { get; set; } = string.Empty;
        
        // This property will be set by the service based on the uploaded image file
        [System.Text.Json.Serialization.JsonIgnore]
        public string strImagePath { get; set; } = string.Empty;

        public bool bolIsActive { get; set; }
        
        // This property is used for file upload but is not stored in the database directly
        public IFormFile? ImageFile { get; set; }
    }
}
