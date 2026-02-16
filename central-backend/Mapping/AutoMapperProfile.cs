using AutoMapper;
using AuditSoftware.Models.Entities;
using AuditSoftware.DTOs.Group;
using AuditSoftware.DTOs.PicklistType;
using AuditSoftware.DTOs.User;
using AuditSoftware.DTOs.PicklistValue;
using AuditSoftware.DTOs.UserRole;
using AuditSoftware.DTOs.Auth;
using AuditSoftware.DTOs.Menu;
using AuditSoftware.DTOs.MasterMenu;
using AuditSoftware.DTOs.UserRights;
using AuditSoftware.DTOs.Organization;
using AuditSoftware.DTOs.Year;
using AuditSoftware.DTOs.UserDetails;
using AuditSoftware.DTOs.AddressType;
using AuditSoftware.DTOs.AccountType;
using AuditSoftware.DTOs.Country;
using AuditSoftware.DTOs.State;
using AuditSoftware.DTOs.City;
using AuditSoftware.DTOs.Industry;
using AuditSoftware.DTOs.CurrencyType;
using AuditSoftware.DTOs.LegalStatusType;
using AuditSoftware.DTOs.Designation;
using AuditSoftware.DTOs.Department;
using AuditSoftware.DTOs.Module;
using AuditSoftware.DTOs.GroupModule;
using AuditSoftware.DTOs.UserInfo;
using AuditSoftware.DTOs.DocType;
using AuditSoftware.DTOs.Document;
using AuditSoftware.DTOs.DocumentAssociation;
using AuditSoftware.DTOs.TaxCategory;

namespace AuditSoftware.Mapping;

public class AutoMapperProfile : Profile
{
    /// <summary>
    /// Formats a file size string from bytes to a human-readable format
    /// </summary>
    /// <param name="fileSizeInBytes">The file size as a string representing bytes</param>
    /// <returns>Human-readable file size (e.g., "10 MB", "1.5 KB")</returns>
    private static string FormatFileSize(string? fileSizeInBytes)
    {
        if (string.IsNullOrEmpty(fileSizeInBytes) || !long.TryParse(fileSizeInBytes, out long bytes))
        {
            return fileSizeInBytes ?? string.Empty;
        }

        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = bytes;
        int order = 0;
        
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        
        // For values less than 1 MB, show with 2 decimal places
        // For MB and above, show with 1 decimal place (cleaner for user)
        string format = order <= 1 ? "0.00" : "0.0";
        
        return $"{len.ToString(format)} {sizes[order]}";
    }
    
    public AutoMapperProfile()
    {
        CreateMap<MstAccountType, AccountTypeResponseDto>()
            .ForMember(dest => dest.strAccountTypeGUID, opt => opt.MapFrom(src => src.strAccountTypeGUID.ToString()));

        CreateMap<AccountTypeCreateDto, MstAccountType>()
            .ForMember(dest => dest.strAccountTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<AccountTypeUpdateDto, MstAccountType>()
            .ForMember(dest => dest.strAccountTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<MstAccountType, AccountTypeSimpleDto>()
            .ForMember(dest => dest.strAccountTypeGUID, opt => opt.MapFrom(src => src.strAccountTypeGUID.ToString()));

        CreateMap<MstAddressType, AddressTypeResponseDto>()
            .ForMember(dest => dest.strAddressTypeGUID, opt => opt.MapFrom(src => src.strAddressTypeGUID.ToString()));

        CreateMap<AddressTypeCreateDto, MstAddressType>()
            .ForMember(dest => dest.strAddressTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        // Country mappings
        CreateMap<MstCountry, CountryResponseDto>()
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => src.strCountryGUID.ToString()));

        CreateMap<CountryCreateDto, MstCountry>()
            .ForMember(dest => dest.strCountryGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<CountryUpdateDto, MstCountry>()
            .ForMember(dest => dest.strCountryGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<MstCountry, CountrySimpleDto>()
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => src.strCountryGUID.ToString()));

        CreateMap<AddressTypeUpdateDto, MstAddressType>()
            .ForMember(dest => dest.strAddressTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<MstAddressType, AddressTypeSimpleDto>()
            .ForMember(dest => dest.strAddressTypeGUID, opt => opt.MapFrom(src => src.strAddressTypeGUID.ToString()));

        CreateMap<MstGroup, GroupResponseDto>()
            .ForMember(dest => dest.strGroupGUID, opt => opt.MapFrom(src => src.strGroupGUID));
        
        CreateMap<GroupCreateDto, MstGroup>()
            .ForMember(dest => dest.strGroupGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()))
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            // Map strLogo from the internal property that gets set during file upload
            .ForMember(dest => dest.strLogo, opt => opt.MapFrom(src => src.strLogo))
            // Ignore the file upload property as it's handled separately
            .ForSourceMember(src => src.LogoFile, opt => opt.DoNotValidate())
            // Ignore admin fields as they are not part of the group entity
            .ForSourceMember(src => src.strAdminName, opt => opt.DoNotValidate())
            .ForSourceMember(src => src.strAdminMobileNo, opt => opt.DoNotValidate())
            .ForSourceMember(src => src.strAdminEmailId, opt => opt.DoNotValidate())
            .ForSourceMember(src => src.strAdminPassword, opt => opt.DoNotValidate());

        CreateMap<GroupUpdateDto, MstGroup>()
            .ForMember(dest => dest.strGroupGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()))
            // Map strLogo from the internal property that gets set during file upload
            .ForMember(dest => dest.strLogo, opt => opt.MapFrom(src => src.strLogo))
            // Ignore the file upload property as it's handled separately
            .ForSourceMember(src => src.LogoFile, opt => opt.DoNotValidate());

        // Organization mappings
        CreateMap<MstOrganization, OrganizationResponseDto>()
            .AfterMap((src, dest) => {
                // Ensure dates are correctly converted to IST
                dest.dtCreatedOn = AuditSoftware.Helpers.DateTimeProvider.ToIst(src.dtCreatedOn);
                if (src.dtUpdatedOn.HasValue)
                    dest.dtUpdatedOn = AuditSoftware.Helpers.DateTimeProvider.ToIst(src.dtUpdatedOn.Value);
            });

        CreateMap<OrganizationCreateDto, MstOrganization>()
            .ForMember(dest => dest.strOrganizationGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strGroupGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore());

        CreateMap<OrganizationUpdateDto, MstOrganization>()
            .ForMember(dest => dest.strOrganizationGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strGroupGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore());

        // Organization address mappings
        CreateMap<MstOrganization, OrganizationWithLocationsResponseDto>();

        CreateMap<PicklistTypeCreateDto, MstPicklistType>()
            .ForMember(dest => dest.strDescription, opt => opt.MapFrom(src => src.strDescription ?? string.Empty));
            
        CreateMap<PicklistTypeUpdateDto, MstPicklistType>()
            .ForMember(dest => dest.strPicklistTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()))
            .ForMember(dest => dest.strDescription, opt => opt.MapFrom(src => src.strDescription ?? string.Empty));
            
        CreateMap<MstPicklistType, PicklistTypeResponseDto>()
            .ForMember(dest => dest.strPicklistTypeGUID, opt => opt.MapFrom(src => src.strPicklistTypeGUID.ToString()));
        
        // Module mappings
        CreateMap<ModuleCreateDto, MstModule>();
            
        CreateMap<ModuleUpdateDto, MstModule>()
            .ForMember(dest => dest.strModuleGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()));
            
        CreateMap<MstModule, ModuleResponseDto>()
            .ForMember(dest => dest.strModuleGUID, opt => opt.MapFrom(src => src.strModuleGUID.ToString()))
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.MapFrom(src => src.strCreatedByGUID.ToString()))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.MapFrom(src => src.strUpdatedByGUID.HasValue ? src.strUpdatedByGUID.Value.ToString() : null));
            
        CreateMap<MstModule, ModuleSimpleDto>()
            .ForMember(dest => dest.strModuleGUID, opt => opt.MapFrom(src => src.strModuleGUID.ToString()));
            
        // Industry mappings
        CreateMap<IndustryCreateDto, MstIndustry>();
            
        CreateMap<IndustryUpdateDto, MstIndustry>()
            .ForMember(dest => dest.strIndustryGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());
            
        CreateMap<MstIndustry, IndustryResponseDto>()
            .ForMember(dest => dest.strIndustryGUID, opt => opt.MapFrom(src => src.strIndustryGUID.ToString()));
            
        CreateMap<MstIndustry, IndustrySimpleDto>()
            .ForMember(dest => dest.strIndustryGUID, opt => opt.MapFrom(src => src.strIndustryGUID.ToString()));
            
        // CurrencyType mappings
        CreateMap<CurrencyTypeCreateDto, MstCurrencyType>();
            
        CreateMap<CurrencyTypeUpdateDto, MstCurrencyType>()
            .ForMember(dest => dest.strCurrencyTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());
            
        CreateMap<MstCurrencyType, CurrencyTypeResponseDto>()
            .ForMember(dest => dest.strCurrencyTypeGUID, opt => opt.MapFrom(src => src.strCurrencyTypeGUID.ToString()))
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => src.strCountryGUID.HasValue ? src.strCountryGUID.Value.ToString() : null))
            .ForMember(dest => dest.strCountryName, opt => opt.Ignore());
            
        CreateMap<MstCurrencyType, CurrencyTypeSimpleDto>()
            .ForMember(dest => dest.strCurrencyTypeGUID, opt => opt.MapFrom(src => src.strCurrencyTypeGUID.ToString()))
            .ForMember(dest => dest.strName, opt => opt.MapFrom(src => src.strName));
            
        // LegalStatusType mappings
        CreateMap<LegalStatusTypeCreateDto, MstLegalStatusType>();
            
        CreateMap<LegalStatusTypeUpdateDto, MstLegalStatusType>()
            .ForMember(dest => dest.strLegalStatusTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());
            
        CreateMap<MstLegalStatusType, LegalStatusTypeResponseDto>()
            .ForMember(dest => dest.strLegalStatusTypeGUID, opt => opt.MapFrom(src => src.strLegalStatusTypeGUID.ToString()));
            
        CreateMap<MstLegalStatusType, LegalStatusTypeSimpleDto>()
            .ForMember(dest => dest.strLegalStatusTypeGUID, opt => opt.MapFrom(src => src.strLegalStatusTypeGUID.ToString()))
            .ForMember(dest => dest.strName, opt => opt.MapFrom(src => src.strName));
            
        // Designation mappings
        CreateMap<DesignationCreateDto, MstDesignation>();
            
        CreateMap<DesignationUpdateDto, MstDesignation>()
            .ForMember(dest => dest.strDesignationGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());
            
        CreateMap<MstDesignation, DesignationResponseDto>()
            .ForMember(dest => dest.strDesignationGUID, opt => opt.MapFrom(src => src.strDesignationGUID.ToString()));
            
        CreateMap<MstDesignation, DesignationSimpleDto>()
            .ForMember(dest => dest.strDesignationGUID, opt => opt.MapFrom(src => src.strDesignationGUID.ToString()))
            .ForMember(dest => dest.strName, opt => opt.MapFrom(src => src.strName));

        // Department mappings
        CreateMap<DepartmentCreateDto, MstDepartment>();

        CreateMap<DepartmentUpdateDto, MstDepartment>()
            .ForMember(dest => dest.strDepartmentGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.MapFrom(src => AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime()))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<MstDepartment, DepartmentResponseDto>()
            .ForMember(dest => dest.strDepartmentGUID, opt => opt.MapFrom(src => src.strDepartmentGUID.ToString()));

        CreateMap<MstDepartment, DepartmentSimpleDto>()
            .ForMember(dest => dest.strDepartmentGUID, opt => opt.MapFrom(src => src.strDepartmentGUID.ToString()))
            .ForMember(dest => dest.strDepartmentName, opt => opt.MapFrom(src => src.strDepartmentName));

        CreateMap<UserCreateDto, MstUser>()
            .ForMember(dest => dest.dtBirthDate, opt => opt.MapFrom(src => 
                src.dtBirthDate.HasValue ? 
                new DateTime(src.dtBirthDate.Value.Year, src.dtBirthDate.Value.Month, src.dtBirthDate.Value.Day, 0, 0, 0, DateTimeKind.Utc) : 
                (DateTime?)null))
            .ForMember(dest => dest.strTimeZone, opt => opt.MapFrom(src => src.strTimeZone));
            
        CreateMap<MstUser, UserResponseDto>()
            .ForMember(dest => dest.strUserGUID, opt => opt.MapFrom(src => src.strUserGUID))
            .ForMember(dest => dest.strTimeZone, opt => opt.MapFrom(src => src.strTimeZone))
            .ForMember(dest => dest.strTimeZone, opt => opt.MapFrom(src => src.strTimeZone))
            .ForMember(dest => dest.dtBirthDate, opt => opt.MapFrom(src => 
                src.dtBirthDate.HasValue ? 
                DateOnly.FromDateTime(src.dtBirthDate.Value) : 
                (DateOnly?)null));
                
        CreateMap<UserUpdateDto, MstUser>()
            .ForMember(dest => dest.strUserGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strPassword, opt => opt.Ignore())
            .ForMember(dest => dest.strGroupGUID, opt => opt.Ignore())

            .ForMember(dest => dest.bolIsSuperAdmin, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strTimeZone, opt => opt.MapFrom(src => src.strTimeZone))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strOTP, opt => opt.Ignore())
            .ForMember(dest => dest.dtOTPExpiry, opt => opt.Ignore())
            .ForMember(dest => dest.dtBirthDate, opt => opt.MapFrom(src => 
                src.dtBirthDate.HasValue ? 
                new DateTime(src.dtBirthDate.Value.Year, src.dtBirthDate.Value.Month, src.dtBirthDate.Value.Day, 0, 0, 0, DateTimeKind.Utc) : 
                (DateTime?)null));

        // PicklistValue mappings
        CreateMap<MstPickListValue, PicklistValueResponseDto>()
            .ForMember(dest => dest.strPickListValueGUID, opt => opt.MapFrom(src => src.strPickListValueGUID))
            .ForMember(dest => dest.strPicklistType, opt => opt.MapFrom(src => src.PicklistType.strType));
        CreateMap<PicklistValueCreateDto, MstPickListValue>();
        CreateMap<PicklistValueUpdateDto, MstPickListValue>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // UserRole mappings
        CreateMap<MstUserRole, UserRoleResponseDto>()
            .ForMember(dest => dest.strUserRoleGUID, opt => opt.MapFrom(src => src.strUserRoleGUID))
            .ForMember(dest => dest.strModuleName, opt => opt.MapFrom(src => 
                src.Module != null ? src.Module.strName : null));
        
        CreateMap<UserRoleCreateDto, MstUserRole>()
            .ForMember(dest => dest.strUserRoleGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<UserRoleUpdateDto, MstUserRole>()
            .ForMember(dest => dest.strUserRoleGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strGroupGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore());

        // Menu mappings
        CreateMap<MenuCreateDto, MstMenu>();
        CreateMap<MstMenu, MenuResponseDto>()
            .ForMember(dest => dest.strMenuGUID, 
                opt => opt.MapFrom(src => src.strMenuGUID.ToString()))
            .ForMember(dest => dest.strParentMenuGUID, 
                opt => opt.MapFrom(src => src.strParentMenuGUID.HasValue ? src.strParentMenuGUID.Value.ToString() : null))
            .ForMember(dest => dest.strParentMenuName,
                opt => opt.MapFrom(src => src.ParentMenu != null ? src.ParentMenu.strName : null))
            .ForMember(dest => dest.strGroupGUID,
                opt => opt.MapFrom(src => src.strGroupGUID.HasValue ? src.strGroupGUID.Value.ToString() : null))
            .ForMember(dest => dest.strGroupName,
                opt => opt.MapFrom(src => src.Group != null ? src.Group.strName : null))
            .ForMember(dest => dest.strModuleGUID,
                opt => opt.MapFrom(src => src.strModuleGUID.HasValue ? src.strModuleGUID.Value.ToString() : null))
            .ForMember(dest => dest.strModuleName,
                opt => opt.MapFrom(src => src.Module != null ? src.Module.strName : null))
            .ForMember(dest => dest.strPageTemplateGUID,
                opt => opt.MapFrom(src => src.strPageTemplateGUID.HasValue ? src.strPageTemplateGUID.Value.ToString() : null))
            .ForMember(dest => dest.strPageTemplateGUID,
                opt => opt.MapFrom(src => src.strPageTemplateGUID.HasValue ? src.strPageTemplateGUID.Value.ToString() : null));

        // MasterMenu mappings
        CreateMap<MasterMenuCreateDto, MstMasterMenu>();
        CreateMap<MstMasterMenu, MasterMenuResponseDto>()
            .ForMember(dest => dest.strMasterMenuGUID, 
                opt => opt.MapFrom(src => src.strMasterMenuGUID.ToString()))
            .ForMember(dest => dest.strParentMenuGUID, 
                opt => opt.MapFrom(src => src.strParentMenuGUID.HasValue ? src.strParentMenuGUID.Value.ToString() : null))
            .ForMember(dest => dest.strModuleGUID, 
                opt => opt.MapFrom(src => src.strModuleGUID.HasValue ? src.strModuleGUID.Value.ToString() : null))
            .ForMember(dest => dest.strPageTemplateGUID, 
                opt => opt.MapFrom(src => src.strPageTemplateGUID.HasValue ? src.strPageTemplateGUID.Value.ToString() : null))
            .ForMember(dest => dest.strParentMenuName,
                opt => opt.MapFrom(src => src.ParentMasterMenu != null ? src.ParentMasterMenu.strName : null));
                
        // Removed MenusByGroupModule mapping as it's implemented directly in the controller using anonymous objects

        // UserRights mappings
        CreateMap<MstUserRights, UserRightsResponseDto>()
            .ForMember(dest => dest.strUserRightGUID,
                opt => opt.MapFrom(src => src.strUserRightGUID.ToString()))
            .ForMember(dest => dest.strUserRoleGUID,
                opt => opt.MapFrom(src => src.strUserRoleGUID.ToString()))
            .ForMember(dest => dest.strMenuGUID,
                opt => opt.MapFrom(src => src.strMenuGUID.ToString()));

        CreateMap<MstYear, YearResponseDto>();
        CreateMap<MstYear, YearSimpleResponseDto>();
        CreateMap<YearCreateDto, MstYear>();
        CreateMap<YearUpdateDto, MstYear>();
        
        // UserDetails mappings
        CreateMap<MstUserDetails, UserDetailsResponseDto>();
        CreateMap<UserDetailsCreateDto, MstUserDetails>();
        CreateMap<UserDetailsUpdateDto, MstUserDetails>()
            .ForMember(dest => dest.strUserDetailGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUserGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strOrganizationGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strGroupGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore());
            
        // State mappings
        CreateMap<MstState, StateResponseDto>()
            .ForMember(dest => dest.strStateGUID, opt => opt.MapFrom(src => src.strStateGUID.ToString()))
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => src.strCountryGUID.ToString()))
            .ForMember(dest => dest.strCountryName, opt => opt.Ignore());

        CreateMap<StateCreateDto, MstState>()
            .ForMember(dest => dest.strStateGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => Guid.Parse(src.strCountryGUID)))
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.Country, opt => opt.Ignore());

        CreateMap<StateUpdateDto, MstState>()
            .ForMember(dest => dest.strStateGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => Guid.Parse(src.strCountryGUID)))
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.Country, opt => opt.Ignore());

        CreateMap<MstState, StateSimpleDto>()
            .ForMember(dest => dest.strStateGUID, opt => opt.MapFrom(src => src.strStateGUID.ToString()))
            .ForMember(dest => dest.strName, opt => opt.MapFrom(src => src.strName));

        // City mappings
        CreateMap<MstCity, CityResponseDto>()
            .ForMember(dest => dest.strCityGUID, opt => opt.MapFrom(src => src.strCityGUID.ToString()))
            .ForMember(dest => dest.strStateGUID, opt => opt.MapFrom(src => src.strStateGUID.ToString()))
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => src.strCountryGUID.ToString()))
            .ForMember(dest => dest.strStateName, opt => opt.Ignore())
            .ForMember(dest => dest.strCountryName, opt => opt.Ignore());

        CreateMap<CityCreateDto, MstCity>()
            .ForMember(dest => dest.strCityGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strStateGUID, opt => opt.MapFrom(src => Guid.Parse(src.strStateGUID)))
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => Guid.Parse(src.strCountryGUID)))
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.State, opt => opt.Ignore())
            .ForMember(dest => dest.Country, opt => opt.Ignore());

        CreateMap<CityUpdateDto, MstCity>()
            .ForMember(dest => dest.strCityGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strStateGUID, opt => opt.MapFrom(src => Guid.Parse(src.strStateGUID)))
            .ForMember(dest => dest.strCountryGUID, opt => opt.MapFrom(src => Guid.Parse(src.strCountryGUID)))
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.State, opt => opt.Ignore())
            .ForMember(dest => dest.Country, opt => opt.Ignore());

        CreateMap<MstCity, CitySimpleDto>()
            .ForMember(dest => dest.strCityGUID, opt => opt.MapFrom(src => src.strCityGUID.ToString()))
            .ForMember(dest => dest.strName, opt => opt.MapFrom(src => src.strName));

        // GroupModule mappings
        CreateMap<MstGroupModule, GroupModuleResponseDto>()
            .ForMember(dest => dest.strGroupModuleGUID, opt => opt.MapFrom(src => src.strGroupModuleGUID.ToString()))
            .ForMember(dest => dest.strGroupGUID, opt => opt.MapFrom(src => src.strGroupGUID.ToString()))
            .ForMember(dest => dest.strGroupName, opt => opt.MapFrom(src => src.Group != null ? src.Group.strName : null))
            .ForMember(dest => dest.strModuleGUID, opt => opt.MapFrom(src => src.strModuleGUID.ToString()))
            .ForMember(dest => dest.strModuleName, opt => opt.MapFrom(src => src.Module != null ? src.Module.strName : null))
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.MapFrom(src => src.strCreatedByGUID.ToString()))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.MapFrom(src => src.strUpdatedByGUID.HasValue ? src.strUpdatedByGUID.Value.ToString() : null));

        CreateMap<GroupModuleCreateDto, MstGroupModule>()
            .ForMember(dest => dest.strGroupModuleGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strGroupGUID, opt => opt.MapFrom(src => Guid.Parse(src.strGroupGUID)))
            .ForMember(dest => dest.strModuleGUID, opt => opt.MapFrom(src => Guid.Parse(src.strModuleGUID)))
            .ForMember(dest => dest.intVersion, opt => opt.MapFrom(src => 1)) // Default to version 1
            .ForMember(dest => dest.strConnectionString, opt => opt.Ignore()) // Will be set in service
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.Group, opt => opt.Ignore())
            .ForMember(dest => dest.Module, opt => opt.Ignore());

        CreateMap<GroupModuleUpdateDto, MstGroupModule>()
            .ForMember(dest => dest.strGroupModuleGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strGroupGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strModuleGUID, opt => opt.Ignore())
            .ForMember(dest => dest.intVersion, opt => opt.Condition(src => src.intVersion.HasValue))
            .ForMember(dest => dest.intVersion, opt => opt.MapFrom(src => src.intVersion.HasValue ? src.intVersion.Value : 1))
            .ForMember(dest => dest.strConnectionString, opt => opt.Ignore()) // Will be set in service
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.Group, opt => opt.Ignore())
            .ForMember(dest => dest.Module, opt => opt.Ignore());
            
        // UserInfo mappings
        CreateMap<MstUserInfo, UserInfoResponseDto>();
            
        CreateMap<UserInfoCreateDto, MstUserInfo>()
            .ForMember(dest => dest.strUserInfoGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore());
            
        CreateMap<UserInfoUpdateDto, MstUserInfo>()
            .ForMember(dest => dest.strUserInfoGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUserGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.User, opt => opt.Ignore());

        // DocType mappings
        CreateMap<DocTypeCreateDto, MstDocType>()
            .ForMember(dest => dest.strDocTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<DocTypeUpdateDto, MstDocType>()
            .ForMember(dest => dest.strDocTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore());

        CreateMap<MstDocType, DocTypeResponseDto>()
            .ForMember(dest => dest.strDocTypeGUID, opt => opt.MapFrom(src => src.strDocTypeGUID.ToString()));

        CreateMap<MstDocType, DocTypeSimpleDto>()
            .ForMember(dest => dest.strDocTypeGUID, opt => opt.MapFrom(src => src.strDocTypeGUID.ToString()));

        // Document mappings
        CreateMap<MstDocument, DocumentResponseDto>()
            .ForMember(dest => dest.strDocumentGUID, opt => opt.MapFrom(src => src.strDocumentGUID.ToString()))
            .ForMember(dest => dest.strUploadByGUID, opt => opt.MapFrom(src => src.strUploadByGUID.ToString()))
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.MapFrom(src => src.strCreatedByGUID.ToString()))
            .ForMember(dest => dest.strModifiedByGUID, opt => opt.MapFrom(src => src.strModifiedByGUID.HasValue ? src.strModifiedByGUID.Value.ToString() : null))
            .ForMember(dest => dest.strOrganizationGUID, opt => opt.MapFrom(src => src.strOrganizationGUID.ToString()))
            .ForMember(dest => dest.strGroupGUID, opt => opt.MapFrom(src => src.strGroupGUID.ToString()))
            .ForMember(dest => dest.strFolderGUID, opt => opt.MapFrom(src => src.strFolderGUID.HasValue ? src.strFolderGUID.Value.ToString() : null))
            .ForMember(dest => dest.strYearGUID, opt => opt.MapFrom(src => src.strYearGUID.HasValue ? src.strYearGUID.Value.ToString() : null))
            .ForMember(dest => dest.strFileSize, opt => opt.MapFrom(src => FormatFileSize(src.strFileSize)));
            
        // Document Extended Response mapping
        CreateMap<MstDocument, DocumentExtendedResponseDto>()
            .IncludeBase<MstDocument, DocumentResponseDto>()
            .ForMember(dest => dest.strFolderName, opt => opt.Ignore())
            .ForMember(dest => dest.strUploadedByName, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByName, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByName, opt => opt.Ignore())
            .ForMember(dest => dest.AssociatedTo, opt => opt.Ignore())
            .ForMember(dest => dest.strModuleGUID, opt => opt.MapFrom(src => src.strModuleGUID.HasValue ? src.strModuleGUID.Value.ToString() : null));
            
        // Document Association mappings
        CreateMap<MstDocumentAssociation, DocumentAssociationResponseDto>()
            .ForMember(dest => dest.strDocumentAssociationGUID, opt => opt.MapFrom(src => src.strDocumentAssociationGUID.ToString()))
            .ForMember(dest => dest.strDocumentGUID, opt => opt.MapFrom(src => src.strDocumentGUID.ToString()))
            .ForMember(dest => dest.strEntityGUID, opt => opt.MapFrom(src => src.strEntityGUID.ToString()))
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.MapFrom(src => src.strCreatedByGUID.ToString()))
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.MapFrom(src => src.strUpdatedByGUID.HasValue ? src.strUpdatedByGUID.Value.ToString() : null))
            .ForMember(dest => dest.strFileName, opt => opt.MapFrom(src => src.Document != null ? src.Document.strFileName : string.Empty))
            .ForMember(dest => dest.strFileType, opt => opt.MapFrom(src => src.Document != null ? src.Document.strFileType : null))
            .ForMember(dest => dest.strFileSize, opt => opt.MapFrom(src => src.Document != null ? src.Document.strFileSize : null));

        // Tax Category mappings
        CreateMap<TaxCategoryCreateDto, MstTaxCategory>()
            .ForMember(dest => dest.strTaxCategoryGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strTaxTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.TaxType, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());

        CreateMap<TaxCategoryUpdateDto, MstTaxCategory>()
            .ForMember(dest => dest.strTaxCategoryGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strTaxTypeGUID, opt => opt.Ignore())
            .ForMember(dest => dest.dtCreatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.dtUpdatedOn, opt => opt.Ignore())
            .ForMember(dest => dest.strCreatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.strUpdatedByGUID, opt => opt.Ignore())
            .ForMember(dest => dest.TaxType, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());

    }
} 