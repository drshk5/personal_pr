using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.Module
{
    public class ModuleSelectionRequestDto
    {
        [Required]
        public string strModuleGUID { get; set; } = string.Empty;
    }
}
