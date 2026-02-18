using System.ComponentModel.DataAnnotations;

namespace crm_backend.Models.Core.CustomerData;

/// <summary>
/// Internal notes with @mention support for collaboration
/// </summary>
public class MstNote : ITenantEntity
{
    [Key]
    public Guid strNoteGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    
    // Related entity
    public string strEntityType { get; set; } = string.Empty; // Lead, Contact, Account, Opportunity
    public Guid strEntityGUID { get; set; }
    
    // Content
    public string strContent { get; set; } = string.Empty;
    public bool bolIsPrivate { get; set; } // Private notes only visible to creator
    public bool bolIsPinned { get; set; } // Pinned notes appear at top
    
    // Mentions (stored as JSON array of user GUIDs)
    public string? strMentionedUserGUIDs { get; set; } // JSON array: ["guid1","guid2"]
    
    // Metadata
    public Guid strCreatedByGUID { get; set; }
    public string? strCreatedByName { get; set; } // Cached for performance
    public DateTime dtCreatedOn { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }
}
