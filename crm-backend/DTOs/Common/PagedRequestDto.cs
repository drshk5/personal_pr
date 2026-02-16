namespace crm_backend.DTOs.Common;

public class PagedRequestDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public bool Ascending { get; set; } = true;
    public bool? bolIsActive { get; set; }
}
