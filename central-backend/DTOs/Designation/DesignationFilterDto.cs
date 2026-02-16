using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.Designation
{
    public class DesignationFilterDto : BaseFilterDto
    {
        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? bolIsActive { get; set; }
        
        /// <summary>
        /// Optional group GUID to scope designations
        /// </summary>
        public string? strGroupGUID { get; set; }
    }
}
