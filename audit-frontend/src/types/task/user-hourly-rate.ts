import type { BaseListParams, BackendPagedResponse } from "@/types";

export interface UserHourlyRateSimple {
  strUserHourlyRateGUID: string;
  strUserGUID: string;
  strBoardGUID: string;
  decHourlyRate: number;
  dEffectiveFrom: string;
  dEffectiveTo: string | null;
}

export interface UserHourlyRate {
  strUserHourlyRateGUID: string;
  strUserGUID: string;
  strBoardGUID: string;
  decHourlyRate: number;
  dEffectiveFrom: string;
  dEffectiveTo: string | null;
  strCurrencyTypeGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  dtCreatedOn: string;
  strCreatedByGUID: string;
  dtUpdatedOn: string | null;
  strUpdatedByGUID: string | null;
  strUserName: string;
  strBoardName: string;
  strCurrencyName: string;
  strCreatedByName: string;
  strUpdatedByName: string;
}

export interface UserHourlyRateCreate extends Omit<
  UserHourlyRateSimple,
  "strUserHourlyRateGUID"
> {
  strCurrencyTypeGUID: string;
}

export interface UserHourlyRateParams extends BaseListParams {
  strUserGUID?: string;
  strBoardGUID?: string;
  dEffectiveDate?: string;
}

export type ActiveRateParams = UserHourlyRateParams;

export type UserHourlyRateUpdate = UserHourlyRateCreate;

export type UserHourlyRateListResponse = BackendPagedResponse<UserHourlyRate[]>;
