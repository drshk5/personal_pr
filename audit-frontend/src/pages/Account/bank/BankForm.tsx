import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Building, CircleHelp, Save, Trash2 } from "lucide-react";

import {
  useBank,
  useCreateBank,
  useUpdateBank,
  useDeleteBank,
} from "@/hooks/api/Account/use-banks";
import { useOnlyBankAccountTypes } from "@/hooks/api/central/use-account-types";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import { Actions, FormModules } from "@/lib/permissions";

import type { BankCreate, BankUpdate } from "@/types/Account/bank";
import { bankSchema, type BankFormValues } from "@/validations/Account/bank";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { BankFormSkeleton } from "./BankFormSkeleton";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import NotFound from "@/components/error-boundaries/entity-not-found";

const BankForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const HeaderIcon = useMenuIcon(FormModules.BANK, Building);

  const isEditMode = !!id && id !== "new";

  const { user } = useAuthContext();

  const [selectedAccountType, setSelectedAccountType] =
    React.useState<string>("");

  const [dropdownOpen, setDropdownOpen] = React.useState<{
    accountTypes: boolean;
  }>({
    accountTypes: false,
  });

  // Enable lazy fetch for create; prefetch for edit to fill existing values
  // Dropdowns show loading skeleton while data is being fetched
  const shouldPrefetch = isEditMode;
  const accountTypesEnabled = dropdownOpen.accountTypes || shouldPrefetch;

  const { data: accountTypes, isLoading: isLoadingAccountTypes } =
    useOnlyBankAccountTypes(undefined, accountTypesEnabled);

  const { data: currencyTypes, isLoading: isLoadingCurrencyTypes } =
    useActiveCurrencyTypes(undefined, true);

  const isCreditCardType = React.useMemo(() => {
    if (!accountTypes || selectedAccountType === "") return false;
    const selectedType = accountTypes.find(
      (type) => type.strAccountTypeGUID === selectedAccountType
    );
    return selectedType?.strName === "Credit Card";
  }, [selectedAccountType, accountTypes]);

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema) as unknown as Resolver<BankFormValues>,
    defaultValues: {
      strAccountName: "",
      strUDFCode: "",
      strAccountTypeGUID: "",
      strCurrencyTypeGUID: user?.strCurrencyTypeGUID || "",
      strAccountNumber: null,
      strBankName: null,
      strIFSCCode: null,
      strBranchName: null,
      strDesc: null,
      bolIsPrimary: true,
    },
    mode: "onBlur",
  });

  const {
    data: bank,
    isFetching: isFetchingBank,
    error: bankError,
  } = useBank(isEditMode && id ? id : undefined);

  const { mutate: createBank, isPending: isCreating } = useCreateBank();
  const { mutate: updateBank, isPending: isUpdating } = useUpdateBank();
  const { mutate: deleteBank, isPending: isDeleting } = useDeleteBank();

  React.useEffect(() => {
    if (bank && isEditMode && id) {
      const resetValues = {
        strAccountName: bank.strAccountName || "",
        strUDFCode: bank.strUDFCode || "",
        strAccountTypeGUID: bank.strAccountTypeGUID || "",
        strCurrencyTypeGUID: bank.strCurrencyTypeGUID || "",
        strAccountNumber: bank.strAccountNumber || null,
        strBankName: bank.strBankName || null,
        strIFSCCode: bank.strIFSCCode || null,
        strBranchName: bank.strBranchName || null,
        strDesc: bank.strDesc || null,
        bolIsPrimary: bank.bolIsPrimary || false,
      };

      form.reset(resetValues, {
        keepDirty: false,
        keepErrors: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });

      if (bank.strAccountTypeGUID) {
        setSelectedAccountType(bank.strAccountTypeGUID);

        setTimeout(() => {
          form.setValue("strAccountTypeGUID", bank.strAccountTypeGUID || "", {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
          form.setValue("strCurrencyTypeGUID", bank.strCurrencyTypeGUID || "", {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: false,
          });
        }, 100);
      }
    }
  }, [bank, form, isEditMode, id]);

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "strAccountTypeGUID" && value.strAccountTypeGUID) {
        setSelectedAccountType(value.strAccountTypeGUID);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  React.useEffect(() => {
    form.clearErrors(["strAccountNumber", "strIFSCCode"]);

    if (!isCreditCardType && form.formState.isDirty) {
      const accountNumber = form.getValues("strAccountNumber");
      const ifscCode = form.getValues("strIFSCCode");

      if (!accountNumber || accountNumber.trim() === "") {
        form.setError("strAccountNumber", {
          type: "manual",
          message: "Account number is required ",
        });
      }

      if (!ifscCode || ifscCode.trim() === "") {
        form.setError("strIFSCCode", {
          type: "manual",
          message: "IFSC code is required",
        });
      }
    }
  }, [isCreditCardType, form]);

  // Show single toast for validation errors
  React.useEffect(() => {
    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);

    if (errorFields.length > 0) {
      const firstError = errors[errorFields[0] as keyof typeof errors];
      const errorMessage =
        firstError?.message || "Please fill in all required fields";
      toast.error(errorMessage);
    }
  }, [form.formState.errors]);

  const onSubmit = (data: BankFormValues) => {
    const isCardType = isCreditCardType;

    if (!isCardType) {
      if (!data.strAccountNumber) {
        form.setError("strAccountNumber", {
          type: "manual",
          message: "Account number is required",
        });
        return;
      }
      if (!data.strIFSCCode) {
        form.setError("strIFSCCode", {
          type: "manual",
          message: "IFSC code is required",
        });
        return;
      }
    }

    if (isEditMode && id) {
      const updateData: BankUpdate = {
        strAccountName: data.strAccountName,
        strUDFCode: data.strUDFCode,
        strAccountTypeGUID: data.strAccountTypeGUID,
        strCurrencyTypeGUID: data.strCurrencyTypeGUID,
        strAccountNumber: isCardType ? null : data.strAccountNumber || null,
        strBankName: data.strBankName || null,
        strIFSCCode: isCardType ? null : data.strIFSCCode || null,
        strBranchName: isCardType ? null : data.strBranchName || null,
        strDesc: data.strDesc || null,
        bolIsPrimary: data.bolIsPrimary,
      };

      updateBank(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/bank");
          },
        }
      );
    } else {
      const createData: BankCreate = {
        strAccountName: data.strAccountName,
        strUDFCode: data.strUDFCode,
        strAccountTypeGUID: data.strAccountTypeGUID,
        strCurrencyTypeGUID: data.strCurrencyTypeGUID,
        strAccountNumber: isCardType ? null : data.strAccountNumber || null,
        strBankName: data.strBankName || null,
        strIFSCCode: isCardType ? null : data.strIFSCCode || null,
        strBranchName: isCardType ? null : data.strBranchName || null,
        strDesc: data.strDesc || null,
        bolIsPrimary: data.bolIsPrimary,
      };

      createBank(createData, {
        onSuccess: () => {
          navigate("/bank");
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;

    deleteBank(
      { id },
      {
        onSuccess: () => {
          navigate("/bank");
        },
        onSettled: () => {
          setShowDeleteConfirm(false);
        },
      }
    );
  };

  const isLoading = isEditMode && isFetchingBank;
  const isSaving = isCreating || isUpdating || isDeleting;

  if (
    isEditMode &&
    !isFetchingBank &&
    (bankError || (!bank && !isFetchingBank))
  ) {
    return <NotFound pageName="Bank" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Bank" : "Create Bank"}
        description={
          isEditMode
            ? `Editing bank account ${bank?.strAccountName || ""}`
            : "Create a new bank account"
        }
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/bank")}
            className="h-9 text-xs sm:text-sm"
            size="sm"
            disabled={isSaving}
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid gap-4">
        {isLoading ? (
          <BankFormSkeleton />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="strAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Account Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter account name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strUDFCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <span>
                              Account Code{" "}
                              <span className="text-red-500">*</span>
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground"
                                  aria-label="Account code help"
                                >
                                  <CircleHelp className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Short code for this account defined by the user.
                                Must be 6 alphanumeric characters.
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter 6-character alphanumeric account code"
                              {...field}
                              value={field.value || ""}
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
                          <FormLabel>
                            Currency Type{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              selectedValue={field.value}
                              onChange={field.onChange}
                              options={
                                currencyTypes?.map((type) => ({
                                  label: type.strName,
                                  value: type.strCurrencyTypeGUID,
                                })) || []
                              }
                              placeholder="Select currency type"
                              isLoading={isLoadingCurrencyTypes}
                              initialMessage="Select from available currencies"
                              queryKey={["currencyTypes", "active"]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="strAccountTypeGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Account Type <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              selectedValue={field.value}
                              onChange={(value) => {
                                if (value) {
                                  field.onChange(value);
                                  setSelectedAccountType(value);
                                }
                              }}
                              options={
                                accountTypes?.map((type) => ({
                                  label: type.strName,
                                  value: type.strAccountTypeGUID,
                                })) || []
                              }
                              placeholder="Select account type"
                              isLoading={isLoadingAccountTypes}
                              initialMessage="Select from available account types"
                              queryKey={["accountTypes", "onlyBank"]}
                              onOpenChange={(open) =>
                                setDropdownOpen((prev) => ({
                                  ...prev,
                                  accountTypes: open,
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
                      name="strBankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Bank Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter bank name"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="strAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Account Number{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter account number"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {!isCreditCardType && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="strIFSCCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              IFSC Code <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter IFSC code"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="strBranchName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter branch name"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="strDesc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter description"
                            className="resize-none min-h-25"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bolIsPrimary"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-start gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Primary Bank
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>

            <CardFooter className="border-t px-6 py-4 bg-muted/20">
              <div className="flex items-center justify-between w-full">
                <div>
                  {isEditMode && (
                    <WithPermission
                      module={FormModules.BANK}
                      action={Actions.DELETE}
                    >
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isLoading || isSaving}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    </WithPermission>
                  )}
                </div>
                <div className="flex gap-2">
                  <WithPermission
                    module={FormModules.BANK}
                    action={isEditMode ? Actions.EDIT : Actions.SAVE}
                  >
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isLoading || isSaving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving
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
        )}
      </div>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Bank"
        description="Are you sure you want to delete this bank? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default BankForm;
