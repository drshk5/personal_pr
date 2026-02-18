using System.ComponentModel.DataAnnotations;

namespace crm_backend.Models.Core.CustomerData;

/// <summary>
/// Saved views/filters for quick access to commonly used filter combinations
/// </summary>
public class MstSavedView : ITenantEntity
{
    [Key]
    public Guid strSavedViewGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    
    // View details
    public string strViewName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public string strEntityType { get; set; } = string.Empty; // Lead, Contact, Account, Opportunity, Activity
    
    // Filter configuration (stored as JSON)
    public string strFilterJson { get; set; } = "{}";
    
    // Sort configuration
    public string? strSortField { get; set; }
    public string? strSortDirection { get; set; } // Asc, Desc
    
    // Display configuration
    public string? strVisibleColumns { get; set; } // JSON array of column names
    
    // Sharing
    public bool bolIsShared { get; set; } // Shared with team or private
    public bool bolIsDefault { get; set; } // Default view for this entity type
    
    // Icon and color (for UI)
    public string? strIconName { get; set; }
    public string? strColorHex { get; set; }
    
    // Metadata
    public Guid strCreatedByGUID { get; set; }
    public string? strCreatedByName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsDeleted { get; set; }
    
    // Usage tracking
    public int intUsageCount { get; set; }
    public DateTime? dtLastUsedOn { get; set; }
}
