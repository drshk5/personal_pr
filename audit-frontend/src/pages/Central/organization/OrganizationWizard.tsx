import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import type { OrganizationFormValues } from "@/validations/central/organization";
import type {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from "@/types/central/organization";

import { organizationSchema } from "@/validations/central/organization";

import { useActiveIndustries } from "@/hooks/api/central/use-industries";
import { useActiveLegalStatusTypes } from "@/hooks/api/central/use-legal-status-types";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import {
  useActiveCountries,
  useFetchCurrencyByCountry,
} from "@/hooks/api/central/use-countries";
import { useStatesByCountry } from "@/hooks/api/central/use-states";
import { useActiveTaxTypes } from "@/hooks/api/central/use-tax-types";
import {
  useOrganization,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useParentOrganizations,
} from "@/hooks/api/central/use-organizations";
import { useMenuIcon } from "@/hooks";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ImageCropDialog } from "@/components/modals/ImageCropDialog";
import { FormStepper, FormStepperFooter } from "@/components/ui/form-stepper";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import { Step1MainDetails } from "@/pages/Central/organization/wizard/Step1MainDetails";
import { Step2YearInformation } from "@/pages/Central/organization/wizard/Step2YearInformation";
import { Step3TaxConfiguration } from "@/pages/Central/organization/wizard/Step3TaxConfiguration";
import { Step3BillingShipping } from "@/pages/Central/organization/wizard/Step3BillingShipping";
import { Step4OtherInformation } from "@/pages/Central/organization/wizard/Step4OtherInformation";
import { Step5ReviewSummary } from "@/pages/Central/organization/wizard/Step5ReviewSummary";

const OrganizationWizard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isOrganizationSaved, setIsOrganizationSaved] = useState(false);

  // Logo state
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Tax state
  const [selectedTaxType, setSelectedTaxType] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<
    string | undefined
  >();

  // Billing & Shipping states
  const [selectedCountryId_billing, setSelectedCountryId_billing] = useState<
    string | undefined
  >();
  const [selectedCountryId_shipping, setSelectedCountryId_shipping] = useState<
    string | undefined
  >();
  const [selectedStateId_taxConfig, setSelectedStateId_taxConfig] = useState<
    string | undefined
  >();

  // Data hooks
  const { data: parentOrganizations = [], isLoading: loadingOrganizations } =
    useParentOrganizations(
      id !== "new" ? id! : "00000000-0000-0000-0000-000000000000",
      undefined
    );

  const { data: industries = [], isLoading: loadingIndustries } =
    useActiveIndustries();
  const { data: legalStatusTypes = [], isLoading: loadingLegalStatus } =
    useActiveLegalStatusTypes();
  const { data: currencyTypes = [], isLoading: loadingCurrencyTypes } =
    useActiveCurrencyTypes();
  const { data: countries = [], isLoading: loadingCountries } =
    useActiveCountries();
  const { data: states = [], isLoading: loadingStates } =
    useStatesByCountry(selectedCountryId);
  const { data: taxTypeData } = useActiveTaxTypes(undefined, selectedCountryId);

  const { data: organizationData, isLoading: isLoadingOrganization } =
    useOrganization(id && id !== "new" ? id : undefined);

  const { mutate: createOrganization, isPending: isCreating } =
    useCreateOrganization();
  const { mutate: updateOrganization, isPending: isUpdating } =
    useUpdateOrganization();
  const { mutate: deleteOrganization, isPending: isDeleting } =
    useDeleteOrganization();

  const isSaving = isCreating || isUpdating;
  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      strOrganizationName: "",
      strDescription: "",
      strPAN: "",
      strTAN: "",
      strCIN: "",
      strParentOrganizationGUID: "",
      bolIsActive: true,
      bolIsTaxApplied: false,
      strIndustryGUID: "",
      strUDFCode: "",
      strLegalStatusTypeGUID: "",
      strCurrencyTypeGUID: "",
      dtClientAcquiredDate: undefined,
      strLogo: "",
      strCountryGUID: "",
      strTaxTypeGUID: "",
      strTaxRegNo: "",
      strStateGUID: "",
      dtRegistrationDate: undefined,
      jsonTaxSettings: "",
      gstNumber: "",
      eInvoiceEnabled: false,
      compositionScheme: false,
      gstinVerificationRequired: true,
      printHSNCode: true,
      vatNumber: "",
      vatScheme: "Standard" as const,
      mtdEnabled: true,
      accountingBasis: "Accrual" as const,
      flatRatePercentage: null,
      primaryState: "",
      taxLicenseNumber: "",
      nexusStates: [],
      economicNexusEnabled: true,
      marketplaceFacilitator: false,
      showTaxBreakdownOnInvoice: true,
      // Billing address
      strAttention_billing: "",
      strCountryGUID_billing: "",
      strAddress_billing: "",
      strStateGUID_billing: "",
      strCityGUID_billing: "",
      strPinCode_billing: "",
      strPhone_billing: "",
      strFaxNumber_billing: "",
      // Shipping address
      strAttention_shipping: "",
      strCountryGUID_shipping: "",
      strAddress_shipping: "",
      strStateGUID_shipping: "",
      strCityGUID_shipping: "",
      strPinCode_shipping: "",
      strPhone_shipping: "",
      strFaxNumber_shipping: "",
    },
  });

  const selectedCountryGUID = form.watch("strCountryGUID");

  React.useEffect(() => {
    setSelectedCountryId(selectedCountryGUID || undefined);
  }, [selectedCountryGUID]);

  const { data: currencyByCountry } = useFetchCurrencyByCountry(
    !isEditMode ? selectedCountryGUID || undefined : undefined
  );

  React.useEffect(() => {
    if (!isEditMode && currencyByCountry?.strCurrencyTypeGUID) {
      form.setValue(
        "strCurrencyTypeGUID",
        currencyByCountry.strCurrencyTypeGUID
      );
    }
  }, [currencyByCountry, form, isEditMode]);

  const taxType = React.useMemo(() => {
    if (!taxTypeData || Array.isArray(taxTypeData)) return null;
    return taxTypeData;
  }, [taxTypeData]);

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

  // Watch bolIsTaxApplied and clear tax data when disabled
  const isTaxConfigRequiredWatch = form.watch("bolIsTaxApplied");
  React.useEffect(() => {
    if (isTaxConfigRequiredWatch === false) {
      // Clear all tax-related fields
      form.setValue("strPAN", "");
      form.setValue("strTAN", "");
      form.setValue("strCIN", "");
      form.setValue("strTaxTypeGUID", "");
      form.setValue("strTaxRegNo", "");
      form.setValue("strStateGUID", "");
      form.setValue("dtRegistrationDate", undefined);
      form.setValue("jsonTaxSettings", "");
      form.setValue("gstNumber", "");
      form.setValue("eInvoiceEnabled", false);
      form.setValue("compositionScheme", false);
      form.setValue("gstinVerificationRequired", true);
      form.setValue("printHSNCode", true);
      form.setValue("vatNumber", "");
      form.setValue("vatScheme", "Standard" as const);
      form.setValue("mtdEnabled", true);
      form.setValue("accountingBasis", "Accrual" as const);
      form.setValue("flatRatePercentage", null);
      form.setValue("primaryState", "");
      form.setValue("taxLicenseNumber", "");
      form.setValue("nexusStates", []);
      form.setValue("economicNexusEnabled", true);
      form.setValue("marketplaceFacilitator", false);
      form.setValue("showTaxBreakdownOnInvoice", true);
      setSelectedTaxType(null);
      setSelectedStateId_taxConfig(undefined);
    }
  }, [isTaxConfigRequiredWatch, form]);

  // Watch billing and shipping country changes
  const selectedCountryGUID_billing = form.watch("strCountryGUID_billing");
  const selectedCountryGUID_shipping = form.watch("strCountryGUID_shipping");

  React.useEffect(() => {
    setSelectedCountryId_billing(selectedCountryGUID_billing || undefined);
  }, [selectedCountryGUID_billing]);

  React.useEffect(() => {
    setSelectedCountryId_shipping(selectedCountryGUID_shipping || undefined);
  }, [selectedCountryGUID_shipping]);

  // Load organization data
  useEffect(() => {
    if (organizationData && isEditMode && id && id !== "new") {
      form.reset({
        strOrganizationName: organizationData.strOrganizationName || "",
        strDescription: organizationData.strDescription || "",
        strPAN: organizationData.strPAN || "",
        strTAN: organizationData.strTAN || "",
        strCIN: organizationData.strCIN || "",
        strParentOrganizationGUID:
          organizationData.strParentOrganizationGUID || "",
        bolIsActive: organizationData.bolIsActive ?? true,
        bolIsTaxApplied: organizationData.bolIsTaxApplied ?? false,
        strIndustryGUID: organizationData.strIndustryGUID || "",
        strUDFCode: organizationData.strUDFCode || "",
        strLegalStatusTypeGUID: organizationData.strLegalStatusTypeGUID || "",
        strCurrencyTypeGUID: organizationData.strCurrencyTypeGUID || "",
        dtClientAcquiredDate: organizationData.dtClientAcquiredDate
          ? new Date(organizationData.dtClientAcquiredDate)
          : undefined,
        strLogo: organizationData.strLogo || "",
        strCountryGUID: organizationData.strCountryGUID || "",
        strTaxTypeGUID: organizationData.strTaxTypeGUID || "",
        strTaxRegNo: organizationData.strTaxRegNo || "",
        strStateGUID: organizationData.strStateGUID || "",
        dtRegistrationDate: organizationData.dtRegistrationDate
          ? new Date(organizationData.dtRegistrationDate)
          : undefined,
        jsonTaxSettings: organizationData.jsonTaxSettings || "",
        gstNumber: "",
        eInvoiceEnabled: false,
        compositionScheme: false,
        gstinVerificationRequired: true,
        printHSNCode: true,
        vatNumber: "",
        vatScheme: "Standard" as const,
        mtdEnabled: true,
        accountingBasis: "Accrual" as const,
        flatRatePercentage: null,
        primaryState: "",
        taxLicenseNumber: "",
        nexusStates: [],
        economicNexusEnabled: true,
        marketplaceFacilitator: false,
        showTaxBreakdownOnInvoice: true,
        // Billing address
        strAttention_billing: organizationData.strAttention_billing || "",
        strCountryGUID_billing: organizationData.strCountryGUID_billing || "",
        strAddress_billing: organizationData.strAddress_billing || "",
        strStateGUID_billing: organizationData.strStateGUID_billing || "",
        strCityGUID_billing: organizationData.strCityGUID_billing || "",
        strPinCode_billing: organizationData.strPinCode_billing || "",
        strPhone_billing: organizationData.strPhone_billing || "",
        strFaxNumber_billing: organizationData.strFaxNumber_billing || "",
        // Shipping address
        strAttention_shipping: organizationData.strAttention_shipping || "",
        strCountryGUID_shipping: organizationData.strCountryGUID_shipping || "",
        strAddress_shipping: organizationData.strAddress_shipping || "",
        strStateGUID_shipping: organizationData.strStateGUID_shipping || "",
        strCityGUID_shipping: organizationData.strCityGUID_shipping || "",
        strPinCode_shipping: organizationData.strPinCode_shipping || "",
        strPhone_shipping: organizationData.strPhone_shipping || "",
        strFaxNumber_shipping: organizationData.strFaxNumber_shipping || "",
      });

      if (organizationData.strLogo) {
        setPreviewUrl(organizationData.strLogo);
      }
    }
  }, [organizationData, form, isEditMode, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCropperOpen(true);
    }
  };

  const handleCroppedImage = (croppedImage: string) => {
    setPreviewUrl(croppedImage);
    fetch(croppedImage)
      .then((res) => res.blob())
      .then((blob) => {
        setLogoFile(new File([blob], "logo.png", { type: "image/png" }));
        setCropperOpen(false);
      });
  };

  const removeFile = () => {
    setLogoFile(undefined);
    setPreviewUrl(undefined);
    setSelectedFile(null);
    form.setValue("strLogo", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = (data: OrganizationFormValues) => {
    const processedData = { ...data };

    if (!isEditMode) {
      if (logoFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          processedData.strLogo = reader.result as string;
          submitForm(processedData);
        };
        reader.readAsDataURL(logoFile);
        return;
      }
    } else if (logoFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processedData.strLogo = reader.result as string;
        submitForm(processedData);
      };
      reader.readAsDataURL(logoFile);
      return;
    }

    submitForm(processedData);
  };

  const submitForm = (processedData: OrganizationFormValues) => {
    if (processedData.strParentOrganizationGUID === "none") {
      processedData.strParentOrganizationGUID = "";
    }

    if (processedData.dtClientAcquiredDate instanceof Date) {
      processedData.dtClientAcquiredDate = processedData.dtClientAcquiredDate
        .toISOString()
        .split("T")[0];
    } else if (
      processedData.dtClientAcquiredDate === "" ||
      processedData.dtClientAcquiredDate === undefined ||
      processedData.dtClientAcquiredDate === null
    ) {
      processedData.dtClientAcquiredDate = null as unknown as string | null;
    }

    let jsonTaxSettings: string | null = null;
    const selectedTaxTypeCode =
      selectedTaxType && taxType && taxType.strTaxTypeGUID === selectedTaxType
        ? taxType.strTaxTypeCode?.toUpperCase()
        : null;

    if (selectedTaxTypeCode) {
      if (selectedTaxTypeCode.startsWith("GST")) {
        jsonTaxSettings = JSON.stringify({
          type: "GST",
          gstNumber: processedData.gstNumber,
          eInvoiceEnabled: processedData.eInvoiceEnabled,
          compositionScheme: processedData.compositionScheme,
          gstinVerificationRequired: processedData.gstinVerificationRequired,
          printHSNCode: processedData.printHSNCode,
        });
      } else if (selectedTaxTypeCode.startsWith("VAT")) {
        jsonTaxSettings = JSON.stringify({
          type: "VAT",
          vatNumber: processedData.vatNumber,
          vatScheme: processedData.vatScheme,
          mtdEnabled: processedData.mtdEnabled,
          accountingBasis: processedData.accountingBasis,
          flatRatePercentage: processedData.flatRatePercentage,
        });
      } else if (selectedTaxTypeCode.startsWith("SALES_TAX")) {
        jsonTaxSettings = JSON.stringify({
          type: "SALES_TAX",
          primaryState: processedData.primaryState,
          taxLicenseNumber: processedData.taxLicenseNumber,
          nexusStates: processedData.nexusStates,
          economicNexusEnabled: processedData.economicNexusEnabled,
          marketplaceFacilitator: processedData.marketplaceFacilitator,
          showTaxBreakdownOnInvoice: processedData.showTaxBreakdownOnInvoice,
        });
      }
    }

    processedData.jsonTaxSettings = jsonTaxSettings || "";

    if (isEditMode && id) {
      const updateData = {
        id,
        data: processedData as UpdateOrganizationDto,
      };

      updateOrganization(updateData, {
        onSuccess: () => {
          navigate(`/organization`);
        },
      });
    } else {
      const createData: CreateOrganizationDto =
        processedData as CreateOrganizationDto;

      createOrganization(createData, {
        onSuccess: () => {
          setIsOrganizationSaved(true);
          navigate(`/organization`);
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;

    deleteOrganization(id, {
      onSuccess: () => {
        navigate(`/organization`);
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const isLoading =
    isLoadingOrganization ||
    loadingIndustries ||
    loadingLegalStatus ||
    loadingOrganizations ||
    loadingCurrencyTypes ||
    loadingCountries;

  const HeaderIcon = useMenuIcon("organization_form", Building);

  // Watch tax config required field
  const isTaxConfigRequired = form.watch("bolIsTaxApplied") ?? false;

  // Build dynamic wizard steps based on tax config requirement
  const wizardSteps = React.useMemo(() => {
    const baseSteps = [
      { id: "main", label: "Main Details", description: "Organization basics" },
    ];

    // Only show year info in create mode (not in edit mode)
    if (!isEditMode) {
      baseSteps.push({
        id: "year",
        label: "Year Info",
        description: "Financial year",
      });
    }

    if (isTaxConfigRequired) {
      baseSteps.push({
        id: "tax",
        label: "Tax Config",
        description: "Tax settings",
      });
    }

    baseSteps.push(
      {
        id: "billing",
        label: "Address Info",
        description: "Billing & Shipping",
      },
      { id: "other", label: "Other Info", description: "Organization details" }
    );
    baseSteps.push({
      id: "review",
      label: "Review",
      description: "Verify details",
    });

    return baseSteps;
  }, [isTaxConfigRequired, isEditMode]);

  const canNavigateNext = currentStep < wizardSteps.length - 1;
  const canNavigatePrevious = currentStep > 0;

  // Calculate step indices dynamically based on tax config requirement
  const getStepIndex = (stepId: string) => {
    return wizardSteps.findIndex((step) => step.id === stepId);
  };

  const taxStepIndex = getStepIndex("tax");
  const billingStepIndex = getStepIndex("billing");
  const otherStepIndex = getStepIndex("other");
  const reviewStepIndex = getStepIndex("review");

  // Validation for each step
  const validateStep = async () => {
    const isTaxConfigRequired = form.getValues("bolIsTaxApplied") ?? false;
    const currentStepId = wizardSteps[currentStep]?.id;

    // Skip year validation in edit mode (year step is not shown)
    if (isEditMode && currentStepId === "year") {
      return true;
    }

    const fieldsToValidate: Record<string, string[]> = {
      // Step 1: Main Details
      main: [
        "strOrganizationName",
        "strCountryGUID",
        "strIndustryGUID",
        "strUDFCode",
        "strLegalStatusTypeGUID",
        "strCurrencyTypeGUID",
      ],
      // Step 2: Year Information (only for new organizations, not in edit mode)
      year: isEditMode ? [] : ["dtStartDate", "dtEndDate", "strYearName"],
      // Step 3: Tax Configuration
      tax: isTaxConfigRequired
        ? ["strCountryGUID", "strTaxTypeGUID", "strTaxRegNo", "strStateGUID"]
        : ["strCountryGUID", "strTaxTypeGUID"],
      // Step 4: Billing & Shipping - no required fields
      billing: [],
      // Step 5: Other Information
      other: [],
      // Step 6: Review Summary
      review: [],
    };

    const currentFields = fieldsToValidate[currentStepId || ""] || [];

    if (currentFields.length > 0) {
      const result = await form.trigger(currentFields as never);
      return result;
    }

    // If no fields to validate, allow navigation
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setCurrentStep(currentStep + 1);
    } else {
      console.error("Please fill in all required fields");
    }
  };

  return (
    <>
      <CustomContainer className="flex flex-col min-h-screen">
        <PageHeader
          title={
            isEditMode
              ? "Edit Organization/Company"
              : "Create Organization/Company"
          }
          description="Manage organization information with our guided wizard"
          icon={HeaderIcon}
          actions={
            <Button variant="outline" onClick={() => navigate("/organization")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          }
        />

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit, (errors) => {
                // Group and show validation errors
                const errorFields = Object.entries(errors);
                if (errorFields.length > 0) {
                  const errorMessages: string[] = [];
                  errorFields.forEach(([field, error]) => {
                    if (
                      error &&
                      typeof error === "object" &&
                      "message" in error
                    ) {
                      errorMessages.push(`${field}: ${error.message}`);
                    }
                  });

                  if (errorMessages.length > 0) {
                    toast.error("Please fix validation errors", {
                      description: errorMessages.join("\n"),
                    });
                  }
                }
              })(e);
            }}
            className="flex flex-col flex-1"
          >
            <div>
              {/* Stepper */}
              <FormStepper
                steps={wizardSteps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                isStepComplete={(step) => {
                  if (step === 0) return form.formState.isValid;
                  return false;
                }}
              />

              <div className="space-y-0">
                {currentStep === 0 && (
                  <Step1MainDetails
                    form={form as UseFormReturn<OrganizationFormValues>}
                    isSaving={isSaving}
                    loadingCountries={loadingCountries}
                    loadingIndustries={loadingIndustries}
                    loadingLegalStatus={loadingLegalStatus}
                    loadingCurrencyTypes={loadingCurrencyTypes}
                    countries={countries}
                    industries={industries}
                    legalStatusTypes={legalStatusTypes}
                    currencyTypes={currencyTypes}
                    isEditMode={isEditMode}
                    previewUrl={previewUrl}
                    logoFile={logoFile}
                    onFileChange={handleFileChange}
                    onRemoveFile={removeFile}
                    fileInputRef={fileInputRef}
                  />
                )}

                {currentStep === 1 && !isEditMode && (
                  <Step2YearInformation
                    form={form as UseFormReturn<OrganizationFormValues>}
                    isSaving={isSaving}
                    isEditMode={isEditMode}
                  />
                )}

                {isTaxConfigRequired &&
                  taxStepIndex !== -1 &&
                  ((currentStep === taxStepIndex && !isEditMode) ||
                    (currentStep === 1 && isEditMode)) && (
                    <Step3TaxConfiguration
                      form={form as UseFormReturn<OrganizationFormValues>}
                      isSaving={isSaving}
                      selectedCountryId={selectedCountryId}
                      selectedTaxType={selectedTaxType}
                      states={states}
                      loadingStates={loadingStates}
                      taxTypeData={taxTypeData}
                      onStateChange={(stateId) => {
                        setSelectedStateId_taxConfig(stateId);
                      }}
                    />
                  )}

                {billingStepIndex !== -1 &&
                  ((currentStep === billingStepIndex && !isEditMode) ||
                    (currentStep === (isTaxConfigRequired ? 2 : 1) &&
                      isEditMode)) && (
                    <Step3BillingShipping
                      form={form as UseFormReturn<OrganizationFormValues>}
                      isSaving={isSaving}
                      countries={countries}
                      states={states}
                      cities={[]}
                      loadingCountries={loadingCountries}
                      loadingStates={loadingStates}
                      loadingCities={false}
                      selectedCountryId_billing={selectedCountryId_billing}
                      selectedCountryId_shipping={selectedCountryId_shipping}
                      selectedStateId_taxConfig={selectedStateId_taxConfig}
                      onCountryChange_billing={(countryId) => {
                        setSelectedCountryId_billing(countryId);
                      }}
                      onCountryChange_shipping={(countryId) => {
                        setSelectedCountryId_shipping(countryId);
                      }}
                    />
                  )}

                {otherStepIndex !== -1 &&
                  ((currentStep === otherStepIndex && !isEditMode) ||
                    (currentStep === (isTaxConfigRequired ? 3 : 2) &&
                      isEditMode)) && (
                    <Step4OtherInformation
                      form={form as UseFormReturn<OrganizationFormValues>}
                      isSaving={isSaving}
                      isEditMode={isEditMode}
                      organizationId={id}
                      isOrganizationSaved={isOrganizationSaved || isEditMode}
                      parentOrganizations={parentOrganizations}
                      loadingOrganizations={loadingOrganizations}
                    />
                  )}

                {reviewStepIndex !== -1 && currentStep === reviewStepIndex && (
                  <Step5ReviewSummary
                    form={form as UseFormReturn<OrganizationFormValues>}
                    countries={countries}
                    states={states}
                    industries={industries}
                    legalStatusTypes={legalStatusTypes}
                    currencyTypes={currencyTypes}
                    parentOrganizations={parentOrganizations}
                    taxTypeData={taxTypeData}
                    selectedTaxType={selectedTaxType}
                    isTaxConfigRequired={isTaxConfigRequired}
                    previewUrl={previewUrl}
                  />
                )}
              </div>
            </div>

            {/* Footer (single layer like invoice) */}
            <div className=" sticky bottom-0">
              <FormStepperFooter
                currentStep={currentStep}
                totalSteps={wizardSteps.length}
                onNext={handleNext}
                onPrevious={() => setCurrentStep(currentStep - 1)}
                isLoading={isSaving || isLoading}
                canNavigateNext={canNavigateNext && !isSaving}
                canNavigatePrevious={canNavigatePrevious && !isSaving}
                nextLabel={
                  currentStep === wizardSteps.length - 2
                    ? "Review"
                    : "Next Step"
                }
                previousLabel="Previous"
                submitLabel={isEditMode ? "Update" : "Create"}
                showSubmit={currentStep === wizardSteps.length - 1}
                showDelete={isEditMode}
                onDelete={() => setShowDeleteConfirm(true)}
                isDeleting={isDeleting}
                className="bg-card px-4 sm:px-6 py-4 border-t border-border-color"
              />
            </div>
          </form>
        </Form>
      </CustomContainer>

      {/* Modals */}
      <ImageCropDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        file={selectedFile}
        title="Crop Organization Logo"
        description="Drag to adjust the cropping area for your organization logo"
        helperText="Adjust the circular crop to select your organization logo"
        onCrop={handleCroppedImage}
        fileInputRef={fileInputRef}
      />

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this organization? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
};

export default OrganizationWizard;
