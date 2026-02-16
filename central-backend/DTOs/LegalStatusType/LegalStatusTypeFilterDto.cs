using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.LegalStatusType
{
    public class LegalStatusTypeFilterDto : BaseFilterDto
    {
        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? bolIsActive { get; set; }
    }
}
