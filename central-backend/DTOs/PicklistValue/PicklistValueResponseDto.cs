using System;

namespace AuditSoftware.DTOs.PicklistValue
{
    public class PicklistValueResponseDto
    {
        public Guid strPickListValueGUID { get; set; }
        public string strValue { get; set; } = string.Empty;
        public Guid strPicklistTypeGUID { get; set; }
        public string strPicklistType { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
        public Guid strGroupGUID { get; set; }
        public Guid strCreatedByGUID { get; set; }
        public string strCreatedBy { get; set; } = string.Empty;
        public DateTime dtCreatedOn { get; set; }
        public Guid? strUpdatedByGUID { get; set; }
        public string strUpdatedBy { get; set; } = string.Empty;
        public DateTime? dtUpdatedOn { get; set; }
    }
} 