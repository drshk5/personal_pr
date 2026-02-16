using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.UserRole
{
    public class UserRoleSearchRequestDto
    {
        public string? strName { get; set; }
        public string? strDesc { get; set; }
        public bool? bolIsActive { get; set; }
        
        // Filter for multiple creators (comma-separated GUIDs)
        public string? strCreatedByGUIDs { get; set; }
        
        // Filter for multiple updaters (comma-separated GUIDs)
        public string? strUpdatedByGUIDs { get; set; }
        
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SortBy { get; set; }
        public bool SortAscending { get; set; } = true;
    }
}
