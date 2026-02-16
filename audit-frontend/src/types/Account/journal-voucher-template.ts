import type { ApiResponse, BaseListParams, PagedResponse } from "@/types";
import type {
  JournalVoucherTemplateItemUpsert,
  JournalVoucherTemplateItemCreateInline,
} from "./journal-voucher-template-item";

// Response DTO for list view (without items)
export interface JournalVoucherTemplate {
  strJournal_Voucher_TemplateGUID: string;
  strTemplateName: string;
  strRefNo?: string | null;
  strNotes?: string | null;
  strCurrencyTypeGUID: string;
  strCurrencyTypeName?: string | null;
  bolIsJouranl_Adjustement: boolean;
  dblExchangeRate: number;
  strCreatedByGUID: string;
  strCreatedByName?: string | null;
  dtCreatedOn: string;
  strUpdatedByGUID?: string | null;
  strUpdatedByName?: string | null;
  dtUpdatedOn?: string | null;
}

export interface JournalVoucherTemplateDetail extends JournalVoucherTemplate {
  items?: JournalVoucherTemplateItemUpsert[] | null;
}

export interface JournalVoucherTemplateParams extends BaseListParams {
  search?: string;
  strYearGUID?: string;
  ascending?: boolean;
}

export interface JournalVoucherTemplateCreate {
  strTemplateName: string;
  strRefNo?: string | null;
  strNotes?: string | null;
  strCurrencyTypeGUID: string;
  bolIsJouranl_Adjustement: boolean;
  dblExchangeRate: number;
  items?: JournalVoucherTemplateItemCreateInline[] | null;
}

export interface JournalVoucherTemplateUpdate {
  strTemplateName: string;
  strRefNo?: string | null;
  strNotes?: string | null;
  strCurrencyTypeGUID: string;
  bolIsJouranl_Adjustement: boolean;
  dblExchangeRate: number;
  items?: JournalVoucherTemplateItemUpsert[] | null;
}

export type JournalVoucherTemplateListResponse = ApiResponse<
  PagedResponse<JournalVoucherTemplate>
>;

export interface JournalVoucherTemplateDropdownItem {
  strJournal_Voucher_TemplateGUID: string;
  strTemplateName: string;
  strNotes?: string | null;
  intItemCount: number;
  dblTotalAmount: number;
}

export interface JournalVoucherTemplateDropdownParams {
  search?: string;
}
