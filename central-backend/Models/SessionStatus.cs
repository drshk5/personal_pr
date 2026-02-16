using System;

namespace AuditSoftware.Models
{
    // Represents the possible states of a user session
    public enum SessionStatus
    {
        Valid,      // Session is valid and active
        Expired,    // Session exists but has expired
        Invalid,    // Session doesn't match or doesn't exist
        Error       // Error occurred during checking
    }
}
