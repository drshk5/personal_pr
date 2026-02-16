namespace crm_backend.DTOs.Common;

public class BulkOperationDto
{
    public List<Guid> Guids { get; set; } = new();
}
