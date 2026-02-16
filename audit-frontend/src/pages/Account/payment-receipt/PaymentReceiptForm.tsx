import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Receipt,
  Save,
  Trash2,
  Pencil,
  X,
  CheckCircle,
  Settings,
} from "lucide-react";

import type { PaymentReceiptFormValues } from "@/validations/Account/payment-receipt";
import type {
  PaymentReceiptCreate,
  PaymentReceiptUpdate,
} from "@/types/Account/payment-receipt";
import type { ScheduleTreeNode } from "@/types/Account/account";
import type { AttachmentFile } from "@/types/common";
import type { Document } from "@/types/central/document";

import { Actions, FormModules, usePermission } from "@/lib/permissions";

import { paymentReceiptSchemaWithRefinements } from "@/validations/Account/payment-receipt";

import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import {
  usePaymentReceipt,
  useCreatePaymentReceipt,
  useUpdatePaymentReceipt,
  useDeletePaymentReceipt,
} from "@/hooks/api/Account/use-payment-receipt";
import { useAccountsByTypesTree } from "@/hooks/api/Account";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useExchangeRate } from "@/hooks/api/central/use-organizations";
import { useBulkAssignDocuments } from "@/hooks/api/central/use-documents";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { WithPermission } from "@/components/ui/with-permission";
import { AttachmentManager } from "@/components/ui/attachments/AttachmentManager";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import NotFound from "@/components/error-boundaries/entity-not-found";

import { PaymentReceiptFormSkeleton } from "./PaymentReceiptFormSkeleton";
import { useAuthContext } from "@/hooks";
import {
  TreeDropdown,
  type TreeItem,
} from "@/components/ui/select/tree-dropdown";
import {
  PARTY_ACCOUNT_TYPE_GUID,
  GENERAL_ACCOUNT_TYPE_GUID,
} from "@/constants/Account/account";

const BANK_ACCOUNT_TYPE_GUIDS = [
  PARTY_ACCOUNT_TYPE_GUID,
  GENERAL_ACCOUNT_TYPE_GUID,
].join(",");

export default function PaymentReceiptForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [selectedPaymentMode, setSelectedPaymentMode] =
    useState<string>("BANK");
  const [selectedCurrencyGUID, setSelectedCurrencyGUID] = useState<string>("");

  const [customExchangeRate, setCustomExchangeRate] = useState<string>("");
  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);
  const [initialCurrency, setInitialCurrency] = useState<string>("");
  const [submittingAs, setSubmittingAs] = useState<
    "Draft" | "Pending For Approval" | "Approved" | null
  >(null);

  // Document management state
  const [attachments, setAttachments] = useState<File[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<AttachmentFile[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState({
    accounts: false,
    bankAccounts: false,
    currencies: false,
  });

  const { user } = useAuthContext();
  const HeaderIcon = useMenuIcon("PAYMENT_RECEIPT", Receipt);
  const isEditMode = !!id && id !== "create" && id !== "new";
  const hasApproveRights = usePermission(
    FormModules.PAYMENT_RECEIPT,
    Actions.APPROVE
  );

  // Enable lazy fetch for create; prefetch for edit to fill existing values
  const shouldPrefetch = isEditMode;
  const accountsEnabled = dropdownOpen.accounts || shouldPrefetch;
  const bankAccountsEnabled = dropdownOpen.bankAccounts || shouldPrefetch;
  const currenciesEnabled = dropdownOpen.currencies || shouldPrefetch;

  const mapTreeToDropdownItems = useCallback(
    (nodes?: ScheduleTreeNode[]): TreeItem[] => {
      if (!nodes) return [];

      const mapTree = (treeNodes: ScheduleTreeNode[]): TreeItem[] => {
        return treeNodes.map((node) => {
          const accountChildren: TreeItem[] =
            node.accounts
              ?.filter((account) => account.bolIsActive)
              .map((account) => ({
                id: account.strAccountGUID,
                name: account.strAccountName,
                type: "data" as const,
                children: [],
              })) || [];

          const scheduleChildren = node.children ? mapTree(node.children) : [];

          return {
            id: `schedule-${node.strScheduleGUID}`,
            name: `${node.strScheduleName} (${node.strScheduleCode})`,
            type: "label" as const,
            children: [...accountChildren, ...scheduleChildren],
          } satisfies TreeItem;
        });
      };

      return mapTree(nodes);
    },
    []
  );

  const filterTreeItemsByExclude = useCallback(
    (items: TreeItem[], excludeIds: Set<string>): TreeItem[] => {
      return items
        .map((item) => {
          if (item.type === "data") {
            if (excludeIds.has(item.id)) return null;
            return { ...item, children: [] } as TreeItem;
          }

          const filteredChildren = filterTreeItemsByExclude(
            item.children || [],
            excludeIds
          );

          if (filteredChildren.length === 0) return null;

          return { ...item, children: filteredChildren } as TreeItem;
        })
        .filter(Boolean) as TreeItem[];
    },
    []
  );

  const { data: accountsTreeData, isLoading: isLoadingAccounts } =
    useAccountsByTypesTree(
      {
        strAccountTypeGUIDs: "",
        maxLevel: 0,
      },
      { enabled: accountsEnabled }
    );
  const accountTreeItems = useMemo(
    () => mapTreeToDropdownItems(accountsTreeData?.scheduleTree),
    [accountsTreeData, mapTreeToDropdownItems]
  );

  const { data: bankAccountsTreeData, isLoading: isLoadingBankAccounts } =
    useAccountsByTypesTree(
      {
        strAccountTypeGUIDs: BANK_ACCOUNT_TYPE_GUIDS,
        maxLevel: 0,
      },
      { enabled: bankAccountsEnabled }
    );
  const bankAccountTreeItems = useMemo(
    () => mapTreeToDropdownItems(bankAccountsTreeData?.scheduleTree),
    [bankAccountsTreeData, mapTreeToDropdownItems]
  );

  const { data: currencyTypes, isLoading: isLoadingCurrencies } =
    useActiveCurrencyTypes(undefined, currenciesEnabled);
  const {
    data: paymentReceipt,
    isFetching: isFetchingPaymentReceipt,
    error: paymentReceiptError,
  } = usePaymentReceipt(isEditMode && id ? id : "");

  // Fetch exchange rate when currency is different from user's currency
  const { data: exchangeRateData, isLoading: isLoadingExchangeRate } =
    useExchangeRate(
      { strFromCurrencyGUID: selectedCurrencyGUID },
      {
        enabled:
          !!selectedCurrencyGUID &&
          selectedCurrencyGUID !== user?.strCurrencyTypeGUID,
      }
    );

  // Check if selected currency is different from user's currency
  const isDifferentCurrency =
    selectedCurrencyGUID && selectedCurrencyGUID !== user?.strCurrencyTypeGUID;

  const createMutation = useCreatePaymentReceipt();
  const updateMutation = useUpdatePaymentReceipt(isEditMode ? id : undefined);
  const deleteMutation = useDeletePaymentReceipt();
  const bulkAssignDocumentsMutation = useBulkAssignDocuments();

  const form = useForm<
    PaymentReceiptFormValues,
    z.input<typeof paymentReceiptSchemaWithRefinements>
  >({
    resolver: zodResolver(paymentReceiptSchemaWithRefinements),
    defaultValues: {
      strTransactionType: "PAYMENT",
      dtTransactionDate: new Date().toISOString().split("T")[0],
      strPaymentMode: "BANK",
      strToAccountGUID: "",
      dblTotalAmount: 0,
      dblBaseTotalAmount: 0,
      strCurrencyTypeGUID: "",
      dblExchangeRate: 1.0,
      strBankCashGUID: undefined,
      strCardType: undefined,
      strCardLastFourDigits: undefined,
      strCardIssuerBank: undefined,
      strCardTransactionId: undefined,
      dblCardProcessingFee: undefined,
      strChequeNo: undefined,
      dtChequeDate: undefined,
      strNarration: undefined,
      strReferenceNo: undefined,
    },
  });

  useEffect(() => {
    if (isEditMode && paymentReceipt) {
      setSelectedPaymentMode(paymentReceipt.strPaymentMode);

      form.reset({
        strTransactionType: paymentReceipt.strTransactionType,
        dtTransactionDate: paymentReceipt.dtTransactionDate.substring(0, 10),
        strPaymentMode: paymentReceipt.strPaymentMode,
        strToAccountGUID: paymentReceipt.strToAccountGUID || "",
        dblTotalAmount: paymentReceipt.dblTotalAmount,
        strCurrencyTypeGUID: paymentReceipt.strCurrencyTypeGUID || "",
        dblExchangeRate: paymentReceipt.dblExchangeRate || 1.0,
        strBankCashGUID: paymentReceipt.strBankCashGUID || null,
        strCardType: paymentReceipt.strCardType || null,
        strCardLastFourDigits: paymentReceipt.strCardLastFourDigits || null,
        strCardIssuerBank: paymentReceipt.strCardIssuerBank || null,
        strCardTransactionId: paymentReceipt.strCardTransactionId || null,
        dblCardProcessingFee: paymentReceipt.dblCardProcessingFee || null,
        strChequeNo: paymentReceipt.strChequeNo || null,
        dtChequeDate: paymentReceipt.dtChequeDate?.substring(0, 10) || null,
        strNarration: paymentReceipt.strNarration || null,
        strReferenceNo: paymentReceipt.strReferenceNo || null,
      });

      if (paymentReceipt.dblExchangeRate) {
        setCustomExchangeRate(paymentReceipt.dblExchangeRate.toFixed(3));
        form.setValue(
          "dblExchangeRate",
          Number(paymentReceipt.dblExchangeRate.toFixed(3))
        );
      }
    }
  }, [isEditMode, paymentReceipt, form]);

  // Load existing files when editing
  useEffect(() => {
    if (paymentReceipt?.strFiles) {
      setExistingFiles(
        paymentReceipt.strFiles.map((file) => ({
          ...file,
          strFileType: file.strFileType || "",
        })) as AttachmentFile[]
      );
    }
  }, [paymentReceipt]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "strPaymentMode") {
        const mode = value.strPaymentMode as string;
        setSelectedPaymentMode(mode);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Show single toast for validation errors (only after form submission attempt)
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
  }, [form.formState.errors, form.formState.isSubmitted]);

  // Sync selected currency with form value
  const watchedCurrency = form.watch("strCurrencyTypeGUID");
  const selectedBankCashGUID = form.watch("strBankCashGUID");

  const filteredToAccountTreeItems = useMemo(() => {
    if (!selectedBankCashGUID) return accountTreeItems;
    return filterTreeItemsByExclude(
      accountTreeItems,
      new Set([selectedBankCashGUID])
    );
  }, [accountTreeItems, filterTreeItemsByExclude, selectedBankCashGUID]);

  useEffect(() => {
    if (watchedCurrency && watchedCurrency !== "null") {
      setSelectedCurrencyGUID(watchedCurrency);
    } else {
      setSelectedCurrencyGUID("");
    }
  }, [watchedCurrency]);

  // Default currency to user's currency for new forms
  useEffect(() => {
    if (!isEditMode && user?.strCurrencyTypeGUID) {
      const current = form.getValues("strCurrencyTypeGUID");
      if (!current) {
        form.setValue("strCurrencyTypeGUID", user.strCurrencyTypeGUID);
      }
    }
  }, [isEditMode, user?.strCurrencyTypeGUID, form]);

  // Set initial currency when loading payment receipt in edit mode
  useEffect(() => {
    if (isEditMode && paymentReceipt && paymentReceipt.strCurrencyTypeGUID) {
      setInitialCurrency(paymentReceipt.strCurrencyTypeGUID);
    }
  }, [isEditMode, paymentReceipt]);

  // Update exchange rate when fetched
  useEffect(() => {
    if (exchangeRateData?.Rate) {
      if (!isEditMode) {
        setCustomExchangeRate(exchangeRateData.Rate.toFixed(3));
        form.setValue(
          "dblExchangeRate",
          Number(exchangeRateData.Rate.toFixed(3))
        );
      } else if (
        selectedCurrencyGUID &&
        selectedCurrencyGUID !== initialCurrency
      ) {
        setCustomExchangeRate(exchangeRateData.Rate.toFixed(3));
        form.setValue(
          "dblExchangeRate",
          Number(exchangeRateData.Rate.toFixed(3))
        );
      }
    }
  }, [
    exchangeRateData,
    isEditMode,
    selectedCurrencyGUID,
    initialCurrency,
    form,
  ]);

  // Auto-calculate base total amount when total amount or exchange rate changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "dblTotalAmount" || name === "dblExchangeRate") {
        const totalAmount = value.dblTotalAmount || 0;
        const exchangeRate = value.dblExchangeRate || 1.0;
        form.setValue("dblBaseTotalAmount", totalAmount * exchangeRate);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Keep form's exchange rate in sync with custom state for calculations/submit
  useEffect(() => {
    const rate = parseFloat(customExchangeRate);
    if (!isNaN(rate) && rate > 0) {
      form.setValue("dblExchangeRate", rate);
    } else if (!isDifferentCurrency) {
      form.setValue("dblExchangeRate", 1.0);
    }
  }, [customExchangeRate, isDifferentCurrency, form]);

  const onSubmit = async (
    values: PaymentReceiptFormValues,
    statusOverride?: "Draft" | "Pending For Approval" | "Approved"
  ) => {
    try {
      setSubmittingAs(statusOverride || null);
      // Calculate exchange rate; force 1 when currency is same
      const exchangeRate = (() => {
        const parsed = customExchangeRate?.trim()
          ? parseFloat(customExchangeRate)
          : values.dblExchangeRate;
        return typeof parsed === "number" &&
          Number.isFinite(parsed) &&
          parsed > 0
          ? parsed
          : 1;
      })();

      // Calculate base total amount (total * exchange rate; mirrors when same currency)
      const baseTotalAmount = values.dblTotalAmount * exchangeRate;

      if (isEditMode) {
        const updateData: PaymentReceiptUpdate = {
          strTransactionType: values.strTransactionType,
          dtTransactionDate: values.dtTransactionDate,
          strPaymentMode: values.strPaymentMode,
          strToAccountGUID: values.strToAccountGUID,
          dblTotalAmount: values.dblTotalAmount,
          strStatus: statusOverride,
          strCurrencyTypeGUID: values.strCurrencyTypeGUID,
          dblExchangeRate: exchangeRate,
          dblBaseTotalAmount: baseTotalAmount,
          dtExchangeRateDate: new Date().toISOString().split("T")[0],
          strBankCashGUID: values.strBankCashGUID || null,
          strChequeNo: values.strChequeNo || null,
          dtChequeDate: values.dtChequeDate || null,
          strCardType: values.strCardType || null,
          strCardLastFourDigits: values.strCardLastFourDigits || null,
          strCardIssuerBank: values.strCardIssuerBank || null,
          strCardTransactionId: values.strCardTransactionId || null,
          dblCardProcessingFee: values.dblCardProcessingFee || null,
          strReferenceNo: values.strReferenceNo || null,
          strNarration: values.strNarration || null,
        };

        await updateMutation.mutateAsync({
          paymentReceipt: updateData,
          files: attachments.length > 0 ? attachments : undefined,
          removeDocumentIds:
            removedDocumentIds.length > 0 ? removedDocumentIds : undefined,
        });

        setSubmittingAs(null);
        setAttachments([]);
        setRemovedDocumentIds([]);

        // Handle bulk assign documents for selected documents
        if (selectedDocuments.length > 0 && paymentReceipt) {
          const selectedDocumentGUIDs = selectedDocuments.map(
            (doc) => doc.strDocumentGUID
          );
          await bulkAssignDocumentsMutation.mutateAsync({
            strDocumentGUIDs: selectedDocumentGUIDs,
            strEntityGUID: paymentReceipt.strPaymentReceiptGUID,
            strEntityName: "Payment Receipt",
            strEntityValue: paymentReceipt.strTransactionNo,
          });
          setSelectedDocuments([]);
        }

        navigate("/payment-receipt");
      } else {
        const createData: PaymentReceiptCreate = {
          strTransactionType: values.strTransactionType,
          dtTransactionDate: values.dtTransactionDate,
          strPaymentMode: values.strPaymentMode,
          strToAccountGUID: values.strToAccountGUID,
          dblTotalAmount: values.dblTotalAmount,
          strStatus: statusOverride || "Draft",
          strCurrencyTypeGUID: values.strCurrencyTypeGUID,
          dblExchangeRate: exchangeRate,
          dblBaseTotalAmount: baseTotalAmount,
          dtExchangeRateDate: new Date().toISOString().split("T")[0],
          strBankCashGUID: values.strBankCashGUID || null,
          strChequeNo: values.strChequeNo || null,
          dtChequeDate: values.dtChequeDate || null,
          strCardType: values.strCardType || null,
          strCardLastFourDigits: values.strCardLastFourDigits || null,
          strCardIssuerBank: values.strCardIssuerBank || null,
          strCardTransactionId: values.strCardTransactionId || null,
          dblCardProcessingFee: values.dblCardProcessingFee || null,
          strReferenceNo: values.strReferenceNo || null,
          strNarration: values.strNarration || null,
        };

        const result = await createMutation.mutateAsync({
          paymentReceipt: createData,
          files: attachments.length > 0 ? attachments : undefined,
        });

        setSubmittingAs(null);
        setAttachments([]);
        setRemovedDocumentIds([]);

        // Handle bulk assign documents for selected documents
        if (selectedDocuments.length > 0 && result) {
          const selectedDocumentGUIDs = selectedDocuments.map(
            (doc) => doc.strDocumentGUID
          );
          await bulkAssignDocumentsMutation.mutateAsync({
            strDocumentGUIDs: selectedDocumentGUIDs,
            strEntityGUID: result.strPaymentReceiptGUID,
            strEntityName: "Payment Receipt",
            strEntityValue: result.strTransactionNo,
          });
          setSelectedDocuments([]);
        }

        navigate("/payment-receipt");
      }
    } catch (error) {
      console.error("Error submitting payment/receipt:", error);
      setSubmittingAs(null);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id) return;

    await deleteMutation.mutateAsync(id);
    navigate("/payment-receipt");
    setShowDeleteConfirm(false);
  };

  const handleBack = () => {
    navigate("/payment-receipt");
  };

  // Document handlers
  const handleAttachFromDocuments = async (documents: Document[]) => {
    setSelectedDocuments((prev) => [...prev, ...documents]);
    toast.success(
      `${documents.length} document${
        documents.length > 1 ? "s" : ""
      } selected for attachment`
    );
  };

  const handleRemoveSelectedDocument = (guid: string) => {
    setSelectedDocuments((prev) =>
      prev.filter((doc) => doc.strDocumentGUID !== guid)
    );
  };

  // Handle error state (404 or other errors)
  if (isEditMode && paymentReceiptError) {
    return <NotFound pageName="Payment Receipt" />;
  }

  if (isEditMode && (isFetchingPaymentReceipt || !paymentReceipt)) {
    return (
      <CustomContainer>
        <PaymentReceiptFormSkeleton />
      </CustomContainer>
    );
  }

  const canEdit =
    !isEditMode || (paymentReceipt && paymentReceipt.strStatus === "Draft");

  // Determine if form should be disabled (only Draft status can be edited in edit mode)
  const isFormDisabled =
    isEditMode && paymentReceipt && paymentReceipt.strStatus !== "Draft";

  const transactionType = form.watch("strTransactionType") || "PAYMENT";
  const transactionTypeLabel =
    transactionType === "PAYMENT" ? "Payment" : "Receipt";

  return (
    <>
      <CustomContainer className="flex flex-col h-screen">
        <PageHeader
          title={
            isEditMode
              ? `Edit ${transactionTypeLabel}`
              : `Create ${transactionTypeLabel}`
          }
          icon={HeaderIcon}
          description={
            isEditMode
              ? `Editing transaction ${paymentReceipt?.strTransactionNo}`
              : `Create a new ${transactionType.toLowerCase()}`
          }
          actions={
            <div className="flex gap-2">
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

        {isEditMode && (isFetchingPaymentReceipt || !paymentReceipt) ? (
          <PaymentReceiptFormSkeleton />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(
                (data: PaymentReceiptFormValues) => onSubmit(data),
                () => {
                  toast.error("Validation Error", {
                    description:
                      "Please check all required fields are filled correctly",
                  });
                }
              )}
              className="space-y-6 flex flex-col flex-1"
            >
              <Card>
                <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-foreground pb-2">
                        Basic Transaction Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        <FormField
                          control={form.control}
                          name="strTransactionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Transaction Type{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <PreloadedSelect
                                  options={[
                                    { value: "PAYMENT", label: "Payment" },
                                    { value: "RECEIPT", label: "Receipt" },
                                  ]}
                                  selectedValue={field.value}
                                  onChange={(value) => field.onChange(value)}
                                  placeholder="Select Type"
                                  disabled={isFormDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormItem>
                          <FormLabel>Transaction No</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="Auto Generated"
                                value={
                                  isEditMode
                                    ? (paymentReceipt?.strTransactionNo ?? "")
                                    : "Auto Generated"
                                }
                                disabled
                                readOnly
                                className="bg-gray-100 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => window.open("/year-settings", "_blank")}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                title="Year Settings"
                              >
                                <Settings className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          </FormControl>
                        </FormItem>

                        <FormField
                          control={form.control}
                          name="dtTransactionDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Date <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onChange={(date) => {
                                    if (date) {
                                      field.onChange(
                                        format(date, "yyyy-MM-dd")
                                      );
                                    }
                                  }}
                                  restricted={true}
                                  placeholder="Select date"
                                  disabled={isFormDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="strPaymentMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {form.watch("strTransactionType") === "PAYMENT"
                                ? "Payment Mode"
                                : "Receipt Mode"}{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                options={[
                                  { value: "BANK", label: "Bank Transfer" },
                                  { value: "CARD", label: "Card" },
                                  { value: "CASH", label: "Cash" },
                                  { value: "CHEQUE", label: "Cheque" },
                                ]}
                                selectedValue={field.value}
                                onChange={(value) => field.onChange(value)}
                                placeholder={`Select ${form.watch("strTransactionType") === "PAYMENT" ? "Payment" : "Receipt"} Mode`}
                                disabled={isFormDisabled}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="strToAccountGUID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {form.watch("strTransactionType") === "PAYMENT"
                                ? "Payment To"
                                : "Payment From"}{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <TreeDropdown
                                data={filteredToAccountTreeItems}
                                value={field.value ? [field.value] : []}
                                onSelectionChange={(items) =>
                                  field.onChange(items[0]?.id || "")
                                }
                                placeholder={`Select ${
                                  form.watch("strTransactionType") === "PAYMENT"
                                    ? "Payment To"
                                    : "Payment From"
                                } Account`}
                                disabled={isFormDisabled}
                                clearable
                                textClassName="text-sm"
                                isLoading={isLoadingAccounts}
                                onOpenChange={(isOpen: boolean) =>
                                  setDropdownOpen((p) => ({
                                    ...p,
                                    accounts: isOpen,
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
                        name="dblTotalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Amount <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.001"
                                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0.000"
                                disabled={isFormDisabled}
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
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                options={
                                  currencyTypes?.map(
                                    (currency: {
                                      strCurrencyTypeGUID: string;
                                      strName: string;
                                    }) => ({
                                      value: currency.strCurrencyTypeGUID,
                                      label: currency.strName,
                                    })
                                  ) || []
                                }
                                selectedValue={
                                  field.value as string | undefined
                                }
                                onChange={(value) => {
                                  field.onChange(value);
                                }}
                                placeholder="Select Currency (optional)"
                                disabled={!canEdit}
                                queryKey={["currency-types", "active"]}
                                isLoading={isLoadingCurrencies}
                                onOpenChange={(isOpen: boolean) =>
                                  setDropdownOpen((p) => ({
                                    ...p,
                                    currencies: isOpen,
                                  }))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                            {isDifferentCurrency &&
                              (exchangeRateData?.Rate ||
                                (isEditMode &&
                                  paymentReceipt?.dblExchangeRate)) && (
                                <div className="mt-2 space-y-1">
                                  {isEditingExchangeRate && canEdit ? (
                                    <div className="flex flex-col gap-2">
                                      <div className="text-sm text-muted-foreground">
                                        (As on{" "}
                                        {isEditMode &&
                                        paymentReceipt?.dtExchangeRateDate
                                          ? new Date(
                                              paymentReceipt.dtExchangeRateDate
                                            )
                                              .toISOString()
                                              .split("T")[0]
                                          : new Date()
                                              .toISOString()
                                              .split("T")[0]}
                                        )
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">
                                          1{" "}
                                          {exchangeRateData?.FromCurrency ||
                                            currencyTypes?.find(
                                              (c) =>
                                                c.strCurrencyTypeGUID ===
                                                selectedCurrencyGUID
                                            )?.strName ||
                                            paymentReceipt?.strCurrencyTypeName ||
                                            ""}{" "}
                                          =
                                        </span>
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          value={customExchangeRate}
                                          onChange={(e) =>
                                            setCustomExchangeRate(
                                              e.target.value
                                            )
                                          }
                                          className="h-8 w-32 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          autoFocus
                                        />
                                        <span className="text-sm">
                                          {exchangeRateData?.ToCurrency ||
                                            currencyTypes?.find(
                                              (c) =>
                                                c.strCurrencyTypeGUID ===
                                                user?.strCurrencyTypeGUID
                                            )?.strName ||
                                            ""}
                                        </span>
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="h-8"
                                          onClick={() => {
                                            setIsEditingExchangeRate(false);
                                            toast.success(
                                              "Exchange rate updated"
                                            );
                                          }}
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant={null}
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            if (
                                              exchangeRateData?.Rate !==
                                              undefined
                                            ) {
                                              setCustomExchangeRate(
                                                exchangeRateData.Rate.toString()
                                              );
                                            } else if (
                                              isEditMode &&
                                              paymentReceipt?.dblExchangeRate
                                            ) {
                                              setCustomExchangeRate(
                                                paymentReceipt.dblExchangeRate.toString()
                                              );
                                            }
                                            setIsEditingExchangeRate(false);
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                      <span>
                                        (As on{" "}
                                        {isEditMode &&
                                        paymentReceipt?.dtExchangeRateDate
                                          ? new Date(
                                              paymentReceipt.dtExchangeRateDate
                                            )
                                              .toISOString()
                                              .split("T")[0]
                                          : new Date()
                                              .toISOString()
                                              .split("T")[0]}
                                        ) 1{" "}
                                        {exchangeRateData?.FromCurrency ||
                                          currencyTypes?.find(
                                            (c) =>
                                              c.strCurrencyTypeGUID ===
                                              selectedCurrencyGUID
                                          )?.strName ||
                                          paymentReceipt?.strCurrencyTypeName ||
                                          ""}{" "}
                                        ={" "}
                                        {(
                                          parseFloat(customExchangeRate) ||
                                          exchangeRateData?.Rate ||
                                          (isEditMode
                                            ? paymentReceipt?.dblExchangeRate
                                            : 0) ||
                                          0
                                        ).toFixed(3)}{" "}
                                        {exchangeRateData?.ToCurrency ||
                                          currencyTypes?.find(
                                            (c) =>
                                              c.strCurrencyTypeGUID ===
                                              user?.strCurrencyTypeGUID
                                          )?.strName ||
                                          ""}
                                      </span>
                                      {canEdit && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setIsEditingExchangeRate(true)
                                          }
                                          title="Edit Exchange Rate"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            {isDifferentCurrency && isLoadingExchangeRate && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                Loading exchange rate...
                              </div>
                            )}
                          </FormItem>
                        )}
                      />
                    </div>

                    {selectedPaymentMode === "BANK" && (
                      <>
                        <Separator className="my-4 sm:my-6" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-3 sm:mb-4">
                          {form.watch("strTransactionType") === "PAYMENT"
                            ? "Bank Payment Details"
                            : "Bank Receipt Details"}
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 sm:gap-6">
                          <FormField
                            control={form.control}
                            name="strBankCashGUID"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Bank Account{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <TreeDropdown
                                    data={bankAccountTreeItems}
                                    value={field.value ? [field.value] : []}
                                    onSelectionChange={(items) =>
                                      field.onChange(items[0]?.id || "")
                                    }
                                    placeholder="Select Bank"
                                    disabled={isFormDisabled}
                                    clearable
                                    textClassName="text-sm"
                                    isLoading={isLoadingBankAccounts}
                                    onOpenChange={(isOpen: boolean) =>
                                      setDropdownOpen((p) => ({
                                        ...p,
                                        bankAccounts: isOpen,
                                      }))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    {selectedPaymentMode === "CARD" && (
                      <>
                        <Separator className="my-4 sm:my-6" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-3 sm:mb-4">
                          {form.watch("strTransactionType") === "PAYMENT"
                            ? "Card Payment Details"
                            : "Card Receipt Details"}
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 sm:gap-6">
                          <FormField
                            control={form.control}
                            name="strCardType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Card Type{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    options={[
                                      { value: "CREDIT", label: "Credit Card" },
                                      { value: "DEBIT", label: "Debit Card" },
                                      {
                                        value: "PREPAID",
                                        label: "Prepaid Card",
                                      },
                                    ]}
                                    selectedValue={
                                      field.value as string | undefined
                                    }
                                    onChange={(value) => field.onChange(value)}
                                    placeholder="Select Card Type"
                                    disabled={isFormDisabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="strCardLastFourDigits"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Last 4 Digits{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    maxLength={4}
                                    placeholder="1234"
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="strCardIssuerBank"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Issuer Bank</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Enter card issuer bank"
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="strCardTransactionId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Transaction ID</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Enter transaction ID"
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dblCardProcessingFee"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Processing Fee</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.001"
                                    className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    placeholder="0.000"
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    {selectedPaymentMode === "CASH" && (
                      <>
                        <Separator className="my-4 sm:my-6" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-3 sm:mb-4">
                          {form.watch("strTransactionType") === "PAYMENT"
                            ? "Cash Payment Details"
                            : "Cash Receipt Details"}
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 sm:gap-6">
                          <FormField
                            control={form.control}
                            name="strBankCashGUID"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Cash Account{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <TreeDropdown
                                    data={accountTreeItems}
                                    value={field.value ? [field.value] : []}
                                    onSelectionChange={(items) =>
                                      field.onChange(items[0]?.id || "")
                                    }
                                    placeholder="Select Cash Account"
                                    disabled={!canEdit}
                                    clearable
                                    textClassName="text-sm"
                                    isLoading={isLoadingAccounts}
                                    onOpenChange={(isOpen: boolean) =>
                                      setDropdownOpen((p) => ({
                                        ...p,
                                        bankAccounts: isOpen,
                                      }))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    {selectedPaymentMode === "CHEQUE" && (
                      <>
                        <Separator className="my-4 sm:my-6" />
                        <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-3 sm:mb-4">
                          {form.watch("strTransactionType") === "PAYMENT"
                            ? "Cheque Payment Details"
                            : "Cheque Receipt Details"}
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 sm:gap-6">
                          <FormField
                            control={form.control}
                            name="strChequeNo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Cheque No{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Enter cheque number"
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dtChequeDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Cheque Date{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <DatePicker
                                    value={
                                      field.value
                                        ? new Date(field.value)
                                        : undefined
                                    }
                                    onChange={(date) => {
                                      if (date) {
                                        field.onChange(
                                          format(date, "yyyy-MM-dd")
                                        );
                                      }
                                    }}
                                    placeholder="Select date"
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    <Separator className="my-4 sm:my-6" />
                    <div>
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-foreground pb-2">
                        Additional Information
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 sm:gap-6">
                          <FormField
                            control={form.control}
                            name="strReferenceNo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reference Number</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Enter reference number"
                                    disabled={!canEdit}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="strNarration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Narration / Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Enter any additional notes, remarks, or description..."
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
                  </div>

                  {/* Attachments Section */}
                  <div className="mt-6">
                    <AttachmentManager
                      existingFiles={existingFiles}
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
                      newFiles={attachments}
                      onAttachFromDocuments={handleAttachFromDocuments}
                      selectedDocuments={selectedDocuments}
                      onSelectedDocumentRemove={handleRemoveSelectedDocument}
                      module="paymentReceipt"
                      readOnly={isFormDisabled}
                    />
                  </div>
                </CardContent>

                {/* Footer */}
                <div className="mt-auto bg-card sticky bottom-0 border-t border-border-color">
                  <CardFooter className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <div className="flex gap-2">
                      {isEditMode ? (
                        <WithPermission
                          module={FormModules.PAYMENT_RECEIPT}
                          action={Actions.DELETE}
                        >
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={
                              isFormDisabled || deleteMutation.isPending
                            }
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deleteMutation.isPending
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </WithPermission>
                      ) : null}
                    </div>

                    <WithPermission
                      module={FormModules.PAYMENT_RECEIPT}
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
        )}

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDelete}
          title="Delete Payment/Receipt"
          description="Are you sure you want to delete this payment/receipt? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
          loadingText="Deleting..."
        />
      </CustomContainer>
    </>
  );
}
