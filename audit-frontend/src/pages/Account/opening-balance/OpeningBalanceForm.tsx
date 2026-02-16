import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  TrendingUp,
  Save,
  Trash2,
  Pencil,
  X,
  Settings,
} from "lucide-react";

import type { OpeningBalanceFormValues } from "@/validations/Account/opening-balance";
import type {
  OpeningBalanceCreate,
  OpeningBalanceUpdate,
} from "@/types/Account/opening-balance";
import type { ScheduleTreeNode } from "@/types/Account/account";
import { Actions, FormModules } from "@/lib/permissions";
import { sanitizeDecimalInput } from "@/lib/utils/formatting";
import { openingBalanceSchema } from "@/validations/Account/opening-balance";

import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks";
import {
  useOpeningBalance,
  useCreateOpeningBalance,
  useUpdateOpeningBalance,
  useDeleteOpeningBalance,
} from "@/hooks/api/Account/use-opening-balances";
import { useAccountsByTypesTree } from "@/hooks/api/Account";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useExchangeRate } from "@/hooks/api/central/use-organizations";

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
import { WithPermission } from "@/components/ui/with-permission";
import {
  TreeDropdown,
  type TreeItem,
} from "@/components/ui/select/tree-dropdown";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import NotFound from "@/components/error-boundaries/entity-not-found";

import { OpeningBalanceFormSkeleton } from "./OpeningBalanceFormSkeleton";

export default function OpeningBalanceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [selectedCurrencyGUID, setSelectedCurrencyGUID] = useState<string>("");
  const [customExchangeRate, setCustomExchangeRate] = useState<number | string>(
    ""
  );
  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    accounts: false,
    currencies: false,
  });

  const { user } = useAuthContext();
  const HeaderIcon = useMenuIcon("OPENING_BALANCE", TrendingUp);
  const isEditMode = !!id && id !== "create" && id !== "new";

  const handleSettingsClick = () => {
    if (user?.strLastYearGUID) {
      window.open(`/year/${user.strLastYearGUID}`, "_blank");
    }
  };

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

  // Enable lazy fetch for create; prefetch for edit to fill existing values
  const shouldPrefetch = isEditMode;
  const accountsEnabled = dropdownOpen.accounts || shouldPrefetch;

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

  const { data: currencyTypes, isLoading: isLoadingCurrencies } =
    useActiveCurrencyTypes(undefined, true);
  const {
    data: openingBalance,
    isFetching: isFetchingOpeningBalance,
    error: openingBalanceError,
  } = useOpeningBalance(isEditMode && id ? id : "");

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

  const createMutation = useCreateOpeningBalance();
  const updateMutation = useUpdateOpeningBalance(isEditMode ? id : undefined);
  const deleteMutation = useDeleteOpeningBalance();

  const form = useForm<OpeningBalanceFormValues>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      dtOpeningBalanceDate: new Date().toISOString().split("T")[0],
      strAccountGUID: "",
      strAccountName: undefined,
      strCurrencyTypeGUID: user?.strCurrencyTypeGUID || undefined,
      dblDebit: undefined,
      dblCredit: undefined,
      dblExchangeRate: undefined,
      dtExchangeDate: undefined,
      dblDebit_BaseCurrency: undefined,
      dblCredit_BaseCurrency: undefined,
    },
  });

  useEffect(() => {
    if (isEditMode && openingBalance) {
      form.reset({
        dtOpeningBalanceDate: openingBalance.dtOpeningBalanceDate.substring(
          0,
          10
        ),
        strAccountGUID: openingBalance.strAccountGUID,
        strAccountName: openingBalance.strAccountName || undefined,
        strCurrencyTypeGUID: openingBalance.strCurrencyTypeGUID || undefined,
        dblDebit: openingBalance.dblDebit || undefined,
        dblCredit: openingBalance.dblCredit || undefined,
        dblExchangeRate: openingBalance.dblExchangeRate || undefined,
        dtExchangeDate:
          openingBalance.dtExchangeDate?.substring(0, 10) || undefined,
        dblDebit_BaseCurrency:
          openingBalance.dblDebit_BaseCurrency || undefined,
        dblCredit_BaseCurrency:
          openingBalance.dblCredit_BaseCurrency || undefined,
      });

      if (openingBalance.strCurrencyTypeGUID) {
        setSelectedCurrencyGUID(openingBalance.strCurrencyTypeGUID);
      }
    }
  }, [isEditMode, openingBalance, form]);

  // Watch for currency selection changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "strCurrencyTypeGUID" && value.strCurrencyTypeGUID) {
        setSelectedCurrencyGUID(value.strCurrencyTypeGUID);
        setIsEditingExchangeRate(false);
        setCustomExchangeRate("");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Default currency to user's organization currency for new opening balances
  useEffect(() => {
    if (!isEditMode && user?.strCurrencyTypeGUID) {
      const current = form.getValues("strCurrencyTypeGUID");
      if (!current) {
        form.setValue("strCurrencyTypeGUID", user.strCurrencyTypeGUID);
      }
    }
  }, [isEditMode, user?.strCurrencyTypeGUID, form]);

  // Keep exchange rate in sync whenever the API responds
  useEffect(() => {
    if (!exchangeRateData?.Rate || !isDifferentCurrency) return;
    setCustomExchangeRate(Number(exchangeRateData.Rate.toFixed(3)));
  }, [exchangeRateData, isDifferentCurrency]);

  // Set custom exchange rate from stored value in edit mode
  useEffect(() => {
    if (isEditMode && openingBalance?.dblExchangeRate && !customExchangeRate) {
      setCustomExchangeRate(openingBalance.dblExchangeRate);
    }
  }, [isEditMode, openingBalance?.dblExchangeRate, customExchangeRate]);

  const onSubmit = async (values: OpeningBalanceFormValues) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Calculate exchange rate value for base currency conversion
      const exchangeRate = (() => {
        const parsed = customExchangeRate ?? exchangeRateData?.Rate;
        return typeof parsed === "number" &&
          Number.isFinite(parsed) &&
          parsed > 0
          ? parsed
          : 1;
      })();

      const baseCurrencyDebit = values.dblDebit
        ? parseFloat((values.dblDebit * exchangeRate).toFixed(3))
        : null;
      const baseCurrencyCredit = values.dblCredit
        ? parseFloat((values.dblCredit * exchangeRate).toFixed(3))
        : null;

      if (isEditMode && openingBalance) {
        const updateData: OpeningBalanceUpdate = {
          dtOpeningBalanceDate: values.dtOpeningBalanceDate,
          strAccountGUID: values.strAccountGUID,
          strCurrencyTypeGUID: values.strCurrencyTypeGUID || null,
          dblDebit: values.dblDebit || null,
          dblCredit: values.dblCredit || null,
          dblExchangeRate: exchangeRate,
          dtExchangeDate:
            openingBalance?.dtExchangeDate ||
            new Date().toISOString().split("T")[0],
          dblDebit_BaseCurrency: baseCurrencyDebit,
          dblCredit_BaseCurrency: baseCurrencyCredit,
        };

        await updateMutation.mutateAsync(updateData);
        navigate("/opening-balance");
      } else {
        const createData: OpeningBalanceCreate = {
          dtOpeningBalanceDate: values.dtOpeningBalanceDate,
          strAccountGUID: values.strAccountGUID,
          strCurrencyTypeGUID: values.strCurrencyTypeGUID || null,
          dblDebit: values.dblDebit || null,
          dblCredit: values.dblCredit || null,
          dblExchangeRate: exchangeRate,
          dtExchangeDate: new Date().toISOString().split("T")[0],
          dblDebit_BaseCurrency: baseCurrencyDebit,
          dblCredit_BaseCurrency: baseCurrencyCredit,
        };

        await createMutation.mutateAsync(createData);
        navigate("/opening-balance");
      }
    } catch (error) {
      console.error("Error submitting opening balance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id) return;

    await deleteMutation.mutateAsync(id);
    navigate("/opening-balance");
    setShowDeleteConfirm(false);
  };

  const handleBack = () => {
    navigate("/opening-balance");
  };

  // Handle error state (404 or other errors)
  if (isEditMode && openingBalanceError) {
    return <NotFound pageName="Opening Balance" />;
  }

  if (isEditMode && (isFetchingOpeningBalance || !openingBalance)) {
    return (
      <CustomContainer>
        <OpeningBalanceFormSkeleton />
      </CustomContainer>
    );
  }
  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  return (
    <Form {...form}>
      <CustomContainer>
        <PageHeader
          title={isEditMode ? "Edit Opening Balance" : "Create Opening Balance"}
          icon={HeaderIcon}
          description={
            isEditMode
              ? `Editing opening balance ${openingBalance?.strOpeningBalanceNo}`
              : "Create a new opening balance entry"
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

        {isEditMode && (isFetchingOpeningBalance || !openingBalance) ? (
          <OpeningBalanceFormSkeleton />
        ) : (
          <form
            onSubmit={form.handleSubmit((data: OpeningBalanceFormValues) =>
              onSubmit(data)
            )}
            className="space-y-6"
          >
            <Card>
              <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-foreground pb-2">
                      Opening Balance Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                      <div>
                        <FormLabel>Opening Balance No</FormLabel>
                        <div className="relative mt-2">
                          <Input
                            placeholder="Auto Generated"
                            value={
                              isEditMode
                                ? (openingBalance?.strOpeningBalanceNo ?? "")
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
                        name="dtOpeningBalanceDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Opening Balance Date{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={(date) => {
                                  field.onChange(
                                    date ? format(date, "yyyy-MM-dd") : ""
                                  );
                                }}
                                placeholder="Select date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="strAccountGUID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Account{" "}
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <TreeDropdown
                                data={accountTreeItems}
                                value={field.value ? [field.value] : []}
                                onSelectionChange={(
                                  items: typeof accountTreeItems
                                ) => field.onChange(items[0]?.id || "")}
                                placeholder="Select account"
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
                        name="strCurrencyTypeGUID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency Type</FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                options={
                                  currencyTypes?.map((item) => ({
                                    value: item.strCurrencyTypeGUID,
                                    label: item.strName,
                                  })) || []
                                }
                                selectedValue={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder="Select currency"
                                initialMessage="No currencies found"
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
                          </FormItem>
                        )}
                      />
                    </div>

                    {isDifferentCurrency && (
                      <div className="mt-2">
                        {isLoadingExchangeRate ? (
                          <div className="text-sm text-muted-foreground">
                            Loading exchange rate...
                          </div>
                        ) : isEditingExchangeRate ? (
                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-muted-foreground">
                              Exchange Rate
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
                                  ""}{" "}
                                =
                              </span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={customExchangeRate?.toString() || ""}
                                onChange={(e) =>
                                  setCustomExchangeRate(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : ""
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
                                  toast.success("Exchange rate updated");
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
                                  if (exchangeRateData?.Rate !== undefined) {
                                    setCustomExchangeRate(
                                      exchangeRateData.Rate
                                    );
                                  } else if (
                                    isEditMode &&
                                    openingBalance?.dblExchangeRate
                                  ) {
                                    setCustomExchangeRate(
                                      openingBalance.dblExchangeRate
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
                              {isEditMode && openingBalance?.dtExchangeDate
                                ? new Date(openingBalance.dtExchangeDate)
                                    .toISOString()
                                    .split("T")[0]
                                : new Date().toISOString().split("T")[0]}
                              ) 1{" "}
                              {exchangeRateData?.FromCurrency ||
                                currencyTypes?.find(
                                  (c) =>
                                    c.strCurrencyTypeGUID ===
                                    selectedCurrencyGUID
                                )?.strName ||
                                ""}{" "}
                              ={" "}
                              {(
                                (isEditMode && openingBalance?.dblExchangeRate
                                  ? openingBalance.dblExchangeRate
                                  : typeof customExchangeRate === "number"
                                    ? customExchangeRate
                                    : exchangeRateData?.Rate) || 0
                              ).toFixed(3)}{" "}
                              {exchangeRateData?.ToCurrency ||
                                currencyTypes?.find(
                                  (c) =>
                                    c.strCurrencyTypeGUID ===
                                    user?.strCurrencyTypeGUID
                                )?.strName ||
                                ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsEditingExchangeRate(true)}
                              title="Edit Exchange Rate"
                            >
                              <Pencil className="h-3 w-3 text-primary" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4 text-foreground pb-2">
                      Amount Details
                    </h3>

                    <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                      <FormField
                        control={form.control}
                        name="dblDebit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.001"
                                min="0.001"
                                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0.00"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Sanitize to 3 decimal places
                                  const sanitized = sanitizeDecimalInput(
                                    value,
                                    3,
                                    false
                                  );
                                  const numValue =
                                    sanitized === ""
                                      ? undefined
                                      : parseFloat(sanitized);
                                  field.onChange(
                                    numValue && numValue > 0
                                      ? numValue
                                      : undefined
                                  );
                                  if (sanitized !== "") {
                                    form.setValue("dblCredit", undefined);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dblCredit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.001"
                                min="0.001"
                                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0.00"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  // Sanitize to 3 decimal places
                                  const sanitized = sanitizeDecimalInput(
                                    value,
                                    3,
                                    false
                                  );
                                  const numValue =
                                    sanitized === ""
                                      ? undefined
                                      : parseFloat(sanitized);
                                  field.onChange(
                                    numValue && numValue > 0
                                      ? numValue
                                      : undefined
                                  );
                                  // Clear debit when credit is entered
                                  if (sanitized !== "") {
                                    form.setValue("dblDebit", undefined);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t px-4 py-3 sm:px-6 sm:py-4 bg-muted/20">
                <div className="flex w-full justify-between">
                  <div>
                    <WithPermission
                      module={FormModules.OPENING_BALANCE}
                      action={Actions.DELETE}
                      fallback={<></>}
                    >
                      {isEditMode && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={
                            deleteMutation.isPending ||
                            createMutation.isPending ||
                            updateMutation.isPending
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </WithPermission>
                  </div>
                  <div className="flex gap-2">
                    <WithPermission
                      module={FormModules.OPENING_BALANCE}
                      action={isEditMode ? Actions.EDIT : Actions.SAVE}
                      fallback={<></>}
                    >
                      <Button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          createMutation.isPending ||
                          updateMutation.isPending ||
                          deleteMutation.isPending
                        }
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isCreating || isUpdating
                          ? isEditMode
                            ? "Updating..."
                            : "Creating..."
                          : isEditMode
                            ? "Update"
                            : "Create"}
                      </Button>
                    </WithPermission>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </form>
        )}

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Opening Balance"
          description="Are you sure you want to delete this opening balance? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
        />
      </CustomContainer>
    </Form>
  );
}
