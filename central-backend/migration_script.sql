IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [mstAccountType] (
    [strAccountTypeGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NOT NULL,
    CONSTRAINT [PK_mstAccountType] PRIMARY KEY ([strAccountTypeGUID])
);

CREATE TABLE [mstAddressType] (
    [strAddressTypeGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NOT NULL,
    CONSTRAINT [PK_mstAddressType] PRIMARY KEY ([strAddressTypeGUID])
);

CREATE TABLE [mstCountry] (
    [strCountryGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [strCountryCode] nvarchar(10) NULL,
    [strDialCode] nvarchar(10) NULL,
    [intPhoneMinLength] int NULL,
    [intPhoneMaxLength] int NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NOT NULL,
    CONSTRAINT [PK_mstCountry] PRIMARY KEY ([strCountryGUID])
);

CREATE TABLE [mstCurrencyType] (
    [strCurrencyTypeGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(450) NOT NULL,
    [strCountryGUID] uniqueidentifier NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstCurrencyType] PRIMARY KEY ([strCurrencyTypeGUID])
);

CREATE TABLE [mstDesignation] (
    [strDesignationGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(450) NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstDesignation] PRIMARY KEY ([strDesignationGUID])
);

CREATE TABLE [mstGroup] (
    [strGroupGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [strLicenseNo] nvarchar(50) NOT NULL,
    [strPAN] nvarchar(20) NULL,
    [strTAN] nvarchar(20) NULL,
    [strCIN] nvarchar(50) NULL,
    [dtLicenseIssueDate] datetime2 NOT NULL,
    [dtLicenseExpired] datetime2 NOT NULL,
    [strLogo] nvarchar(255) NULL,
    [strCreatedByGUID] nvarchar(50) NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] nvarchar(50) NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstGroup] PRIMARY KEY ([strGroupGUID])
);

CREATE TABLE [mstIndustryType] (
    [strIndustryGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(450) NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstIndustryType] PRIMARY KEY ([strIndustryGUID])
);

CREATE TABLE [mstLegalStatusType] (
    [strLegalStatusTypeGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(450) NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstLegalStatusType] PRIMARY KEY ([strLegalStatusTypeGUID])
);

CREATE TABLE [mstMasterMenu] (
    [strMasterMenuGUID] uniqueidentifier NOT NULL,
    [strParentMenuGUID] uniqueidentifier NULL,
    [strModuleGUID] uniqueidentifier NULL,
    [dblSeqNo] float NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [strPath] nvarchar(255) NOT NULL,
    [strMenuPosition] nvarchar(50) NOT NULL,
    [bolHasSubMenu] bit NOT NULL,
    [strIconName] nvarchar(50) NULL,
    [bolIsActive] bit NOT NULL,
    [strMapKey] nvarchar(100) NOT NULL,
    [bolSuperAdminAccess] bit NOT NULL,
    [strCategory] nvarchar(50) NULL,
    [strPageTemplateGUID] uniqueidentifier NULL,
    CONSTRAINT [PK_mstMasterMenu] PRIMARY KEY ([strMasterMenuGUID]),
    CONSTRAINT [FK_mstMasterMenu_mstMasterMenu_strParentMenuGUID] FOREIGN KEY ([strParentMenuGUID]) REFERENCES [mstMasterMenu] ([strMasterMenuGUID]) ON DELETE NO ACTION
);

CREATE TABLE [mstModule] (
    [strModuleGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(450) NOT NULL,
    [strDesc] nvarchar(1000) NOT NULL,
    [strSQlfilePath] nvarchar(max) NOT NULL,
    [strImagePath] nvarchar(max) NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstModule] PRIMARY KEY ([strModuleGUID])
);

CREATE TABLE [mstOrganization] (
    [strOrganizationGUID] uniqueidentifier NOT NULL,
    [strOrganizationName] nvarchar(100) NOT NULL,
    [strDescription] nvarchar(500) NULL,
    [strPAN] nvarchar(20) NULL,
    [strTAN] nvarchar(20) NULL,
    [strCIN] nvarchar(21) NULL,
    [strParentOrganizationGUID] uniqueidentifier NULL,
    [bolIsActive] bit NOT NULL,
    [bolSystemCreated] bit NOT NULL,
    [strLogo] nvarchar(255) NULL,
    [strIndustryGUID] uniqueidentifier NULL,
    [strUDFCode] nvarchar(50) NULL,
    [strLegalStatusTypeGUID] uniqueidentifier NULL,
    [strCurrencyTypeGUID] uniqueidentifier NULL,
    [dtClientAcquiredDate] datetime2 NULL,
    [strTimeZone] nvarchar(50) NOT NULL,
    [strGroupGUID] uniqueidentifier NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstOrganization] PRIMARY KEY ([strOrganizationGUID])
);

CREATE TABLE [mstPageTemplate] (
    [strPageTemplateGUID] uniqueidentifier NOT NULL,
    [strPageTemplateName] nvarchar(100) NOT NULL,
    [bolIsSave] bit NOT NULL,
    [bolIsView] bit NOT NULL,
    [bolIsEdit] bit NOT NULL,
    [bolIsDelete] bit NOT NULL,
    [bolIsPrint] bit NOT NULL,
    [bolIsExport] bit NOT NULL,
    [bolIsImport] bit NOT NULL,
    [bolIsApprove] bit NOT NULL,
    [strCreatedByGUID] nvarchar(50) NULL,
    [dtCreated] datetime2 NULL,
    [strModifiedByGUID] nvarchar(50) NULL,
    [dtModified] datetime2 NULL,
    [bolIsSystemCreated] bit NULL,
    CONSTRAINT [PK_mstPageTemplate] PRIMARY KEY ([strPageTemplateGUID])
);

CREATE TABLE [mstPicklistType] (
    [strPicklistTypeGUID] uniqueidentifier NOT NULL,
    [strType] nvarchar(450) NOT NULL,
    [strDescription] nvarchar(max) NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstPicklistType] PRIMARY KEY ([strPicklistTypeGUID])
);

CREATE TABLE [mstSchedule] (
    [strScheduleGUID] uniqueidentifier NOT NULL,
    [code] int NOT NULL,
    [strScheduleCode] nvarchar(50) NOT NULL,
    [strRefNo] nvarchar(max) NULL,
    [strScheduleName] nvarchar(100) NOT NULL,
    [strTemplateName] nvarchar(100) NULL,
    [strUnderCode] nvarchar(50) NULL,
    [strParentScheduleGUID] uniqueidentifier NULL,
    [dblChartType] float NULL,
    [strDefaultAccountTypeGUID] uniqueidentifier NULL,
    [bolIsActive] bit NOT NULL,
    [bolIsEditable] bit NOT NULL,
    CONSTRAINT [PK_mstSchedule] PRIMARY KEY ([strScheduleGUID])
);

CREATE TABLE [mstUser] (
    [strUserGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(max) NOT NULL,
    [dtBirthDate] datetime2 NULL,
    [strMobileNo] nvarchar(450) NOT NULL,
    [strPassword] nvarchar(max) NOT NULL,
    [strEmailId] nvarchar(450) NOT NULL,
    [strOTP] nvarchar(6) NULL,
    [dtOTPExpiry] datetime2 NULL,
    [bolIsActive] bit NOT NULL,
    [bolSystemCreated] bit NOT NULL,
    [dtWorkingStartTime] time NULL,
    [strSessionId] nvarchar(100) NULL,
    [dtSessionExpiresAt] datetime2 NULL,
    [dtWorkingEndTime] time NULL,
    [bolIsSuperAdmin] bit NOT NULL,
    [strGroupGUID] uniqueidentifier NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    [strLastModuleGUID] uniqueidentifier NULL,
    [strProfileImg] nvarchar(255) NULL,
    CONSTRAINT [PK_mstUser] PRIMARY KEY ([strUserGUID])
);

CREATE TABLE [mstUserDetails] (
    [strUserDetailGUID] uniqueidentifier NOT NULL,
    [strUserGUID] uniqueidentifier NOT NULL,
    [strOrganizationGUID] uniqueidentifier NOT NULL,
    [strUserRoleGUID] uniqueidentifier NOT NULL,
    [strGroupGUID] uniqueidentifier NOT NULL,
    [strYearGUID] uniqueidentifier NOT NULL,
    [strModuleGUID] uniqueidentifier NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstUserDetails] PRIMARY KEY ([strUserDetailGUID])
);

CREATE TABLE [mstYear] (
    [strYearGUID] uniqueidentifier NOT NULL,
    [strOrganizationGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [dtStartDate] datetime2 NOT NULL,
    [dtEndDate] datetime2 NOT NULL,
    [bolIsActive] bit NOT NULL,
    [bolSystemCreated] bit NOT NULL,
    [strPreviousYearGUID] uniqueidentifier NULL,
    [strNextYearGUID] uniqueidentifier NULL,
    [strGroupGUID] uniqueidentifier NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [dtUpdatedOn] datetime2 NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    CONSTRAINT [PK_mstYear] PRIMARY KEY ([strYearGUID])
);

CREATE TABLE [mstState] (
    [strStateGUID] uniqueidentifier NOT NULL,
    [strCountryGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NOT NULL,
    CONSTRAINT [PK_mstState] PRIMARY KEY ([strStateGUID]),
    CONSTRAINT [FK_mstState_mstCountry_strCountryGUID] FOREIGN KEY ([strCountryGUID]) REFERENCES [mstCountry] ([strCountryGUID]) ON DELETE CASCADE
);

CREATE TABLE [mstGroupModule] (
    [strGroupModuleGUID] uniqueidentifier NOT NULL,
    [strGroupGUID] uniqueidentifier NOT NULL,
    [strModuleGUID] uniqueidentifier NOT NULL,
    [intVersion] int NOT NULL,
    [strConnectionString] nvarchar(500) NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstGroupModule] PRIMARY KEY ([strGroupModuleGUID]),
    CONSTRAINT [FK_mstGroupModule_mstGroup_strGroupGUID] FOREIGN KEY ([strGroupGUID]) REFERENCES [mstGroup] ([strGroupGUID]),
    CONSTRAINT [FK_mstGroupModule_mstModule_strModuleGUID] FOREIGN KEY ([strModuleGUID]) REFERENCES [mstModule] ([strModuleGUID])
);

CREATE TABLE [mstMenu] (
    [strMenuGUID] uniqueidentifier NOT NULL,
    [strMasterMenuGUID] uniqueidentifier NULL,
    [strParentMenuGUID] uniqueidentifier NULL,
    [dblSeqNo] float NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [strPath] nvarchar(255) NOT NULL,
    [strMenuPosition] nvarchar(50) NOT NULL,
    [bolHasSubMenu] bit NOT NULL,
    [strIconName] nvarchar(50) NULL,
    [bolIsActive] bit NOT NULL,
    [strMapKey] nvarchar(100) NOT NULL,
    [bolSuperAdminAccess] bit NOT NULL,
    [strCategory] nvarchar(50) NULL,
    [strPageTemplateGUID] uniqueidentifier NULL,
    [strGroupGUID] uniqueidentifier NULL,
    [strModuleGUID] uniqueidentifier NULL,
    CONSTRAINT [PK_mstMenu] PRIMARY KEY ([strMenuGUID]),
    CONSTRAINT [FK_mstMenu_mstGroup_strGroupGUID] FOREIGN KEY ([strGroupGUID]) REFERENCES [mstGroup] ([strGroupGUID]),
    CONSTRAINT [FK_mstMenu_mstMenu_strParentMenuGUID] FOREIGN KEY ([strParentMenuGUID]) REFERENCES [mstMenu] ([strMenuGUID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_mstMenu_mstModule_strModuleGUID] FOREIGN KEY ([strModuleGUID]) REFERENCES [mstModule] ([strModuleGUID])
);

CREATE TABLE [mstPickListValue] (
    [strPickListValueGUID] uniqueidentifier NOT NULL,
    [strValue] nvarchar(450) NOT NULL,
    [strPicklistTypeGUID] uniqueidentifier NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strGroupGUID] uniqueidentifier NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstPickListValue] PRIMARY KEY ([strPickListValueGUID]),
    CONSTRAINT [FK_mstPickListValue_mstGroup_strGroupGUID] FOREIGN KEY ([strGroupGUID]) REFERENCES [mstGroup] ([strGroupGUID]) ON DELETE CASCADE,
    CONSTRAINT [FK_mstPickListValue_mstPicklistType_strPicklistTypeGUID] FOREIGN KEY ([strPicklistTypeGUID]) REFERENCES [mstPicklistType] ([strPicklistTypeGUID]) ON DELETE CASCADE
);

CREATE TABLE [mstUserInfo] (
    [strUserInfoGUID] uniqueidentifier NOT NULL,
    [strUserGUID] uniqueidentifier NOT NULL,
    [strModuleGUID] uniqueidentifier NULL,
    [strLastOrganizationGUID] uniqueidentifier NULL,
    [strLastYearGUID] uniqueidentifier NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstUserInfo] PRIMARY KEY ([strUserInfoGUID]),
    CONSTRAINT [FK_mstUserInfo_mstUser_strUserGUID] FOREIGN KEY ([strUserGUID]) REFERENCES [mstUser] ([strUserGUID]) ON DELETE CASCADE
);

CREATE TABLE [mstUserRoles] (
    [strUserRoleGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [strDesc] nvarchar(500) NULL,
    [bolIsActive] bit NOT NULL,
    [bolSystemCreated] bit NOT NULL,
    [strGroupGUID] uniqueidentifier NOT NULL,
    [strModuleGUID] uniqueidentifier NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtUpdatedOn] datetime2 NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    CONSTRAINT [PK_mstUserRoles] PRIMARY KEY ([strUserRoleGUID]),
    CONSTRAINT [FK_mstUserRoles_mstGroup_strGroupGUID] FOREIGN KEY ([strGroupGUID]) REFERENCES [mstGroup] ([strGroupGUID]) ON DELETE CASCADE,
    CONSTRAINT [FK_mstUserRoles_mstModule_strModuleGUID] FOREIGN KEY ([strModuleGUID]) REFERENCES [mstModule] ([strModuleGUID]),
    CONSTRAINT [FK_mstUserRoles_mstUser_strCreatedByGUID] FOREIGN KEY ([strCreatedByGUID]) REFERENCES [mstUser] ([strUserGUID]) ON DELETE CASCADE,
    CONSTRAINT [FK_mstUserRoles_mstUser_strUpdatedByGUID] FOREIGN KEY ([strUpdatedByGUID]) REFERENCES [mstUser] ([strUserGUID])
);

CREATE TABLE [refreshToken] (
    [Token] nvarchar(450) NOT NULL,
    [JwtId] nvarchar(max) NOT NULL,
    [IsUsed] bit NOT NULL,
    [IsRevoked] bit NOT NULL,
    [AddedDate] datetime2 NOT NULL,
    [ExpiryDate] datetime2 NOT NULL,
    [strUserGUID] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_refreshToken] PRIMARY KEY ([Token]),
    CONSTRAINT [FK_refreshToken_mstUser_strUserGUID] FOREIGN KEY ([strUserGUID]) REFERENCES [mstUser] ([strUserGUID]) ON DELETE CASCADE
);

CREATE TABLE [mstCity] (
    [strCityGUID] uniqueidentifier NOT NULL,
    [strStateGUID] uniqueidentifier NOT NULL,
    [strCountryGUID] uniqueidentifier NOT NULL,
    [strName] nvarchar(100) NOT NULL,
    [bolIsActive] bit NOT NULL,
    [strCreatedByGUID] uniqueidentifier NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstCity] PRIMARY KEY ([strCityGUID]),
    CONSTRAINT [FK_mstCity_mstCountry_strCountryGUID] FOREIGN KEY ([strCountryGUID]) REFERENCES [mstCountry] ([strCountryGUID]),
    CONSTRAINT [FK_mstCity_mstState_strStateGUID] FOREIGN KEY ([strStateGUID]) REFERENCES [mstState] ([strStateGUID])
);

CREATE TABLE [mstUserRights] (
    [strUserRightGUID] uniqueidentifier NOT NULL,
    [strUserRoleGUID] uniqueidentifier NOT NULL,
    [strMenuGUID] uniqueidentifier NOT NULL,
    [bolCanView] bit NOT NULL,
    [bolCanEdit] bit NOT NULL,
    [bolCanSave] bit NOT NULL,
    [bolCanDelete] bit NOT NULL,
    [bolCanPrint] bit NOT NULL,
    [bolCanExport] bit NOT NULL,
    [bolCanImport] bit NOT NULL,
    [bolCanApprove] bit NOT NULL,
    CONSTRAINT [PK_mstUserRights] PRIMARY KEY ([strUserRightGUID]),
    CONSTRAINT [FK_mstUserRights_mstMenu_strMenuGUID] FOREIGN KEY ([strMenuGUID]) REFERENCES [mstMenu] ([strMenuGUID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_mstUserRights_mstUserRoles_strUserRoleGUID] FOREIGN KEY ([strUserRoleGUID]) REFERENCES [mstUserRoles] ([strUserRoleGUID]) ON DELETE NO ACTION
);

CREATE TABLE [mstAddressDetail] (
    [strAddressDetailGUID] uniqueidentifier NOT NULL,
    [strOrganizationGUID] uniqueidentifier NOT NULL,
    [bolIsDefault] bit NOT NULL,
    [strAddressTypeGUID] uniqueidentifier NOT NULL,
    [strAddressName] nvarchar(255) NOT NULL,
    [strAddress] nvarchar(500) NOT NULL,
    [strCountryGUID] uniqueidentifier NOT NULL,
    [strStateGUID] uniqueidentifier NOT NULL,
    [strCityGUID] uniqueidentifier NOT NULL,
    [strZipCode] nvarchar(20) NOT NULL,
    [strPhoneNo] nvarchar(20) NOT NULL,
    [strEmailId] nvarchar(100) NOT NULL,
    [strWebsite] nvarchar(255) NOT NULL,
    [strGroupGUID] uniqueidentifier NOT NULL,
    [strCreatedByGUID] uniqueidentifier NOT NULL,
    [dtCreatedOn] datetime2 NOT NULL,
    [strUpdatedByGUID] uniqueidentifier NULL,
    [dtUpdatedOn] datetime2 NULL,
    CONSTRAINT [PK_mstAddressDetail] PRIMARY KEY ([strAddressDetailGUID]),
    CONSTRAINT [FK_mstAddressDetail_mstAddressType_strAddressTypeGUID] FOREIGN KEY ([strAddressTypeGUID]) REFERENCES [mstAddressType] ([strAddressTypeGUID]) ON DELETE CASCADE,
    CONSTRAINT [FK_mstAddressDetail_mstCity_strCityGUID] FOREIGN KEY ([strCityGUID]) REFERENCES [mstCity] ([strCityGUID]),
    CONSTRAINT [FK_mstAddressDetail_mstCountry_strCountryGUID] FOREIGN KEY ([strCountryGUID]) REFERENCES [mstCountry] ([strCountryGUID]),
    CONSTRAINT [FK_mstAddressDetail_mstGroup_strGroupGUID] FOREIGN KEY ([strGroupGUID]) REFERENCES [mstGroup] ([strGroupGUID]) ON DELETE CASCADE,
    CONSTRAINT [FK_mstAddressDetail_mstOrganization_strOrganizationGUID] FOREIGN KEY ([strOrganizationGUID]) REFERENCES [mstOrganization] ([strOrganizationGUID]) ON DELETE CASCADE,
    CONSTRAINT [FK_mstAddressDetail_mstState_strStateGUID] FOREIGN KEY ([strStateGUID]) REFERENCES [mstState] ([strStateGUID])
);

CREATE INDEX [IX_mstAddressDetail_strAddressTypeGUID] ON [mstAddressDetail] ([strAddressTypeGUID]);

CREATE INDEX [IX_mstAddressDetail_strCityGUID] ON [mstAddressDetail] ([strCityGUID]);

CREATE INDEX [IX_mstAddressDetail_strCountryGUID] ON [mstAddressDetail] ([strCountryGUID]);

CREATE INDEX [IX_mstAddressDetail_strGroupGUID] ON [mstAddressDetail] ([strGroupGUID]);

CREATE INDEX [IX_mstAddressDetail_strOrganizationGUID] ON [mstAddressDetail] ([strOrganizationGUID]);

CREATE INDEX [IX_mstAddressDetail_strStateGUID] ON [mstAddressDetail] ([strStateGUID]);

CREATE UNIQUE INDEX [IX_mstAddressType_strName] ON [mstAddressType] ([strName]);

CREATE INDEX [IX_mstCity_strCountryGUID] ON [mstCity] ([strCountryGUID]);

CREATE UNIQUE INDEX [IX_mstCity_strName_strStateGUID_strCountryGUID] ON [mstCity] ([strName], [strStateGUID], [strCountryGUID]);

CREATE INDEX [IX_mstCity_strStateGUID] ON [mstCity] ([strStateGUID]);

CREATE UNIQUE INDEX [IX_mstCountry_strName] ON [mstCountry] ([strName]);

CREATE UNIQUE INDEX [IX_mstCurrencyType_strName] ON [mstCurrencyType] ([strName]);

CREATE UNIQUE INDEX [IX_mstDesignation_strName] ON [mstDesignation] ([strName]);

CREATE UNIQUE INDEX [IX_mstGroup_CIN] ON [mstGroup] ([strCIN]) WHERE [strCIN] IS NOT NULL;

CREATE UNIQUE INDEX [IX_mstGroup_LicenseNo] ON [mstGroup] ([strLicenseNo]);

CREATE UNIQUE INDEX [IX_mstGroup_PAN] ON [mstGroup] ([strPAN]) WHERE [strPAN] IS NOT NULL;

CREATE UNIQUE INDEX [IX_mstGroup_strPAN] ON [mstGroup] ([strPAN]) WHERE [strPAN] IS NOT NULL;

CREATE UNIQUE INDEX [IX_mstGroup_TAN] ON [mstGroup] ([strTAN]) WHERE [strTAN] IS NOT NULL;

CREATE UNIQUE INDEX [IX_mstGroupModule_strGroupGUID_strModuleGUID] ON [mstGroupModule] ([strGroupGUID], [strModuleGUID]);

CREATE INDEX [IX_mstGroupModule_strModuleGUID] ON [mstGroupModule] ([strModuleGUID]);

CREATE UNIQUE INDEX [IX_mstIndustryType_strName] ON [mstIndustryType] ([strName]);

CREATE UNIQUE INDEX [IX_mstLegalStatusType_strName] ON [mstLegalStatusType] ([strName]);

CREATE UNIQUE INDEX [IX_mstMasterMenu_strParentMenuGUID_strName] ON [mstMasterMenu] ([strParentMenuGUID], [strName]) WHERE [strParentMenuGUID] IS NOT NULL;

CREATE UNIQUE INDEX [IX_mstMasterMenu_strPath] ON [mstMasterMenu] ([strPath]) WHERE [strPath] IS NOT NULL;

CREATE INDEX [IX_mstMenu_strGroupGUID] ON [mstMenu] ([strGroupGUID]);

CREATE INDEX [IX_mstMenu_strModuleGUID] ON [mstMenu] ([strModuleGUID]);

CREATE UNIQUE INDEX [IX_mstMenu_strParentMenuGUID_strName] ON [mstMenu] ([strParentMenuGUID], [strName]) WHERE [strParentMenuGUID] IS NOT NULL;

CREATE UNIQUE INDEX [IX_mstMenu_strPath_strGroupGUID_strModuleGUID] ON [mstMenu] ([strPath], [strGroupGUID], [strModuleGUID]) WHERE [strPath] IS NOT NULL;

CREATE UNIQUE INDEX [IX_mstModule_strName] ON [mstModule] ([strName]);

CREATE UNIQUE INDEX [IX_mstOrganization_strOrganizationName_strGroupGUID] ON [mstOrganization] ([strOrganizationName], [strGroupGUID]);

CREATE UNIQUE INDEX [IX_mstOrganization_strPAN] ON [mstOrganization] ([strPAN]) WHERE [strPAN] IS NOT NULL;

CREATE UNIQUE INDEX [IX_mstPageTemplate_Name] ON [mstPageTemplate] ([strPageTemplateName]);

CREATE UNIQUE INDEX [IX_mstPicklistType_strType] ON [mstPicklistType] ([strType]);

CREATE INDEX [IX_mstPickListValue_strGroupGUID] ON [mstPickListValue] ([strGroupGUID]);

CREATE UNIQUE INDEX [IX_mstPickListValue_strPicklistTypeGUID_strValue_strGroupGUID] ON [mstPickListValue] ([strPicklistTypeGUID], [strValue], [strGroupGUID]);

CREATE INDEX [IX_mstState_strCountryGUID] ON [mstState] ([strCountryGUID]);

CREATE UNIQUE INDEX [IX_mstState_strName_strCountryGUID] ON [mstState] ([strName], [strCountryGUID]);

CREATE UNIQUE INDEX [IX_mstUser_strEmailId] ON [mstUser] ([strEmailId]);

CREATE UNIQUE INDEX [IX_mstUser_strMobileNo] ON [mstUser] ([strMobileNo]);

CREATE UNIQUE INDEX [IX_mstUserDetails_strUserGUID_strOrganizationGUID_strYearGUID_strModuleGUID] ON [mstUserDetails] ([strUserGUID], [strOrganizationGUID], [strYearGUID], [strModuleGUID]);

CREATE INDEX [IX_mstUserInfo_strUserGUID] ON [mstUserInfo] ([strUserGUID]);

CREATE INDEX [IX_mstUserRights_strMenuGUID] ON [mstUserRights] ([strMenuGUID]);

CREATE UNIQUE INDEX [IX_mstUserRights_strUserRoleGUID_strMenuGUID] ON [mstUserRights] ([strUserRoleGUID], [strMenuGUID]);

CREATE INDEX [IX_mstUserRoles_strCreatedByGUID] ON [mstUserRoles] ([strCreatedByGUID]);

CREATE INDEX [IX_mstUserRoles_strGroupGUID] ON [mstUserRoles] ([strGroupGUID]);

CREATE INDEX [IX_mstUserRoles_strModuleGUID] ON [mstUserRoles] ([strModuleGUID]);

CREATE UNIQUE INDEX [IX_mstUserRoles_strName_strGroupGUID] ON [mstUserRoles] ([strName], [strGroupGUID]);

CREATE INDEX [IX_mstUserRoles_strUpdatedByGUID] ON [mstUserRoles] ([strUpdatedByGUID]);

CREATE UNIQUE INDEX [IX_mstYear_strName_strOrganizationGUID_strGroupGUID] ON [mstYear] ([strName], [strOrganizationGUID], [strGroupGUID]);

CREATE INDEX [IX_refreshToken_strUserGUID] ON [refreshToken] ([strUserGUID]);

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250919125051_InitialCreate', N'9.0.6');

COMMIT;
GO

