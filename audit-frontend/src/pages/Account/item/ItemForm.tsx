import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Package, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  useItem,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from "@/hooks/api/Account/use-items";
import { useActiveUnits } from "@/hooks/api/Account/use-units";
import { useActiveTaxCategories } from "@/hooks/api/central/use-tax-categories";
import { useActiveVendorsByType } from "@/hooks/api/Account/use-vendors";
import { useAccountsByTypesTree } from "@/hooks/api/Account";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import type { ScheduleTreeNode, AccountInfo } from "@/types/Account/account";
import { TreeDropdown } from "@/components/ui/select/tree-dropdown/tree-dropdown";

import {
  Actions,
  FormModules,
  useCanEdit,
  useCanSave,
} from "@/lib/permissions";

import type { ItemCreate, ItemUpdate } from "@/types/Account/item";
import { getItemSchema, type ItemFormValues } from "@/validations/Account/item";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { ItemFormSkeleton } from "./ItemFormSkeleton";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { UnitModal } from "@/pages/Account/unit/UnitModal";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { getImagePath } from "@/lib/utils";
import { environment } from "@/config/environment";
import type { AttachmentFile } from "@/types/common";

const ItemForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);
  const [showUnitModal, setShowUnitModal] = React.useState<boolean>(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [removedDocumentIds, setRemovedDocumentIds] = React.useState<string[]>(
    []
  );
  const [existingImage, setExistingImage] =
    React.useState<AttachmentFile | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const HeaderIcon = useMenuIcon(FormModules.ITEM, Package);

  const isEditMode = !!id && id !== "new";

  const { user } = useAuthContext();
  const isTaxApplied = user?.bolIsTaxApplied ?? true;

  const existingImageUrl = React.useMemo(() => {
    if (!existingImage) return null;
    if (existingImage.strFilePath) {
      return getImagePath(existingImage.strFilePath) || null;
    }
    if (existingImage.strDocumentAssociationGUID) {
      return `${environment.baseUrl}/api/document/file/${existingImage.strDocumentAssociationGUID}`;
    }
    return null;
  }, [existingImage]);

  const previewUrl = React.useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const [dropdownOpen, setDropdownOpen] = React.useState<{
    units: boolean;
    taxCategories: boolean;
    vendors: boolean;
    salesAccounts: boolean;
    purchaseAccounts: boolean;
  }>({
    units: false,
    taxCategories: false,
    vendors: false,
    salesAccounts: false,
    purchaseAccounts: false,
  });

  // Enable lazy fetch for create; prefetch for edit to fill existing values
  const shouldPrefetch = isEditMode;
  const unitsEnabled = dropdownOpen.units || shouldPrefetch;
  const taxCategoriesEnabled =
    (dropdownOpen.taxCategories || shouldPrefetch) && isTaxApplied;
  const vendorsEnabled = dropdownOpen.vendors || shouldPrefetch;
  const salesAccountsEnabled = dropdownOpen.salesAccounts || shouldPrefetch;
  const purchaseAccountsEnabled =
    dropdownOpen.purchaseAccounts || shouldPrefetch;

  const { data: taxCategories, isLoading: isLoadingTaxCategories } =
    useActiveTaxCategories(
      user?.strTaxTypeGUID || "",
      undefined,
      taxCategoriesEnabled
    );

  const { data: units, isLoading: isLoadingUnits } =
    useActiveUnits(unitsEnabled);

  const { data: vendors, isLoading: isLoadingVendors } = useActiveVendorsByType(
    {
      strPartyType: "Vendor",
    },
    vendorsEnabled
  );

  // Fetch sales accounts (excluding Bank account type) - lazy
  const { data: salesAccountsTreeData, isLoading: isLoadingSalesAccounts } =
    useAccountsByTypesTree(
      {
        strAccountTypeGUIDs: "",
        maxLevel: 0,
      },
      { enabled: salesAccountsEnabled }
    );

  // Fetch purchase accounts (excluding Bank account type) - lazy
  const {
    data: purchaseAccountsTreeData,
    isLoading: isLoadingPurchaseAccounts,
  } = useAccountsByTypesTree(
    {
      strAccountTypeGUIDs: "",
      maxLevel: 0,
    },
    { enabled: purchaseAccountsEnabled }
  );

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(
      getItemSchema(isTaxApplied)
    ) as unknown as Resolver<ItemFormValues>,
    defaultValues: {
      strType: "Product",
      strName: "",
      strUnitGUID: "",
      bolIsSellable: false,
      dblSellingPrice: null,
      strSalesAccountGUID: null,
      strSalesDescription: null,
      bolIsPurchasable: false,
      dblCostPrice: null,
      strPurchaseAccountGUID: null,
      strPurchaseDescription: null,
      strPreferredVendorGUID: null,
      strTaxCategoryGUID: "",
      strHSNCode: null,
    },
    mode: "onChange",
  });

  const {
    data: item,
    isFetching: isFetchingItem,
    error: itemError,
  } = useItem(isEditMode && id ? id : undefined);

  const { mutate: createItem, isPending: isCreating } = useCreateItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateItem();
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteItem();

  const canEditUnit = useCanEdit(FormModules.UNIT);
  const canSaveUnit = useCanSave(FormModules.UNIT);
  const canAccessUnit = canEditUnit || canSaveUnit;

  type AccountTreeItem = {
    id: string;
    code?: string;
    name: string;
    info?: string;
    type: "label" | "data";
    children: AccountTreeItem[];
  };

  const buildTreeItems = React.useCallback(
    (
      nodes: ScheduleTreeNode[],
      accountFilter: (a: AccountInfo) => boolean
    ): AccountTreeItem[] => {
      const mapNodes = (ns: ScheduleTreeNode[]): AccountTreeItem[] =>
        ns
          .map((node) => {
            const accountItems: AccountTreeItem[] = node.accounts
              .filter(accountFilter)
              .map((a) => ({
                id: a.strAccountGUID,
                name: a.strAccountName,
                info: a.strAccountTypeName,
                type: "data",
                children: [],
              }));

            const childSchedules = mapNodes(node.children);
            const children = [...accountItems, ...childSchedules];

            if (children.length === 0) return null;

            return {
              id: node.strScheduleGUID,
              code: node.strScheduleCode,
              name: node.strScheduleName,
              type: "label",
              children,
            } as AccountTreeItem;
          })
          .filter(Boolean) as AccountTreeItem[];

      return mapNodes(nodes);
    },
    []
  );

  const salesAccountTreeItems = React.useMemo(() => {
    if (!salesAccountsTreeData?.scheduleTree) return [] as AccountTreeItem[];
    const activeOnly = (a: AccountInfo) => !!a.bolIsActive;
    return buildTreeItems(salesAccountsTreeData.scheduleTree, activeOnly);
  }, [salesAccountsTreeData, buildTreeItems]);

  // Memoize purchase accounts tree structure
  const purchaseAccountTreeItems = React.useMemo(() => {
    if (!purchaseAccountsTreeData?.scheduleTree) return [] as AccountTreeItem[];
    const activeOnly = (a: AccountInfo) => !!a.bolIsActive;
    return buildTreeItems(purchaseAccountsTreeData.scheduleTree, activeOnly);
  }, [purchaseAccountsTreeData, buildTreeItems]);

  React.useEffect(() => {
    if (item && isEditMode && id && (taxCategories || !isTaxApplied)) {
      const normalizedTaxCategoryGUID = item.strTaxCategoryGUID
        ? taxCategories?.find(
            (cat) =>
              cat.strTaxCategoryGUID.toUpperCase() ===
              item.strTaxCategoryGUID?.toUpperCase()
          )?.strTaxCategoryGUID || null
        : null;

      const resetValues = {
        strType: item.strType || "Product",
        strName: item.strName || "",
        strUnitGUID: item.strUnitGUID || "",
        bolIsSellable: item.bolIsSellable || false,
        dblSellingPrice: item.dblSellingPrice || null,
        strSalesAccountGUID: item.strSalesAccountGUID || null,
        strSalesDescription: item.strSalesDescription || null,
        bolIsPurchasable: item.bolIsPurchasable || false,
        dblCostPrice: item.dblCostPrice || null,
        strPurchaseAccountGUID: item.strPurchaseAccountGUID || null,
        strPurchaseDescription: item.strPurchaseDescription || null,
        strPreferredVendorGUID: item.strPreferredVendorGUID || null,
        strTaxCategoryGUID: isTaxApplied ? normalizedTaxCategoryGUID || "" : "",
        strHSNCode: item.strHSNCode || null,
      };

      form.reset(resetValues, {
        keepDirty: false,
        keepErrors: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });

      // Populate existing image (only first file is considered)
      if (item.strFiles && item.strFiles.length > 0) {
        const [firstFile] = item.strFiles;
        setExistingImage({
          ...firstFile,
          strFileType: firstFile.strFileType || "",
        } as AttachmentFile);
        setRemovedDocumentIds([]);
        setImageFile(null);
      }
    } else if (!isEditMode) {
      setExistingImage(null);
      setImageFile(null);
      setRemovedDocumentIds([]);
    }
  }, [item, form, isEditMode, id, taxCategories, isTaxApplied]);

  React.useEffect(() => {
    if (!isTaxApplied) {
      form.setValue("strTaxCategoryGUID", "", {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.clearErrors("strTaxCategoryGUID");
    }
  }, [form, isTaxApplied]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (jpeg, png, webp, etc.)");
      e.target.value = "";
      return;
    }

    if (existingImage?.strDocumentAssociationGUID) {
      setRemovedDocumentIds([existingImage.strDocumentAssociationGUID]);
    }

    setExistingImage(null);
    setImageFile(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    if (existingImage?.strDocumentAssociationGUID) {
      setRemovedDocumentIds([existingImage.strDocumentAssociationGUID]);
    }
    setExistingImage(null);
    setImageFile(null);
  };

  const onSubmit = (data: ItemFormValues) => {
    if (isEditMode && id) {
      const updateData: ItemUpdate = {
        strType: data.strType,
        strName: data.strName,
        strUnitGUID: data.strUnitGUID,
        bolIsSellable: data.bolIsSellable,
        dblSellingPrice: data.dblSellingPrice,
        strSalesAccountGUID: data.strSalesAccountGUID,
        strSalesDescription: data.strSalesDescription,
        bolIsPurchasable: data.bolIsPurchasable,
        dblCostPrice: data.dblCostPrice,
        strPurchaseAccountGUID: data.strPurchaseAccountGUID,
        strPurchaseDescription: data.strPurchaseDescription,
        strPreferredVendorGUID: data.strPreferredVendorGUID,
        strTaxCategoryGUID: isTaxApplied ? data.strTaxCategoryGUID : null,
        strHSNCode: data.strHSNCode,
      };

      updateItem(
        {
          id,
          data: updateData,
          files: imageFile ? [imageFile] : undefined,
          removeDocumentIds:
            removedDocumentIds.length > 0 ? removedDocumentIds : undefined,
        },
        {
          onSuccess: () => {
            navigate("/item");
          },
        }
      );
    } else {
      const createData: ItemCreate = {
        strType: data.strType,
        strName: data.strName,
        strUnitGUID: data.strUnitGUID,
        bolIsSellable: data.bolIsSellable,
        dblSellingPrice: data.dblSellingPrice,
        strSalesAccountGUID: data.strSalesAccountGUID,
        strSalesDescription: data.strSalesDescription,
        bolIsPurchasable: data.bolIsPurchasable,
        dblCostPrice: data.dblCostPrice,
        strPurchaseAccountGUID: data.strPurchaseAccountGUID,
        strPurchaseDescription: data.strPurchaseDescription,
        strPreferredVendorGUID: data.strPreferredVendorGUID,
        strTaxCategoryGUID: isTaxApplied ? data.strTaxCategoryGUID : null,
        strHSNCode: data.strHSNCode,
      };

      createItem(
        {
          item: createData,
          files: imageFile ? [imageFile] : undefined,
        },
        {
          onSuccess: () => {
            navigate("/item");
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (id) {
      deleteItem(
        { id },
        {
          onSuccess: () => {
            navigate("/item");
          },
        }
      );
    }
  };

  if (itemError) {
    return <NotFound />;
  }

  if (isEditMode && isFetchingItem) {
    return (
      <CustomContainer>
        <PageHeader
          title={isEditMode ? "Edit Item" : "New Item"}
          description={isEditMode ? "Update item details" : "Create a new item"}
          icon={HeaderIcon}
        />
        <ItemFormSkeleton />
      </CustomContainer>
    );
  }

  const isSellable = form.watch("bolIsSellable");
  const isPurchasable = form.watch("bolIsPurchasable");

  return (
    <>
      <CustomContainer className="flex flex-col h-screen">
        <PageHeader
          title={isEditMode ? "Edit Item" : "New Item"}
          description={isEditMode ? "Update item details" : "Create a new item"}
          icon={HeaderIcon}
          actions={
            <Button
              variant="outline"
              onClick={() => navigate("/item")}
              className="h-9 text-xs sm:text-sm"
              size="sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Back
            </Button>
          }
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1"
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="strType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-wrap gap-6 sm:gap-12"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Product" id="product" />
                                <label
                                  htmlFor="product"
                                  className="cursor-pointer"
                                >
                                  Product
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Service" id="service" />
                                <label
                                  htmlFor="service"
                                  className="cursor-pointer"
                                >
                                  Service
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="strName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Item Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter item name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strUnitGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Unit <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              selectedValue={field.value || ""}
                              onChange={field.onChange}
                              options={
                                units?.map((unit) => ({
                                  label: unit.strUnitName,
                                  value: unit.strUnitGUID,
                                })) || []
                              }
                              placeholder="Select a unit"
                              isLoading={isLoadingUnits}
                              initialMessage="Type to filter units"
                              queryKey={["units", "active"]}
                              showSettings={true}
                              onSettingsClick={() => {
                                if (canAccessUnit) {
                                  setShowUnitModal(true);
                                } else {
                                  toast.error(
                                    "You don't have permission to manage units"
                                  );
                                }
                              }}
                              onOpenChange={(isOpen: boolean) =>
                                setDropdownOpen((p) => ({
                                  ...p,
                                  units: isOpen,
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
                      name="strHSNCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HSN Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter HSN code"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isTaxApplied && (
                      <FormField
                        control={form.control}
                        name="strTaxCategoryGUID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Tax Category
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                selectedValue={field.value || ""}
                                onChange={field.onChange}
                                options={
                                  taxCategories?.map((cat) => ({
                                    label: cat.strCategoryName,
                                    value: cat.strTaxCategoryGUID,
                                  })) || []
                                }
                                placeholder="Select tax category"
                                isLoading={isLoadingTaxCategories}
                                onOpenChange={(isOpen: boolean) =>
                                  setDropdownOpen((p) => ({
                                    ...p,
                                    taxCategories: isOpen,
                                  }))
                                }
                                initialMessage="Type to filter tax categories"
                                queryKey={[
                                  "taxCategories",
                                  "active",
                                  user?.strTaxTypeGUID || "",
                                ]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Sales and Purchase Section - Side by Side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-0 lg:p-4">
                    {/* Sales Section */}
                    <div className="border border-border-color rounded-lg p-3 sm:p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Sales Information
                        </h3>
                        <FormField
                          control={form.control}
                          name="bolIsSellable"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormLabel className="mt-2">Sellable</FormLabel>
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

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="strSalesAccountGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Account <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <TreeDropdown
                                  data={salesAccountTreeItems}
                                  value={field.value ? [field.value] : []}
                                  onSelectionChange={(items) =>
                                    field.onChange(items[0]?.id ?? null)
                                  }
                                  placeholder="Sales"
                                  clearable
                                  disabled={!isSellable}
                                  isLoading={isLoadingSalesAccounts}
                                  onOpenChange={(isOpen: boolean) =>
                                    setDropdownOpen((p) => ({
                                      ...p,
                                      salesAccounts: isOpen,
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
                          name="dblSellingPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Selling Price{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  placeholder="00"
                                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  {...field}
                                  value={field.value || ""}
                                  disabled={!isSellable}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (!value) {
                                      field.onChange(null);
                                    } else {
                                      const parsed = parseFloat(value);
                                      field.onChange(
                                        isNaN(parsed) ? null : parsed
                                      );
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
                          name="strSalesDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter sales description"
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                  value={field.value || ""}
                                  disabled={!isSellable}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Purchase Section */}
                    <div className="border border-border-color rounded-lg p-3 sm:p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Purchase Information
                        </h3>
                        <FormField
                          control={form.control}
                          name="bolIsPurchasable"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormLabel className="mt-2">
                                Purchasable
                              </FormLabel>
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

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="strPurchaseAccountGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Account <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <TreeDropdown
                                  data={purchaseAccountTreeItems}
                                  value={field.value ? [field.value] : []}
                                  onSelectionChange={(items) =>
                                    field.onChange(items[0]?.id ?? null)
                                  }
                                  placeholder="Cost of Goods Sold"
                                  clearable
                                  disabled={!isPurchasable}
                                  isLoading={isLoadingPurchaseAccounts}
                                  onOpenChange={(isOpen: boolean) =>
                                    setDropdownOpen((p) => ({
                                      ...p,
                                      purchaseAccounts: isOpen,
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
                          name="dblCostPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Cost Price{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  placeholder="00"
                                  className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  {...field}
                                  value={field.value || ""}
                                  disabled={!isPurchasable}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (!value) {
                                      field.onChange(null);
                                    } else {
                                      const parsed = parseFloat(value);
                                      field.onChange(
                                        isNaN(parsed) ? null : parsed
                                      );
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
                          name="strPurchaseDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter purchase description"
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                  value={field.value || ""}
                                  disabled={!isPurchasable}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="strPreferredVendorGUID"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Vendor</FormLabel>
                              <FormControl>
                                <PreloadedSelect
                                  selectedValue={field.value || ""}
                                  onChange={(value) => {
                                    if (isPurchasable) {
                                      field.onChange(value || null);
                                    }
                                  }}
                                  options={
                                    vendors?.map((vendor) => ({
                                      label: vendor.strPartyName_Display,
                                      value: vendor.strPartyGUID,
                                    })) || []
                                  }
                                  placeholder="Select vendor"
                                  initialMessage="Type to filter vendors"
                                  queryKey={["vendors", "active", "vendor"]}
                                  disabled={!isPurchasable}
                                  isLoading={isLoadingVendors}
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
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center">
                      <h3 className="text-base sm:text-lg font-medium">
                        Item Image
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div
                          className="relative w-52 h-40 border border-dashed border-muted-foreground/40 rounded-md flex items-center justify-center overflow-hidden bg-muted/20 cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              fileInputRef.current?.click();
                            }
                          }}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                          />

                          {imageFile && previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="New item"
                              className="object-cover w-full h-full"
                            />
                          ) : existingImageUrl ? (
                            <img
                              src={existingImageUrl}
                              alt={existingImage?.strFileName || "Item"}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-xs text-foreground/80 pointer-events-none">
                              <span className="text-sm text-muted-foreground">
                                No image uploaded
                              </span>
                              <span className="mt-0.5">Choose Image</span>
                            </div>
                          )}
                        </div>
                        {(existingImage || imageFile) && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="inline-flex h-8 w-8 items-center text-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload an image upto 10MB for this item (jpeg, png,
                        webp).
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Footer */}
              <div className="mt-auto bg-card sticky bottom-0 border-t border-border-color">
                <CardFooter className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                  <div>
                    {isEditMode && (
                      <WithPermission
                        module={FormModules.ITEM}
                        action={Actions.DELETE}
                        fallback={<></>}
                      >
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </WithPermission>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <WithPermission
                      module={FormModules.ITEM}
                      action={isEditMode ? Actions.EDIT : Actions.SAVE}
                      fallback={<></>}
                    >
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isCreating || isUpdating}
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
                </CardFooter>
              </div>
            </Card>
          </form>
        </Form>
      </CustomContainer>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
      />

      <UnitModal
        open={showUnitModal}
        onOpenChange={setShowUnitModal}
        skipPermissionCheck={true}
      />
    </>
  );
};

export default ItemForm;
