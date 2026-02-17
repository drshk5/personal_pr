using System.Text.Json.Serialization;

namespace crm_backend.Models.Wrappers;

public class PagedResponse<T>
{
    [JsonPropertyName("items")]
    public required IEnumerable<T> Items { get; set; }

    [JsonPropertyName("totalCount")]
    public int TotalCount { get; set; }

    [JsonPropertyName("pageNumber")]
    public int PageNumber { get; set; }

    [JsonPropertyName("pageSize")]
    public int PageSize { get; set; }

    [JsonPropertyName("totalPages")]
    public int TotalPages { get; set; }

    [JsonPropertyName("hasPrevious")]
    public bool HasPrevious => PageNumber > 1;

    [JsonPropertyName("hasNext")]
    public bool HasNext => PageNumber < TotalPages;
}
