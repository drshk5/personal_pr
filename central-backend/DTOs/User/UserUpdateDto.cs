using System;
using System.ComponentModel.DataAnnotations;
using AuditSoftware.JsonConverters;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;

namespace AuditSoftware.DTOs.User
{
    public class UserUpdateDto
    {
        [Required(ErrorMessage = "User name is required")]
        [StringLength(100, ErrorMessage = "User name cannot exceed 100 characters")]
        public string strName { get; set; } = string.Empty;
        
        public DateOnly? dtBirthDate { get; set; }
        
        [Required(ErrorMessage = "Mobile number is required")]
        [StringLength(20, ErrorMessage = "Mobile number cannot exceed 20 characters")]
        [Phone(ErrorMessage = "Please enter a valid mobile number")]
        public string strMobileNo { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string strEmailId { get; set; } = string.Empty;
        
        public bool bolIsActive { get; set; }
        
        [JsonConverter(typeof(TimeSpanJsonConverter))]
        public TimeSpan? dtWorkingStartTime { get; set; }
        
        [JsonConverter(typeof(TimeSpanJsonConverter))]
        public TimeSpan? dtWorkingEndTime { get; set; }
        
        // This property is used for file upload but is not stored in the database directly
        public IFormFile? ProfileImgFile { get; set; }
        
        // Property to indicate if profile image should be removed
        public bool? RemoveProfileImage { get; set; }
        
        // Internal property not exposed in request body, will be set by the service based on the uploaded file
        [JsonIgnore]
        internal string? strProfileImg { get; set; }

        [Required(ErrorMessage = "Timezone is required")]
        [MaxLength(50, ErrorMessage = "Timezone cannot exceed 50 characters")]
        public string strTimeZone { get; set; } = "Asia/Kolkata";

        // Optional: assign/update designation and department for the user
        public Guid? strDesignationGUID { get; set; }
        public Guid? strDepartmentGUID { get; set; }
    }
} 