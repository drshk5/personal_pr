using System.ComponentModel.DataAnnotations;

namespace crm_backend.Models.Core.CustomerData;

/// <summary>
/// Document management system with version control
/// </summary>
public class MstDocument : ITenantEntity
{
    [Key]
    public Guid strDocumentGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    
    // File information
    public string strFileName { get; set; } = string.Empty;
    public string strOriginalFileName { get; set; } = string.Empty;
    public string strFileUrl { get; set; } = string.Empty; // Storage URL
    public string? strThumbnailUrl { get; set; }
    public long intFileSize { get; set; } // In bytes
    public string strMimeType { get; set; } = string.Empty;
    public string? strFileExtension { get; set; }
    
    // Document metadata
    public string? strTitle { get; set; }
    public string? strDescription { get; set; }
    public string strCategory { get; set; } = DocumentCategoryConstants.General;
    public string? strTags { get; set; } // JSON array: ["contract","signed"]
    
    // Related entity
    public string strEntityType { get; set; } = string.Empty; // Lead, Contact, Account, Opportunity
    public Guid strEntityGUID { get; set; }
    public string? strEntityName { get; set; } // Cached for search
    
    // Version control
    public int intVersion { get; set; } = 1;
    public Guid? strParentDocumentGUID { get; set; } // Previous version
    public bool bolIsLatestVersion { get; set; } = true;
    
    // Security
    public bool bolIsConfidential { get; set; }
    public string? strAccessLevel { get; set; } = "Team"; // Private, Team, Organization
    
    // E-Signature (for future integration)
    public bool bolRequiresSignature { get; set; }
    public string? strSignatureStatus { get; set; } // Pending, Signed, Declined
    public Guid? strSignedByUserGUID { get; set; }
    public DateTime? dtSignedOn { get; set; }
    public string? strSignatureProvider { get; set; } // DocuSign, HelloSign, etc.
    public string? strSignatureDocumentId { get; set; }
    
    // Metadata
    public Guid strUploadedByGUID { get; set; }
    public string? strUploadedByName { get; set; }
    public DateTime dtUploadedOn { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }
    
    // Usage tracking
    public int intDownloadCount { get; set; }
    public DateTime? dtLastAccessedOn { get; set; }
}

/// <summary>
/// Document category constants
/// </summary>
public static class DocumentCategoryConstants
{
    public const string General = "General";
    public const string Contract = "Contract";
    public const string Proposal = "Proposal";
    public const string Invoice = "Invoice";
    public const string Quote = "Quote";
    public const string Agreement = "Agreement";
    public const string Presentation = "Presentation";
    public const string Report = "Report";
    public const string Specification = "Specification";
    public const string Other = "Other";
}
