import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";

import CustomContainer from "@/components/layout/custom-container";
import { PageLoader } from "@/components/layout/page-loader";
import { Button } from "@/components/ui/button";
import { usePrintPaymentMade } from "@/hooks/api/Account/use-payment-made";
import { Actions, FormModules, usePermission } from "@/lib/permissions";

// Print stylesheet
const printStyles = `
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    :root, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body * {
      visibility: hidden;
    }

    #payment-print-area,
    #payment-print-area * {
      visibility: visible;
    }

    /* Ensure ribbon never prints */
    #payment-print-area .payment-ribbon {
      display: none !important;
    }

    /* Hide logo container when no logo is present */
    #payment-print-area .no-logo {
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

    #payment-print-area {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      display: block;
      margin: 0 auto;
      padding: 10mm;
      width: 100%;
      height: 100vh;
      background: #ffffff;
      box-shadow: none !important;
      border: none !important;
      box-sizing: border-box;
    }

    #payment-print-area .receipt-sheet {
      margin: 0 auto;
      width: 100%;
      max-width: 100%;
      border: none !important;
      border-radius: 0;
      padding: 0;
      box-sizing: border-box;
      background: #ffffff;
      box-shadow: none !important;
    }

    #payment-print-area .border,
    #payment-print-area .border-gray-300,
    #payment-print-area .border-t,
    #payment-print-area .border-b {
      border-color: #d1d5db !important;
    }

    #payment-print-area .bg-gray-50 {
      background-color: #f9fafb !important;
    }

    #payment-print-area .bg-green-600 {
      background-color: #16a34a !important;
    }

    #payment-print-area .text-gray-900 {
      color: #111827 !important;
    }

    #payment-print-area .text-gray-700 {
      color: #374151 !important;
    }

    #payment-print-area .text-gray-600 {
      color: #4b5563 !important;
    }

    #payment-print-area .text-white {
      color: #ffffff !important;
    }

    #payment-print-area table {
      border-collapse: collapse !important;
    }

    #payment-print-area table td,
    #payment-print-area table th {
      border-color: #d1d5db !important;
    }
  }
`;

interface PaymentMadePrintData {
  strPaymentMadeNo: string;
  dtPaymentMadeDate: string;
  strRefNo?: string;
  strPaymentMode: string;
  dblTotalAmountMade: number;
  strVendorName?: string;
  strVendorAddress?: string;
  strVendorCity?: string;
  strVendorState?: string;
  strVendorZipCode?: string;
  strVendorCountry?: string;
  strOrganizationName?: string;
  strOrganizationDescription?: string;
  strDescription?: string;
  strLogo?: string;
  strCurrencyName?: string;
  strAmountInWords?: string;
  strTotalAmountInWords?: string;
  items?: Array<{
    strPurchaseInvoiceNo?: string;
    dtPaymentMadeOn: string;
    dblInvoiceAmount?: number;
    dblPaymentAmount: number;
  }>;
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

const PaymentMadePrint: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: paymentData, isLoading } = usePrintPaymentMade(id);
  const canPrint = usePermission(FormModules.PAYMENT_MADE, Actions.PRINT);

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (paymentData) {
      const previousTitle = document.title;
      const receiptNo = (paymentData as PaymentMadePrintData)?.strPaymentMadeNo || "Payment Receipt";
      document.title = receiptNo;
      return () => {
        document.title = previousTitle;
      };
    }
  }, [paymentData]);

  const showLoader = isLoading || initialLoad;

  if (showLoader) {
    return <PageLoader />;
  }

  if (!paymentData) {
    return (
      <CustomContainer>
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-lg font-medium">No payment data to print.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </CustomContainer>
    );
  }

  const data = paymentData as PaymentMadePrintData;
  const hasLogo = !!data.strLogo;
  const currencyCode = (data.strCurrencyName || "AED").slice(0, 3).toUpperCase();

  return (
    <CustomContainer>
      <div className="flex items-center justify-between mb-8 print:hidden">
        <div>
          <h1 className="text-2xl text-foreground font-semibold">
            Payment Receipt Print Preview
          </h1>
          <p className="text-sm text-muted-foreground">
            Review and print the payment receipt.
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

      <div id="payment-print-area">
        <div
          className="bg-white rounded-lg max-w-[190mm] w-full mx-auto relative overflow-hidden border border-slate-300 p-8 print:p-10 print:mx-auto print:max-w-full print:shadow-none print:border-none receipt-sheet"
          style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="absolute -left-10 top-3 -rotate-45 bg-emerald-600 text-white text-xs font-semibold px-10 py-1 uppercase tracking-wide shadow-lg print:hidden payment-ribbon pointer-events-none z-10"
          >
            Paid
          </div>

          {/* Organization Header with Logo */}
          <div className="flex items-start gap-4 mb-8">
            <div
              className={`shrink-0 h-16 w-16 rounded bg-slate-800 flex items-center justify-center text-xs font-semibold text-white print:h-20 print:w-20 overflow-hidden ${!hasLogo ? "print:hidden" : ""}`}
            >
              {hasLogo ? (
                <img
                  src={data.strLogo}
                  alt="Organization Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span>LOGO</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl print:text-3xl font-bold text-gray-900">
                {data.strOrganizationName || "Organization Name"}
              </h2>
              {(data.strOrganizationDescription || data.strDescription) && (
                <p className="text-base print:text-lg text-gray-600 mt-1">
                  {data.strOrganizationDescription || data.strDescription}
                </p>
              )}
            </div>
          </div>

          {/* Payment Receipt Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl print:text-4xl font-bold uppercase tracking-wide">
              Payment Made
            </h1>
          </div>

          {/* Top Section - Payment Details and Amount Box */}
          <div className="flex justify-between items-start mb-8">
            {/* Left Column - Payment Details */}
            <div className="flex-1 text-base print:text-lg">
              <div className="mb-4">
                <span className="text-gray-600">Payment Date</span>
                <div className="font-medium text-gray-900">
                  {formatDate(data.dtPaymentMadeDate)}
                </div>
              </div>
              <div className="mb-4">
                <span className="text-gray-600">Reference Number</span>
                <div className="font-medium text-gray-900">
                  {data.strRefNo || "-"}
                </div>
              </div>
              <div className="mb-4">
                <span className="text-gray-600">Payment Mode</span>
                <div className="font-medium text-gray-900">
                  {data.strPaymentMode}
                </div>
              </div>
              <div className="mb-4">
                <span className="text-gray-600">Amount Paid In Words</span>
                <div className="font-medium text-gray-900">
                  {data.strTotalAmountInWords || data.strAmountInWords || `${currencyCode} ${formatMoney(data.dblTotalAmountMade)} Only`}
                </div>
              </div>
            </div>

            {/* Right Column - Amount Box */}
            <div className="flex justify-end">
              <div className="bg-[#66ad37] text-white px-8 py-6 print:px-10 print:py-8 rounded-lg min-w-40">
                <div className="text-lg print:text-xl mb-2">Amount Paid</div>
                <div className="text-2xl print:text-3xl font-bold flex items-baseline gap-2">
                  {formatMoney(data.dblTotalAmountMade)}
                  <span className="text-xl print:text-base font-semibold">
                    {currencyCode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mb-6">
            {/* Paid To Section */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-lg print:text-xl mb-2">Paid To</div>
                <div className="text-lg print:text-xl font-semibold">
                  {data.strVendorName || "Vendor"}
                </div>
                {(data.strVendorAddress || data.strVendorCity || data.strVendorState || data.strVendorZipCode || data.strVendorCountry) && (
                  <div className="text-base print:text-lg text-gray-700 mt-1 leading-relaxed">
                    {data.strVendorAddress && <div>{data.strVendorAddress}</div>}
                    <div>
                      {[data.strVendorCity, data.strVendorState, data.strVendorZipCode]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    {data.strVendorCountry && <div>{data.strVendorCountry}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment For Table */}
          {data.items && data.items.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Payment for
              </h3>
              <table className="w-full border-collapse text-base print:text-lg">
                <thead className="bg-gray-50 border-b border-gray-300">
                  <tr className="text-left">
                    <th className="p-3 font-semibold">
                      Invoice Number
                    </th>
                    <th className="p-3 font-semibold">
                      Invoice Date
                    </th>
                    <th className="p-3 text-right font-semibold">
                      Invoice Amount
                    </th>
                    <th className="p-3 text-right font-semibold">
                      Payment Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3">
                        {item.strPurchaseInvoiceNo || "-"}
                      </td>
                      <td className="p-3 text-gray-900">
                        {formatDate(item.dtPaymentMadeOn)}
                      </td>
                      <td className="p-3 text-gray-900 text-right">
                        {formatMoney(item.dblInvoiceAmount)}
                      </td>
                      <td className="p-3 text-gray-900 text-right font-medium">
                        {formatMoney(item.dblPaymentAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CustomContainer>
  );
};

export default PaymentMadePrint;
