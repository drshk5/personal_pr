SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @CrmModuleGUID UNIQUEIDENTIFIER = NULL;
    SELECT TOP (1) @CrmModuleGUID = strModuleGUID
    FROM mstModule
    WHERE strName = 'CRM';

    DECLARE @CrmTemplate TABLE (strPageTemplateGUID UNIQUEIDENTIFIER PRIMARY KEY);
    INSERT INTO @CrmTemplate (strPageTemplateGUID)
    SELECT strPageTemplateGUID
    FROM mstPageTemplate
    WHERE strPageTemplateName LIKE 'CRM%';

    DECLARE @CrmMenus TABLE (strMasterMenuGUID UNIQUEIDENTIFIER PRIMARY KEY);
    INSERT INTO @CrmMenus (strMasterMenuGUID)
    SELECT strMasterMenuGUID
    FROM mstMasterMenu
    WHERE strCategory = 'CRM'
       OR (@CrmModuleGUID IS NOT NULL AND strModuleGUID = @CrmModuleGUID);

    DECLARE @CrmPickTypes TABLE (strPicklistTypeGUID UNIQUEIDENTIFIER PRIMARY KEY);
    INSERT INTO @CrmPickTypes (strPicklistTypeGUID)
    SELECT strPicklistTypeGUID
    FROM mstPicklistType
    WHERE strType IN
    (
        'Lead_Status',
        'Lead_Source',
        'Contact_Status',
        'Contact_Lifecycle_Stage',
        'Opportunity_Stage',
        'Activity_Type'
    );

    DELETE ur
    FROM mstUserRights ur
    WHERE EXISTS
    (
        SELECT 1
        FROM @CrmMenus m
        WHERE m.strMasterMenuGUID = ur.strMenuGUID
    );

    DELETE pv
    FROM mstPickListValue pv
    WHERE EXISTS
    (
        SELECT 1
        FROM @CrmPickTypes pt
        WHERE pt.strPicklistTypeGUID = pv.strPicklistTypeGUID
    );

    DELETE FROM mstMasterMenu
    WHERE strMasterMenuGUID IN (SELECT strMasterMenuGUID FROM @CrmMenus);

    IF OBJECT_ID('dbo.mstMenu', 'U') IS NOT NULL
    BEGIN
        DELETE m
        FROM mstMenu m
        WHERE (m.strPath LIKE '/crm/%')
           OR (@CrmModuleGUID IS NOT NULL AND m.strModuleGUID = @CrmModuleGUID)
           OR EXISTS
           (
               SELECT 1
               FROM @CrmMenus cm
               WHERE cm.strMasterMenuGUID = m.strMasterMenuGUID
           );
    END;

    DELETE FROM mstPicklistType
    WHERE strPicklistTypeGUID IN (SELECT strPicklistTypeGUID FROM @CrmPickTypes);

    DELETE FROM mstPageTemplate
    WHERE strPageTemplateGUID IN (SELECT strPageTemplateGUID FROM @CrmTemplate);

    COMMIT TRANSACTION;

    SELECT
        'AfterReset' AS Phase,
        (SELECT COUNT(*) FROM mstMasterMenu WHERE strCategory = 'CRM') AS CRM_Menus,
        (SELECT COUNT(*) FROM mstModule WHERE strName = 'CRM') AS CRM_Module,
        (SELECT COUNT(*) FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%') AS CRM_Templates,
        (SELECT COUNT(*) FROM mstPicklistType WHERE strType IN
            ('Lead_Status','Lead_Source','Contact_Status','Contact_Lifecycle_Stage','Opportunity_Stage','Activity_Type')) AS CRM_PicklistTypes;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
