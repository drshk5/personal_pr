namespace crm_backend.Config;

public class RateLimitingOptions
{
    public int PermitLimit { get; set; } = 100;
    public int WindowInSeconds { get; set; } = 60;
}
