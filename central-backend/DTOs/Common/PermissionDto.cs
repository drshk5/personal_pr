using System.Text.Json.Serialization;

namespace AuditSoftware.DTOs.Common
{
    public class PermissionDto
    {
        [JsonPropertyName("bolCanView")]
        public bool bolCanView { get; set; }
        
        [JsonPropertyName("bolCanEdit")]
        public bool bolCanEdit { get; set; }
        
        [JsonPropertyName("bolCanDelete")]
        public bool bolCanDelete { get; set; }
        
        [JsonPropertyName("bolCanSave")]
        public bool bolCanSave { get; set; }
        
        [JsonPropertyName("bolCanPrint")]
        public bool bolCanPrint { get; set; }
        
        [JsonPropertyName("bolCanExport")]
        public bool bolCanExport { get; set; }
        
        [JsonPropertyName("bolCanImport")]
        public bool bolCanImport { get; set; }
        
        [JsonPropertyName("bolCanApprove")]
        public bool bolCanApprove { get; set; }
        
        // New fields from page template
        [JsonPropertyName("bolIsView")]
        public bool bolIsView { get; set; }
        
        [JsonPropertyName("bolIsEdit")]
        public bool bolIsEdit { get; set; }
        
        [JsonPropertyName("bolIsDelete")]
        public bool bolIsDelete { get; set; }
        
        [JsonPropertyName("bolIsSave")]
        public bool bolIsSave { get; set; }
        
        [JsonPropertyName("bolIsPrint")]
        public bool bolIsPrint { get; set; }
        
        [JsonPropertyName("bolIsExport")]
        public bool bolIsExport { get; set; }
        
        [JsonPropertyName("bolIsImport")]
        public bool bolIsImport { get; set; }
        
        [JsonPropertyName("bolIsApprove")]
        public bool bolIsApprove { get; set; }
    }
}
