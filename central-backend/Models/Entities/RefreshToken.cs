using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("refreshToken")]
    public class RefreshToken
    {
        [Key]
        public string Token { get; set; } = string.Empty;
        public string JwtId { get; set; } = string.Empty;
        public bool IsUsed { get; set; }
        public bool IsRevoked { get; set; }
        public DateTime AddedDate { get; set; } = DateTime.UtcNow;
        public DateTime ExpiryDate { get; set; }
        
        public Guid strUserGUID { get; set; }
        
        [ForeignKey("strUserGUID")]
        public virtual MstUser MstUser { get; set; } = null!;
        
        /// <summary>
        /// Whether this token is stored in an HttpOnly cookie (true) or as response body (false)
        /// </summary>
        public bool StoredInCookie { get; set; } = false;
        
        /// <summary>
        /// IP address from which the token was issued (for security audit)
        /// </summary>
        public string? IssuedFromIpAddress { get; set; }
        
        /// <summary>
        /// When the token was last used/refreshed
        /// </summary>
        public DateTime? LastUsedDate { get; set; }
        
    // Note: refresh tokens are linked to sessions by JwtId. We intentionally do not
    // keep a strUserSessionGUID FK here to avoid duplicated session linkage.
    }
} 