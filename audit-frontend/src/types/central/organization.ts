import type { ApiResponse, PagedResponse } from "../common";

export interface Organization {
  strOrganizationGUID: string;
  strOrganizationName: string;
  strDescription?: string;
  strPAN?: string;
  strTAN?: string;
  strCIN?: string;
  strParentOrganizationGUID?: string;
  strParentOrganizationName?: string;
  bolIsActive: boolean;
  bolIsTaxApplied: boolean;
  strIndustryGUID?: string;
  strIndustryCodeName?: string;
  strUDFCode?: string;
  strLegalStatusTypeGUID?: string;
  strLegalStatusCodeName?: string;
  strCurrencyTypeGUID?: string;
  strCurrencyTypeName?: string;
  dtClientAcquiredDate?: string;
  strLogo?: string;
  strGroupGUID: string;
  strCreatedByGUID: string;
  strCreatedBy?: string;
  dtCreatedOn: string;
  strUpdatedByGUID?: string;
  strUpdatedBy?: string;
  dtUpdatedOn?: string;
  bolSystemCreated: boolean;
  strFormattedCreatedOn: string;
  strFormattedUpdatedOn?: string;
  strFormattedClientAcquiredDate?: string;
  FormattedClientAcquiredDate?: string;

  // Country field
  strCountryGUID?: string;
  strCountryName?: string;

  // Tax configuration fields
  strTaxTypeGUID?: string;
  strTaxTypeName?: string;
  strTaxTypeCode?: string;
  strTaxRegNo?: string;
  strStateGUID?: string;
  strStateName?: string;
  dtRegistrationDate?: string;
  bolIsDefaultTaxConfig: boolean;
  jsonTaxSettings?: string | null;

  strAttention_billing?: string;
  strCountryGUID_billing?: string;
  strCountryName_billing?: string;
  strAddress_billing?: string;
  strStateGUID_billing?: string;
  strStateName_billing?: string;
  strCityGUID_billing?: string;
  strCityName_billing?: string;
  strPinCode_billing?: string;
  strPhone_billing?: string;
  strFaxNumber_billing?: string;

  strAttention_shipping?: string;
  strCountryGUID_shipping?: string;
  strCountryName_shipping?: string;
  strAddress_shipping?: string;
  strStateGUID_shipping?: string;
  strStateName_shipping?: string;
  strCityGUID_shipping?: string;
  strCityName_shipping?: string;
  strPinCode_shipping?: string;
  strPhone_shipping?: string;
  strFaxNumber_shipping?: string;
}

export interface CreateOrganizationDto {
  strOrganizationName: string;
  strDescription?: string | null;
  strPAN?: string | null;
  strTAN?: string | null;
  strCIN?: string | null;
  strParentOrganizationGUID?: string | null;
  bolIsActive?: boolean;
  bolIsTaxApplied?: boolean;
  strIndustryGUID?: string | null;
  strUDFCode?: string | null;
  strLegalStatusTypeGUID?: string | null;
  strCurrencyTypeGUID?: string | null;
  dtClientAcquiredDate?: string | null;
  LogoFile?: File;
  strLogo?: string;

  // Country for tax configuration
  strCountryGUID?: string | null;

  // Tax Configuration fields (optional - only for organizations that need tax setup)
  strTaxTypeGUID?: string | null;
  strTaxRegNo?: string | null;
  strStateGUID?: string | null;
  dtRegistrationDate?: string | null;
  bolIsDefaultTaxConfig?: boolean;
  jsonTaxSettings?: string | null;

  // Billing address
  strAttention_billing?: string | null;
  strCountryGUID_billing?: string | null;
  strAddress_billing?: string | null;
  strStateGUID_billing?: string | null;
  strCityGUID_billing?: string | null;
  strPinCode_billing?: string | null;
  strPhone_billing?: string | null;
  strFaxNumber_billing?: string | null;

  // Shipping address
  strAttention_shipping?: string | null;
  strCountryGUID_shipping?: string | null;
  strAddress_shipping?: string | null;
  strStateGUID_shipping?: string | null;
  strCityGUID_shipping?: string | null;
  strPinCode_shipping?: string | null;
  strPhone_shipping?: string | null;
  strFaxNumber_shipping?: string | null;

  // Year creation fields for newly created organization (date-only)
  dtStartDate?: string | null;
  dtEndDate?: string | null;
  strYearName?: string | null;
  strPreviousYearGUID?: string | null;
  strNextYearGUID?: string | null;
}

export interface UpdateOrganizationDto {
  strOrganizationName: string;
  strDescription?: string | null;
  strPAN?: string | null;
  strTAN?: string | null;
  strCIN?: string | null;
  strParentOrganizationGUID?: string | null;
  bolIsActive: boolean;
  bolIsTaxApplied: boolean;
  strIndustryGUID?: string | null;
  strUDFCode?: string | null;
  strLegalStatusTypeGUID?: string | null;
  strCurrencyTypeGUID?: string | null;
  dtClientAcquiredDate?: string | null;
  LogoFile?: File;
  RemoveLogo?: boolean;
  LogoToRemove?: string;
  strLogo?: string;

  // Country for tax configuration
  strCountryGUID?: string | null;

  // Tax Configuration fields (optional - only for organizations that need tax setup)
  strTaxTypeGUID?: string | null;
  strTaxRegNo?: string | null;
  strStateGUID?: string | null;
  dtRegistrationDate?: string | null;
  bolIsDefaultTaxConfig?: boolean;
  jsonTaxSettings?: string | null;

  // Billing address
  strAttention_billing?: string | null;
  strCountryGUID_billing?: string | null;
  strAddress_billing?: string | null;
  strStateGUID_billing?: string | null;
  strCityGUID_billing?: string | null;
  strPinCode_billing?: string | null;
  strPhone_billing?: string | null;
  strFaxNumber_billing?: string | null;

  // Shipping address
  strAttention_shipping?: string | null;
  strCountryGUID_shipping?: string | null;
  strAddress_shipping?: string | null;
  strStateGUID_shipping?: string | null;
  strCityGUID_shipping?: string | null;
  strPinCode_shipping?: string | null;
  strPhone_shipping?: string | null;
  strFaxNumber_shipping?: string | null;
}

export type OrganizationListResponse = ApiResponse<PagedResponse<Organization>>;

export interface OrganizationParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  ascending?: boolean;
  bolIsActive?: boolean;
  strIndustryGUID?: string;
  strLegalStatusTypeGUID?: string;
  strParentOrganizationGUID?: string;
  strCreatedByGUIDs?: string[];
  strUpdatedByGUIDs?: string[];
}

export type UserOrganization = {
  strOrganizationGUID: string;
  strOrganizationName: string;
};

export type UserOrganizationsResponse = {
  statusCode: number;
  message?: string;
  Message?: string;
  data: UserOrganization[];
};

export type ActiveOrganizationsResponse = {
  statusCode: number;
  message?: string;
  Message?: string;
  data: Organization[];
};

export type ParentOrganizationsResponse = {
  statusCode: number;
  message?: string;
  Message?: string;
  data: UserOrganization[];
  totalCount?: number;
  excludedOrganizationGUID?: string;
  searchTerm?: string;
};

export interface OrganizationExportParams {
  format: "excel" | "csv";
}

export interface OrganizationSelectionResponse {
  statusCode: number;
  message: string;
  data: {
    strUserGUID: string;
    strEmailId: string;
    strName: string | null;
    strGroupGUID: string;
    strOrganizationGUID: string;
    strRoleGUID: string;
    token?: string;
  };
}

export interface OrganizationSelectionRequest {
  strOrganizationGUID: string;
  strYearGUID?: string;
}

export interface ExchangeRateResponse {
  Rate: number;
  FromCurrency: string;
  ToCurrency: string;
  FromCurrencyName: string;
  ToCurrencyName: string;
}

export interface ExchangeRateParams {
  strFromCurrencyGUID: string;
}

export interface ParentOrganizationParams {
  strOrganizationGUID: string;
  search?: string;
}
