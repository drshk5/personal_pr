using System;
using System.Linq;
using System.Security.Claims;

namespace AuditSoftware.Controllers
{
    /// <summary>
    /// Extension methods for ClaimsPrincipal to easily access common claims
    /// </summary>
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// Gets the user GUID from claims
        /// </summary>
        /// <param name="user">The claims principal</param>
        /// <returns>The user GUID</returns>
        public static string GetUserGuid(this ClaimsPrincipal user)
        {
            var userGuidClaim = user.Claims.FirstOrDefault(c => c.Type == "strUserGUID");
            if (userGuidClaim == null)
                throw new InvalidOperationException("User GUID claim is missing from token");
                
            return userGuidClaim.Value;
        }
        
        /// <summary>
        /// Checks if the user is a superadmin
        /// </summary>
        /// <param name="user">The claims principal</param>
        /// <returns>True if the user is a superadmin</returns>
        public static bool IsSuperAdmin(this ClaimsPrincipal user)
        {
            var roleGuidClaim = user.Claims.FirstOrDefault(c => c.Type == "strRoleGUID");
            if (roleGuidClaim == null)
                return false;
                
            // Get the role name - this would be better if role name was included in the claims
            // For now, we'll assume this is checked elsewhere (in the RequirePermission attribute)
            return user.Claims.Any(c => c.Type == ClaimTypes.Role && c.Value == "SuperAdmin");
        }
        
        /// <summary>
        /// Gets the group GUID from claims
        /// </summary>
        /// <param name="user">The claims principal</param>
        /// <returns>The group GUID</returns>
        public static string GetGroupGuid(this ClaimsPrincipal user)
        {
            var groupGuidClaim = user.Claims.FirstOrDefault(c => c.Type == "strGroupGUID");
            if (groupGuidClaim == null)
                throw new InvalidOperationException("Group GUID claim is missing from token");
                
            return groupGuidClaim.Value;
        }
        
        /// <summary>
        /// Gets the organization GUID from claims
        /// </summary>
        /// <param name="user">The claims principal</param>
        /// <returns>The organization GUID</returns>
        public static string GetOrganizationGuid(this ClaimsPrincipal user)
        {
            var organizationGuidClaim = user.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID");
            if (organizationGuidClaim == null)
                throw new InvalidOperationException("Organization GUID claim is missing from token");
                
            return organizationGuidClaim.Value;
        }
        
        /// <summary>
        /// Gets the role GUID from claims
        /// </summary>
        /// <param name="user">The claims principal</param>
        /// <returns>The role GUID</returns>
        public static string GetRoleGuid(this ClaimsPrincipal user)
        {
            var roleGuidClaim = user.Claims.FirstOrDefault(c => c.Type == "strRoleGUID");
            if (roleGuidClaim == null)
                throw new InvalidOperationException("Role GUID claim is missing from token");
                
            return roleGuidClaim.Value;
        }
    }
}
