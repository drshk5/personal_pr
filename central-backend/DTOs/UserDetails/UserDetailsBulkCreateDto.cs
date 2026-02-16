using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.UserDetails
{
    public class UserDetailsBulkCreateDto
    {
        [Required(ErrorMessage = "User GUIDs array is required")]
        [MinLength(1, ErrorMessage = "At least one user GUID is required")]
        public List<Guid> strUserGUIDs { get; set; } = new List<Guid>();

        [Required(ErrorMessage = "User Role GUID is required")]
        public Guid strUserRoleGUID { get; set; }

        [Required(ErrorMessage = "Organization GUID is required")]
        public Guid strOrganizationGUID { get; set; }
        
        [Required(ErrorMessage = "Year GUID is required")]
        public Guid strYearGUID { get; set; }

        [Required(ErrorMessage = "Active status is required")]
        public bool bolIsActive { get; set; } = true;
    }
} 
