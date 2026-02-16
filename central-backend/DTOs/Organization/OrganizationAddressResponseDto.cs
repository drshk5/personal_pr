using System;

namespace AuditSoftware.DTOs.Organization
{
    /// <summary>
    /// Response DTO for Organization billing and shipping addresses
    /// Represents address information stored directly in mstOrganization table
    /// Properties map to mstOrganization address fields (strAttention_billing, strAddress_billing, etc.)
    /// </summary>
    public class OrganizationAddressResponseDto
    {
        public string? strAttention { get; set; }
        public Guid? strCountryGUID { get; set; }
        public string? strCountryName { get; set; }
        public string? strAddressLine { get; set; }
        public Guid? strStateGUID { get; set; }
        public string? strStateName { get; set; }
        public Guid? strCityGUID { get; set; }
        public string? strCityName { get; set; }
        public string? strPinCode { get; set; }
        public string? strPhone { get; set; }
        public string? strFaxNumber { get; set; }
    }
}
