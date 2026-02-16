using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstLeadCommunication : ITenantEntity
{
    public Guid strCommunicationGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strLeadGUID { get; set; }
    public string strChannelType { get; set; } = string.Empty; // Email, Call, WhatsApp, SMS
    public string strDirection { get; set; } = string.Empty; // Inbound, Outbound
    public string? strSubject { get; set; }
    public string? strBody { get; set; }
    public string? strFromAddress { get; set; }
    public string? strToAddress { get; set; }
    public int? intDurationSeconds { get; set; } // For calls
    public string? strCallOutcome { get; set; } // Answered, NoAnswer, Voicemail, Busy
    public string? strRecordingUrl { get; set; }
    public bool bolIsOpened { get; set; } // Email open tracking
    public DateTime? dtOpenedOn { get; set; }
    public int intClickCount { get; set; } // Link click count
    public Guid? strTrackingPixelGUID { get; set; } // For email open tracking
    public string? strExternalMessageId { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstLead? Lead { get; set; }
}
