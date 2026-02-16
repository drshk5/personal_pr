using AuditSoftware.DTOs.Auth;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AuditSoftware.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> LoginAsync(LoginRequestDto loginRequest);
        Task<LoginResponseDto> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(Guid userGuid);
        Task<bool> ValidateTokenAsync(string token);
    string GenerateJwtToken(string emailId, Guid? groupGUID, Guid? organizationGUID, Guid? roleGUID, Guid userGUID, Guid? yearGUID = null, string? timeZone = null, Guid? moduleGUID = null, string? connectionString = null, string? sessionId = null, Guid? sessionGuid = null, string? taxConfigJson = null);
    Task<(string token, string refreshToken)> GenerateTokensAsync(string emailId, Guid? groupGUID, Guid? organizationGUID, Guid? roleGUID, Guid userGuid, Guid? yearGUID = null, Guid? moduleGUID = null, string? reuseSessionId = null);
        Task<LoginResponseDto> RecreateTokensAsync(string emailId, Guid? groupGUID, Guid? organizationGUID, Guid roleGUID, Guid userGuid, Guid? yearGUID = null, Guid? moduleGUID = null);
        string EncryptToken(string token);
        string DecryptToken(string encryptedToken);
        Task<string> ForgotPasswordAsync(ForgotPasswordRequestDto request);
        Task<LoginResponseDto> CreateSuperAdminAsync(CreateSuperAdminRequestDto request);
        Task<bool> ChangePasswordAsync(ChangePasswordRequestDto request, string userId);
        Task<LoginResponseDto> SwitchOrganizationAsync(Guid userGUID, Guid organizationGUID, Guid? yearGUID = null);
        Task<UserProfileResponseDto> GetUserProfileAsync(Guid userGuid);
        Task<Models.Entities.RefreshToken?> GetRefreshTokenAsync(string refreshToken);
        Task<List<string>> GetUserGroupsAsync(string userGuid);
    }
} 