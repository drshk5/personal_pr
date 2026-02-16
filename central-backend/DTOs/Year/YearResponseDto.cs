using System;
using AuditSoftware.Helpers;

namespace AuditSoftware.DTOs.Year
{
    public class YearResponseDto
    {
        public Guid strYearGUID { get; set; }
        public Guid strOrganizationGUID { get; set; }
        public string strName { get; set; } = string.Empty;
        public DateTime dtStartDate { get; set; }
        public DateTime dtEndDate { get; set; }
        public bool bolIsActive { get; set; }
        public Guid? strPreviousYearGUID { get; set; }
        public Guid? strNextYearGUID { get; set; }
        public Guid strGroupGUID { get; set; }
        public Guid strCreatedByGUID { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
        public Guid? strUpdatedByGUID { get; set; }
        public bool bolSystemCreated { get; set; }
        
        // Additional properties
        public string? strOrganizationName { get; set; }
        public string? strPreviousYearName { get; set; }
        public string? strNextYearName { get; set; }
        public string? strCreatedBy { get; set; }
        public string? strUpdatedBy { get; set; }
        
        // Formatted date properties for display with timezone conversion
        public void ConvertToTimeZone(string timeZoneId)
        {
            dtStartDate = DateTimeHelper.ConvertToTimeZone(dtStartDate, timeZoneId);
            dtEndDate = DateTimeHelper.ConvertToTimeZone(dtEndDate, timeZoneId);
            dtCreatedOn = DateTimeHelper.ConvertToTimeZone(dtCreatedOn, timeZoneId);
            if (dtUpdatedOn.HasValue)
            {
                dtUpdatedOn = DateTimeHelper.ConvertToTimeZone(dtUpdatedOn.Value, timeZoneId);
            }
        }

        public string strFormattedStartDate => dtStartDate.ToString("dd-MMM-yyyy");
        public string strFormattedEndDate => dtEndDate.ToString("dd-MMM-yyyy");
        public string strFormattedCreatedOn => dtCreatedOn.ToString("dd-MMM-yyyy hh:mm:ss tt");
        public string? strFormattedUpdatedOn => dtUpdatedOn?.ToString("dd-MMM-yyyy hh:mm:ss tt");
    }
} 