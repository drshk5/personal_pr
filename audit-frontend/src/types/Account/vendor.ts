import type {
  ApiResponse,
  BaseListParams,
  BackendPagedResponse,
} from "@/types";

export interface VendorFile {
  strDocumentGUID: string;
  strDocumentAssociationGUID?: string | null;
  strFileName?: string | null;
  strFileType?: string | null;
  strFilePath?: string | null;
  strFileSize?: string | null;
}

export interface Vendor {
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
  dtCreatedOn: string | Date;
  strCreatedByGUID?: string | null;
  strCreatedByName?: string | null;
  dtUpdatedOn: string | Date;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  strFiles?: VendorFile[] | null;
}

// Simple response type - Omits master data fields
export type VendorSimple = Omit<
  Vendor,
  "strCurrencyTypeName" | "strCreatedByName" | "strUpdatedByName" | "strFiles"
>;

export interface VendorParams extends BaseListParams {
  strPartyType?: string;
  strCurrencyTypeGUIDs?: string | string[];
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

// Create/Update request types
export interface VendorCreate {
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

export type VendorUpdate = VendorCreate;

export type VendorListResponse = BackendPagedResponse<Vendor[]>;

export interface VendorTypeActiveParams {
  search?: string;
  strPartyType: string;
}

export type VendorTypeActiveResponse = ApiResponse<Vendor[]>;

// Vendor with addresses (for forms that need address data)
export interface VendorWithAddresses {
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
  // Billing address fields
  strAttention_billing?: string | null;
  strCountryGUID_billing?: string | null;
  strAddress_billing?: string | null;
  strStateGUID_billing?: string | null;
  strCityGUID_billing?: string | null;
  strPinCode_billing?: string | null;
  strPhone_billing?: string | null;
  strFaxNumber_billing?: string | null;
  // Shipping address fields
  strAttention_shipping?: string | null;
  strCountryGUID_shipping?: string | null;
  strAddress_shipping?: string | null;
  strStateGUID_shipping?: string | null;
  strCityGUID_shipping?: string | null;
  strPinCode_shipping?: string | null;
  strPhone_shipping?: string | null;
  strFaxNumber_shipping?: string | null;
}

// Vendor dropdown
export interface VendorDropdownParams {
  search?: string;
  strPartyType: string;
}

export interface VendorDropdownItem {
  strPartyGUID: string;
  strPartyName_Display: string;
}

// Document upload types
export interface VendorDocumentUploadRequest {
  id: string;
  files: File[];
  strRemoveDocumentAssociationGUIDs?: string[];
}

export interface VendorDocumentUploadResponse {
  message: string;
  uploadedFiles?: VendorFile[];
}
