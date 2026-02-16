using System;

namespace AuditSoftware.DTOs.Schedule
{
    public class ScheduleImportDto
    {
        public int Code { get; set; }
        public string UDFCode { get; set; }
        public string RefNo { get; set; }
        public string Name { get; set; }
        public string TemplateCode { get; set; }
        public string UnderCode { get; set; }
        public int ChartType { get; set; }
        public string DefaultAccountTypeCode { get; set; }
        public bool IsActive { get; set; }
        public bool Editable { get; set; }
    }
}
