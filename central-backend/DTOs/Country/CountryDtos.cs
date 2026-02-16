using System;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.Country
{
    public class CountryCreateDto
    {
        public string strName { get; set; }
        public string? strCountryCode { get; set; }
        public string? strDialCode { get; set; }
        public int? intPhoneMinLength { get; set; }
        public int? intPhoneMaxLength { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class CountryUpdateDto
    {
        public string strName { get; set; }
        public string? strCountryCode { get; set; }
        public string? strDialCode { get; set; }
        public int? intPhoneMinLength { get; set; }
        public int? intPhoneMaxLength { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class CountryResponseDto
    {
        public string strCountryGUID { get; set; }
        public string strName { get; set; }
        public string? strCountryCode { get; set; }
        public string? strDialCode { get; set; }
        public int? intPhoneMinLength { get; set; }
        public int? intPhoneMaxLength { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class CountryFilterDto
    {
        [FromQuery(Name = "search")]
        public string? Search { get; set; }
        public bool? bolIsActive { get; set; }
        public string? sortBy { get; set; } = "strName";  // Default sort by name
        public bool ascending { get; set; } = true;      // Default ascending order
        public int pageNumber { get; set; } = 1;
        public int pageSize { get; set; } = 10;
    }

    public class CountrySimpleDto
    {
        public string strCountryGUID { get; set; }
        public string strName { get; set; }
        public string? strCountryCode { get; set; }
        public string? strDialCode { get; set; }
        public int? intPhoneMinLength { get; set; }
        public int? intPhoneMaxLength { get; set; }
    }
}
