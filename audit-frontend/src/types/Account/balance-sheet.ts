import type { BaseListParams } from "@/types";

export interface BalanceSheetFilter extends BaseListParams {
  dtFromDate: string;
  dtToDate: string;
  strGroupGUID?: string;
  maxLevel?: number | null;
}

export interface BalanceSheetAccount {
  strAccountGUID: string;
  strAccountCode: string;
  strAccountName: string;

  // Essential balance fields only
  dblOpeningBalance_Base: number;
  dblTotalDebit_Base: number;
  dblTotalCredit_Base: number;
  dblBalance_Base: number;

  bolIsActive: boolean;
}

export interface BalanceSheetScheduleNode {
  strScheduleGUID: string;
  strScheduleCode: string;
  strScheduleName: string;
  intLevel: number;
  intAccountCount: number;

  // Essential balance fields only
  dblOpeningBalance_Base: number;
  dblTotalDebit_Base: number;
  dblTotalCredit_Base: number;
  dblScheduleBalance_Base: number;

  accounts: BalanceSheetAccount[];
  children: BalanceSheetScheduleNode[];
}

export interface BalanceSheetItem {
  intRowID: number;
  strScheduleGUID: string;
  strScheduleCode: string;
  strScheduleName: string;
  intLevel: number;
  strParentScheduleGUID?: string | null;
  intAccountCount: number;

  // Schedule-level opening balance fields
  dblScheduleOpeningDebit_Base: number;
  dblScheduleOpeningCredit_Base: number;
  dblScheduleOpeningBalance_Base: number;

  // Schedule-level period balance fields
  dblSchedulePeriodDebit_Base: number;
  dblSchedulePeriodCredit_Base: number;
  dblSchedulePeriodBalance_Base: number;

  // Schedule-level closing balance
  dblScheduleBalance_Base: number;

  // Account fields
  strAccountGUID?: string | null;
  strAccountCode?: string | null;
  strAccountName?: string | null;

  // Account-level opening balance fields
  dblAccountOpeningDebit_Base: number;
  dblAccountOpeningCredit_Base: number;
  dblAccountOpeningBalance_Base: number;

  // Account-level period balance fields
  dblAccountPeriodDebit_Base: number;
  dblAccountPeriodCredit_Base: number;
  dblAccountPeriodBalance_Base: number;

  // Account-level closing balance
  dblAccountBalance_Base: number;

  dtFromDate: string;
  dtToDate: string;
}

export interface BalanceSheetResponse {
  scheduleTree: BalanceSheetScheduleNode[];
  dblTotalAssets: number;
  dblTotalLiabilities: number;
  dblTotalCapital: number;
  dtFromDate: string;
  dtToDate: string;
  generatedAt: string;
}
