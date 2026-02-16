using AuditSoftware.JsonConverters;
using Microsoft.AspNetCore.Mvc;
using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.DTOs.User
{
    public class UserCreateDto
    {
        [Required(ErrorMessage = "User name is required")]
        public string strName { get; set; } = string.Empty;
        
        public DateOnly? dtBirthDate { get; set; }
        
        [Required(ErrorMessage = "Mobile number is required")]
        [Phone(ErrorMessage = "Please enter a valid mobile number")]
        public string strMobileNo { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        public string strPassword { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        public string strEmailId { get; set; } = string.Empty;
        
        public bool bolIsActive { get; set; } = true;
        
        [JsonConverter(typeof(TimeSpanJsonConverter))]
        public TimeSpan? dtWorkingStartTime { get; set; }
        
        [JsonConverter(typeof(TimeSpanJsonConverter))]
        public TimeSpan? dtWorkingEndTime { get; set; }
        
        [Required(ErrorMessage = "Role is required")]
        public Guid strRoleGUID { get; set; }

    // Optional: assign a designation for the user
    public Guid? strDesignationGUID { get; set; }

    // Optional: assign a department for the user
    public Guid? strDepartmentGUID { get; set; }
        
        // This property is used for file upload but is not stored in the database directly
        public IFormFile? ProfileImgFile { get; set; }
        
        // Internal property not exposed in request body, will be set by the service based on the uploaded file
        [JsonIgnore]
        internal string? strProfileImg { get; set; }

        [Required(ErrorMessage = "Timezone is required")]
        [MaxLength(50, ErrorMessage = "Timezone cannot exceed 50 characters")]
        public string strTimeZone { get; set; } = "Asia/Kolkata";
    }
} 