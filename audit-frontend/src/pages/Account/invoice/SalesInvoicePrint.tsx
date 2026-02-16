import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import CustomContainer from "@/components/layout/custom-container";
import { PageLoader } from "@/components/layout/page-loader";
import { Button } from "@/components/ui/button";
import { useInvoicePrint } from "@/hooks/api/Account/use-sales-invoices";
import type {
  Invoice,
  InvoiceItem,
  InvoiceAddress,
  InvoicePrintResponse,
  InvoiceItemPrintDto,
  PartyPrintDto,
  TaxSummaryPrintDto,
} from "@/types/Account/salesinvoice";
import type { FormData } from "@/validations/Account/salesinvoice";
import { Printer } from "lucide-react";
import { Actions, FormModules, usePermission } from "@/lib/permissions";
import { formatInvoiceAddress } from "@/lib/utils/Account/invoice";
const formatPrintedAddress = (
  address?: (InvoiceAddress & { strFormattedAddress?: string }) | null
) => {
  if (!address) return "";
  if ("strFormattedAddress" in address && address.strFormattedAddress) {
    return address.strFormattedAddress;
  }
  return formatInvoiceAddress(address);
};

// Print stylesheet
const printStyles = `
  @page {
    size: A4 portrait;
    margin: 5mm;
  }

  @media print {
    /* Force color printing */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    :root, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body * {
      visibility: hidden;
    }

    #invoice-print-area,
    #invoice-print-area * {
      visibility: visible;
    }

    /* Ensure ribbon never prints */
    #invoice-print-area .invoice-ribbon {
      display: none !important;
    }

    #root,
    .app-shell,
    .app-layout,
    .app-content {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }

    #invoice-print-area {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      display: block;
      margin: 0 auto;
      padding: 5mm;
      width: 100%;
      height: 100vh;
      background: #ffffff;
      box-shadow: none !important;
      border: 1px solid #aaaaaaff !important;
      box-sizing: border-box;
    }

    #invoice-print-area .invoice-sheet {
      margin: 0 auto;
      width: 100%;
      max-width: 100%;
      border: none !important;
      border-radius: 0;
      padding: 3mm;
      box-sizing: border-box;
      background: #ffffff;
      box-shadow: none !important;
    }

    /* Preserve all borders */
    #invoice-print-area .border,
    #invoice-print-area .border-gray-300,
    #invoice-print-area .border-gray-400,
    #invoice-print-area .border-t,
    #invoice-print-area .border-b,
    #invoice-print-area .border-r,
    #invoice-print-area .border-l,
    #invoice-print-area .border-t-2 {
      border-color: #d1d5db !important;
    }

    /* Preserve backgrounds */
    #invoice-print-area .bg-gray-50 {
      background-color: #f9fafb !important;
    }

    #invoice-print-area .bg-gray-100 {
      background-color: #f3f4f6 !important;
    }

    #invoice-print-area .bg-white {
      background-color: #ffffff !important;
    }

    #invoice-print-area .bg-slate-800 {
      background-color: #1e293b !important;
    }

    /* Hide logo container when no logo is present */
    #invoice-print-area .no-logo {
      display: none !important;
    }

    /* Preserve text colors */
    #invoice-print-area .text-gray-900 {
      color: #111827 !important;
    }

    #invoice-print-area .text-gray-700 {
      color: #374151 !important;
    }

    #invoice-print-area .text-gray-600 {
      color: #4b5563 !important;
    }

    #invoice-print-area .text-gray-500 {
      color: #6b7280 !important;
    }

    #invoice-print-area .text-white {
      color: #ffffff !important;
    }

    /* Preserve table styling */
    #invoice-print-area table {
      border-collapse: collapse !important;
    }

    #invoice-print-area table td,
    #invoice-print-area table th {
      border-color: #d1d5db !important;
    }

    #invoice-print-area .divide-y > * + * {
      border-top-width: 1px !important;
      border-top-color: #e5e7eb !important;
    }

    /* Enhanced Font Sizes for Print Mode */
    #invoice-print-area .text-xs {
      font-size: 13px !important;
    }

    #invoice-print-area .text-sm {
      font-size: 15px !important;
    }

    #invoice-print-area .text-base {
      font-size: 16px !important;
    }

    #invoice-print-area table.print\\:text-\\[9px\\],
    #invoice-print-area .print\\:text-\\[9px\\] {
      font-size: 13px !important;
    }

    #invoice-print-area .print\\:text-\\[10px\\] {
      font-size: 14px !important;
    }

    #invoice-print-area .print\\:text-\\[11px\\] {
      font-size: 15px !important;
    }

    #invoice-print-area .print\\:text-\\[8px\\] {
      font-size: 12px !important;
    }

    #invoice-print-area .text-3xl {
      font-size: 30px !important;
    }

    #invoice-print-area .print\\:text-xl {
      font-size: 26px !important;
    }

    .print-avoid-break,
    .print-avoid-break * {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    table {
      page-break-inside: auto;
    }

    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
`;

interface PrintInvoiceState {
  formValues?: Partial<FormData & Invoice>;
  items?: InvoiceItem[];
  customerName?: string;
  currencyLabel?: string;
}

const formatMoney = (value?: number | null, fractionDigits = 2) => {
  const amount = Number(value || 0);
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const getInvoiceData = (data: unknown, prop: string): unknown => {
  if (!data) return undefined;
  const obj = data as Record<string, unknown>;
  return obj?.[prop.charAt(0).toUpperCase() + prop.slice(1)] ?? obj?.[prop];
};

const InvoicePrint: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = (location.state as PrintInvoiceState | undefined) || {};

  const isDraft = !id || id === "draft" || id === "new";
  const { data: invoicePrint, isLoading } = useInvoicePrint(isDraft ? "" : id!);
  const canPrint = usePermission(FormModules.INVOICE, Actions.PRINT);

  const values: Partial<FormData & Invoice> | InvoicePrintResponse | undefined =
    isDraft ? state.formValues : invoicePrint;
  const items: (InvoiceItem | InvoiceItemPrintDto)[] = isDraft
    ? state.items || []
    : (getInvoiceData(invoicePrint, "items") as
        | (InvoiceItem | InvoiceItemPrintDto)[]
        | undefined) || [];

  const hasData = !!values && items.length > 0;

  const billingAddressData = isDraft
    ? ((values as Partial<FormData & Invoice>)?.strBillingAddress as
        | InvoiceAddress
        | undefined)
    : (getInvoiceData(invoicePrint, "billingAddress") as
        | (InvoiceAddress & { strFormattedAddress?: string })
        | undefined);

  const shippingAddressData = isDraft
    ? ((values as Partial<FormData & Invoice>)?.strShippingAddress as
        | InvoiceAddress
        | undefined)
    : (getInvoiceData(invoicePrint, "shippingAddress") as
        | (InvoiceAddress & { strFormattedAddress?: string })
        | undefined);

  const partyData = getInvoiceData(invoicePrint, "party") as
    | Partial<PartyPrintDto>
    | undefined;
  const customerName = useMemo(() => {
    if (isDraft) {
      return (
        state.customerName ||
        (values as Partial<FormData & Invoice>)?.strPartyGUID ||
        ""
      );
    }
    return (partyData?.strPartyName ||
      partyData?.strCompanyName ||
      "") as string;
  }, [isDraft, state.customerName, values, partyData]);

  // Disable auto-opening of the print dialog; users can click the Print button

  // Calculate invoice number early for use in useEffect
  const invoiceNo = isDraft
    ? (values as Invoice)?.strInvoiceNo || "Draft"
    : (invoicePrint as InvoicePrintResponse)?.strInvoiceNo || "Draft";

  // Inject print styles
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${invoiceNo}`;
    return () => {
      document.title = previousTitle;
    };
  }, [invoiceNo]);

  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 300);
    return () => clearTimeout(t);
  }, []);

  const showLoader = isLoading || initialLoad;

  if (showLoader) {
    return <PageLoader />;
  }

  if (!hasData) {
    return (
      <CustomContainer>
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-lg font-medium">No invoice data to print.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </CustomContainer>
    );
  }

  const totals = {
    gross: isDraft
      ? ((values as Partial<FormData & Invoice>)?.dblGrossTotalAmt ?? 0)
      : ((invoicePrint as InvoicePrintResponse)?.dblGrossTotalAmt ?? 0),
    discount: isDraft
      ? ((values as Partial<FormData & Invoice>)?.dblTotalDiscountAmt ?? 0)
      : ((invoicePrint as InvoicePrintResponse)?.dblTotalDiscountAmt ?? 0),
    tax: isDraft
      ? ((values as Partial<FormData & Invoice>)?.dblTaxAmt ?? 0)
      : ((invoicePrint as InvoicePrintResponse)?.dblTaxAmt ?? 0),
    adjustment: isDraft
      ? ((values as Partial<FormData & Invoice>)?.dblAdjustmentAmt ?? 0)
      : ((invoicePrint as InvoicePrintResponse)?.dblAdjustmentAmt ?? 0),
    net: isDraft
      ? ((values as Partial<FormData & Invoice>)?.dblNetAmt ?? 0)
      : ((invoicePrint as InvoicePrintResponse)?.dblNetAmt ?? 0),
  };

  const adjustmentName = isDraft
    ? ((values as Partial<FormData & Invoice>)?.strAdjustmentName || "Adjustment")
    : ((invoicePrint as InvoicePrintResponse)?.strAdjustmentName || "Adjustment");

  const balanceDue = totals.net;

  const dueDate = isDraft
    ? (values as Partial<FormData & Invoice>)?.dtDueDate
    : (invoicePrint as InvoicePrintResponse)?.dtDueDate;

  const isPaid = isDraft
    ? (values as Partial<FormData & Invoice>)?.bolIsPaid
    : (invoicePrint as InvoicePrintResponse)?.bolIsPaid;

  const isOverdue = dueDate && !isPaid && new Date(dueDate) < new Date();

  const status = isDraft
    ? (values as Partial<FormData & Invoice>)?.strStatus
    : (invoicePrint as InvoicePrintResponse)?.strStatus;

  const ribbonText = isOverdue ? "Overdue" : status || "Draft";

  const getRibbonColor = () => {
    if (isOverdue) return "bg-red-600";
    if (
      values?.strStatus === "Approved" ||
      values?.strStatus === "Pending For Approval"
    )
      return "bg-emerald-600";
    return "bg-amber-500";
  };

  const organizationName = isDraft
    ? (state as { organizationName?: string })?.organizationName
    : (invoicePrint as InvoicePrintResponse)?.strOrganizationName;

  const organizationDescription = isDraft
    ? (state as { organizationDescription?: string })?.organizationDescription
    : (invoicePrint as InvoicePrintResponse)?.strDescription;

  const organizationLogo = isDraft
    ? (state as { strLogo?: string })?.strLogo
    : (invoicePrint as InvoicePrintResponse)?.strLogo;
  const hasLogo = !!organizationLogo;

  const customerNotes = isDraft
    ? (values as Partial<FormData & Invoice>)?.strCustomerNotes || ""
    : (invoicePrint as InvoicePrintResponse)?.strCustomerNotes || "";

  const termsAndConditions = isDraft
    ? (values as Partial<FormData & Invoice>)?.strTC || ""
    : (invoicePrint as InvoicePrintResponse)?.strTC || "";

  const taxSummary = getInvoiceData(invoicePrint, "taxSummary") as
    | TaxSummaryPrintDto[]
    | undefined;
  const currencyName = isDraft
    ? (values as Partial<FormData & Invoice>)?.strCurrencyTypeName || ""
    : (invoicePrint as InvoicePrintResponse)?.strCurrencyName || "";
  const cleanTaxName = (name?: string | null) => {
    if (!name) return "";
    const atIndex = name.indexOf("@");
    const trimmed = atIndex >= 0 ? name.slice(0, atIndex) : name;
    return trimmed.trim();
  };
  const taxLabel = (() => {
    const summaryNames = (taxSummary || [])
      .map((t) => cleanTaxName(t.strTaxName))
      .filter(Boolean) as string[];
    if (summaryNames.length > 0) return summaryNames.join(", ");
    return "Tax";
  })();

  return (
    <CustomContainer>
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-2xl text-foreground font-semibold">
            Sales Invoice Print Preview
          </h1>
          <p className="text-sm text-muted-foreground">
            Match the reference layout and then print or export to PDF.
          </p>
        </div>
        <div className="flex gap-2">
          {canPrint && (
            <Button
              type="button"
              variant="default"
              className="h-9 text-xs sm:text-sm"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 size-4" />
              Print
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>

      <div id="invoice-print-area">
        <div
          className="bg-white rounded-lg max-w-[190mm] w-full mx-auto relative overflow-hidden border border-slate-300 p-8 md:p-10 print:mx-auto print:max-w-full print:shadow-none print:p-0 print:border-none invoice-sheet"
          style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          <div className="absolute inset-0 pointer-events-none print:hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-b from-black/5 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-t from-black/5 to-transparent" />
          </div>

          <div
            className={`absolute -left-10 top-3 -rotate-45 ${getRibbonColor()} text-white text-xs font-semibold px-10 py-1 uppercase tracking-wide shadow-lg print:hidden invoice-ribbon pointer-events-none z-10`}
          >
            {ribbonText}
          </div>

          <div className="relative z-10">
            {/* Header Section with Logo and Title */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4 print:gap-2 print:mb-2">
              <div className="flex gap-3 items-start print:gap-2">
                <div
                  className={`h-16 w-16 rounded bg-slate-800 flex items-center justify-center text-xs font-semibold text-white print:h-14 print:w-14 print:text-[10px] overflow-hidden ${hasLogo ? "" : "no-logo"}`}
                >
                  {hasLogo ? (
                    <img
                      src={organizationLogo!}
                      alt={organizationName || "Organization logo"}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="print:hidden">LOGO</span>
                  )}
                </div>
                <div className="text-sm leading-tight print:leading-tight">
                  <div className="text-base font-bold text-gray-900 print:text-[11px]">
                    {organizationName || "Organization"}
                  </div>
                  {organizationDescription
                    ? organizationDescription
                        .split("\n")
                        .filter(Boolean)
                        .map((line, idx) => (
                          <div
                            key={`${line}-${idx}`}
                            className="text-gray-600 text-xs print:text-[9px] mt-0.5"
                          >
                            {line}
                          </div>
                        ))
                    : null}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tracking-wider text-gray-900 print:text-xl print:tracking-wide">
                  SALES INVOICE
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium print:text-[9px] print:mt-0.5">
                  {isDraft
                    ? (values as Partial<FormData & Invoice>)?.strYearName || ""
                    : (invoicePrint as InvoicePrintResponse)?.strYearName || ""}
                </div>
              </div>
            </div>

            <div className="border border-gray-300 overflow-hidden print:border-gray-400">
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 text-xs bg-white print:text-[9px] border-b border-gray-300">
                <div className="border-r border-gray-300">
                  <div className="p-3 print:p-2 space-y-1 print:space-y-0.5">
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                      <span className="text-gray-600 font-medium">
                        Invoice No.
                      </span>
                      <span className="text-gray-900 font-semibold">
                        : {invoiceNo}
                      </span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                      <span className="text-gray-600 font-medium">
                        Invoice Date
                      </span>
                      <span className="text-gray-900">
                        :{" "}
                        {isDraft
                          ? formatDate(
                              (values as Partial<FormData & Invoice>)
                                ?.dInvoiceDate
                            )
                          : (invoicePrint as InvoicePrintResponse)
                              ?.strFormattedInvoiceDate ||
                            formatDate(
                              (invoicePrint as InvoicePrintResponse)
                                ?.dInvoiceDate
                            )}
                      </span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                      <span className="text-gray-600 font-medium">
                        Payment Terms
                      </span>
                      <span className="text-gray-900">
                        :{" "}
                        {isDraft
                          ? ((values as Partial<FormData & Invoice>)
                              ?.intPaymentTermsDays ?? "")
                          : ((invoicePrint as InvoicePrintResponse)
                              ?.intPaymentTermsDays ?? "")}
                        {" "}
                        days
                      </span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                      <span className="text-gray-600 font-medium">
                        Due Date
                      </span>
                      <span className="text-gray-900">
                        :{" "}
                        {isDraft
                          ? formatDate(
                              (values as Partial<FormData & Invoice>)?.dtDueDate
                            )
                          : (invoicePrint as InvoicePrintResponse)
                              ?.strFormattedDueDate ||
                            formatDate(
                              (invoicePrint as InvoicePrintResponse)?.dtDueDate
                            )}
                      </span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                      <span className="text-gray-600 font-medium">
                        PO Reference No.
                      </span>
                      <span className="text-gray-900">
                        :{" "}
                        {isDraft
                          ? (values as Partial<FormData & Invoice>)
                              ?.strOrderNo || ""
                          : (invoicePrint as InvoicePrintResponse)
                              ?.strOrderNo || ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 print:p-2 space-y-1 print:space-y-0.5">
                  <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                    <span className="text-gray-600 font-medium">
                      Customer Code
                    </span>
                    <span className="text-gray-900">
                      :{" "}
                      {isDraft
                        ? (values as Partial<FormData & Invoice>)
                            ?.strPartyGUID || ""
                        : partyData?.strUDFCode ||
                          partyData?.strPartyGUID ||
                          ""}
                    </span>
                  </div>
                  {currencyName ? (
                    <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                      <span className="text-gray-600 font-medium">
                        Currency
                      </span>
                      <span className="text-gray-900">: {currencyName}</span>
                    </div>
                  ) : null}
                  {!isDraft && (
                    <div className="space-y-0.5 print:space-y-0">
                      {partyData?.strCompanyName ? (
                        <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                          <span className="text-gray-600 font-medium">
                            Company
                          </span>
                          <span className="text-gray-900">
                            : {partyData.strCompanyName}
                          </span>
                        </div>
                      ) : null}
                      {partyData?.strEmail ? (
                        <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                          <span className="text-gray-600 font-medium">
                            Email
                          </span>
                          <span className="text-gray-900">
                            : {partyData.strEmail}
                          </span>
                        </div>
                      ) : null}
                      {partyData?.strPhoneNoWork ||
                      partyData?.strPhoneNoPersonal ? (
                        <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                          <span className="text-gray-600 font-medium">
                            Phone
                          </span>
                          <span className="text-gray-900">
                            : {partyData?.strPhoneNoWork || ""}
                          </span>
                        </div>
                      ) : null}
                      {partyData?.strTaxRegNo ? (
                        <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                          <span className="text-gray-600 font-medium">
                            Tax Reg No
                          </span>
                          <span className="text-gray-900">
                            : {partyData.strTaxRegNo}
                          </span>
                        </div>
                      ) : null}
                      {partyData?.strPAN ? (
                        <div className="grid grid-cols-[100px_1fr] gap-x-2 print:gap-x-1">
                          <span className="text-gray-600 font-medium">PAN</span>
                          <span className="text-gray-900">
                            : {partyData.strPAN}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 text-xs border-b border-gray-300">
                <div className="p-3 print:p-2 border-r border-gray-300">
                  <div className="font-bold mb-1.5 text-gray-900 print:text-[10px] print:mb-1">
                    Bill To:
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed print:text-[9px] print:leading-snug space-y-0.5">
                    <div className="font-semibold text-gray-900">
                      {customerName || "N/A"}
                    </div>
                    <div>{formatPrintedAddress(billingAddressData)}</div>
                    {partyData?.strPhoneNoWork ||
                    partyData?.strPhoneNoPersonal ? (
                      <div className="text-gray-600">
                        Phone:{" "}
                        {partyData?.strPhoneNoWork ||
                          partyData?.strPhoneNoPersonal}
                      </div>
                    ) : null}
                    {partyData?.strTaxRegNo ? (
                      <div className="text-gray-600">
                        Tax Reg No: {partyData.strTaxRegNo}
                      </div>
                    ) : null}
                    {partyData?.strPAN ? (
                      <div className="text-gray-600">
                        PAN: {partyData.strPAN}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="p-3 print:p-2">
                  <div className="font-bold mb-1.5 text-gray-900 print:text-[10px] print:mb-1">
                    Ship To:
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed print:text-[9px] print:leading-snug space-y-0.5">
                    <div>{formatPrintedAddress(shippingAddressData)}</div>
                    {partyData?.strPhoneNoWork ||
                    partyData?.strPhoneNoPersonal ? (
                      <div className="text-gray-600">
                        Phone:{" "}
                        {partyData?.strPhoneNoWork ||
                          partyData?.strPhoneNoPersonal}
                      </div>
                    ) : null}
                    {partyData?.strTaxRegNo ? (
                      <div className="text-gray-600">
                        Tax Reg No: {partyData.strTaxRegNo}
                      </div>
                    ) : null}
                    {partyData?.strPAN ? (
                      <div className="text-gray-600">
                        PAN: {partyData.strPAN}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="print-avoid-break">
                <table className="w-full border-collapse text-xs print:text-[9px]">
                  <thead className="bg-gray-50 border-b border-gray-300">
                    <tr className="text-left">
                      <th className="p-2 w-8 text-gray-700 font-semibold print:p-1 print:w-6">
                        #
                      </th>
                      <th className="p-2 text-gray-700 font-semibold print:p-1">
                        Description
                      </th>
                      <th
                        className="p-2 w-20 text-gray-700 font-semibold print:p-1 whitespace-nowrap text-center align-top"
                        style={{ minWidth: "10px", maxWidth: "30px" }}
                      >
                        HSN Code
                      </th>
                      <th className="p-2 text-right w-16 text-gray-700 font-semibold print:p-1 print:w-12">
                        Qty
                      </th>
                      <th className="p-2 text-right w-20 text-gray-700 font-semibold print:p-1 print:w-16">
                        Rate
                      </th>
                      <th className="p-2 text-right w-18 text-gray-700 font-semibold print:p-1 print:w-16">
                        Disc. %
                      </th>
                      <th className="p-2 text-right w-16 text-gray-700 font-semibold print:p-1 print:w-12">
                        Tax %
                      </th>
                      <th className="p-2 text-right w-20 text-gray-700 font-semibold print:p-1 print:w-14">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item, idx) => {
                      const itemGUID = isDraft
                        ? (item as InvoiceItem).strInvoice_ItemGUID
                        : (item as InvoiceItemPrintDto).strInvoice_ItemGUID;
                      const itemName = isDraft
                        ? (item as InvoiceItem).strItemName || ""
                        : (item as InvoiceItemPrintDto).strItemName || "";
                      const description = isDraft
                        ? (item as InvoiceItem).strDesc
                        : (item as InvoiceItemPrintDto).strDesc;
                      const accountName = isDraft
                        ? (item as InvoiceItem).strAccountName
                        : null;
                      const hsnCode = isDraft
                        ? null
                        : (item as InvoiceItemPrintDto).strHSNCode;
                      const uomName = isDraft
                        ? (item as InvoiceItem).strUoMName
                        : (item as InvoiceItemPrintDto).strUoMName;
                      const qty = isDraft
                        ? (item as InvoiceItem).dblQty
                        : (item as InvoiceItemPrintDto).dblQty;
                      const rate = isDraft
                        ? (item as InvoiceItem).dblRate
                        : (item as InvoiceItemPrintDto).dblRate;
                      const discountPercentage = isDraft
                        ? (item as InvoiceItem).dblDiscountPercentage
                        : (item as InvoiceItemPrintDto).dblDiscountPercentage;
                      const taxPercentage = isDraft
                        ? (item as InvoiceItem).dblTaxPercentage
                        : (item as InvoiceItemPrintDto).dblTaxPercentage;
                      const taxDetails = isDraft
                        ? null
                        : (item as InvoiceItemPrintDto).TaxDetails;
                      const totalAmt = isDraft
                        ? (item as InvoiceItem).dblTotalAmt
                        : (item as InvoiceItemPrintDto).dblTotalAmt;

                      return (
                        <tr key={itemGUID || idx}>
                          <td className="p-2 align-top text-gray-600 print:p-1">
                            {idx + 1}
                          </td>
                          <td className="p-2 align-top print:p-1">
                            <div className="font-medium text-gray-900 print:text-[9px]">
                              {itemName}
                            </div>
                            {description && description !== itemName ? (
                              <div className="text-[10px] text-gray-600 mt-0.5 print:text-[8px]">
                                {description}
                              </div>
                            ) : null}
                            {accountName ? (
                              <div className="text-[10px] text-gray-500 mt-0.5 print:text-[8px]">
                                Account: {accountName}
                              </div>
                            ) : null}
                          </td>
                          <td className="p-2 align-top print:p-1 text-gray-900 whitespace-nowrap">
                            {hsnCode || ""}
                          </td>
                          <td className="p-2 text-right align-top text-gray-900 print:p-1">
                            {formatMoney(qty)}
                            {uomName ? (
                              <div className="text-[10px] text-gray-500 mt-0.5 print:text-[8px]">
                                {uomName}
                              </div>
                            ) : null}
                          </td>
                          <td className="p-2 text-right align-top text-gray-900 print:p-1">
                            {formatMoney(rate, 3)}
                          </td>
                          <td className="p-2 text-right align-top text-gray-900 print:p-1">
                            {discountPercentage
                              ? `${formatMoney(discountPercentage)}%`
                              : "0%"}
                          </td>
                          <td className="p-2 text-right align-top text-gray-900 print:p-1">
                            {taxDetails && taxDetails.length > 0 ? (
                              <div className="space-y-1">
                                {(() => {
                                  const grouped: Record<
                                    number,
                                    Array<{ name: string; pct: number }>
                                  > = {};
                                  taxDetails.forEach((tax) => {
                                    const pct = tax.dblTaxPercentage || 0;
                                    if (!grouped[pct]) grouped[pct] = [];
                                    grouped[pct].push({
                                      name: tax.strTaxRateName || "",
                                      pct,
                                    });
                                  });
                                  return Object.entries(grouped).map(
                                    ([pctKey, taxes], idx) => (
                                      <div
                                        key={idx}
                                        className="text-[10px] print:text-[8px]"
                                      >
                                        {taxes.map((t) => t.name).join(" + ")}{" "}
                                        {formatMoney(Number(pctKey))}%
                                      </div>
                                    )
                                  );
                                })()}
                              </div>
                            ) : taxPercentage ? (
                              `${formatMoney(taxPercentage)}%`
                            ) : (
                              "0%"
                            )}
                          </td>
                          <td className="p-2 text-right align-top font-semibold text-gray-900 print:p-1">
                            {formatMoney(totalAmt, 3)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t-2 border-gray-400 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2">
                  <div className="p-3 print:p-2 border-r border-gray-300">
                    <div className="font-bold text-xs text-gray-900 mb-1 print:text-[10px] print:mb-0.5">
                      Terms &amp; Conditions:
                    </div>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed min-h-8 print:text-[9px] print:leading-snug print:min-h-6">
                      {termsAndConditions || ""}
                    </div>
                  </div>
                  <div className="p-3 print:p-2 space-y-1 print:space-y-0.5">
                    <div className="flex justify-between text-xs font-bold print:text-[9px]">
                      <span className="text-gray-900">Sub Total</span>
                      <span className="text-gray-900">
                        {formatMoney(totals.gross, 3)}
                      </span>
                    </div>
                    {taxSummary && taxSummary.length > 0 ? (
                      <div className="space-y-0.5 print:space-y-0">
                        {taxSummary.map((tax, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-xs print:text-[9px]"
                          >
                            <span className="text-gray-600">
                              {cleanTaxName(tax.strTaxName)}
                            </span>
                            <span className="text-gray-900 font-medium">
                              {formatMoney(tax.dblTaxAmount, 3)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs print:text-[9px]">
                        <span className="text-gray-600">{taxLabel}</span>
                        <span className="text-gray-900 font-medium">
                          {formatMoney(totals.tax, 3)}
                        </span>
                      </div>
                    )}
                    {totals.adjustment !== 0 ? (
                      <div className="flex justify-between text-xs print:text-[9px]">
                        <span className="text-gray-600">{adjustmentName}</span>
                        <span className="text-gray-900 font-medium">
                          {totals.adjustment > 0 ? "+" : ""}
                          {formatMoney(totals.adjustment, 3)}
                        </span>
                      </div>
                    ) : null}
                    <div className="border-t border-gray-300 my-1 print:my-0.5"></div>
                    <div className="flex justify-between text-sm font-bold print:text-[10px]">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        {formatMoney(totals.net, 3)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold py-0.5 rounded print:text-[10px] print:px-1 print:py-0.5 print:rounded-none">
                      <span className="text-gray-900">Balance Due</span>
                      <span className="text-gray-900">
                        {formatMoney(balanceDue, 3)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 print:mt-2">
              <div className="border border-gray-300 overflow-hidden print:border-gray-400">
                <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2">
                  <div className="p-3 print:p-2 border-r border-gray-300 border-b">
                    <div className="font-bold text-xs text-gray-900 mb-1.5 print:text-[10px] print:mb-1">
                      Notes:
                    </div>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed min-h-10 print:text-[9px] print:leading-snug print:min-h-7.5">
                      {customerNotes || ""}
                    </div>
                  </div>
                  <div className="p-3 print:p-2 border-b border-gray-300">
                    <div className="font-bold text-xs text-gray-900 mb-1.5 print:text-[10px] print:mb-1">
                      Amount in Words
                    </div>
                    <div className="text-xs text-gray-700 italic print:text-[9px]">
                      {!isDraft && invoicePrint?.strNetAmtInWords
                        ? invoicePrint.strNetAmtInWords
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="p-3 print:p-2 flex justify-end">
                  <div className="text-center w-48 print:w-40">
                    <div className="h-12 print:h-10"></div>
                    <div className="border-t-2 border-gray-400 pt-1 text-xs text-gray-700 font-medium print:text-[9px] print:pt-0.5">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomContainer>
  );
};

export default InvoicePrint;
