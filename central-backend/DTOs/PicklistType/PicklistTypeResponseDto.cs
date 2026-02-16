using System;

namespace AuditSoftware.DTOs.PicklistType
{
    public class PicklistTypeResponseDto
    {
        public string strPicklistTypeGUID { get; set; } = string.Empty;
        public string strType { get; set; } = string.Empty;
        public string? strDescription { get; set; }
        public bool bolIsActive { get; set; }
    }
} 