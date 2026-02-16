using System;
using System.Collections.Generic;
using AuditSoftware.DTOs.Auth;

namespace AuditSoftware.Exceptions
{
    public class SessionExistsException : BusinessException
    {
        public List<ActiveSessionInfoDto> ActiveSessions { get; }

        public SessionExistsException(string message, List<ActiveSessionInfoDto> sessions) : base(message)
        {
            ActiveSessions = sessions ?? new List<ActiveSessionInfoDto>();
        }
    }
}
