using System;

namespace AuditSoftware.DTOs.Designation
{
    public class DesignationResponseDto
    {
        public string strDesignationGUID { get; set; } = string.Empty;
        public string strName { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
    }
}
