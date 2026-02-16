import type { BaseListParams } from "@/types";

export interface LedgerReportFilter extends BaseListParams {
  dtFromDate: string;
  dtToDate: string;
  strAccountGUID?: string | null;
  strGroupGUID?: string;
  strOrganizationGUID?: string;
  strYearGUID?: string;
}

export interface LedgerReportItem {
  strLedgerGUID: string;
  strAccountGUID: string;
  strAccountName?: string | null;
  strAccountCode?: string | null;
  dtTradeDate: string;
  strNarration?: string | null;
  strBillNo?: string | null;
  strVoucherType?: string | null;
  strVoucherGUID?: string | null;
  dblDebit_Base: number;
  dblCredit_Base: number;
  dblBalance_Base: number;
  strBalanceType?: string | null; // "Dr" or "Cr"
}

export interface LedgerReportSummary {
  dblTotalDebit_Base: number;
  dblTotalCredit_Base: number;
  dblClosingBalance_Base: number;
  strClosingBalanceType?: string | null;
  dblOpeningBalance_Base: number;
  strOpeningBalanceType?: string | null;
}

export interface LedgerReportResponse {
  items: LedgerReportItem[];
  summary?: LedgerReportSummary | null;
  filter?: LedgerReportFilter | null;
  generatedAt: string;
}
