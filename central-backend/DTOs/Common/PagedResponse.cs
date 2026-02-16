using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AuditSoftware.DTOs.Common;

public class PagedResponse<T>
{
    [JsonPropertyName("items")]
    public required IEnumerable<T> Items { get; set; }
    private int _totalCount;
    public int TotalCount 
    { 
        get => _totalCount;
        set
        {
            _totalCount = value;
            CalculateTotalPages();
        }
    }
    public int PageNumber { get; set; }
    private int _pageSize;
    public int PageSize 
    { 
        get => _pageSize;
        set
        {
            _pageSize = value;
            CalculateTotalPages();
        }
    }
    private int _totalPages;
    public int TotalPages
    {
        get => _totalPages;
        set => _totalPages = value;
    }
    private void CalculateTotalPages()
    {
        _totalPages = _pageSize > 0 ? (int)Math.Ceiling(_totalCount / (double)_pageSize) : 0;
    }
    public bool HasPrevious => PageNumber > 1;
    public bool HasNext => PageNumber < TotalPages;
} 