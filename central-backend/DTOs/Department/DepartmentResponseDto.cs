using System;

namespace AuditSoftware.DTOs.Department
{
    public class DepartmentResponseDto
    {
        public string strDepartmentGUID { get; set; } = string.Empty;
        public string strDepartmentName { get; set; } = string.Empty;
        public bool bolsActive { get; set; }
        public string? strGroupGUID { get; set; }
    }
}
