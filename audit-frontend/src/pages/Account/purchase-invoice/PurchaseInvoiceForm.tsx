import React, { useState, useEffect, type FC } from "react";
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
  PurchaseInvoiceItem,
  PurchaseInvoiceCreate,
  PurchaseInvoiceUpdate,
} from "@/types/Account/purchase-invoice";
import type { InvoiceAddress } from "@/types/Account/salesinvoice";
import type { PartyAddress, PartyWithLocations } from "@/types/Account/party";
import type { AttachmentFile } from "@/types/common";

import { formatInvoiceAddress } from "@/lib/utils/Account/invoice";
import { Actions, FormModules, usePermission } from "@/lib/permissions";

import {
  purchaseInvoiceSchema,
  type FormData,
} from "@/validations/Account/purchase-invoice";

import {
  usePurchaseInvoice,
  useCreatePurchaseInvoice,
  useUpdatePurchaseInvoice,
  useDeletePurchaseInvoice,
} from "@/hooks/api/Account/use-purchase-invoices";
import { useExchangeRate } from "@/hooks/api/central/use-organizations";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { usePartyWithLocations } from "@/hooks/api/Account/use-parties";
import { useActiveVendorsByType } from "@/hooks/api/Account/use-vendors";
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
import { PurchaseInvoiceFormSkeleton } from "./PurchaseInvoiceFormSkeleton";
import { PurchaseInvoiceItemsSection } from "./PurchaseInvoiceItemsSection";
import AddressEditDialog from "../invoice/components/AddressEditDialog";

const PurchaseInvoiceForm: FC = () => {
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
  const HeaderIcon = useMenuIcon(FormModules.PURCHASE_INVOICE, FileText);
  const { user } = useAuthContext();
  const isEditMode = !!id && id !== "new";
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
  const hasApproveRights = usePermission(
    FormModules.PURCHASE_INVOICE,
    Actions.APPROVE
  );
  const [dropdownOpen, setDropdownOpen] = useState({
    vendors: false,
    currencies: false,
  });

  const shouldPrefetch = isEditMode;
  const vendorsEnabled = dropdownOpen.vendors || shouldPrefetch;
  const { data: activeVendors, isLoading: isLoadingVendors } =
    useActiveVendorsByType({ strPartyType: "Vendor" }, vendorsEnabled);
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
    data: purchaseInvoice,
    isFetching: isFetchingPurchaseInvoice,
    error: purchaseInvoiceError,
  } = usePurchaseInvoice(isEditMode ? id : "");
  const [purchaseInvoiceItems, setPurchaseInvoiceItems] = useState<
    PurchaseInvoiceItem[]
  >([]);

  const isFormDisabled = isEditMode && purchaseInvoice?.strStatus !== "Draft";

  const createMutation = useCreatePurchaseInvoice();
  const updateMutation = useUpdatePurchaseInvoice();
  const deleteMutation = useDeletePurchaseInvoice();

  // Fetch exchange rate when currency is different from user's currency
  // In edit mode, only fetch if currency changed and status is draft
  const shouldFetchExchangeRate =
    !!selectedCurrencyGUID &&
    selectedCurrencyGUID !== user?.strCurrencyTypeGUID &&
    (!isEditMode ||
      (isEditMode &&
        purchaseInvoice?.strStatus === "Draft" &&
        selectedCurrencyGUID !== originalCurrencyGUID));
  const { data: exchangeRateData, isLoading: isLoadingExchangeRate } =
    useExchangeRate(
      { strFromCurrencyGUID: selectedCurrencyGUID },
      {
        enabled: shouldFetchExchangeRate,
      }
    );

  const isDifferentCurrency = !!(
    selectedCurrencyGUID && selectedCurrencyGUID !== user?.strCurrencyTypeGUID
  );

  useEffect(() => {
    if (purchaseInvoice?.items) {
      setPurchaseInvoiceItems(purchaseInvoice.items);
    }

    if (purchaseInvoice?.strFiles) {
      setExistingFiles(
        purchaseInvoice.strFiles.map((file) => ({
          strDocumentAssociationGUID:
            file.strDocumentAssociationGUID || file.strDocumentGUID,
          strFileName: file.strFileName || "Document",
          strFileType: file.strFileType || "",
          strFileSize: file.strFileSize || "",
          strFilePath: file.strFilePath || "",
        }))
      );
    }
  }, [purchaseInvoice?.items, purchaseInvoice?.strFiles]);

  const form = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(
      purchaseInvoiceSchema
    ) as unknown as Resolver<FormData>,
    defaultValues: {
      dPurchaseInvoiceDate: new Date().toISOString().split("T")[0],
      strStatus: "Draft",
      strSubject: "",
      strOrderNo: "",
      strCustomerNotes: "Thanks for your business",
      strTC: "",
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

  const selectedPartyGUID = form.watch("strPartyGUID");
  const initialPartyGUID = purchaseInvoice?.strPartyGUID || null;
  const shouldFetchPartyLocations =
    Boolean(selectedPartyGUID) &&
    (!isEditMode ||
      (purchaseInvoice && selectedPartyGUID !== initialPartyGUID));
  const { data: partyWithLocations } = usePartyWithLocations(
    shouldFetchPartyLocations ? selectedPartyGUID || undefined : undefined
  );

  const partyAddressesFromInvoice = React.useMemo(() => {
    if (!purchaseInvoice || !purchaseInvoice.strPartyGUID) return null;
    return {
      strPartyGUID: purchaseInvoice.strPartyGUID,
      strCurrencyTypeGUID: purchaseInvoice.strCurrencyTypeGUID,
      billingAddress:
        purchaseInvoice.strBillingAddress as unknown as PartyAddress,
      shippingAddress:
        purchaseInvoice.strShippingAddress as unknown as PartyAddress,
      BillingAddress:
        purchaseInvoice.strBillingAddress as unknown as PartyAddress,
      ShippingAddress:
        purchaseInvoice.strShippingAddress as unknown as PartyAddress,
    } satisfies Partial<PartyWithLocations> as PartyWithLocations;
  }, [purchaseInvoice]);

  const effectivePartyWithLocations =
    partyWithLocations ?? partyAddressesFromInvoice;

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

  useEffect(() => {
    if (effectivePartyWithLocations) {
      if (effectivePartyWithLocations.strCurrencyTypeGUID) {
        form.setValue(
          "strCurrencyTypeGUID",
          effectivePartyWithLocations.strCurrencyTypeGUID
        );
      }

      const billing =
        effectivePartyWithLocations.billingAddress ??
        effectivePartyWithLocations.BillingAddress;
      const shipping =
        effectivePartyWithLocations.shippingAddress ??
        effectivePartyWithLocations.ShippingAddress;

      const billingAddress = mapPartyAddressToInvoiceAddress(billing);
      const shippingAddress = mapPartyAddressToInvoiceAddress(shipping);

      if (billingAddress) {
        form.setValue("strBillingAddress", billingAddress);
      }

      if (shippingAddress) {
        form.setValue("strShippingAddress", shippingAddress);
      }
    }
  }, [effectivePartyWithLocations, form, mapPartyAddressToInvoiceAddress]);

  const updateFormWithItems = React.useCallback(
    (items: PurchaseInvoiceItem[]) => {
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
          ...(item.strPurchaseInvoice_ItemGUID && {
            strPurchaseInvoice_ItemGUID: item.strPurchaseInvoice_ItemGUID,
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
    updateFormWithItems(purchaseInvoiceItems);
  }, [purchaseInvoiceItems, updateFormWithItems]);

  useEffect(() => {
    if (isEditMode && purchaseInvoice) {
      const formValues = {
        dPurchaseInvoiceDate: purchaseInvoice.dPurchaseInvoiceDate.substring(
          0,
          10
        ),
        strStatus: purchaseInvoice.strStatus || "Draft",
        strSubject: purchaseInvoice.strSubject || "",
        strOrderNo: purchaseInvoice.strOrderNo || "",
        strPartyGUID: purchaseInvoice.strPartyGUID || "",
        strCustomerNotes: purchaseInvoice.strCustomerNotes || "Thanks for your business",
        strTC: purchaseInvoice.strTC || "",
        strCurrencyTypeGUID: purchaseInvoice.strCurrencyTypeGUID || null,
        strBillingAddress: purchaseInvoice.strBillingAddress || null,
        strShippingAddress: purchaseInvoice.strShippingAddress || null,
        strAdjustmentName: purchaseInvoice.strAdjustmentName || "",
        strAdjustment_AccountGUID:
          purchaseInvoice.strAdjustment_AccountGUID || null,
        dblAdjustmentAmt: Number(purchaseInvoice.dblAdjustmentAmt || 0),
        dblGrossTotalAmt: Number(purchaseInvoice.dblGrossTotalAmt || 0),
        dblTaxAmt: Number(purchaseInvoice.dblTaxAmt || 0),
        dblTotalDiscountAmt: Number(purchaseInvoice.dblTotalDiscountAmt || 0),
        dblNetAmt: Number(purchaseInvoice.dblNetAmt || 0),
        items: [],
      } satisfies FormData;

      form.reset(formValues);

      // Set exchange rate from existing purchase invoice
      if (purchaseInvoice.dblExchangeRate) {
        setCustomExchangeRate(purchaseInvoice.dblExchangeRate.toFixed(3));
        form.setValue(
          "dblExchangeRate",
          Number(purchaseInvoice.dblExchangeRate.toFixed(3))
        );
      }

      // Set original currency for tracking changes
      setOriginalCurrencyGUID(purchaseInvoice.strCurrencyTypeGUID || "");

      if (purchaseInvoice.items) {
        setPurchaseInvoiceItems(purchaseInvoice.items);
      }
    }
  }, [isEditMode, purchaseInvoice, form]);

  const watchedCurrency = form.watch("strCurrencyTypeGUID");

  useEffect(() => {
    if (watchedCurrency && watchedCurrency !== "null") {
      setSelectedCurrencyGUID(watchedCurrency as string);
    } else {
      setSelectedCurrencyGUID("");
    }
  }, [watchedCurrency]);

  useEffect(() => {
    if (!exchangeRateData?.Rate || !isDifferentCurrency) return;
    setCustomExchangeRate(exchangeRateData.Rate.toFixed(3));
  }, [exchangeRateData, isDifferentCurrency]);

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

  const onSubmit = async (data: FormData, status?: string) => {
    if (
      status === "Draft" ||
      status === "Pending For Approval" ||
      status === "Approved"
    ) {
      setSubmittingAs(status);
    }
    if (!purchaseInvoiceItems || purchaseInvoiceItems.length === 0) {
      toast.error("At least one purchase invoice item is required");
      return;
    }

    const invalidItems = purchaseInvoiceItems
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

    // Calculate exchange rate value; when currency is same, force 1 so base mirrors normal
    const exchangeRate = (() => {
      const parsed = customExchangeRate?.trim()
        ? parseFloat(customExchangeRate)
        : exchangeRateData?.Rate;
      return typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0
        ? parsed
        : 1;
    })();

    // Calculate base currency amounts (always mirror amounts; FX=1 for same currency)
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
      // Normalize nullable/optional numeric fields so JSON always carries explicit numbers
      dblTotalDiscountAmt: data.dblTotalDiscountAmt || 0,
      dblNetAmt: data.dblNetAmt || 0,
      strOrderNo: data.strOrderNo || null,
      strBillingAddress: billingAddress,
      strShippingAddress: shippingAddress,
      // Exchange rate fields (always send 1 when same currency)
      dblExchangeRate: exchangeRate,
      dtExchangeRateDate:
        isEditMode && purchaseInvoice?.dtExchangeRateDate
          ? purchaseInvoice.dtExchangeRateDate
          : new Date().toISOString().split("T")[0],
      // Base currency amounts
      dblGrossTotalAmtBase: grossTotalAmtBase,
      dblTotalDiscountAmtBase: totalDiscountAmtBase,
      dblTaxAmtBase: taxAmtBase,
      dblAdjustmentAmtBase: adjustmentAmtBase,
      dblNetAmtBase: netAmtBase,
      dblPendingAmount:
        isEditMode && purchaseInvoice?.dblPendingAmount !== undefined
          ? purchaseInvoice.dblPendingAmount
          : data.dblNetAmt || 0,
      dblPendingAmountBase:
        isEditMode && purchaseInvoice?.dblPendingAmountBase !== undefined
          ? purchaseInvoice.dblPendingAmountBase
          : netAmtBase,
      items: purchaseInvoiceItems.map((item, index) => {
        const itemNet = Number(item.dblNetAmt ?? item.dblTotalAmt ?? 0);

        return {
          ...(isEditMode &&
            item.strPurchaseInvoice_ItemGUID && {
              strPurchaseInvoice_ItemGUID: item.strPurchaseInvoice_ItemGUID,
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
          dblNetAmt: itemNet,
          dblDiscountPercentage: Number(item.dblDiscountPercentage ?? 0),
          dblDiscountAmt: Number(item.dblDiscountAmt || 0),
          // Keep undefined so Zod optional string passes; we already enforce required via custom validation
          strAccountGUID: item.strAccountGUID || undefined,
          dblRateBase: Number(((item.dblRate || 0) * exchangeRate).toFixed(3)),
          dblTaxAmtBase: Number(
            ((item.dblTaxAmt || 0) * exchangeRate).toFixed(3)
          ),
          dblNetAmtBase: Number((itemNet * exchangeRate).toFixed(3)),
          dblTotalAmtBase: Number(
            ((item.dblTotalAmt || 0) * exchangeRate).toFixed(3)
          ),
          dblDiscountAmtBase: Number(
            ((item.dblDiscountAmt || 0) * exchangeRate).toFixed(3)
          ),
        };
      }),
    } as FormData;

    if (isEditMode) {
      const updateData = {
        ...formData,
        strStatus: status || formData.strStatus,
      } as unknown as PurchaseInvoiceUpdate;

      await updateMutation.mutateAsync({
        id: id!,
        purchaseInvoice: updateData,
        files: attachments.length > 0 ? attachments : undefined,
        removeDocumentIds:
          removedDocumentIds.length > 0 ? removedDocumentIds : undefined,
      });

      setSubmittingAs(null);
      setAttachments([]);
      setRemovedDocumentIds([]);

      navigate("/purchase-invoice");
    } else {
      const createData = {
        ...formData,
        strStatus: status || "Draft",
      } as unknown as PurchaseInvoiceCreate;

      await createMutation.mutateAsync({
        purchaseInvoice: createData,
        files: attachments.length > 0 ? attachments : undefined,
      });

      setSubmittingAs(null);
      setAttachments([]);
      setRemovedDocumentIds([]);

      navigate("/purchase-invoice");
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id) return;

    await deleteMutation.mutateAsync({ id: id! });
    navigate("/purchase-invoice");
    setShowDeleteConfirm(false);
  };

  // Compute print availability before any early returns
  const hasItemsForPrint = React.useMemo(() => {
    if (purchaseInvoice?.items && purchaseInvoice.items.length > 0) return true;
    return purchaseInvoiceItems.length > 0;
  }, [purchaseInvoice?.items, purchaseInvoiceItems]);

  if (isFetchingPurchaseInvoice && isEditMode) {
    return (
      <CustomContainer>
        <PurchaseInvoiceFormSkeleton />
      </CustomContainer>
    );
  }

  if (
    isEditMode &&
    !isFetchingPurchaseInvoice &&
    (purchaseInvoiceError || (!purchaseInvoice && !isFetchingPurchaseInvoice))
  ) {
    return <NotFound pageName="Purchase Invoice" />;
  }

  const handleBack = () => {
    navigate("/purchase-invoice");
  };

  const handleOpenPrintPage = () => {
    const path =
      id && id !== "new"
        ? `/purchase-invoice/${id}/print`
        : "/purchase-invoice/draft/print";

    if (!hasItemsForPrint) {
      toast.error("Add at least one purchase invoice item before printing");
      return;
    }

    navigate(path, {
      state: {
        formValues: form.getValues(),
        items: purchaseInvoiceItems,
        currencyLabel,
      },
    });
  };

  const canShowPrint = !(
    (isEditMode ? purchaseInvoice?.strStatus : form.watch("strStatus")) ===
    "Draft"
  );

  return (
    <CustomContainer className="flex flex-col h-screen">
      <PageHeader
        title={isEditMode ? "Edit Purchase Invoice" : "Create Purchase Invoice"}
        icon={HeaderIcon}
        description={
          isEditMode
            ? "Edit purchase invoice details"
            : "Create a new purchase invoice"
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
              if (errors.items) {
                toast.error("Please fix all purchase invoice item errors");

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
                {/* Vendor Selection and Currency Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="strPartyGUID"
                    render={({ field }) => (
                      <FormItem className="lg:col-span-2">
                        <FormLabel>
                          Vendor Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <PreloadedSelectWithAvatar
                            placeholder="Select vendor"
                            selectedValue={field.value || undefined}
                            onChange={field.onChange}
                            options={(activeVendors || []).map(
                              (p): SelectOptionWithDetails => ({
                                value: p.strPartyGUID,
                                label: p.strPartyName_Display || p.strPartyGUID,
                                phone: p.strPhoneNoWork || undefined,
                                mobile: p.strPhoneNoWork
                                  ? undefined
                                  : p.strPhoneNoPersonal || undefined,
                                email: p.strEmail || undefined,
                                company: p.strCompanyName || undefined,
                              })
                            )}
                            isLoading={isLoadingVendors}
                            queryKey={["parties", "list", "active:Vendor"]}
                            disabled={isFormDisabled}
                            onOpenChange={(isOpen: boolean) =>
                              setDropdownOpen((p) => ({
                                ...p,
                                vendors: isOpen,
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
                      <FormItem className="lg:col-span-1">
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <PreloadedSelect
                            placeholder="Select currency"
                            selectedValue={field.value || undefined}
                            onChange={field.onChange}
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
                          <div className="flex items-center mb-2">
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

                {/* Purchase Invoice Number and Date Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div>
                    <FormLabel>Purchase Invoice No.</FormLabel>
                    <div className="relative mt-2">
                      <Input
                        placeholder="Auto Generated"
                        value={
                          isEditMode
                            ? (purchaseInvoice?.strPurchaseInvoiceNo ?? "")
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
                    name="dPurchaseInvoiceDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Purchase Invoice Date{" "}
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
                  <FormField
                    control={form.control}
                    name="strOrderNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Reference No.</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter vendor reference number"
                            value={field.value ?? ""}
                            onChange={field.onChange}
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
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Purchase invoice subject"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          disabled={isFormDisabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-6" />

                <div>
                  <PurchaseInvoiceItemsSection
                    form={form}
                    purchaseInvoiceItems={purchaseInvoiceItems}
                    setPurchaseInvoiceItems={setPurchaseInvoiceItems}
                    isFormDisabled={isFormDisabled}
                    currencyLabel={currencyLabel}
                    existingFiles={existingFiles}
                    attachments={attachments}
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
                    isDifferentCurrency={isDifferentCurrency}
                    exchangeRateData={exchangeRateData}
                    isLoadingExchangeRate={isLoadingExchangeRate}
                    isEditingExchangeRate={isEditingExchangeRate}
                    setIsEditingExchangeRate={setIsEditingExchangeRate}
                    customExchangeRate={customExchangeRate}
                    setCustomExchangeRate={setCustomExchangeRate}
                    exchangeRateDate={
                      isEditMode
                        ? purchaseInvoice?.dtExchangeRateDate
                          ? purchaseInvoice.dtExchangeRateDate
                          : undefined
                        : undefined
                    }
                    fromCurrency={fromCurrency}
                    toCurrency={toCurrency}
                    partyWithLocations={effectivePartyWithLocations}
                  />
                </div>

                <Separator className="my-4" />

                <div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-medium">
                          Vendor Notes
                        </h3>
                      </div>
                      <FormField
                        control={form.control}
                        name="strCustomerNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Notes for vendor."
                                className="min-h-20 sm:min-h-25 text-sm"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                rows={4}
                                disabled={isFormDisabled}
                              />
                            </FormControl>
                            <div className="text-xs text-gray-500 mt-1">
                              Will be displayed on the purchase invoice
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
                      module={FormModules.PURCHASE_INVOICE}
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
                  module={FormModules.PURCHASE_INVOICE}
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
                        : createMutation.isPending) && submittingAs === "Draft"
                        ? "Saving..."
                        : "Save as Draft"}
                    </Button>
                    <Button
                      type="button"
                      onClick={form.handleSubmit((data) =>
                        onSubmit(
                          data,
                          hasApproveRights ? "Approved" : "Pending For Approval"
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

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this purchase invoice? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />

      <AddressEditDialog
        open={openBillingDialog}
        onOpenChange={setOpenBillingDialog}
        title="Edit Billing Address"
        initialAddress={form.watch("strBillingAddress")}
        disabled={isFormDisabled}
        onSave={(address) => form.setValue("strBillingAddress", address)}
        partyGUID={selectedPartyGUID}
        addressType="billing"
      />

      <AddressEditDialog
        open={openShippingDialog}
        onOpenChange={setOpenShippingDialog}
        title="Edit Shipping Address"
        initialAddress={form.watch("strShippingAddress")}
        disabled={isFormDisabled}
        onSave={(address) => form.setValue("strShippingAddress", address)}
        partyGUID={selectedPartyGUID}
        addressType="shipping"
      />
    </CustomContainer>
  );
};

export default PurchaseInvoiceForm;
