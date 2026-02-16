using System;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.AccountType
{
    public class AccountTypeCreateDto
    {
        public string strName { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class AccountTypeUpdateDto
    {
        public string strName { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class AccountTypeResponseDto
    {
        public string strAccountTypeGUID { get; set; }
        public string strName { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class AccountTypeFilterDto
    {
        [FromQuery(Name = "search")]
        public string? Search { get; set; }
        public bool? bolIsActive { get; set; }
        [FromQuery(Name = "sortBy")]
        public string? sortBy { get; set; } = "strName";  // Default sort by name
        public bool ascending { get; set; } = true;      // Default ascending order
        [FromQuery(Name = "pageNumber")]
        public int pageNumber { get; set; } = 1;
        [FromQuery(Name = "pageSize")]
        public int pageSize { get; set; } = 10;
    }

    public class AccountTypeSimpleDto
    {
        public string strAccountTypeGUID { get; set; }
        public string strName { get; set; }
    }
}
