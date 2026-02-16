using AuditSoftware.Data;
using AuditSoftware.DTOs.Common;
using AuditSoftware.DTOs.Organization;
using AuditSoftware.DTOs.Year;
using AuditSoftware.Exceptions;
using AuditSoftware.Interfaces;
using AuditSoftware.Models.Entities;
using AuditSoftware.Models.Core;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ClosedXML.Excel;
using System.IO;
using System.Text;
using AuditSoftware.Helpers;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using System.Text.Json;

namespace AuditSoftware.Services
{
    public class OrganizationService :  ServiceBase, IOrganizationService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;
        private readonly IYearService _yearService;
        private readonly IGroupModuleService _groupModuleService;
        private readonly ILogger<OrganizationService> _logger;
        private readonly IFileStorageService _fileStorageService;
        private readonly IActivityLogService _activityLogService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OrganizationService(
            AppDbContext context, 
            IMapper mapper, 
            IYearService yearService,
            IGroupModuleService groupModuleService,
            ILogger<OrganizationService> logger,
            IFileStorageService fileStorageService,
            IActivityLogService activityLogService,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _yearService = yearService;
            _groupModuleService = groupModuleService;
            _logger = logger;
            _fileStorageService = fileStorageService;
            _activityLogService = activityLogService;
            _httpContextAccessor = httpContextAccessor;
        }
        
        /// <summary>
        /// Helper method to format datetime in the organization's timezone
        /// </summary>
        private DateTime? FormatDateTimeForDisplay(DateTime? dateTime, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            if (!dateTime.HasValue)
                return null;
                
            // Convert UTC to the organization's timezone if the datetime is in UTC
            if (dateTime.Value.Kind == DateTimeKind.Utc)
            {
                return dateTime.Value.ToTimeZone(timeZoneId);
            }
            
            return dateTime;
        }

        public async Task<PagedResponse<OrganizationResponseDto>> GetAllOrganizationsAsync(
            OrganizationFilterDto filterDto, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            IQueryable<MstOrganization> query = _context.MstOrganizations;
            
            // Always apply group GUID filter
            if (filterDto.GroupGUID.HasValue && filterDto.GroupGUID != Guid.Empty)
            {
                query = query.Where(o => o.strGroupGUID == filterDto.GroupGUID);
            }

            // Apply search filtering
            if (!string.IsNullOrEmpty(filterDto.Search))
            {
                var searchTerm = filterDto.Search.ToLower().Trim();
                
                // Check if searching for status keywords
                bool isActiveSearch = "active".StartsWith(searchTerm) || searchTerm == "act";
                bool isInactiveSearch = "inactive".StartsWith(searchTerm) || searchTerm == "inact";
                
                if (isActiveSearch)
                {
                    // Show active organizations
                    query = query.Where(o => o.bolIsActive == true);
                }
                else if (isInactiveSearch)
                {
                    // Show inactive organizations
                    query = query.Where(o => o.bolIsActive == false);
                }
                else
                {
                    // Parent organization search - look up the parent org name in a subquery
                    var parentOrganizationMatches = _context.MstOrganizations
                        .Where(p => p.strOrganizationName.ToLower().Contains(searchTerm))
                        .Select(p => p.strOrganizationGUID)
                        .ToList();

                    // Industry search - look up the industry name in a subquery
                    var industryMatches = _context.MstIndustries
                        .Where(i => i.strName.ToLower().Contains(searchTerm))
                        .Select(i => i.strIndustryGUID.ToString())
                        .ToList();

                    // Legal status search - look up the legal status name in a subquery
                    var legalStatusMatches = _context.MstLegalStatusTypes
                        .Where(l => l.strName.ToLower().Contains(searchTerm))
                        .Select(l => l.strLegalStatusTypeGUID.ToString())
                        .ToList();

                    // Created by and updated by search - look up user names
                    var userMatches = _context.MstUsers
                        .Where(u => u.strName.ToLower().Contains(searchTerm))
                        .Select(u => u.strUserGUID)
                        .ToList();

                    // Check if the search term is a date
                    bool isDate = DateTime.TryParse(searchTerm, out DateTime searchDate);
                    
                    if (isDate)
                    {
                        // Check if the search term contains time information
                        bool hasTimeComponent = searchTerm.Contains(":") || searchTerm.ToLower().Contains("am") || searchTerm.ToLower().Contains("pm");
                        
                        if (hasTimeComponent)
                        {
                            // Search for exact date-time match (within 1 minute tolerance)
                            var searchDateTime = searchDate;
                            var startTime = searchDateTime.AddMinutes(-1);
                            var endTime = searchDateTime.AddMinutes(1);
                            
                            query = query.Where(o => 
                                (o.dtCreatedOn >= startTime && o.dtCreatedOn <= endTime) ||
                                (o.dtUpdatedOn.HasValue && o.dtUpdatedOn.Value >= startTime && o.dtUpdatedOn.Value <= endTime) ||
                                (o.dtClientAcquiredDate.HasValue && o.dtClientAcquiredDate.Value >= startTime && o.dtClientAcquiredDate.Value <= endTime)
                            );
                        }
                        else
                        {
                            // Search for matching dates only (entire day)
                            var startOfDay = searchDate.Date;
                            var endOfDay = startOfDay.AddDays(1).AddTicks(-1);
                            
                            query = query.Where(o => 
                                (o.dtCreatedOn >= startOfDay && o.dtCreatedOn <= endOfDay) ||
                                (o.dtUpdatedOn.HasValue && o.dtUpdatedOn.Value >= startOfDay && o.dtUpdatedOn.Value <= endOfDay) ||
                                (o.dtClientAcquiredDate.HasValue && o.dtClientAcquiredDate.Value >= startOfDay && o.dtClientAcquiredDate.Value <= endOfDay)
                            );
                        }
                    }
                    else
                    {
                        // Regular search across all fields including new fields
                        query = query.Where(o => 
                            o.strOrganizationName.ToLower().Contains(searchTerm) ||
                            (o.strDescription != null && o.strDescription.ToLower().Contains(searchTerm)) ||
                            (o.strPAN != null && o.strPAN.ToLower().Contains(searchTerm)) ||
                            (o.strTAN != null && o.strTAN.ToLower().Contains(searchTerm)) ||
                            (o.strCIN != null && o.strCIN.ToLower().Contains(searchTerm)) ||
                            (o.strUDFCode != null && o.strUDFCode.ToLower().Contains(searchTerm)) ||
                            o.strOrganizationGUID.ToString().ToLower().Contains(searchTerm) ||
                            // Parent Organization search
                            (o.strParentOrganizationGUID.HasValue && parentOrganizationMatches.Contains(o.strParentOrganizationGUID.Value)) ||
                            // Industry search
                            (o.strIndustryGUID.HasValue && industryMatches.Contains(o.strIndustryGUID.Value.ToString())) ||
                            // Legal Status search
                            (o.strLegalStatusTypeGUID.HasValue && legalStatusMatches.Contains(o.strLegalStatusTypeGUID.Value.ToString())) ||
                            // Created By search
                            userMatches.Contains(o.strCreatedByGUID) ||
                            // Updated By search
                            (o.strUpdatedByGUID.HasValue && userMatches.Contains(o.strUpdatedByGUID.Value))
                        );
                    }
                }
            }

            // Apply active status filter if provided
            if (filterDto.bolIsActive.HasValue)
            {
                query = query.Where(o => o.bolIsActive == filterDto.bolIsActive.Value);
            }
            
            // Apply createdBy filter if provided
            if (filterDto.CreatedByGUIDs != null && filterDto.CreatedByGUIDs.Any())
            {
                var createdByGuids = filterDto.CreatedByGUIDs
                    .Where(x => x != Guid.Empty)
                    .ToList();

                if (createdByGuids.Any())
                {
                    query = query.Where(o => createdByGuids.Contains(o.strCreatedByGUID));
                }
            }
            
            // Apply updatedBy filter if provided
            if (filterDto.UpdatedByGUIDs != null && filterDto.UpdatedByGUIDs.Any())
            {
                var updatedByGuids = filterDto.UpdatedByGUIDs
                    .Where(x => x != Guid.Empty)
                    .ToList();

                if (updatedByGuids.Any())
                {
                    query = query.Where(o => o.strUpdatedByGUID.HasValue && updatedByGuids.Contains(o.strUpdatedByGUID.Value));
                }
            }
            
            // Apply dynamic filters
            
            // Filter by Industry if provided
            if (filterDto.IndustryGUID.HasValue && filterDto.IndustryGUID != Guid.Empty)
            {
                var industryGuids = new List<Guid> { filterDto.IndustryGUID.Value };
                
                if (industryGuids.Count > 0)
                {
                    query = query.Where(o => o.strIndustryGUID.HasValue && industryGuids.Contains(o.strIndustryGUID.Value));
                }
            }
            
            // Filter by Legal Status Type if provided
            if (filterDto.LegalStatusTypeGUID.HasValue && filterDto.LegalStatusTypeGUID != Guid.Empty)
            {
                query = query.Where(o => o.strLegalStatusTypeGUID == filterDto.LegalStatusTypeGUID);
            }
            
            // Filter by Parent Organization GUID if provided
            if (filterDto.ParentOrganizationGUID.HasValue && filterDto.ParentOrganizationGUID != Guid.Empty)
            {
                query = query.Where(o => o.strParentOrganizationGUID == filterDto.ParentOrganizationGUID);
            }

            // Calculate total records
            var totalRecords = await query.CountAsync();

            // Apply sorting
            query = ApplySorting(query, filterDto.SortBy, filterDto.ascending);

            // Apply pagination
            var organizations = await query
                .Skip((filterDto.PageNumber - 1) * filterDto.PageSize)
                .Take(filterDto.PageSize)
                .ToListAsync();

            // Use the new mapping method with master data enrichment
            var organizationDtos = await MapToDtoListWithMasterDataAsync(organizations, timeZoneId);

            return new PagedResponse<OrganizationResponseDto>
            {
                Items = organizationDtos,
                PageNumber = filterDto.PageNumber,
                PageSize = filterDto.PageSize,
                TotalCount = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)filterDto.PageSize)
            };
        }

        private async Task EnhanceOrganizationDtosAsync(List<OrganizationResponseDto> organizationDtos)
        {
            if (organizationDtos == null || !organizationDtos.Any())
                return;

            // Get all unique GUIDs for lookup
            var parentOrgGuids = organizationDtos
                .Where(o => o.strParentOrganizationGUID.HasValue && o.strParentOrganizationGUID != Guid.Empty)
                .Select(o => o.strParentOrganizationGUID!.Value)
                .Distinct()
                .ToList();

            var industryGuids = organizationDtos
                .Where(o => o.strIndustryGUID.HasValue && o.strIndustryGUID != Guid.Empty)
                .Select(o => o.strIndustryGUID!.Value)
                .Distinct()
                .ToList();

            var udfCodeGuids = organizationDtos
                .Where(o => !string.IsNullOrEmpty(o.strUDFCode))
                .Select(o => o.strUDFCode)
                .Distinct()
                .ToList();

            var legalStatusTypeGuids = organizationDtos
                .Where(o => o.strLegalStatusTypeGUID.HasValue && o.strLegalStatusTypeGUID != Guid.Empty)
                .Select(o => o.strLegalStatusTypeGUID!.Value)
                .Distinct()
                .ToList();

            var createdByGuids = organizationDtos
                .Where(o => o.strCreatedByGUID != Guid.Empty)
                .Select(o => o.strCreatedByGUID)
                .Distinct()
                .ToList();

            var updatedByGuids = organizationDtos
                .Where(o => o.strUpdatedByGUID.HasValue && o.strUpdatedByGUID != Guid.Empty)
                .Select(o => o.strUpdatedByGUID!.Value)
                .Distinct()
                .ToList();
            
            var countryGuids = organizationDtos
                .Where(o => o.strCountryGUID.HasValue && o.strCountryGUID != Guid.Empty)
                .Select(o => o.strCountryGUID!.Value)
                .Distinct()
                .ToList();
            
            var organizationGuids = organizationDtos
                .Select(o => o.strOrganizationGUID)
                .ToList();

            // Get parent organization names
            var parentOrganizations = await _context.MstOrganizations
                .Where(o => parentOrgGuids.Contains(o.strOrganizationGUID))
                .Select(o => new { o.strOrganizationGUID, o.strOrganizationName })
                .ToListAsync();

            // Get industry names from mstIndustryType table
            var industries = new List<object>();
            if (industryGuids.Any())
            {
                // Already have valid Guids, no need to parse
                industries = await _context.MstIndustries // MstIndustry class maps to mstIndustryType table
                    .Where(i => industryGuids.Contains(i.strIndustryGUID))
                    .Select(i => new { strIndustryGUID = i.strIndustryGUID, strName = i.strName })
                    .ToListAsync<object>();
            }
            
            // Get legal status type names from mstLegalStatusType table
            var legalStatusTypes = new List<object>();
            if (legalStatusTypeGuids.Any())
            {
                // Already have valid Guids, no need to parse
                legalStatusTypes = await _context.MstLegalStatusTypes // MstLegalStatusType class maps to mstLegalStatusType table
                    .Where(l => legalStatusTypeGuids.Contains(l.strLegalStatusTypeGUID))
                    .Select(l => new { strLegalStatusTypeGUID = l.strLegalStatusTypeGUID, strName = l.strName })
                    .ToListAsync<object>();
            }
            
            // Get country names
            var countries = new List<object>();
            if (countryGuids.Any())
            {
                countries = await _context.MstCountry
                    .Where(c => countryGuids.Contains(c.strCountryGUID))
                    .Select(c => new { strCountryGUID = c.strCountryGUID, strName = c.strName })
                    .ToListAsync<object>();
            }
            
            // Get tax configurations for organizations
            var taxConfigs = await _context.MstOrgTaxConfigs
                .Where(tc => organizationGuids.Contains(tc.strOrganizationGUID) && tc.bolIsActive)
                .Include(tc => tc.TaxType)
                .Include(tc => tc.State)
                .ToListAsync();
            
            // Get all relevant pick list values - for UDF codes only now
            var allPickListGuids = udfCodeGuids.Where(x => x != null).Cast<string>().ToList();

            // Get UDF picklist values if needed
            var pickListValues = new List<object>();
            if (allPickListGuids.Any())
            {
                // First convert all GUIDs to strings and make a lookup set
                var guidStrings = allPickListGuids
                    .Where(g => !string.IsNullOrEmpty(g))
                    .Select(g => g.ToLowerInvariant()) // Pre-convert to lowercase for later case-insensitive comparison
                    .ToHashSet(); // Use HashSet for faster lookups
                
                // Fetch all picklist values
                var allPickListValues = await _context.MstPickListValues
                    .Select(p => new { strPickListValueGUID = p.strPickListValueGUID.ToString(), p.strValue })
                    .ToListAsync();
                
                // Filter in memory where we can use string.Equals with StringComparison
                pickListValues = allPickListValues
                    .Where(plv => guidStrings.Contains(plv.strPickListValueGUID.ToLowerInvariant()))
                    .Cast<object>()
                    .ToList();
            }

            // Get user names for created by and updated by
            var allUserGuids = new List<Guid>();
            allUserGuids.AddRange(createdByGuids);
            allUserGuids.AddRange(updatedByGuids);

            var users = await _context.MstUsers
                // UPDATED: Changed from u.strGUID to u.strUserGUID to follow naming convention
                .Where(u => allUserGuids.Contains(u.strUserGUID))
                .Select(u => new { u.strUserGUID, u.strName })
                .ToListAsync();

            // Populate additional fields in DTOs
            foreach (var dto in organizationDtos)
            {
                // Parent organization name
                if (dto.strParentOrganizationGUID.HasValue && dto.strParentOrganizationGUID != Guid.Empty)
                {
                    dto.strParentOrganizationName = parentOrganizations
                        .FirstOrDefault(o => o.strOrganizationGUID == dto.strParentOrganizationGUID)
                        ?.strOrganizationName;
                }

                // Industry name
                if (dto.strIndustryGUID.HasValue && dto.strIndustryGUID != Guid.Empty)
                {
                    var industryGuid = dto.strIndustryGUID.Value;
                    var industry = industries
                        .Cast<dynamic>()
                        .FirstOrDefault(i => i.strIndustryGUID == industryGuid);
                        
                    if (industry != null)
                    {
                        dto.strIndustryCodeName = industry.strName;
                    }
                }

                // UDF code - still uses picklist values
                if (!string.IsNullOrEmpty(dto.strUDFCode))
                {
                    var udfValue = pickListValues
                        .Cast<dynamic>()
                        .FirstOrDefault(p => string.Equals(p.strPickListValueGUID.ToString(), dto.strUDFCode.ToString(), StringComparison.OrdinalIgnoreCase));
                        
                    if (udfValue != null)
                    {
                        // If you need to store UDF name somewhere
                        // dto.strUDFName = udfValue.strValue;
                    }
                }

                // Legal status name
                if (dto.strLegalStatusTypeGUID.HasValue && dto.strLegalStatusTypeGUID != Guid.Empty)
                {
                    var legalStatusGuid = dto.strLegalStatusTypeGUID.Value;
                    var legalStatus = legalStatusTypes
                        .Cast<dynamic>()
                        .FirstOrDefault(l => l.strLegalStatusTypeGUID == legalStatusGuid);
                        
                    if (legalStatus != null)
                    {
                        dto.strLegalStatusCodeName = legalStatus.strName;
                    }
                }

                // Created by user name
                if (dto.strCreatedByGUID != Guid.Empty)
                {
                    dto.strCreatedBy = users
                        .FirstOrDefault(u => u.strUserGUID == dto.strCreatedByGUID)
                        ?.strName;
                }

                // Updated by user name
                if (dto.strUpdatedByGUID.HasValue && dto.strUpdatedByGUID != Guid.Empty)
                {
                    dto.strUpdatedBy = users
                        .FirstOrDefault(u => u.strUserGUID == dto.strUpdatedByGUID)
                        ?.strName;
                }
                
                // Country name
                if (dto.strCountryGUID.HasValue && dto.strCountryGUID != Guid.Empty)
                {
                    var countryGuid = dto.strCountryGUID.Value;
                    var country = countries
                        .Cast<dynamic>()
                        .FirstOrDefault(c => c.strCountryGUID == countryGuid);
                        
                    if (country != null)
                    {
                        dto.strCountryName = country.strName;
                    }
                }
                
                // Tax configuration data
                var taxConfig = taxConfigs.FirstOrDefault(tc => tc.strOrganizationGUID == dto.strOrganizationGUID);
                if (taxConfig != null)
                {
                    dto.strTaxTypeGUID = taxConfig.strTaxTypeGUID;
                    dto.strTaxTypeName = taxConfig.TaxType?.strTaxTypeName;
                    dto.strTaxTypeCode = taxConfig.TaxType?.strTaxTypeCode;
                    dto.strTaxRegNo = taxConfig.strTaxRegNo;
                    dto.strStateGUID = taxConfig.strStateGUID;
                    dto.strStateName = taxConfig.State?.strName;
                    dto.dtRegistrationDate = taxConfig.dtRegistrationDate;
                    dto.bolIsDefaultTaxConfig = taxConfig.bolIsDefault;
                    dto.jsonTaxSettings = taxConfig.jsonSettings;
                }
            }
        }

        private IQueryable<MstOrganization> ApplySorting(IQueryable<MstOrganization> query, string? sortBy, bool ascending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
            {
                // Default sorting by organization name
                return ascending 
                    ? query.OrderBy(o => o.strOrganizationName) 
                    : query.OrderByDescending(o => o.strOrganizationName);
            }

            var sortByLower = sortBy.ToLower();
            
            // Handle special fields that require joins
            if (sortByLower == "strindustrycodename")
            {
                if (ascending)
                {
                    return query.OrderBy(o => 
                        !o.strIndustryGUID.HasValue ? null : 
                        _context.MstIndustries
                            .Where(i => i.strIndustryGUID == o.strIndustryGUID)
                            .Select(i => i.strName)
                            .FirstOrDefault());
                }
                else
                {
                    return query.OrderByDescending(o => 
                        !o.strIndustryGUID.HasValue ? null : 
                        _context.MstIndustries
                            .Where(i => i.strIndustryGUID == o.strIndustryGUID)
                            .Select(i => i.strName)
                            .FirstOrDefault());
                }
            }
            
            if (sortByLower == "strlegalstatuscodename")
            {
                if (ascending)
                {
                    return query.OrderBy(o => 
                        !o.strLegalStatusTypeGUID.HasValue ? null : 
                        _context.MstLegalStatusTypes
                            .Where(l => l.strLegalStatusTypeGUID == o.strLegalStatusTypeGUID)
                            .Select(l => l.strName)
                            .FirstOrDefault());
                }
                else
                {
                    return query.OrderByDescending(o => 
                        !o.strLegalStatusTypeGUID.HasValue ? null : 
                        _context.MstLegalStatusTypes
                            .Where(l => l.strLegalStatusTypeGUID == o.strLegalStatusTypeGUID)
                            .Select(l => l.strName)
                            .FirstOrDefault());
                }
            }
            
            if (sortByLower == "strparentorganizationname")
            {
                if (ascending)
                {
                    return query.OrderBy(o => 
                        o.strParentOrganizationGUID == null ? null : 
                        _context.MstOrganizations
                            .Where(p => p.strOrganizationGUID == o.strParentOrganizationGUID)
                            .Select(p => p.strOrganizationName)
                            .FirstOrDefault());
                }
                else
                {
                    return query.OrderByDescending(o => 
                        o.strParentOrganizationGUID == null ? null : 
                        _context.MstOrganizations
                            .Where(p => p.strOrganizationGUID == o.strParentOrganizationGUID)
                            .Select(p => p.strOrganizationName)
                            .FirstOrDefault());
                }
            }
            
            if (sortByLower == "strcreatedby")
            {
                if (ascending)
                {
                    return query.OrderBy(o => 
                        _context.MstUsers
                            .Where(u => u.strUserGUID == o.strCreatedByGUID)
                            .Select(u => u.strName)
                            .FirstOrDefault());
                }
                else
                {
                    return query.OrderByDescending(o => 
                        _context.MstUsers
                            .Where(u => u.strUserGUID == o.strCreatedByGUID)
                            .Select(u => u.strName)
                            .FirstOrDefault());
                }
            }
            
            if (sortByLower == "strupdatedby")
            {
                if (ascending)
                {
                    return query.OrderBy(o => 
                        o.strUpdatedByGUID == null ? null : 
                        _context.MstUsers
                            .Where(u => u.strUserGUID == o.strUpdatedByGUID)
                            .Select(u => u.strName)
                            .FirstOrDefault());
                }
                else
                {
                    return query.OrderByDescending(o => 
                        o.strUpdatedByGUID == null ? null : 
                        _context.MstUsers
                            .Where(u => u.strUserGUID == o.strUpdatedByGUID)
                            .Select(u => u.strName)
                            .FirstOrDefault());
                }
            }
            
            // Handle formatted date fields
            if (sortByLower == "strformattedcreatedon")
            {
                return ascending
                    ? query.OrderBy(o => o.dtCreatedOn)
                    : query.OrderByDescending(o => o.dtCreatedOn);
            }
            
            if (sortByLower == "strformattedclientacquireddate" || sortByLower == "formattedclientacquireddate")
            {
                return ascending
                    ? query.OrderBy(o => o.dtClientAcquiredDate)
                    : query.OrderByDescending(o => o.dtClientAcquiredDate);
            }
            
            if (sortByLower == "strformattedupdatedon")
            {
                return ascending
                    ? query.OrderBy(o => o.dtUpdatedOn)
                    : query.OrderByDescending(o => o.dtUpdatedOn);
            }
            
            // Handle direct entity fields
            if (sortByLower == "strorganizationname")
            {
                return ascending
                    ? query.OrderBy(o => o.strOrganizationName)
                    : query.OrderByDescending(o => o.strOrganizationName);
            }
            
            if (sortByLower == "strdescription")
            {
                return ascending
                    ? query.OrderBy(o => o.strDescription)
                    : query.OrderByDescending(o => o.strDescription);
            }
            
            if (sortByLower == "strpan")
            {
                return ascending
                    ? query.OrderBy(o => o.strPAN)
                    : query.OrderByDescending(o => o.strPAN);
            }
            
            if (sortByLower == "strcin")
            {
                return ascending
                    ? query.OrderBy(o => o.strCIN)
                    : query.OrderByDescending(o => o.strCIN);
            }
            
            if (sortByLower == "strtan")
            {
                return ascending
                    ? query.OrderBy(o => o.strTAN)
                    : query.OrderByDescending(o => o.strTAN);
            }
            
            if (sortByLower == "strudfcode")
            {
                return ascending
                    ? query.OrderBy(o => o.strUDFCode)
                    : query.OrderByDescending(o => o.strUDFCode);
            }
            
            if (sortByLower == "bolisactive")
            {
                return ascending
                    ? query.OrderByDescending(o => o.bolIsActive) // Show active first for ascending
                    : query.OrderBy(o => o.bolIsActive); // Show inactive first for descending
            }
            
            if (sortByLower == "dtclientacquireddate")
            {
                return ascending
                    ? query.OrderBy(o => o.dtClientAcquiredDate)
                    : query.OrderByDescending(o => o.dtClientAcquiredDate);
            }
            
            if (sortByLower == "dtcreatedon")
            {
                return ascending
                    ? query.OrderBy(o => o.dtCreatedOn)
                    : query.OrderByDescending(o => o.dtCreatedOn);
            }
            
            if (sortByLower == "dtupdatedon")
            {
                return ascending
                    ? query.OrderBy(o => o.dtUpdatedOn)
                    : query.OrderByDescending(o => o.dtUpdatedOn);
            }
            
            // Default sorting by organization name
            return ascending
                ? query.OrderBy(o => o.strOrganizationName)
                : query.OrderByDescending(o => o.strOrganizationName);
        }

        public async Task<OrganizationResponseDto?> GetOrganizationByIdAsync(Guid guid, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            var organization = await _context.MstOrganizations
                .FirstOrDefaultAsync(o => o.strOrganizationGUID == guid);

            if (organization == null)
                return null;

            // Use the new mapping method with master data enrichment
            return await MapToDtoWithMasterDataAsync(organization, timeZoneId);
        }

        public async Task<OrganizationResponseDto> CreateOrganizationAsync(
            OrganizationCreateDto organizationDto, Guid createdByGuid, Guid groupGuid, Guid? userRoleGuid = null, Guid? yearGuid = null, Guid? moduleGuid = null)
        {
            // Check if organization name already exists within the same group (case-insensitive)
            var exists = await _context.MstOrganizations
                .AnyAsync(o => o.strOrganizationName.ToLower() == organizationDto.strOrganizationName.ToLower() && 
                               o.strGroupGUID == groupGuid);
            
            if (exists)
            {
                throw new BusinessException("Organization with this name already exists in the group");
            }

            // Check PAN uniqueness if provided (across ALL companies since it has a unique constraint in database)
            if (!string.IsNullOrEmpty(organizationDto.strPAN))
            {
                var panExists = await _context.MstOrganizations
                    .AnyAsync(o => o.strPAN != null && 
                                  o.strPAN.ToLower() == organizationDto.strPAN.ToLower());
                
                if (panExists)
                {
                    throw new BusinessException("Organization with this PAN already exists in the system. PAN must be unique across all organizations.");
                }
            }
            
            // Handle logo upload if provided
            if (organizationDto.LogoFile != null && organizationDto.LogoFile.Length > 0)
            {
                try
                {
                    var logoPath = await _fileStorageService.SaveFileAsync(organizationDto.LogoFile, "OrganizationLogos");
                    organizationDto.strLogo = logoPath;
                    _logger.LogInformation($"Logo saved successfully at path: {logoPath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error uploading logo file");
                    throw new BusinessException(
                        "Failed to upload logo file. Please try again.",
                        "LOGO_UPLOAD_FAILED"
                    );
                }
            }

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Using DateTimeProvider.Now for UTC time (our new standard)
                    var currentDateTime = DateTimeProvider.Now;
                    
                    // Create new organization entity
                    var organization = new MstOrganization
                    {
                        strOrganizationGUID = Guid.NewGuid(),
                        strOrganizationName = organizationDto.strOrganizationName,
                        strDescription = organizationDto.strDescription,
                        strPAN = !string.IsNullOrWhiteSpace(organizationDto.strPAN) ? organizationDto.strPAN : null,
                        strTAN = !string.IsNullOrWhiteSpace(organizationDto.strTAN) ? organizationDto.strTAN : null,
                        strCIN = !string.IsNullOrWhiteSpace(organizationDto.strCIN) ? organizationDto.strCIN : null,
                        strCountryGUID = organizationDto.strCountryGUID,
                        strParentOrganizationGUID = organizationDto.strParentOrganizationGUID,
                        strLogo = organizationDto.strLogo,
                        bolIsActive = organizationDto.bolIsActive,
                        bolIsTaxApplied = organizationDto.bolIsTaxApplied,
                        strIndustryGUID = organizationDto.strIndustryGUID,
                        strUDFCode = organizationDto.strUDFCode,
                        strLegalStatusTypeGUID = organizationDto.strLegalStatusTypeGUID,
                        strCurrencyTypeGUID = organizationDto.strCurrencyTypeGUID,
                        dtClientAcquiredDate = organizationDto.dtClientAcquiredDate,

                        // Billing address
                        strAttention_billing = organizationDto.strAttention_billing,
                        strCountryGUID_billing = organizationDto.strCountryGUID_billing,
                        strAddress_billing = organizationDto.strAddress_billing,
                        strStateGUID_billing = organizationDto.strStateGUID_billing,
                        strCityGUID_billing = organizationDto.strCityGUID_billing,
                        strPinCode_billing = organizationDto.strPinCode_billing,
                        strPhone_billing = organizationDto.strPhone_billing,
                        strFaxNumber_billing = organizationDto.strFaxNumber_billing,

                        // Shipping address
                        strAttention_shipping = organizationDto.strAttention_shipping,
                        strCountryGUID_shipping = organizationDto.strCountryGUID_shipping,
                        strAddress_shipping = organizationDto.strAddress_shipping,
                        strStateGUID_shipping = organizationDto.strStateGUID_shipping,
                        strCityGUID_shipping = organizationDto.strCityGUID_shipping,
                        strPinCode_shipping = organizationDto.strPinCode_shipping,
                        strPhone_shipping = organizationDto.strPhone_shipping,
                        strFaxNumber_shipping = organizationDto.strFaxNumber_shipping,

                        strGroupGUID = groupGuid,
                        strCreatedByGUID = createdByGuid,
                        dtCreatedOn = currentDateTime,
                        strUpdatedByGUID = createdByGuid,  // Set updated by to the same as created by
                        dtUpdatedOn = currentDateTime      // Set updated on to the same as created on
                    };

                    _context.MstOrganizations.Add(organization);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Organization created: {organization.strOrganizationName} with GUID: {organization.strOrganizationGUID}");
                    
                    // Create tax configuration if tax type is provided
                    _logger.LogInformation($"Checking tax config: strTaxTypeGUID={organizationDto.strTaxTypeGUID}, strTaxRegNo={organizationDto.strTaxRegNo}");
                    _logger.LogInformation($"Tax config details - StateGUID: {organizationDto.strStateGUID}, RegistrationDate: {organizationDto.dtRegistrationDate}, IsDefault: {organizationDto.bolIsDefaultTaxConfig}");
                    
                    if (organizationDto.strTaxTypeGUID.HasValue && !string.IsNullOrWhiteSpace(organizationDto.strTaxRegNo))
                    {
                        _logger.LogInformation($"Creating tax configuration for organization {organization.strOrganizationGUID}");
                        _logger.LogInformation($"Organization GUID: {organization.strOrganizationGUID}");
                        _logger.LogInformation($"Tax Type GUID: {organizationDto.strTaxTypeGUID.Value}");
                        _logger.LogInformation($"Tax Reg No: {organizationDto.strTaxRegNo}");
                        
                        var taxConfig = new MstOrgTaxConfig
                        {
                            strOrgTaxConfigGUID = Guid.NewGuid(),
                            strOrganizationGUID = organization.strOrganizationGUID,
                            strTaxTypeGUID = organizationDto.strTaxTypeGUID.Value,
                            strTaxRegNo = organizationDto.strTaxRegNo,
                            strStateGUID = organizationDto.strStateGUID,
                            dtRegistrationDate = organizationDto.dtRegistrationDate,
                            bolIsDefault = organizationDto.bolIsDefaultTaxConfig,
                            bolIsActive = true,
                            jsonSettings = organizationDto.jsonTaxSettings,
                            strCreatedByGUID = createdByGuid,
                            dtCreatedDate = currentDateTime,
                            strUpdatedByGUID = createdByGuid,
                            dtUpdatedOn = currentDateTime
                        };
                        
                        _logger.LogInformation($"Tax config object created with GUID: {taxConfig.strOrgTaxConfigGUID}");
                        _context.MstOrgTaxConfigs.Add(taxConfig);
                        _logger.LogInformation($"Tax config added to context, calling SaveChanges...");
                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation($"Tax configuration created successfully with GUID: {taxConfig.strOrgTaxConfigGUID}");
                    }
                    else
                    {
                        _logger.LogWarning($"Tax configuration not created. TaxTypeGUID present: {organizationDto.strTaxTypeGUID.HasValue}, TaxRegNo present: {!string.IsNullOrWhiteSpace(organizationDto.strTaxRegNo)}");
                        if (organizationDto.strTaxTypeGUID.HasValue)
                        {
                            _logger.LogWarning($"TaxTypeGUID value: {organizationDto.strTaxTypeGUID.Value}");
                        }
                        if (!string.IsNullOrWhiteSpace(organizationDto.strTaxRegNo))
                        {
                            _logger.LogWarning($"TaxRegNo value: {organizationDto.strTaxRegNo}");
                        }
                    }
                    
                    // Create year for the organization using provided request fields
                    if (!organizationDto.dtStartDate.HasValue || !organizationDto.dtEndDate.HasValue || string.IsNullOrWhiteSpace(organizationDto.strYearName))
                    {
                        throw new BusinessException("Year details are required: dtStartDate, dtEndDate, and strYearName must be provided.");
                    }

                    if (organizationDto.dtEndDate.Value <= organizationDto.dtStartDate.Value)
                    {
                        throw new BusinessException("dtEndDate must be greater than dtStartDate.");
                    }

                    var startDateTime = organizationDto.dtStartDate.Value.ToDateTime(TimeOnly.MinValue);
                    var endDateTime = organizationDto.dtEndDate.Value.ToDateTime(TimeOnly.MaxValue);

                    var yearCreateDto = new YearCreateDto
                    {
                        strName = organizationDto.strYearName!,
                        dtStartDate = startDateTime,
                        dtEndDate = endDateTime,
                        bolIsActive = true,
                        strPreviousYearGUID = organizationDto.strPreviousYearGUID,
                        strNextYearGUID = organizationDto.strNextYearGUID
                    };

                    var createdYear = await _yearService.CreateWithoutTransactionAsync(
                        yearCreateDto,
                        createdByGuid,
                        groupGuid,
                        organization.strOrganizationGUID
                    );
                    _logger.LogInformation($"Year created for organization: {createdYear.strName} with GUID: {createdYear.strYearGUID}");
                    
                    // Automatically assign the same role to the user who created the organization
                    try
                    {
                        // Get token claims from HttpContext
                        var currentHttpContext = _httpContextAccessor.HttpContext;
                        if (currentHttpContext?.User?.Identity?.IsAuthenticated == true)
                        {
                            // Extract claims from token
                            var userGuidClaim = currentHttpContext.User.Claims.FirstOrDefault(c => c.Type == "strUserGUID");
                            var currentOrgGuidClaim = currentHttpContext.User.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID");
                            var currentModuleGuidClaim = currentHttpContext.User.Claims.FirstOrDefault(c => c.Type == "strModuleGUID");
                            var currentGroupGuidClaim = currentHttpContext.User.Claims.FirstOrDefault(c => c.Type == "strGroupGUID");
                            var currentYearGuidClaim = currentHttpContext.User.Claims.FirstOrDefault(c => c.Type == "strYearGUID");
                            
                            if (userGuidClaim != null && currentOrgGuidClaim != null && currentModuleGuidClaim != null)
                            {
                                var tokenUserGuid = Guid.Parse(userGuidClaim.Value);
                                var tokenOrgGuid = Guid.Parse(currentOrgGuidClaim.Value);
                                var tokenModuleGuid = Guid.Parse(currentModuleGuidClaim.Value);
                                
                                _logger.LogInformation($"Creating user details for user {tokenUserGuid} who created organization {organization.strOrganizationGUID}");
                                
                                // Find the user's current role in their existing organization
                                var existingUserDetails = await _context.MstUserDetails
                                    .Where(ud => ud.strUserGUID == tokenUserGuid && 
                                                ud.strOrganizationGUID == tokenOrgGuid && 
                                                ud.strModuleGUID == tokenModuleGuid)
                                    .FirstOrDefaultAsync();
                                
                                if (existingUserDetails != null)
                                {
                                    _logger.LogInformation($"Found existing user details with role: {existingUserDetails.strUserRoleGUID}");
                                    
                                    // Check if user details already exist for the new organization
                                    var newOrgUserDetailsExist = await _context.MstUserDetails
                                        .AnyAsync(ud => ud.strUserGUID == tokenUserGuid &&
                                                      ud.strOrganizationGUID == organization.strOrganizationGUID &&
                                                      ud.strYearGUID == createdYear.strYearGUID &&
                                                      ud.strModuleGUID == tokenModuleGuid);
                                    
                                    if (!newOrgUserDetailsExist)
                                    {
                                        // Create new user details with the same role for the new organization
                                        var newUserDetails = new MstUserDetails
                                        {
                                            strUserDetailGUID = Guid.NewGuid(),
                                            strUserGUID = tokenUserGuid,
                                            strOrganizationGUID = organization.strOrganizationGUID,
                                            strUserRoleGUID = existingUserDetails.strUserRoleGUID, // Same role as current org
                                            strGroupGUID = groupGuid,
                                            strYearGUID = createdYear.strYearGUID,
                                            strModuleGUID = tokenModuleGuid, // Same module from token
                                            bolIsActive = true,
                                            dtCreatedOn = currentDateTime,
                                            dtUpdatedOn = currentDateTime,
                                            strCreatedByGUID = tokenUserGuid,
                                            strUpdatedByGUID = tokenUserGuid
                                        };
                                        
                                        _context.MstUserDetails.Add(newUserDetails);
                                        await _context.SaveChangesAsync();
                                        
                                        _logger.LogInformation($"Successfully created user details for user {tokenUserGuid} in new organization {organization.strOrganizationGUID} with role {existingUserDetails.strUserRoleGUID}");
                                    }
                                    else
                                    {
                                        _logger.LogInformation($"User details already exist for user {tokenUserGuid} in organization {organization.strOrganizationGUID}");
                                    }
                                }
                                else
                                {
                                    _logger.LogWarning($"No existing user details found for user {tokenUserGuid} in organization {tokenOrgGuid}. Cannot determine role to assign.");
                                }
                            }
                            else
                            {
                                _logger.LogWarning("Required claims not found in token for automatic role assignment");
                            }
                        }
                        else
                        {
                            _logger.LogWarning("User not authenticated or HttpContext not available for automatic role assignment");
                        }
                    }
                    catch (Exception userDetailsEx)
                    {
                        _logger.LogError(userDetailsEx, "Error creating user details for organization creator. Organization creation will continue.");
                        // Don't throw - organization creation should succeed even if user details creation fails
                    }
                    
                    // Create folder structure for the newly created organization (inside each module folder, not directly under group)
                    try
                    {
                        // We only need to create the base folder and group folder - organization folders will only exist inside module folders
                        string documentsBasePath = _fileStorageService.CreateDirectoryStructure("documents");
                        _logger.LogInformation($"Documents base folder created or verified at {documentsBasePath}");
                        
                        // Create group folder using group GUID
                        string groupFolderName = groupGuid.ToString();
                        string groupFolderPath = _fileStorageService.CreateDirectoryStructure("documents", groupFolderName);
                        _logger.LogInformation($"Group folder created or verified at {groupFolderPath}");
                        
                        // Get all modules assigned to this group
                        var modulesFolders = await _context.MstGroupModules
                            .Where(gm => gm.strGroupGUID == groupGuid)
                            .ToListAsync();
                            
                        _logger.LogInformation($"Found {modulesFolders.Count} modules assigned to group {groupGuid}");
                        
                        // Create folder structure inside each module folder
                        foreach (var groupModule in modulesFolders)
                        {
                            try
                            {
                                // Create module folder inside the group folder
                                string moduleGuidStr = groupModule.strModuleGUID.ToString();
                                string moduleFolderPath = _fileStorageService.CreateDirectoryStructure("documents", groupFolderName, moduleGuidStr);
                                _logger.LogInformation($"Created or verified module directory: {moduleFolderPath}");
                                
                                // Create organization folder inside the module folder
                                string orgGuidStr = organization.strOrganizationGUID.ToString();
                                string moduleOrgFolderPath = _fileStorageService.CreateDirectoryStructure("documents", groupFolderName, moduleGuidStr, orgGuidStr);
                                _logger.LogInformation($"Created or verified organization directory inside module: {moduleOrgFolderPath}");
                                
                                // Create year folder inside the organization folder
                                string yearGuidStr = createdYear.strYearGUID.ToString();
                                string moduleYearFolderPath = _fileStorageService.CreateDirectoryStructure("documents", groupFolderName, moduleGuidStr, orgGuidStr, yearGuidStr);
                                _logger.LogInformation($"Created or verified year directory inside module organization: {moduleYearFolderPath}");
                            }
                            catch (Exception moduleEx)
                            {
                                _logger.LogError(moduleEx, $"Error creating folder structure for module {groupModule.strModuleGUID}");
                                // Continue with other modules even if this one fails
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error creating document folder structure for organization");
                        // Continue with organization creation even if folder creation fails
                    }
                    
                    // Get all group modules for this group and execute SQL scripts for the organization in each module
                    try 
                    {
                        System.Diagnostics.Debug.WriteLine($"Getting all group modules for groupGUID: {groupGuid}");
                        
                        // Track succeeded and failed modules
                        var succeededModules = new List<string>();
                        var failedModules = new List<string>();
                        
                        // Get all group modules for this group
                        var groupModules = await _context.MstGroupModules
                            .Include(gm => gm.Module)
                            .Where(gm => gm.strGroupGUID == groupGuid)
                            .ToListAsync();
                        
                        if (groupModules.Any())
                        {
                            System.Diagnostics.Debug.WriteLine($"Found {groupModules.Count} group modules for group {groupGuid}");
                            
                            // If a specific module GUID was provided, process that one first
                            if (moduleGuid.HasValue)
                            {
                                // Reorder the list to put the specified module first
                                groupModules = groupModules
                                    .OrderByDescending(gm => gm.strModuleGUID == moduleGuid.Value)
                                    .ToList();
                                    
                                System.Diagnostics.Debug.WriteLine($"Prioritizing processing for module GUID: {moduleGuid}");
                            }
                            
                            foreach (var groupModule in groupModules)
                            {
                                if (groupModule.Module != null && !string.IsNullOrEmpty(groupModule.Module.strSQlfilePath) && 
                                    !string.IsNullOrEmpty(groupModule.strConnectionString))
                                {
                                    try
                                    {
                                        System.Diagnostics.Debug.WriteLine(
                                            $"Processing group module {groupModule.strGroupModuleGUID}: " +
                                            $"Module: {groupModule.Module.strName}, " + 
                                            $"Connection string: {groupModule.strConnectionString}, " +
                                            $"SQL file path: {groupModule.Module.strSQlfilePath}");
                                        
                                        // Execute SQL script for the organization in this module's database
                                        // Get the latest created year for this organization
                                        var latestYear = await _context.MstYears
                                            .Where(y => y.strOrganizationGUID == organization.strOrganizationGUID)
                                            .OrderByDescending(y => y.dtCreatedOn)
                                            .FirstOrDefaultAsync();
                                        
                                        string? yearGuid = latestYear?.strYearGUID.ToString();
                                        string? countryGuid = organization.strCountryGUID?.ToString();
                                        System.Diagnostics.Debug.WriteLine($"Using year GUID {yearGuid} and country GUID {countryGuid} for SQL script execution");
                                        
                                        await _groupModuleService.ExecuteSqlScriptForOrganizationAsync(
                                            groupModule.strConnectionString,
                                            groupModule.Module.strSQlfilePath,
                                            organization.strOrganizationGUID.ToString(),
                                            organization.strGroupGUID.ToString(),
                                            yearGuid,
                                            countryGuid);
                                            
                                        System.Diagnostics.Debug.WriteLine($"SQL script executed successfully for organization {organization.strOrganizationGUID} in module {groupModule.Module.strName}");
                                        
                                        // Add to succeeded modules list
                                        succeededModules.Add(groupModule.Module.strName);
                                    }
                                    catch (Exception ex)
                                    {
                                        // Log the error but continue with other modules
                                        System.Diagnostics.Debug.WriteLine($"Error executing SQL script for organization {organization.strOrganizationGUID} in module {groupModule.Module.strName}: {ex.Message}");
                                        if (ex.InnerException != null)
                                        {
                                            System.Diagnostics.Debug.WriteLine($"Inner exception: {ex.InnerException.Message}");
                                        }
                                        
                                        // Add to failed modules list
                                        failedModules.Add($"{groupModule.Module.strName} (Error: {ex.Message})");
                                    }
                                }
                                else
                                {
                                    System.Diagnostics.Debug.WriteLine(
                                        $"Skipping group module {groupModule.strGroupModuleGUID}: " +
                                        $"Module: {(groupModule.Module != null ? groupModule.Module.strName : "null")}, " +
                                        $"SQL file path: {(groupModule.Module != null ? groupModule.Module.strSQlfilePath ?? "null" : "null")}, " +
                                        $"Connection string: {groupModule.strConnectionString ?? "null"}");
                                }
                            }
                        }
                        else
                        {
                            System.Diagnostics.Debug.WriteLine($"No active group modules found for group {groupGuid}");
                        }
                        
                        // Log summary of schema creation results
                        if (succeededModules.Any())
                        {
                            System.Diagnostics.Debug.WriteLine($"Successfully created schemas for organization {organization.strOrganizationGUID} in modules: {string.Join(", ", succeededModules)}");
                        }
                        
                        if (failedModules.Any())
                        {
                            System.Diagnostics.Debug.WriteLine($"Failed to create schemas for organization {organization.strOrganizationGUID} in modules: {string.Join("; ", failedModules)}");
                        }
                    }
                    catch (Exception ex)
                    {
                        // Log the error but don't fail the entire organization creation process
                        System.Diagnostics.Debug.WriteLine($"Error processing group modules for organization: {ex.Message}");
                        if (ex.InnerException != null)
                        {
                            System.Diagnostics.Debug.WriteLine($"Inner exception: {ex.InnerException.Message}");
                        }
                    }
                    
                    await transaction.CommitAsync();
                    var result = _mapper.Map<OrganizationResponseDto>(organization);

                    // Get IP and user agent from HTTP context
                    var httpContext = _httpContextAccessor.HttpContext;
                    string? ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
                    string? userAgent = httpContext?.Request.Headers["User-Agent"].ToString();

                    // Create new value JSON for logging
                    var newValue = JsonSerializer.Serialize(new
                    {
                        name = organization.strOrganizationName,
                        description = organization.strDescription,
                        pan = organization.strPAN,
                        tan = organization.strTAN,
                        cin = organization.strCIN,
                        isActive = organization.bolIsActive,
                        industryGuid = organization.strIndustryGUID,
                        parentOrgGuid = organization.strParentOrganizationGUID,
                        udfCode = organization.strUDFCode,
                        legalStatusTypeGuid = organization.strLegalStatusTypeGUID,
                        currencyTypeGuid = organization.strCurrencyTypeGUID,
                        clientAcquiredDate = organization.dtClientAcquiredDate,

                    });

                    // Build detailed creation message
                    var details = new List<string>();
                    details.Add($"name: '{organization.strOrganizationName}'");
                    
                    if (!string.IsNullOrEmpty(organization.strDescription))
                        details.Add($"description: '{organization.strDescription}'");
                    if (!string.IsNullOrEmpty(organization.strPAN))
                        details.Add($"PAN: '{organization.strPAN}'");
                    if (!string.IsNullOrEmpty(organization.strTAN))
                        details.Add($"TAN: '{organization.strTAN}'");
                    if (!string.IsNullOrEmpty(organization.strCIN))
                        details.Add($"CIN: '{organization.strCIN}'");
                    if (organization.strParentOrganizationGUID.HasValue)
                        details.Add("with parent organization");
                    details.Add(organization.bolIsActive ? "status: Active" : "status: Inactive");

                    // Create activity log
                    var activityLog = new MstUserActivityLog
                    {
                        UserGUID = createdByGuid,
                        GroupGUID = groupGuid,
                        ActivityType = "CREATE_ORGANIZATION",
                        Details = $"Created new organization with {string.Join(", ", details)}",
                        OrganizationGUID = organization.strOrganizationGUID,
                        YearGUID = yearGuid,
                        ModuleGUID = moduleGuid,
                        EntityType = "Organization",
                        EntityGUID = organization.strOrganizationGUID,
                        IPAddress = ipAddress,
                        UserAgent = userAgent,
                        NewValue = newValue
                    };

                    _context.MstUserActivityLogs.Add(activityLog);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Organization created successfully with GUID: {organization.strOrganizationGUID}");
                    return result;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Failed to create organization");
                    // Log the inner exception details if available
                    if (ex.InnerException != null)
                    {
                        throw new BusinessException($"Failed to create organization: {ex.InnerException.Message}");
                    }
                    throw new BusinessException($"Failed to create organization: {ex.Message}");
                }
            });
        }

        public async Task<OrganizationResponseDto?> UpdateOrganizationAsync(
            Guid guid, OrganizationUpdateDto organizationDto, Guid updatedByGuid, Guid groupGuid)
        {
            var organization = await _context.MstOrganizations
                .FirstOrDefaultAsync(o => o.strOrganizationGUID == guid && o.strGroupGUID == groupGuid);

            if (organization == null)
                return null;
            
            // Get the user's current organization from the token
            var httpContext = _httpContextAccessor.HttpContext;
            var tokenOrgGuidClaim = httpContext?.User.Claims.FirstOrDefault(c => c.Type == "strOrganizationGUID");
            var tokenOrgGuid = Guid.TryParse(tokenOrgGuidClaim?.Value, out var parsedOrgGuid) ? parsedOrgGuid : Guid.Empty;
            
            // Check if user is trying to set their current active organization to inactive
            if (tokenOrgGuid == guid && !organizationDto.bolIsActive)
            {
                throw new BusinessException("You cannot make your current active organization inactive. Please switch to another organization first.");
            }
                
            // Store the current logo path before making changes
            string? currentLogoPath = organization.strLogo;
            _logger.LogInformation($"Current logo path before update: {currentLogoPath ?? "null"}");
            
            // Check if we should remove the logo
            bool isEmptyFile = organizationDto.LogoFile != null && organizationDto.LogoFile.Length == 0;
            bool isEmptyString = organizationDto.LogoToRemove != null && organizationDto.LogoToRemove.Trim() == "";
            bool isRemoveRequested = organizationDto.RemoveLogo == true || isEmptyFile || isEmptyString;
            
            if (isRemoveRequested)
            {
                // User wants to remove the logo
                _logger.LogInformation("Logo removal requested");
                if (!string.IsNullOrEmpty(organization.strLogo))
                {
                    _fileStorageService.DeleteFile(organization.strLogo);
                    organizationDto.strLogo = "";
                    _logger.LogInformation("Existing logo deleted");
                }
            }
            // Handle logo upload if provided
            else if (organizationDto.LogoFile != null && organizationDto.LogoFile.Length > 0)
            {
                try
                {
                    // If there's an existing logo, delete it
                    if (!string.IsNullOrEmpty(organization.strLogo))
                    {
                        _fileStorageService.DeleteFile(organization.strLogo);
                    }

                    // Save the new logo
                    var logoPath = await _fileStorageService.SaveFileAsync(organizationDto.LogoFile, "OrganizationLogos");
                    organizationDto.strLogo = logoPath;
                    _logger.LogInformation($"Updated logo saved successfully at path: {logoPath}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error uploading logo file during update");
                    throw new BusinessException(
                        "Failed to upload logo file. Please try again.",
                        "LOGO_UPLOAD_FAILED"
                    );
                }
            }
            else
            {
                // If no new logo is uploaded and no removal requested, ensure we keep the existing logo path
                organizationDto.strLogo = currentLogoPath;
                _logger.LogInformation("No logo changes requested, preserving existing logo path");
            }

            // Check if organization name already exists for another organization in the same group (case-insensitive)
            var exists = await _context.MstOrganizations
                .AnyAsync(o => o.strOrganizationName.ToLower() == organizationDto.strOrganizationName.ToLower() && 
                               o.strGroupGUID == groupGuid &&
                               o.strOrganizationGUID != guid);
            
            if (exists)
            {
                throw new BusinessException("Another organization with this name already exists in the group");
            }

            // Check PAN uniqueness if provided and changed (across ALL groups since it has a unique constraint in database)
            if (!string.IsNullOrEmpty(organizationDto.strPAN) && 
                (organization.strPAN == null || !organization.strPAN.Equals(organizationDto.strPAN, StringComparison.OrdinalIgnoreCase)))
            {
                var panExists = await _context.MstOrganizations
                    .AnyAsync(o => o.strPAN != null && 
                                  o.strPAN.ToLower() == organizationDto.strPAN.ToLower() && 
                                  o.strOrganizationGUID != guid);
                
                if (panExists)
                {
                    throw new BusinessException("Another organization with this PAN already exists in the system. PAN must be unique across all organizations.");
                }
            }

            // Store old values for logging
            var oldValue = JsonSerializer.Serialize(new
            {
                name = organization.strOrganizationName,
                description = organization.strDescription,
                pan = organization.strPAN,
                tan = organization.strTAN,
                cin = organization.strCIN,
                isActive = organization.bolIsActive,
                industryGuid = organization.strIndustryGUID,
                parentOrgGuid = organization.strParentOrganizationGUID,
                udfCode = organization.strUDFCode,
                legalStatusTypeGuid = organization.strLegalStatusTypeGUID,
                currencyTypeGuid = organization.strCurrencyTypeGUID,
                clientAcquiredDate = organization.dtClientAcquiredDate,
                logo = organization.strLogo
            });

            // Update organization properties
            organization.strOrganizationName = organizationDto.strOrganizationName;
            organization.strDescription = organizationDto.strDescription;
            organization.strPAN = !string.IsNullOrWhiteSpace(organizationDto.strPAN) ? organizationDto.strPAN : null;
            organization.strTAN = !string.IsNullOrWhiteSpace(organizationDto.strTAN) ? organizationDto.strTAN : null;
            organization.strCIN = !string.IsNullOrWhiteSpace(organizationDto.strCIN) ? organizationDto.strCIN : null;
            organization.strCountryGUID = organizationDto.strCountryGUID;
            organization.strParentOrganizationGUID = organizationDto.strParentOrganizationGUID;
            organization.bolIsActive = organizationDto.bolIsActive;
            organization.bolIsTaxApplied = organizationDto.bolIsTaxApplied;
            organization.strLogo = organizationDto.strLogo;
            organization.strIndustryGUID = organizationDto.strIndustryGUID;
            organization.strUDFCode = organizationDto.strUDFCode;
            organization.strLegalStatusTypeGUID = organizationDto.strLegalStatusTypeGUID;
            organization.strCurrencyTypeGUID = organizationDto.strCurrencyTypeGUID;
            organization.dtClientAcquiredDate = organizationDto.dtClientAcquiredDate;

            // Billing address
            organization.strAttention_billing = organizationDto.strAttention_billing;
            organization.strCountryGUID_billing = organizationDto.strCountryGUID_billing;
            organization.strAddress_billing = organizationDto.strAddress_billing;
            organization.strStateGUID_billing = organizationDto.strStateGUID_billing;
            organization.strCityGUID_billing = organizationDto.strCityGUID_billing;
            organization.strPinCode_billing = organizationDto.strPinCode_billing;
            organization.strPhone_billing = organizationDto.strPhone_billing;
            organization.strFaxNumber_billing = organizationDto.strFaxNumber_billing;

            // Shipping address
            organization.strAttention_shipping = organizationDto.strAttention_shipping;
            organization.strCountryGUID_shipping = organizationDto.strCountryGUID_shipping;
            organization.strAddress_shipping = organizationDto.strAddress_shipping;
            organization.strStateGUID_shipping = organizationDto.strStateGUID_shipping;
            organization.strCityGUID_shipping = organizationDto.strCityGUID_shipping;
            organization.strPinCode_shipping = organizationDto.strPinCode_shipping;
            organization.strPhone_shipping = organizationDto.strPhone_shipping;
            organization.strFaxNumber_shipping = organizationDto.strFaxNumber_shipping;

            organization.strUpdatedByGUID = updatedByGuid;
            organization.dtUpdatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();

            await _context.SaveChangesAsync();
            
            // Update or create tax configuration if tax type is provided
            if (organizationDto.strTaxTypeGUID.HasValue && !string.IsNullOrWhiteSpace(organizationDto.strTaxRegNo))
            {
                // Check if a tax config already exists for this organization and tax type
                var existingTaxConfig = await _context.MstOrgTaxConfigs
                    .FirstOrDefaultAsync(tc => tc.strOrganizationGUID == guid && tc.strTaxTypeGUID == organizationDto.strTaxTypeGUID.Value);
                
                if (existingTaxConfig != null)
                {
                    // Update existing tax config
                    existingTaxConfig.strTaxRegNo = organizationDto.strTaxRegNo;
                    existingTaxConfig.strStateGUID = organizationDto.strStateGUID;
                    existingTaxConfig.dtRegistrationDate = organizationDto.dtRegistrationDate;
                    existingTaxConfig.bolIsDefault = organizationDto.bolIsDefaultTaxConfig;
                    existingTaxConfig.jsonSettings = organizationDto.jsonTaxSettings;
                    existingTaxConfig.strUpdatedByGUID = updatedByGuid;
                    existingTaxConfig.dtUpdatedOn = DateTimeHelper.GetCurrentUtcTime();
                }
                else
                {
                    // Create new tax config
                    var taxConfig = new MstOrgTaxConfig
                    {
                        strOrgTaxConfigGUID = Guid.NewGuid(),
                        strOrganizationGUID = guid,
                        strTaxTypeGUID = organizationDto.strTaxTypeGUID.Value,
                        strTaxRegNo = organizationDto.strTaxRegNo,
                        strStateGUID = organizationDto.strStateGUID,
                        dtRegistrationDate = organizationDto.dtRegistrationDate,
                        bolIsDefault = organizationDto.bolIsDefaultTaxConfig,
                        bolIsActive = true,
                        jsonSettings = organizationDto.jsonTaxSettings,
                        strCreatedByGUID = updatedByGuid,
                        dtCreatedDate = DateTimeHelper.GetCurrentUtcTime(),
                        strUpdatedByGUID = updatedByGuid,
                        dtUpdatedOn = DateTimeHelper.GetCurrentUtcTime()
                    };
                    
                    _context.MstOrgTaxConfigs.Add(taxConfig);
                }
                
                await _context.SaveChangesAsync();
            }

            // Get IP and user agent from HTTP context (reuse existing httpContext variable)
            string? ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
            string? userAgent = httpContext?.Request.Headers["User-Agent"].ToString();

            // Create new value JSON for logging
            var newValue = JsonSerializer.Serialize(new
            {
                name = organization.strOrganizationName,
                description = organization.strDescription,
                pan = organization.strPAN,
                tan = organization.strTAN,
                cin = organization.strCIN,
                isActive = organization.bolIsActive,
                industryGuid = organization.strIndustryGUID,
                parentOrgGuid = organization.strParentOrganizationGUID,
                udfCode = organization.strUDFCode,
                legalStatusTypeGuid = organization.strLegalStatusTypeGUID,
                currencyTypeGuid = organization.strCurrencyTypeGUID,
                clientAcquiredDate = organization.dtClientAcquiredDate,
                logo = organization.strLogo
            });

            // Build detailed change description
            var changes = new List<string>();
            var oldValues = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(oldValue);
            var newValues = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(newValue);

            // Compare values and build change descriptions
            if (oldValues != null && newValues != null)
            {
                // Helper function to safely get string value
                string GetSafeString(Dictionary<string, JsonElement> dict, string key)
                {
                    return dict.TryGetValue(key, out var value) ? value.GetString() ?? "" : "";
                }

                // Helper function to safely get boolean value
                bool GetSafeBoolean(Dictionary<string, JsonElement> dict, string key)
                {
                    return dict.TryGetValue(key, out var value) && value.ValueKind == JsonValueKind.True;
                }

                var oldName = GetSafeString(oldValues, "name");
                var newName = GetSafeString(newValues, "name");
                if (oldName != newName)
                {
                    changes.Add($"name from '{oldName}' to '{newName}'");
                }

                var oldDesc = GetSafeString(oldValues, "description");
                var newDesc = GetSafeString(newValues, "description");
                if (oldDesc != newDesc)
                {
                    changes.Add($"description from '{oldDesc}' to '{newDesc}'");
                }

                var oldPan = GetSafeString(oldValues, "pan");
                var newPan = GetSafeString(newValues, "pan");
                if (oldPan != newPan)
                {
                    changes.Add($"PAN from '{oldPan}' to '{newPan}'");
                }

                var oldTan = GetSafeString(oldValues, "tan");
                var newTan = GetSafeString(newValues, "tan");
                if (oldTan != newTan)
                {
                    changes.Add($"TAN from '{oldTan}' to '{newTan}'");
                }

                var oldCin = GetSafeString(oldValues, "cin");
                var newCin = GetSafeString(newValues, "cin");
                if (oldCin != newCin)
                {
                    changes.Add($"CIN from '{oldCin}' to '{newCin}'");
                }

                var oldActive = GetSafeBoolean(oldValues, "isActive");
                var newActive = GetSafeBoolean(newValues, "isActive");
                if (oldActive != newActive)
                {
                    changes.Add($"status from '{(oldActive ? "Active" : "Inactive")}' to '{(newActive ? "Active" : "Inactive")}'");
                }

                var oldTimeZone = GetSafeString(oldValues, "timeZone");
                var newTimeZone = GetSafeString(newValues, "timeZone");
                if (oldTimeZone != newTimeZone)
                {
                    changes.Add($"timezone from '{oldTimeZone}' to '{newTimeZone}'");
                }
                
                // Track logo changes
                var oldLogo = GetSafeString(oldValues, "logo");
                var newLogo = GetSafeString(newValues, "logo");
                
                if (!string.IsNullOrEmpty(oldLogo) && string.IsNullOrEmpty(newLogo))
                {
                    // Logo was removed
                    changes.Add("removed organization logo");
                }
                else if (oldLogo != newLogo && !string.IsNullOrEmpty(newLogo))
                {
                    // Logo was changed
                    changes.Add("updated organization logo");
                }
            }

            string detailsMessage = $"Updated organization '{organization.strOrganizationName}'";
            if (changes.Any())
            {
                detailsMessage += $": Changed {string.Join(", ", changes)}";
            }

            // Create activity log
            var activityLog = new MstUserActivityLog
            {
                ActivityLogGUID = Guid.NewGuid(),
                UserGUID = updatedByGuid,
                GroupGUID = groupGuid,
                ActivityType = "UPDATE_ORGANIZATION",
                Details = detailsMessage,
                OrganizationGUID = organization.strOrganizationGUID,
                EntityType = "Organization",
                EntityGUID = organization.strOrganizationGUID,
                IPAddress = ipAddress,
                UserAgent = userAgent,
                OldValue = oldValue,
                NewValue = newValue,
                CreatedByGUID = updatedByGuid,
                CreatedOn = DateTime.UtcNow,
                ActivityTime = DateTime.UtcNow
            };

            _context.MstUserActivityLogs.Add(activityLog);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Organization updated successfully with GUID: {organization.strOrganizationGUID}");
            return _mapper.Map<OrganizationResponseDto>(organization);
        }

        public async Task<bool> DeleteOrganizationAsync(Guid guid, Guid groupGuid)
        {
            var organization = await _context.MstOrganizations
                .FirstOrDefaultAsync(o => o.strOrganizationGUID == guid && o.strGroupGUID == groupGuid);

            if (organization == null)
                return false;

            if (organization.bolSystemCreated)
            {
                throw new BusinessException("Cannot delete system-created organization");
            }

            // Check if any child organizations exist
            var hasChildren = await _context.MstOrganizations
                .AnyAsync(o => o.strParentOrganizationGUID == guid);

            if (hasChildren)
            {
                throw new BusinessException("Cannot delete organization with child organizations");
            }

            // TODO: Add additional checks for related entities if needed

            var strategy = _context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Store organization info for logging before deletion
                    var orgName = organization.strOrganizationName;
                    var oldValue = JsonSerializer.Serialize(new
                    {
                        name = organization.strOrganizationName,
                        description = organization.strDescription,
                        pan = organization.strPAN,
                        tan = organization.strTAN,
                        cin = organization.strCIN,
                        isActive = organization.bolIsActive,
                        industryGuid = organization.strIndustryGUID,
                        parentOrgGuid = organization.strParentOrganizationGUID,
                        udfCode = organization.strUDFCode
                    });

                    _context.MstOrganizations.Remove(organization);
                    await _context.SaveChangesAsync();

                    // Get IP and user agent from HTTP context
                    var httpContext = _httpContextAccessor.HttpContext;
                    string? ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();
                    string? userAgent = httpContext?.Request.Headers["User-Agent"].ToString();

                    // Get current user GUID from HttpContext claims for logging
                    var currentUserGuidString = httpContext?.User.FindFirst("strUserGUID")?.Value;
                    if (!Guid.TryParse(currentUserGuidString, out Guid currentUserGuid))
                    {
                        _logger.LogWarning("Could not determine current user GUID for activity logging");
                        currentUserGuid = Guid.Empty;
                    }

                    // Log the organization deletion activity
                    await _activityLogService.LogActivityAsync(
                        currentUserGuid,
                        groupGuid,
                        "DELETE_ORGANIZATION",
                        $"Deleted organization: {orgName}",
                        null, // Organization GUID is null since it's deleted
                        null,
                        null,
                        "Organization",
                        guid,
                        null,
                        ipAddress,
                        userAgent
                    );

                    await transaction.CommitAsync();
                    _logger.LogInformation($"Organization deleted successfully: {orgName} (GUID: {guid})");
                    return true;
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, $"Failed to delete organization: {guid}");
                    throw new BusinessException($"Failed to delete organization: {ex.Message}");
                }
            });
        }

        public async Task<List<OrganizationResponseDto>> GetActiveOrganizationsAsync(Guid groupGuid)
        {
            if (groupGuid == Guid.Empty)
            {
                throw new BusinessException("Group GUID cannot be empty.");
            }

            var activeOrganizations = await _context.MstOrganizations
                .Where(o => o.strGroupGUID == groupGuid && o.bolIsActive)
                .OrderBy(o => o.strOrganizationName)
                .ToListAsync();

            var organizationDtos = _mapper.Map<List<OrganizationResponseDto>>(activeOrganizations);
            
            // Enhance DTOs with additional data like parent organization names
            await EnhanceOrganizationDtosAsync(organizationDtos);

            return organizationDtos;
        }

        public async Task<(byte[] FileContents, string ContentType, string FileName)> ExportOrganizationsAsync(string format, Guid groupGuid)
        {
            // Get all organizations for the specified group
            var organizations = await _context.MstOrganizations
                .Where(o => o.strGroupGUID == groupGuid)
                .OrderBy(o => o.strOrganizationName)
                .ToListAsync();
            
            if (string.IsNullOrEmpty(format) || !new[] { "excel", "csv" }.Contains(format.ToLower()))
            {
                throw new BusinessException("Invalid export format. Supported formats are 'excel' and 'csv'.");
            }

            // Get related data for lookups
            var parentOrgGuids = organizations
                .Where(o => o.strParentOrganizationGUID.HasValue)
                .Select(o => o.strParentOrganizationGUID!.Value)
                .Distinct()
                .ToList();

            var industryGuids = organizations
                .Where(o => o.strIndustryGUID.HasValue)
                .Select(o => o.strIndustryGUID!.Value)
                .Distinct()
                .ToList();

            var legalStatusTypeGuids = organizations
                .Where(o => o.strLegalStatusTypeGUID.HasValue)
                .Select(o => o.strLegalStatusTypeGUID!.Value)
                .Distinct()
                .ToList();

            // Get parent organization names
            var parentOrganizations = await _context.MstOrganizations
                .Where(o => parentOrgGuids.Contains(o.strOrganizationGUID))
                .Select(o => new { o.strOrganizationGUID, o.strOrganizationName })
                .ToListAsync();

            // Get industry names
            var industries = new List<object>();
            if (industryGuids.Any())
            {
                industries = await _context.MstIndustries
                    .Where(i => industryGuids.Contains(i.strIndustryGUID))
                    .Select(i => new { strIndustryGUID = i.strIndustryGUID.ToString(), strName = i.strName })
                    .ToListAsync<object>();
            }

            // Get legal status type names
            var legalStatusTypes = new List<object>();
            if (legalStatusTypeGuids.Any())
            {
                legalStatusTypes = await _context.MstLegalStatusTypes
                    .Where(l => legalStatusTypeGuids.Contains(l.strLegalStatusTypeGUID))
                    .Select(l => new { strLegalStatusTypeGUID = l.strLegalStatusTypeGUID.ToString(), strName = l.strName })
                    .ToListAsync<object>();
            }

            // Get user information for created by and updated by
            var userGuids = new List<Guid>();
            foreach (var org in organizations)
            {
                userGuids.Add(org.strCreatedByGUID);
                
                if (org.strUpdatedByGUID.HasValue)
                    userGuids.Add(org.strUpdatedByGUID.Value);
            }
            userGuids = userGuids.Distinct().ToList();

            // Dictionary to store user name lookups
            var userNames = new Dictionary<string, string>();
            
            if (userGuids.Any())
            {
                var creatorUpdaters = await _context.MstUsers
                    .Where(u => userGuids.Contains(u.strUserGUID))
                    .Select(u => new { u.strUserGUID, u.strName })
                    .ToListAsync();
                    
                foreach (var user in creatorUpdaters)
                {
                    string userGuidString = user.strUserGUID.ToString();
                    if (!userNames.ContainsKey(userGuidString))
                    {
                        userNames.Add(userGuidString, user.strName ?? "");
                    }
                }
            }

            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            
            if (format.ToLower() == "excel")
            {
                // Create Excel file
                using var workbook = new XLWorkbook();
                var worksheet = workbook.Worksheets.Add("Organizations");
                
                // Add headers
                worksheet.Cell(1, 1).Value = "Organization Name";
                worksheet.Cell(1, 2).Value = "Description";
                worksheet.Cell(1, 3).Value = "PAN";
                worksheet.Cell(1, 4).Value = "TAN";
                worksheet.Cell(1, 5).Value = "CIN";
                worksheet.Cell(1, 6).Value = "Parent Organization";
                worksheet.Cell(1, 7).Value = "Industry";
                worksheet.Cell(1, 8).Value = "Legal Status";
                worksheet.Cell(1, 9).Value = "UDF Code";
                worksheet.Cell(1, 10).Value = "Client Acquired Date";
                worksheet.Cell(1, 11).Value = "Status";
                worksheet.Cell(1, 12).Value = "Created By";
                worksheet.Cell(1, 13).Value = "Created On";
                worksheet.Cell(1, 14).Value = "Updated By";
                worksheet.Cell(1, 15).Value = "Updated On";
                
                // Style the header row
                var headerRow = worksheet.Row(1);
                headerRow.Style.Font.Bold = true;
                headerRow.Style.Fill.BackgroundColor = XLColor.LightGray;
                
                // Add data
                for (int i = 0; i < organizations.Count; i++)
                {
                    var org = organizations[i];
                    int row = i + 2; // Start from row 2 (after header)
                    
                    // Get related data for this organization
                    var parentOrgName = "";
                    if (org.strParentOrganizationGUID.HasValue)
                    {
                        parentOrgName = parentOrganizations
                            .FirstOrDefault(o => o.strOrganizationGUID == org.strParentOrganizationGUID)
                            ?.strOrganizationName ?? "";
                    }

                    var industryName = "";
                    if (org.strIndustryGUID.HasValue)
                    {
                        var industry = industries
                            .Cast<dynamic>()
                            .FirstOrDefault(i => string.Equals(i.strIndustryGUID.ToString(), org.strIndustryGUID.ToString(), StringComparison.OrdinalIgnoreCase));
                        industryName = industry?.strName ?? "";
                    }

                    var legalStatusName = "";
                    if (org.strLegalStatusTypeGUID.HasValue)
                    {
                        var legalStatus = legalStatusTypes
                            .Cast<dynamic>()
                            .FirstOrDefault(l => string.Equals(l.strLegalStatusTypeGUID.ToString(), org.strLegalStatusTypeGUID.ToString(), StringComparison.OrdinalIgnoreCase));
                        legalStatusName = legalStatus?.strName ?? "";
                    }
                    
                    // Get user names for created by and updated by
                    string createdByName = "";
                    string createdByGuidString = org.strCreatedByGUID.ToString();
                    if (userNames.ContainsKey(createdByGuidString))
                    {
                        createdByName = userNames[createdByGuidString];
                    }
                    
                    string updatedByName = "";
                    if (org.strUpdatedByGUID.HasValue)
                    {
                        string updatedByGuidString = org.strUpdatedByGUID.Value.ToString();
                        if (userNames.ContainsKey(updatedByGuidString))
                        {
                            updatedByName = userNames[updatedByGuidString];
                        }
                    }
                    
                    worksheet.Cell(row, 1).Value = org.strOrganizationName;
                    worksheet.Cell(row, 2).Value = org.strDescription ?? "";
                    worksheet.Cell(row, 3).Value = org.strPAN ?? "";
                    worksheet.Cell(row, 4).Value = org.strTAN ?? "";
                    worksheet.Cell(row, 5).Value = org.strCIN ?? "";
                    worksheet.Cell(row, 6).Value = parentOrgName;
                    worksheet.Cell(row, 7).Value = industryName;
                    worksheet.Cell(row, 8).Value = legalStatusName;
                    worksheet.Cell(row, 9).Value = org.strUDFCode ?? "";
                    worksheet.Cell(row, 10).Value = org.dtClientAcquiredDate?.ToString("yyyy-MM-dd") ?? "";
                    worksheet.Cell(row, 11).Value = org.bolIsActive ? "Active" : "Inactive";
                    worksheet.Cell(row, 12).Value = createdByName;
                    worksheet.Cell(row, 13).Value = org.dtCreatedOn.ToString("yyyy-MM-dd HH:mm:ss");
                    worksheet.Cell(row, 14).Value = updatedByName;
                    worksheet.Cell(row, 15).Value = org.dtUpdatedOn?.ToString("yyyy-MM-dd HH:mm:ss") ?? "";
                }
                
                // Auto-fit columns
                worksheet.Columns().AdjustToContents();
                
                // Save to memory stream
                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Seek(0, SeekOrigin.Begin);
                
                return (stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Organizations_{timestamp}.xlsx");
            }
            else // CSV
            {
                // Create CSV content
                var csv = new StringBuilder();
                
                // Add header row
                csv.AppendLine("Organization Name,Description,PAN,TAN,CIN,Parent Organization,Industry,Legal Status,UDF Code,Client Acquired Date,Status,Created By,Created On,Updated By,Updated On");
                
                // Add data rows
                foreach (var org in organizations)
                {
                    // Get related data for this organization
                    var parentOrgName = "";
                    if (org.strParentOrganizationGUID.HasValue)
                    {
                        parentOrgName = parentOrganizations
                            .FirstOrDefault(o => o.strOrganizationGUID == org.strParentOrganizationGUID)
                            ?.strOrganizationName ?? "";
                    }

                    var industryName = "";
                    if (org.strIndustryGUID.HasValue)
                    {
                        var industry = industries
                            .Cast<dynamic>()
                            .FirstOrDefault(i => string.Equals(i.strIndustryGUID.ToString(), org.strIndustryGUID.ToString(), StringComparison.OrdinalIgnoreCase));
                        industryName = industry?.strName ?? "";
                    }

                    var legalStatusName = "";
                    if (org.strLegalStatusTypeGUID.HasValue)
                    {
                        var legalStatus = legalStatusTypes
                            .Cast<dynamic>()
                            .FirstOrDefault(l => string.Equals(l.strLegalStatusTypeGUID.ToString(), org.strLegalStatusTypeGUID.ToString(), StringComparison.OrdinalIgnoreCase));
                        legalStatusName = legalStatus?.strName ?? "";
                    }

                    // Get user names for created by and updated by
                    string createdByName = "";
                    string createdByGuidString = org.strCreatedByGUID.ToString();
                    if (userNames.ContainsKey(createdByGuidString))
                    {
                        createdByName = userNames[createdByGuidString];
                    }
                    
                    string updatedByName = "";
                    if (org.strUpdatedByGUID.HasValue)
                    {
                        string updatedByGuidString = org.strUpdatedByGUID.Value.ToString();
                        if (userNames.ContainsKey(updatedByGuidString))
                        {
                            updatedByName = userNames[updatedByGuidString];
                        }
                    }

                csv.AppendLine($"\"{org.strOrganizationName.Replace("\"", "\"\"")}\",\"{(org.strDescription ?? "").Replace("\"", "\"\"")}\",\"{(org.strPAN ?? "").Replace("\"", "\"\"")}\",\"{(org.strTAN ?? "").Replace("\"", "\"\"")}\",\"{(org.strCIN ?? "").Replace("\"", "\"\"")}\",\"{parentOrgName.Replace("\"", "\"\"")}\",\"{industryName.Replace("\"", "\"\"")}\",\"{legalStatusName.Replace("\"", "\"\"")}\",\"{(org.strUDFCode ?? "").Replace("\"", "\"\"")}\",{org.dtClientAcquiredDate?.ToString("yyyy-MM-dd") ?? ""},{(org.bolIsActive ? "Active" : "Inactive")},\"{createdByName.Replace("\"", "\"\"")}\",{org.dtCreatedOn:yyyy-MM-dd HH:mm:ss},\"{updatedByName.Replace("\"", "\"\"")}\",{org.dtUpdatedOn?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""}");
                }
                
                // Convert to bytes
                byte[] bytes = Encoding.UTF8.GetBytes(csv.ToString());
                
                return (bytes, "text/csv", $"Organizations_{timestamp}.csv");
            }
        }

        public async Task<ExchangeRateResponseDto?> GetExchangeRateAsync(Guid strCurrencyTypeGUID, Guid strOrganizationGUID)
        {
            try
            {
                // Currency requested by caller (foreign/from currency)
                var targetCurrency = await _context.MstCurrencyTypes
                    .Where(c => c.strCurrencyTypeGUID == strCurrencyTypeGUID)
                    .FirstOrDefaultAsync();

                if (targetCurrency == null)
                {
                    _logger.LogWarning($"Currency type not found for GUID: {strCurrencyTypeGUID}");
                    return null;
                }

                // Get the organization to find its base currency
                var organization = await _context.MstOrganizations
                    .Where(o => o.strOrganizationGUID == strOrganizationGUID)
                    .FirstOrDefaultAsync();

                if (organization == null)
                {
                    _logger.LogWarning($"Organization not found for GUID: {strOrganizationGUID}");
                    return null;
                }

                if (!organization.strCurrencyTypeGUID.HasValue)
                {
                    _logger.LogWarning($"Organization {strOrganizationGUID} does not have a currency type set");
                    return null;
                }

                // Organization base currency (to currency)
                var baseCurrency = await _context.MstCurrencyTypes
                    .Where(c => c.strCurrencyTypeGUID == organization.strCurrencyTypeGUID.Value)
                    .FirstOrDefaultAsync();

                if (baseCurrency == null)
                {
                    _logger.LogWarning($"Base currency not found for organization {strOrganizationGUID}");
                    return null;
                }

                // Extract currency codes (e.g., "CHF" from "CHF (Swiss Franc)")
                // API expects from = requested/foreign currency, to = organization base currency
                var fromCurrencyCode = ExtractCurrencyCode(targetCurrency.strName);
                var toCurrencyCode = ExtractCurrencyCode(baseCurrency.strName);

                if (string.IsNullOrEmpty(fromCurrencyCode) || string.IsNullOrEmpty(toCurrencyCode))
                {
                    _logger.LogWarning($"Could not extract currency codes from: {baseCurrency.strName} or {targetCurrency.strName}");
                    return null;
                }

                // Fetch exchange rate from external API
                var exchangeRateService = _httpContextAccessor.HttpContext?.RequestServices
                    .GetService(typeof(IExchangeRateService)) as IExchangeRateService;

                if (exchangeRateService == null)
                {
                    _logger.LogError("Exchange rate service not available");
                    return null;
                }

                var rate = await exchangeRateService.GetExchangeRateAsync(fromCurrencyCode, toCurrencyCode);

                if (!rate.HasValue)
                {
                    _logger.LogWarning($"Could not fetch exchange rate from {fromCurrencyCode} to {toCurrencyCode}");
                    return null;
                }

                return new ExchangeRateResponseDto
                {
                    Rate = rate.Value,
                    FromCurrency = fromCurrencyCode,
                    ToCurrency = toCurrencyCode,
                    FromCurrencyName = targetCurrency.strName,
                    ToCurrencyName = baseCurrency.strName
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting exchange rate for currency {strCurrencyTypeGUID} and organization {strOrganizationGUID}");
                return null;
            }
        }

        private string ExtractCurrencyCode(string currencyName)
        {
            // Extract currency code from format "CHF (Swiss Franc)"
            if (string.IsNullOrEmpty(currencyName))
                return string.Empty;

            var indexOfSpace = currencyName.IndexOf(' ');
            if (indexOfSpace > 0)
            {
                return currencyName.Substring(0, indexOfSpace).Trim();
            }

            // If no space found, assume entire string is the currency code
            return currencyName.Trim();
        }
        
        private string HashPassword(string password)
        {
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        // ==================== ADDRESS MAPPING METHODS ====================

        /// <summary>
        /// Maps organization entity to response DTO and enriches with master-data names (currency, users, addresses).
        /// Uses master database via repository, following the MParty pattern.
        /// </summary>
        public async Task<OrganizationResponseDto> MapToDtoWithMasterDataAsync(MstOrganization organization, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            var dto = _mapper.Map<OrganizationResponseDto>(organization);

            // Format dates to timezone
            var formattedCreatedOn = FormatDateTimeForDisplay(organization.dtCreatedOn, timeZoneId);
            dto.dtCreatedOn = formattedCreatedOn ?? organization.dtCreatedOn;
            if (organization.dtUpdatedOn.HasValue)
                dto.dtUpdatedOn = FormatDateTimeForDisplay(organization.dtUpdatedOn.Value, timeZoneId);

            // Enrich currency type name
            if (organization.strCurrencyTypeGUID.HasValue)
            {
                var currency = await _context.MstCurrencyTypes
                    .Where(c => c.strCurrencyTypeGUID == organization.strCurrencyTypeGUID.Value)
                    .Select(c => c.strName)
                    .FirstOrDefaultAsync();
                dto.strCurrencyTypeName = currency;
            }

            // Enrich created/updated by names
            if (organization.strCreatedByGUID != Guid.Empty)
            {
                var createdBy = await _context.MstUsers
                    .Where(u => u.strUserGUID == organization.strCreatedByGUID)
                    .Select(u => u.strName)
                    .FirstOrDefaultAsync();
                dto.strCreatedBy = createdBy;
            }

            if (organization.strUpdatedByGUID.HasValue && organization.strUpdatedByGUID.Value != Guid.Empty)
            {
                var updatedBy = await _context.MstUsers
                    .Where(u => u.strUserGUID == organization.strUpdatedByGUID.Value)
                    .Select(u => u.strName)
                    .FirstOrDefaultAsync();
                dto.strUpdatedBy = updatedBy;
            }

            // Enrich parent organization name
            if (organization.strParentOrganizationGUID.HasValue)
            {
                var parentOrg = await _context.MstOrganizations
                    .Where(o => o.strOrganizationGUID == organization.strParentOrganizationGUID.Value)
                    .Select(o => o.strOrganizationName)
                    .FirstOrDefaultAsync();
                dto.strParentOrganizationName = parentOrg;
            }

            // Enrich industry name
            if (organization.strIndustryGUID.HasValue)
            {
                var industry = await _context.MstIndustries
                    .Where(i => i.strIndustryGUID == organization.strIndustryGUID.Value)
                    .Select(i => i.strName)
                    .FirstOrDefaultAsync();
                dto.strIndustryCodeName = industry;
            }

            // Enrich legal status name
            if (organization.strLegalStatusTypeGUID.HasValue)
            {
                var legalStatus = await _context.MstLegalStatusTypes
                    .Where(l => l.strLegalStatusTypeGUID == organization.strLegalStatusTypeGUID.Value)
                    .Select(l => l.strName)
                    .FirstOrDefaultAsync();
                dto.strLegalStatusCodeName = legalStatus;
            }

            // Enrich tax configuration from mstOrgTaxConfig (prefer default, then latest)
            var taxConfig = await _context.MstOrgTaxConfigs
                .Where(tc => tc.strOrganizationGUID == organization.strOrganizationGUID && tc.bolIsActive)
                .Include(tc => tc.TaxType)
                .Include(tc => tc.State)
                .OrderByDescending(tc => tc.bolIsDefault)
                .ThenByDescending(tc => tc.dtUpdatedOn ?? tc.dtCreatedDate)
                .FirstOrDefaultAsync();

            if (taxConfig != null)
            {
                dto.strTaxTypeGUID = taxConfig.strTaxTypeGUID;
                dto.strTaxTypeName = taxConfig.TaxType?.strTaxTypeName;
                dto.strTaxTypeCode = taxConfig.TaxType?.strTaxTypeCode;
                dto.strTaxRegNo = taxConfig.strTaxRegNo;
                dto.strStateGUID = taxConfig.strStateGUID;
                dto.strStateName = taxConfig.State?.strName;
                dto.dtRegistrationDate = taxConfig.dtRegistrationDate;
                dto.bolIsDefaultTaxConfig = taxConfig.bolIsDefault;
                dto.jsonTaxSettings = taxConfig.jsonSettings;
            }

            // Enrich billing address master data
            if (organization.strCountryGUID_billing.HasValue)
            {
                var country = await _context.MstCountry
                    .Where(c => c.strCountryGUID == organization.strCountryGUID_billing.Value)
                    .Select(c => c.strName)
                    .FirstOrDefaultAsync();
                dto.strCountryName_billing = country;
            }

            if (organization.strStateGUID_billing.HasValue)
            {
                var state = await _context.MstState
                    .Where(s => s.strStateGUID == organization.strStateGUID_billing.Value)
                    .Select(s => s.strName)
                    .FirstOrDefaultAsync();
                dto.strStateName_billing = state;
            }

            if (organization.strCityGUID_billing.HasValue)
            {
                var city = await _context.MstCity
                    .Where(c => c.strCityGUID == organization.strCityGUID_billing.Value)
                    .Select(c => c.strName)
                    .FirstOrDefaultAsync();
                dto.strCityName_billing = city;
            }

            // Enrich shipping address master data
            if (organization.strCountryGUID_shipping.HasValue)
            {
                var country = await _context.MstCountry
                    .Where(c => c.strCountryGUID == organization.strCountryGUID_shipping.Value)
                    .Select(c => c.strName)
                    .FirstOrDefaultAsync();
                dto.strCountryName_shipping = country;
            }

            if (organization.strStateGUID_shipping.HasValue)
            {
                var state = await _context.MstState
                    .Where(s => s.strStateGUID == organization.strStateGUID_shipping.Value)
                    .Select(s => s.strName)
                    .FirstOrDefaultAsync();
                dto.strStateName_shipping = state;
            }

            if (organization.strCityGUID_shipping.HasValue)
            {
                var city = await _context.MstCity
                    .Where(c => c.strCityGUID == organization.strCityGUID_shipping.Value)
                    .Select(c => c.strName)
                    .FirstOrDefaultAsync();
                dto.strCityName_shipping = city;
            }

            return dto;
        }

        /// <summary>
        /// Maps list of organization entities to DTOs with master-data enrichment in batches.
        /// Similar to MParty module's batch processing.
        /// </summary>
        public async Task<List<OrganizationResponseDto>> MapToDtoListWithMasterDataAsync(
            List<MstOrganization> organizations,
            string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            if (!organizations.Any())
                return new List<OrganizationResponseDto>();

            // Collect all GUIDs for batch lookup
            var currencyTypeGuids = organizations
                .Where(o => o.strCurrencyTypeGUID.HasValue)
                .Select(o => o.strCurrencyTypeGUID!.Value)
                .Distinct()
                .ToList();

            var userGuids = organizations
                .SelectMany(o => new[] { o.strCreatedByGUID, o.strUpdatedByGUID })
                .Where(g => g.HasValue && g.Value != Guid.Empty)
                .Select(g => g!.Value)
                .Distinct()
                .ToList();

            var parentOrgGuids = organizations
                .Where(o => o.strParentOrganizationGUID.HasValue)
                .Select(o => o.strParentOrganizationGUID!.Value)
                .Distinct()
                .ToList();

            var industryGuids = organizations
                .Where(o => o.strIndustryGUID.HasValue)
                .Select(o => o.strIndustryGUID!.Value)
                .Distinct()
                .ToList();

            var legalStatusGuids = organizations
                .Where(o => o.strLegalStatusTypeGUID.HasValue)
                .Select(o => o.strLegalStatusTypeGUID!.Value)
                .Distinct()
                .ToList();

            // Collect billing and shipping address GUIDs
            var billingCountryGuids = organizations
                    .Where(o => o.strCountryGUID_billing.HasValue && o.strCountryGUID_billing.Value != Guid.Empty)
                .Select(o => o.strCountryGUID_billing!.Value)
                .Distinct()
                .ToList();

            var billingStateGuids = organizations
                .Where(o => o.strStateGUID_billing.HasValue && o.strStateGUID_billing.Value != Guid.Empty)
                .Select(o => o.strStateGUID_billing!.Value)
                .Distinct()
                .ToList();

            var billingCityGuids = organizations
                .Where(o => o.strCityGUID_billing.HasValue && o.strCityGUID_billing.Value != Guid.Empty)
                .Select(o => o.strCityGUID_billing!.Value)
                .Distinct()
                .ToList();

            var shippingCountryGuids = organizations
                .Where(o => o.strCountryGUID_shipping.HasValue && o.strCountryGUID_shipping.Value != Guid.Empty)
                .Select(o => o.strCountryGUID_shipping!.Value)
                .Distinct()
                .ToList();

            var shippingStateGuids = organizations
                .Where(o => o.strStateGUID_shipping.HasValue && o.strStateGUID_shipping.Value != Guid.Empty)
                .Select(o => o.strStateGUID_shipping!.Value)
                .Distinct()
                .ToList();

            var shippingCityGuids = organizations
                .Where(o => o.strCityGUID_shipping.HasValue && o.strCityGUID_shipping.Value != Guid.Empty)
                .Select(o => o.strCityGUID_shipping!.Value)
                .Distinct()
                .ToList();

            // Combine all country, state, and city GUIDs
            var allCountryGuids = billingCountryGuids.Union(shippingCountryGuids).Distinct().ToList();
            var allStateGuids = billingStateGuids.Union(shippingStateGuids).Distinct().ToList();
            var allCityGuids = billingCityGuids.Union(shippingCityGuids).Distinct().ToList();

            // Batch load master data
            var currenciesDict = currencyTypeGuids.Any()
                ? await _context.MstCurrencyTypes
                    .Where(c => currencyTypeGuids.Contains(c.strCurrencyTypeGUID))
                    .ToDictionaryAsync(c => c.strCurrencyTypeGUID, c => c.strName)
                : new Dictionary<Guid, string>();

            var usersDict = userGuids.Any()
                ? await _context.MstUsers
                    .Where(u => userGuids.Contains(u.strUserGUID))
                    .ToDictionaryAsync(u => u.strUserGUID, u => u.strName)
                : new Dictionary<Guid, string>();

            var parentOrgsDict = parentOrgGuids.Any()
                ? await _context.MstOrganizations
                    .Where(o => parentOrgGuids.Contains(o.strOrganizationGUID))
                    .ToDictionaryAsync(o => o.strOrganizationGUID, o => o.strOrganizationName)
                : new Dictionary<Guid, string>();

            var industriesDict = industryGuids.Any()
                ? await _context.MstIndustries
                    .Where(i => industryGuids.Contains(i.strIndustryGUID))
                    .ToDictionaryAsync(i => i.strIndustryGUID, i => i.strName)
                : new Dictionary<Guid, string>();

            var legalStatusesDict = legalStatusGuids.Any()
                ? await _context.MstLegalStatusTypes
                    .Where(l => legalStatusGuids.Contains(l.strLegalStatusTypeGUID))
                    .ToDictionaryAsync(l => l.strLegalStatusTypeGUID, l => l.strName)
                : new Dictionary<Guid, string>();

            var countriesDict = allCountryGuids.Any()
                ? await _context.MstCountry
                    .Where(c => allCountryGuids.Contains(c.strCountryGUID))
                    .ToDictionaryAsync(c => c.strCountryGUID, c => c.strName)
                : new Dictionary<Guid, string>();

            var statesDict = allStateGuids.Any()
                ? await _context.MstState
                    .Where(s => allStateGuids.Contains(s.strStateGUID))
                    .ToDictionaryAsync(s => s.strStateGUID, s => s.strName)
                : new Dictionary<Guid, string>();

            var citiesDict = allCityGuids.Any()
                ? await _context.MstCity
                    .Where(c => allCityGuids.Contains(c.strCityGUID))
                    .ToDictionaryAsync(c => c.strCityGUID, c => c.strName)
                : new Dictionary<Guid, string>();

            return organizations.Select(organization =>
            {
                var dto = _mapper.Map<OrganizationResponseDto>(organization);

                // Format dates
                dto.dtCreatedOn = FormatDateTimeForDisplay(organization.dtCreatedOn, timeZoneId) ?? organization.dtCreatedOn;
                if (organization.dtUpdatedOn.HasValue)
                    dto.dtUpdatedOn = FormatDateTimeForDisplay(organization.dtUpdatedOn.Value, timeZoneId);

                // Enrich master data
                if (organization.strCurrencyTypeGUID.HasValue &&
                    currenciesDict.TryGetValue(organization.strCurrencyTypeGUID.Value, out var currencyName))
                {
                    dto.strCurrencyTypeName = currencyName;
                }

                if (organization.strCreatedByGUID != Guid.Empty &&
                    usersDict.TryGetValue(organization.strCreatedByGUID, out var createdBy))
                {
                    dto.strCreatedBy = createdBy;
                }

                if (organization.strUpdatedByGUID.HasValue &&
                    usersDict.TryGetValue(organization.strUpdatedByGUID.Value, out var updatedBy))
                {
                    dto.strUpdatedBy = updatedBy;
                }

                if (organization.strParentOrganizationGUID.HasValue &&
                    parentOrgsDict.TryGetValue(organization.strParentOrganizationGUID.Value, out var parentOrg))
                {
                    dto.strParentOrganizationName = parentOrg;
                }

                if (organization.strIndustryGUID.HasValue &&
                    industriesDict.TryGetValue(organization.strIndustryGUID.Value, out var industry))
                {
                    dto.strIndustryCodeName = industry;
                }

                if (organization.strLegalStatusTypeGUID.HasValue &&
                    legalStatusesDict.TryGetValue(organization.strLegalStatusTypeGUID.Value, out var legalStatus))
                {
                    dto.strLegalStatusCodeName = legalStatus;
                }

                // Enrich billing address master data
                if (organization.strCountryGUID_billing.HasValue &&
                    countriesDict.TryGetValue(organization.strCountryGUID_billing.Value, out var billingCountry))
                {
                    dto.strCountryName_billing = billingCountry;
                }

                if (organization.strStateGUID_billing.HasValue &&
                    statesDict.TryGetValue(organization.strStateGUID_billing.Value, out var billingState))
                {
                    dto.strStateName_billing = billingState;
                }

                if (organization.strCityGUID_billing.HasValue &&
                    citiesDict.TryGetValue(organization.strCityGUID_billing.Value, out var billingCity))
                {
                    dto.strCityName_billing = billingCity;
                }

                // Enrich shipping address master data
                if (organization.strCountryGUID_shipping.HasValue &&
                    countriesDict.TryGetValue(organization.strCountryGUID_shipping.Value, out var shippingCountry))
                {
                    dto.strCountryName_shipping = shippingCountry;
                }

                if (organization.strStateGUID_shipping.HasValue &&
                    statesDict.TryGetValue(organization.strStateGUID_shipping.Value, out var shippingState))
                {
                    dto.strStateName_shipping = shippingState;
                }

                if (organization.strCityGUID_shipping.HasValue &&
                    citiesDict.TryGetValue(organization.strCityGUID_shipping.Value, out var shippingCity))
                {
                    dto.strCityName_shipping = shippingCity;
                }

                return dto;
            }).ToList();
        }

        /// <summary>
        /// Gets organization by ID with billing and shipping addresses only (for forms that need address information)
        /// </summary>
        public async Task<OrganizationWithLocationsResponseDto?> GetByIdWithAddressesAsync(Guid id, string timeZoneId = DateTimeProvider.DefaultTimeZone)
        {
            var organization = await _context.MstOrganizations
                .Where(o => o.strOrganizationGUID == id)
                .FirstOrDefaultAsync();

            if (organization == null)
                return null;

            // Collect all country, state, and city IDs from billing and shipping addresses
            var countryIds = new List<Guid>();
            var stateIds = new List<Guid>();
            var cityIds = new List<Guid>();

            // Billing address IDs
            if (organization.strCountryGUID_billing.HasValue)
                countryIds.Add(organization.strCountryGUID_billing.Value);
            if (organization.strStateGUID_billing.HasValue)
                stateIds.Add(organization.strStateGUID_billing.Value);
            if (organization.strCityGUID_billing.HasValue)
                cityIds.Add(organization.strCityGUID_billing.Value);

            // Shipping address IDs
            if (organization.strCountryGUID_shipping.HasValue)
                countryIds.Add(organization.strCountryGUID_shipping.Value);
            if (organization.strStateGUID_shipping.HasValue)
                stateIds.Add(organization.strStateGUID_shipping.Value);
            if (organization.strCityGUID_shipping.HasValue)
                cityIds.Add(organization.strCityGUID_shipping.Value);

            // Get distinct IDs
            countryIds = countryIds.Distinct().ToList();
            stateIds = stateIds.Distinct().ToList();
            cityIds = cityIds.Distinct().ToList();

            // Fetch master data
            var countries = countryIds.Any()
                ? await _context.MstCountry
                    .Where(c => countryIds.Contains(c.strCountryGUID))
                    .ToDictionaryAsync(c => c.strCountryGUID, c => c.strName)
                : new Dictionary<Guid, string>();

            var states = stateIds.Any()
                ? await _context.MstState
                    .Where(s => stateIds.Contains(s.strStateGUID))
                    .ToDictionaryAsync(s => s.strStateGUID, s => s.strName)
                : new Dictionary<Guid, string>();

            var cities = cityIds.Any()
                ? await _context.MstCity
                    .Where(c => cityIds.Contains(c.strCityGUID))
                    .ToDictionaryAsync(c => c.strCityGUID, c => c.strName)
                : new Dictionary<Guid, string>();

            // Helper function to create address DTO from organization fields
            var createAddressDto = (
                string? attention,
                Guid? countryId,
                string? address,
                Guid? stateId,
                Guid? cityId,
                string? pinCode,
                string? phone,
                string? faxNumber) =>
            {
                if (!countryId.HasValue && !stateId.HasValue && !cityId.HasValue &&
                    string.IsNullOrWhiteSpace(attention) && string.IsNullOrWhiteSpace(address) &&
                    string.IsNullOrWhiteSpace(pinCode) && string.IsNullOrWhiteSpace(phone) &&
                    string.IsNullOrWhiteSpace(faxNumber))
                {
                    return null; // Address is empty
                }

                return new DTOs.Organization.OrganizationAddressResponseDto
                {
                    strAttention = attention,
                    strCountryGUID = countryId,
                    strCountryName = countryId.HasValue && countries.TryGetValue(countryId.Value, out var country)
                        ? country
                        : null,
                    strAddressLine = address,
                    strStateGUID = stateId,
                    strStateName = stateId.HasValue && states.TryGetValue(stateId.Value, out var state)
                        ? state
                        : null,
                    strCityGUID = cityId,
                    strCityName = cityId.HasValue && cities.TryGetValue(cityId.Value, out var city)
                        ? city
                        : null,
                    strPinCode = pinCode,
                    strPhone = phone,
                    strFaxNumber = faxNumber
                };
            };

            // Create result DTO
            var result = new OrganizationWithLocationsResponseDto
            {
                strOrganizationGUID = organization.strOrganizationGUID,
                strOrganizationName = organization.strOrganizationName,
                strDescription = organization.strDescription,
                strPAN = organization.strPAN,
                strTAN = organization.strTAN,
                strCIN = organization.strCIN,
                strUDFCode = organization.strUDFCode,
                bolIsActive = organization.bolIsActive,
                bolIsTaxApplied = organization.bolIsTaxApplied,
                BillingAddress = createAddressDto(
                    organization.strAttention_billing,
                    organization.strCountryGUID_billing,
                    organization.strAddress_billing,
                    organization.strStateGUID_billing,
                    organization.strCityGUID_billing,
                    organization.strPinCode_billing,
                    organization.strPhone_billing,
                    organization.strFaxNumber_billing),
                ShippingAddress = createAddressDto(
                    organization.strAttention_shipping,
                    organization.strCountryGUID_shipping,
                    organization.strAddress_shipping,
                    organization.strStateGUID_shipping,
                    organization.strCityGUID_shipping,
                    organization.strPinCode_shipping,
                    organization.strPhone_shipping,
                    organization.strFaxNumber_shipping)
            };

            return result;
        }
    }
}






