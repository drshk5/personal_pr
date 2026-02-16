using System.Collections.Generic;

namespace AuditSoftware.DTOs.UserDetails
{
    public class BulkUserDetailsResponseDto
    {
        public int TotalRequested { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<UserDetailsResponseDto> SuccessfulRecords { get; set; } = new List<UserDetailsResponseDto>();
        public List<BulkUserDetailsErrorDto> Errors { get; set; } = new List<BulkUserDetailsErrorDto>();
    }

    public class BulkUserDetailsErrorDto
    {
        public System.Guid strUserGUID { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }
} 
