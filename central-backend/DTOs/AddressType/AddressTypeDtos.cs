using System;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.AddressType
{
    public class AddressTypeCreateDto
    {
        public string strName { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class AddressTypeUpdateDto
    {
        public string strName { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class AddressTypeResponseDto
    {
        public string strAddressTypeGUID { get; set; }
        public string strName { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class AddressTypeFilterDto
    {
        [FromQuery(Name = "search")]
        public string? Search { get; set; }
        public bool? bolIsActive { get; set; }
        public string? sortBy { get; set; } = "strName";  // Default sort by name
        public bool ascending { get; set; } = true;      // Default ascending order
        public int pageNumber { get; set; } = 1;
        public int pageSize { get; set; } = 10;
    }

    public class AddressTypeSimpleDto
    {
        public string strAddressTypeGUID { get; set; }
        public string strName { get; set; }
    }
}
