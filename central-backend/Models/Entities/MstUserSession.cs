using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstUserSession")]
    public class MstUserSession
    {
        [Key]
        public Guid strUserSessionGUID { get; set; } = Guid.NewGuid();

        // FK to mstUser
        public Guid strUserGUID { get; set; }

        [ForeignKey("strUserGUID")]
        public virtual MstUser? MstUser { get; set; }

        // The JWT ID (JTI) associated with this session
        [MaxLength(128)]
        public string JwtId { get; set; } = string.Empty;

        // SHA256 (or HMAC) hash of the access token. Storing a hash is safer than storing raw/encrypted tokens.
        [MaxLength(256)]
        public string? TokenHash { get; set; }

    [Column("DeviceInfo")]
    [MaxLength(512)]
    public string? strDeviceInfo { get; set; }

    [Column("IpAddress")]
    [MaxLength(64)]
    public string? strIPAddress { get; set; }

        public bool bolIsActive { get; set; } = true;

        public DateTime dtCreatedOn { get; set; } = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();

        public DateTime? dtExpiresAt { get; set; }

        public DateTime? dtRevokedOn { get; set; }

        public Guid? strRevokedByGUID { get; set; }
    }
}
