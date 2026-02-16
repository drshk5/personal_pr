using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

public class LogEmailDto
{
    public Guid strLeadGUID { get; set; }
    public string strDirection { get; set; } = "Outbound";
    public string? strSubject { get; set; }
    public string? strBody { get; set; }
    public string? strFromAddress { get; set; }
    public string? strToAddress { get; set; }
}

public class LogCallDto
{
    public Guid strLeadGUID { get; set; }
    public string strDirection { get; set; } = "Outbound";
    public string? strSubject { get; set; }
    public int? intDurationSeconds { get; set; }
    public string? strCallOutcome { get; set; }
    public string? strRecordingUrl { get; set; }
}

public class LogSmsDto
{
    public Guid strLeadGUID { get; set; }
    public string strDirection { get; set; } = "Outbound";
    public string? strBody { get; set; }
    public string? strFromAddress { get; set; }
    public string? strToAddress { get; set; }
}

public class LogWhatsAppDto
{
    public Guid strLeadGUID { get; set; }
    public string strDirection { get; set; } = "Outbound";
    public string? strBody { get; set; }
    public string? strFromAddress { get; set; }
    public string? strToAddress { get; set; }
    public string? strExternalMessageId { get; set; }
}

public class CommunicationListDto
{
    public Guid strCommunicationGUID { get; set; }
    public Guid strLeadGUID { get; set; }
    public string strChannelType { get; set; } = string.Empty;
    public string strDirection { get; set; } = string.Empty;
    public string? strSubject { get; set; }
    public int? intDurationSeconds { get; set; }
    public string? strCallOutcome { get; set; }
    public bool bolIsOpened { get; set; }
    public int intClickCount { get; set; }
    public DateTime dtCreatedOn { get; set; }
}

public class CommunicationDetailDto : CommunicationListDto
{
    public string? strBody { get; set; }
    public string? strFromAddress { get; set; }
    public string? strToAddress { get; set; }
    public string? strRecordingUrl { get; set; }
    public DateTime? dtOpenedOn { get; set; }
    public string? strExternalMessageId { get; set; }
    public Guid strCreatedByGUID { get; set; }
}

public class CommunicationFilterParams : PagedRequestDto
{
    public Guid? strLeadGUID { get; set; }
    public string? strChannelType { get; set; }
    public string? strDirection { get; set; }
}
