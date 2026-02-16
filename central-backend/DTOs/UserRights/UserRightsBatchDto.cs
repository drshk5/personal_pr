using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.UserRights
{
    public class UserRightsBatchRequestDto
    {
        [Required]
        public List<UserRightsBatchItemDto> UserRights { get; set; } = new List<UserRightsBatchItemDto>();
    }

    public class UserRightsBatchItemDto
    {
        public Guid? strUserRightGUID { get; set; }
        
        [Required(ErrorMessage = "User Role GUID is required")]
        public Guid strUserRoleGUID { get; set; }
        
        [Required(ErrorMessage = "Menu GUID is required")]
        public Guid strMenuGUID { get; set; }
        
        public bool bolCanView { get; set; } = false;
        public bool bolCanEdit { get; set; } = false;
        public bool bolCanSave { get; set; } = false;
        public bool bolCanDelete { get; set; } = false;
        public bool bolCanPrint { get; set; } = false;
        public bool bolCanExport { get; set; } = false;
        public bool bolCanImport { get; set; } = false;
        public bool bolCanApprove { get; set; } = false;
    }

    public class UserRightsBatchResponseDto
    {
        public List<UserRightsResponseDto> ProcessedRights { get; set; } = new List<UserRightsResponseDto>();
        public int InsertedCount { get; set; }
        public int UpdatedCount { get; set; }
        public List<string>? Errors { get; set; }
    }
} 