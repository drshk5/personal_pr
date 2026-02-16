import type {
  BaseListParams,
  BackendPagedResponse,
} from "@/types";

export interface JournalVoucherRecurringProfileBase {
  strProfileName: string;
  strJournal_VoucherGUID?: string; // Optional for create operations
  strRepeatType: string; // Daily | Weekly | Monthly | Yearly | Custom
  intRepeatEveryValue: number;
  strRepeatEveryUnit?: string | null; // Day | Week | Month | Year
  intRepeatOnDay?: number | null; // Day of month (for monthly)
  strRepeatOnWeekday?: string | null; // e.g. Monday (for weekly)
  strCustomFrequencyJson?: string | null; // JSON for advanced custom repeat logic
  dStartDate: string;
  dEndDate?: string | null;
  bolNeverExpires: boolean;
  strStatus?: string; // Can be provided for create
}

export interface JournalVoucherRecurringProfileCreate
  extends Omit<JournalVoucherRecurringProfileBase, "strStatus"> {
  // Create DTO - status not provided
}

export interface JournalVoucherRecurringProfileUpdate
  extends JournalVoucherRecurringProfileBase {
  strJournal_Voucher_RecurringProfileGUID: string;
  strStatus?: string; // Active | Paused | Completed
}

export interface JournalVoucherRecurringProfile
  extends JournalVoucherRecurringProfileBase {
  strJournal_Voucher_RecurringProfileGUID: string;
  strJournal_VoucherNo?: string | null;
  dtNextRunDate?: string | null;
  strStatus: string;
  strGroupGUID: string;
  strOrganizationGUID: string;
  strYearGUID: string;
  strYearName?: string | null;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn?: string | null;
}

export type JournalVoucherRecurringProfileListItem = JournalVoucherRecurringProfile;

export interface JournalVoucherRecurringProfileParams extends BaseListParams {
  strProfileName?: string;
  strRepeatType?: string;
  strStatus?: string;
  fromStartDate?: string;
  toStartDate?: string;
  fromNextRunDate?: string;
  toNextRunDate?: string;
}

export type JournalVoucherRecurringProfileListResponse = BackendPagedResponse<
  JournalVoucherRecurringProfileListItem[]
>;
