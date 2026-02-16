using System;

namespace AuditSoftware.DTOs.Industry
{
    public class IndustryResponseDto
    {
        public string strIndustryGUID { get; set; } = string.Empty;
        public string strName { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
    }
}
