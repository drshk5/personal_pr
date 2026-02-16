using System;

namespace AuditSoftware.DTOs.Organization
{
    /// <summary>
    /// Response DTO for Organization with billing and shipping addresses from mstOrganization module
    /// Used for forms that need billing and shipping address information
    /// Billing and shipping addresses are fetched directly from mstOrganization table fields
    /// </summary>
    public class OrganizationWithLocationsResponseDto
    {
        public Guid strOrganizationGUID { get; set; }
        public string strOrganizationName { get; set; } = string.Empty;
        public string? strDescription { get; set; }
        public string? strPAN { get; set; }
        public string? strTAN { get; set; }
        public string? strCIN { get; set; }
        public string? strUDFCode { get; set; }
        public bool bolIsActive { get; set; }
        public bool bolIsTaxApplied { get; set; }

        // Billing and shipping addresses from mstOrganization table
        public OrganizationAddressResponseDto? BillingAddress { get; set; }
        public OrganizationAddressResponseDto? ShippingAddress { get; set; }
    }
}
