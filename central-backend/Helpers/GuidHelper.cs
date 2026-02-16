using System;
using System.Collections.Generic;
using System.Linq;

namespace AuditSoftware.Helpers
{
    /// <summary>
    /// Helper class for Guid conversion operations
    /// </summary>
    public static class GuidHelper
    {
        /// <summary>
        /// Converts a string to Guid safely. Returns Guid.Empty if string is null, empty or invalid.
        /// </summary>
        /// <param name="guidString">String to convert to Guid</param>
        /// <returns>Converted Guid or Guid.Empty if conversion fails</returns>
        public static Guid ToGuid(this string guidString)
        {
            if (string.IsNullOrWhiteSpace(guidString))
                return Guid.Empty;

            return Guid.TryParse(guidString, out Guid result) ? result : Guid.Empty;
        }

        /// <summary>
        /// Converts a string to nullable Guid. Returns null if string is null, empty or invalid.
        /// </summary>
        /// <param name="guidString">String to convert to nullable Guid</param>
        /// <returns>Converted Guid or null if conversion fails</returns>
        public static Guid? ToNullableGuid(this string guidString)
        {
            if (string.IsNullOrWhiteSpace(guidString))
                return null;

            return Guid.TryParse(guidString, out Guid result) ? result : (Guid?)null;
        }

        /// <summary>
        /// Converts a list of strings to a list of Guids. Invalid or null entries are filtered out.
        /// </summary>
        /// <param name="guidStrings">List of strings to convert</param>
        /// <returns>List of valid Guids</returns>
        public static List<Guid> ToGuidList(this IEnumerable<string> guidStrings)
        {
            if (guidStrings == null)
                return new List<Guid>();

            return guidStrings
                .Where(s => !string.IsNullOrWhiteSpace(s) && Guid.TryParse(s, out _))
                .Select(s => Guid.Parse(s))
                .ToList();
        }

        /// <summary>
        /// Converts a list of strings to a list of nullable Guids. Invalid entries become null.
        /// </summary>
        /// <param name="guidStrings">List of strings to convert</param>
        /// <returns>List of nullable Guids</returns>
        public static List<Guid?> ToNullableGuidList(this IEnumerable<string> guidStrings)
        {
            if (guidStrings == null)
                return new List<Guid?>();

            return guidStrings
                .Select(s => string.IsNullOrWhiteSpace(s) ? (Guid?)null : 
                    (Guid.TryParse(s, out Guid result) ? result : (Guid?)null))
                .ToList();
        }

        /// <summary>
        /// Compares a Guid with a string representation of a Guid
        /// </summary>
        /// <param name="guid">The Guid to compare</param>
        /// <param name="guidString">String representation of a Guid</param>
        /// <returns>True if they represent the same Guid</returns>
        public static bool EqualsString(this Guid guid, string guidString)
        {
            if (string.IsNullOrWhiteSpace(guidString))
                return guid == Guid.Empty;

            return Guid.TryParse(guidString, out Guid parsed) && guid == parsed;
        }

        /// <summary>
        /// Compares a nullable Guid with a string representation of a Guid
        /// </summary>
        /// <param name="guid">The nullable Guid to compare</param>
        /// <param name="guidString">String representation of a Guid</param>
        /// <returns>True if they represent the same Guid</returns>
        public static bool EqualsString(this Guid? guid, string guidString)
        {
            if (string.IsNullOrWhiteSpace(guidString))
                return !guid.HasValue || guid.Value == Guid.Empty;

            if (!guid.HasValue)
                return false;

            return Guid.TryParse(guidString, out Guid parsed) && guid.Value == parsed;
        }

        /// <summary>
        /// Converts a Guid to its string representation, or returns a default value if the Guid is empty
        /// </summary>
        /// <param name="guid">The Guid to convert</param>
        /// <param name="defaultValue">Default value to return if Guid is empty</param>
        /// <returns>String representation of the Guid or the default value</returns>
        public static string ToStringOrDefault(this Guid guid, string defaultValue = null)
        {
            return guid == Guid.Empty ? defaultValue : guid.ToString();
        }

        /// <summary>
        /// Converts a nullable Guid to its string representation, or returns a default value if the Guid is null or empty
        /// </summary>
        /// <param name="guid">The nullable Guid to convert</param>
        /// <param name="defaultValue">Default value to return if Guid is null or empty</param>
        /// <returns>String representation of the Guid or the default value</returns>
        public static string ToStringOrDefault(this Guid? guid, string defaultValue = null)
        {
            return !guid.HasValue || guid.Value == Guid.Empty ? defaultValue : guid.Value.ToString();
        }

        /// <summary>
        /// Tries to get a trimmed list from a comma-separated string of Guids
        /// </summary>
        /// <param name="commaSeparatedGuids">Comma-separated string of Guids</param>
        /// <returns>List of valid Guids</returns>
        public static List<Guid> GetGuidListFromCommaSeparated(string commaSeparatedGuids)
        {
            if (string.IsNullOrWhiteSpace(commaSeparatedGuids))
                return new List<Guid>();

            var guidStrings = commaSeparatedGuids.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .ToList();

            return guidStrings.ToGuidList();
        }

        /// <summary>
        /// Safely gets a Guid value from a nullable Guid with a default value if it's null
        /// </summary>
        /// <param name="nullableGuid">The nullable Guid</param>
        /// <returns>The Guid value or Guid.Empty if null</returns>
        public static Guid GetValueOrEmpty(this Guid? nullableGuid)
        {
            return nullableGuid ?? Guid.Empty;
        }
    }
}