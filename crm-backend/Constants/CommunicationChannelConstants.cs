namespace crm_backend.Constants;

public static class CommunicationChannelConstants
{
    public const string Email = "Email";
    public const string Call = "Call";
    public const string WhatsApp = "WhatsApp";
    public const string SMS = "SMS";

    public static readonly string[] AllChannels = { Email, Call, WhatsApp, SMS };
}
