using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.GroupModule
{
    public class GroupModuleCreateDto
    {
        [Required(ErrorMessage = "Group GUID is required")]
        public required string strGroupGUID { get; set; }

        [Required(ErrorMessage = "Module GUID is required")]
        public required string strModuleGUID { get; set; }
        
        [Range(1, int.MaxValue, ErrorMessage = "Version must be at least 1")]
        public int? intVersion { get; set; } = 1;
    }

    public class GroupModuleUpdateDto
    {
        [Range(1, int.MaxValue, ErrorMessage = "Version must be at least 1")]
        public int? intVersion { get; set; }
    }

    public class GroupModuleResponseDto
    {
        public required string strGroupModuleGUID { get; set; }
        public required string strGroupGUID { get; set; }
        public required string strGroupName { get; set; }
        public required string strModuleGUID { get; set; }
        public required string strModuleName { get; set; }
        public int intVersion { get; set; }
        public required string strConnectionString { get; set; }
        public required string strCreatedByGUID { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public string? strUpdatedByGUID { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
    }

    public class GroupModuleFilterDto
    {
        [Required(ErrorMessage = "Group GUID is required")]
        public required string strGroupGUID { get; set; }
        public string? strModuleGUID { get; set; }
        public int? intVersion { get; set; }
        [FromQuery(Name = "pageNumber")]
        public int Page { get; set; } = 1;
        [FromQuery(Name = "pageSize")]
        public int PageSize { get; set; } = 10;
        [FromQuery(Name = "sortBy")]
        public string SortBy { get; set; } = "dtCreatedOn";
        public bool ascending { get; set; } = true;
    }

    public class GroupModuleSimpleDto
    {
        public required string strGroupModuleGUID { get; set; }
        public required string strGroupGUID { get; set; }
        public required string strGroupName { get; set; }
        public required string strModuleGUID { get; set; }
        public required string strModuleName { get; set; }
        public int intVersion { get; set; }
    }
}
