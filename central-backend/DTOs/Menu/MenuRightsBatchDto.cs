using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Menu
{
    public class MenuRightsBatchDto
    {
        public Guid? strMasterMenuGUID { get; set; }
        public Guid? strParentMenuGUID { get; set; }
        public Guid? strModuleGUID { get; set; }
        public double dblSeqNo { get; set; }
        public string strName { get; set; } = string.Empty;
        public string strPath { get; set; } = string.Empty;
        public string strMenuPosition { get; set; } = string.Empty;
        public string strMapKey { get; set; } = string.Empty;
        public bool bolHasSubMenu { get; set; }
        public string? strIconName { get; set; }
        public bool bolIsActive { get; set; }
        public Guid? strGroupGUID { get; set; }
        public string? strCategory { get; set; }
        public Guid? strPageTemplateGUID { get; set; }
        public Guid? strMenuGUID { get; set; }
        public bool hasMenuRights { get; set; }
        public bool bolRightGiven { get; set; }
    }

    public class MenuRightsBatchRequestDto
    {
        [Required]
        public List<MenuRightsBatchDto> MenuRights { get; set; } = new List<MenuRightsBatchDto>();
    }
}
