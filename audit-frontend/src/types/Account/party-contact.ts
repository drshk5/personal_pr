import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface PartyContact {
  strParty_ContactGUID: string;
  strPartyGUID: string;
  strOrganizationGUID: string;
  strGroupGUID: string;
  strPartyName?: string | null;
  strSalutation?: string | null;
  strFirstName: string;
  strLastName?: string | null;
  strEmail?: string | null;
  strPhoneNo_Work?: string | null;
  strPhoneNo?: string | null;
  strSkype?: string | null;
  strDesignation?: string | null;
  strDepartment?: string | null;
  strTwitter?: string | null;
  strFacebook?: string | null;
  strInstagram?: string | null;
  dtCreatedOn: string;
  strCreatedByGUID?: string | null;
  strCreatedByName?: string | null;
  dtUpdatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
}

export interface PartyContactSimple {
  strParty_ContactGUID: string;
  strFirstName: string;
  strLastName?: string | null;
}

export type PartyContactSimpleResponse = Omit<
  PartyContact,
  "strPartyName" | "strCreatedByName" | "strUpdatedByName"
>;

export type PartyContactListResponse = BackendPagedResponse<PartyContact[]>;

export interface PartyContactParams extends BaseListParams {
  strPartyGUID?: string;
  strCreatedByGUIDs?: string | string[];
  strUpdatedByGUIDs?: string | string[];
}

export type PartyContactCreate = Omit<
  PartyContact,
  | "strParty_ContactGUID"
  | "strOrganizationGUID"
  | "strGroupGUID"
  | "strPartyName"
  | "dtCreatedOn"
  | "strCreatedByGUID"
  | "strCreatedByName"
  | "dtUpdatedOn"
  | "strUpdatedByGUID"
  | "strUpdatedByName"
>;

export type PartyContactUpdate = PartyContactCreate;
