import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  FileText,
  Trash2,
  Settings,
  CheckCircle,
  Pencil,
  Printer,
} from "lucide-react";

import type {
  InvoiceItem,
  InvoiceCreate,
  InvoiceUpdate,
  InvoiceAddress,
} from "@/types/Account/salesinvoice";
import type { PartyAddress, PartyWithLocations } from "@/types/Account/party";
import type { AttachmentFile } from "@/types/common";

import { formatInvoiceAddress } from "@/lib/utils/Account/invoice";
import { Actions, FormModules, usePermission } from "@/lib/permissions";

import {
  invoiceSchema,
  type FormData,
} from "@/validations/Account/salesinvoice";

import {
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
} from "@/hooks/api/Account/use-sales-invoices";
import { useExchangeRate } from "@/hooks/api/central/use-organizations";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import {
  usePartyWithLocations,
  useActivePartiesByType,
} from "@/hooks/api/Account/use-parties";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  PreloadedSelectWithAvatar,
  type SelectOptionWithDetails,
} from "@/components/ui/select/preloaded-select-with-avatar";
import { Separator } from "@/components/ui/separator";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { WithPermission } from "@/components/ui/with-permission";
import { InvoiceFormSkeleton } from "./components/SalesInvoiceFormSkeleton";
import { InvoiceItemsSection } from "./components/SalesInvoiceItemsSection";
import AddressEditDialog from "./components/AddressEditDialog";

const InvoiceForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<AttachmentFile[]>([]);
  const [submittingAs, setSubmittingAs] = useState<
    "Draft" | "Pending For Approval" | "Approved" | null
  >(null);
  const [selectedCurrencyGUID, setSelectedCurrencyGUID] = useState<string>("");
  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);
  const [customExchangeRate, setCustomExchangeRate] = useState<string>("");
  const [openBillingDialog, setOpenBillingDialog] = useState(false);
  const [openShippingDialog, setOpenShippingDialog] = useState(false);
  const [originalCurrencyGUID, setOriginalCurrencyGUID] = useState<string>("");
  const previousCurrencyGUIDRef = useRef<string | null>(null);
  const HeaderIcon = useMenuIcon(FormModules.INVOICE, FileText);
  const { user } = useAuthContext();
  const userTax = (
    user as
      | {
          tax?: {
            strTaxTypeCode?: string | null;
            strTaxTypeName?: string | null;
            strStateGUID?: string | null;
          };
        }
      | undefined
  )?.tax;
  const hasTaxConfig = !!userTax;
  const hasApproveRights = usePermission(FormModules.INVOICE, Actions.APPROVE);

  const [dropdownOpen, setDropdownOpen] = useState({
    customers: false,
    currencies: false,
  });
  const isEditMode = !!id && id !== "new";

  const shouldPrefetch = isEditMode;
  const customersEnabled = dropdownOpen.customers || shouldPrefetch;
  const { data: activeCustomers, isLoading: isLoadingCustomers } =
    useActivePartiesByType({ strPartyType: "Customer" }, customersEnabled);
  const { data: currencyTypes } = useActiveCurrencyTypes(undefined);
  const fromCurrency = React.useMemo(() => {
    return (
      (currencyTypes || []).find(
        (currency) => currency.strCurrencyTypeGUID === selectedCurrencyGUID
      )?.strName || ""
    );
  }, [currencyTypes, selectedCurrencyGUID]);

  const toCurrency = React.useMemo(() => {
    return (
      (currencyTypes || []).find(
        (currency) => currency.strCurrencyTypeGUID === user?.strCurrencyTypeGUID
      )?.strName || ""
    );
  }, [currencyTypes, user?.strCurrencyTypeGUID]);

  const currencyLabel = fromCurrency;

  const handleSettingsClick = () => {
    if (user?.strLastYearGUID) {
      window.open(`/year/${user.strLastYearGUID}`, "_blank");
    }
  };

  const {
    data: invoice,
    isFetching: isFetchingInvoice,
    error: invoiceError,
  } = useInvoice(isEditMode ? id : "");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  const isFormDisabled = isEditMode && invoice?.strStatus !== "Draft";

  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();

  // Fetch exchange rate when currency is different from user's currency
  // In edit mode, only fetch if currency changed and status is draft
  const shouldFetchExchangeRate =
    !!selectedCurrencyGUID &&
    selectedCurrencyGUID !== user?.strCurrencyTypeGUID &&
    (!isEditMode ||
      (isEditMode &&
        invoice?.strStatus === "Draft" &&
        selectedCurrencyGUID !== originalCurrencyGUID));
  const { data: exchangeRateData, isLoading: isLoadingExchangeRate } =
    useExchangeRate(
      { strFromCurrencyGUID: selectedCurrencyGUID },
      {
        enabled: shouldFetchExchangeRate,
      }
    );

  // Check if selected currency is different from user's currency
  const isDifferentCurrency =
    !!selectedCurrencyGUID &&
    selectedCurrencyGUID !== user?.strCurrencyTypeGUID;

  useEffect(() => {
    if (invoice?.items) {
      setInvoiceItems(invoice.items);
    }
  }, [invoice?.items]);

  const form = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(invoiceSchema) as unknown as Resolver<FormData>,
    shouldFocusError: true,
    defaultValues: {
      dInvoiceDate: new Date().toISOString().split("T")[0],
      intPaymentTermsDays: 30,
      dtDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      strStatus: "Draft",
      strSubject: "",
      strOrderNo: "",
      strCustomerNotes: "Thanks for your business",
      strTC: "",
      bolIsPaid: false,
      strPartyGUID: "",
      strCurrencyTypeGUID: null,
      strBillingAddress: null,
      strShippingAddress: null,
      strAdjustmentName: "Adjustment",
      strAdjustment_AccountGUID: null,
      dblGrossTotalAmt: 0,
      dblTotalDiscountAmt: 0,
      dblTaxAmt: 0,
      dblAdjustmentAmt: 0,
      dblNetAmt: 0,
      items: [],
    },
  });

  // Watch the selected party GUID to fetch party with locations (after form initialization)
  const selectedPartyGUID = form.watch("strPartyGUID");
  const initialPartyGUID = invoice?.strPartyGUID || null;
  const shouldFetchPartyLocations =
    Boolean(selectedPartyGUID) &&
    (!isEditMode || (invoice && selectedPartyGUID !== initialPartyGUID));
  const { data: partyWithLocations } = usePartyWithLocations(
    shouldFetchPartyLocations ? selectedPartyGUID || undefined : undefined
  );

  const partyAddressesFromInvoice = React.useMemo(() => {
    if (!invoice || !invoice.strPartyGUID) return null;
    return {
      strPartyGUID: invoice.strPartyGUID,
      strCurrencyTypeGUID: invoice.strCurrencyTypeGUID,
      billingAddress: invoice.strBillingAddress as unknown as PartyAddress,
      shippingAddress: invoice.strShippingAddress as unknown as PartyAddress,
      BillingAddress: invoice.strBillingAddress as unknown as PartyAddress,
      ShippingAddress: invoice.strShippingAddress as unknown as PartyAddress,
    } satisfies Partial<PartyWithLocations> as PartyWithLocations;
  }, [invoice]);

  const effectivePartyWithLocations =
    partyWithLocations ?? partyAddressesFromInvoice;

  const customerName = React.useMemo(() => {
    if (invoice?.strPartyName) return invoice.strPartyName;
    const selected = (activeCustomers || []).find(
      (p) => p.strPartyGUID === selectedPartyGUID
    );
    return (
      selected?.strPartyName_Display ||
      selected?.strPartyGUID ||
      form.getValues("strPartyGUID") ||
      ""
    );
  }, [activeCustomers, invoice?.strPartyName, selectedPartyGUID, form]);

  const mapPartyAddressToInvoiceAddress = React.useCallback(
    (location?: PartyAddress | null): InvoiceAddress | null => {
      if (!location) return null;
      const addressLine =
        (location as PartyAddress).strAddressLine ??
        (location as unknown as { strAddress?: string | null }).strAddress ??
        null;
      return {
        strAttention: location.strAttention ?? null,
        strCountryGUID: location.strCountryGUID ?? null,
        strCountryName: location.strCountryName ?? null,
        strAddress: addressLine,
        strStateGUID: location.strStateGUID ?? null,
        strStateName: location.strStateName ?? null,
        strCityGUID: location.strCityGUID ?? null,
        strCityName: location.strCityName ?? null,
        strPinCode: location.strPinCode ?? null,
        strPhone: location.strPhone ?? null,
        strFaxNumber: location.strFaxNumber ?? null,
      };
    },
    []
  );

  const normalizeInvoiceAddress = (address?: InvoiceAddress | null) => {
    if (!address) return null;
    const hasValue = Object.values(address).some((value) => {
      if (value === null || value === undefined) return false;
      return `${value}`.trim().length > 0;
    });
    return hasValue ? address : null;
  };

  // Auto-fill payment terms, currency, and addresses when party data is loaded
  useEffect(() => {
    const currentStatus = form.getValues("strStatus");
    const canUpdateAddresses = !isEditMode || currentStatus === "Draft";

    if (partyWithLocations && canUpdateAddresses) {
      // Set payment terms
      if (
        partyWithLocations.intPaymentTerms_inDays !== null &&
        partyWithLocations.intPaymentTerms_inDays !== undefined
      ) {
        form.setValue(
          "intPaymentTermsDays",
          partyWithLocations.intPaymentTerms_inDays
        );
      }

      // Set currency
      if (partyWithLocations.strCurrencyTypeGUID) {
        form.setValue(
          "strCurrencyTypeGUID",
          partyWithLocations.strCurrencyTypeGUID
        );
      }

      // Resolve new or legacy keys
      const billing =
        partyWithLocations.billingAddress ?? partyWithLocations.BillingAddress;
      const shipping =
        partyWithLocations.shippingAddress ??
        partyWithLocations.ShippingAddress;

      const billingAddress = mapPartyAddressToInvoiceAddress(billing);
      const shippingAddress = mapPartyAddressToInvoiceAddress(shipping);

      if (billingAddress) {
        form.setValue("strBillingAddress", billingAddress);
      }

      if (shippingAddress) {
        form.setValue("strShippingAddress", shippingAddress);
      }
    }
  }, [partyWithLocations, isEditMode, form, mapPartyAddressToInvoiceAddress]);

  const updateFormWithItems = React.useCallback(
    (items: InvoiceItem[]) => {
      const subTotal = items.reduce(
        (sum, item) => sum + (item.dblTotalAmt || 0),
        0
      );
      const currentValues = form.getValues();
      const taxAmount = hasTaxConfig
        ? items.reduce((sum, item) => sum + (item.dblTaxAmt || 0), 0)
        : 0;
      const adjustmentAmount = currentValues.dblAdjustmentAmt || 0;
      const netAmount = subTotal + taxAmount + adjustmentAmount;

      form.setValue(
        "items",
        items.map((item, index) => ({
          ...(item.strInvoice_ItemGUID && {
            strInvoice_ItemGUID: item.strInvoice_ItemGUID,
          }),
          intSeqNo: index + 1,
          strItemGUID: item.strItemGUID || null,
          strDesc: item.strDesc || "",
          dblQty: Number(item.dblQty || 0),
          dblRate: Number(item.dblRate || 0),
          dblAmount: Number(item.dblQty || 0) * Number(item.dblRate || 0),
          // Keep undefined so Zod optional string passes; we already enforce required via custom validation
          strAccountGUID: item.strAccountGUID || undefined,
        })),
        { shouldValidate: true }
      );

      form.setValue("dblGrossTotalAmt", subTotal, { shouldValidate: true });
      form.setValue("dblTaxAmt", taxAmount, { shouldValidate: true });
      form.setValue("dblNetAmt", netAmount, { shouldValidate: true });
    },
    [form, hasTaxConfig]
  );

  useEffect(() => {
    updateFormWithItems(invoiceItems);
  }, [invoiceItems, updateFormWithItems]);

  useEffect(() => {
    if (isEditMode && invoice) {
      const formValues = {
        dInvoiceDate: invoice.dInvoiceDate.substring(0, 10),
        intPaymentTermsDays: invoice.intPaymentTermsDays || 30,
        dtDueDate: invoice.dtDueDate ? invoice.dtDueDate.substring(0, 10) : "",
        strStatus: invoice.strStatus || "Draft",
        strSubject: invoice.strSubject || "",
        strOrderNo: invoice.strOrderNo || "",
        strPartyGUID: invoice.strPartyGUID || "",
        strCustomerNotes: invoice.strCustomerNotes || "Thanks for your business",
        strTC: invoice.strTC || "",
        bolIsPaid: invoice.bolIsPaid,
        strCurrencyTypeGUID: invoice.strCurrencyTypeGUID || null,
        strBillingAddress: invoice.strBillingAddress || null,
        strShippingAddress: invoice.strShippingAddress || null,
        strAdjustmentName: invoice.strAdjustmentName || "",
        strAdjustment_AccountGUID: invoice.strAdjustment_AccountGUID || null,
        dblAdjustmentAmt: Number(invoice.dblAdjustmentAmt || 0),
        dblGrossTotalAmt: Number(invoice.dblGrossTotalAmt || 0),
        dblTaxAmt: Number(invoice.dblTaxAmt || 0),
        dblTotalDiscountAmt: Number(invoice.dblTotalDiscountAmt || 0),
        dblNetAmt: Number(invoice.dblNetAmt || 0),
        items: [],
      } satisfies FormData;

      form.reset(formValues);

      // Set exchange rate from existing invoice
      if (invoice.dblExchangeRate) {
        setCustomExchangeRate(invoice.dblExchangeRate.toFixed(3));
        form.setValue(
          "dblExchangeRate",
          Number(invoice.dblExchangeRate.toFixed(3))
        );
      }

      // Set original currency for tracking changes
      setOriginalCurrencyGUID(invoice.strCurrencyTypeGUID || "");

      if (invoice.items) {
        setInvoiceItems(invoice.items);
      }

      if (invoice.strFiles && invoice.strFiles.length > 0) {
        const attachmentFiles: AttachmentFile[] = invoice.strFiles
          .filter(
            (file) =>
              file.strDocumentAssociationGUID &&
              file.strFileName &&
              file.strFileType &&
              file.strFileSize
          )
          .map((file) => ({
            strDocumentAssociationGUID: file.strDocumentAssociationGUID!,
            strFileName: file.strFileName!,
            strFileType: file.strFileType!,
            strFileSize: file.strFileSize!,
            strFilePath: file.strFilePath || undefined,
          }));
        setExistingFiles(attachmentFiles);
      }
    }
  }, [isEditMode, invoice, form]);

  // Sync selected currency with form value
  const watchedCurrency = form.watch("strCurrencyTypeGUID");

  useEffect(() => {
    if (watchedCurrency && watchedCurrency !== "null") {
      setSelectedCurrencyGUID(watchedCurrency as string);
    } else {
      setSelectedCurrencyGUID("");
    }
  }, [watchedCurrency]);

  // Keep exchange rate in sync whenever the API responds so items can refresh immediately.
  useEffect(() => {
    if (!exchangeRateData?.Rate || !isDifferentCurrency) return;
    setCustomExchangeRate(exchangeRateData.Rate.toFixed(3));
  }, [exchangeRateData, isDifferentCurrency]);

  // When currency changes, always reset/edit exchange rate (fallback to 1 if API not available)
  // In edit mode, if changed back to original currency, use invoice's rate
  useEffect(() => {
    if (selectedCurrencyGUID === previousCurrencyGUIDRef.current) return;

    let rate = "1";
    if (isDifferentCurrency) {
      if (isEditMode && selectedCurrencyGUID === originalCurrencyGUID) {
        // Changed back to original currency in edit mode, use invoice's exchange rate
        rate = invoice?.dblExchangeRate?.toFixed(3) || "1";
      } else if (exchangeRateData?.Rate) {
        // API provided rate
        rate = exchangeRateData.Rate.toFixed(3);
      } else {
        // No API rate available, use 1
        rate = "1";
      }
    } else {
      // Same currency, rate is 1
      rate = "1";
    }

    setCustomExchangeRate(rate);
    setIsEditingExchangeRate(false);
    previousCurrencyGUIDRef.current = selectedCurrencyGUID;
  }, [
    selectedCurrencyGUID,
    isDifferentCurrency,
    exchangeRateData?.Rate,
    isEditMode,
    originalCurrencyGUID,
    invoice?.dblExchangeRate,
  ]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "dInvoiceDate" || name === "intPaymentTermsDays") {
        const dInvoiceDate = value.dInvoiceDate;
        const intPaymentTermsDays = value.intPaymentTermsDays;

        if (dInvoiceDate && typeof dInvoiceDate === "string") {
          const invoiceDate = new Date(dInvoiceDate);
          const paymentTerms =
            typeof intPaymentTermsDays === "number" ? intPaymentTermsDays : 0;

          const dueDate = new Date(invoiceDate);
          dueDate.setDate(dueDate.getDate() + paymentTerms);

          form.setValue("dtDueDate", dueDate.toISOString().split("T")[0]);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (
        name?.startsWith("items.") ||
        name === "dblAdjustmentAmt" ||
        name === "dblTaxAmt"
      ) {
        const allValues = form.getValues();
        const subtotal = allValues.dblGrossTotalAmt || 0;
        const taxAmt = allValues.dblTaxAmt || 0;
        const adjustmentAmt = allValues.dblAdjustmentAmt || 0;

        const netAmount = subtotal + taxAmt + adjustmentAmt;
        form.setValue("dblNetAmt", netAmount);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Show single toast for validation errors (only after form submission attempt)
  useEffect(() => {
    // Don't show validation errors during initial form load or before submission
    if (!form.formState.isSubmitted) return;

    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);

    if (errorFields.length > 0) {
      const firstError = errors[errorFields[0] as keyof typeof errors];
      const errorMessage =
        firstError?.message || "Please fill in all required fields";
      toast.error(errorMessage);
    }
  }, [form.formState.errors, form.formState.isSubmitted]);

  const onSubmit = async (data: FormData, status?: string) => {
    if (
      status === "Draft" ||
      status === "Pending For Approval" ||
      status === "Approved"
    ) {
      setSubmittingAs(status);
    }
    if (!invoiceItems || invoiceItems.length === 0) {
      toast.error("At least one invoice item is required");
      return;
    }

    const invalidItems = invoiceItems
      .map((item, index) => {
        if (!item.dblQty || item.dblQty <= 0) {
          return { index, error: "Quantity must be greater than 0" };
        }
        if (!item.dblRate || item.dblRate < 0) {
          return { index, error: "Rate must be 0 or greater" };
        }
        return null;
      })
      .filter((item) => item !== null);

    if (invalidItems.length > 0) {
      invalidItems.forEach((item) => {
        if (item) {
          toast.error(`Item ${item.index + 1}: ${item.error}`);
        }
      });
      return;
    }

    // Calculate exchange rate value; when currency is same, force 1 so base = normal
    const exchangeRate = (() => {
      const parsed = customExchangeRate?.trim()
        ? parseFloat(customExchangeRate)
        : exchangeRateData?.Rate;
      return typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0
        ? parsed
        : 1;
    })();

    // Calculate base currency amounts (always mirror amounts; FX=1 when same currency)
    const grossTotalAmtBase = Number(
      ((data.dblGrossTotalAmt || 0) * exchangeRate).toFixed(3)
    );
    const totalDiscountAmtBase = Number(
      ((data.dblTotalDiscountAmt || 0) * exchangeRate).toFixed(3)
    );
    const taxAmtBase = Number(
      ((data.dblTaxAmt || 0) * exchangeRate).toFixed(3)
    );
    const adjustmentAmtBase = Number(
      ((data.dblAdjustmentAmt || 0) * exchangeRate).toFixed(3)
    );
    const netAmtBase = Number(
      ((data.dblNetAmt || 0) * exchangeRate).toFixed(3)
    );

    const billingAddress = normalizeInvoiceAddress(data.strBillingAddress);
    const shippingAddress = normalizeInvoiceAddress(data.strShippingAddress);

    const formData = {
      ...data,
      strOrderNo: data.strOrderNo || null,
      strBillingAddress: billingAddress,
      strShippingAddress: shippingAddress,
      // Ensure all discount fields default to 0 if not provided
      dblTotalDiscountAmt: data.dblTotalDiscountAmt || 0,
      // Exchange rate fields (always send 1 when same currency)
      dblExchangeRate: exchangeRate,
      dtExchangeRateDate:
        isEditMode && invoice?.dtExchangeRateDate
          ? invoice.dtExchangeRateDate
          : new Date().toISOString().split("T")[0],
      // Base currency amounts
      dblGrossTotalAmtBase: grossTotalAmtBase,
      dblTotalDiscountAmtBase: totalDiscountAmtBase,
      dblTaxAmtBase: taxAmtBase,
      dblAdjustmentAmtBase: adjustmentAmtBase,
      dblNetAmtBase: netAmtBase,
      dblPendingAmount:
        isEditMode && invoice?.dblPendingAmount !== undefined
          ? invoice.dblPendingAmount
          : data.dblNetAmt || 0,
      dblPendingAmountBase:
        isEditMode && invoice?.dblPendingAmountBase !== undefined
          ? invoice.dblPendingAmountBase
          : netAmtBase,
      items: invoiceItems.map((item, index) => {
        return {
          ...(isEditMode &&
            item.strInvoice_ItemGUID && {
              strInvoice_ItemGUID: item.strInvoice_ItemGUID,
            }),
          intSeqNo: index + 1,
          strCategoryGUID: item.strCategoryGUID || null,
          strItemGUID: item.strItemGUID || null,
          strUoMGUID: item.strUoMGUID || null,
          strDesc: item.strDesc || "",
          dblQty: Number(item.dblQty || 0),
          dblRate: Number(item.dblRate || 0),
          dblTaxPercentage: item.dblTaxPercentage ?? 0,
          dblTaxAmt: Number(item.dblTaxAmt || 0),
          dblTotalAmt: Number(item.dblTotalAmt || 0),
          dblDiscountPercentage: Number(item.dblDiscountPercentage || 0),
          dblDiscountAmt: Number(item.dblDiscountAmt || 0),
          dblNetAmt: Number(item.dblNetAmt || 0),
          // Keep undefined so Zod optional string passes; we already enforce required via custom validation
          strAccountGUID: item.strAccountGUID || undefined,
          dblRateBase: Number(((item.dblRate || 0) * exchangeRate).toFixed(3)),
          dblTaxAmtBase: Number(
            ((item.dblTaxAmt || 0) * exchangeRate).toFixed(3)
          ),
          dblTotalAmtBase: Number(
            ((item.dblTotalAmt || 0) * exchangeRate).toFixed(3)
          ),
          dblDiscountAmtBase: Number(
            ((item.dblDiscountAmt || 0) * exchangeRate).toFixed(3)
          ),
          dblNetAmtBase: Number(
            ((item.dblNetAmt || 0) * exchangeRate).toFixed(3)
          ),
        };
      }),
    } as FormData;

    if (isEditMode) {
      const updateData = {
        ...formData,
        strStatus: status || formData.strStatus,
      } as unknown as InvoiceUpdate;

      await updateMutation.mutateAsync({
        id: id!,
        invoice: updateData,
        files: attachments.length > 0 ? attachments : undefined,
        removeDocumentIds:
          removedDocumentIds.length > 0 ? removedDocumentIds : undefined,
      });

      setSubmittingAs(null);
      setAttachments([]);
      setRemovedDocumentIds([]);

      navigate("/invoice");
    } else {
      const createData = {
        ...formData,
        strStatus: status || "Draft",
      } as unknown as InvoiceCreate;

      await createMutation.mutateAsync({
        invoice: createData,
        files: attachments.length > 0 ? attachments : undefined,
      });

      setSubmittingAs(null);
      setAttachments([]);
      setRemovedDocumentIds([]);

      navigate("/invoice");
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id) return;

    await deleteMutation.mutateAsync({ id: id! });
    navigate("/invoice");
    setShowDeleteConfirm(false);
  };

  const hasItemsForPrint = React.useMemo(() => {
    if (invoice?.items && invoice.items.length > 0) return true;
    return invoiceItems.length > 0;
  }, [invoice?.items, invoiceItems]);

  if (isFetchingInvoice && isEditMode) {
    return (
      <CustomContainer>
        <InvoiceFormSkeleton />
      </CustomContainer>
    );
  }

  if (
    isEditMode &&
    !isFetchingInvoice &&
    (invoiceError || (!invoice && !isFetchingInvoice))
  ) {
    return <NotFound pageName="Invoice" />;
  }

  const handleBack = () => {
    navigate("/invoice");
  };

  const handleOpenPrintPage = () => {
    const path =
      id && id !== "new" ? `/invoice/${id}/print` : "/invoice/draft/print";

    if (!hasItemsForPrint) {
      toast.error("Add at least one invoice item before printing");
      return;
    }

    navigate(path, {
      state: {
        formValues: form.getValues(),
        items: invoiceItems,
        customerName,
        currencyLabel,
      },
    });
  };

  // Show Print button only when status is not Draft
  const canShowPrint = !(
    (isEditMode ? invoice?.strStatus : form.watch("strStatus")) === "Draft"
  );

  return (
    <>
      <CustomContainer className="flex flex-col h-screen">
        <PageHeader
          title={isEditMode ? "Edit Sales Invoice" : "Create Sales Invoice"}
          icon={HeaderIcon}
          description={
            isEditMode
              ? "Edit sales invoice details"
              : "Create a new sales invoice"
          }
          actions={
            <div className="flex gap-2">
              {canShowPrint && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenPrintPage}
                  className="h-9 text-xs sm:text-sm"
                  size="sm"
                  disabled={!hasItemsForPrint}
                >
                  <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Print
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                Back
              </Button>
            </div>
          }
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (data) => onSubmit(data),
              (errors) => {
                // Show item-specific errors first (existing behavior)
                if (errors.items) {
                  toast.error("Please fix all sales invoice item errors");

                  if (Array.isArray(errors.items)) {
                    errors.items.forEach((itemError, index) => {
                      if (itemError) {
                        Object.values(itemError).forEach((error) => {
                          if (
                            error &&
                            typeof error === "object" &&
                            "message" in error
                          ) {
                            toast.error(`Item ${index + 1}: ${error.message}`);
                          }
                        });
                      }
                    });
                  } else if (errors.items.message) {
                    toast.error(errors.items.message);
                  }
                }

                // Show field errors
                Object.entries(errors).forEach(([field, error]) => {
                  if (
                    field !== "items" &&
                    error &&
                    typeof error === "object" &&
                    "message" in error
                  ) {
                    toast.error(error.message);
                  }
                });
              }
            )}
            className="space-y-6 flex flex-col flex-1"
          >
            <Card>
              <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Customer Selection and Currency Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
                    <FormField
                      control={form.control}
                      name="strPartyGUID"
                      render={({ field }) => (
                        <FormItem
                          className="lg:col-span-2"
                          data-field="strPartyGUID"
                        >
                          <FormLabel>
                            Customer Name{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelectWithAvatar
                              placeholder="Select customer"
                              selectedValue={field.value || undefined}
                              onChange={field.onChange}
                              options={(activeCustomers || []).map(
                                (p): SelectOptionWithDetails => {
                                  return {
                                    value: p.strPartyGUID,
                                    label:
                                      p.strPartyName_Display || p.strPartyGUID,
                                    phone: p.strPhoneNoWork || undefined,
                                    mobile: p.strPhoneNoWork
                                      ? undefined
                                      : p.strPhoneNoPersonal || undefined,
                                    email: p.strEmail || undefined,
                                    company: p.strCompanyName || undefined,
                                  };
                                }
                              )}
                              isLoading={isLoadingCustomers}
                              queryKey={["parties", "list", "active:Customer"]}
                              disabled={isFormDisabled}
                              onOpenChange={(isOpen: boolean) =>
                                setDropdownOpen((p) => ({
                                  ...p,
                                  customers: isOpen,
                                }))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strCurrencyTypeGUID"
                      render={({ field }) => (
                        <FormItem
                          className="lg:col-span-1"
                          data-field="strCurrencyTypeGUID"
                        >
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              placeholder="Select currency"
                              selectedValue={field.value || undefined}
                              onChange={(value) => {
                                field.onChange(value);
                                if (value && value !== "null") {
                                  setSelectedCurrencyGUID(value);
                                } else {
                                  setSelectedCurrencyGUID("");
                                }
                              }}
                              options={(currencyTypes || []).map((c) => ({
                                value: c.strCurrencyTypeGUID,
                                label: c.strName,
                              }))}
                              queryKey={["currency-types", "list", "active"]}
                              disabled={true}
                              onOpenChange={(isOpen: boolean) =>
                                setDropdownOpen((p) => ({
                                  ...p,
                                  currencies: isOpen,
                                }))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch("strPartyGUID") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="strBillingAddress"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center  mb-2">
                              <FormLabel>Billing Address</FormLabel>
                              {!isFormDisabled && (
                                <div
                                  className="ml-2 cursor-pointer text-primary"
                                  onClick={() => setOpenBillingDialog(true)}
                                  aria-label="Edit billing address"
                                >
                                  <Pencil className="size-4" />
                                </div>
                              )}
                            </div>
                            <FormControl>
                              <div className="min-h-25 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                {formatInvoiceAddress(
                                  field.value as InvoiceAddress | null
                                ) || "No address"}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Shipping Address */}
                      <FormField
                        control={form.control}
                        name="strShippingAddress"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center mb-2">
                              <FormLabel>Shipping Address</FormLabel>
                              {!isFormDisabled && (
                                <div
                                  className="ml-2 cursor-pointer text-primary"
                                  onClick={() => setOpenShippingDialog(true)}
                                  aria-label="Edit shipping address"
                                >
                                  <Pencil className="size-4" />
                                </div>
                              )}
                            </div>
                            <FormControl>
                              <div className="min-h-25 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                {formatInvoiceAddress(
                                  field.value as InvoiceAddress | null
                                ) || "No address"}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
                      <FormLabel>Sales Invoice No.</FormLabel>
                      <div className="relative mt-2">
                        <Input
                          placeholder="Auto Generated"
                          value={
                            isEditMode
                              ? (invoice?.strInvoiceNo ?? "")
                              : "Auto Generated"
                          }
                          disabled={true}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={handleSettingsClick}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title="Year Settings"
                        >
                          <Settings className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="dInvoiceDate"
                      render={({ field }) => (
                        <FormItem data-field="dInvoiceDate">
                          <FormLabel>
                            Sales Invoice Date{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              onChange={(date) =>
                                field.onChange(
                                  date ? date.toISOString().split("T")[0] : ""
                                )
                              }
                              placeholder="Select date"
                              restricted={true}
                              disabled={
                                isFormDisabled
                                  ? true
                                  : (date) => {
                                      if (
                                        !user?.dtYearStartDate ||
                                        !user?.dtYearEndDate
                                      )
                                        return false;
                                      const startDate = new Date(
                                        user.dtYearStartDate
                                      );
                                      const endDate = new Date(
                                        user.dtYearEndDate
                                      );
                                      return date < startDate || date > endDate;
                                    }
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Order Number moved to Terms row below */}
                  </div>

                  {/* Terms and Due Date Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="strOrderNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PO Reference No.</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter PO refrerence number"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={isFormDisabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="intPaymentTermsDays"
                      render={({ field }) => (
                        <FormItem data-field="intPaymentTermsDays">
                          <FormLabel>Terms (Days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder="30"
                              step={1}
                              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value, 10);
                                field.onChange(value);
                              }}
                              disabled={isFormDisabled}
                              min="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dtDueDate"
                      render={({ field }) => (
                        <FormItem data-field="dtDueDate">
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              onChange={(date) =>
                                field.onChange(
                                  date ? date.toISOString().split("T")[0] : ""
                                )
                              }
                              placeholder="dd/MM/yyyy"
                              disabled={isFormDisabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="strSubject"
                    render={({ field }) => (
                      <FormItem data-field="strSubject">
                        <FormLabel>
                          Subject <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Sales Invoice subject"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={isFormDisabled}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bolIsPaid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                        <FormLabel>Payment Status</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isFormDisabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-6" />

                  <div>
                    <InvoiceItemsSection
                      form={form}
                      invoiceItems={invoiceItems}
                      setInvoiceItems={setInvoiceItems}
                      isFormDisabled={isFormDisabled}
                      currencyLabel={currencyLabel}
                      existingFiles={existingFiles}
                      attachments={attachments}
                      isDifferentCurrency={isDifferentCurrency}
                      exchangeRateData={exchangeRateData ?? null}
                      isLoadingExchangeRate={isLoadingExchangeRate}
                      isEditingExchangeRate={isEditingExchangeRate}
                      setIsEditingExchangeRate={setIsEditingExchangeRate}
                      customExchangeRate={customExchangeRate}
                      setCustomExchangeRate={setCustomExchangeRate}
                      exchangeRateDate={
                        isEditMode
                          ? invoice?.dtExchangeRateDate
                            ? invoice.dtExchangeRateDate
                            : undefined
                          : undefined
                      }
                      fromCurrency={fromCurrency}
                      toCurrency={toCurrency}
                      partyWithLocations={effectivePartyWithLocations}
                      onExistingFileRemove={(guid) => {
                        setRemovedDocumentIds((prev) => [...prev, guid]);
                        setExistingFiles((prev) =>
                          prev.filter(
                            (file) => file.strDocumentAssociationGUID !== guid
                          )
                        );
                      }}
                      onNewFileAdd={(files) => {
                        setAttachments((prev) => [...prev, ...files]);
                      }}
                      onNewFileRemove={(index) => {
                        setAttachments((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-medium">
                            Customer Notes
                          </h3>
                        </div>
                        <FormField
                          control={form.control}
                          name="strCustomerNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Thanks for your business."
                                  className="min-h-20 sm:min-h-25 text-sm"
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                  rows={4}
                                  disabled={isFormDisabled}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <div className="text-xs text-gray-500 mt-1">
                                Will be displayed on the sales invoice
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div>
                        <div className="mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-medium">
                            Terms & Conditions
                          </h3>
                        </div>
                        <FormField
                          control={form.control}
                          name="strTC"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
                                  className="min-h-20 sm:min-h-25 text-sm"
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                  rows={4}
                                  disabled={isFormDisabled}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Footer */}
              <div className="mt-auto bg-card sticky bottom-0 border-t border-border-color">
                <CardFooter className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                  <div className="flex gap-2">
                    {isEditMode ? (
                      <WithPermission
                        module={FormModules.INVOICE}
                        action={Actions.DELETE}
                      >
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isFormDisabled || deleteMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </WithPermission>
                    ) : null}
                  </div>

                  <WithPermission
                    module={FormModules.INVOICE}
                    action={isEditMode ? Actions.EDIT : Actions.SAVE}
                  >
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        onClick={form.handleSubmit((data) =>
                          onSubmit(data, "Draft")
                        )}
                        disabled={
                          isEditMode
                            ? isFormDisabled || updateMutation.isPending
                            : createMutation.isPending
                        }
                        variant="outline"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {(isEditMode
                          ? updateMutation.isPending
                          : createMutation.isPending) &&
                        submittingAs === "Draft"
                          ? "Saving..."
                          : "Save as Draft"}
                      </Button>
                      <Button
                        type="button"
                        onClick={form.handleSubmit((data) =>
                          onSubmit(
                            data,
                            hasApproveRights
                              ? "Approved"
                              : "Pending For Approval"
                          )
                        )}
                        disabled={
                          isEditMode
                            ? isFormDisabled || updateMutation.isPending
                            : createMutation.isPending
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {(isEditMode
                          ? updateMutation.isPending
                          : createMutation.isPending) &&
                        (submittingAs === "Pending For Approval" ||
                          submittingAs === "Approved")
                          ? "Saving..."
                          : hasApproveRights
                            ? "Save and Approve"
                            : "Save and Submit for Approval"}
                      </Button>
                    </div>
                  </WithPermission>
                </CardFooter>
              </div>
            </Card>
          </form>
        </Form>
      </CustomContainer>

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this sales invoice? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />

      <AddressEditDialog
        open={openBillingDialog}
        onOpenChange={setOpenBillingDialog}
        title="Edit Billing Address"
        initialAddress={form.getValues("strBillingAddress") || null}
        disabled={isFormDisabled}
        onSave={(addr) => form.setValue("strBillingAddress", addr)}
        partyGUID={selectedPartyGUID}
        addressType="billing"
      />
      <AddressEditDialog
        open={openShippingDialog}
        onOpenChange={setOpenShippingDialog}
        title="Edit Shipping Address"
        initialAddress={form.getValues("strShippingAddress") || null}
        disabled={isFormDisabled}
        onSave={(addr) => form.setValue("strShippingAddress", addr)}
        partyGUID={selectedPartyGUID}
        addressType="shipping"
      />
    </>
  );
};

export default InvoiceForm;
