using System;

namespace AuditSoftware.DTOs.Auth
{
    public class ActiveSessionInfoDto
    {
        public string? strDeviceInfo { get; set; }
        public string? strIPAddress { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public DateTime? dtExpiresAt { get; set; }
    }
}
