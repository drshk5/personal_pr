using System;
using AuditSoftware.Helpers;

namespace AuditSoftware.DTOs.Folder
{
public class FolderResponseDto
{
    public Guid strFolderGUID { get; set; }
    public string strFolderName { get; set; } = string.Empty;
    public Guid strOrganizationGUID { get; set; }
    public Guid strYearGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strModuleGUID { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public Guid? strUpdatedByGUID { get; set; }        // Additional properties
        public string? strOrganizationName { get; set; }
        public string? strYearName { get; set; }
        public string? strCreatedBy { get; set; }
        public string? strUpdatedBy { get; set; }
        public string strFolderPath { get; set; } = string.Empty;
        
        // Document count in this folder
        public int intDocumentCount { get; set; }
        
        // Formatted date properties for display with timezone conversion
        public void ConvertToTimeZone(string timeZoneId)
        {
            dtCreatedOn = DateTimeHelper.ConvertToTimeZone(dtCreatedOn, timeZoneId);
            if (dtUpdatedOn.HasValue)
            {
                dtUpdatedOn = DateTimeHelper.ConvertToTimeZone(dtUpdatedOn.Value, timeZoneId);
            }
        }

        public string strFormattedCreatedOn => dtCreatedOn.ToString("dd-MMM-yyyy hh:mm:ss tt");
        public string? strFormattedUpdatedOn => dtUpdatedOn?.ToString("dd-MMM-yyyy hh:mm:ss tt");
    }
}