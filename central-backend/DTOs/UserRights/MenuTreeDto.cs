using System.Collections.Generic;

namespace AuditSoftware.DTOs.UserRights
{
    public class MenuTreeDto
    {
        public Guid? strMenuGUID { get; set; }
        public string? strName { get; set; }
        public string? strMenuCode { get; set; }
        public string? strDescription { get; set; }
        public string? strNavigationUrl { get; set; }
        public string? strMenuIcon { get; set; }
        public bool bolHasChildren { get; set; }
        public bool bolIsActive { get; set; }
        public bool bolHasCreateRights { get; set; }
        public bool bolHasEditRights { get; set; }
        public bool bolHasDeleteRights { get; set; }
        public bool bolHasViewRights { get; set; }
        public Guid? strParentMenuGUID { get; set; }
        public List<MenuTreeDto> Children { get; set; } = new List<MenuTreeDto>();
    }
}
