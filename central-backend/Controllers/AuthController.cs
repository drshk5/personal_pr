using AuditSoftware.DTOs.Auth;
using AuditSoftware.Interfaces;
using AuditSoftware.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Services;
using AuditSoftware.Models;
using System.Text;
using System.Text.Json;
using AuditSoftware.Helpers;

namespace AuditSoftware.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private const string JWT_COOKIE_NAME = "Token";
        private const string REFRESH_COOKIE_NAME = "RefreshToken";
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;
        private readonly IUserSessionService _userSessionService;

        public AuthController(
            IAuthService authService,
            IConfiguration configuration,
            ILogger<AuthController> logger,
            IUserSessionService userSessionService)
        {
            _authService = authService;
            _configuration = configuration;
            _logger = logger;
            _userSessionService = userSessionService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            try
            {
                var response = await _authService.LoginAsync(request);
                
                if (response == null)
                {
                    throw new InvalidOperationException("Failed to generate login response");
                }
                
                // Get the raw token before encryption
                string rawToken = response.Token ?? throw new InvalidOperationException("Token is null");
                
                // Encrypt the token for cookie and response
                string encryptedToken = _authService.EncryptToken(rawToken);
                
                // Update the response with the encrypted token
                response.Token = encryptedToken;
                
                // Do not store access token in cookies

                if (response.RefreshToken == null)
                {
                    throw new InvalidOperationException("Refresh token is null");
                }
                SetRefreshTokenCookie(response.RefreshToken);

                // If previous session was revoked, include that in the top-level message so clients show it prominently
                var responseMessage = "Login successful";
                if (response.PreviousSessionRevoked && !string.IsNullOrEmpty(response.SessionMessage))
                {
                    responseMessage = $"Login successful. {response.SessionMessage}";
                }

                return Ok(new
                {
                    statusCode = 200,
                    message = responseMessage,
                    data = new
                    {
                        Token = response.Token
                        // RefreshToken is set in cookie, not returned in response
                        // Other fields (strUserGUID, strName, etc.) have been removed
                    }
                });
            }
            catch (AuditSoftware.Exceptions.SessionExistsException ex)
            {
                // Return 409 Conflict with minimal session info for frontend to show confirmation modal
                _logger.LogInformation($"Session exists for user during login: {ex.Message}");
                return StatusCode(409, new
                {
                    statusCode = 409,
                    message = "Active session(s) exist for this account",
                    data = new
                    {
                        hasActiveSession = ex.ActiveSessions != null && ex.ActiveSessions.Count > 0,
                        sessions = ex.ActiveSessions
                    }
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning($"Business exception during login: {ex.Message}");
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error during login: {ex.Message}\nStack trace: {ex.StackTrace}");
                return StatusCode(500, new { statusCode = 500, message = $"An error occurred during login: {ex.Message}" });
            }
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies[REFRESH_COOKIE_NAME];
            Console.WriteLine($"REFRESH_TOKEN_DEBUG: Cookie present: {!string.IsNullOrEmpty(refreshToken)}");
            
            // Check if cookies collection has any cookies
            Console.WriteLine($"REFRESH_TOKEN_DEBUG: Cookie count: {Request.Cookies.Count}");
            foreach (var cookie in Request.Cookies)
            {
                Console.WriteLine($"REFRESH_TOKEN_DEBUG: Cookie name: {cookie.Key}, Value length: {cookie.Value?.Length ?? 0}");
            }
            
            // Do NOT accept refresh token from headers; cookie-only policy

            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(new { statusCode = 401, message = "Refresh token is missing" });
            }

            try
            {
                // Try to use the refresh token
                LoginResponseDto? response = null;
                
                try
                {
                    response = await _authService.RefreshTokenAsync(refreshToken);
                }
                catch (BusinessException ex) when (ex.Message.Contains("not found"))
                {
                    // If refresh token is not found, try to extract user info from the access token
                    Console.WriteLine("RECOVERY_DEBUG: Refresh token not found, attempting recovery using access token");
                    
                    // Get the access token from Authorization header
                    var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                    string? encryptedAccessToken = null;
                    if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                    {
                        encryptedAccessToken = authHeader.Substring(7).Trim();
                    }
                    
                    if (string.IsNullOrEmpty(encryptedAccessToken))
                    {
                        Console.WriteLine("RECOVERY_DEBUG: No access token in Authorization header. Cannot recover from missing refresh token.");
                        throw; // Rethrow original exception
                    }
                    
                    if (!string.IsNullOrEmpty(encryptedAccessToken))
                    {
                        try
                        {
                            // Decrypt and parse the token without validating expiration
                            var accessToken = _authService.DecryptToken(encryptedAccessToken);
                            var handler = new JwtSecurityTokenHandler();
                            var jwtToken = handler.ReadJwtToken(accessToken);
                            
                            string? userGuid = jwtToken.Claims.FirstOrDefault(c => c.Type == "strUserGUID")?.Value;
                            string? emailId = jwtToken.Claims.FirstOrDefault(c => c.Type == "strEmailId")?.Value;
                            string? groupGuid = jwtToken.Claims.FirstOrDefault(c => c.Type == "strGroupGUID")?.Value;
                            string? orgGuid = jwtToken.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID")?.Value;
                            string? roleGuid = jwtToken.Claims.FirstOrDefault(c => c.Type == "strRoleGUID")?.Value;
                            string? yearGuid = jwtToken.Claims.FirstOrDefault(c => c.Type == "strYearGUID")?.Value;
                            string? moduleGuid = jwtToken.Claims.FirstOrDefault(c => c.Type == "strModuleGUID")?.Value;
                            string? jti = jwtToken.Claims.FirstOrDefault(c => c.Type == "jti")?.Value;
                            
                            if (!string.IsNullOrEmpty(userGuid) && !string.IsNullOrEmpty(emailId))
                            {
                                Console.WriteLine($"RECOVERY_DEBUG: Retrieved user info from access token. UserGUID: {userGuid}, JTI: {jti}");
                                
                                // SECURITY CHECK: Before allowing recovery, verify that the session from the old token is still valid
                                // This prevents recovery when user has logged in elsewhere (invalidating old sessions)
                                if (_userSessionService != null && !string.IsNullOrEmpty(jti))
                                {
                                    var sessionStatus = await _userSessionService.CheckSessionStatusAsync(userGuid, jti);
                                    
                                    // Only block recovery if session is Invalid (not found or inactive)
                                    // Allow recovery if session is just Expired (timeout, not forced logout)
                                    if (sessionStatus == SessionStatus.Invalid)
                                    {
                                        Console.WriteLine($"RECOVERY_DEBUG: Session from old token is invalid (JTI: {jti}). Blocking recovery to prevent bypassing forced logout.");
                                        throw new BusinessException("Your session is no longer valid. Please log in again.");
                                    }
                                    
                                    // If session is expired, renew it before creating new tokens
                                    if (sessionStatus == SessionStatus.Expired)
                                    {
                                        Console.WriteLine($"RECOVERY_DEBUG: Session expired (JTI: {jti}). Renewing session for recovery.");
                                        var sessionDuration = TimeSpan.FromMinutes(_configuration.GetValue<int>("Jwt:SessionExpirationMinutes", 15));
                                        await _userSessionService.RenewExpiredSessionAsync(userGuid, jti, sessionDuration);
                                    }
                                }
                                
                                Console.WriteLine($"RECOVERY_DEBUG: Session validation passed for recovery. Creating new tokens.");
                                
                                // Generate new tokens
                                response = await _authService.RecreateTokensAsync(
                                    emailId,
                                    groupGuid != null ? GuidHelper.ToNullableGuid(groupGuid) : null,
                                    orgGuid != null ? GuidHelper.ToNullableGuid(orgGuid) : null,
                                    GuidHelper.ToGuid(roleGuid ?? string.Empty),
                                    GuidHelper.ToGuid(userGuid),
                                    yearGuid != null ? GuidHelper.ToNullableGuid(yearGuid) : null,
                                    moduleGuid != null ? GuidHelper.ToNullableGuid(moduleGuid) : null
                                );
                                
                                Console.WriteLine("RECOVERY_DEBUG: Successfully created new tokens from access token");
                            }
                        }
                        catch (Exception recEx)
                        {
                            Console.WriteLine($"RECOVERY_DEBUG: Recovery failed: {recEx.Message}");
                            // Let it fall through to the original exception
                        }
                    }
                    
                    // If recovery wasn't successful, rethrow the original exception
                    if (response == null)
                    {
                        throw;
                    }
                }
                
                // If we get here, we have a valid response
                if (response == null)
                {
                    throw new InvalidOperationException("Failed to generate tokens");
                }
                
                // Get the raw token before encryption
                string rawToken = response.Token ?? throw new InvalidOperationException("Token is null");
                
                // Encrypt the token for cookie and response
                string encryptedToken = _authService.EncryptToken(rawToken);
                
                // Update the response with the encrypted token
                response.Token = encryptedToken;

                // Do not store access token in cookies on refresh

                // Set new refresh token in HTTP-only cookie
                if (response.RefreshToken == null)
                {
                    throw new InvalidOperationException("Refresh token is null");
                }
                SetRefreshTokenCookie(response.RefreshToken);

                // Return minimal response with only the access token
                return Ok(new
                {
                    statusCode = 200,
                    message = "Token refreshed successfully",
                    data = new RefreshTokenResponseDto 
                    { 
                        Token = response.Token ?? throw new InvalidOperationException("Token is null")
                    }
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"REFRESH_ERROR: {ex.Message}");
                Console.WriteLine($"REFRESH_ERROR: {ex.StackTrace}");
                return BadRequest(new { statusCode = 400, message = "An error occurred while refreshing the token" });
            }
        }

        [HttpPost("logout")]
        [AllowAnonymous] // Switching back to allow anonymous to prevent authentication errors during logout
        public async Task<IActionResult> Logout()
        {
            try 
            {
                string? userGuid = null;
                string? refreshToken = null;
                
                // First check if user is authenticated via middleware
                if (User.Identity?.IsAuthenticated == true)
                {
                    // Get user GUID from the authenticated claims
                    userGuid = User.FindFirst("strUserGUID")?.Value;
                    Console.WriteLine($"User authenticated, found userGuid: {userGuid}");
                }
                
                // Debug information about identity
                Console.WriteLine($"LOGOUT_DEBUG: Is Authenticated: {User.Identity?.IsAuthenticated}");
                Console.WriteLine($"LOGOUT_DEBUG: Identity Type: {User.Identity?.GetType().Name}");
                Console.WriteLine($"LOGOUT_DEBUG: Authentication Type: {User.Identity?.AuthenticationType}");
                
                // Log all claims for debugging
                Console.WriteLine("LOGOUT_DEBUG: Available claims:");
                foreach (var claim in User.Claims)
                {
                    Console.WriteLine($"LOGOUT_DEBUG: Claim {claim.Type} = {claim.Value}");
                }
                
                // If user isn't authenticated or GUID is missing, try to extract from tokens
                if (string.IsNullOrEmpty(userGuid))
                {
                    Console.WriteLine("User not authenticated through middleware, checking tokens manually");
                    
                    // Log cookies for debugging
                    Console.WriteLine($"LOGOUT_DEBUG: Cookie count: {Request.Cookies.Count}");
                    foreach (var cookie in Request.Cookies)
                    {
                        Console.WriteLine($"LOGOUT_DEBUG: Cookie {cookie.Key} found, length: {cookie.Value?.Length ?? 0}");
                    }
                    
                    // Log headers for debugging
                    Console.WriteLine("LOGOUT_DEBUG: Available headers:");
                    foreach (var header in Request.Headers)
                    {
                        if (header.Key.ToLower().Contains("token") || header.Key.ToLower().Contains("auth"))
                        {
                            Console.WriteLine($"LOGOUT_DEBUG: Header {header.Key} found");
                        }
                    }
                    
                    // Try to get refresh token first (cookie then header)
                    refreshToken = Request.Cookies[REFRESH_COOKIE_NAME];
                    Console.WriteLine($"LOGOUT_DEBUG: Refresh token from cookie: {(string.IsNullOrEmpty(refreshToken) ? "not found" : "found, length: " + refreshToken.Length)}");
                    
                    if (string.IsNullOrEmpty(refreshToken))
                    {
                        refreshToken = Request.Headers["X-Refresh-Token"].ToString();
                        Console.WriteLine($"LOGOUT_DEBUG: Refresh token from header: {(string.IsNullOrEmpty(refreshToken) ? "not found" : "found")}");
                    }
                    
                    if (!string.IsNullOrEmpty(refreshToken))
                    {
                        try
                        {
                            // Try to find user via refresh token
                            var refreshTokenEntity = await _authService.GetRefreshTokenAsync(refreshToken);
                            if (refreshTokenEntity != null)
                            {
                                userGuid = refreshTokenEntity.strUserGUID.ToString();
                                Console.WriteLine($"User identified from refresh token: {userGuid}");
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error getting refresh token: {ex.Message}");
                        }
                    }
                    
                    // If still no user, try JWT token from Authorization header
                    if (string.IsNullOrEmpty(userGuid))
                    {
                        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                        string? jwtToken = null;
                        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                        {
                            jwtToken = authHeader.Substring(7).Trim();
                        }
                        Console.WriteLine($"LOGOUT_DEBUG: JWT token from Authorization header: {(string.IsNullOrEmpty(jwtToken) ? "not found" : "found, length: " + jwtToken.Length)}");
                        
                        if (!string.IsNullOrEmpty(jwtToken))
                        {
                            try
                            {
                                var handler = new JwtSecurityTokenHandler();
                                string tokenToParse;
                                
                                // Try direct parsing first (unencrypted JWT)
                                if (handler.CanReadToken(jwtToken))
                                {
                                    Console.WriteLine("LOGOUT_DEBUG: Token is valid JWT format (unencrypted)");
                                    tokenToParse = jwtToken;
                                }
                                else
                                {
                                    // Token is encrypted, decrypt it
                                    Console.WriteLine("LOGOUT_DEBUG: Token appears encrypted, attempting to decrypt");
                                    tokenToParse = _authService.DecryptToken(jwtToken);
                                    Console.WriteLine($"LOGOUT_DEBUG: JWT token decrypted, length: {tokenToParse.Length}");
                                }
                                
                                var parsedToken = handler.ReadJwtToken(tokenToParse);
                                Console.WriteLine($"LOGOUT_DEBUG: JWT parsed successfully, expiration: {parsedToken.ValidTo}");
                                
                                userGuid = parsedToken.Claims.FirstOrDefault(c => c.Type == "strUserGUID")?.Value;
                                
                                if (!string.IsNullOrEmpty(userGuid))
                                {
                                    Console.WriteLine($"User identified from Authorization header: {userGuid}");
                                }
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error processing Authorization header token: {ex.Message}");
                            }
                        }
                    }
                }
                
                // Even if we couldn't identify the user, clear cookies anyway
                ClearCookies();
                
                // If we found a user, invalidate their session server-side
                if (!string.IsNullOrEmpty(userGuid))
                {
                    await _authService.LogoutAsync(GuidHelper.ToGuid(userGuid));
                    Console.WriteLine($"Successfully logged out user: {userGuid}");
                    return Ok(new { statusCode = 200, message = "Logged out successfully" });
                }
                
                // Return success even if user wasn't identified
                return Ok(new { statusCode = 200, message = "Cookies cleared, but user could not be identified" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during logout: {ex.Message}");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred during logout" });
            }
        }

        [HttpGet("me")]
        [Authorize] // Standard authorization using Authorization: Bearer <token>
        public async Task<IActionResult> GetUserProfile()
        {
            try
            {
                var hasAuthHeader = !string.IsNullOrEmpty(Request.Headers["Authorization"].ToString());
                Console.WriteLine($"[AUTH] /api/auth/me has Authorization header: {hasAuthHeader}");
                // The TokenValidationMiddleware/User claims are based on Authorization header,
                // Authorization header, or cookies, so we can just use User.Claims directly
                
                string? userGuid = User.FindFirst("strUserGUID")?.Value;
                Console.WriteLine($"Found userGuid from User.Claims: {userGuid}");
                
                if (string.IsNullOrEmpty(userGuid))
                {
                    return Unauthorized(new { statusCode = 401, message = "User GUID not found in token" });
                }

                var userProfile = await _authService.GetUserProfileAsync(GuidHelper.ToGuid(userGuid));

                return Ok(new
                {
                    statusCode = 200,
                    message = "User profile retrieved successfully",
                    data = userProfile
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging
                Console.WriteLine($"Error in GetUserProfile: {ex.Message}");
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while retrieving user profile" });
            }
        }

        [HttpPost("validate-token")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateToken()
        {
            try
            {
                // Get token from Authorization header
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    return Ok(new { statusCode = 401, message = "No token provided in Authorization header" });
                }
                
                var encryptedToken = authHeader.Substring(7).Trim();
                if (string.IsNullOrEmpty(encryptedToken))
                {
                    return Ok(new { statusCode = 401, message = "No token provided" });
                }

                // Decrypt the token before validation
                string token;
                try
                {
                    token = _authService.DecryptToken(encryptedToken);
                }
                catch
                {
                    return Ok(new { statusCode = 401, message = "Invalid encrypted token" });
                }

                var isValid = await _authService.ValidateTokenAsync(token);
                if (isValid)
                {
                    // Get claims from the token for the response
                    var handler = new JwtSecurityTokenHandler();
                    var jwtToken = handler.ReadJwtToken(token);

                    var data = new
                    {
                        isValid = true,
                        userGUID = jwtToken.Claims.FirstOrDefault(c => c.Type == "strUserGUID")?.Value,
                        emailId = jwtToken.Claims.FirstOrDefault(c => c.Type == "strEmailId")?.Value,
                        groupGUID = jwtToken.Claims.FirstOrDefault(c => c.Type == "strGroupGUID")?.Value,
                        organizationGUID = jwtToken.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID")?.Value,
                        roleGUID = jwtToken.Claims.FirstOrDefault(c => c.Type == "strRoleGUID")?.Value
                    };

                    return Ok(new { statusCode = 200, message = "Token is valid", data = data });
                }

                return Ok(new { statusCode = 401, message = "Token is invalid" });
            }
            catch
            {
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while validating the token" });
            }
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { statusCode = 400, message = "Invalid request data" });
            }

            try
            {
                var result = await _authService.ForgotPasswordAsync(request);
                return Ok(new { statusCode = 200, message = result });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while processing your request" });
            }
        }

        [HttpPost("create-superadmin")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateSuperAdmin([FromBody] CreateSuperAdminRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { statusCode = 400, message = "Invalid request data" });
            }

            try
            {
                var response = await _authService.CreateSuperAdminAsync(request);
                var data = new
                {
                    emailId = response.strEmailId,
                    name = response.strName
                };
                return Ok(new { statusCode = 200, message = "Superadmin created successfully", data = data });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception ex)
            {
                // Log the error details
                Console.WriteLine($"Error creating superadmin: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while creating superadmin" });
            }
        }

        [HttpPost("change-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { statusCode = 400, message = "Invalid request data" });
            }

            try
            {
                // We no longer need to get user ID from token claims since this is a public endpoint
                var result = await _authService.ChangePasswordAsync(request, request.strEmailId);
                return Ok(new 
                { 
                    statusCode = 200, 
                    message = "Password changed successfully"
                });
            }
            catch (BusinessException ex)
            {
                return BadRequest(new { statusCode = 400, message = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { statusCode = 500, message = "An error occurred while changing password" });
            }
        }

        [HttpPost("decode-token")]
        [Authorize]
        public IActionResult DecodeToken([FromBody] DecodeTokenRequestDto request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.EncryptedToken))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Encrypted token is required"
                    });
                }

                // Decrypt the token
                string decryptedToken = _authService.DecryptToken(request.EncryptedToken);
                
                // Parse the token to extract claims
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(decryptedToken);
                
                // Create a dictionary of all claims
                var claims = jwtToken.Claims.ToDictionary(
                    claim => claim.Type,
                    claim => claim.Value
                );

                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Token decoded successfully",
                    Data = new
                    {
                        DecryptedToken = decryptedToken,
                        Claims = claims,
                        Expiry = jwtToken.ValidTo
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = $"Error decoding token: {ex.Message}"
                });
            }
        }

        [HttpGet("check-cookies")]
        [AllowAnonymous]
        public IActionResult CheckCookies()
        {
            var cookieData = new Dictionary<string, object>();
            
            foreach (var cookie in Request.Cookies)
            {
                cookieData.Add(cookie.Key, new 
                { 
                    valueLength = cookie.Value?.Length ?? 0,
                    preview = !string.IsNullOrEmpty(cookie.Value) ? 
                        cookie.Value.Substring(0, Math.Min(5, cookie.Value.Length)) + "..." : 
                        "(empty)"
                });
            }
            
            var headerData = new Dictionary<string, string>();
            foreach (var header in Request.Headers)
            {
                if (!header.Key.ToLower().Contains("authorization"))  // Don't log auth headers fully
                {
                    headerData.Add(header.Key, header.Value.ToString() ?? string.Empty);
                }
                else
                {
                    headerData.Add(header.Key, "(present but not displayed)");
                }
            }
            
            // Check specific refresh token
            bool hasRefreshTokenCookie = Request.Cookies.ContainsKey(REFRESH_COOKIE_NAME);
            string refreshToken = Request.Cookies[REFRESH_COOKIE_NAME] ?? "";
            
            return Ok(new
            {
                statusCode = 200,
                message = "Cookie check results",
                data = new
                {
                    cookieCount = Request.Cookies.Count,
                    cookies = cookieData,
                    headers = headerData,
                    hasRefreshToken = hasRefreshTokenCookie,
                    refreshTokenLength = refreshToken.Length
                }
            });
        }
        
        [HttpGet("debug-auth")]
        [AllowAnonymous]
        public async Task<IActionResult> DebugAuth()
        {
            var result = new Dictionary<string, object>();
            
            // Check authentication state
            result["isAuthenticated"] = User.Identity?.IsAuthenticated ?? false;
            result["authenticationType"] = User.Identity?.AuthenticationType ?? "none";
            
            var claimsDict = new Dictionary<string, string>();
            foreach (var claim in User.Claims)
            {
                claimsDict[claim.Type] = claim.Value;
            }
            result["claims"] = claimsDict;
            
            // Check cookies
            var cookiesDict = new Dictionary<string, object>();
            foreach (var cookie in Request.Cookies)
            {
                cookiesDict[cookie.Key] = new { length = cookie.Value?.Length ?? 0 };
            }
            result["cookies"] = cookiesDict;
            
            // Check for specific cookies
            bool hasJwtCookie = Request.Cookies.ContainsKey(JWT_COOKIE_NAME);
            bool hasRefreshCookie = Request.Cookies.ContainsKey(REFRESH_COOKIE_NAME);
            result["hasJwtCookie"] = hasJwtCookie;
            result["hasRefreshCookie"] = hasRefreshCookie;
            
            // Check auth headers (standardized: only Authorization is used for access token)
            var headersDict = new Dictionary<string, bool>();
            headersDict["Authorization"] = !string.IsNullOrEmpty(Request.Headers["Authorization"].ToString());
            headersDict["X-Refresh-Token"] = !string.IsNullOrEmpty(Request.Headers["X-Refresh-Token"].ToString());
            result["headers"] = headersDict;
            
            // Try to decode JWT token if available from Authorization header
            // Track JWT token decode results
            try
            {
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                string? jwtToken = null;
                if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    jwtToken = authHeader.Substring(7).Trim();
                }
                
                if (!string.IsNullOrEmpty(jwtToken))
                {
                    // Check if it needs decryption
                    var handler = new JwtSecurityTokenHandler();
                    string token;
                    if (handler.CanReadToken(jwtToken))
                    {
                        token = jwtToken;
                    }
                    else
                    {
                        token = _authService.DecryptToken(jwtToken);
                    }
                    var parsedToken = handler.ReadJwtToken(token);
                    
                    var tokenClaimsDict = new Dictionary<string, string>();
                    foreach (var claim in parsedToken.Claims)
                    {
                        tokenClaimsDict[claim.Type] = claim.Value;
                    }
                    
                    result["jwtTokenDecoded"] = new
                    {
                        validTo = parsedToken.ValidTo,
                        validFrom = parsedToken.ValidFrom,
                        claims = tokenClaimsDict
                    };
                    
                    // Check if token is valid
                    bool isValid = await _authService.ValidateTokenAsync(token);
                    result["jwtCookieValid"] = isValid;
                }
            }
            catch (Exception ex)
            {
                result["jwtDecodeError"] = ex.Message;
            }
            
            return Ok(new
            {
                statusCode = 200,
                message = "Authentication debug information",
                data = result
            });
        }

        [HttpGet("decode-current-token")]
        [AllowAnonymous]
        public IActionResult DecodeCurrentToken()
        {
            try
            {
                // Get token from Authorization header
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        statusCode = 400,
                        Message = "Authorization header with Bearer token is required"
                    });
                }

                var token = authHeader.Substring(7).Trim();
                string decryptedToken;

                // Check if token needs decryption
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    // Already a valid JWT
                    decryptedToken = token;
                }
                else
                {
                    // Try to decrypt
                    try
                    {
                        decryptedToken = _authService.DecryptToken(token);
                    }
                    catch (Exception ex)
                    {
                        return BadRequest(new ApiResponse<object>
                        {
                            statusCode = 400,
                            Message = $"Failed to decrypt token: {ex.Message}"
                        });
                    }
                }
                
                // Parse the token to extract claims
                var jwtToken = handler.ReadJwtToken(decryptedToken);
                
                // Create a dictionary of all claims
                var claims = jwtToken.Claims.ToDictionary(
                    claim => claim.Type,
                    claim => claim.Value
                );

                return Ok(new ApiResponse<object>
                {
                    statusCode = 200,
                    Message = "Token decoded successfully",
                    Data = new
                    {
                        DecryptedToken = decryptedToken,
                        TokenClaims = claims,
                        Expiry = jwtToken.ValidTo,
                        IsExpired = jwtToken.ValidTo < DateTime.UtcNow
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>
                {
                    statusCode = 500,
                    Message = $"Error decoding token: {ex.Message}"
                });
            }
        }

        // Removed SetTokenCookie: access tokens are not stored in cookies

        private void SetRefreshTokenCookie(string refreshToken)
        {
            // Since we're dealing with cross-origin requests, always use SameSite=None
            // Note: When SameSite=None, Secure must be true
            Console.WriteLine($"COOKIE_DEBUG: Setting refresh token cookie. Host: {Request.Host.Host}, Using SameSite=None");
                              
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(_configuration.GetValue<int>("Jwt:RefreshTokenExpirationDays", 7)), // Use refresh token expiration from config
                SameSite = SameSiteMode.None, // Always use None for cross-origin requests
                Secure = true, // Required when SameSite=None
                Path = "/"
            };
            Response.Cookies.Append("RefreshToken", refreshToken, cookieOptions);
        }

        private void ClearCookies()
        {
            // Consistent cookie settings for cross-origin requests
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Required when SameSite=None
                SameSite = SameSiteMode.None, // Required for cross-origin requests
                Path = "/",
                Domain = null,
                Expires = DateTime.UtcNow.AddDays(-1) // Use UTC time for cookie expiration
            };

            Response.Cookies.Delete(JWT_COOKIE_NAME, cookieOptions);
            Response.Cookies.Delete(REFRESH_COOKIE_NAME, cookieOptions);
        }
    }
}

