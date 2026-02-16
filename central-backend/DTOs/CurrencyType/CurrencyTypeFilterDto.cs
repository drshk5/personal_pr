using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.CurrencyType
{
    public class CurrencyTypeFilterDto : BaseFilterDto
    {
        // Inherit basic filtering, paging, and sorting from BaseFilterDto
        
        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? bolIsActive { get; set; }
    }
}
