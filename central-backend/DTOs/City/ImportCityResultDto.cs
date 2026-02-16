using System.Collections.Generic;

namespace AuditSoftware.DTOs.City
{
    public class ImportCityResultDto
    {
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public List<string> ErrorMessages { get; set; } = new List<string>();
        public List<MissingLocation> MissingLocations { get; set; } = new List<MissingLocation>();
        public List<string> DuplicateCities { get; set; } = new List<string>();
    }

    public class MissingLocation
    {
        public string CountryName { get; set; }
        public string StateName { get; set; }
    }
}
