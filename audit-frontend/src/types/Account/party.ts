import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface PartyFile {
  strDocumentGUID: string;
  strDocumentAssociationGUID?: string | null;
  strFileName?: string | null;
  strFileType?: string | null;
  strFilePath?: string | null;
  strFileSize?: string | null;
}

// Matches MPartyAddressResponseDto from backend
export interface PartyAddress {
  strAttention?: string | null;
  strCountryGUID?: string | null;
  strCountryName?: string | null;
  strAddressLine?: string | null;
  strStateGUID?: string | null;
  strStateName?: string | null;
  strCityGUID?: string | null;
  strCityName?: string | null;
  strPinCode?: string | null;
  strPhone?: string | null;
  strFaxNumber?: string | null;
}

// Matches MPartyActiveResponseDto from backend (minimal party for type-active endpoint)
export interface PartyActive {
  strPartyGUID: string;
  strPartyName_Display?: string | null;
  strCompanyName?: string | null;
  strPhoneNoWork?: string | null;
  strPhoneNoPersonal?: string | null;
  strEmail?: string | null;
}

export interface Party {
  strPartyGUID: string;
  strPartyType: string;
  strSalutation?: string | null;
  strFirstName: string;
  strLastName?: string | null;
  strCompanyName?: string | null;
  strPartyName_Display: string;
  strUDFCode: string;
  strEmail: string;
  strPhoneNoWork?: string | null;
  strPhoneNoPersonal?: string | null;
  strPAN: string;
  strCurrencyTypeGUID?: string | null;
  strCurrencyTypeName?: string | null;
  intPaymentTerms_inDays?: number | null;
  strPartyLanguage?: string | null;
  strTaxRegNo?: string | null;
  strWebsiteURL: string;
  strDepartment: string;
  strDesignation: string;
  strTwitter: string;
  strSkype: string;
  strFacebook: string;
  strInstagram: string;
  dblIntrest_per?: number | null;
  strRemarks: string;
  dtCreatedOn: string | Date;
  strCreatedByGUID?: string | null;
  strCreatedByName?: string | null;
  dtUpdatedOn: string | Date;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  strFiles?: PartyFile[] | null;

  strAttention_billing?: string | null;
  strCountryGUID_billing?: string | null;
  strCountryName_billing?: string | null;
  strAddress_billing?: string | null;
  strStateGUID_billing?: string | null;
  strStateName_billing?: string | null;
  strCityGUID_billing?: string | null;
  strCityName_billing?: string | null;
  strPinCode_billing?: string | null;
  strPhone_billing?: string | null;
  strFaxNumber_billing?: string | null;

  strAttention_shipping?: string | null;
  strCountryGUID_shipping?: string | null;
  strCountryName_shipping?: string | null;
  strAddress_shipping?: string | null;
  strStateGUID_shipping?: string | null;
  strStateName_shipping?: string | null;
  strCityGUID_shipping?: string | null;
  strCityName_shipping?: string | null;
  strPinCode_shipping?: string | null;
  strPhone_shipping?: string | null;
  strFaxNumber_shipping?: string | null;
}

export type PartySimple = Omit<
  Party,
  "strCurrencyTypeName" | "strCreatedByName" | "strUpdatedByName" | "strFiles"
>;

export interface PartyParams extends BaseListParams {
  strPartyType: string;
  strCurrencyTypeGUIDs?: string | string[];
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

export interface PartyCreate {
  strPartyType: string;
  strSalutation?: string | null;
  strFirstName: string;
  strLastName?: string | null;
  strCompanyName?: string | null;
  strPartyName_Display?: string | null;
  strUDFCode: string;
  strEmail?: string | null;
  strPhoneNoWork?: string | null;
  strPhoneNoPersonal?: string | null;
  strPAN?: string | null;
  strCurrencyTypeGUID?: string | null;
  intPaymentTerms_inDays?: number | null;
  strPartyLanguage?: string | null;
  strTaxRegNo?: string | null;
  strWebsiteURL?: string | null;
  strDepartment?: string | null;
  strDesignation?: string | null;
  strTwitter?: string | null;
  strSkype?: string | null;
  strFacebook?: string | null;
  strInstagram?: string | null;
  dblIntrest_per?: number | null;
  strRemarks?: string | null;

  strAttention_billing?: string | null;
  strCountryGUID_billing?: string | null;
  strAddress_billing?: string | null;
  strStateGUID_billing?: string | null;
  strCityGUID_billing?: string | null;
  strPinCode_billing?: string | null;
  strPhone_billing?: string | null;
  strFaxNumber_billing?: string | null;

  strAttention_shipping?: string | null;
  strCountryGUID_shipping?: string | null;
  strAddress_shipping?: string | null;
  strStateGUID_shipping?: string | null;
  strCityGUID_shipping?: string | null;
  strPinCode_shipping?: string | null;
  strPhone_shipping?: string | null;
  strFaxNumber_shipping?: string | null;
}

export type PartyUpdate = PartyCreate;

export type PartyListResponse = BackendPagedResponse<Party[]>;

export interface PartyTypeActiveParams {
  search?: string;
  strPartyType: string;
}
export type PartyTypeActiveResponse = PartyActive[];

export interface PartyWithLocations {
  strPartyGUID: string;
  strPartyType: string;
  strSalutation?: string | null;
  strFirstName: string;
  strLastName?: string | null;
  strCompanyName?: string | null;
  strPartyName_Display: string;
  strUDFCode: string;
  strEmail: string;
  strPhoneNoWork?: string | null;
  strPhoneNoPersonal?: string | null;
  strPAN: string;
  strCurrencyTypeGUID?: string | null;
  strCurrencyTypeName?: string | null;
  intPaymentTerms_inDays?: number | null;
  strPartyLanguage?: string | null;
  strTaxRegNo?: string | null;
  // New API keys (preferred)
  billingAddress?: PartyAddress | null;
  shippingAddress?: PartyAddress | null;
  // Backward compatibility with older API payloads
  BillingAddress?: PartyAddress | null;
  ShippingAddress?: PartyAddress | null;
}

// For updating billing and shipping address fields only
export interface UpdateBillingAndShippingAddress {
  strAttention_billing?: string | null;
  strCountryGUID_billing?: string | null;
  strAddress_billing?: string | null;
  strStateGUID_billing?: string | null;
  strCityGUID_billing?: string | null;
  strPinCode_billing?: string | null;
  strPhone_billing?: string | null;
  strFaxNumber_billing?: string | null;

  strAttention_shipping?: string | null;
  strCountryGUID_shipping?: string | null;
  strAddress_shipping?: string | null;
  strStateGUID_shipping?: string | null;
  strCityGUID_shipping?: string | null;
  strPinCode_shipping?: string | null;
  strPhone_shipping?: string | null;
  strFaxNumber_shipping?: string | null;
}

// Matches MPartyDropdownDto from backend
export interface PartyDropdown {
  strPartyGUID: string;
  strPartyName_Display?: string | null;
}
