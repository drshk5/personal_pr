using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AuditSoftware.DTOs.RenameSchedule
{
    public class RenameScheduleResponseDto
    {
        public Guid strRenameScheduleGUID { get; set; }
        public string strRenameScheduleName { get; set; } = string.Empty;
        public Guid strScheduleGUID { get; set; }
        public string strScheduleName { get; set; } = string.Empty; // Added for display purposes
        public string strScheduleCode { get; set; } = string.Empty; // Added for display purposes
        public string? strRefNo { get; set; } // Added for sorting purposes
        public Guid? strParentScheduleGUID { get; set; } // Added for tree structure
        public bool bolIsEditable { get; set; } // Added from mstSchedule
        
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? dteCreatedOn { get; set; }
        
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? strCreatedByGUID { get; set; }
        
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? strCreatedByName { get; set; } // Added for display purposes
        
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public DateTime? dteModifiedOn { get; set; }
        
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? strModifiedByGUID { get; set; }
        
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? strModifiedByName { get; set; } // Added for display purposes
        
        [JsonPropertyName("children")]
        public List<RenameScheduleResponseDto> Children { get; set; } = new List<RenameScheduleResponseDto>(); // Added for tree structure
    }
}