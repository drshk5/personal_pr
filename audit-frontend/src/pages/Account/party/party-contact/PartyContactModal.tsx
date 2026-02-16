import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  partyContactSchema,
  type PartyContactFormValues,
} from "@/validations/Account/party-contact";
import {
  useCreatePartyContact,
  useDeletePartyContact,
  useUpdatePartyContact,
} from "@/hooks/api/Account/use-party-contacts";
import { WithPermission } from "@/components/ui/with-permission";
import { Actions, FormModules } from "@/lib/permissions";
import type {
  PartyContact,
  PartyContactCreate,
  PartyContactUpdate,
} from "@/types/Account/party-contact";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Loader2,
  Trash2,
  Twitter,
  Facebook,
  Instagram,
  Phone,
  Mail,
  Plus,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";

interface PartyContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: PartyContact;
  partyId?: string;
}

export const PartyContactModal: React.FC<PartyContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  partyId,
}) => {
  const isEditing = !!contact;
  const isNewMode = partyId === "new" || !partyId;
  const title = isEditing ? "Edit Contact" : "Add New Contact";
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [dynamicSocialFields, setDynamicSocialFields] = React.useState<string[]>([]);
  const [showSocialDropdown, setShowSocialDropdown] = React.useState(false);

  const form = useForm<PartyContactFormValues>({
    resolver: zodResolver(partyContactSchema),
    defaultValues: {
      strPartyGUID: partyId || "",
      strSalutation: "",
      strFirstName: "",
      strLastName: "",
      strEmail: "",
      strPhoneNo_Work: "",
      strPhoneNo: "",
      strSkype: "",
      strDesignation: "",
      strDepartment: "",
      strTwitter: "",
      strFacebook: "",
      strInstagram: "",
    },
  });

  const createMutation = useCreatePartyContact();
  const updateMutation = useUpdatePartyContact();
  const deleteMutation = useDeletePartyContact();

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  useEffect(() => {
    if (contact) {
      form.reset({
        strPartyGUID: contact.strPartyGUID,
        strSalutation: contact.strSalutation || "",
        strFirstName: contact.strFirstName,
        strLastName: contact.strLastName || "",
        strEmail: contact.strEmail || "",
        strPhoneNo_Work: contact.strPhoneNo_Work || "",
        strPhoneNo: contact.strPhoneNo || "",
        strSkype: contact.strSkype || "",
        strDesignation: contact.strDesignation || "",
        strDepartment: contact.strDepartment || "",
        strTwitter: contact.strTwitter || "",
        strFacebook: contact.strFacebook || "",
        strInstagram: contact.strInstagram || "",
      });

      const initialSocialFields: string[] = ["strFacebook"];
      if (contact.strTwitter) initialSocialFields.push("strTwitter");
      if (contact.strFacebook) initialSocialFields.push("strFacebook");
      if (contact.strInstagram) initialSocialFields.push("strInstagram");
      if (contact.strSkype) initialSocialFields.push("strSkype");
      setDynamicSocialFields(Array.from(new Set(initialSocialFields)));
    } else if (partyId) {
      form.reset({
        ...form.getValues(),
        strPartyGUID: partyId,
      });
      setDynamicSocialFields(["strFacebook"]);
    } else {
      setDynamicSocialFields(["strFacebook"]);
    }
  }, [contact, partyId, form]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSocialDropdown && !target.closest('.social-dropdown-container')) {
        setShowSocialDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSocialDropdown]);

  const handleDeleteContact = () => {
    if (!contact) return;

    deleteMutation.mutate(
      { id: contact.strParty_ContactGUID },
      {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          onClose();
        },
      }
    );
  };

  const onSubmit = async (values: PartyContactFormValues) => {
    if (isNewMode) {
      alert("Please save the party first before adding contacts.");
      onClose();
      return;
    }

    const payload = {
      strPartyGUID: values.strPartyGUID,
      strSalutation: values.strSalutation,
      strFirstName: values.strFirstName,
      strLastName: values.strLastName,
      strEmail: values.strEmail,
      strPhoneNo_Work: values.strPhoneNo_Work || null,
      strPhoneNo: values.strPhoneNo || null,
      strSkype: values.strSkype || null,
      strDesignation: values.strDesignation || null,
      strDepartment: values.strDepartment || null,
      strTwitter: values.strTwitter || null,
      strFacebook: values.strFacebook || null,
      strInstagram: values.strInstagram || null,
    };

    if (isEditing && contact) {
      await updateMutation.mutateAsync({
        id: contact.strParty_ContactGUID,
        data: payload as PartyContactUpdate,
      });
    } else {
      await createMutation.mutateAsync(payload as PartyContactCreate);
    }

    onClose();
  };

  const salutations = ["Mr.", "Mrs.", "Miss", "Ms.", "Dr.", "Prof."];

  const socialPlatforms = [
    { value: "strTwitter", label: "Twitter", icon: Twitter },
    { value: "strFacebook", label: "Facebook", icon: Facebook },
    { value: "strInstagram", label: "Instagram", icon: Instagram },
    { value: "strSkype", label: "Skype", icon: Phone },
  ];

  const getAvailableSocialPlatforms = () => {
    return socialPlatforms.filter(
      (platform) => !dynamicSocialFields.includes(platform.value)
    );
  };

  const handleAddSocialField = (fieldName: string) => {
    setDynamicSocialFields((prev) => [...prev, fieldName]);
    form.setValue(fieldName as keyof PartyContactFormValues, "");
    setShowSocialDropdown(false);
  };

  const footerContent = (
    <div className="flex w-full justify-between">
      {isEditing && (
        <>
          <WithPermission module={FormModules.CUSTOMER} action={Actions.DELETE}>
            <Button
              variant="destructive"
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </WithPermission>

          <ConfirmationDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleDeleteContact}
            title="Delete Contact"
            description="Are you sure you want to delete this contact? This action cannot be undone."
            confirmLabel="Delete"
            variant="danger"
            isLoading={deleteMutation.isPending}
            loadingText="Deleting..."
          />
        </>
      )}
      <div className="flex ml-auto">
        <Button
          variant="outline"
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="mr-2"
        >
          Cancel
        </Button>
        <WithPermission
          module={FormModules.CUSTOMER}
          action={isEditing ? Actions.EDIT : Actions.SAVE}
        >
          <Button
            type="submit"
            form="party-contact-form"
            disabled={isSubmitting}
            onClick={() => {}}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update" : "Create"}
          </Button>
        </WithPermission>
      </div>
    </div>
  );

  return (
    <ModalDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={title}
      maxWidth="900px"
      fullHeight={false}
      footerContent={footerContent}
      className="overflow-visible"
    >
      <Form {...form}>
        <form
          id="party-contact-form"
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            Object.keys(errors).forEach((field) => {
              form.trigger(field as keyof PartyContactFormValues);
            });
          })}
          className="flex flex-col h-full w-full overflow-visible"
        >
          <div
            className="px-6 py-6 overflow-y-auto"
            style={{ maxHeight: "calc(90vh - 140px)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 overflow-visible">
              <div className="col-span-2 mb-1 mt-0">
                <h3 className="font-semibold text-md">Personal Information</h3>
                <div className="h-px bg-muted-foreground/20 w-full my-2"></div>
              </div>

              <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-visible">
                <FormField
                  control={form.control}
                  name="strSalutation"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 overflow-visible">
                      <FormLabel className="text-sm">
                        Salutation <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select salutation" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-9999">
                            {salutations.map((salutation) => (
                              <SelectItem key={salutation} value={salutation}>
                                {salutation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strFirstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="First name"
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strLastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Last name"
                          className="h-9"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="col-span-2 mb-1 mt-3">
                <h3 className="font-semibold text-md">Contact Information</h3>
                <div className="h-px bg-muted-foreground/20 w-full my-2"></div>
              </div>

              <div className="col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-visible">
                <FormField
                  control={form.control}
                  name="strEmail"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            {...field}
                            value={field.value || ""}
                            className="h-9 pl-8"
                            placeholder="Email address"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strPhoneNo"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Personal phone"
                          defaultCountry="IN"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strPhoneNo_Work"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm">Work Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Work phone"
                          defaultCountry="IN"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-2 mb-1 mt-3">
                <h3 className="font-semibold text-md">Job Details</h3>
                <div className="h-px bg-muted-foreground/20 w-full my-2"></div>
              </div>

              <FormField
                control={form.control}
                name="strDesignation"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm">Designation</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-9"
                        placeholder="Job title"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strDepartment"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm">Department</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className="h-9"
                        placeholder="Department name"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="col-span-2 mb-1 mt-3">
                <h3 className="font-semibold text-md">Social Media</h3>
                <div className="h-px bg-muted-foreground/20 w-full my-2"></div>
              </div>

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
                    name={fieldName as keyof PartyContactFormValues}
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-sm">{platform.label}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <IconComponent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              value={field.value || ""}
                              className="h-9 pl-8"
                              placeholder={`${platform.label} handle`}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                );
              })}

              {getAvailableSocialPlatforms().length > 0 && (
                <div className="col-span-2 sm:col-span-1 mt-9 relative social-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setShowSocialDropdown(!showSocialDropdown)}
                    className="w-full flex items-center justify-center gap-2 dark:bg-white/10 py-1.5 px-1.5 text-sm font-medium border-2 border-dashed border-gray-300 dark:border-white/10 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/10 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/14 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add Social
                  </button>

                  {showSocialDropdown && (
                      <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-card border border-gray-200 dark:border-white/10 rounded-lg shadow-lg dark:shadow-2xl z-50">
                      {getAvailableSocialPlatforms().map((platform) => (
                        <button
                          key={platform.value}
                          type="button"
                          onClick={() => handleAddSocialField(platform.value)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 transition-colors text-gray-900 dark:text-gray-100"
                        >
                          {React.createElement(platform.icon, {
                            className: "h-4 w-4",
                          })}
                          {platform.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      </Form>
    </ModalDialog>
  );
};

export default PartyContactModal;
