namespace crm_backend.DTOs.CustomerData;

public class BulkCustomEmailRequestDto
{
    public List<string> Recipients { get; set; } = new();
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = true;
}

