import type {
  BaseListParams,
  DocumentFile,
  BackendPagedResponse,
} from "@/types";

export interface JournalVoucherRecurrence {
  strProfileName: string;
  strRepeatType: string;
  intRepeatEveryValue: number;
  strRepeatEveryUnit?: string | null;
  intRepeatOnDay?: number | null;
  strRepeatOnWeekday?: string | null;
  strCustomFrequencyJson?: string | null;
  dStartDate: string;
  dEndDate?: string | null;
  bolNeverExpires: boolean;
}

export interface JournalVoucherItemBase {
  intSeqNo: number;
  strAccountGUID: string;
  strDesc?: string | null;
  strRefNo?: string | null;
  dblDebit?: number | null;
  dblCredit?: number | null;
  dblDebit_BaseCurrency?: number | null;
  dblCredit_BaseCurrency?: number | null;
}

export interface JournalVoucherItemUpsert extends JournalVoucherItemBase {
  strJournal_Voucher_ItemGUID?: string | null;
}

export interface JournalVoucherItem extends JournalVoucherItemUpsert {
  strAccountName?: string | null;
  strCurrencyTypeName?: string | null;
}

export interface JournalVoucherBase {
  dJournal_VoucherDate: string;
  strRefNo?: string | null;
  strNotes?: string | null;
  strCurrencyTypeGUID?: string | null;
  dblExchangeRate: number;
  dtExchangeRateDate?: string | null;
  strStatus: string;
  bolIsJouranl_Adjustement: boolean;
  strReportingMethod: string;
}

export interface JournalVoucher extends JournalVoucherBase {
  strJournal_VoucherGUID: string;
  strJournal_VoucherNo: string;
  intJournal_VoucherSeqNo: number;
  strCurrencyTypeName?: string | null;
  strApprovedByGUID?: string | null;
  strApprovedByName?: string | null;
  dtApprovedOn?: string | null;
  strRejectedByGUID?: string | null;
  strRejectedByName?: string | null;
  dtRejectedOn?: string | null;
  strRejectedReason?: string | null;
  strJournal_Voucher_RecurringProfileGUID?: string | null;
  strRecurringProfileName?: string | null;
  strGroupGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  strYearName?: string | null;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn: string;
  strFiles?: DocumentFile[] | null;
  items?: JournalVoucherItemUpsert[] | null;
  recurringProfile?: JournalVoucherRecurrence | null;
}

export type JournalVoucherListItem = Omit<
  JournalVoucher,
  | "strYearName"
  | "strJournal_Voucher_RecurringProfileGUID"
  | "strRecurringProfileName"
  | "strFiles"
  | "items"
>;

export type JournalVoucherSimple = Omit<
  JournalVoucher,
  | "strCurrencyTypeName"
  | "strApprovedByGUID"
  | "strApprovedByName"
  | "dtApprovedOn"
  | "strRejectedByGUID"
  | "strRejectedByName"
  | "dtRejectedOn"
  | "strRejectedReason"
  | "strJournal_Voucher_RecurringProfileGUID"
  | "strRecurringProfileName"
  | "strYearName"
  | "strCreatedByName"
  | "strUpdatedByName"
  | "strFiles"
  | "items"
>;

export interface JournalVoucherParams extends BaseListParams {
  fromDate?: string;
  toDate?: string;
  strStatus?: string;
  strCurrencyTypeGUIDs?: string; // Comma-separated list of currency type GUIDs
  bolIsJouranl_Adjustement?: boolean;
  strCreatedByGUIDs?: string; // Comma-separated list of created-by GUIDs
  strUpdatedByGUIDs?: string; // Comma-separated list of updated-by GUIDs
}

export interface PendingApprovalParams extends BaseListParams {
  fromDate?: string;
  toDate?: string;
  strCurrencyTypeGUIDs?: string; // Comma-separated list of currency type GUIDs
}

export interface JournalVoucherCreate extends JournalVoucherBase {
  strNotes: string;
  items?: JournalVoucherItemBase[] | null;
  recurrence?: JournalVoucherRecurrence | null;
}

export interface JournalVoucherUpdate extends JournalVoucherBase {
  strNotes: string;
  items?: JournalVoucherItemUpsert[] | null;
  strRemoveJournalVoucherItemGUIDs?: string[] | null;
  recurrence?: JournalVoucherRecurrence | null;
}

export type JournalVoucherListResponse = BackendPagedResponse<
  JournalVoucherListItem[]
>;

export interface JournalVoucherDropdownItem {
  strJournal_VoucherGUID: string;
  strJournal_VoucherNo: string;
  intTotalDocuments: number;
}

export interface JournalVoucherDropdownParams {
  search?: string;
}

export interface ChangeStatusRequest {
  strStatus: string;
  strRejectedReason?: string | null;
}

export interface BulkChangeStatusRequest {
  strJournal_VoucherGUIDs: string[];
  strStatus: string;
  strRejectedReason?: string | null;
}
