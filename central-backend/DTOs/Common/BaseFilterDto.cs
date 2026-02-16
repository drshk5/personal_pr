using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.Common
{
    public class BaseFilterDto
    {
        /// <summary>
        /// Page number (1-based)
        /// </summary>
        [FromQuery(Name = "pageNumber")]
        [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0")]
        public int PageNumber { get; set; } = 1;

        /// <summary>
        /// Number of items per page
        /// </summary>
        [FromQuery(Name = "pageSize")]
        [Range(1, 100, ErrorMessage = "Page size must be between 1 and 100")]
        public int PageSize { get; set; } = 10;

        /// <summary>
        /// Field to sort by
        /// </summary>
        [FromQuery(Name = "sortBy")]
        public string? SortBy { get; set; }

        /// <summary>
        /// Sort direction (true for ascending, false for descending)
        /// </summary>
        [FromQuery(Name = "ascending")]
        public bool ascending { get; set; } = true;

        /// <summary>
        /// Search term for filtering
        /// </summary>
        [FromQuery(Name = "search")]
        public string? Search { get; set; }
    }
} 