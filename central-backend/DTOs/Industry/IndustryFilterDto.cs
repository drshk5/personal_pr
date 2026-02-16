using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.Industry
{
    public class IndustryFilterDto : BaseFilterDto
    {
        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? bolIsActive { get; set; }
    }
}
