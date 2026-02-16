using AutoMapper;
using Microsoft.EntityFrameworkCore;
using AuditSoftware.Data;
using AuditSoftware.DTOs.MasterMenu;
using AuditSoftware.DTOs.Common;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using System.Linq.Dynamic.Core;
using System.Text;
using System.IO;
using ClosedXML.Excel;
using System.Collections.Generic;
using System;
using System.Linq;

namespace AuditSoftware.Services
{
    // Creating a separate class with the implementation
    public class MasterMenuServiceExtensions
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public MasterMenuServiceExtensions(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        
        // Method to get menus by group and module
        public async Task<List<dynamic>> GetMenusByGroupAndModuleAsync(Guid groupGuid, Guid? moduleGuid)
        {
            // Check if group exists
            var groupExists = await _context.MstGroups.AnyAsync(g => g.strGroupGUID == groupGuid);
            if (!groupExists)
            {
                throw new BusinessException("Group not found");
            }

            // If moduleGuid is provided, check if it exists
            if (moduleGuid.HasValue)
            {
                var moduleExists = await _context.MstModules.AnyAsync(m => m.strModuleGUID == moduleGuid);
                if (!moduleExists)
                {
                    throw new BusinessException("Module not found");
                }
            }

            // Query to get all master menus that either match the module GUID or have null module GUID (common menus)
            var masterMenusQuery = _context.MstMasterMenus
                .Where(mm => (moduleGuid == null || mm.strModuleGUID == moduleGuid || mm.strModuleGUID == null))
                .OrderBy(mm => mm.dblSeqNo);

            var masterMenus = await masterMenusQuery.ToListAsync();

            // Get all menus for the specified group that have already been assigned
            var assignedMenus = await _context.MstMenus
                .Where(m => m.strGroupGUID == groupGuid)
                .ToListAsync();

            // Map master menus to DTOs and check if they exist in the mstMenu table
            var result = new List<dynamic>();

            foreach (var masterMenu in masterMenus)
            {
                // Find if this master menu is already assigned to the group
                var assignedMenu = assignedMenus.FirstOrDefault(m => m.strMasterMenuGUID == masterMenu.strMasterMenuGUID);

                // Create anonymous object instead of using a specific DTO
                var menuDto = new 
                {
                    strMasterMenuGUID = masterMenu.strMasterMenuGUID.ToString(),
                    strParentMenuGUID = masterMenu.strParentMenuGUID?.ToString(),
                    strModuleGUID = masterMenu.strModuleGUID?.ToString(),
                    dblSeqNo = masterMenu.dblSeqNo,
                    strName = masterMenu.strName,
                    strPath = masterMenu.strPath,
                    strMenuPosition = masterMenu.strMenuPosition,
                    strMapKey = masterMenu.strMapKey,
                    bolHasSubMenu = masterMenu.bolHasSubMenu,
                    strIconName = masterMenu.strIconName,
                    bolIsActive = masterMenu.bolIsActive,
                    bolSuperAdminAccess = masterMenu.bolSuperAdminAccess,
                    strGroupGUID = groupGuid.ToString(),
                    strMenuGUID = assignedMenu?.strMenuGUID.ToString()
                };

                result.Add(menuDto);
            }

            return result;
        }
    }
}
