using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.TaxCategory;

public class TaxCategoryUpdateDto
{
    [Required(ErrorMessage = "Tax Type GUID is required")]
    public string strTaxTypeGUID { get; set; } = string.Empty;

    [Required(ErrorMessage = "Category code is required")]
    [MaxLength(50, ErrorMessage = "Category code cannot exceed 50 characters")]
    public string strCategoryCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Category name is required")]
    [MaxLength(100, ErrorMessage = "Category name cannot exceed 100 characters")]
    public string strCategoryName { get; set; } = string.Empty;

    [MaxLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
    public string? strDescription { get; set; }

    [Range(0, 100, ErrorMessage = "Total tax percentage must be between 0 and 100")]
    public decimal decTotalTaxPercentage { get; set; }

    public bool bolIsActive { get; set; }
}
