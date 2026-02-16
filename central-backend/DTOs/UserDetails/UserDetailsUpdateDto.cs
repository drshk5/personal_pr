using System;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.UserDetails
{
    public class UserDetailsUpdateDto
    {
        [Required(ErrorMessage = "User GUID is required")]
        public Guid strUserGUID { get; set; }

        [Required(ErrorMessage = "User Role GUID is required")]
        public Guid strUserRoleGUID { get; set; }

        [Required(ErrorMessage = "Organization GUID is required")]
        public Guid strOrganizationGUID { get; set; }
        
        public Guid? strYearGUID { get; set; }

        [Required(ErrorMessage = "Active status is required")]
        public bool bolIsActive { get; set; }
    }
} 