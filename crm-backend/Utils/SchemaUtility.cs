using System;
using Microsoft.Extensions.Logging;

namespace crm_backend.Utils
{
    public static class SchemaUtility
    {
        /// <summary>
        /// Generates a schema name based on the organization GUID using the standard pattern "ORG_{guid without hyphens}"
        /// </summary>
        /// <param name="organizationGuid">The organization GUID</param>
        /// <param name="logger">Optional logger for logging the generated schema name</param>
        /// <returns>The schema name</returns>
        /// <exception cref="ArgumentException">Thrown when organizationGuid is null or empty</exception>
        public static string GenerateSchemaFromOrganizationGuid(string organizationGuid, ILogger? logger = null)
        {
            if (string.IsNullOrEmpty(organizationGuid))
            {
                throw new ArgumentException("Organization GUID cannot be null or empty", nameof(organizationGuid));
            }

            // Create schema name with "ORG_" prefix
            string schema = $"ORG_{organizationGuid.Replace("-", "")}";

            // Log the schema name if logger is provided
            logger?.LogInformation($"Generated schema: {schema} for organization: {organizationGuid}");

            return schema;
        }

        /// <summary>
        /// Extracts organization GUID from JWT token claims and generates the schema name
        /// </summary>
        /// <param name="claims">Dictionary of claims from JWT token</param>
        /// <param name="logger">Optional logger for logging the generated schema name</param>
        /// <returns>The schema name</returns>
        /// <exception cref="InvalidOperationException">Thrown when organization GUID is not found in claims</exception>
        public static string GenerateSchemaFromClaims(System.Collections.Generic.Dictionary<string, string> claims, ILogger? logger = null)
        {
            string? organizationGuid = claims.ContainsKey("strOrganizationGUID")
                ? claims["strOrganizationGUID"]
                : null;

            if (string.IsNullOrEmpty(organizationGuid))
            {
                throw new InvalidOperationException("Organization GUID not found in token claims");
            }

            return GenerateSchemaFromOrganizationGuid(organizationGuid, logger);
        }
    }
}
