using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using AuditSoftware.Models;
using AuditSoftware.Models.Entities;
using AuditSoftware.Helpers;

namespace AuditSoftware.Services
{
    public interface IUserSessionService
    {
        Task<bool> IsValidSessionAsync(string userGuid, string sessionId);
        Task<bool> HasActiveSessionAsync(string userGuid);
        Task<Guid?> RegisterSessionAsync(string userGuid, string sessionId, TimeSpan duration, string? tokenHash = null, string? deviceInfo = null, string? ipAddress = null);
    Task<Guid?> InvalidatePreviousSessionsAsync(string userGuid, string currentSessionId, TimeSpan duration, string? tokenHash = null, string? deviceInfo = null, string? ipAddress = null);
        Task RevokeSessionAsync(string userGuid);
        
        // New methods for handling expired sessions
        Task<SessionStatus> CheckSessionStatusAsync(string userGuid, string sessionId);
        Task RenewExpiredSessionAsync(string userGuid, string sessionId, TimeSpan duration);
        
        // Return active session entries for display (device/ip/created/expiry)
        Task<System.Collections.Generic.List<MstUserSession>> GetActiveSessionsAsync(string userGuid);
    }

    public class UserSessionService : ServiceBase, IUserSessionService
    {
        private readonly AppDbContext _dbContext;
        private readonly ILogger<UserSessionService> _logger;
        private readonly IConfiguration _configuration;

        // Note: We intentionally do not inject IHttpContextAccessor here to keep this service usable
        // from places where HttpContext may not be available. Device/IP can be recorded by callers
        // when they have access to HttpContext and can be persisted via other APIs if needed.

        public UserSessionService(AppDbContext dbContext, ILogger<UserSessionService> logger, IConfiguration configuration)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        public async Task<bool> IsValidSessionAsync(string userGuid, string sessionId)
        {
            if (string.IsNullOrEmpty(userGuid) || string.IsNullOrEmpty(sessionId))
                return false;

            try
            {
                var userGuidObj = GuidHelper.ToGuid(userGuid);
                // Prefer new session table if present
                var session = await _dbContext.MstUserSessions
                    .FirstOrDefaultAsync(s => s.strUserGUID == userGuidObj && s.JwtId == sessionId);

                if (session != null)
                {
                    var now = DateTime.UtcNow;
                    var isValid = session.bolIsActive && session.dtExpiresAt.HasValue && session.dtExpiresAt.Value > now;
                    if (!isValid)
                    {
                        _logger.LogInformation($"Session validation failed for user {userGuid} (table): Current: {sessionId}, Active: {session.bolIsActive}, Expires: {session.dtExpiresAt}");
                    }
                    return isValid;
                }

                // If no session row found in sessions table, treat as invalid
                _logger.LogInformation($"No session entry found for user {userGuid} with session ID {sessionId}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating session for user {userGuid}");
                return false;
            }
        }
        
        public async Task<bool> HasActiveSessionAsync(string userGuid)
        {
            if (string.IsNullOrEmpty(userGuid))
                return false;

            try
            {
                var userGuidObj = GuidHelper.ToGuid(userGuid);
                // Prefer new session table
                var now = DateTime.UtcNow;
                var hasActive = await _dbContext.MstUserSessions
                    .AnyAsync(s => s.strUserGUID == userGuidObj && s.bolIsActive && s.dtExpiresAt.HasValue && s.dtExpiresAt > now);

                if (hasActive)
                {
                    _logger.LogInformation($"Active session found for user {userGuid} (table)");
                    return true;
                }

                // No active sessions found in sessions table
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking active sessions for user {userGuid}");
                return false;
            }
        }

    public async Task<Guid?> RegisterSessionAsync(string userGuid, string sessionId, TimeSpan duration, string? tokenHash = null, string? deviceInfo = null, string? ipAddress = null)
        {
            if (string.IsNullOrEmpty(userGuid) || string.IsNullOrEmpty(sessionId))
                return null;

            try
            {
                var userGuidObj = GuidHelper.ToGuid(userGuid);
                // Create a new session record in the sessions table
                int configMinutes = _configuration.GetValue<int>("Jwt:SessionExpirationMinutes", 15);
                TimeSpan maxDuration = TimeSpan.FromMinutes(configMinutes);
                TimeSpan sessionDuration = duration > maxDuration ? maxDuration : duration;
                var expiry = DateTime.UtcNow.Add(sessionDuration);

                var sessionGuid = Guid.NewGuid();
                var session = new MstUserSession
                {
                    strUserSessionGUID = sessionGuid,
                    strUserGUID = userGuidObj,
                    JwtId = sessionId,
                    TokenHash = tokenHash,
                    strDeviceInfo = deviceInfo,
                    strIPAddress = ipAddress,
                    dtCreatedOn = DateTime.UtcNow,
                    dtExpiresAt = expiry,
                    bolIsActive = true
                };

                await _dbContext.MstUserSessions.AddAsync(session);
                await _dbContext.SaveChangesAsync();
                _logger.LogInformation($"Session registered for user {userGuid} in table, expires at {expiry}");
                return sessionGuid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error registering session for user {userGuid}");
                return null;
            }
        }

    public async Task<Guid?> InvalidatePreviousSessionsAsync(string userGuid, string currentSessionId, TimeSpan duration, string? tokenHash = null, string? deviceInfo = null, string? ipAddress = null)
        {
            if (string.IsNullOrEmpty(userGuid))
                return null;

            try
            {
                var userGuidObj = GuidHelper.ToGuid(userGuid);

                // Deactivate all other sessions for the user
                var sessions = await _dbContext.MstUserSessions
                    .Where(s => s.strUserGUID == userGuidObj && s.JwtId != currentSessionId && s.bolIsActive)
                    .ToListAsync();

                var sessionsToInvalidate = sessions.ToList();

                foreach (var s in sessionsToInvalidate)
                {
                    s.bolIsActive = false;
                    s.dtRevokedOn = DateTime.UtcNow;
                }

                // Revoke any refresh tokens associated with the invalidated sessions
                var revokedJwtIds = sessionsToInvalidate.Select(s => s.JwtId).Where(j => !string.IsNullOrEmpty(j)).ToList();

                // Revoke refresh tokens associated with the invalidated sessions by matching JwtId
                var tokensToRevoke = await _dbContext.RefreshTokens
                    .Where(rt => revokedJwtIds.Contains(rt.JwtId))
                    .ToListAsync();

                foreach (var rt in tokensToRevoke)
                {
                    rt.IsRevoked = true;
                    rt.IsUsed = true;
                }

                // Ensure current session exists/registered
                var existingCurrent = await _dbContext.MstUserSessions
                    .FirstOrDefaultAsync(s => s.strUserGUID == userGuidObj && s.JwtId == currentSessionId);

                Guid? currentSessionGuid = null;

                if (existingCurrent == null)
                {
                    // Register the current session, capturing device/ip when available
                    currentSessionGuid = await RegisterSessionAsync(userGuid, currentSessionId, duration, tokenHash, deviceInfo, ipAddress);
                }
                else
                {
                    currentSessionGuid = existingCurrent.strUserSessionGUID;
                }

                await _dbContext.SaveChangesAsync();
                _logger.LogInformation($"Invalidated previous sessions for user {userGuid}");
                return currentSessionGuid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error invalidating previous sessions for user {userGuid}");
                return null;
            }
        }

        public async Task RevokeSessionAsync(string userGuid)
        {
            if (string.IsNullOrEmpty(userGuid))
                return;

            try
            {
                var userGuidObj = GuidHelper.ToGuid(userGuid);
                // Mark all active sessions as inactive
                var sessions = await _dbContext.MstUserSessions
                    .Where(s => s.strUserGUID == userGuidObj && s.bolIsActive)
                    .ToListAsync();

                foreach (var s in sessions)
                {
                    s.bolIsActive = false;
                    s.dtRevokedOn = DateTime.UtcNow;
                }

                // Revoke all refresh tokens associated with the revoked sessions
                var revokedJwtIds = sessions.Select(s => s.JwtId).Where(j => !string.IsNullOrEmpty(j)).ToList();
                
                var tokensToRevoke = await _dbContext.RefreshTokens
                    .Where(rt => revokedJwtIds.Contains(rt.JwtId) && !rt.IsRevoked)
                    .ToListAsync();

                foreach (var rt in tokensToRevoke)
                {
                    rt.IsRevoked = true;
                    rt.IsUsed = true;
                }

                await _dbContext.SaveChangesAsync();
                _logger.LogInformation($"Session(s) and {tokensToRevoke.Count} refresh token(s) revoked for user {userGuid}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error revoking session for user {userGuid}");
            }
        }
        
        // Checks the detailed status of a session (valid, expired, invalid)
        public async Task<SessionStatus> CheckSessionStatusAsync(string userGuid, string sessionId)
        {
            if (string.IsNullOrEmpty(userGuid) || string.IsNullOrEmpty(sessionId))
                return SessionStatus.Invalid;

            try
            {
                var userGuidObj = GuidHelper.ToGuid(userGuid);
                // Check sessions table first
                var session = await _dbContext.MstUserSessions
                    .FirstOrDefaultAsync(s => s.strUserGUID == userGuidObj && s.JwtId == sessionId);

                if (session != null)
                {
                    if (!session.bolIsActive)
                        return SessionStatus.Invalid;

                    if (!session.dtExpiresAt.HasValue || session.dtExpiresAt.Value <= DateTime.UtcNow)
                        return SessionStatus.Expired;

                    return SessionStatus.Valid;
                }

                // If there's no session in the sessions table, consider it invalid
                _logger.LogInformation($"No session entry found for user {userGuid} with session ID {sessionId} (sessions table only)");
                return SessionStatus.Invalid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking session status for user {userGuid}");
                return SessionStatus.Error;
            }
        }
        
        // Renews an expired session if it matches the expected session ID
        public async Task RenewExpiredSessionAsync(string userGuid, string sessionId, TimeSpan duration)
        {
            if (string.IsNullOrEmpty(userGuid) || string.IsNullOrEmpty(sessionId))
                return;

            try
            {
                var userGuidObj = GuidHelper.ToGuid(userGuid);
                // Try to renew in sessions table
                var session = await _dbContext.MstUserSessions
                    .FirstOrDefaultAsync(s => s.strUserGUID == userGuidObj && s.JwtId == sessionId);

                if (session != null)
                {
                    session.dtExpiresAt = DateTime.UtcNow.Add(duration);
                    session.bolIsActive = true;
                    await _dbContext.SaveChangesAsync();
                    _logger.LogInformation($"Expired session renewed for user {userGuid} (table), new expiry: {session.dtExpiresAt}");
                    return;
                }

                _logger.LogWarning($"Cannot renew session for user {userGuid} - no matching sessions table entry and legacy fallback removed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error renewing expired session for user {userGuid}");
            }
        }

        public async Task<System.Collections.Generic.List<MstUserSession>> GetActiveSessionsAsync(string userGuid)
        {
            var result = new System.Collections.Generic.List<MstUserSession>();
            if (string.IsNullOrEmpty(userGuid))
                return result;

            try
            {
                var userGuidObj = GuidHelper.ToGuid(userGuid);
                var now = DateTime.UtcNow;
                result = await _dbContext.MstUserSessions
                    .Where(s => s.strUserGUID == userGuidObj && s.bolIsActive && s.dtExpiresAt.HasValue && s.dtExpiresAt > now)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving active sessions for user {userGuid}");
            }

            return result;
        }
    }
}
