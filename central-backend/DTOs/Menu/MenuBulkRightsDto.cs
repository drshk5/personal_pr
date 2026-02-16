using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AuditSoftware.DTOs.Menu
{
    /// <summary>
    /// DTO for bulk menu rights update
    /// </summary>
    public class MenuBulkRightsDto
    {
        /// <summary>
        /// List of menu items to be processed
        /// </summary>
        [Required]
        [JsonPropertyName("items")]
        public List<MenuItemDto> Items { get; set; } = new List<MenuItemDto>();
        
        // Module GUID and Group GUID are now handled as query parameters
    }

    /// <summary>
    /// DTO for individual menu item in bulk update
    /// </summary>
    public class MenuItemDto
    {
        /// <summary>
        /// Master Menu GUID
        /// </summary>
        [JsonPropertyName("strMasterMenuGUID")]
        public Guid strMasterMenuGUID { get; set; }
        
        /// <summary>
        /// Parent Menu GUID (nullable)
        /// </summary>
        [JsonPropertyName("strParentMenuGUID")]
        public Guid? strParentMenuGUID { get; set; }
        
        /// <summary>
        /// Module GUID (nullable)
        /// </summary>
        [JsonPropertyName("strModuleGUID")]
        public Guid? strModuleGUID { get; set; }
        
        /// <summary>
        /// Sequence number
        /// </summary>
        [JsonPropertyName("dblSeqNo")]
        public double dblSeqNo { get; set; }
        
        /// <summary>
        /// Menu name
        /// </summary>
        [JsonPropertyName("strName")]
        public string strName { get; set; } = string.Empty;
        
        /// <summary>
        /// Menu path
        /// </summary>
        [JsonPropertyName("strPath")]
        public string strPath { get; set; } = string.Empty;
        
        /// <summary>
        /// Menu position (sidebar, userbar, hidden, etc.)
        /// </summary>
        [JsonPropertyName("strMenuPosition")]
        public string strMenuPosition { get; set; } = string.Empty;
        
        /// <summary>
        /// Map key for identification
        /// </summary>
        [JsonPropertyName("strMapKey")]
        public string strMapKey { get; set; } = string.Empty;
        
        /// <summary>
        /// Whether the menu has sub-menus
        /// </summary>
        [JsonPropertyName("bolHasSubMenu")]
        public bool bolHasSubMenu { get; set; }
        
        /// <summary>
        /// Icon name
        /// </summary>
        [JsonPropertyName("strIconName")]
        public string? strIconName { get; set; }
        
        /// <summary>
        /// Whether the menu is active
        /// </summary>
        [JsonPropertyName("bolIsActive")]
        public bool bolIsActive { get; set; }
        
        /// <summary>
        /// Group GUID
        /// </summary>
        [JsonPropertyName("strGroupGUID")]
        public Guid strGroupGUID { get; set; }
        
        /// <summary>
        /// Menu GUID (nullable, if already assigned)
        /// </summary>
        [JsonPropertyName("strMenuGUID")]
        public Guid? strMenuGUID { get; set; }
        
        /// <summary>
        /// Whether the menu has rights
        /// </summary>
        [JsonPropertyName("hasMenuRights")]
        public bool hasMenuRights { get; set; }
        
        /// <summary>
        /// Whether rights are given to this menu
        /// </summary>
        [JsonPropertyName("bolRightGiven")]
        public bool bolRightGiven { get; set; }
        
        /// <summary>
        /// Page Template GUID
        /// </summary>
        [JsonPropertyName("strPageTemplateGUID")]
        public Guid? strPageTemplateGUID { get; set; }
        
        /// <summary>
        /// Category
        /// </summary>
        [JsonPropertyName("strCategory")]
        public string? strCategory { get; set; }
        
        /// <summary>
        /// Child menu items
        /// </summary>
        [JsonPropertyName("children")]
        public List<MenuItemDto> Children { get; set; } = new List<MenuItemDto>();
    }
}
