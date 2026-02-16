using System;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.City
{
    public class CityCreateDto
    {
        [Required]
        public string strStateGUID { get; set; }

        [Required]
        public string strCountryGUID { get; set; }

        [Required]
        [StringLength(100)]
        public string strName { get; set; }
        
        public bool bolIsActive { get; set; } = true;
    }

    public class CityUpdateDto
    {
        [Required]
        public string strCityGUID { get; set; }

        [Required]
        public string strStateGUID { get; set; }

        [Required]
        public string strCountryGUID { get; set; }

        [Required]
        [StringLength(100)]
        public string strName { get; set; }
        
        public bool bolIsActive { get; set; } = true;
    }

    public class CityResponseDto
    {
        public string strCityGUID { get; set; }
        public string strStateGUID { get; set; }
        public string strStateName { get; set; }
        public string strCountryGUID { get; set; }
        public string strCountryName { get; set; }
        public string strName { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class CityFilterDto
    {
        [FromQuery(Name = "search")]
        public string? Search { get; set; }
        public bool? bolIsActive { get; set; }
        public string? strCountryGUID { get; set; }
        public string? strStateGUID { get; set; }
        [FromQuery(Name = "pageNumber")]
        public int PageNumber { get; set; } = 1;
        [FromQuery(Name = "pageSize")]
        public int PageSize { get; set; } = 10;
        [FromQuery(Name = "sortBy")]
        public string? SortBy { get; set; } = "strName";
        public bool ascending { get; set; } = true;
    }

    public class CitySimpleDto
    {
        public string strCityGUID { get; set; }
        public string strName { get; set; }
    }
}
