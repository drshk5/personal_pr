import React, { Suspense, lazy } from "react";
import { PageLoader } from "@/components/layout/page-loader";
import OrganizationWizard from "@/pages/Central/organization/OrganizationWizard";

const AddressTypeList = lazy(
  () => import("@/pages/Central/addresstype/AddressTypeList")
);
const AddressTypeForm = lazy(
  () => import("@/pages/Central/addresstype/AddressTypeForm")
);

const AccountTypeList = lazy(
  () => import("@/pages/Central/accounttype/AccountTypeList")
);
const AccountTypeForm = lazy(
  () => import("@/pages/Central/accounttype/AccountTypeForm")
);

const CityList = lazy(() => import("@/pages/Central/city/CityList"));
const CityForm = lazy(() => import("@/pages/Central/city/CityForm"));

const CountryList = lazy(() => import("@/pages/Central/country/CountryList"));
const CountryForm = lazy(() => import("@/pages/Central/country/CountryForm"));

const CurrencyTypeList = lazy(
  () => import("@/pages/Central/currencytype/CurrencyTypeList")
);
const CurrencyTypeForm = lazy(
  () => import("@/pages/Central/currencytype/CurrencyTypeForm")
);

const Document = lazy(() => import("@/pages/Central/document/Document"));

const DocumentModuleList = lazy(
  () => import("@/pages/Central/document-module/DocumentModuleList")
);
const DocumentModuleForm = lazy(
  () => import("@/pages/Central/document-module/DocumentModuleForm")
);

const DocTypeList = lazy(() => import("@/pages/Central/doctype/DocTypeList"));
const DocTypeForm = lazy(() => import("@/pages/Central/doctype/DocTypeForm"));

const GroupList = lazy(() => import("@/pages/Central/group/GroupList"));
const GroupForm = lazy(() => import("@/pages/Central/group/GroupForm"));
const GroupModulePermission = lazy(
  () => import("@/pages/Central/group/GroupModulePermission")
);

const IndustryList = lazy(
  () => import("@/pages/Central/industry/IndustryList")
);
const IndustryForm = lazy(
  () => import("@/pages/Central/industry/IndustryForm")
);

const LegalStatusTypeList = lazy(
  () => import("@/pages/Central/legalstatustype/LegalStatusTypeList")
);
const LegalStatusTypeForm = lazy(
  () => import("@/pages/Central/legalstatustype/LegalStatusTypeForm")
);

const MasterMenuList = lazy(
  () => import("@/pages/Central/master-menu/MasterMenuList")
);
const MasterMenuForm = lazy(
  () => import("@/pages/Central/master-menu/MasterMenuForm")
);

const ModuleList = lazy(() => import("@/pages/Central/module/ModuleList"));
const ModuleForm = lazy(() => import("@/pages/Central/module/ModuleForm"));

const OrganizationList = lazy(
  () => import("@/pages/Central/organization/OrganizationList")
);
// const OrganizationForm = lazy(
//   () => import("@/pages/Central/organization/OrganizationForm")
// );
const OrganizationTeams = lazy(
  () =>
    import("@/pages/Central/organization/orgnization-team/OrganizationTeams")
);

const PageTemplateList = lazy(
  () => import("@/pages/Central/pagetemplate/PageTemplateList")
);
const PageTemplateForm = lazy(
  () => import("@/pages/Central/pagetemplate/PageTemplateForm")
);

const PicklistTypeList = lazy(
  () => import("@/pages/Central/picklisttype/PicklistTypeList")
);
const PicklistTypeForm = lazy(
  () => import("@/pages/Central/picklisttype/PicklistTypeForm")
);

const PicklistValueList = lazy(
  () => import("@/pages/Central/picklistvalue/PicklistValueList")
);
const PicklistValueForm = lazy(
  () => import("@/pages/Central/picklistvalue/PicklistValueForm")
);

const ScheduleList = lazy(
  () => import("@/pages/Central/schedule/ScheduleList")
);
const ScheduleForm = lazy(
  () => import("@/pages/Central/schedule/ScheduleForm")
);

const StateList = lazy(() => import("@/pages/Central/state/StateList"));
const StateForm = lazy(() => import("@/pages/Central/state/StateForm"));

const TaxTypeList = lazy(() => import("@/pages/Central/taxtype/TaxTypeList"));
const TaxTypeForm = lazy(() => import("@/pages/Central/taxtype/TaxTypeForm"));

const TaxCategoryList = lazy(
  () => import("@/pages/Central/taxcategory/TaxCategoryList")
);
const TaxCategoryForm = lazy(
  () => import("@/pages/Central/taxcategory/TaxCategoryForm")
);

const UserList = lazy(() => import("@/pages/Central/user/UserList"));
const UserForm = lazy(() => import("@/pages/Central/user/UserForm"));

const UserRoleList = lazy(
  () => import("@/pages/Central/userrole/UserRoleList")
);
const UserRoleForm = lazy(
  () => import("@/pages/Central/userrole/UserRoleForm")
);
const UserRightsAccordion = lazy(
  () => import("@/pages/Central/userrole/UserRightsAccordion")
);

const YearList = lazy(() => import("@/pages/Central/year/YearList"));
const YearForm = lazy(() => import("@/pages/Central/year/YearForm"));

const HelpCenterPage = lazy(
  () => import("@/pages/Central/help-center/HelpCenterPage")
);

const wrapWithSuspense = (
  Component: React.ComponentType
): React.ReactElement => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const getCentralRouteElement = (
  mapKey: string
): React.ReactElement | null => {
  const normalizedKey = mapKey.toLowerCase();

  switch (normalizedKey) {
    case "group_list":
      return wrapWithSuspense(GroupList);
    case "group_form":
      return wrapWithSuspense(GroupForm);
    case "group-module-permission":
      return wrapWithSuspense(GroupModulePermission);

    case "organization_list":
      return wrapWithSuspense(OrganizationList);
    case "organization_form":
      return wrapWithSuspense(OrganizationWizard);
    case "organization_team":
      return wrapWithSuspense(OrganizationTeams);

    case "user_list":
      return wrapWithSuspense(UserList);
    case "user_form":
      return wrapWithSuspense(UserForm);

    case "document":
      return wrapWithSuspense(Document);

    case "document_module_list":
      return wrapWithSuspense(DocumentModuleList);
    case "document_module_form":
      return wrapWithSuspense(DocumentModuleForm);

    case "user_role_list":
      return wrapWithSuspense(UserRoleList);
    case "user_role_form":
      return wrapWithSuspense(UserRoleForm);

    case "user_privilege":
      return wrapWithSuspense(UserRightsAccordion);

    case "picklist_type_list":
      return wrapWithSuspense(PicklistTypeList);
    case "picklist_type_form":
      return wrapWithSuspense(PicklistTypeForm);

    case "picklist_value_list":
      return wrapWithSuspense(PicklistValueList);
    case "picklist_value_form":
      return wrapWithSuspense(PicklistValueForm);

    case "year_list":
      return wrapWithSuspense(YearList);
    case "year_form":
      return wrapWithSuspense(YearForm);
    case "year":
      // Handle consolidated year mapkey - show list by default
      return wrapWithSuspense(YearList);

    case "master_menu_list":
      return wrapWithSuspense(MasterMenuList);
    case "master_menu_form":
      return wrapWithSuspense(MasterMenuForm);

    case "pagetemplate_list":
      return wrapWithSuspense(PageTemplateList);
    case "pagetemplate_form":
      return wrapWithSuspense(PageTemplateForm);

    case "address_type_list":
      return wrapWithSuspense(AddressTypeList);
    case "address_type_form":
      return wrapWithSuspense(AddressTypeForm);

    case "account_type_list":
      return wrapWithSuspense(AccountTypeList);
    case "account_type_form":
      return wrapWithSuspense(AccountTypeForm);

    case "country_list":
      return wrapWithSuspense(CountryList);
    case "country_form":
      return wrapWithSuspense(CountryForm);

    case "state_list":
      return wrapWithSuspense(StateList);
    case "state_form":
      return wrapWithSuspense(StateForm);

    case "tax_type_list":
      return wrapWithSuspense(TaxTypeList);
    case "tax_type_form":
      return wrapWithSuspense(TaxTypeForm);

    case "tax_category_list":
      return wrapWithSuspense(TaxCategoryList);
    case "tax_category_form":
      return wrapWithSuspense(TaxCategoryForm);

    case "city_list":
      return wrapWithSuspense(CityList);
    case "city_form":
      return wrapWithSuspense(CityForm);

    case "currency_type_list":
      return wrapWithSuspense(CurrencyTypeList);
    case "currency_type_form":
      return wrapWithSuspense(CurrencyTypeForm);

    case "industry_type_list":
      return wrapWithSuspense(IndustryList);
    case "industry_type_form":
      return wrapWithSuspense(IndustryForm);

    case "legal_status_type_list":
      return wrapWithSuspense(LegalStatusTypeList);
    case "legal_status_type_form":
      return wrapWithSuspense(LegalStatusTypeForm);

    case "doc_type_list":
      return wrapWithSuspense(DocTypeList);
    case "doc_type_form":
      return wrapWithSuspense(DocTypeForm);

    case "schedule_list":
      return wrapWithSuspense(ScheduleList);
    case "schedule_form":
      return wrapWithSuspense(ScheduleForm);

    case "module_list":
      return wrapWithSuspense(ModuleList);
    case "module_list_super":
      return wrapWithSuspense(ModuleList);
    case "module_form":
      return wrapWithSuspense(ModuleForm);
    case "module_form_super":
      return wrapWithSuspense(ModuleForm);

    case "help_center":
      return wrapWithSuspense(HelpCenterPage);

    default:
      return null;
  }
};
