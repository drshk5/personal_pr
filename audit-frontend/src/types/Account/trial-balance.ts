import type { BaseListParams } from "@/types";

export interface TrialBalanceFilter extends BaseListParams {
  dtFromDate: string;
  dtToDate: string;
  maxLevel?: number | null;
}

export interface TrialBalanceTreeNode {
  strScheduleGUID: string;
  strScheduleName: string;
  strScheduleCode: string;
  strParentScheduleGUID?: string | null;
  level: number;
  dblOpeningBalance_Base: number;
  dblDebit_Base: number;
  dblCredit_Base: number;
  dblBalance_Base: number;
  accounts: TrialBalanceAccountInfo[];
  children: TrialBalanceTreeNode[];
}

export interface TrialBalanceAccountInfo {
  strAccountGUID: string;
  strAccountName: string;
  strAccountCode?: string | null;
  dblOpeningBalance_Base: number;
  dblDebit_Base: number;
  dblCredit_Base: number;
  dblBalance_Base: number;
}

export interface TrialBalanceFlatItem {
  id: string;
  name: string;
  code?: string;
  level: number;
  opening: number;
  debit: number;
  credit: number;
  balance: number;
  isSchedule: boolean;
}

export interface TrialBalanceResponse {
  tree: TrialBalanceTreeNode[];
  dblTotalDebit_Base: number;
  dblTotalCredit_Base: number;
  filter?: TrialBalanceFilter | null;
  generatedAt: string;
}
