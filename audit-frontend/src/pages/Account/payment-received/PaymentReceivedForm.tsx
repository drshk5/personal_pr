import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Receipt,
  Trash2,
  Settings,
  Pencil,
  X,
  Printer,
} from "lucide-react";

import type { PaymentReceivedFormData } from "@/types/Account/payment-received";
import type { AttachmentFile } from "@/types/common";
import type { ScheduleTreeNode } from "@/types/Account/account";

import {
  createPaymentReceivedSchema,
  updatePaymentReceivedSchema,
  type CreatePaymentReceivedFormData,
  type UpdatePaymentReceivedFormData,
} from "@/validations/Account/payment-received";

import { Actions, FormModules, usePermission } from "@/lib/permissions";

import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import {
  usePaymentReceivedById,
  useCreatePaymentReceived,
  useUpdatePaymentReceived,
  useDeletePaymentReceived,
} from "@/hooks/api/Account/use-payment-received";
import {
  useActivePartiesByType,
  useParty,
} from "@/hooks/api/Account/use-parties";
import { useAccountsByTypesTree } from "@/hooks/api/Account";
import { useExchangeRate } from "@/hooks/api/central/use-organizations";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  PreloadedSelectWithAvatar,
  type SelectOptionWithDetails,
} from "@/components/ui/select/preloaded-select-with-avatar";
import { TreeDropdown } from "@/components/ui/select/tree-dropdown";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { WithPermission } from "@/components/ui/with-permission";
import { AttachmentManager } from "@/components/ui/attachments/AttachmentManager";
import NotFound from "@/components/error-boundaries/entity-not-found";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentReceivedFormSkeleton } from "./PaymentReceivedFormSkeleton";
import { PaymentReceivedItemsTable } from "./components/PaymentReceivedItemsTable";

const PAYMENT_MODES = [
  { value: "Bank", label: "Bank" },
  { value: "Card", label: "Card" },
  { value: "Cash", label: "Cash" },
  { value: "Cheque", label: "Cheque" },
];

const PaymentReceivedForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [receivedFullAmount, setReceivedFullAmount] = useState<boolean>(false);
  const [selectedCurrencyGUID, setSelectedCurrencyGUID] = useState<string>("");
  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);
  const [customExchangeRate, setCustomExchangeRate] = useState<string>("1");
  const [originalCurrencyGUID, setOriginalCurrencyGUID] = useState<string>("");
  const [submittingAs, setSubmittingAs] = useState<
    "Draft" | "Received" | "PendingForApproval" | null
  >(null);
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [pendingAmountToDistribute, setPendingAmountToDistribute] =
    useState<number>(0);
  const [showExcessAmountConfirm, setShowExcessAmountConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<{
    values: CreatePaymentReceivedFormData | UpdatePaymentReceivedFormData;
    status?: string;
  } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<AttachmentFile[]>([]);
  const [removedFileGUIDs, setRemovedFileGUIDs] = useState<string[]>([]);
  const [paymentItems, setPaymentItems] = useState<
    Array<{
      strPaymentReceived_ItemGUID?: string;
      strInvoiceGUID: string;
      dtPaymentReceivedOn: string;
      dblPaymentAmount: number;
      dblPendingAmount?: number;
      originalPaymentAmount?: number;
      dInvoiceDate?: string;
    }>
  >([]);
  const previousCustomerGUID = useRef<string | null>(null);
  const hasApproveRights = usePermission(
    FormModules.PAYMENT_RECEIVED,
    Actions.APPROVE
  );
  const [dropdownOpen, setDropdownOpen] = useState({
    customers: false,
    accounts: false,
    currencies: false,
  });

  const HeaderIcon = useMenuIcon(FormModules.PAYMENT_RECEIVED, Receipt);
  const isEditMode = !!id && id !== "new";

  // Enable lazy fetch for create; prefetch for edit to fill existing values
  const shouldPrefetch = isEditMode;
  const customersEnabled = dropdownOpen.customers || shouldPrefetch;
  const accountsEnabled = dropdownOpen.accounts || shouldPrefetch;
  const currenciesEnabled = dropdownOpen.currencies || shouldPrefetch;

  // Fetch customers
  const { data: activeCustomers, isLoading: isLoadingCustomers } =
    useActivePartiesByType({ strPartyType: "Customer" }, customersEnabled);

  // Fetch account tree for account selection
  const { data: accountsTreeData } = useAccountsByTypesTree(
    {
      strAccountTypeGUIDs: "",
      maxLevel: 0,
    },
    { enabled: accountsEnabled }
  );

  // Fetch currency types for exchange rate display
  const { data: currencyTypes } = useActiveCurrencyTypes(
    undefined,
    currenciesEnabled
  );

  // Fetch payment received data first (needed for exchange rate logic)
  const {
    data: paymentReceived,
    isFetching: isFetchingPaymentReceived,
    error: paymentReceivedError,
  } = usePaymentReceivedById(isEditMode ? id : undefined);

  // Calculate currency names for display
  const fromCurrency = useMemo(() => {
    return (
      (currencyTypes || []).find(
        (currency) => currency.strCurrencyTypeGUID === selectedCurrencyGUID
      )?.strName || ""
    );
  }, [currencyTypes, selectedCurrencyGUID]);

  const toCurrency = useMemo(() => {
    return (
      (currencyTypes || []).find(
        (currency) => currency.strCurrencyTypeGUID === user?.strCurrencyTypeGUID
      )?.strName || ""
    );
  }, [currencyTypes, user?.strCurrencyTypeGUID]);

  // Fetch exchange rate when currency is different from user's currency
  const shouldFetchExchangeRate =
    !!selectedCurrencyGUID &&
    selectedCurrencyGUID !== user?.strCurrencyTypeGUID &&
    (!isEditMode ||
      (isEditMode &&
        paymentReceived?.strStatus === "Draft" &&
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

  // Map account tree to dropdown items
  const accountTreeItems = useMemo(() => {
    if (!accountsTreeData?.scheduleTree) return [];

    type LocalTreeItem = {
      id: string;
      name: string;
      code?: string;
      type: "data" | "label";
      children: LocalTreeItem[];
    };

    const mapTree = (nodes: ScheduleTreeNode[]): LocalTreeItem[] => {
      return nodes.map((node) => {
        const accountChildren: LocalTreeItem[] = (node.accounts || [])
          .filter((account) => account.bolIsActive)
          .map((account) => ({
            id: account.strAccountGUID,
            name: account.strAccountName,
            type: "data" as const,
            children: [],
          }));

        const scheduleChildren: LocalTreeItem[] = node.children
          ? mapTree(node.children)
          : [];

        return {
          id: `schedule-${node.strScheduleGUID}`,
          name: `${node.strScheduleName} (${node.strScheduleCode})`,
          code: node.strScheduleCode,
          type: "label" as const,
          children: [...accountChildren, ...scheduleChildren],
        };
      });
    };

    return mapTree(accountsTreeData.scheduleTree);
  }, [accountsTreeData]);

  const handleSettingsClick = () => {
    if (user?.strLastYearGUID) {
      window.open(`/year/${user.strLastYearGUID}`, "_blank");
    }
  };

  // Determine if form should be disabled (only Draft status can be edited)
  const isFormDisabled = isEditMode && paymentReceived?.strStatus !== "Draft";

  const currentSchema = isEditMode
    ? updatePaymentReceivedSchema
    : createPaymentReceivedSchema;

  type CombinedFormValues =
    | CreatePaymentReceivedFormData
    | UpdatePaymentReceivedFormData;

  const form = useForm<CombinedFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(currentSchema as any),
    defaultValues: {
      dPaymentReceivedDate: new Date().toISOString().split("T")[0],
      strCustomerGUID: "",
      strAccountGUID: "",
      strPaymentMode: "Cash",
      dblTotalAmountReceived: 0,
      strRefNo: "",
      strSubject: "",
      dblBankCharges: 0,
      strNotes: "",
      dtExchangeRateDate: null,
      dblExchangeRate: 1,
      strCurrencyTypeGUID: null,
      Items: [],
    } as CombinedFormValues,
  });

  // Show single toast for validation errors (only after form submission attempt and if errors exist)
  useEffect(() => {
    if (!form.formState.isSubmitted) return;
    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      const firstError = errors[errorFields[0] as keyof typeof errors];
      const errorMessage =
        firstError?.message || "Please fill in all required fields";
      toast.error(errorMessage);
    }
  }, [form.formState.errors, form.formState.isSubmitted, form, paymentItems]);

  // Get selected customer details for PAN display
  const paymentMode = form.watch("strPaymentMode");
  const selectedCustomerGUID = form.watch("strCustomerGUID");
  const { data: selectedCustomer } = useParty(
    selectedCustomerGUID || undefined
  );

  // Sync selected currency with customer's currency
  useEffect(() => {
    // In edit mode, don't sync currency from customer (use the one from payment received data)
    if (isEditMode) {
      return;
    }

    if (selectedCustomer?.strCurrencyTypeGUID) {
      setSelectedCurrencyGUID(selectedCustomer.strCurrencyTypeGUID);
      form.setValue(
        "strCurrencyTypeGUID",
        selectedCustomer.strCurrencyTypeGUID
      );
    } else {
      setSelectedCurrencyGUID("");
      form.setValue("strCurrencyTypeGUID", null);
    }
  }, [selectedCustomer?.strCurrencyTypeGUID, form, isEditMode]);

  // Keep exchange rate in sync with API response
  useEffect(() => {
    if (!exchangeRateData?.Rate || !isDifferentCurrency) return;
    setCustomExchangeRate(exchangeRateData.Rate.toFixed(3));
    form.setValue("dblExchangeRate", exchangeRateData.Rate);
    form.setValue("dtExchangeRateDate", new Date().toISOString().split("T")[0]);
  }, [exchangeRateData, isDifferentCurrency, form]);

  // Extract currency code (AUD, INR, etc.) - take first word or first 3-4 chars if it's a code
  const getCurrencyCode = (currencyName?: string | null): string => {
    if (!currencyName) return "";

    if (
      currencyName.length <= 4 &&
      currencyName.toUpperCase() === currencyName
    ) {
      return currencyName;
    }

    const firstWord = currencyName.trim().split(/[\s-]/)[0];
    if (firstWord && firstWord.length <= 4) {
      return firstWord.toUpperCase();
    }

    return currencyName.substring(0, 3).toUpperCase();
  };

  const customerCurrency = getCurrencyCode(
    selectedCustomer?.strCurrencyTypeName || toCurrency
  );

  const totalPendingAmount = useMemo(() => {
    return paymentItems.reduce(
      (sum, item) => sum + (item.dblPendingAmount || 0),
      0
    );
  }, [paymentItems]);

  // Keep form Items in sync with local paymentItems state for validation
  useEffect(() => {
    form.setValue(
      "Items",
      paymentItems as unknown as CombinedFormValues["Items"],
      {
        shouldValidate: false,
        shouldDirty: true,
      }
    );
  }, [paymentItems, form]);

  // Clear bank charges when payment mode is not Bank
  useEffect(() => {
    if (paymentMode !== "Bank") {
      form.setValue("dblBankCharges", 0, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [paymentMode, form]);

  // Reset monetary fields when customer changes
  useEffect(() => {
    // If customer cleared, wipe amounts, items, and currency
    if (!selectedCustomerGUID) {
      setPaymentItems([]);
      form.setValue("Items", []);
      form.setValue("dblTotalAmountReceived", 0);
      form.setValue("dblBankCharges", 0);
      form.setValue("strCurrencyTypeGUID", null);
      setSelectedCurrencyGUID("");
      setReceivedFullAmount(false);
      setShowDistributeDialog(false);
      setPendingAmountToDistribute(0);
      previousCustomerGUID.current = null;
      return;
    }

    if (
      previousCustomerGUID.current &&
      previousCustomerGUID.current !== selectedCustomerGUID
    ) {
      form.setValue("Items", []);
      form.setValue("dblTotalAmountReceived", 0);
      form.setValue("dblBankCharges", 0);
      setReceivedFullAmount(false);
      setShowDistributeDialog(false);
      setPendingAmountToDistribute(0);
    }

    previousCustomerGUID.current = selectedCustomerGUID;
  }, [selectedCustomerGUID, form]);

  // Load existing data for edit mode
  useEffect(() => {
    if (isEditMode && paymentReceived) {
      form.reset({
        dPaymentReceivedDate: paymentReceived.dPaymentReceivedDate.substring(
          0,
          10
        ),
        strCustomerGUID: paymentReceived.strCustomerGUID || "",
        strAccountGUID: paymentReceived.strAccountGUID || "",
        strPaymentMode: paymentReceived.strPaymentMode ?? "Cash",
        dblTotalAmountReceived: paymentReceived.dblTotalAmountReceived,
        strRefNo: paymentReceived.strRefNo || "",
        strSubject: paymentReceived.strSubject || "",
        dblBankCharges: paymentReceived.dblBankCharges || 0,
        strNotes: paymentReceived.strNotes || "",
        dtExchangeRateDate: paymentReceived.dtExchangeRateDate || null,
        dblExchangeRate: paymentReceived.dblExchangeRate || 1,
        strCurrencyTypeGUID: paymentReceived.strCurrencyTypeGUID || null,
      });

      // Set exchange rate from existing payment received
      if (paymentReceived.dblExchangeRate) {
        setCustomExchangeRate(paymentReceived.dblExchangeRate.toFixed(3));
      }

      // Set original currency for tracking changes
      if (paymentReceived.strCurrencyTypeGUID) {
        setOriginalCurrencyGUID(paymentReceived.strCurrencyTypeGUID);
        setSelectedCurrencyGUID(paymentReceived.strCurrencyTypeGUID);
      }

      previousCustomerGUID.current = paymentReceived.strCustomerGUID || null;

      type WithLowercaseItems = typeof paymentReceived & {
        items?: import("@/types/Account/payment-received").PaymentReceivedItemResponse[];
      };
      const responseItems = ((paymentReceived as WithLowercaseItems)?.items ??
        paymentReceived.Items ??
        []) as import("@/types/Account/payment-received").PaymentReceivedItemResponse[];
      if (responseItems && responseItems.length > 0) {
        // Preserve amounts from API; default to 0 if missing
        setPaymentItems(
          responseItems.map((item) => ({
            ...item,
            dInvoiceDate:
              item.dInvoiceDate ||
              (item as { dtInvoiceDate?: string }).dtInvoiceDate,
            dblPaymentAmount: item.dblPaymentAmount ?? 0,
            originalPaymentAmount: item.dblPaymentAmount ?? 0,
          }))
        );
      }

      // Load existing files if available
      if (paymentReceived.strFiles && paymentReceived.strFiles.length > 0) {
        const attachmentFiles: AttachmentFile[] = paymentReceived.strFiles
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
  }, [isEditMode, paymentReceived, form]);

  // Handle received full amount checkbox
  const handleReceivedFullAmountChange = useCallback(
    (checked: boolean) => {
      setReceivedFullAmount(checked);

      if (checked && totalPendingAmount > 0) {
        form.setValue("dblTotalAmountReceived", totalPendingAmount);
        const updatedItems = paymentItems.map((item) => ({
          ...item,
          dblPaymentAmount: item.dblPendingAmount || 0,
        }));
        setPaymentItems(updatedItems);
        setShowDistributeDialog(false);
      } else if (!checked) {
        // Clear amounts when unchecked
        const clearedItems = paymentItems.map((item) => ({
          ...item,
          dblPaymentAmount: 0,
        }));
        setPaymentItems(clearedItems);
        form.setValue("dblTotalAmountReceived", 0);
      }
    },
    [totalPendingAmount, paymentItems, form]
  );

  const createMutation = useCreatePaymentReceived();
  const updateMutation = useUpdatePaymentReceived();
  const deleteMutation = useDeletePaymentReceived();

  // Ensure edit-mode items always retain their original applied amount for allowance calculations
  useEffect(() => {
    if (!isEditMode) return;

    setPaymentItems((prev) =>
      prev.map((item) => ({
        ...item,
        originalPaymentAmount:
          item.originalPaymentAmount ?? item.dblPaymentAmount ?? 0,
      }))
    );
  }, [isEditMode]);

  const onSubmit = async (values: CombinedFormValues, status?: string) => {
    const resolvedStatus = status || paymentReceived?.strStatus || "Draft";

    if (
      status === "Draft" ||
      status === "Received" ||
      status === "PendingForApproval"
    ) {
      setSubmittingAs(status as typeof submittingAs);
    }

    // Validate Deposit To field
    if (!values.strAccountGUID || values.strAccountGUID === "") {
      form.setError("strAccountGUID", {
        type: "manual",
        message: "Deposit To is required",
      });
      setSubmittingAs(null);
      return;
    }

    const currentItems = paymentItems;

    const totalPaymentAmount = currentItems.reduce(
      (sum, item) => sum + (item.dblPaymentAmount || 0),
      0
    );
    // Validate total payment items amount should not exceed total amount received
    const totalAmountReceived = values.dblTotalAmountReceived || 0;
    if (totalPaymentAmount > totalAmountReceived) {
      toast.error(
        "Total payment items amount should not exceed total amount received"
      );
      setSubmittingAs(null);
      return;
    }

    // If nothing is being applied, submit without Items payload
    if (totalPaymentAmount <= 0) {
      try {
        const normalizedDPaymentReceivedDate =
          values.dPaymentReceivedDate instanceof Date
            ? values.dPaymentReceivedDate.toISOString().split("T")[0]
            : values.dPaymentReceivedDate || "";

        const normalizedDtExchangeRateDate =
          values.dtExchangeRateDate instanceof Date
            ? values.dtExchangeRateDate.toISOString().split("T")[0]
            : values.dtExchangeRateDate || null;

        const payload: PaymentReceivedFormData = {
          ...values,
          dPaymentReceivedDate: normalizedDPaymentReceivedDate,
          dtExchangeRateDate: normalizedDtExchangeRateDate,
          Items: [],
          files: attachments.length > 0 ? attachments : undefined,
          strRemoveDocumentAssociationGUIDs:
            removedFileGUIDs.length > 0 ? removedFileGUIDs : undefined,
          strStatus: resolvedStatus,
        };

        if (isEditMode) {
          await updateMutation.mutateAsync({ id: id!, data: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }

        setSubmittingAs(null);
        navigate("/payment-received");
      } catch (error) {
        console.error("Error submitting zero-total form:", error);
        setSubmittingAs(null);
      }
      return;
    }

    // Validate items (skip amount validation for drafts)
    // Skip validation if there are no items
    const invalidItems =
      currentItems.length > 0
        ? currentItems
            .map((item, index) => {
              if (!item.strInvoiceGUID) {
                return { index, error: "Invoice is required" };
              }
              if (!item.dtPaymentReceivedOn) {
                return { index, error: "Payment date is required" };
              }
              // Validate payment date is not before invoice date
              if (item.dInvoiceDate && item.dtPaymentReceivedOn) {
                const invoiceDate = new Date(item.dInvoiceDate);
                const paymentDate = new Date(item.dtPaymentReceivedOn);
                if (paymentDate < invoiceDate) {
                  return {
                    index,
                    error: "Payment date cannot be before invoice date",
                  };
                }
              }
              // Only validate amounts for non-draft statuses
              if (status !== "Draft") {
                if (item.dblPaymentAmount < 0) {
                  return { index, error: "Payment amount cannot be negative" };
                }
              }
              return null;
            })
            .filter((item) => item !== null)
        : [];

    if (invalidItems.length > 0) {
      invalidItems.forEach((item) => {
        if (item) {
          toast.error(`Item ${item.index + 1}: ${item.error}`);
        }
      });
      setSubmittingAs(null);
      return;
    }

    // Check if total amount in excess is greater than 0
    const amountInExcess = totalAmountReceived - totalPaymentAmount;

    if (amountInExcess > 0) {
      setPendingSubmitData({ values, status });
      setShowExcessAmountConfirm(true);
      return;
    }

    try {
      const formattedItems = currentItems
        .filter((item) => (item.dblPaymentAmount || 0) > 0)
        .map((item) => ({
          strPaymentReceived_ItemGUID:
            item.strPaymentReceived_ItemGUID || undefined,
          strInvoiceGUID: item.strInvoiceGUID,
          dtPaymentReceivedOn: item.dtPaymentReceivedOn,
          dblPaymentAmount: item.dblPaymentAmount,
        }));

      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: id!,
          data: {
            ...values,
            Items: formattedItems,
            files: attachments.length > 0 ? attachments : undefined,
            strRemoveDocumentAssociationGUIDs:
              removedFileGUIDs.length > 0 ? removedFileGUIDs : undefined,
            strStatus: resolvedStatus,
          } as PaymentReceivedFormData,
        });
        setSubmittingAs(null);
        navigate("/payment-received");
      } else {
        await createMutation.mutateAsync({
          ...values,
          Items: formattedItems,
          files: attachments.length > 0 ? attachments : undefined,
          strStatus: resolvedStatus,
        } as PaymentReceivedFormData);
        setSubmittingAs(null);
        navigate("/payment-received");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmittingAs(null);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id) return;

    try {
      await deleteMutation.mutateAsync(id);
      navigate("/payment-received");
    } catch (error) {
      console.error("Error deleting payment received:", error);
    }
    setShowDeleteConfirm(false);
  };

  const handleBack = () => {
    navigate("/payment-received");
  };

  const handleOpenPrintPage = () => {
    if (!id || id === "new") {
      toast.error("Please save the payment received record before printing");
      return;
    }

    if (paymentItems.length === 0) {
      toast.error("Add at least one payment item before printing");
      return;
    }

    navigate(`/payment-received/${id}/print`);
  };

  const handleSaveDraft = () => {
    form.handleSubmit((values: CombinedFormValues) =>
      onSubmit(values, "Draft")
    )();
  };

  const handleDistributeAmount = () => {
    if (pendingAmountToDistribute <= 0 || paymentItems.length === 0) {
      setShowDistributeDialog(false);
      return;
    }

    let remainingAmount = pendingAmountToDistribute;
    const updatedItems = paymentItems.map((item) => {
      if (remainingAmount <= 0) return item;

      const pendingAmount = item.dblPendingAmount || 0;
      if (pendingAmount <= 0) return item;

      const amountToApply = Math.min(remainingAmount, pendingAmount);
      remainingAmount -= amountToApply;

      return {
        ...item,
        dblPaymentAmount: amountToApply,
      };
    });

    setPaymentItems(updatedItems);
    setShowDistributeDialog(false);
  };

  const handleClearAppliedAmounts = () => {
    const clearedItems = paymentItems.map((item) => ({
      ...item,
      dblPaymentAmount: 0,
    }));
    setPaymentItems(clearedItems);
  };

  // Attachment handlers
  const handleNewFileAdd = (files: File[]) => {
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleNewFileRemove = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExistingFileRemove = (guid: string) => {
    setExistingFiles((prev) =>
      prev.filter((file) => file.strDocumentAssociationGUID !== guid)
    );
    setRemovedFileGUIDs((prev) => [...prev, guid]);
  };

  if (isEditMode && isFetchingPaymentReceived) {
    return (
      <CustomContainer>
        <PaymentReceivedFormSkeleton />
      </CustomContainer>
    );
  }

  if (isEditMode && !isFetchingPaymentReceived && paymentReceivedError) {
    return <NotFound pageName="Payment Received" />;
  }

  return (
    <>
      <CustomContainer className="flex flex-col h-screen">
        <PageHeader
          title={
            isEditMode ? "Edit Payment Received" : "Create Payment Received"
          }
          icon={HeaderIcon}
          description={
            isEditMode
              ? `Editing payment received ${paymentReceived?.strPaymentReceivedNo}`
              : "Create a new payment received record"
          }
          actions={
            <div className="flex gap-2">
              {isEditMode && paymentReceived?.strStatus !== "Draft" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenPrintPage}
                  className="h-9 text-xs sm:text-sm"
                  size="sm"
                  disabled={paymentItems.length === 0}
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
            onSubmit={form.handleSubmit((data: CombinedFormValues) =>
              onSubmit(data)
            )}
            className="space-y-6 flex flex-col flex-1"
          >
            <Card>
              <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
                <div className="flex flex-col gap-4 sm:gap-6">
                  {/* Customer Selection and Currency Row */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
                    <FormField
                      control={form.control}
                      name="strCustomerGUID"
                      render={({ field }) => (
                        <FormItem
                          className="md:col-span-8"
                          data-field="strCustomerGUID"
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
                              disabled={isEditMode}
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
                          className="md:col-span-4"
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
                              isLoading={isLoadingExchangeRate}
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

                  {selectedCustomer?.strPAN && (
                    <div className="text-sm text-muted-foreground">
                      PAN:{" "}
                      <span className="font-medium text-foreground">
                        {selectedCustomer.strPAN}
                      </span>
                    </div>
                  )}
                  <Separator />

                  <div
                    className={`space-y-4 sm:space-y-6 ${!isEditMode && !selectedCustomerGUID ? "opacity-40 pointer-events-none blur-[1px]" : ""}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      <FormItem>
                        <FormLabel>Payment Receipt No.</FormLabel>
                        <div className="relative">
                          <Input
                            value={
                              isEditMode
                                ? paymentReceived?.strPaymentReceivedNo || ""
                                : "Auto-generated"
                            }
                            disabled
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
                      </FormItem>
                      <FormField
                        control={form.control}
                        name="dPaymentReceivedDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Payment Date
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={(date: Date | undefined) =>
                                  field.onChange(
                                    date ? format(date, "yyyy-MM-dd") : ""
                                  )
                                }
                                disabled={isFormDisabled}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="strPaymentMode"
                        render={({ field }) => {
                          const currentValue = field.value || "Cash";
                          return (
                            <FormItem>
                              <FormLabel>
                                Payment Mode
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select
                                value={currentValue}
                                onValueChange={(value) => {
                                  // Prevent empty or invalid values from being set
                                  if (!value || value.trim() === "") {
                                    return;
                                  }
                                  field.onChange(value);
                                }}
                                disabled={isFormDisabled}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select payment mode" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {PAYMENT_MODES.map((mode) => (
                                    <SelectItem
                                      key={mode.value}
                                      value={mode.value}
                                    >
                                      {mode.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="strAccountGUID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Deposit To<span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <TreeDropdown
                                placeholder="Select an account"
                                data={accountTreeItems}
                                value={field.value ? [field.value] : []}
                                onSelectionChange={(
                                  items: { id: string }[]
                                ) => {
                                  const selectedId = items[0]?.id || "";
                                  field.onChange(selectedId);
                                  // Clear error when a value is selected
                                  if (selectedId) {
                                    form.clearErrors("strAccountGUID");
                                  }
                                }}
                                disabled={isFormDisabled}
                                getItemId={(item: { id: string }) => item.id}
                                getSearchableText={(item: {
                                  name: string;
                                  code?: string;
                                }) =>
                                  `${item.name} ${item.code || ""}`.toLowerCase()
                                }
                                getDisplayText={(item: {
                                  name: string;
                                  code?: string;
                                }) =>
                                  item.code
                                    ? `${item.name} (${item.code})`
                                    : item.name
                                }
                                onOpenChange={(isOpen: boolean) =>
                                  setDropdownOpen((p) => ({
                                    ...p,
                                    accounts: isOpen,
                                  }))
                                }
                                isLoading={!accountsTreeData}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="strRefNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reference No.</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="Enter reference number"
                                disabled={isFormDisabled}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name="dblTotalAmountReceived"
                          render={({ field }) => (
                            <FormItem className="relative">
                              <FormLabel>
                                Amount Received
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    {customerCurrency}
                                  </span>
                                  <span
                                    className="absolute left-11 top-2 bottom-2 w-px bg-border"
                                    aria-hidden="true"
                                  />
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    step="any"
                                    className="pl-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0.00"
                                    value={field.value ?? ""}
                                    disabled={isFormDisabled}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value
                                          ? parseFloat(e.target.value)
                                          : 0
                                      )
                                    }
                                    onFocus={() =>
                                      setShowDistributeDialog(false)
                                    }
                                    onBlur={() => {
                                      const currentValue = form.getValues(
                                        "dblTotalAmountReceived"
                                      );
                                      if (
                                        typeof currentValue === "number" &&
                                        currentValue > 0
                                      ) {
                                        field.onChange(
                                          Math.round(currentValue * 100) / 100
                                        );
                                      }
                                      const totalItemsAmount =
                                        paymentItems.reduce(
                                          (sum, item) =>
                                            sum + (item.dblPaymentAmount || 0),
                                          0
                                        );
                                      if (
                                        typeof currentValue === "number" &&
                                        currentValue > 0 &&
                                        paymentItems.length > 0 &&
                                        currentValue > totalItemsAmount
                                      ) {
                                        setPendingAmountToDistribute(
                                          currentValue
                                        );
                                        setShowDistributeDialog(true);
                                      }
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                              {showDistributeDialog && (
                                <div className="absolute left-0 right-0 top-full mt-2 z-50 p-3 border border-border rounded-md bg-background shadow-lg">
                                  <p className="text-sm mb-3">
                                    Would you like this amount to be reflected
                                    in the Payment field?
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={handleDistributeAmount}
                                      className="h-8"
                                    >
                                      Yes
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        setShowDistributeDialog(false)
                                      }
                                      className="h-8"
                                    >
                                      No
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                        {!isEditMode &&
                          selectedCustomerGUID &&
                          totalPendingAmount > 0 && (
                            <div className="flex items-center space-x-2 mt-2">
                              <Checkbox
                                id="fullAmount"
                                checked={receivedFullAmount}
                                onCheckedChange={(checked) =>
                                  handleReceivedFullAmountChange(
                                    checked as boolean
                                  )
                                }
                                disabled={isFormDisabled}
                                className="h-4 w-4 rounded-none"
                              />
                              <label
                                htmlFor="fullAmount"
                                className="text-sm text-primary hover:text-primary/85 cursor-pointer"
                              >
                                Received full amount ({customerCurrency}{" "}
                                {totalPendingAmount.toLocaleString("en-IN", {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                })}
                                )
                              </label>
                            </div>
                          )}
                      </div>

                      {paymentMode === "Bank" && (
                        <FormField
                          control={form.control}
                          name="dblBankCharges"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Charges (if any)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  step="any"
                                  placeholder="0.00"
                                  className="mb-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={field.value ?? ""}
                                  disabled={isFormDisabled}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : 0
                                    )
                                  }
                                  onBlur={() => {
                                    const currentValue =
                                      form.getValues("dblBankCharges");
                                    if (
                                      typeof currentValue === "number" &&
                                      currentValue > 0
                                    ) {
                                      field.onChange(
                                        Math.round(currentValue * 100) / 100
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <Separator />

                    <div>
                      <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                        <h3 className="text-base sm:text-lg font-semibold">
                          Unpaid Invoices
                        </h3>
                        <div className="flex flex-col items-end gap-1 text-right">
                          {isDifferentCurrency &&
                            (isLoadingExchangeRate ? (
                              <div className="text-sm text-muted-foreground">
                                Loading exchange rate...
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {isEditingExchangeRate && !isFormDisabled ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                      1{" "}
                                      {fromCurrency ||
                                        getCurrencyCode(
                                          selectedCustomer?.strCurrencyTypeName
                                        )}{" "}
                                      =
                                    </span>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={customExchangeRate}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setCustomExchangeRate(value);
                                        const parsed = parseFloat(value);
                                        if (!isNaN(parsed) && parsed > 0) {
                                          form.setValue(
                                            "dblExchangeRate",
                                            parsed
                                          );
                                        }
                                      }}
                                      className="h-8 w-32 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      autoFocus
                                    />
                                    <span className="text-sm">
                                      {toCurrency || ""}
                                    </span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => {
                                        setIsEditingExchangeRate(false);
                                        toast.success("Exchange rate updated");
                                      }}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        if (
                                          exchangeRateData?.Rate !== undefined
                                        ) {
                                          setCustomExchangeRate(
                                            exchangeRateData.Rate.toFixed(3)
                                          );
                                          form.setValue(
                                            "dblExchangeRate",
                                            exchangeRateData.Rate
                                          );
                                        }
                                        setIsEditingExchangeRate(false);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <span>
                                      (As on{" "}
                                      {(() => {
                                        const date =
                                          form.watch("dtExchangeRateDate");
                                        if (!date)
                                          return new Date()
                                            .toISOString()
                                            .split("T")[0];
                                        return typeof date === "string"
                                          ? date.split("T")[0]
                                          : new Date(date)
                                              .toISOString()
                                              .split("T")[0];
                                      })()}
                                      ) 1{" "}
                                      {fromCurrency ||
                                        getCurrencyCode(
                                          selectedCustomer?.strCurrencyTypeName
                                        )}{" "}
                                      ={" "}
                                      {(
                                        parseFloat(customExchangeRate || "1") ||
                                        exchangeRateData?.Rate ||
                                        1
                                      ).toFixed(3)}{" "}
                                      {toCurrency || "INR"}
                                    </span>
                                    {!isFormDisabled && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setIsEditingExchangeRate(true)
                                        }
                                        title="Edit Exchange Rate"
                                      >
                                        <Pencil className="h-3 w-3 text-primary" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}

                          {paymentItems.some(
                            (item) => item.dblPaymentAmount > 0
                          ) && (
                            <button
                              type="button"
                              onClick={handleClearAppliedAmounts}
                              disabled={isFormDisabled}
                              className="text-primary hover:text-primary/85 text-sm cursor-pointer disabled:text-muted-foreground disabled:cursor-not-allowed"
                            >
                              Clear Applied Amount
                            </button>
                          )}
                        </div>
                      </div>
                      <PaymentReceivedItemsTable
                        items={paymentItems}
                        onItemsChange={setPaymentItems}
                        disabled={isFormDisabled}
                        customerGUID={selectedCustomerGUID}
                        customerCurrency={customerCurrency}
                        amountReceived={
                          form.watch("dblTotalAmountReceived") || 0
                        }
                        isEditMode={isEditMode}
                      />
                    </div>

                    <div className="space-y-2">
                      <AttachmentManager
                        existingFiles={existingFiles}
                        onExistingFileRemove={handleExistingFileRemove}
                        onNewFileAdd={handleNewFileAdd}
                        onNewFileRemove={handleNewFileRemove}
                        newFiles={attachments}
                        module="paymentReceipt"
                        readOnly={isFormDisabled}
                      />
                    </div>

                    <Separator />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="strNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              placeholder="Enter any additional notes..."
                              rows={3}
                              disabled={isFormDisabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter
                className={`flex justify-between p-4 sm:p-6 border-t bg-muted/50 ${!isEditMode && !selectedCustomerGUID ? "opacity-40 pointer-events-none" : ""}`}
              >
                <div className="flex gap-2">
                  {isEditMode && (
                    <WithPermission
                      module={FormModules.PAYMENT_RECEIVED}
                      action={Actions.DELETE}
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="h-9"
                        disabled={isFormDisabled}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </WithPermission>
                  )}
                </div>

                <WithPermission
                  module={FormModules.PAYMENT_RECEIVED}
                  action={isEditMode ? Actions.EDIT : Actions.SAVE}
                >
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleSaveDraft}
                      variant="outline"
                      size="sm"
                      className="h-9"
                      disabled={
                        isFormDisabled ||
                        createMutation.isPending ||
                        updateMutation.isPending
                      }
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {(createMutation.isPending || updateMutation.isPending) &&
                      submittingAs === "Draft"
                        ? "Saving..."
                        : "Save as Draft"}
                    </Button>
                    {(() => {
                      const actionStatus = hasApproveRights
                        ? "Received"
                        : "PendingForApproval";
                      const actionLabel = hasApproveRights
                        ? "Mark as Received"
                        : "Save and Submit for Approval";
                      const isPending =
                        (createMutation.isPending ||
                          updateMutation.isPending) &&
                        submittingAs === actionStatus;

                      const handleApprovalSubmit = form.handleSubmit(
                        (values: CombinedFormValues) =>
                          onSubmit(values, actionStatus)
                      );

                      return (
                        <Button
                          type="button"
                          onClick={handleApprovalSubmit}
                          size="sm"
                          className="h-9"
                          disabled={
                            isFormDisabled ||
                            createMutation.isPending ||
                            updateMutation.isPending
                          }
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          {isPending ? "Saving..." : actionLabel}
                        </Button>
                      );
                    })()}
                  </div>
                </WithPermission>
              </CardFooter>
            </Card>
          </form>
        </Form>

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Payment Received"
          description="Are you sure you want to delete this payment received record? This action cannot be undone."
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />

        <ConfirmationDialog
          open={showExcessAmountConfirm}
          onOpenChange={(open) => {
            setShowExcessAmountConfirm(open);
            if (!open) {
              setPendingSubmitData(null);
              setSubmittingAs(null);
            }
          }}
          title="Excess Payment Amount"
          description="One or more payment amounts exceed the pending amount for their invoices. The excess will be credited to the customer. Do you want to proceed?"
          onConfirm={async () => {
            setShowExcessAmountConfirm(false);
            if (pendingSubmitData) {
              const { values, status } = pendingSubmitData;
              const currentItems = paymentItems;
              const resolvedStatus =
                status || paymentReceived?.strStatus || "Draft";

              // If there are no items, bypass excess re-check and submit directly
              if (!currentItems || currentItems.length === 0) {
                try {
                  const normalizedDPaymentReceivedDate =
                    values.dPaymentReceivedDate instanceof Date
                      ? values.dPaymentReceivedDate.toISOString().split("T")[0]
                      : values.dPaymentReceivedDate || "";

                  const normalizedDtExchangeRateDate =
                    values.dtExchangeRateDate instanceof Date
                      ? values.dtExchangeRateDate.toISOString().split("T")[0]
                      : values.dtExchangeRateDate || null;

                  const emptyPayload: PaymentReceivedFormData = {
                    ...values,
                    dPaymentReceivedDate: normalizedDPaymentReceivedDate,
                    dtExchangeRateDate: normalizedDtExchangeRateDate,
                    Items: [],
                    files: attachments.length > 0 ? attachments : undefined,
                    strRemoveDocumentAssociationGUIDs:
                      removedFileGUIDs.length > 0
                        ? removedFileGUIDs
                        : undefined,
                    strStatus: resolvedStatus,
                  };

                  if (isEditMode) {
                    await updateMutation.mutateAsync({
                      id: id!,
                      data: emptyPayload,
                    });
                  } else {
                    await createMutation.mutateAsync(emptyPayload);
                  }

                  setSubmittingAs(null);
                  setPendingSubmitData(null);
                  navigate("/payment-received");
                } catch (error) {
                  console.error(
                    "Error submitting form (no items path):",
                    error
                  );
                  setSubmittingAs(null);
                  setPendingSubmitData(null);
                }
                return;
              }

              // If totals are zero, submit without items and skip excess confirmation
              const totalPaymentAmount = currentItems.reduce(
                (sum, item) => sum + (item.dblPaymentAmount || 0),
                0
              );

              if (totalPaymentAmount <= 0) {
                try {
                  const normalizedDPaymentReceivedDate =
                    values.dPaymentReceivedDate instanceof Date
                      ? values.dPaymentReceivedDate.toISOString().split("T")[0]
                      : values.dPaymentReceivedDate || "";

                  const normalizedDtExchangeRateDate =
                    values.dtExchangeRateDate instanceof Date
                      ? values.dtExchangeRateDate.toISOString().split("T")[0]
                      : values.dtExchangeRateDate || null;

                  const payload: PaymentReceivedFormData = {
                    ...values,
                    dPaymentReceivedDate: normalizedDPaymentReceivedDate,
                    dtExchangeRateDate: normalizedDtExchangeRateDate,
                    Items: [],
                    files: attachments.length > 0 ? attachments : undefined,
                    strRemoveDocumentAssociationGUIDs:
                      removedFileGUIDs.length > 0
                        ? removedFileGUIDs
                        : undefined,
                    strStatus: resolvedStatus,
                  };

                  if (isEditMode) {
                    await updateMutation.mutateAsync({
                      id: id!,
                      data: payload,
                    });
                  } else {
                    await createMutation.mutateAsync(payload);
                  }

                  setSubmittingAs(null);
                  setPendingSubmitData(null);
                  navigate("/payment-received");
                } catch (error) {
                  console.error("Error submitting zero-total form:", error);
                  setSubmittingAs(null);
                  setPendingSubmitData(null);
                }
                return;
              }

              // Submit with filtered items regardless of excess
              try {
                const formattedItems = currentItems
                  .filter((item) => (item.dblPaymentAmount || 0) > 0)
                  .map((item) => ({
                    strPaymentReceived_ItemGUID:
                      item.strPaymentReceived_ItemGUID || undefined,
                    strInvoiceGUID: item.strInvoiceGUID,
                    dtPaymentReceivedOn: item.dtPaymentReceivedOn,
                    dblPaymentAmount: item.dblPaymentAmount,
                  }));

                if (isEditMode) {
                  await updateMutation.mutateAsync({
                    id: id!,
                    data: {
                      ...values,
                      Items: formattedItems,
                      files: attachments.length > 0 ? attachments : undefined,
                      strRemoveDocumentAssociationGUIDs:
                        removedFileGUIDs.length > 0
                          ? removedFileGUIDs
                          : undefined,
                      strStatus: resolvedStatus,
                    } as PaymentReceivedFormData,
                  });
                } else {
                  await createMutation.mutateAsync({
                    ...values,
                    Items: formattedItems,
                    files: attachments.length > 0 ? attachments : undefined,
                    strStatus: resolvedStatus,
                  } as PaymentReceivedFormData);
                }

                setSubmittingAs(null);
                setPendingSubmitData(null);
                navigate("/payment-received");
              } catch (error) {
                console.error("Error submitting form:", error);
                setSubmittingAs(null);
                setPendingSubmitData(null);
              }
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </CustomContainer>
    </>
  );
};

export default PaymentReceivedForm;
