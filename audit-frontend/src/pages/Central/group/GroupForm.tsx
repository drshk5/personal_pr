import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { GroupFormData } from "@/types/central/group";
import {
  useGroup,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from "@/hooks/api/central/use-groups";
import { useActiveIndustries } from "@/hooks/api/central/use-industries";
import { useActiveLegalStatusTypes } from "@/hooks/api/central/use-legal-status-types";
import {
  useActiveCountries,
  useFetchCurrencyByCountry,
} from "@/hooks/api/central/use-countries";
import { useStatesByCountry } from "@/hooks/api/central/use-states";
import { useActiveTaxTypes } from "@/hooks/api/central/use-tax-types";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { groupSchema, newGroupSchema } from "@/validations/central/group";
import { extractErrorMessage } from "@/lib/utils/api-error";
import { generateYearName, getImagePath } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import GroupModulesList from "@/pages/Central/group/group-module/GroupModulesList";
import GroupModuleModal from "@/pages/Central/group/group-module/GroupModuleModal";
import type { GroupModuleSimple } from "@/types/central/group-module";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageCropDialog } from "@/components/modals/ImageCropDialog";
import {
  ArrowLeft,
  Save,
  Trash2,
  Building,
  X,
  Camera,
  ChevronDown,
} from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { GroupFormSkeleton } from "./GroupFormSkeleton";
import { useMenuIcon } from "@/hooks";
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordInput } from "@/components/ui/password-input";
import { TaxConfigurationSection } from "./TaxConfigurationSection";
import timezoneData from "@/data/timezone.json";

const computeEndDateFromStart = (startDate: Date) => {
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  endDate.setDate(endDate.getDate() - 1);
  return endDate;
};

const GroupForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const isEditMode = !!id && id !== "new";
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [cropperOpen, setCropperOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCroppedImage = (croppedImage: string) => {
    setPreviewUrl(croppedImage);

    fetch(croppedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], selectedFile?.name || "group-logo.png", {
          type: "image/png",
        });
        setLogoFile(file);
        setCropperOpen(false);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setLogoError("Please select a valid image file");
        return;
      }

      setSelectedFile(file);
      setCropperOpen(true);
    }
  };

  const removeFile = () => {
    setLogoFile(undefined);
    setPreviewUrl(undefined);
    setSelectedFile(null);
    setLogoError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [showModuleModal, setShowModuleModal] = useState<boolean>(false);
  const [selectedGroupModule, setSelectedGroupModule] = useState<
    GroupModuleSimple | undefined
  >(undefined);

  const [showTaxConfig, setShowTaxConfig] = useState<boolean>(false);
  const [selectedTaxType, setSelectedTaxType] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<
    string | undefined
  >(undefined);

  const { data: industries = [], isLoading: isLoadingIndustries } =
    useActiveIndustries();
  const { data: legalStatusTypes = [], isLoading: isLoadingLegalStatusTypes } =
    useActiveLegalStatusTypes();
  const { data: countries = [], isLoading: loadingCountries } =
    useActiveCountries();
  const { data: currencyTypes = [], isLoading: loadingCurrencyTypes } =
    useActiveCurrencyTypes();
  const { data: states = [], isLoading: loadingStates } =
    useStatesByCountry(selectedCountryId);
  const { data: taxTypeData } = useActiveTaxTypes(undefined, selectedCountryId);

  const taxType = React.useMemo(() => {
    if (!taxTypeData || Array.isArray(taxTypeData)) return null;
    return taxTypeData;
  }, [taxTypeData]);

  const [, setFormError] = useState<string | null>(null);
  const [isGroupSaved, setIsGroupSaved] = useState(false);
  const [savedGroupId, setSavedGroupId] = useState<string | undefined>(
    undefined
  );

  const { data: fetchedGroupData, isLoading: isLoadingGroup } = useGroup(
    isEditMode && !isGroupSaved ? id : undefined
  );

  const groupData = fetchedGroupData;

  const { mutate: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroup();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();

  const isLoading =
    isLoadingGroup ||
    isLoadingIndustries ||
    isLoadingLegalStatusTypes ||
    loadingCountries ||
    loadingCurrencyTypes;
  const isSaving = isCreating || isUpdating;

  const defaultExpiryDate = new Date();
  defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 1);
  const defaultStartDate = new Date();
  const defaultEndDate = computeEndDateFromStart(defaultStartDate);
  const defaultYearName = generateYearName(defaultStartDate, defaultEndDate);

  const form = useForm({
    resolver: zodResolver(isEditMode ? groupSchema : newGroupSchema),
    defaultValues: {
      strName: "",
      strLicenseNo: "",
      strPAN: "",
      strTAN: "",
      strCIN: "",
      strUDFCode: "",
      strIndustryGUID: "",
      strLegalStatusTypeGUID: "",
      dtLicenseIssueDate: new Date(),
      dtLicenseExpired: defaultExpiryDate,
      dtStartDate: defaultStartDate,
      dtEndDate: defaultEndDate,
      strYearName: defaultYearName,
      // Tax configuration fields
      strCountryGUID: "",
      strCurrencyGUID: "",
      strTaxTypeGUID: "",
      strTaxRegNo: "",
      strStateGUID: "",
      dtRegistrationDate: undefined,
      bolIsDefaultTaxConfig: true,
      bolIsTaxApplied: false,
      jsonTaxSettings: "",
      // India GST fields
      gstNumber: "",
      eInvoiceEnabled: false,
      compositionScheme: false,
      gstinVerificationRequired: true,
      printHSNCode: true,
      // UK VAT fields
      vatNumber: "",
      vatScheme: "Standard" as const,
      mtdEnabled: true,
      accountingBasis: "Accrual" as const,
      flatRatePercentage: null,
      // USA Sales Tax fields
      primaryState: "",
      taxLicenseNumber: "",
      nexusStates: [],
      economicNexusEnabled: true,
      marketplaceFacilitator: false,
      showTaxBreakdownOnInvoice: true,

      strAdminName: isEditMode ? undefined : "",
      strAdminMobileNo: isEditMode ? undefined : "",
      strAdminEmailId: isEditMode ? undefined : "",
      strAdminPassword: isEditMode ? undefined : "",
      strTimeZone: "Asia/Kolkata",
    },
    mode: "onBlur",
  });

  const selectedCountryGUID = form.watch("strCountryGUID");
  const watchedStartDate = form.watch("dtStartDate");
  const watchedEndDate = form.watch("dtEndDate");

  React.useEffect(() => {
    setSelectedCountryId(selectedCountryGUID || undefined);
  }, [selectedCountryGUID]);

  const { data: currencyByCountry } = useFetchCurrencyByCountry(
    selectedCountryGUID || undefined
  );

  const availableTaxTypes = React.useMemo(() => {
    if (!taxType) return [];
    return [
      {
        value: taxType.strTaxTypeGUID,
        label: taxType.strTaxTypeName,
        code: taxType.strTaxTypeCode,
      },
    ];
  }, [taxType]);

  const selectedTaxTypeCode = React.useMemo(() => {
    if (!selectedTaxType || !taxType) return null;
    if (taxType.strTaxTypeGUID === selectedTaxType) {
      const upperCode = taxType.strTaxTypeCode?.toUpperCase();
      if (!upperCode) return null;
      if (upperCode.startsWith("GST")) return "GST";
      if (upperCode.startsWith("VAT")) return "VAT";
      if (upperCode.startsWith("SALES_TAX")) return "SALES_TAX";
      return upperCode as string;
    }
    return null;
  }, [selectedTaxType, taxType]);

  React.useEffect(() => {
    if (!selectedCountryGUID) {
      setSelectedTaxType(null);
      form.setValue("strTaxTypeGUID", "");
    } else if (availableTaxTypes.length > 0) {
      if (
        !selectedTaxType ||
        !availableTaxTypes.find((t) => t.value === selectedTaxType)
      ) {
        const firstTaxType = availableTaxTypes[0];
        setSelectedTaxType(firstTaxType.value);
        form.setValue("strTaxTypeGUID", firstTaxType.value);
      }
    }
  }, [selectedCountryGUID, availableTaxTypes, selectedTaxType, form]);

  React.useEffect(() => {
    if (selectedTaxType) {
      form.setValue("strTaxTypeGUID", selectedTaxType);
    }
  }, [selectedTaxType, form]);

  // Auto-fill currency when country changes
  React.useEffect(() => {
    if (currencyByCountry?.strCurrencyTypeGUID) {
      form.setValue("strCurrencyGUID", currencyByCountry.strCurrencyTypeGUID);
    }
  }, [currencyByCountry, form]);

  useEffect(() => {
    if (!isEditMode) {
      const today = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      form.setValue("dtLicenseIssueDate", today);
      form.setValue("dtLicenseExpired", nextYear);
    }
  }, [form, isEditMode]);

  useEffect(() => {
    if (!isEditMode && watchedStartDate) {
      const startDate =
        watchedStartDate instanceof Date
          ? watchedStartDate
          : new Date(watchedStartDate);
      const endDate = computeEndDateFromStart(startDate);
      form.setValue("dtEndDate", endDate);
    }
  }, [watchedStartDate, isEditMode, form]);

  useEffect(() => {
    if (!isEditMode && watchedStartDate && watchedEndDate) {
      const yearName = generateYearName(watchedStartDate, watchedEndDate);
      form.setValue("strYearName", yearName || "");
    }
  }, [watchedStartDate, watchedEndDate, isEditMode, form]);

  useEffect(() => {
    return () => {
      if (logoFile) {
        URL.revokeObjectURL(URL.createObjectURL(logoFile));
      }
    };
  }, [logoFile]);

  // Show single toast for validation errors
  useEffect(() => {
    const errors = form.formState.errors;
    const errorFields = Object.keys(errors);

    if (errorFields.length > 0) {
      const firstError = errors[errorFields[0] as keyof typeof errors];
      const errorMessage =
        firstError?.message || "Please fill in all required fields";
      toast.error(errorMessage);
    }
  }, [form.formState.errors]);

  const [dropdownsInitialized, setDropdownsInitialized] = useState(false);
  const [logoError, setLogoError] = useState<string>("");
  useEffect(() => {
    if (groupData && isEditMode) {
      if (groupData.strLogo) {
        setPreviewUrl(groupData.strLogo);
      }
    }
  }, [groupData, isEditMode]);

  useEffect(() => {
    if (
      groupData &&
      isEditMode &&
      industries.length > 0 &&
      legalStatusTypes.length > 0 &&
      !dropdownsInitialized
    ) {
      form.setValue("strName", groupData.strName);
      form.setValue("strLicenseNo", groupData.strLicenseNo);
      form.setValue("strPAN", groupData.strPAN || "");
      form.setValue("strTAN", groupData.strTAN || "");
      form.setValue("strCIN", groupData.strCIN || "");
      // UDFCode is in GroupCreate but not in Group
      if ("strUDFCode" in groupData) {
        const udfCode =
          (groupData as Record<string, string | null>).strUDFCode || "";
        form.setValue("strUDFCode", udfCode);
      }

      setDropdownsInitialized(true);
      if (groupData.dtLicenseIssueDate) {
        form.setValue(
          "dtLicenseIssueDate",
          new Date(groupData.dtLicenseIssueDate)
        );
      } else {
        form.setValue("dtLicenseIssueDate", new Date());
      }

      if (groupData.dtLicenseExpired) {
        form.setValue("dtLicenseExpired", new Date(groupData.dtLicenseExpired));
      } else {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        form.setValue("dtLicenseExpired", futureDate);
      }

      form.setValue("strAdminName", undefined);
      form.setValue("strAdminMobileNo", undefined);
      form.setValue("strAdminEmailId", undefined);
      form.setValue("strAdminPassword", undefined);
    }
  }, [
    groupData,
    form,
    isEditMode,
    industries,
    legalStatusTypes,
    dropdownsInitialized,
  ]);

  const handleDelete = () => {
    if (id) {
      deleteGroup(
        { id },
        {
          onSuccess: () => {
            setShowDeleteConfirm(false);
            navigate("/group");
          },
          onError: (error: unknown) => {
            const errorMessage = extractErrorMessage(error);
            setFormError(errorMessage);
            setShowDeleteConfirm(false);
            window.scrollTo(0, 0);
          },
        }
      );
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (formData: any) => {
    setFormError(null);
    setLogoError("");

    if (Object.keys(form.formState.errors).length > 0) {
      setFormError("Please fix the form validation errors before submitting");
      window.scrollTo(0, 0);
      return;
    }

    setLogoError("");
    const typedData = formData as {
      strName: string;
      strLicenseNo: string;
      strPAN: string;
      strTAN?: string | null;
      strCIN?: string | null;
      strUDFCode?: string | null;
      strIndustryGUID?: string | null;
      strLegalStatusTypeGUID?: string | null;
      dtLicenseIssueDate?: Date | null;
      dtLicenseExpired?: Date | null;
      LogoFile?: File | null;
      strAdminName?: string;
      strAdminMobileNo?: string;
      strAdminEmailId?: string;
      strAdminPassword?: string;
      strTimeZone?: string;
      dtStartDate?: Date | string | null;
      dtEndDate?: Date | string | null;
      strYearName?: string;
    };

    const formatDateForApi = (value?: Date | string | null) => {
      if (!value) return "";
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    };

    const processedData: GroupFormData = {
      strName: typedData.strName,
      strLicenseNo: typedData.strLicenseNo,
      strPAN: typedData.strPAN,
      strTAN: typedData.strTAN || "",
      strCIN: typedData.strCIN || "",
      ...(isEditMode
        ? {}
        : {
            strUDFCode: typedData.strUDFCode || "",
            strIndustryGUID: typedData.strIndustryGUID || "",
            strLegalStatusTypeGUID: typedData.strLegalStatusTypeGUID || "",
          }),
      dtLicenseIssueDate:
        typedData.dtLicenseIssueDate instanceof Date
          ? `${typedData.dtLicenseIssueDate.getFullYear()}-${String(
              typedData.dtLicenseIssueDate.getMonth() + 1
            ).padStart(2, "0")}-${String(
              typedData.dtLicenseIssueDate.getDate()
            ).padStart(2, "0")}`
          : `${new Date().getFullYear()}-${String(
              new Date().getMonth() + 1
            ).padStart(2, "0")}-${String(new Date().getDate()).padStart(
              2,
              "0"
            )}`,
      dtLicenseExpired:
        typedData.dtLicenseExpired instanceof Date
          ? `${typedData.dtLicenseExpired.getFullYear()}-${String(
              typedData.dtLicenseExpired.getMonth() + 1
            ).padStart(2, "0")}-${String(
              typedData.dtLicenseExpired.getDate()
            ).padStart(2, "0")}`
          : (() => {
              const futureDate = new Date();
              futureDate.setFullYear(futureDate.getFullYear() + 1);
              return `${futureDate.getFullYear()}-${String(
                futureDate.getMonth() + 1
              ).padStart(2, "0")}-${String(futureDate.getDate()).padStart(
                2,
                "0"
              )}`;
            })(),
      LogoFile: new File(["placeholder"], "placeholder.txt", {
        type: "text/plain",
      }),
    };

    if (logoFile) {
      processedData.LogoFile = logoFile;
      processedData.strLogo = logoFile.name;
    } else if (!previewUrl && groupData?.strLogo) {
      const emptyBlob = new Blob([""], { type: "application/octet-stream" });
      processedData.LogoFile = new File([emptyBlob], "empty.txt");
      processedData.strLogo = "";
    } else {
      processedData.strLogo = groupData?.strLogo || "";
    }

    if (isEditMode && id) {
      // Convert GroupFormData to FormData for API
      const formData = new FormData();

      // Add all fields from processedData
      Object.entries(processedData).forEach(([key, value]) => {
        if (key !== "LogoFile" && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Add logo file if it exists
      if (logoFile) {
        formData.append("LogoFile", logoFile);
      }

      updateGroup(
        { id, data: formData },
        {
          onSuccess: () => navigate("/group"),
          onError: (error: unknown) => {
            const errorMessage = extractErrorMessage(error);
            setFormError(errorMessage);
            window.scrollTo(0, 0);
          },
        }
      );
    } else {
      // Add admin fields for new group creation
      const createFormData = new FormData();

      // Add all fields from processedData
      Object.entries(processedData).forEach(([key, value]) => {
        if (key !== "LogoFile" && value !== undefined && value !== null) {
          createFormData.append(key, value.toString());
        }
      });

      // Add admin fields
      createFormData.append("strAdminName", typedData.strAdminName || "");
      createFormData.append(
        "strAdminMobileNo",
        typedData.strAdminMobileNo || ""
      );
      createFormData.append("strAdminEmailId", typedData.strAdminEmailId || "");
      createFormData.append(
        "strAdminPassword",
        typedData.strAdminPassword || ""
      );
      createFormData.append(
        "strTimeZone",
        typedData.strTimeZone || "Asia/Kolkata"
      );

      const yearValues = form.getValues();
      const startDate = formatDateForApi(yearValues.dtStartDate);
      const endDate = formatDateForApi(yearValues.dtEndDate);
      if (startDate) {
        createFormData.append("dtStartDate", startDate);
      }
      if (endDate) {
        createFormData.append("dtEndDate", endDate);
      }
      if (yearValues.strYearName) {
        createFormData.append("strYearName", yearValues.strYearName);
      }

      // Add tax configuration fields
      const taxValues = form.getValues();
      if (taxValues.strCountryGUID) {
        createFormData.append("strCountryGUID", taxValues.strCountryGUID);
      }
      if (taxValues.strCurrencyGUID) {
        createFormData.append("strCurrencyGUID", taxValues.strCurrencyGUID);
      }
      if (taxValues.strTaxTypeGUID) {
        createFormData.append("strTaxTypeGUID", taxValues.strTaxTypeGUID);
      }
      if (taxValues.strTaxRegNo) {
        createFormData.append("strTaxRegNo", taxValues.strTaxRegNo);
      }
      if (taxValues.strStateGUID) {
        createFormData.append("strStateGUID", taxValues.strStateGUID);
      }
      if (taxValues.dtRegistrationDate) {
        const regDate =
          taxValues.dtRegistrationDate instanceof Date
            ? `${taxValues.dtRegistrationDate.getFullYear()}-${String(
                taxValues.dtRegistrationDate.getMonth() + 1
              ).padStart(2, "0")}-${String(
                taxValues.dtRegistrationDate.getDate()
              ).padStart(2, "0")}`
            : taxValues.dtRegistrationDate;
        createFormData.append("dtRegistrationDate", regDate);
      }
      if (taxValues.bolIsDefaultTaxConfig !== undefined) {
        createFormData.append(
          "bolIsDefaultTaxConfig",
          taxValues.bolIsDefaultTaxConfig.toString()
        );
      }

      if (taxValues.bolIsTaxApplied !== undefined) {
        createFormData.append(
          "bolIsTaxApplied",
          taxValues.bolIsTaxApplied.toString()
        );
      }

      // Build jsonTaxSettings based on selected tax type
      let jsonTaxSettings: string | null = null;
      if (selectedTaxTypeCode) {
        if (selectedTaxTypeCode === "GST") {
          const gstSettings = {
            EInvoiceEnabled: taxValues.eInvoiceEnabled || false,
            CompositionScheme: taxValues.compositionScheme || false,
            GSTINVerificationRequired:
              taxValues.gstinVerificationRequired ?? true,
            PrintHSNCode: taxValues.printHSNCode ?? true,
          };
          jsonTaxSettings = JSON.stringify(gstSettings);
        } else if (selectedTaxTypeCode === "VAT") {
          const vatSettings = {
            VATScheme: taxValues.vatScheme || "Standard",
            MTDEnabled: taxValues.mtdEnabled ?? true,
            AccountingBasis: taxValues.accountingBasis || "Accrual",
            FlatRatePercentage: taxValues.flatRatePercentage,
          };
          jsonTaxSettings = JSON.stringify(vatSettings);
        } else if (selectedTaxTypeCode === "SALES_TAX") {
          const salesTaxSettings = {
            PrimaryState: taxValues.primaryState || "",
            TaxLicenseNumber: taxValues.taxLicenseNumber || "",
            NexusStates: taxValues.nexusStates || [],
            EconomicNexusEnabled: taxValues.economicNexusEnabled ?? true,
            MarketplaceFacilitator: taxValues.marketplaceFacilitator || false,
            ShowTaxBreakdownOnInvoice:
              taxValues.showTaxBreakdownOnInvoice ?? true,
          };
          jsonTaxSettings = JSON.stringify(salesTaxSettings);
        }
      }
      if (jsonTaxSettings) {
        createFormData.append("jsonTaxSettings", jsonTaxSettings);
      }

      // Add logo file if it exists
      if (logoFile) {
        createFormData.append("LogoFile", logoFile);
      }

      createGroup(createFormData, {
        onSuccess: (response) => {
          setIsGroupSaved(true);
          // Update the URL to include the new group ID without navigating away
          const newGroupId = response?.strGroupGUID;
          if (newGroupId) {
            // Save the new group ID to state for use by the GroupModulesList
            setSavedGroupId(newGroupId);

            // Update the URL and replace the "new" id with the actual group ID
            window.history.replaceState(null, "", `/group/${newGroupId}`);

            // Update logo preview URL if logo was uploaded
            if (response?.strLogo && logoFile) {
              if (response.strLogo) {
                setPreviewUrl(response.strLogo);
              }
            }
          }
        },
        onError: (error: unknown) => {
          const errorMessage = extractErrorMessage(error);
          setFormError(errorMessage);
          window.scrollTo(0, 0);
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("group_form", Building);

  if (isLoading) {
    return (
      <CustomContainer>
        <div className="flex flex-row items-center justify-between py-4 sm:py-6 px-2 gap-4">
          <div className="flex flex-1 items-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
              <HeaderIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              {isEditMode ? "Edit Group/Parent" : "Create Group/Parent"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/group")}
              className="h-9 text-xs sm:text-sm"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Back
            </Button>
          </div>
        </div>
        <div className="px-2 mb-4">
          <p className="text-sm text-muted-foreground">
            Manage group information
          </p>
        </div>
        <GroupFormSkeleton />
      </CustomContainer>
    );
  }

  return (
    <>
      <CustomContainer>
        <div className="flex flex-row items-center justify-between py-4 sm:py-6 px-2 gap-4">
          <div className="flex flex-1 items-center">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
              <Building className="h-5 w-5 sm:h-6 sm:w-6" />
              {isEditMode ? "Edit Group/Parent" : "Create Group/Parent"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/group")}
              className="h-9 text-xs sm:text-sm"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Back
            </Button>
          </div>
        </div>
        <div className="px-2 mb-4">
          <p className="text-sm text-muted-foreground">
            Manage group information
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              form.handleSubmit((data) => {
                onSubmit(data);
              })(e);
            }}
            className="space-y-8"
            encType="multipart/form-data"
          >
            <Card className="border border-border-color shadow-md rounded-xl bg-card mt-4 mb-6 transition-all duration-200">
              <CardContent className="p-8">
                {/* Logo centered - similar to organization form */}
                <div className="flex justify-center w-full mb-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <FormLabel
                        className={`mb-0 ${
                          logoError && logoError !== "Logo image is required"
                            ? "text-destructive"
                            : ""
                        }`}
                      >
                        Logo Image
                      </FormLabel>
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted-foreground/20 cursor-help transition-colors"
                        title="Upload a group logo (optional). Max file size: 2MB. Supported formats: JPEG, PNG"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3 h-3"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                      </span>
                    </div>

                    {/* Hidden field to store the strLogo value - handled separately from form */}
                    <input
                      type="hidden"
                      id="strLogo"
                      name="strLogo"
                      value={previewUrl || ""}
                    />

                    {/* Avatar with upload button - centered */}
                    <div className="flex flex-col items-center mb-4">
                      <div className="relative">
                        {/* Profile image/avatar */}
                        <div className="relative">
                          <div
                            className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {previewUrl ? (
                              <LazyImage
                                src={
                                  logoFile
                                    ? URL.createObjectURL(logoFile)
                                    : getImagePath(previewUrl) || ""
                                }
                                alt="Group logo"
                                className="w-full h-full object-cover object-center"
                                containerClassName="w-full h-full rounded-full"
                                placeholderClassName="rounded-full"
                                loading={logoFile ? "eager" : "lazy"}
                                threshold={100}
                                rootMargin="50px"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                                <Building className="h-16 w-16 text-muted-foreground/90" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                              <Camera className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          {/* X button positioned outside the avatar container */}
                          {previewUrl && (
                            <button
                              type="button"
                              className="absolute -right-2 -top-2 z-30 rounded-full p-1 bg-muted text-foreground shadow-md hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                              onClick={(e) => {
                                e.preventDefault(); // Prevent default behavior
                                e.stopPropagation(); // Prevent triggering the file input click
                                removeFile();
                              }}
                              disabled={isCreating || isUpdating || isDeleting}
                              aria-label="Remove logo"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground text-center">
                        Click to upload group logo
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isCreating || isUpdating || isDeleting}
                    />

                    {/* Image Cropper Dialog */}
                    <ImageCropDialog
                      open={cropperOpen}
                      onOpenChange={setCropperOpen}
                      file={selectedFile}
                      title="Crop Group Logo"
                      description="Drag to adjust the cropping area for your group logo"
                      helperText="Adjust the circular crop to select your group logo"
                      onCrop={handleCroppedImage}
                      fileInputRef={fileInputRef}
                    />

                    {logoError && (
                      <p
                        className="text-destructive text-sm mt-1 text-center"
                        data-slot="form-message"
                      >
                        {logoError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Group fields in grid layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-4">
                  {/* Group Name field */}
                  <FormField
                    control={form.control}
                    name="strName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2 font-medium">
                          Group Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter group name"
                            className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Remaining form fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mt-2">
                  {/* License Number */}
                  <FormField
                    control={form.control}
                    name="strLicenseNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2 font-medium">
                          License Number <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter license number"
                            className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* License Issue Date */}
                  <FormField
                    control={form.control}
                    name="dtLicenseIssueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="mb-2 font-medium">
                          License Issue Date{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={
                              field.value ? new Date(field.value) : new Date()
                            }
                            onChange={(date) =>
                              field.onChange(date || new Date())
                            }
                            placeholder="Select date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* License Expiry Date */}
                  <FormField
                    control={form.control}
                    name="dtLicenseExpired"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="mb-2 font-medium">
                          License Expiry Date{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            value={
                              field.value
                                ? new Date(field.value)
                                : (() => {
                                    const futureDate = new Date();
                                    futureDate.setFullYear(
                                      futureDate.getFullYear() + 1
                                    );
                                    return futureDate;
                                  })()
                            }
                            onChange={(date) => {
                              if (date === undefined) {
                                const futureDate = new Date();
                                futureDate.setFullYear(
                                  futureDate.getFullYear() + 1
                                );
                                field.onChange(futureDate);
                              } else {
                                field.onChange(date);
                              }
                            }}
                            placeholder="Select date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!isEditMode && (
                  <>
                    <Separator className="my-6 dark:bg-gray-700 bg-gray-200" />

                    {/* Admin Information Section - Only shown when creating a new group */}
                    <h3 className="text-lg font-medium mb-4">
                      Admin Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Admin Name */}
                      <FormField
                        control={form.control}
                        name="strAdminName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Admin Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter admin name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Admin Mobile Number */}
                      <FormField
                        control={form.control}
                        name="strAdminMobileNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Mobile Number{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={isSaving}
                                placeholder="Enter mobile number"
                                defaultCountry="IN"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Admin Email */}
                      <FormField
                        control={form.control}
                        name="strAdminEmailId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Email Address{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter email address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Admin Password */}
                      <FormField
                        control={form.control}
                        name="strAdminPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Password <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PasswordInput
                                {...field}
                                placeholder="Enter password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="strTimeZone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Timezone <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                selectedValue={field.value}
                                onChange={field.onChange}
                                options={timezoneData}
                                placeholder="Select timezone"
                                disabled={isSaving}
                                clearable
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6 dark:bg-gray-700 bg-gray-200" />

                    {/* Other Information Section - Only shown when creating a new group */}
                    <h3 className="text-lg font-medium mb-4">
                      Organization Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                      {/* Organization Code (Maps to UDF Code) */}
                      <FormField
                        control={form.control}
                        name="strUDFCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Organization Code{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Enter Organization Code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Industry GUID */}
                      <FormField
                        control={form.control}
                        name="strIndustryGUID"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              Industry Type{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                selectedValue={field.value || ""}
                                onChange={field.onChange}
                                options={industries.map((industry) => ({
                                  label: industry.strName,
                                  value: industry.strIndustryGUID,
                                }))}
                                placeholder="Select Industry Type"
                                initialMessage="Select from available industries"
                                addNewPath="/industry-type/new"
                                addNewLabel="Add New Industry"
                                isLoading={isLoadingIndustries}
                                queryKey={["industries", "active"]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Legal Status Type GUID */}
                      <FormField
                        control={form.control}
                        name="strLegalStatusTypeGUID"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              Legal Status Type{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                selectedValue={field.value || ""}
                                onChange={field.onChange}
                                options={legalStatusTypes.map(
                                  (legalStatus) => ({
                                    label: legalStatus.strName,
                                    value: legalStatus.strLegalStatusTypeGUID,
                                  })
                                )}
                                placeholder="Select Legal Status Type"
                                initialMessage="Select from available legal status types"
                                addNewPath="/legal-status-type/new"
                                addNewLabel="Add New Legal Status Type"
                                isLoading={isLoadingLegalStatusTypes}
                                queryKey={["legalStatusTypes", "active"]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Country */}
                      <FormField
                        control={form.control}
                        name="strCountryGUID"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              Country <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                selectedValue={field.value || ""}
                                onChange={field.onChange}
                                options={countries.map((country) => ({
                                  label: country.strName,
                                  value: country.strCountryGUID,
                                }))}
                                placeholder="Select Country"
                                initialMessage="Select country"
                                isLoading={loadingCountries}
                                queryKey={["countries", "active"]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Currency */}
                      <FormField
                        control={form.control}
                        name="strCurrencyGUID"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              Currency <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <PreloadedSelect
                                selectedValue={field.value || ""}
                                onChange={field.onChange}
                                options={currencyTypes.map((currency) => ({
                                  label: currency.strName,
                                  value: currency.strCurrencyTypeGUID,
                                }))}
                                placeholder="Select Currency"
                                initialMessage="Select currency"
                                isLoading={loadingCurrencyTypes}
                                queryKey={["currencyTypes", "active"]}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tax Applied Toggle */}
                      <FormField
                        control={form.control}
                        name="bolIsTaxApplied"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-3 rounded-lg p-4 border border-border-color/50">
                            <div className="flex-1">
                              <FormLabel className="text-base mb-0">
                                Tax Applied
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                                disabled={isSaving}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator className="my-6 dark:bg-gray-700 bg-gray-200" />

                    {/* Year Information Section - Only shown when creating a new group */}
                    <h3 className="text-lg font-medium mb-4">
                      Year Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <FormField
                        control={form.control}
                        name="dtStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Start Date <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={field.onChange}
                                disabled={isSaving}
                                placeholder="Select start date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dtEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              End Date <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={field.onChange}
                                disabled={isSaving}
                                placeholder="Select end date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="strYearName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Year Name{" "}
                              <span className="text-gray-400">
                                (Auto-generated)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Select start and end dates"
                                {...field}
                                value={field.value || ""}
                                disabled={true}
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("bolIsTaxApplied") && (
                      <>
                        <Separator className="my-6 dark:bg-gray-700 bg-gray-200" />

                        {/* Tax Configuration Section - Only shown when creating a new group */}
                        <div
                          className="flex items-center justify-between cursor-pointer py-2 hover:bg-muted/50 px-2 rounded-md transition-colors"
                          onClick={() => setShowTaxConfig(!showTaxConfig)}
                        >
                          <h3 className="text-lg font-medium">
                            Tax Configuration (Optional)
                          </h3>
                          <ChevronDown
                            className={`h-5 w-5 transition-transform ${
                              showTaxConfig ? "transform rotate-180" : ""
                            }`}
                          />
                        </div>

                        {showTaxConfig && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            {/* Tax Type */}
                            <FormField
                              control={form.control}
                              name="strTaxTypeGUID"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tax Type</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={
                                        selectedTaxType
                                          ? availableTaxTypes.find(
                                              (t) => t.value === selectedTaxType
                                            )?.label || selectedTaxType
                                          : ""
                                      }
                                      placeholder={
                                        availableTaxTypes.length === 0
                                          ? "Select country first"
                                          : "Tax type based on country"
                                      }
                                      disabled={true}
                                    />
                                  </FormControl>
                                  {availableTaxTypes.length === 0 &&
                                    selectedCountryGUID && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        No tax types configured for selected
                                        country
                                      </p>
                                    )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {selectedTaxTypeCode && (
                              <FormField
                                control={form.control}
                                name="strTaxRegNo"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      {selectedTaxTypeCode === "GST" &&
                                        "GST Registration Number"}
                                      {selectedTaxTypeCode === "VAT" &&
                                        "VAT Registration Number"}
                                      {selectedTaxTypeCode === "SALES_TAX" &&
                                        "Sales Tax License Number"}
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={
                                          selectedTaxTypeCode === "GST"
                                            ? "Enter GST number"
                                            : selectedTaxTypeCode === "VAT"
                                              ? "Enter VAT number"
                                              : "Enter sales tax license number"
                                        }
                                        {...field}
                                        value={field.value || ""}
                                        disabled={isSaving}
                                        maxLength={50}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            {/* PAN */}
                            <FormField
                              control={form.control}
                              name="strPAN"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PAN</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Enter PAN"
                                      disabled={isSaving}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* TAN */}
                            <FormField
                              control={form.control}
                              name="strTAN"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>TAN</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={field.value || ""}
                                      placeholder="Enter TAN"
                                      disabled={isSaving}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* CIN */}
                            <FormField
                              control={form.control}
                              name="strCIN"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CIN</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={field.value || ""}
                                      placeholder="Enter CIN"
                                      disabled={isSaving}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* State */}
                            <FormField
                              control={form.control}
                              name="strStateGUID"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>State</FormLabel>
                                  <FormControl>
                                    <PreloadedSelect
                                      selectedValue={field.value || ""}
                                      onChange={field.onChange}
                                      options={states.map((state) => ({
                                        label: state.strName,
                                        value: state.strStateGUID,
                                      }))}
                                      placeholder="Select State"
                                      initialMessage="Select country first"
                                      isLoading={loadingStates}
                                      disabled={!selectedCountryGUID}
                                      queryKey={[
                                        "states",
                                        "byCountry",
                                        selectedCountryGUID || "",
                                      ]}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Registration Date */}
                            <FormField
                              control={form.control}
                              name="dtRegistrationDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Registration Date</FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      value={
                                        field.value
                                          ? new Date(field.value)
                                          : undefined
                                      }
                                      onChange={field.onChange}
                                      placeholder="Select registration date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Country-Specific Tax Configuration */}
                            <TaxConfigurationSection
                              form={form}
                              isSaving={isSaving}
                              taxType={selectedTaxTypeCode}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Buttons moved to CardFooter */}
              </CardContent>
              <CardFooter className="border-t px-6 py-4 bg-muted/20">
                <div className="flex w-full justify-between">
                  <div>
                    {isEditMode && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isCreating || isUpdating || isDeleting}
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
                  </div>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>

        <GroupModulesList
          groupId={
            isGroupSaved && savedGroupId
              ? savedGroupId
              : id !== "new" && id
                ? id
                : ""
          }
          onAdd={() => {
            setSelectedGroupModule(undefined);
            setShowModuleModal(true);
          }}
          onEdit={(groupModule) => {
            setSelectedGroupModule(groupModule);
            setShowModuleModal(true);
          }}
        />
      </CustomContainer>

      {/* Group Module Modal - Render when in edit mode or after a new group is saved */}
      {(isEditMode || isGroupSaved) && showModuleModal && (
        <GroupModuleModal
          isOpen={showModuleModal}
          onClose={() => {
            setShowModuleModal(false);
            setSelectedGroupModule(undefined);
          }}
          groupId={savedGroupId || id || ""}
          groupModule={selectedGroupModule}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Group Deletion"
        description="Are you sure you want to delete this group? This action cannot be undone."
        confirmLabel="Delete Group"
        isLoading={isDeleting}
      />
    </>
  );
};

export default GroupForm;
