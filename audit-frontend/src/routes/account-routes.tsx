import React, { Suspense, lazy } from "react";
import { PageLoader } from "@/components/layout/page-loader";

const GeneralAccountForm = lazy(
  () => import("@/pages/Account/account/GeneralAccountForm")
);
const GeneralAccountList = lazy(
  () => import("@/pages/Account/account/GeneralAccountList")
);

const BankForm = lazy(() => import("@/pages/Account/bank/BankForm"));
const BankList = lazy(() => import("@/pages/Account/bank/BankList"));

const ItemForm = lazy(() => import("@/pages/Account/item/ItemForm"));
const ItemList = lazy(() => import("@/pages/Account/item/ItemList"));

const UnitForm = lazy(() => import("@/pages/Account/unit/UnitForm"));
const UnitList = lazy(() => import("@/pages/Account/unit/UnitList"));

const InvoiceList = lazy(
  () => import("@/pages/Account/invoice/SalesInvoiceList")
);
const InvoiceForm = lazy(
  () => import("@/pages/Account/invoice/SalesInvoiceForm")
);
const InvoiceApprovals = lazy(
  () => import("@/pages/Account/invoice/SalesInvoiceApprovals")
);

const PurchaseInvoiceList = lazy(
  () => import("@/pages/Account/purchase-invoice/PurchaseInvoiceList")
);
const PurchaseInvoiceForm = lazy(
  () => import("@/pages/Account/purchase-invoice/PurchaseInvoiceForm")
);
const PurchaseInvoiceApprovals = lazy(
  () => import("@/pages/Account/purchase-invoice/PurchaseInvoiceApprovals")
);

const JournalVoucherList = lazy(
  () => import("@/pages/Account/journalvoucher/JournalVoucherList")
);
const JournalVoucherForm = lazy(
  () => import("@/pages/Account/journalvoucher/JournalVoucherForm")
);
const JournalVoucherApprovals = lazy(
  () => import("@/pages/Account/journalvoucher/JournalVoucherApprovals")
);

const RecurringProfileList = lazy(
  () =>
    import("@/pages/Account/journalvoucher-recurring/JournalVoucherRecurringList")
);
const RecurringProfileForm = lazy(
  () =>
    import("@/pages/Account/journalvoucher-recurring/JournalVoucherRecurringForm")
);

const PaymentReceiptList = lazy(
  () => import("@/pages/Account/payment-receipt/PaymentReceiptList")
);
const PaymentReceiptForm = lazy(
  () => import("@/pages/Account/payment-receipt/PaymentReceiptForm")
);
const PaymentReceiptApprovals = lazy(
  () => import("@/pages/Account/payment-receipt/PaymentReceiptApprovals")
);

const PaymentReceivedList = lazy(
  () => import("@/pages/Account/payment-received/PaymentReceivedList")
);
const PaymentReceivedForm = lazy(
  () => import("@/pages/Account/payment-received/PaymentReceivedForm")
);
const PaymentReceivedApprovals = lazy(
  () => import("@/pages/Account/payment-received/PaymentReceivedApprovals")
);

const PaymentMadeList = lazy(
  () => import("@/pages/Account/payment-made/PaymentMadeList")
);
const PaymentMadeForm = lazy(
  () => import("@/pages/Account/payment-made/PaymentMadeForm")
);
const PaymentMadeApprovals = lazy(
  () => import("@/pages/Account/payment-made/PaymentMadeApprovals")
);

const LedgerReportPage = lazy(
  () => import("@/pages/Account/ledger-report/LedgerReportPage")
);

const TrialBalancePage = lazy(
  () => import("@/pages/Account/trial-balance/TrialBalancePage")
);

const BalanceSheetPage = lazy(
  () => import("@/pages/Account/balance-sheet/BalanceSheetPage")
);

const ProfitAndLossPage = lazy(
  () => import("@/pages/Account/profit-and-loss/ProfitAndLossPage")
);

const PartyForm = lazy(() => import("@/pages/Account/party/PartyForm"));
const PartyList = lazy(() => import("@/pages/Account/party/PartyList"));

const VendorForm = lazy(() => import("@/pages/Account/vendor/VendorForm"));
const VendorList = lazy(() => import("@/pages/Account/vendor/VendorList"));

const OpeningBalanceList = lazy(
  () => import("@/pages/Account/opening-balance/OpeningBalanceList")
);
const OpeningBalanceForm = lazy(
  () => import("@/pages/Account/opening-balance/OpeningBalanceForm")
);

const RenameSchedulesPage = lazy(() =>
  import("@/pages/Account/rename-schedule/RenameSchedulesPage").then(
    (module) => ({ default: module.RenameSchedulesPage })
  )
);

const wrapWithSuspense = (
  Component: React.ComponentType
): React.ReactElement => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const getAccountRouteElement = (
  mapKey: string
): React.ReactElement | null => {
  const normalizedKey = mapKey.toLowerCase();

  switch (normalizedKey) {
    case "account_list":
      return wrapWithSuspense(GeneralAccountList);
    case "account_form":
      return wrapWithSuspense(GeneralAccountForm);

    case "bank_list":
      return wrapWithSuspense(BankList);
    case "bank_form":
      return wrapWithSuspense(BankForm);

    case "item_list":
      return wrapWithSuspense(ItemList);
    case "item_form":
      return wrapWithSuspense(ItemForm);

    case "unit_list":
      return wrapWithSuspense(UnitList);
    case "unit_form":
      return wrapWithSuspense(UnitForm);

    case "customer_list":
      return wrapWithSuspense(PartyList);
    case "customer_form":
      return wrapWithSuspense(PartyForm);

    case "vendor_list":
      return wrapWithSuspense(VendorList);
    case "vendor_form":
      return wrapWithSuspense(VendorForm);

    case "journal_voucher_list":
      return wrapWithSuspense(JournalVoucherList);
    case "journal_voucher_form":
      return wrapWithSuspense(JournalVoucherForm);
    case "journal_voucher_approval":
      return wrapWithSuspense(JournalVoucherApprovals);

    case "journal_voucher_recurring_profile_list":
    case "journal_voucher_recurring_list":
      return wrapWithSuspense(RecurringProfileList);
    case "journal_voucher_recurring_profile_form":
    case "journal_voucher_recurring_form":
      return wrapWithSuspense(RecurringProfileForm);

    case "invoice_list":
      return wrapWithSuspense(InvoiceList);
    case "invoice_form":
      return wrapWithSuspense(InvoiceForm);
    case "invoice_approval":
      return wrapWithSuspense(InvoiceApprovals);

    case "purchase_invoice_list":
      return wrapWithSuspense(PurchaseInvoiceList);
    case "purchase_invoice_form":
      return wrapWithSuspense(PurchaseInvoiceForm);
    case "purchase_invoice_approval":
      return wrapWithSuspense(PurchaseInvoiceApprovals);

    case "payment_receipt_list":
      return wrapWithSuspense(PaymentReceiptList);

    case "payment_receipt_form":
      return wrapWithSuspense(PaymentReceiptForm);

    case "payment_receipt_approval":
      return wrapWithSuspense(PaymentReceiptApprovals);

    case "payment_received_list":
      return wrapWithSuspense(PaymentReceivedList);

    case "payment_received_form":
      return wrapWithSuspense(PaymentReceivedForm);

    case "payment_received_approval":
      return wrapWithSuspense(PaymentReceivedApprovals);

    case "payment_made_list":
      return wrapWithSuspense(PaymentMadeList);

    case "payment_made_form":
      return wrapWithSuspense(PaymentMadeForm);

    case "payment_made_approval":
      return wrapWithSuspense(PaymentMadeApprovals);

    case "ledger_report":
      return wrapWithSuspense(LedgerReportPage);

    case "trial_balance":
      return wrapWithSuspense(TrialBalancePage);

    case "balance_sheet":
      return wrapWithSuspense(BalanceSheetPage);

    case "profit_and_loss":
      return wrapWithSuspense(ProfitAndLossPage);

    case "opening_balance_list":
      return wrapWithSuspense(OpeningBalanceList);

    case "opening_balance_form":
      return wrapWithSuspense(OpeningBalanceForm);

    case "chart_of_account":
      return wrapWithSuspense(RenameSchedulesPage);

    default:
      return null;
  }
};
