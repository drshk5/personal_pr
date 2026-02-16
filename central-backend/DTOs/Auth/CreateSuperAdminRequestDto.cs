using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Auth
{
    public class CreateSuperAdminRequestDto
    {
        [Required]
        public string strName { get; set; }
        
        [Required]
        [EmailAddress]
        public string strEmailId { get; set; }
        
        [Required]
        public string strMobileNo { get; set; }
        
        [Required]
        [MinLength(6)]
        public string strPassword { get; set; }
        
        public DateTime? dtBirthDate { get; set; }
    }
} 