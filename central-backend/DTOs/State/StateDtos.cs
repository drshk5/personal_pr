using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.State
{
    public class StateCreateDto
    {
        public string strName { get; set; }
        public string strCountryGUID { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class StateUpdateDto
    {
        public string strName { get; set; }
        public string strCountryGUID { get; set; }
        public bool bolIsActive { get; set; }
    }

    public class StateResponseDto
    {
        public string strStateGUID { get; set; }
        public string strCountryGUID { get; set; }
        public string strName { get; set; }
        public bool bolIsActive { get; set; }
        public string strCountryName { get; set; } // Including the country name for better context
    }

    public class StateFilterDto
    {
        [FromQuery(Name = "search")]
        public string? Search { get; set; }
        public string? strCountryGUIDs { get; set; } // Comma-separated string for country GUIDs
        public bool? bolIsActive { get; set; } // Renamed from isActive
        public string? sortBy { get; set; } = "strName";  // Default sort by name
        public bool ascending { get; set; } = true;       // Default ascending order
        public int pageNumber { get; set; } = 1;
        public int pageSize { get; set; } = 10;
    }

    public class StateSimpleDto
    {
        public string strStateGUID { get; set; }
        public string strName { get; set; }
    }
}
