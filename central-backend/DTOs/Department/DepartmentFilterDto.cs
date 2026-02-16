using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.Department
{
    public class DepartmentFilterDto : BaseFilterDto
    {
        public bool? bolsActive { get; set; }
        
        // Group filter (set from controller using claims)
        public string? strGroupGUID { get; set; }
    }
}
