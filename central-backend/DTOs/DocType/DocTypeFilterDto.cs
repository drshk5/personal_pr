using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.DocType
{
    public class DocTypeFilterDto : BaseFilterDto
    {
        /// <summary>
        /// Filter by active status (null = all, true = only active, false = only inactive)
        /// </summary>
        public bool? bolIsActive { get; set; }
    }
}