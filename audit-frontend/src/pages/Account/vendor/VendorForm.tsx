import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  Save,
  Trash2,
  Twitter,
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  Plus,
  Info,
  ArrowDown,
  CircleHelp,
} from "lucide-react";

import {
  useVendor,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
} from "@/hooks/api/Account/use-vendors";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useBulkAssignDocuments } from "@/hooks/api/central/use-documents";
import { useActiveCountries } from "@/hooks/api/central/use-countries";
import { useStatesByCountry } from "@/hooks/api/central/use-states";
import { useCitiesByCountryAndState } from "@/hooks/api/central/use-cities";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import { Actions } from "@/lib/permissions";

import type { VendorCreate, VendorUpdate } from "@/types";
import type { CountrySimple } from "@/types/central/country";
import type { StateSimple } from "@/types/central/state";
import type { CitySimple } from "@/types/central/city";
import type { PartyContact } from "@/types/Account/party-contact";
import type { AttachmentFile } from "@/types/common";
import type { Document } from "@/types/central/document";

import {
  vendorSchema,
  type VendorFormData,
} from "@/validations/Account/vendor";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { WithPermission } from "@/components/ui/with-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { AttachmentManager } from "@/components/ui/attachments/AttachmentManager";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { PartyContactList } from "@/pages/Account/party/party-contact/PartyContactList";
import { PartyContactModal } from "@/pages/Account/party/party-contact/PartyContactModal";
import { PartyFormSkeleton } from "@/pages/Account/party/PartyFormSkeleton";

// Using schema-inferred form values alias for convenience
type VendorFormValues = VendorFormData;

const VendorForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const HeaderIcon = useMenuIcon("vendor_form", Users);

  const isEditMode = !!id && id !== "new";

  const { user } = useAuthContext();

  const [savedPartyId] = useState<string | undefined>(undefined);
  const [isPartySaved] = useState<boolean>(false);

  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [selectedContact, setSelectedContact] = useState<
    PartyContact | undefined
  >(undefined);

  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<AttachmentFile[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [dynamicSocialFields, setDynamicSocialFields] = useState<string[]>([]);
  const [showSocialDropdown, setShowSocialDropdown] = useState<boolean>(false);
  const [copyBillingAddress, setCopyBillingAddress] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    billingCountry: false,
    shippingCountry: false,
    billingState: false,
    shippingState: false,
    billingCity: false,
    shippingCity: false,
  });

  const shouldPrefetch = isEditMode;
  const countriesEnabled =
    dropdownOpen.billingCountry ||
    dropdownOpen.shippingCountry ||
    shouldPrefetch;
  const billingStatesEnabled = dropdownOpen.billingState || shouldPrefetch;
  const shippingStatesEnabled = dropdownOpen.shippingState || shouldPrefetch;
  const billingCitiesEnabled = dropdownOpen.billingCity || shouldPrefetch;
  const shippingCitiesEnabled = dropdownOpen.shippingCity || shouldPrefetch;

  const { data: currencyTypes, isLoading: isLoadingCurrencyTypes } =
    useActiveCurrencyTypes(undefined, true);
  const { data: countries = [], isLoading: isLoadingCountries } =
    useActiveCountries(undefined, { enabled: countriesEnabled });

  // Mirror PartyForm: do not pass generics to avoid resolver generic mismatch
  const form = useForm({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      strPartyType: "Vendor",
      strSalutation: "",
      strFirstName: "",
      strLastName: "",
      strCompanyName: "",
      strPartyName_Display: "",
      strUDFCode: "",
      strEmail: "",
      strPhoneNoWork: "",
      strPhoneNoPersonal: "",
      strPAN: "",
      strCurrencyTypeGUID: user?.strCurrencyTypeGUID || "",
      intPaymentTerms_inDays: null,
      strPartyLanguage: "",
      strTaxRegNo: "",
      strWebsiteURL: "",
      strDepartment: "",
      strDesignation: "",
      strTwitter: "",
      strSkype: "",
      strFacebook: "",
      strInstagram: "",
      dblIntrest_per: null,
      strRemarks: "",
      strAttention_billing: "",
      strCountryGUID_billing: "",
      strAddress_billing: "",
      strStateGUID_billing: "",
      strCityGUID_billing: "",
      strPinCode_billing: "",
      strPhone_billing: "",
      strFaxNumber_billing: "",
      strAttention_shipping: "",
      strCountryGUID_shipping: "",
      strAddress_shipping: "",
      strStateGUID_shipping: "",
      strCityGUID_shipping: "",
      strPinCode_shipping: "",
      strPhone_shipping: "",
      strFaxNumber_shipping: "",
    },
    mode: "onBlur",
  });

  // Watch address fields for dependent dropdowns
  const billingCountryGUID = form.watch("strCountryGUID_billing");
  const shippingCountryGUID = form.watch("strCountryGUID_shipping");
  const billingStateGUID = form.watch("strStateGUID_billing");
  const shippingStateGUID = form.watch("strStateGUID_shipping");

  // Load dependent data
  const { data: billingStates = [], isLoading: isLoadingBillingStates } =
    useStatesByCountry(billingCountryGUID || undefined, undefined, {
      enabled: billingStatesEnabled && !!billingCountryGUID,
    });
  const { data: shippingStates = [], isLoading: isLoadingShippingStates } =
    useStatesByCountry(shippingCountryGUID || undefined, undefined, {
      enabled: shippingStatesEnabled && !!shippingCountryGUID,
    });
  const { data: billingCities = [], isLoading: isLoadingBillingCities } =
    useCitiesByCountryAndState(
      billingCountryGUID || undefined,
      billingStateGUID || undefined,
      undefined,
      {
        enabled:
          billingCitiesEnabled && !!billingCountryGUID && !!billingStateGUID,
      }
    );
  const { data: shippingCities = [], isLoading: isLoadingShippingCities } =
    useCitiesByCountryAndState(
      shippingCountryGUID || undefined,
      shippingStateGUID || undefined,
      undefined,
      {
        enabled:
          shippingCitiesEnabled && !!shippingCountryGUID && !!shippingStateGUID,
      }
    );

  const {
    data: vendor,
    isFetching: isFetchingVendor,
    error: vendorError,
  } = useVendor(isEditMode ? id : undefined);

  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();
  const bulkAssignDocumentsMutation = useBulkAssignDocuments();

  useEffect(() => {
    if (vendor) {
      const resetValues: VendorFormValues = {
        strPartyType: "Vendor",
        strSalutation: vendor.strSalutation || "",
        strFirstName: vendor.strFirstName || "",
        strLastName: vendor.strLastName || "",
        strCompanyName: vendor.strCompanyName || "",
        strPartyName_Display: vendor.strPartyName_Display || "",
        strUDFCode: vendor.strUDFCode || "",
        strEmail: vendor.strEmail || "",
        strPhoneNoWork: vendor.strPhoneNoWork || "",
        strPhoneNoPersonal: vendor.strPhoneNoPersonal || "",
        strPAN: vendor.strPAN || "",
        strCurrencyTypeGUID: vendor.strCurrencyTypeGUID || "",
        intPaymentTerms_inDays: vendor.intPaymentTerms_inDays || null,
        strPartyLanguage: vendor.strPartyLanguage || "",
        strTaxRegNo: vendor.strTaxRegNo || "",
        strWebsiteURL: vendor.strWebsiteURL || "",
        strDepartment: vendor.strDepartment || "",
        strDesignation: vendor.strDesignation || "",
        strTwitter: vendor.strTwitter || "",
        strSkype: vendor.strSkype || "",
        strFacebook: vendor.strFacebook || "",
        strInstagram: vendor.strInstagram || "",
        dblIntrest_per: vendor.dblIntrest_per || null,
        strRemarks: vendor.strRemarks || "",
        strAttention_billing: vendor.strAttention_billing || "",
        strCountryGUID_billing: vendor.strCountryGUID_billing || "",
        strAddress_billing: vendor.strAddress_billing || "",
        strStateGUID_billing: vendor.strStateGUID_billing || "",
        strCityGUID_billing: vendor.strCityGUID_billing || "",
        strPinCode_billing: vendor.strPinCode_billing || "",
        strPhone_billing: vendor.strPhone_billing || "",
        strFaxNumber_billing: vendor.strFaxNumber_billing || "",
        strAttention_shipping: vendor.strAttention_shipping || "",
        strCountryGUID_shipping: vendor.strCountryGUID_shipping || "",
        strAddress_shipping: vendor.strAddress_shipping || "",
        strStateGUID_shipping: vendor.strStateGUID_shipping || "",
        strCityGUID_shipping: vendor.strCityGUID_shipping || "",
        strPinCode_shipping: vendor.strPinCode_shipping || "",
        strPhone_shipping: vendor.strPhone_shipping || "",
        strFaxNumber_shipping: vendor.strFaxNumber_shipping || "",
      };

      form.reset(resetValues, {
        keepDirty: false,
        keepErrors: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      });

      form.setValue("strPartyType", "Vendor", {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });

      form.setValue("strCurrencyTypeGUID", vendor.strCurrencyTypeGUID || "", {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });

      form.setValue("strPartyName_Display", vendor.strPartyName_Display || "", {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
    if (vendor?.strFiles) {
      setExistingFiles(
        (vendor.strFiles || []).map((file) => ({
          strDocumentAssociationGUID: file.strDocumentAssociationGUID || "",
          strFileName: file.strFileName || "Unknown",
          strFileType: file.strFileType || "",
          strFileSize: file.strFileSize || "",
          strFilePath: file.strFilePath || undefined,
        }))
      );
    }
  }, [vendor, form]);

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

  const salutation = form.watch("strSalutation");
  const firstName = form.watch("strFirstName");
  const lastName = form.watch("strLastName");
  const companyName = form.watch("strCompanyName");
  const currentDisplayName = form.watch("strPartyName_Display");

  const getDisplayNameSuggestions = () => {
    const suggestions: string[] = [];
    if (currentDisplayName && currentDisplayName.trim().length > 0) {
      suggestions.push(currentDisplayName);
    }
    if (salutation && firstName && lastName) {
      suggestions.push(`${salutation} ${firstName} ${lastName}`);
    }
    if (firstName && lastName) {
      suggestions.push(`${firstName} ${lastName}`);
      suggestions.push(`${lastName}, ${firstName}`);
    }
    if (companyName) {
      suggestions.push(companyName);
    }
    if (firstName && companyName) {
      suggestions.push(`${firstName} ${companyName}`);
    }
    return [...new Set(suggestions)].filter((s) => s.trim().length > 0);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSocialDropdown && !target.closest(".social-dropdown-container")) {
        setShowSocialDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSocialDropdown]);

  const handleCopyBillingAddress = (checked: boolean) => {
    setCopyBillingAddress(checked);
    if (checked) {
      form.setValue(
        "strAttention_shipping",
        form.getValues("strAttention_billing")
      );
      form.setValue(
        "strCountryGUID_shipping",
        form.getValues("strCountryGUID_billing")
      );
      form.setValue(
        "strStateGUID_shipping",
        form.getValues("strStateGUID_billing")
      );
      form.setValue(
        "strCityGUID_shipping",
        form.getValues("strCityGUID_billing")
      );
      form.setValue(
        "strAddress_shipping",
        form.getValues("strAddress_billing")
      );
      form.setValue(
        "strPinCode_shipping",
        form.getValues("strPinCode_billing")
      );
      form.setValue("strPhone_shipping", form.getValues("strPhone_billing"));
      form.setValue(
        "strFaxNumber_shipping",
        form.getValues("strFaxNumber_billing")
      );
    }
  };

  const onSubmit = async (values: VendorFormValues) => {
    if (isEditMode && id) {
      const vendorUpdate: VendorUpdate = {
        strPartyType: "Vendor",
        strSalutation: values.strSalutation || null,
        strFirstName: values.strFirstName,
        strLastName: values.strLastName || null,
        strCompanyName: values.strCompanyName || null,
        strPartyName_Display: values.strPartyName_Display,
        strUDFCode: values.strUDFCode,
        strEmail: values.strEmail || null,
        strPhoneNoWork: values.strPhoneNoWork || null,
        strPhoneNoPersonal: values.strPhoneNoPersonal || null,
        strPAN: values.strPAN || null,
        strCurrencyTypeGUID: values.strCurrencyTypeGUID || null,
        intPaymentTerms_inDays: values.intPaymentTerms_inDays || null,
        strPartyLanguage: values.strPartyLanguage || null,
        strTaxRegNo: values.strTaxRegNo || null,
        strWebsiteURL: values.strWebsiteURL || null,
        strDepartment: values.strDepartment || null,
        strDesignation: values.strDesignation || null,
        strTwitter: values.strTwitter || null,
        strSkype: values.strSkype || null,
        strFacebook: values.strFacebook || null,
        strInstagram: values.strInstagram || null,
        strRemarks: values.strRemarks || null,
        strAttention_billing: values.strAttention_billing || null,
        strCountryGUID_billing: values.strCountryGUID_billing || null,
        strAddress_billing: values.strAddress_billing || null,
        strStateGUID_billing: values.strStateGUID_billing || null,
        strCityGUID_billing: values.strCityGUID_billing || null,
        strPinCode_billing: values.strPinCode_billing || null,
        strPhone_billing: values.strPhone_billing || null,
        strFaxNumber_billing: values.strFaxNumber_billing || null,
        strAttention_shipping: values.strAttention_shipping || null,
        strCountryGUID_shipping: values.strCountryGUID_shipping || null,
        strAddress_shipping: values.strAddress_shipping || null,
        strStateGUID_shipping: values.strStateGUID_shipping || null,
        strCityGUID_shipping: values.strCityGUID_shipping || null,
        strPinCode_shipping: values.strPinCode_shipping || null,
        strPhone_shipping: values.strPhone_shipping || null,
        strFaxNumber_shipping: values.strFaxNumber_shipping || null,
      };
      await updateVendor.mutateAsync({
        id,
        data: vendorUpdate,
        files: attachments,
        strRemoveDocumentAssociationGUIDs: removedDocumentIds,
      });
      setAttachments([]);
      setRemovedDocumentIds([]);

      if (selectedDocuments.length > 0) {
        const selectedDocumentGUIDs = selectedDocuments.map(
          (doc) => doc.strDocumentGUID
        );
        await bulkAssignDocumentsMutation.mutateAsync({
          strDocumentGUIDs: selectedDocumentGUIDs,
          strEntityGUID: id,
          strEntityName: "Party",
          strEntityValue: values.strPartyName_Display,
        });
        setSelectedDocuments([]);
      }

      navigate("/vendor");
    } else {
      const vendorCreate: VendorCreate = {
        strPartyType: "Vendor",
        strSalutation: values.strSalutation || null,
        strFirstName: values.strFirstName,
        strLastName: values.strLastName || null,
        strCompanyName: values.strCompanyName || null,
        strPartyName_Display: values.strPartyName_Display,
        strUDFCode: values.strUDFCode,
        strEmail: values.strEmail || null,
        strPhoneNoWork: values.strPhoneNoWork || null,
        strPhoneNoPersonal: values.strPhoneNoPersonal || null,
        strPAN: values.strPAN || null,
        strCurrencyTypeGUID: values.strCurrencyTypeGUID || null,
        intPaymentTerms_inDays: values.intPaymentTerms_inDays || null,
        strPartyLanguage: values.strPartyLanguage || null,
        strTaxRegNo: values.strTaxRegNo || null,
        strWebsiteURL: values.strWebsiteURL || null,
        strDepartment: values.strDepartment || null,
        strDesignation: values.strDesignation || null,
        strTwitter: values.strTwitter || null,
        strSkype: values.strSkype || null,
        strFacebook: values.strFacebook || null,
        strInstagram: values.strInstagram || null,
        strRemarks: values.strRemarks || null,
        strAttention_billing: values.strAttention_billing || null,
        strCountryGUID_billing: values.strCountryGUID_billing || null,
        strAddress_billing: values.strAddress_billing || null,
        strStateGUID_billing: values.strStateGUID_billing || null,
        strCityGUID_billing: values.strCityGUID_billing || null,
        strPinCode_billing: values.strPinCode_billing || null,
        strPhone_billing: values.strPhone_billing || null,
        strFaxNumber_billing: values.strFaxNumber_billing || null,
        strAttention_shipping: values.strAttention_shipping || null,
        strCountryGUID_shipping: values.strCountryGUID_shipping || null,
        strAddress_shipping: values.strAddress_shipping || null,
        strStateGUID_shipping: values.strStateGUID_shipping || null,
        strCityGUID_shipping: values.strCityGUID_shipping || null,
        strPinCode_shipping: values.strPinCode_shipping || null,
        strPhone_shipping: values.strPhone_shipping || null,
        strFaxNumber_shipping: values.strFaxNumber_shipping || null,
      };

      const result = await createVendor.mutateAsync({
        data: vendorCreate,
        files: attachments,
      });
      setAttachments([]);
      setRemovedDocumentIds([]);

      if (result?.strPartyGUID) {
        if (selectedDocuments.length > 0) {
          const selectedDocumentGUIDs = selectedDocuments.map(
            (doc) => doc.strDocumentGUID
          );
          await bulkAssignDocumentsMutation.mutateAsync({
            strDocumentGUIDs: selectedDocumentGUIDs,
            strEntityGUID: result.strPartyGUID,
            strEntityName: "Party",
            strEntityValue:
              result.strPartyName_Display || values.strPartyName_Display,
          });
          setSelectedDocuments([]);
        }

        navigate(`/vendor/${result.strPartyGUID}`);
      } else {
        navigate("/vendor");
      }
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id) return;

    await deleteVendor.mutateAsync({ id });
    setShowDeleteConfirm(false);
    navigate("/vendor");
  };

  const handleAttachFromDocuments = (documents: Document[]) => {
    setSelectedDocuments((prev) => [...prev, ...documents]);
    toast.success(
      `${documents.length} document${documents.length > 1 ? "s" : ""} selected for attachment`
    );
  };

  const socialPlatforms = [
    { value: "strTwitter", label: "Twitter", icon: Twitter },
    { value: "strSkype", label: "Skype", icon: MessageCircle },
    { value: "strInstagram", label: "Instagram", icon: Instagram },
  ];

  const getAvailableSocialPlatforms = () => {
    const usedFields = dynamicSocialFields;
    return socialPlatforms.filter(
      (platform) => !usedFields.includes(platform.value)
    );
  };

  const handleAddSocialField = (fieldName: string) => {
    setDynamicSocialFields((prev) => [...prev, fieldName]);
    form.setValue(fieldName as keyof VendorFormValues, "");
    setShowSocialDropdown(false);
  };

  if (isFetchingVendor) {
    return (
      <CustomContainer>
        <div className="flex flex-col space-y-6">
          <PageHeader
            title={isEditMode ? "Edit Vendor" : "New Vendor"}
            description={
              isEditMode
                ? "Update vendor details"
                : "Create a new vendor in the system"
            }
            icon={HeaderIcon}
          />
          <PartyFormSkeleton />
        </div>
      </CustomContainer>
    );
  }

  if (
    isEditMode &&
    !isFetchingVendor &&
    (vendorError || (!vendor && !isFetchingVendor))
  ) {
    return <NotFound pageName="Vendor" />;
  }

  const isLoading = isFetchingVendor;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Vendor" : "Create Vendor"}
        description={
          isEditMode
            ? `Editing vendor ${vendor?.strPartyName_Display || ""}`
            : "Create a new vendor"
        }
        icon={HeaderIcon}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/vendor")}
            className="h-9 text-xs sm:text-sm"
            size="sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <PartyFormSkeleton />
      ) : (
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                onSubmit(data as VendorFormValues)
              )}
              className="space-y-6"
            >
              <Card>
                <CardContent className="p-6 pt-6">
                  <div className="flex flex-col gap-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">
                        General Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-4">
                        <div className="sm:col-span-1 lg:col-span-2">
                          <FormField
                            control={form.control}
                            name="strSalutation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Salutation</FormLabel>
                                <PreloadedSelect
                                  selectedValue={field.value || ""}
                                  onChange={field.onChange}
                                  isLoading={false}
                                  options={[
                                    { label: "Mr.", value: "Mr." },
                                    { label: "Mrs.", value: "Mrs." },
                                    { label: "Ms.", value: "Ms." },
                                    { label: "Miss", value: "Miss" },
                                    { label: "Dr.", value: "Dr." },
                                    { label: "Prof.", value: "Prof." },
                                  ]}
                                  placeholder="Select"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-3">
                          <FormField
                            control={form.control}
                            name="strFirstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  First Name{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter first name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-3">
                          <FormField
                            control={form.control}
                            name="strLastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter last name"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="sm:col-span-3 lg:col-span-4">
                          <FormField
                            control={form.control}
                            name="strCompanyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Company Name{" "}
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter company name"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strPartyName_Display"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                Display Name{" "}
                                <span className="text-destructive">*</span>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-muted-foreground hover:text-foreground transition-colors">
                                      <Info className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="w-64">
                                    <p className="whitespace-normal">
                                      This name will be displayed on all the
                                      transactions you create for this vendor.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              {(() => {
                                const selectedValue =
                                  field.value ||
                                  vendor?.strPartyName_Display ||
                                  "";
                                const suggestions = getDisplayNameSuggestions();
                                const optionSet = new Set<string>();
                                if (selectedValue) optionSet.add(selectedValue);
                                suggestions.forEach((item) => {
                                  if (item) optionSet.add(item);
                                });
                                const options = Array.from(optionSet);

                                return (
                                  <Select
                                    onValueChange={field.onChange}
                                    value={selectedValue}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select to add" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {options.map((suggestion, index) => (
                                        <SelectItem
                                          key={index}
                                          value={suggestion}
                                        >
                                          {suggestion}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );
                              })()}
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
                                Currency{" "}
                                <span className="text-destructive">*</span>
                              </FormLabel>
                              <PreloadedSelect
                                selectedValue={field.value || ""}
                                onChange={field.onChange}
                                isLoading={isLoadingCurrencyTypes}
                                options={
                                  currencyTypes?.map((curr) => ({
                                    label: curr.strName,
                                    value: curr.strCurrencyTypeGUID,
                                  })) || []
                                }
                                placeholder="Select currency"
                                queryKey={["currencyTypes", "active"]}
                                onOpenChange={(isOpen: boolean) =>
                                  setDropdownOpen((p) => ({
                                    ...p,
                                    currencies: isOpen,
                                  }))
                                }
                              />
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
                                  <span className="text-destructive">*</span>
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
                                    Short code for this account defined by the
                                    user. Must be 6 alphanumeric characters.
                                  </TooltipContent>
                                </Tooltip>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter 6-character alphanumeric Account Code"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="intPaymentTerms_inDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Terms (Days)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={0}
                                  placeholder="Enter payment terms"
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
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">
                        Contact Details
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strPhoneNoPersonal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal Contact Number</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  placeholder="Enter personal phone"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  defaultCountry="IN"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="strPhoneNoWork"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Contact Number</FormLabel>
                              <FormControl>
                                <PhoneInput
                                  placeholder="Enter work phone"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  defaultCountry="IN"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="strEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Email Address
                                <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter email address"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">
                        Other Details
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strPAN"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PAN Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter PAN"
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
                          name="strPartyLanguage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Language</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter language"
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
                          name="strTaxRegNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tax Information</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter tax registration number"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">
                        Social Details
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="strWebsiteURL"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <div className="absolute left-3 top-3 text-gray-500">
                                    <Globe size={16} />
                                  </div>
                                  <Input
                                    placeholder="Enter website URL"
                                    className="pl-9"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="strFacebook"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facebook</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <div className="absolute left-3 top-3 text-gray-500">
                                    <Facebook size={16} />
                                  </div>
                                  <Input
                                    placeholder="Enter Facebook profile"
                                    className="pl-9"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {dynamicSocialFields.map((fieldName) => {
                          const platform = socialPlatforms.find(
                            (p) => p.value === fieldName
                          );
                          if (!platform) return null;
                          const IconComponent = platform.icon;
                          return (
                            <FormField
                              key={fieldName}
                              control={form.control}
                              name={fieldName as keyof VendorFormValues}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{platform.label}</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <div className="absolute left-3 top-3 text-gray-500">
                                        <IconComponent size={16} />
                                      </div>
                                      <Input
                                        placeholder={`Enter ${platform.label}`}
                                        className="pl-9"
                                        {...field}
                                        value={field.value || ""}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          );
                        })}

                        {getAvailableSocialPlatforms().length > 0 && (
                          <div className="relative mt-6 social-dropdown-container">
                            <button
                              type="button"
                              onClick={() =>
                                setShowSocialDropdown(!showSocialDropdown)
                              }
                              className="w-full flex items-center justify-center gap-2 dark:bg-white/10 py-1.5 px-1.5 text-sm font-medium border-2 border-dashed border-gray-300 dark:border-white/10 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/10 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/14 transition-all"
                            >
                              <Plus size={16} />
                              Add Social
                            </button>

                            {showSocialDropdown && (
                              <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-lg shadow-lg dark:shadow-2xl z-50">
                                {getAvailableSocialPlatforms().map(
                                  (platform) => (
                                    <button
                                      key={platform.value}
                                      type="button"
                                      onClick={() =>
                                        handleAddSocialField(platform.value)
                                      }
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 transition-colors text-gray-900 dark:text-gray-100"
                                    >
                                      {React.createElement(platform.icon, {
                                        size: 14,
                                      })}
                                      {platform.label}
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="w-full">
                      <FormField
                        control={form.control}
                        name="strRemarks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any additional information"
                                className="min-h-30"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-foreground">
                        Address Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                        <div className="space-y-4 border border-border-color rounded-lg p-4 bg-muted/10">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            Billing Address
                          </h4>

                          <FormField
                            control={form.control}
                            name="strAttention_billing"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attention</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter attention name"
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
                            name="strCountryGUID_billing"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    selectedValue={field.value || ""}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      form.setValue("strStateGUID_billing", "");
                                      form.setValue("strCityGUID_billing", "");
                                    }}
                                    placeholder="Select country"
                                    options={countries.map(
                                      (country: CountrySimple) => ({
                                        value: country.strCountryGUID,
                                        label: country.strName,
                                      })
                                    )}
                                    isLoading={isLoadingCountries}
                                    onOpenChange={(isOpen: boolean) =>
                                      setDropdownOpen((p) => ({
                                        ...p,
                                        billingCountry: isOpen,
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
                            name="strStateGUID_billing"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    selectedValue={field.value || ""}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      form.setValue("strCityGUID_billing", "");
                                    }}
                                    placeholder="Select state"
                                    disabled={!billingCountryGUID}
                                    options={billingStates.map(
                                      (state: StateSimple) => ({
                                        value: state.strStateGUID,
                                        label: state.strName,
                                      })
                                    )}
                                    isLoading={isLoadingBillingStates}
                                    onOpenChange={(isOpen: boolean) =>
                                      setDropdownOpen((p) => ({
                                        ...p,
                                        billingState: isOpen,
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
                            name="strCityGUID_billing"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    selectedValue={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Select city"
                                    disabled={!billingStateGUID}
                                    options={billingCities.map(
                                      (city: CitySimple) => ({
                                        value: city.strCityGUID,
                                        label: city.strName,
                                      })
                                    )}
                                    isLoading={isLoadingBillingCities}
                                    onOpenChange={(isOpen: boolean) =>
                                      setDropdownOpen((p) => ({
                                        ...p,
                                        billingCity: isOpen,
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
                            name="strAddress_billing"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter address"
                                    className="min-h-20"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="strPinCode_billing"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PIN Code</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter PIN code"
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
                              name="strPhone_billing"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <PhoneInput
                                      placeholder="Enter phone"
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      defaultCountry="IN"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="strFaxNumber_billing"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fax Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter fax number"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4 border border-border-color rounded-lg p-4 bg-muted/10">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            Shipping Address
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyBillingAddress(!copyBillingAddress)
                              }
                              className="text-sm text-blue-500 font-medium cursor-pointer hover:text-blue-600 flex items-center gap-1"
                            >
                              (<ArrowDown className="h-3.5 w-3.5" /> Copy
                              billing address)
                            </button>
                          </h4>

                          <FormField
                            control={form.control}
                            name="strAttention_shipping"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Attention</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter attention name"
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
                            name="strCountryGUID_shipping"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    selectedValue={field.value || ""}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      form.setValue(
                                        "strStateGUID_shipping",
                                        ""
                                      );
                                      form.setValue("strCityGUID_shipping", "");
                                    }}
                                    placeholder="Select country"
                                    options={countries.map(
                                      (country: CountrySimple) => ({
                                        value: country.strCountryGUID,
                                        label: country.strName,
                                      })
                                    )}
                                    isLoading={isLoadingCountries}
                                    onOpenChange={(isOpen: boolean) =>
                                      setDropdownOpen((p) => ({
                                        ...p,
                                        shippingCountry: isOpen,
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
                            name="strStateGUID_shipping"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State</FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    selectedValue={field.value || ""}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      form.setValue("strCityGUID_shipping", "");
                                    }}
                                    placeholder="Select state"
                                    disabled={!shippingCountryGUID}
                                    options={shippingStates.map(
                                      (state: StateSimple) => ({
                                        value: state.strStateGUID,
                                        label: state.strName,
                                      })
                                    )}
                                    isLoading={isLoadingShippingStates}
                                    onOpenChange={(isOpen: boolean) =>
                                      setDropdownOpen((p) => ({
                                        ...p,
                                        shippingState: isOpen,
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
                            name="strCityGUID_shipping"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    selectedValue={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Select city"
                                    disabled={!shippingStateGUID}
                                    options={shippingCities.map(
                                      (city: CitySimple) => ({
                                        value: city.strCityGUID,
                                        label: city.strName,
                                      })
                                    )}
                                    isLoading={isLoadingShippingCities}
                                    onOpenChange={(isOpen: boolean) =>
                                      setDropdownOpen((p) => ({
                                        ...p,
                                        shippingCity: isOpen,
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
                            name="strAddress_shipping"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter address"
                                    className="min-h-20"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="strPinCode_shipping"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PIN Code</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter PIN code"
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
                              name="strPhone_shipping"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <PhoneInput
                                      placeholder="Enter phone"
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      defaultCountry="IN"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="strFaxNumber_shipping"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fax Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter fax number"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="w-full">
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
                        onSelectedDocumentRemove={(guid) =>
                          setSelectedDocuments((prev) =>
                            prev.filter((d) => d.strDocumentGUID !== guid)
                          )
                        }
                        module="party"
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border-color px-6 py-4 bg-muted/20">
                  <div className="flex w-full justify-between">
                    <div>
                      <WithPermission
                        module="customer_form"
                        action={Actions.DELETE}
                      >
                        {isEditMode && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleteVendor.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteVendor.isPending ? "Deleting..." : "Delete"}
                          </Button>
                        )}
                      </WithPermission>
                    </div>
                    <div className="flex gap-2">
                      <WithPermission
                        module="customer_form"
                        action={isEditMode ? Actions.EDIT : Actions.SAVE}
                      >
                        <Button
                          type="submit"
                          disabled={
                            createVendor.isPending || updateVendor.isPending
                          }
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {createVendor.isPending || updateVendor.isPending
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
          </Form>

          <Card className="w-full mt-6">
            <div className="border-b border-border-color rounded-t-lg bg-card">
              <div className="px-6 py-3 border-b border-border-color">
                <h3 className="text-lg font-semibold text-foreground">
                  Contacts
                </h3>
              </div>
            </div>
            <PartyContactList
              partyId={
                isPartySaved && savedPartyId
                  ? savedPartyId
                  : id !== "new"
                    ? id!
                    : "new"
              }
              onEdit={(contact) => {
                setSelectedContact(contact);
                setShowContactModal(true);
              }}
              onAdd={() => {
                setSelectedContact(undefined);
                setShowContactModal(true);
              }}
              entityName="vendor"
            />
          </Card>
        </div>
      )}

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Vendor"
        description="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteVendor.isPending}
        loadingText="Deleting..."
      />
      <PartyContactModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setSelectedContact(undefined);
        }}
        contact={selectedContact}
        partyId={
          isPartySaved && savedPartyId
            ? savedPartyId
            : id !== "new"
              ? id!
              : "new"
        }
      />
    </CustomContainer>
  );
};

export default VendorForm;
