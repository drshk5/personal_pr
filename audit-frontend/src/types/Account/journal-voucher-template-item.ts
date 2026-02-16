// Lightweight item DTO for embedding in Template create/update
export interface JournalVoucherTemplateItemUpsert {
  strJournal_Voucher_Template_ItemGUID?: string | null;
  intSeqNo: number;
  strAccountGUID: string;
  strAccountName?: string | null;
  strDesc?: string | null;
  strRefNo?: string | null;
  dblDebit?: number | null;
  dblCredit?: number | null;
  dblDebit_BaseCurrency?: number | null;
  dblCredit_BaseCurrency?: number | null;
}

export interface JournalVoucherTemplateItemCreateInline {
  intSeqNo: number;
  strAccountGUID: string;
  strDesc?: string | null;
  strRefNo?: string | null;
  dblDebit?: number | null;
  dblCredit?: number | null;
  dblDebit_BaseCurrency?: number | null;
  dblCredit_BaseCurrency?: number | null;
}

export interface JournalVoucherTemplateItem {
  strJournal_Voucher_Template_ItemGUID: string;
  strJournal_Voucher_TemplateGUID: string;
  intSeqNo: number;
  strAccountGUID: string;
  strAccountName?: string | null;
  strDesc?: string | null;
  strRefNo?: string | null;
  dblDebit?: number | null;
  dblCredit?: number | null;
  dblDebit_BaseCurrency?: number | null;
  dblCredit_BaseCurrency?: number | null;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn?: string | null;
}
