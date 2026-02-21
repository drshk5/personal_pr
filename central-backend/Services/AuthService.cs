 using AuditSoftware.Data;
using AuditSoftware.DTOs.Auth;
using AuditSoftware.DTOs.OrgTaxConfig;
using AuditSoftware.Exceptions;
using AuditSoftware.Helpers;
using AuditSoftware.Interfaces;
using AuditSoftware.Models;
using AuditSoftware.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using BCrypt.Net;
using System.IO;

namespace AuditSoftware.Services
{
    public class AuthService : ServiceBase, IAuthService
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AuthService> _logger;
        private readonly IActivityLogService _activityLogService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuthService(
            IUserService userService, 
            IConfiguration configuration, 
            AppDbContext context,
            IEmailService emailService,
            IServiceProvider serviceProvider,
            ILogger<AuthService> logger,
            IActivityLogService activityLogService,
            IHttpContextAccessor httpContextAccessor)
        {
            _userService = userService;
            _configuration = configuration;
            _context = context;
            _emailService = emailService;
            _serviceProvider = serviceProvider;
            _logger = logger;
            _activityLogService = activityLogService;
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetJwtSigningKey()
        {
            var jwtKey = _configuration["Jwt:Key"];
            if (!string.IsNullOrWhiteSpace(jwtKey))
                return jwtKey;

            var secretKey = _configuration["Jwt:SecretKey"];
            if (!string.IsNullOrWhiteSpace(secretKey))
                return secretKey;

            throw new InvalidOperationException("JWT signing key not configured. Set Jwt:Key or Jwt:SecretKey.");
        }

        public async Task<LoginResponseDto> LoginAsync(LoginRequestDto loginRequest)
        {
            _logger.LogInformation($"Login attempt for email: {loginRequest.strEmailId}");

            if (string.IsNullOrEmpty(loginRequest.strEmailId))
            {
                throw new BusinessException("Email is required");
            }

            if (string.IsNullOrEmpty(loginRequest.strPassword))
            {
                throw new BusinessException("Password is required");
            }

            try
            {
                _logger.LogInformation("Searching for user in database...");
                var user = await _context.MstUsers
                    .FirstOrDefaultAsync(u => u.strEmailId.ToLower() == loginRequest.strEmailId.ToLower());

                if (user == null)
                {
                    _logger.LogWarning($"User not found for email: {loginRequest.strEmailId}");
                    throw new BusinessException("Invalid email or password");
                }

                _logger.LogInformation($"User found: {user.strName}, verifying password...");

                bool isPasswordValid = VerifyPassword(loginRequest.strPassword, user.strPassword);
                
                // Get default group GUID if not set
                var groupGuid = user.strGroupGUID ?? Guid.Empty;
                
                _logger.LogInformation("Logging login attempt...");
                // Log the login attempt
                var httpContext = _httpContextAccessor.HttpContext;
                // Get organization and year info from user details
                var userDetailForLog = await _context.MstUserDetails
                    .Where(ud => ud.strUserGUID == user.strUserGUID &&
                           ud.strModuleGUID == user.strLastModuleGUID &&
                           ud.bolIsActive)
                    .OrderByDescending(ud => ud.dtCreatedOn)
                    .FirstOrDefaultAsync();

                // If not found with last module, get the most recent active one
                if (userDetailForLog == null)
                {
                    userDetailForLog = await _context.MstUserDetails
                        .Where(ud => ud.strUserGUID == user.strUserGUID &&
                               ud.bolIsActive)
                        .OrderByDescending(ud => ud.dtCreatedOn)
                        .FirstOrDefaultAsync();
                }

                if (!isPasswordValid)
                {
                    _logger.LogWarning($"Invalid password for user: {user.strEmailId}");
                    throw new BusinessException("Invalid email or password");
                }
                
                _logger.LogInformation("Password verified successfully, checking account status...");
                    
                // Check if user account is active
                if (!user.bolIsActive)
                {
                    _logger.LogWarning($"Inactive account attempt for user: {user.strEmailId}");
                    throw new BusinessException("Your account has been deactivated. Please contact your administrator.");
                }

                // Check if user already has an active session elsewhere
                // New behavior: if an active session exists, invalidate previous sessions and allow new login
                var userSessionService = _serviceProvider.GetService<IUserSessionService>();
                bool previousSessionRevoked = false;
                string? sessionMessage = null;

                if (userSessionService != null)
                {
                    var hasActiveSession = await userSessionService.HasActiveSessionAsync(user.strUserGUID.ToString());
                    if (hasActiveSession)
                    {
                        // If frontend did not request force, return session info so frontend can ask user to confirm
                        if (!loginRequest.bolIsForce)
                        {
                            var activeRows = await userSessionService.GetActiveSessionsAsync(user.strUserGUID.ToString());
                            
                            // Get user's timezone for converting session times
                            var userTimeZone = user.strTimeZone ?? "Asia/Kolkata";
                            
                            var sessions = activeRows.Select(r => new AuditSoftware.DTOs.Auth.ActiveSessionInfoDto
                            {
                                strDeviceInfo = r.strDeviceInfo,
                                strIPAddress = r.strIPAddress,
                                dtCreatedOn = DateTimeHelper.ConvertToTimeZone(r.dtCreatedOn, userTimeZone),
                                dtExpiresAt = DateTimeHelper.ConvertToTimeZone(r.dtExpiresAt, userTimeZone)
                            }).ToList();

                            throw new AuditSoftware.Exceptions.SessionExistsException("Active session exists", sessions);
                        }

                        // If forced by frontend, revoke and proceed
                        await userSessionService.RevokeSessionAsync(user.strUserGUID.ToString());
                        _logger.LogInformation($"Existing sessions revoked for user {user.strUserGUID} prior to forced login.");
                        previousSessionRevoked = true;
                        sessionMessage = "You have been signed out from your previous session to allow a new login.";
                    }
                }

                // Check if the user's group license has expired (skip for super admin)
                if (!user.bolIsSuperAdmin && user.strGroupGUID.HasValue && user.strGroupGUID.Value != Guid.Empty)
                {
                    var group = await _context.MstGroups
                        .FirstOrDefaultAsync(g => g.strGroupGUID == user.strGroupGUID);

                    if (group != null && group.dtLicenseExpired < CurrentDateTime)
                    {
                        throw new BusinessException("Your group's license has expired. Please contact your administrator.");
                    }
                }

                // Check if password needs to be migrated from SHA256 to BCrypt
                if (ShouldMigratePassword(user.strPassword))
                {
                    // Migrate password from SHA256 to BCrypt
                    user.strPassword = BCrypt.Net.BCrypt.HashPassword(loginRequest.strPassword);
                    user.dtUpdatedOn = CurrentDateTime;
                    await _context.SaveChangesAsync();
                }

                // Get user info based on last module GUID
                Guid roleGUID = Guid.Empty;
                Guid? organizationGUID = null;
                Guid? yearGUID = null;

                if (user.strLastModuleGUID.HasValue && user.strLastModuleGUID.Value != Guid.Empty)
                {
                    // Step 1: Query MstUserInfos table to get organization and year GUID
                    var userInfo = await _context.MstUserInfos
                        .Where(ui => ui.strUserGUID == user.strUserGUID &&
                                    ui.strModuleGUID == user.strLastModuleGUID)
                        .OrderByDescending(ui => ui.dtCreatedOn)
                        .FirstOrDefaultAsync();

                    if (userInfo != null)
                    {
                        // Get organization and year GUID from MstUserInfo
                        organizationGUID = userInfo.strLastOrganizationGUID;
                        yearGUID = userInfo.strLastYearGUID;
                        
                        // Step 2: Query mstUserDetails with all context info to get the role GUID
                        var userDetails = await _context.MstUserDetails
                            .Where(ud => ud.strUserGUID == user.strUserGUID &&
                                        ud.strModuleGUID == user.strLastModuleGUID &&
                                        ud.strOrganizationGUID == organizationGUID &&
                                        ud.strYearGUID == yearGUID &&
                                        ud.bolIsActive)
                            .OrderByDescending(ud => ud.dtCreatedOn)
                            .FirstOrDefaultAsync();
                            
                        if (userDetails != null)
                        {
                            roleGUID = userDetails.strUserRoleGUID;
                        }
                    }
                    else
                    {
                        // If no user info found with last module, get the most recent active one
                        userInfo = await _context.MstUserInfos
                            .Where(ui => ui.strUserGUID == user.strUserGUID)
                            .OrderByDescending(ui => ui.dtCreatedOn)
                            .FirstOrDefaultAsync();

                        if (userInfo != null)
                        {
                            organizationGUID = userInfo.strLastOrganizationGUID;
                            yearGUID = userInfo.strLastYearGUID;
                            
                            // Update user's last module to match the found one
                            user.strLastModuleGUID = userInfo.strModuleGUID;
                            await _context.SaveChangesAsync();
                            
                            // Get role GUID using all context info
                            var userDetails = await _context.MstUserDetails
                                .Where(ud => ud.strUserGUID == user.strUserGUID &&
                                           ud.strModuleGUID == userInfo.strModuleGUID &&
                                           ud.strOrganizationGUID == organizationGUID &&
                                           ud.strYearGUID == yearGUID &&
                                           ud.bolIsActive)
                                .OrderByDescending(ud => ud.dtCreatedOn)
                                .FirstOrDefaultAsync();
                                
                            if (userDetails != null)
                            {
                                roleGUID = userDetails.strUserRoleGUID;
                            }
                        }
                    }
                }

                string token;
                string refreshToken;
                (token, refreshToken) = await GenerateTokensAsync(
                    user.strEmailId,
                    user.strGroupGUID,
                    organizationGUID,
                    roleGUID,
                    user.strUserGUID,
                    yearGUID,
                    user.strLastModuleGUID
                );

                // Fetch the timezone from the organization
                string? timeZone = null;
                if (organizationGUID.HasValue && organizationGUID.Value != Guid.Empty)
                {
                    timeZone = user.strTimeZone;
                }

                // Get the connection string based on group and module
                string? connectionString = null;
                if (user.strGroupGUID.HasValue && user.strGroupGUID.Value != Guid.Empty && 
                    user.strLastModuleGUID.HasValue && user.strLastModuleGUID.Value != Guid.Empty)
                {
                    connectionString = await GetConnectionStringByGroupAndModule(
                        user.strGroupGUID.Value, 
                        user.strLastModuleGUID.Value
                    );
                }

                // Log successful login
                await _activityLogService.LogActivityAsync(
                    userGuid: user.strUserGUID,
                    groupGuid: groupGuid,
                    activityType: "USER_LOGIN",
                    details: $"User logged in successfully from IP: {httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown"}",
                    organizationGuid: organizationGUID,
                    yearGuid: yearGUID,
                    moduleGuid: user.strLastModuleGUID,
                    entityType: "USER",
                    entityGuid: user.strUserGUID,
                    sessionId: httpContext?.Session?.Id,
                    ipAddress: httpContext?.Connection?.RemoteIpAddress?.ToString(),
                    userAgent: null
                );

                return new LoginResponseDto {
                    Token = token,
                    RefreshToken = refreshToken,
                    strUserGUID = user.strUserGUID.ToString(),
                    strName = user.strName,
                    strEmailId = user.strEmailId,
                    strMobileNo = user.strMobileNo,
                    strGroupGUID = user.strGroupGUID?.ToString(),
                    strLastOrganizationGUID = organizationGUID?.ToString(),
                    strRoleGUID = roleGUID.ToString(),
                    strLastYearGUID = yearGUID?.ToString(),
                    strTimeZone = timeZone ?? "Asia/Kolkata",
                    strConnectionString = connectionString,
                    PreviousSessionRevoked = previousSessionRevoked,
                    SessionMessage = sessionMessage
                };
            }
            catch (BusinessException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error during login: {ex.Message}\nStack trace: {ex.StackTrace}");
                throw new Exception($"An unexpected error occurred during login: {ex.Message}");
            }
        }

        public async Task<LoginResponseDto> RecreateTokensAsync(string emailId, Guid? groupGUID, Guid? organizationGUID, Guid roleGUID, Guid userGuid, Guid? yearGUID = null, Guid? moduleGUID = null)
        {
            // Get user info to validate
            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strUserGUID == userGuid);
                
            if (user == null)
            {
                throw new BusinessException("User not found");
            }
            
            if (!user.bolIsActive)
            {
                throw new BusinessException("User account is inactive");
            }
            
            Console.WriteLine($"RECOVERY_DEBUG: Creating new tokens for user {userGuid}");
            
            // Generate new JWT and refresh tokens
            (string newToken, string newRefreshToken) = await GenerateTokensAsync(
                emailId,
                groupGUID,
                organizationGUID,
                roleGUID,
                userGuid,
                yearGUID,
                moduleGUID
            );
            
            // Fetch the timezone from the organization
            string? timeZone = null;
            if (organizationGUID.HasValue && organizationGUID != Guid.Empty)
            {
                // Get timezone from the user instead of organization
                timeZone = user.strTimeZone;
            }
            
            // Get the connection string based on group and module
            string? connectionString = null;
            if (groupGUID.HasValue && groupGUID != Guid.Empty && moduleGUID.HasValue && moduleGUID != Guid.Empty)
            {
                connectionString = await GetConnectionStringAsync(groupGUID.ToString(), moduleGUID.ToString());
            }

            return new LoginResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                strEmailId = emailId,
                strName = user.strName,
                strUserGUID = userGuid.ToString(),
                strMobileNo = user.strMobileNo,
                strGroupGUID = groupGUID?.ToString(),
                strLastOrganizationGUID = organizationGUID?.ToString(),
                strRoleGUID = roleGUID.ToString(),
                strLastYearGUID = yearGUID?.ToString(),
                strTimeZone = timeZone ?? "Asia/Kolkata",
                strConnectionString = connectionString
            };
        }

        public async Task<LoginResponseDto> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken))
            {
                Console.WriteLine("REFRESH_TOKEN_DEBUG: RefreshTokenAsync received empty token");
                throw new ArgumentNullException(nameof(refreshToken));
            }
            
            // URL decode the token in case it came URL-encoded from cookie
            refreshToken = System.Web.HttpUtility.UrlDecode(refreshToken);
            
            Console.WriteLine($"REFRESH_TOKEN_DEBUG: Refreshing with token of length {refreshToken.Length}");
            Console.WriteLine($"REFRESH_TOKEN_DEBUG: First 10 chars: {refreshToken.Substring(0, Math.Min(10, refreshToken.Length))}");

            // Hash the incoming token to compare with stored hash (security: never search by plaintext)
            var incomingTokenHash = TokenHashService.HashToken(refreshToken);
            Console.WriteLine($"REFRESH_TOKEN_DEBUG: Hashed incoming token, searching database...");

            var storedRefreshToken = await _context.RefreshTokens
                .FirstOrDefaultAsync(x => x.Token == incomingTokenHash);

            if (storedRefreshToken == null)
            {
                Console.WriteLine("REFRESH_TOKEN_DEBUG: Hashed token not found in database");
                
                // Count tokens in database for debugging
                var totalTokens = await _context.RefreshTokens.CountAsync();
                Console.WriteLine($"REFRESH_TOKEN_DEBUG: Total tokens in database: {totalTokens}");
                
                throw new BusinessException("Refresh token not found. Please log in again.");
            }
            
            // Verify the token matches the stored hash using constant-time comparison
            if (!TokenHashService.VerifyToken(refreshToken, storedRefreshToken.Token))
            {
                Console.WriteLine("REFRESH_TOKEN_DEBUG: Token verification failed (constant-time comparison)");
                throw new BusinessException("Invalid refresh token. Please log in again.");
            }

            Console.WriteLine($"REFRESH_TOKEN_DEBUG: Token verified for user {storedRefreshToken.strUserGUID}");
            
            if (storedRefreshToken.ExpiryDate <= CurrentDateTime)
            {
                Console.WriteLine($"REFRESH_TOKEN_DEBUG: Token expired at {storedRefreshToken.ExpiryDate}, current time is {CurrentDateTime}");
                throw new BusinessException("Refresh token has expired. Please log in again.");
            }
            
            if (storedRefreshToken.IsRevoked)
            {
                Console.WriteLine("REFRESH_TOKEN_DEBUG: Token has been revoked");
                throw new BusinessException("Refresh token has been revoked. Please log in again.");
            }
            
                if (storedRefreshToken.IsUsed)
                {
                    Console.WriteLine("REFRESH_TOKEN_DEBUG: Token has already been used");
                    throw new BusinessException("Refresh token has already been used. Please log in again.");
                }
            
            if (storedRefreshToken.ExpiryDate <= CurrentDateTime)
            {
                Console.WriteLine($"REFRESH_TOKEN_DEBUG: Token expired at {storedRefreshToken.ExpiryDate}, current time is {CurrentDateTime}");
                throw new BusinessException("Refresh token has expired. Please log in again.");
            }
            
            if (storedRefreshToken.IsRevoked)
            {
                Console.WriteLine("REFRESH_TOKEN_DEBUG: Token has been revoked");
                throw new BusinessException("Refresh token has been revoked. Please log in again.");
            }
            
                if (storedRefreshToken.IsUsed)
                {
                    Console.WriteLine("REFRESH_TOKEN_DEBUG: Token has already been used");
                    throw new BusinessException("Refresh token has already been used. Please log in again.");
                }

                var user = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == storedRefreshToken.strUserGUID);
                if (user == null)
                    throw new BusinessException("User not found");
                
                // Check if user account is active
                if (!user.bolIsActive)
                    throw new BusinessException("Your account has been deactivated. Please contact your administrator.");
                    
                // Check if this refresh is for the current active session
                // This prevents using refresh tokens from older sessions after a new login elsewhere
                var userSessionService = _serviceProvider.GetService<IUserSessionService>();
                if (userSessionService != null)
                {
                    // We need to check if this refresh token's session ID matches the user's current active session
                    var jti = storedRefreshToken.JwtId; // This is the session ID from the original token
                    
                    bool isValidSession = await userSessionService.IsValidSessionAsync(user.strUserGUID.ToString(), jti);
                    if (!isValidSession)
                    {
                        // Instead of requiring re-login, check if we can create a new session
                        // First, check if the session is simply expired (not invalidated by a different login)
                        var sessionCheckResult = await userSessionService.CheckSessionStatusAsync(user.strUserGUID.ToString(), jti);
                        
                        if (sessionCheckResult == SessionStatus.Expired)
                        {
                            // If session is just expired but not invalidated, we can create a new one
                            Console.WriteLine($"REFRESH_TOKEN_DEBUG: Session expired but refresh token valid. Creating new session for user {user.strUserGUID}");
                            
                            // Create a new session using the same JTI (we'll renew this with the new tokens later)
                            await userSessionService.RenewExpiredSessionAsync(user.strUserGUID.ToString(), jti, GetSessionExpirationTimeSpan(_configuration));
                        }
                        else
                        {
                            // Session was invalidated (e.g., by login elsewhere) or doesn't exist
                            Console.WriteLine($"REFRESH_TOKEN_DEBUG: Session validation failed. Token JTI: {jti}, no active session found in sessions table for user {user.strUserGUID}");
                            throw new BusinessException("Your session is no longer valid. Please log in again.");
                        }
                    }
                }            // Check if the user's group license has expired (skip for super admin)
            if (!user.bolIsSuperAdmin && user.strGroupGUID.HasValue && user.strGroupGUID.Value != Guid.Empty)
            {
                var group = await _context.MstGroups
                    .FirstOrDefaultAsync(g => g.strGroupGUID == user.strGroupGUID);

                if (group != null && group.dtLicenseExpired < CurrentDateTime)
                {
                    throw new BusinessException("Your group's license has expired. Please contact your administrator.");
                }
            }

            // For superadmin, we don't need group, organization, and role GUIDs
            Guid? groupGUID = user.bolIsSuperAdmin ? null : user.strGroupGUID;
            Guid? organizationGUID = null;
            Guid? yearGUID = null;
            Guid roleGUID = Guid.Empty;

            if (!user.bolIsSuperAdmin)
            {
                // Get user info based on last module GUID
                if (user.strLastModuleGUID.HasValue && user.strLastModuleGUID.Value != Guid.Empty)
                {
                    // Step 1: Query MstUserInfos table to get organization and year GUID
                    var userInfo = await _context.MstUserInfos
                        .Where(ui => ui.strUserGUID == user.strUserGUID &&
                                    ui.strModuleGUID == user.strLastModuleGUID)
                        .OrderByDescending(ui => ui.dtCreatedOn)
                        .FirstOrDefaultAsync();

                    if (userInfo != null)
                    {
                        // Get organization and year GUID from MstUserInfo
                        organizationGUID = userInfo.strLastOrganizationGUID;
                        yearGUID = userInfo.strLastYearGUID;
                        
                        // Step 2: Query mstUserDetails with all context info to get the role GUID
                        var userDetails = await _context.MstUserDetails
                            .Where(ud => ud.strUserGUID == user.strUserGUID &&
                                        ud.strModuleGUID == user.strLastModuleGUID &&
                                        ud.strOrganizationGUID == organizationGUID &&
                                        ud.strYearGUID == yearGUID &&
                                        ud.bolIsActive)
                            .OrderByDescending(ud => ud.dtCreatedOn)
                            .FirstOrDefaultAsync();
                            
                        if (userDetails != null)
                        {
                            roleGUID = userDetails.strUserRoleGUID;
                        }
                    }
                    else
                    {
                        // If no user info found with last module, get the most recent active one
                        userInfo = await _context.MstUserInfos
                            .Where(ui => ui.strUserGUID == user.strUserGUID)
                            .OrderByDescending(ui => ui.dtCreatedOn)
                            .FirstOrDefaultAsync();

                        if (userInfo != null)
                        {
                            organizationGUID = userInfo.strLastOrganizationGUID;
                            yearGUID = userInfo.strLastYearGUID;
                            
                            // Update user's last module to match the found one
                            user.strLastModuleGUID = userInfo.strModuleGUID;
                            await _context.SaveChangesAsync();
                            
                            // Get role GUID using all context info
                            var userDetails = await _context.MstUserDetails
                                .Where(ud => ud.strUserGUID == user.strUserGUID &&
                                           ud.strModuleGUID == userInfo.strModuleGUID &&
                                           ud.strOrganizationGUID == organizationGUID &&
                                           ud.strYearGUID == yearGUID &&
                                           ud.bolIsActive)
                                .OrderByDescending(ud => ud.dtCreatedOn)
                                .FirstOrDefaultAsync();
                                
                            if (userDetails != null)
                            {
                                roleGUID = userDetails.strUserRoleGUID;
                            }
                        }
                    }
                }
            }

            // Mark the current refresh token as used (token rotation for enhanced security)
            storedRefreshToken.IsUsed = true;
            await _context.SaveChangesAsync();
            
            // Generate new JWT and refresh tokens
            (string newToken, string newRefreshToken) = await GenerateTokensAsync(
                user.strEmailId,
                groupGUID,
                organizationGUID,
                roleGUID,
                user.strUserGUID,
                yearGUID,
                user.strLastModuleGUID,
                storedRefreshToken.JwtId // reuse the same JTI so session remains the same
            );

            // Fetch the timezone from the user
            string? timeZone = null;
            timeZone = user.strTimeZone;

            // Get the connection string based on group and module
            string? connectionString = null;
            if (groupGUID.HasValue && groupGUID.Value != Guid.Empty && user.strLastModuleGUID.HasValue && user.strLastModuleGUID.Value != Guid.Empty)
            {
                connectionString = await GetConnectionStringAsync(groupGUID.ToString(), user.strLastModuleGUID.ToString());
            }

            return new LoginResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                strEmailId = user.strEmailId,
                strName = user.strName,
                strUserGUID = user.strUserGUID.ToString(),
                strMobileNo = user.strMobileNo,
                strGroupGUID = groupGUID?.ToString(),
                strLastOrganizationGUID = organizationGUID?.ToString(),
                strRoleGUID = roleGUID.ToString(),
                strLastYearGUID = yearGUID?.ToString(),
                strTimeZone = timeZone ?? "Asia/Kolkata", // Default to Asia/Kolkata if not found
                strConnectionString = connectionString
            };
        }

        public async Task LogoutAsync(Guid userGuid)
        {
            if (userGuid == Guid.Empty)
                throw new ArgumentNullException(nameof(userGuid));

            // Get user details for logging
            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strUserGUID == userGuid);

            if (user != null)
            {
                var httpContext = _httpContextAccessor.HttpContext;
                var sessionId = httpContext?.Session?.Id;

                // Get organization and year GUIDs from user details
                var userDetails = await _context.MstUserDetails
                    .Where(ud => ud.strUserGUID == userGuid &&
                               ud.strModuleGUID == user.strLastModuleGUID &&
                               ud.bolIsActive)
                    .OrderByDescending(ud => ud.dtCreatedOn)
                    .FirstOrDefaultAsync();

                Guid? organizationGuid = userDetails?.strOrganizationGUID;
                Guid? yearGuid = userDetails?.strYearGUID;

                // Log logout activity
                await _activityLogService.LogActivityAsync(
                    userGuid,
                    user.strGroupGUID ?? Guid.Empty,
                    "USER_LOGOUT",
                    $"User logged out successfully from IP: {httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown"}",
                    organizationGuid,
                    yearGuid,
                    user.strLastModuleGUID,
                    "USER",
                    userGuid,
                    sessionId,
                    httpContext?.Connection?.RemoteIpAddress?.ToString(),
                    null);
            }

            // Remove refresh tokens
            var refreshTokens = await _context.RefreshTokens
                .Where(x => x.strUserGUID == userGuid)
                .ToListAsync();

            _context.RefreshTokens.RemoveRange(refreshTokens);
            
            // Also invalidate the active session
            var userSessionService = _serviceProvider.GetService<IUserSessionService>();
            if (userSessionService != null)
            {
                await userSessionService.RevokeSessionAsync(userGuid.ToString());
            }
            
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ValidateTokenAsync(string token)
        {
            if (string.IsNullOrEmpty(token))
                return false;

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(GetJwtSigningKey());

            try
            {
                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured"),
                    ValidAudience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured"),
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                // Check if the user's group license has expired (skip for super admin)
                var isSuperAdmin = principal.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value == "SuperAdmin";
                var groupGuidClaim = principal.Claims.FirstOrDefault(c => c.Type == "strGroupGUID")?.Value;
                var userGuidClaim = principal.Claims.FirstOrDefault(c => c.Type == "strUserGUID")?.Value;
                
                // Get the token's JTI claim (which we use as session ID)
                var sessionId = principal.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
                
                // Verify this is still the active session for this user
                if (!string.IsNullOrEmpty(userGuidClaim) && !string.IsNullOrEmpty(sessionId))
                {
                    var userSessionService = _serviceProvider.GetService<IUserSessionService>();
                    if (userSessionService != null)
                    {
                        bool isValidSession = await userSessionService.IsValidSessionAsync(userGuidClaim, sessionId);
                        if (!isValidSession)
                        {
                            return false; // Session is no longer valid (replaced by newer login)
                        }
                    }
                }

                if (!isSuperAdmin && !string.IsNullOrEmpty(groupGuidClaim) && !string.IsNullOrEmpty(userGuidClaim))
                {
                    try
                    {
                        // Convert userGuidClaim to Guid safely
                        Guid userGuid = GuidHelper.ToGuid(userGuidClaim);
                        
                        // Find the user to check if they're a super admin
                        var user = await _context.MstUsers.FirstOrDefaultAsync(u => u.strUserGUID == userGuid);
                        
                        if (user != null)
                        {
                            // Check if user is inactive
                            if (!user.bolIsActive)
                            {
                                return false; // User account has been deactivated
                            }
                            
                            // Check group license for non-super admin users
                            if (!user.bolIsSuperAdmin && !string.IsNullOrEmpty(groupGuidClaim))
                            {
                                try
                                {
                                    // Convert groupGuidClaim to Guid safely
                                    Guid groupGuid = GuidHelper.ToGuid(groupGuidClaim);
                                    
                                    var group = await _context.MstGroups
                                        .FirstOrDefaultAsync(g => g.strGroupGUID == groupGuid);
                                    
                                    if (group != null && group.dtLicenseExpired < CurrentDateTime)
                                    {
                                        return false; // Group license has expired
                                    }
                                }
                                catch (Exception ex)
                                {
                                    // Log the error but don't throw
                                    _logger.LogError(ex, "Error converting group GUID: {GroupGuid}", groupGuidClaim);
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log the error but don't throw
                        _logger.LogError(ex, "Error converting user GUID: {UserGuid}", userGuidClaim);
                    }
                }

                return true;
            }
            catch
            {
                return false;
            }
        }

    public string GenerateJwtToken(string emailId, Guid? groupGUID, Guid? organizationGUID, Guid? roleGUID, Guid userGUID, Guid? yearGUID = null, string? timeZone = null, Guid? moduleGUID = null, string? connectionString = null, string? sessionId = null, Guid? sessionGuid = null, string? taxConfigJson = null)
        {
            if (string.IsNullOrEmpty(emailId)) throw new ArgumentNullException(nameof(emailId));
            if (userGUID == Guid.Empty) throw new ArgumentNullException(nameof(userGUID));

            var jwtKey = GetJwtSigningKey();
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            
            // Use provided sessionId (JTI) if given; otherwise generate a new one
            sessionId = string.IsNullOrEmpty(sessionId) ? Guid.NewGuid().ToString() : sessionId;

            // Ensure all GUID values are properly formatted as strings
            var claimsList = new System.Collections.Generic.List<Claim>
            {
                new Claim("strEmailId", emailId),
                new Claim("strUserGUID", userGUID.ToString()),
                new Claim("strGroupGUID", groupGUID?.ToString() ?? string.Empty),
                new Claim("strOrganizationGUID", organizationGUID?.ToString() ?? string.Empty),
                new Claim("strRoleGUID", roleGUID?.ToString() ?? string.Empty),
                new Claim("strYearGUID", yearGUID?.ToString() ?? string.Empty),
                new Claim("strTimeZone", timeZone ?? "Asia/Kolkata"),
                new Claim("strModuleGUID", moduleGUID?.ToString() ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, sessionId), // Use our session ID as the JWT ID
            };

            if (sessionGuid.HasValue && sessionGuid != Guid.Empty)
            {
                claimsList.Add(new Claim("strUserSessionGUID", sessionGuid.Value.ToString()));
            }

            // Add tax configuration as JSON claim if available
            if (!string.IsNullOrEmpty(taxConfigJson))
            {
                claimsList.Add(new Claim("tax", taxConfigJson));
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured"),
                audience: _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured"),
                claims: claimsList,
                expires: GetAccessTokenExpiration(_configuration), // Access token expiration from config
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<(string token, string refreshToken)> GenerateTokensAsync(
            string emailId, Guid? groupGUID, Guid? organizationGUID, Guid? roleGUID, Guid userGuid, Guid? yearGUID = null, Guid? moduleGUID = null, string? reuseSessionId = null)
        {
            // Fetch the user's timezone
            string? timeZone = null;
            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strUserGUID == userGuid);
            timeZone = user?.strTimeZone;
            
            // Get the connection string for the group and module
            string? connectionString = null;
            if (groupGUID.HasValue && groupGUID != Guid.Empty && moduleGUID.HasValue && moduleGUID != Guid.Empty)
            {
                connectionString = await GetConnectionStringAsync(groupGUID.ToString(), moduleGUID.ToString());
                Console.WriteLine($"GenerateTokensAsync: Retrieved connection string for group {groupGUID} and module {moduleGUID}: {(connectionString != null ? "Found" : "Not found")}");
            }
            else
            {
                Console.WriteLine($"GenerateTokensAsync: Missing groupGUID ({groupGUID}) or moduleGUID ({moduleGUID}) for connection string lookup");
            }

            // Determine JTI to use (reuse or new)
            var jti = string.IsNullOrEmpty(reuseSessionId) ? Guid.NewGuid().ToString() : reuseSessionId;

            // Capture device/user-agent and ip from HttpContext when available
            var httpContext = _httpContextAccessor.HttpContext;
            string? rawDevice = httpContext?.Request?.Headers["User-Agent"].ToString();
            string? deviceInfo = AuditSoftware.Helpers.DeviceInfoParser.Parse(rawDevice);
            string? ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();

            // Determine the session GUID by creating or renewing the session before token creation
            Guid? sessionGuid = null;
            var userSessionService = _serviceProvider.GetService<IUserSessionService>();
            var sessionDuration = GetSessionExpirationTimeSpan(_configuration);

            if (userSessionService != null)
            {
                if (string.IsNullOrEmpty(reuseSessionId))
                {
                    // Create/register current session and invalidate previous ones. TokenHash will be updated after token is generated.
                    sessionGuid = await userSessionService.InvalidatePreviousSessionsAsync(userGuid.ToString(), jti, sessionDuration, null, deviceInfo, ipAddress);
                }
                else
                {
                    var sessionStatus = await userSessionService.CheckSessionStatusAsync(userGuid.ToString(), reuseSessionId);
                    if (sessionStatus == SessionStatus.Invalid)
                        throw new AuditSoftware.Exceptions.BusinessException("Current session is invalid. Please log in again.");

                    if (sessionStatus == SessionStatus.Expired)
                        await userSessionService.RenewExpiredSessionAsync(userGuid.ToString(), reuseSessionId, sessionDuration);
                    else
                        await userSessionService.RenewExpiredSessionAsync(userGuid.ToString(), reuseSessionId, sessionDuration);

                    // Find existing session GUID for reuse
                    var existingSession = await _context.MstUserSessions.FirstOrDefaultAsync(s => s.strUserGUID == userGuid && s.JwtId == reuseSessionId);
                    sessionGuid = existingSession?.strUserSessionGUID;
                }
            }

            // Fetch tax configuration for the organization (if organizationGUID is provided)
            string? taxConfigJson = null;
            if (organizationGUID.HasValue && organizationGUID != Guid.Empty)
            {
                var taxConfig = await _context.MstOrgTaxConfigs
                    .Include(t => t.TaxType)
                    .Include(t => t.State)
                    .Where(t => t.strOrganizationGUID == organizationGUID.Value && 
                                t.bolIsActive == true && 
                                t.bolIsDefault == true)
                    .FirstOrDefaultAsync();

                if (taxConfig != null)
                {
                    var taxConfigDto = new
                    {
                        strOrgTaxConfigGUID = taxConfig.strOrgTaxConfigGUID,
                        strOrganizationGUID = taxConfig.strOrganizationGUID,
                        strTaxTypeGUID = taxConfig.strTaxTypeGUID,
                        strTaxTypeName = taxConfig.TaxType?.strTaxTypeName,
                        strTaxTypeCode = taxConfig.TaxType?.strTaxTypeCode,
                        strTaxRegNo = taxConfig.strTaxRegNo,
                        strStateGUID = taxConfig.strStateGUID,
                        dtRegistrationDate = taxConfig.dtRegistrationDate,
                        bolIsActive = taxConfig.bolIsActive,
                        jsonSettings = taxConfig.jsonSettings,
                        strFormattedCreatedDate = taxConfig.dtCreatedDate.ToString("dd-MMM-yyyy hh:mm:ss tt"),
                        strFormattedRegistrationDate = taxConfig.dtRegistrationDate?.ToString("dd-MMM-yyyy")
                    };

                    taxConfigJson = System.Text.Json.JsonSerializer.Serialize(taxConfigDto);
                }
            }

            // Now generate token with the chosen JTI and session GUID embedded
            var token = GenerateJwtToken(emailId, groupGUID, organizationGUID, roleGUID, userGuid, yearGUID, timeZone, moduleGUID, connectionString, jti, sessionGuid, taxConfigJson);

            // Extract token and compute token hash
            var jwtSecurityToken = new JwtSecurityTokenHandler().ReadJwtToken(token);
            var tokenExpiration = jwtSecurityToken.ValidTo - jwtSecurityToken.ValidFrom;

            var hmacKey = _configuration["Jwt:TokenHmacKey"] ?? _configuration["Jwt:Key"] ?? _configuration["Jwt:SecretKey"];
            if (string.IsNullOrEmpty(hmacKey))
                throw new InvalidOperationException("Token HMAC key not configured. Set Jwt:TokenHmacKey, Jwt:Key, or Jwt:SecretKey in configuration.");

            string tokenHash;
            var keyBytes = System.Text.Encoding.UTF8.GetBytes(hmacKey);
            using (var hmac = new System.Security.Cryptography.HMACSHA256(keyBytes))
            {
                var bytes = System.Text.Encoding.UTF8.GetBytes(token);
                var hash = hmac.ComputeHash(bytes);
                tokenHash = Convert.ToHexString(hash);
            }

            // Update the session entry with token hash and accurate expiry if session was created
            if (sessionGuid.HasValue)
            {
                var sessionRow = await _context.MstUserSessions.FirstOrDefaultAsync(s => s.strUserSessionGUID == sessionGuid.Value);
                if (sessionRow != null)
                {
                    sessionRow.TokenHash = tokenHash;
                    sessionRow.dtExpiresAt = jwtSecurityToken.ValidTo;
                    await _context.SaveChangesAsync();
                }
            }

            var refreshToken = GenerateRefreshToken();

            // If this token generation is a reuse (module/organization switch), revoke older refresh tokens
            // that were issued for the same JwtId (reuseSessionId) to prevent reuse of old refresh tokens.
            if (!string.IsNullOrEmpty(reuseSessionId))
            {
                var tokensToRevoke = await _context.RefreshTokens
                    .Where(rt => rt.JwtId == reuseSessionId && rt.strUserGUID == userGuid && !rt.IsRevoked)
                    .ToListAsync();

                if (tokensToRevoke.Any())
                {
                    foreach (var t in tokensToRevoke)
                    {
                        t.IsRevoked = true;
                    }

                    await _context.SaveChangesAsync();
                }
            }

            // Hash refresh token before storing (security: plaintext breach doesn't expose usable tokens)
            var refreshTokenHash = TokenHashService.HashToken(refreshToken);

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshTokenHash,  // Store hash, not plaintext
                JwtId = jwtSecurityToken.Id,
                strUserGUID = userGuid,
                AddedDate = CurrentDateTime,
                ExpiryDate = GetRefreshTokenExpiration(_configuration),
                IsUsed = false,
                IsRevoked = false,
                StoredInCookie = false,  // Default: token returned in response, not in cookie
                IssuedFromIpAddress = ipAddress,
                LastUsedDate = null
            };

            await _context.RefreshTokens.AddAsync(refreshTokenEntity);
            await _context.SaveChangesAsync();

            return (token, refreshToken);  // Return plaintext token to client
        }

        public async Task<List<string>> GetUserGroupsAsync(string userGuid)
        {
            // Get all groups the user belongs to
            var userGroups = await _context.MstUserDetails
                .Where(ud => ud.strUserGUID.ToString() == userGuid)
                .Select(ud => ud.strGroupGUID.ToString())
                .Distinct()
                .ToListAsync();
                
            return userGroups;
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = true,
                ValidateIssuer = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(GetJwtSigningKey())),
                ValidateLifetime = false,
                ValidIssuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("JWT Issuer not configured"),
                ValidAudience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("JWT Audience not configured")
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken securityToken;
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
            var jwtSecurityToken = securityToken as JwtSecurityToken;
            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");

            return principal;
        }

        public async Task<string> ForgotPasswordAsync(ForgotPasswordRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strEmailId.ToLower() == request.strEmailId.ToLower());

            if (user == null)
                throw new BusinessException("Email Id does not exist");

            // Generate OTP
            var otp = new Random().Next(100000, 999999).ToString();
            user.strOTP = otp;
            user.dtOTPExpiry = GetDateTimeWithOffset(10); // OTP valid for 10 minutes

                // Log forgot password activity
                await _activityLogService.LogActivityAsync(
                    userGuid: user.strUserGUID,
                    groupGuid: user.strGroupGUID ?? Guid.Empty,
                    activityType: "FORGOT_PASSWORD",
                    details: "Password reset OTP sent",
                    organizationGuid: null,
                    yearGuid: null,
                    moduleGuid: user.strLastModuleGUID,
                    entityType: "USER",
                    entityGuid: user.strUserGUID,
                    sessionId: null,
                    ipAddress: _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString(),
                    userAgent: null
                );

                await _context.SaveChangesAsync();

                // Send OTP via email
                await _emailService.SendOtpEmailAsync(user.strEmailId, otp);

                return "OTP sent successfully to your email";
        }

        public async Task<LoginResponseDto> CreateSuperAdminAsync(CreateSuperAdminRequestDto request)
        {
            // Check if any superadmin already exists
            var existingSuperAdmin = await _context.MstUsers
                .AnyAsync(u => u.bolIsSuperAdmin);

            if (existingSuperAdmin)
            {
                throw new BusinessException("A superadmin already exists in the system");
            }

            // Check if email already exists
            var existingUser = await _context.MstUsers
                .AnyAsync(u => u.strEmailId.ToLower() == request.strEmailId.ToLower());

            if (existingUser)
            {
                throw new BusinessException("Email already exists");
            }

            // Create the superadmin user with hashed password
            var user = new MstUser
            {
                strUserGUID = Guid.NewGuid(),
                strName = request.strName,
                strEmailId = request.strEmailId,
                strMobileNo = request.strMobileNo,
                strPassword = BCrypt.Net.BCrypt.HashPassword(request.strPassword),
                bolIsActive = true,
                bolIsSuperAdmin = true,
                strCreatedByGUID = GuidHelper.ToGuid("SYSTEM"),
                dtCreatedOn = CurrentDateTime
                // Note: strRoleGUID is no longer used, as roles are now managed through MstUserDetails
            };

            _context.MstUsers.Add(user);

            try 
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                var errorMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    errorMessage = $"{errorMessage} Inner Exception: {ex.InnerException.Message}";
                }
                throw new BusinessException($"Failed to create superadmin: {errorMessage}");
            }

            // Return response without tokens
            return new LoginResponseDto
            {
                Token = null,
                RefreshToken = null,
                strEmailId = user.strEmailId,
                strName = user.strName,
                strGroupGUID = null,
                strLastOrganizationGUID = null,
                strRoleGUID = null,
                strLastYearGUID = null  // Keep for backward compatibility
            };
        }

        private bool VerifyPassword(string inputPassword, string storedPassword)
        {
            // Check if the stored password is in BCrypt format (starts with $2a$ or $2b$)
            if (storedPassword.StartsWith("$2a$") || storedPassword.StartsWith("$2b$"))
            {
                // Verify with BCrypt
                return BCrypt.Net.BCrypt.Verify(inputPassword, storedPassword);
            }
            
            // Fall back to SHA256 verification (legacy format)
            return HashPassword(inputPassword) == storedPassword;
        }
        
        private bool ShouldMigratePassword(string storedPassword)
        {
            // If the password is not in BCrypt format, it should be migrated
            return !(storedPassword.StartsWith("$2a$") || storedPassword.StartsWith("$2b$"));
        }

        // Add encryption method for JWT token
        public string EncryptToken(string token)
        {
            if (string.IsNullOrEmpty(token))
                throw new ArgumentNullException(nameof(token));

            try
            {
                string encryptionKey = _configuration["Jwt:EncryptionKey"] ?? throw new InvalidOperationException("JWT Encryption Key not configured");
                
                using Aes aesAlg = Aes.Create();
                aesAlg.Key = Encoding.UTF8.GetBytes(encryptionKey.PadRight(32).Substring(0, 32)); // Ensure key is 32 bytes (256 bits)
                
                // SECURITY FIX: Generate random IV for each encryption
                aesAlg.GenerateIV();
                byte[] iv = aesAlg.IV;
                
                ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);
                
                using MemoryStream msEncrypt = new MemoryStream();
                // Prepend IV to the encrypted data
                msEncrypt.Write(iv, 0, iv.Length);
                
                using CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write);
                using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                {
                    swEncrypt.Write(token);
                }
                
                // Ensure Base64 encoding is properly handled for URLs
                string base64String = Convert.ToBase64String(msEncrypt.ToArray());
                return base64String;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error encrypting token");
                throw new BusinessException("Error encrypting token");
            }
        }

        // Add decryption method for JWT token
        public string DecryptToken(string encryptedToken)
        {
            if (string.IsNullOrEmpty(encryptedToken))
                throw new ArgumentNullException(nameof(encryptedToken));

            try
            {
                // Check if the token might already be a valid JWT
                if (IsValidJwtFormat(encryptedToken))
                {
                    _logger.LogInformation("Token appears to be already in JWT format, returning as is");
                    return encryptedToken;
                }
                
                // If it starts with "Bearer ", remove it
                if (encryptedToken.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    encryptedToken = encryptedToken.Substring(7).Trim();
                }
                
                // Try multiple approaches for base64 decoding with different normalizations
                string? decryptedResult = null;
                Exception? lastException = null;
                
                // Approach 1: Direct decryption
                try
                {
                    decryptedResult = TryDecryptToken(encryptedToken);
                    if (!string.IsNullOrEmpty(decryptedResult) && IsValidJwtFormat(decryptedResult))
                    {
                        return decryptedResult;
                    }
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogWarning($"First decryption attempt failed: {ex.Message}");
                }
                
                // Approach 2: URL-safe decoding
                try
                {
                    string normalizedToken = encryptedToken.Replace('-', '+').Replace('_', '/');
                    
                    // Add padding if needed
                    switch (normalizedToken.Length % 4)
                    {
                        case 2: normalizedToken += "=="; break;
                        case 3: normalizedToken += "="; break;
                    }
                    
                    decryptedResult = TryDecryptToken(normalizedToken);
                    if (!string.IsNullOrEmpty(decryptedResult) && IsValidJwtFormat(decryptedResult))
                    {
                        return decryptedResult;
                    }
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogWarning($"Second decryption attempt failed: {ex.Message}");
                }
                
                // Approach 3: Try with / characters replaced
                try
                {
                    string normalizedToken = encryptedToken.Replace('/', '_');
                    
                    // Add padding if needed
                    switch (normalizedToken.Length % 4)
                    {
                        case 2: normalizedToken += "=="; break;
                        case 3: normalizedToken += "="; break;
                    }
                    
                    decryptedResult = TryDecryptToken(normalizedToken);
                    if (!string.IsNullOrEmpty(decryptedResult) && IsValidJwtFormat(decryptedResult))
                    {
                        return decryptedResult;
                    }
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogWarning($"Third decryption attempt failed: {ex.Message}");
                }
                
                // If all attempts failed, throw the last exception
                if (lastException != null)
                {
                    throw lastException;
                }
                
                // If we got here with a result but it's not a valid JWT, return it anyway
                if (!string.IsNullOrEmpty(decryptedResult))
                {
                    return decryptedResult;
                }
                
                throw new BusinessException("Failed to decrypt token after multiple attempts");
            }
            catch (Exception ex)
            {
                throw new BusinessException($"Error decrypting token: {ex.Message}");
            }
        }
        
        private string TryDecryptToken(string normalizedToken)
        {
            string encryptionKey = _configuration["Jwt:EncryptionKey"] ?? throw new InvalidOperationException("JWT Encryption Key not configured");
            byte[] fullCipher = Convert.FromBase64String(normalizedToken);
            
            // SECURITY FIX: Extract IV from the beginning of the ciphertext
            if (fullCipher.Length < 16)
                throw new ArgumentException("Invalid encrypted token format");
            
            byte[] iv = new byte[16];
            byte[] cipherText = new byte[fullCipher.Length - 16];
            
            Array.Copy(fullCipher, 0, iv, 0, 16);
            Array.Copy(fullCipher, 16, cipherText, 0, cipherText.Length);
            
            using Aes aesAlg = Aes.Create();
            aesAlg.Key = Encoding.UTF8.GetBytes(encryptionKey.PadRight(32).Substring(0, 32)); // Ensure key is 32 bytes
            aesAlg.IV = iv; // Use the extracted IV
            
            ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);
            
            using MemoryStream msDecrypt = new MemoryStream(cipherText);
            using CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using StreamReader srDecrypt = new StreamReader(csDecrypt);
            
            return srDecrypt.ReadToEnd();
        }
        
        private bool IsValidJwtFormat(string token)
        {
            if (string.IsNullOrEmpty(token))
                return false;
            
            try
            {
                var parts = token.Split('.');
                
                // Basic structure check
                if (parts.Length != 3)
                    return false;
                
                // Try to decode the header part
                string base64UrlHeader = parts[0];
                string normalizedHeader = base64UrlHeader
                    .Replace('-', '+')
                    .Replace('_', '/');
                
                // Add padding if needed
                switch (normalizedHeader.Length % 4)
                {
                    case 2: normalizedHeader += "=="; break;
                    case 3: normalizedHeader += "="; break;
                }
                
                var headerBytes = Convert.FromBase64String(normalizedHeader);
                var header = Encoding.UTF8.GetString(headerBytes);
                
                // If we can parse as JSON, it's likely a valid JWT header
                using var doc = JsonDocument.Parse(header);
                
                // Additional check with JWT handler
                var handler = new JwtSecurityTokenHandler();
                return handler.CanReadToken(token);
            }
            catch (Exception ex)
            {
                _logger.LogWarning($"JWT format validation failed: {ex.Message}");
                return false;
            }
        }

        public async Task<LoginResponseDto> SwitchOrganizationAsync(Guid userGUID, Guid organizationGUID, Guid? yearGUID = null)
        {
            if (userGUID == Guid.Empty)
                throw new ArgumentNullException(nameof(userGUID));
            
            if (organizationGUID == Guid.Empty)
                throw new ArgumentNullException(nameof(organizationGUID));

            _logger.LogInformation("SwitchOrganizationAsync called for User: {UserGuid}, Organization: {OrgGuid}, Year: {YearGuid}",
                userGUID, organizationGUID, yearGUID ?? Guid.Empty);

            // Get user
            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strUserGUID == userGUID);
                
            if (user == null)
                throw new BusinessException("User not found");

            // Check if the user's group license has expired (skip for super admin)
            if (!user.bolIsSuperAdmin && user.strGroupGUID.HasValue && user.strGroupGUID.Value != Guid.Empty)
            {
                var group = await _context.MstGroups
                    .FirstOrDefaultAsync(g => g.strGroupGUID == user.strGroupGUID);
                
                if (group != null && group.dtLicenseExpired < CurrentDateTime)
                {
                    throw new BusinessException("Your group's license has expired. Please contact your administrator.");
                }
            }

            // If no year is provided, get the latest active year for the organization
            if (yearGUID == null || yearGUID == Guid.Empty)
            {
                var latestYear = await _context.MstYears
                    .Where(y => y.strOrganizationGUID == organizationGUID)
                    .OrderByDescending(y => y.strName)
                    .FirstOrDefaultAsync();

                if (latestYear != null)
                {
                    yearGUID = latestYear.strYearGUID;
                }
                else
                {
                    throw new BusinessException("No years found for this organization");
                }
            }

            // Verify the year exists and belongs to the selected organization
            var year = await _context.MstYears
                .FirstOrDefaultAsync(y => y.strYearGUID == yearGUID && 
                                       y.strOrganizationGUID == organizationGUID);
                                       
            if (year == null)
                throw new BusinessException("Selected year does not exist or does not belong to the selected organization");

            // Get the correct role GUID from MstUserDetails based on the current context
            // Including organization, year, module, and group for comprehensive role resolution
            var userDetails = await _context.MstUserDetails
                .AsNoTracking()
                .Where(ud => 
                    ud.strUserGUID == userGUID &&
                    ud.strOrganizationGUID == organizationGUID &&
                    (yearGUID == null || ud.strYearGUID == yearGUID) &&
                    (user.strLastModuleGUID == null || ud.strModuleGUID == user.strLastModuleGUID) &&
                    (user.strGroupGUID == null || ud.strGroupGUID == user.strGroupGUID) &&
                    ud.bolIsActive)
                .FirstOrDefaultAsync();
                                         
            if (userDetails == null)
            {
                // If no exact match found, try to find any active role for this organization with relaxed conditions
                userDetails = await _context.MstUserDetails
                    .AsNoTracking()
                    .Where(ud => ud.strUserGUID == userGUID && 
                                ud.strOrganizationGUID == organizationGUID &&
                                ud.bolIsActive)
                    .OrderByDescending(ud => ud.dtCreatedOn)
                    .FirstOrDefaultAsync();

                if (userDetails == null)
                    throw new BusinessException("User does not have access to this organization");
            }

            // Instead of updating MstUser, update or create MstUserInfo
            var userInfo = await _context.MstUserInfos
                .FirstOrDefaultAsync(ui => ui.strUserGUID == userGUID && 
                                          ui.strModuleGUID == user.strLastModuleGUID);
            
            if (userInfo != null)
            {
                // Update existing userInfo record
                userInfo.strLastOrganizationGUID = organizationGUID;
                userInfo.strLastYearGUID = yearGUID;
                userInfo.strUpdatedByGUID = userGUID;
                userInfo.dtUpdatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            }
            else if (user.strLastModuleGUID.HasValue && user.strLastModuleGUID.Value != Guid.Empty)
            {
                // Create new userInfo record if module exists
                _context.MstUserInfos.Add(new Models.Entities.MstUserInfo
                {
                    strUserInfoGUID = Guid.NewGuid(),
                    strUserGUID = userGUID,
                    strModuleGUID = user.strLastModuleGUID,
                    strLastOrganizationGUID = organizationGUID,
                    strLastYearGUID = yearGUID,
                    strCreatedByGUID = userGUID,
                    dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()
                });
            }
            
            await _context.SaveChangesAsync();

            // Get group GUID from user details
            Guid? groupGUID = userDetails.strGroupGUID;
            Guid? roleGUID = userDetails?.strUserRoleGUID;
            
            // Log the role resolution for debugging
            if (roleGUID != null && roleGUID != Guid.Empty)
            {
                _logger.LogInformation("Using role GUID from MstUserDetails for organization switch: {RoleGuid}", roleGUID.ToString());
            }
            
            // Add fallback logic similar to switch module for better error handling
            if (roleGUID == null || roleGUID == Guid.Empty)
            {
                _logger.LogWarning("No role GUID found in MstUserDetails for organization switch. User: {UserGuid}, Organization: {OrgGuid}, Year: {YearGuid}, Module: {ModuleGuid}, Group: {GroupGuid}", 
                    userGUID, organizationGUID, yearGUID, user.strLastModuleGUID, user.strGroupGUID);
                throw new BusinessException("Role information not found for this organization. Please contact your administrator.");
            }

            // Determine current session JTI from incoming token so we can reuse the same session
            var httpContext = _httpContextAccessor.HttpContext;
            // Only accept the standard Authorization header (Bearer <token>)
            string? incomingToken = httpContext?.Request?.Headers["Authorization"].FirstOrDefault();

            string? currentJti = null;
            if (!string.IsNullOrEmpty(incomingToken))
            {
                try
                {
                    var plain = DecryptToken(incomingToken);
                    var jwt = new JwtSecurityTokenHandler().ReadJwtToken(plain);
                    currentJti = jwt.Id;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to extract JTI from incoming token during organization switch");
                    throw new BusinessException("Unable to determine current session. Please log in again.");
                }
            }
            else
            {
                throw new BusinessException("No access token found. Please log in again. Ensure Authorization: Bearer <token> is sent.");
            }

            // Generate new tokens with updated organization and role, reusing the existing JTI so no new session is created
            var (newToken, newRefreshToken) = await GenerateTokensAsync(
                user.strEmailId,
                groupGUID,
                organizationGUID,
                roleGUID.Value, // We've already validated it's not null above
                userGUID,
                yearGUID,
                user.strLastModuleGUID,
                currentJti
            );

            // Get the user's timezone
            string? timeZone = user.strTimeZone;

            // Retrieve the user info again to get the latest values
            var updatedUserInfo = await _context.MstUserInfos
                .FirstOrDefaultAsync(ui => ui.strUserGUID == userGUID && 
                                          ui.strModuleGUID == user.strLastModuleGUID);
                
            Guid? lastYearGUID = null;
            if (updatedUserInfo != null)
            {
                lastYearGUID = updatedUserInfo.strLastYearGUID;
            }
                
            return new LoginResponseDto
            {
                Token = newToken,
                RefreshToken = newRefreshToken,
                strEmailId = user.strEmailId,
                strName = user.strName,
                strUserGUID = userGUID.ToString(),
                strMobileNo = user.strMobileNo,
                strGroupGUID = groupGUID?.ToString(),
                strLastOrganizationGUID = organizationGUID.ToString(),
                strRoleGUID = roleGUID.Value.ToString(), // We've already validated it's not null above
                strLastYearGUID = (lastYearGUID ?? yearGUID)?.ToString(), // Use value from UserInfo if available, otherwise use the parameter
                strTimeZone = timeZone ?? "Asia/Kolkata" // Default to Asia/Kolkata if not found
            };
        }

        // Keep for legacy password verification during transition
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        public async Task<bool> ChangePasswordAsync(ChangePasswordRequestDto request, string userId)
        {
            if (string.IsNullOrEmpty(request.strEmailId))
            {
                throw new BusinessException("Email is required");
            }

            // Find user by email
            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strEmailId.ToLower() == request.strEmailId.ToLower());

            if (user == null)
            {
                throw new BusinessException("User not found with the provided email");
            }

            // Verify OTP exists and is not expired
            if (string.IsNullOrEmpty(user.strOTP))
            {
                throw new BusinessException("No OTP was generated. Please use forgot password first.");
            }

            if (user.dtOTPExpiry == null || user.dtOTPExpiry < CurrentDateTime)
            {
                throw new BusinessException("OTP has expired. Please request a new one.");
            }

            // Verify OTP matches
            if (user.strOTP != request.strOTP)
            {
                throw new BusinessException("Invalid OTP");
            }

            if (string.IsNullOrEmpty(request.strNewPassword))
            {
                throw new BusinessException("New password cannot be empty");
            }

            // Hash the new password
            user.strPassword = BCrypt.Net.BCrypt.HashPassword(request.strNewPassword);
            user.strOTP = null; // Clear the OTP after successful password change
            user.dtOTPExpiry = null; // Clear OTP expiry
            user.dtUpdatedOn = CurrentDateTime;
            user.strUpdatedByGUID = user.strUserGUID; // Use the user's own ID for the update

            // Log password change activity
            await _activityLogService.LogActivityAsync(
                userGuid: user.strUserGUID,
                groupGuid: user.strGroupGUID ?? Guid.Empty,
                activityType: "PASSWORD_CHANGE",
                details: "Password changed successfully",
                organizationGuid: null,
                yearGuid: null,
                moduleGuid: user.strLastModuleGUID,
                entityType: "USER",
                entityGuid: user.strUserGUID,
                sessionId: null,
                ipAddress: _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString(),
                userAgent: null
            );

            await _context.SaveChangesAsync();
            return true;
        }
        
        public async Task<UserProfileResponseDto> GetUserProfileAsync(Guid userGuid)
        {
            if (userGuid == Guid.Empty)
                throw new ArgumentNullException(nameof(userGuid));
                
            // Get user information
            var user = await _context.MstUsers
                .FirstOrDefaultAsync(u => u.strUserGUID == userGuid);
                
            if (user == null)
                throw new BusinessException("User not found");

            // Get user info based on strUserGUID and strLastModuleGUID
            Guid? lastOrganizationGUID = null;
            Guid? lastYearGUID = null;

            // Use the group and module values directly from the user record
            Guid? effectiveGroupGuid = user.strGroupGUID;
            Guid? effectiveModuleGuid = user.strLastModuleGUID;

            // Only get organization and year information from MstUserInfo
            if (user.strLastModuleGUID.HasValue && user.strLastModuleGUID.Value != Guid.Empty)
            {
                var userInfo = await _context.MstUserInfos
                    .FirstOrDefaultAsync(ui => ui.strUserGUID == userGuid && 
                                              ui.strModuleGUID == user.strLastModuleGUID);
                
                if (userInfo != null)
                {
                    lastOrganizationGUID = userInfo.strLastOrganizationGUID;
                    lastYearGUID = userInfo.strLastYearGUID;
                }
            }

            // No fallback to user.strLastOrganizationGUID and user.strLastYearGUID
                
            // Get group information
            var group = await _context.MstGroups
                .FirstOrDefaultAsync(g => g.strGroupGUID == user.strGroupGUID);
                
            // Get organization information
            var organization = await _context.MstOrganizations
                .FirstOrDefaultAsync(o => o.strOrganizationGUID == lastOrganizationGUID);
                
            // Get currency type information
            var currencyType = organization?.strCurrencyTypeGUID != null ?
                await _context.MstCurrencyTypes
                    .FirstOrDefaultAsync(ct => ct.strCurrencyTypeGUID == organization.strCurrencyTypeGUID) :
                null;
                
            // Get tax type based on country from organization
            var taxType = organization?.strCountryGUID != null ? 
                await _context.MstTaxTypes
                    .FirstOrDefaultAsync(t => t.strCountryGUID == organization.strCountryGUID && t.bolIsActive) : 
                null;

            // Get OrgTaxConfig for current organization (default active)
            OrgTaxConfigResponseDto? orgTax = null;
            if (lastOrganizationGUID.HasValue && lastOrganizationGUID.Value != Guid.Empty)
            {
                var taxConfig = await _context.MstOrgTaxConfigs
                    .Include(tc => tc.TaxType)
                    .Include(tc => tc.State)
                    .Include(tc => tc.Organization)
                    .Where(tc => tc.strOrganizationGUID == lastOrganizationGUID && tc.bolIsActive)
                    .OrderByDescending(tc => tc.bolIsDefault)
                    .ThenByDescending(tc => tc.dtCreatedDate)
                    .FirstOrDefaultAsync();

                if (taxConfig != null)
                {
                    orgTax = new OrgTaxConfigResponseDto
                    {
                        strOrgTaxConfigGUID = taxConfig.strOrgTaxConfigGUID.ToString(),
                        strOrganizationGUID = taxConfig.strOrganizationGUID.ToString(),
                        strOrganizationName = taxConfig.Organization?.strOrganizationName,
                        strTaxTypeGUID = taxConfig.strTaxTypeGUID.ToString(),
                        strTaxTypeName = taxConfig.TaxType?.strTaxTypeName,
                        strTaxTypeCode = taxConfig.TaxType?.strTaxTypeCode,
                        strTaxRegNo = taxConfig.strTaxRegNo,
                        strStateGUID = taxConfig.strStateGUID?.ToString(),
                        strStateName = taxConfig.State?.strName,
                        dtRegistrationDate = taxConfig.dtRegistrationDate,
                        bolIsActive = taxConfig.bolIsActive,
                        jsonSettings = taxConfig.jsonSettings,
                        strCreatedByGUID = taxConfig.strCreatedByGUID.ToString(),
                        dtCreatedDate = taxConfig.dtCreatedDate
                    };
                }
            }
                
            // Get year information
            var year = await _context.MstYears
                .FirstOrDefaultAsync(y => y.strYearGUID == lastYearGUID);
                
            // Get user role information through user details
            Guid userRoleGuid = Guid.Empty;
            string userRoleName = string.Empty;
            
            // Get all unique modules for the user
            var userModules = new List<DTOs.Auth.ModuleInfo>();
            // Keep track of added module GUIDs to ensure uniqueness
            var addedModuleGuids = new HashSet<string>();
            
            // If user is super admin, provide all modules
            if (user.bolIsSuperAdmin)
            {
                var allModules = await _context.MstModules
                    .Where(m => m.bolIsActive)
                    .ToListAsync();
                
                foreach (var module in allModules)
                {
                    var moduleGuid = module.strModuleGUID.ToString();
                    // Only add the module if it hasn't been added yet
                    var moduleGuidStr = module.strModuleGUID.ToString();
                    if (addedModuleGuids.Add(moduleGuidStr)) // HashSet.Add returns true if the item was added
                    {
                        userModules.Add(new DTOs.Auth.ModuleInfo
                        {
                            strModuleGUID = moduleGuidStr,
                            strModuleName = module.strName,
                            strDesc = module.strDesc,
                            strImagePath = module.strImagePath
                        });
                    }
                }
            }
            // For non-super admin users, get modules from user details
            else if (lastOrganizationGUID.HasValue && lastOrganizationGUID.Value != Guid.Empty && 
                     lastYearGUID.HasValue && lastYearGUID.Value != Guid.Empty)
            {
                // Get the module GUID from the token or from the user's last module
                Guid? moduleGUID = user.strLastModuleGUID;
                
                // First try to get user details with organization, year, and module
                var userDetails = await _context.MstUserDetails
                    .FirstOrDefaultAsync(ud => ud.strUserGUID == userGuid && 
                                             ud.strOrganizationGUID == lastOrganizationGUID &&
                                             ud.strYearGUID == lastYearGUID &&
                                             ud.strModuleGUID == moduleGUID &&
                                             ud.bolIsActive);

                // If not found with module, fall back to just organization and year match
                if (userDetails == null)
                {
                    userDetails = await _context.MstUserDetails
                        .FirstOrDefaultAsync(ud => ud.strUserGUID == userGuid && 
                                                 ud.strOrganizationGUID == lastOrganizationGUID &&
                                                 ud.strYearGUID == lastYearGUID &&
                                                 ud.bolIsActive);
                }
                
                // If still not found, fall back to just organization match
                if (userDetails == null)
                {
                    userDetails = await _context.MstUserDetails
                        .FirstOrDefaultAsync(ud => ud.strUserGUID == userGuid && 
                                                 ud.strOrganizationGUID == lastOrganizationGUID &&
                                                 ud.bolIsActive);
                }
                                              
                if (userDetails != null)
                {
                    userRoleGuid = userDetails.strUserRoleGUID;
                    // Get role name
                    var userRole = await _context.MstUserRoles
                        .FirstOrDefaultAsync(r => r.strUserRoleGUID == userRoleGuid);
                    if (userRole != null)
                    {
                        userRoleName = userRole.strName;
                    }
                }
                
                // Get all user details to extract module information
                var allUserDetails = await _context.MstUserDetails
                    .Where(ud => ud.strUserGUID == userGuid && ud.bolIsActive)
                    .ToListAsync();
                
                // Extract unique module GUIDs
                var moduleGuids = allUserDetails
                    .Where(ud => ud.strModuleGUID.HasValue && ud.strModuleGUID.Value != Guid.Empty)
                    .Select(ud => ud.strModuleGUID!.Value)  // Use the Value property to get the actual Guid
                    .Distinct() 
                    .ToList();
                
                // Get all modules at once instead of one by one
                if (moduleGuids.Any())
                {
                    var modules = await _context.MstModules
                        .Where(m => moduleGuids.Contains(m.strModuleGUID))
                        .ToListAsync();
                    
                    // Add each module exactly once to the user modules list
                    foreach (var module in modules)
                    {
                        var moduleGuidStr = module.strModuleGUID.ToString();
                        // Only add the module if it hasn't been added yet
                        if (addedModuleGuids.Add(moduleGuidStr)) // HashSet.Add returns true if the item was added
                        {
                            userModules.Add(new DTOs.Auth.ModuleInfo
                            {
                                strModuleGUID = moduleGuidStr,
                                strModuleName = module.strName,
                                strDesc = module.strDesc,
                                strImagePath = module.strImagePath
                            });
                        }
                    }
                }
            }
            
            // Create and return the user profile response
            return new UserProfileResponseDto
            {
                // User basic information
                strUserGUID = user.strUserGUID.ToString(),
                strName = user.strName,
                strEmailId = user.strEmailId,
                strMobileNo = user.strMobileNo,
                dtBirthDate = user.dtBirthDate,
                bolIsActive = user.bolIsActive,
                dtWorkingStartTime = user.dtWorkingStartTime,
                dtWorkingEndTime = user.dtWorkingEndTime,
                bolIsSuperAdmin = user.bolIsSuperAdmin,
                strProfileImg = user.strProfileImg,
                strTimeZone = user.strTimeZone,
                
                // Group information
                strGroupGUID = user.strGroupGUID?.ToString(),
                strGroupName = group?.strName, // Changed from strCompanyName for consistency
                strGroupLogo = group?.strLogo,
                
                // Organization information
                strLastOrganizationGUID = lastOrganizationGUID?.ToString(),
                strLastOrganizationName = organization?.strOrganizationName,
                strLastOrganizationLogo = organization?.strLogo,
                strCountryGUID = organization?.strCountryGUID?.ToString(),
                strCurrencyTypeGUID = organization?.strCurrencyTypeGUID?.ToString(),
                strCurrencyTypeName = currencyType?.strName,
                strTaxTypeGUID = taxType?.strTaxTypeGUID.ToString(),
                strTaxTypeCode = taxType?.strTaxTypeCode,
                bolIsTaxApplied = organization?.bolIsTaxApplied,
                
                // Year information
                strLastYearGUID = lastYearGUID?.ToString(),
                strLastYearName = year?.strName,
                dtYearStartDate = year?.dtStartDate,
                dtYearEndDate = year?.dtEndDate,
                
                // Module information
                strLastModuleGUID = user.strLastModuleGUID?.ToString(),
                strLastModuleName = user.strLastModuleGUID != null ?
                    (await _context.MstModules.FirstOrDefaultAsync(m => m.strModuleGUID == user.strLastModuleGUID))?.strName : null,
                strLastModuleDesc = user.strLastModuleGUID != null ?
                    (await _context.MstModules.FirstOrDefaultAsync(m => m.strModuleGUID == user.strLastModuleGUID))?.strDesc : null,                // Role information
                strUserRoleGUID = userRoleGuid.ToString(),
                strUserRoleName = userRoleName,
                
                // Module information
                modules = userModules.Count > 0 ? userModules : null,

                // Tax configuration for current organization
                tax = orgTax,
                
                // Additional audit information
                strCreatedByGUID = user.strCreatedByGUID.ToString(),
                dtCreatedOn = user.dtCreatedOn,
                strUpdatedByGUID = user.strUpdatedByGUID?.ToString(),
                dtUpdatedOn = user.dtUpdatedOn
            };
        }

        public async Task<Models.Entities.RefreshToken?> GetRefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrEmpty(refreshToken))
            {
                Console.WriteLine("REFRESH_TOKEN_DEBUG: GetRefreshTokenAsync received empty token");
                return null;
            }

            Console.WriteLine($"REFRESH_TOKEN_DEBUG: Looking for token in database. Token length: {refreshToken.Length}");
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(x => x.Token == refreshToken);
                
            if (token == null)
                Console.WriteLine("REFRESH_TOKEN_DEBUG: No matching token found in database");
            else
                Console.WriteLine($"REFRESH_TOKEN_DEBUG: Token found! IsUsed={token.IsUsed}, IsRevoked={token.IsRevoked}, " +
                                 $"Expired={token.ExpiryDate <= CurrentDateTime}, ExpiryDate={token.ExpiryDate}");
                
            return token;
        }

        // Helper method to get connection string based on group and module GUIDs
        private async Task<string?> GetConnectionStringByGroupAndModule(Guid groupGuid, Guid moduleGuid)
        {
            Console.WriteLine($"GetConnectionStringByGroupAndModule: Looking for connection string with groupGuid: {groupGuid}, moduleGuid: {moduleGuid}");

            // Find the group module with connection string
            return await GetConnectionStringAsync(groupGuid.ToString(), moduleGuid.ToString());
        }

        // Helper method to get connection string based on group and module GUIDs as strings
        private async Task<string?> GetConnectionStringAsync(string? groupGuid, string? moduleGuid)
        {
            if (string.IsNullOrEmpty(groupGuid) || string.IsNullOrEmpty(moduleGuid))
            {
                Console.WriteLine($"GetConnectionStringAsync: Missing required parameters - groupGuid: {groupGuid ?? "null"}, moduleGuid: {moduleGuid ?? "null"}");
                return null;
            }

            Console.WriteLine($"GetConnectionStringAsync: Looking for connection string with groupGuid: {groupGuid}, moduleGuid: {moduleGuid}");

            Guid groupGuidValue = groupGuid.ToGuid();
            Guid moduleGuidValue = moduleGuid.ToGuid();
            
            if (groupGuidValue == Guid.Empty || moduleGuidValue == Guid.Empty)
            {
                Console.WriteLine("GetConnectionStringAsync: Invalid GUID format");
                return null;
            }

            // Find the group module with connection string
            var groupModule = await _context.MstGroupModules
                .FirstOrDefaultAsync(gm => 
                    gm.strGroupGUID == groupGuidValue && 
                    gm.strModuleGUID == moduleGuidValue);
            
            if (groupModule != null)
            {
                // SECURITY FIX: Don't log connection strings
                _logger.LogInformation("Connection string found for group {GroupGuid} and module {ModuleGuid}", groupGuidValue, moduleGuidValue);
                return groupModule.strConnectionString;
            }
            else
            {
                _logger.LogWarning("No connection string found for group {GroupGuid} and module {ModuleGuid}", groupGuidValue, moduleGuidValue);
                return null;
            }
        }
    }
}
