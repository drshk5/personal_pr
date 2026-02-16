import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Info,
  Save,
  Trash2,
  User,
  UserPlus,
  X,
} from "lucide-react";

import {
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/api/central/use-users";
import {
  useActiveUserRoles,
  useActiveDepartments,
  useActiveDesignations,
  useMenuIcon,
} from "@/hooks";

import {
  Actions,
  FormModules,
  ModuleBase,
  useCanEdit,
  useCanSave,
} from "@/lib/permissions";

import type { UserCreate, UserUpdate } from "@/types/central/user";
import type { UserRole } from "@/types/central/user-role";

import {
  userCreateSchema,
  userEditSchema,
  type UserFormValues,
} from "@/validations";

import { getImagePath } from "@/lib/utils";
import timezoneData from "@/data/timezone.json";
import { LazyImage } from "@/components/ui/lazy-image";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
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
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { ImageCropDialog } from "@/components/modals/ImageCropDialog";
import { DepartmentModal } from "@/pages/Central/user/components/DepartmentModal";
import { DesignationModal } from "@/pages/Central/user/components/DesignationModal";
import { PhoneInput } from "@/components/ui/phone-input";
import { PasswordInput } from "@/components/ui/password-input";
import { UserFormSkeleton } from "./UserFormSkeleton";

const UserForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showDepartmentModal, setShowDepartmentModal] =
    useState<boolean>(false);
  const [showDesignationModal, setShowDesignationModal] =
    useState<boolean>(false);
  const [profileImageFile, setProfileImageFile] = useState<File | undefined>(
    undefined
  );
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [cropperOpen, setCropperOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalTimeZone, setOriginalTimeZone] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState({
    roles: false,
    departments: false,
    designations: false,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = !!id && id !== "new";

  // Check permissions for department and designation modals
  const canEditDepartment = useCanEdit(ModuleBase.DEPARTMENT);
  const canSaveDepartment = useCanSave(ModuleBase.DEPARTMENT);
  const canEditDesignation = useCanEdit(ModuleBase.DESIGNATION);
  const canSaveDesignation = useCanSave(ModuleBase.DESIGNATION);

  // Check if user can access department or designation modals
  const canAccessDepartment = canEditDepartment || canSaveDepartment;
  const canAccessDesignation = canEditDesignation || canSaveDesignation;

  // Enable lazy fetch for create; prefetch for edit to fill existing values
  const shouldPrefetch = isEditMode;
  const rolesEnabled = dropdownOpen.roles || shouldPrefetch;
  const departmentsEnabled = dropdownOpen.departments || shouldPrefetch;
  const designationsEnabled = dropdownOpen.designations || shouldPrefetch;

  const { data: roleData = [], isLoading: isLoadingRoles } = useActiveUserRoles(
    "",
    rolesEnabled
  );

  const { data: departmentData = [], isLoading: isLoadingDepartments } =
    useActiveDepartments("", departmentsEnabled);

  const { data: designationData = [], isLoading: isLoadingDesignations } =
    useActiveDesignations("", designationsEnabled);

  const { data: userData, isLoading: isLoadingUser } = useUser(
    isEditMode ? id : undefined
  );
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const isLoadingDropdowns =
    isLoadingRoles || isLoadingDepartments || isLoadingDesignations;
  const isLoading = isLoadingUser || (isEditMode && isLoadingDropdowns);
  const isSaving = isCreating || isUpdating;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          alert("Please select a valid image file");
          return;
        }

        setSelectedFile(file);
        setCropperOpen(true);
      }
    },
    []
  );

  const handleCroppedImage = useCallback(
    (croppedImage: string) => {
      setPreviewUrl(croppedImage);

      fetch(croppedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File(
            [blob],
            selectedFile?.name || "profile-image.png",
            {
              type: "image/png",
            }
          );
          setProfileImageFile(file);
          setCropperOpen(false);
        });
    },
    [selectedFile?.name]
  );

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEditMode ? userEditSchema : userCreateSchema),
    defaultValues: {
      strName: "",
      strEmailId: "",
      strMobileNo: "",
      strPassword: "",
      bolIsActive: true,
      dtBirthDate: null,
      dtWorkingStartTime: "",
      dtWorkingEndTime: "",
      strRoleGUID: "",
      strProfileImg: "",
      strTimeZone: "Asia/Kolkata",
      strDepartmentGUID: "",
      strDesignationGUID: "",
    },
  });

  const removeFile = useCallback(() => {
    setProfileImageFile(undefined);
    setPreviewUrl(undefined);
    setSelectedFile(null);
    form.setValue("strProfileImg", "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [form]);

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

  useEffect(() => {
    if (isEditMode && userData && id) {
      // Wait for dropdown data to be available before setting form values
      if (departmentData.length === 0 || designationData.length === 0) {
        return; // Don't set form values yet, wait for data
      }

      const userTimeZone = userData.strTimeZone || "Asia/Kolkata";
      setOriginalTimeZone(userTimeZone);

      form.setValue("strName", userData.strName || "");
      form.setValue("strEmailId", userData.strEmailId || "");
      form.setValue("bolIsActive", userData.bolIsActive);

      if (userData.dtBirthDate) {
        form.setValue("dtBirthDate", new Date(userData.dtBirthDate));
      } else {
        form.setValue("dtBirthDate", null);
      }

      form.setValue("dtWorkingStartTime", userData.dtWorkingStartTime || "");
      form.setValue("dtWorkingEndTime", userData.dtWorkingEndTime || "");
      form.setValue("strProfileImg", userData.strProfileImg || "");
      form.setValue("strTimeZone", userTimeZone);
      form.setValue("strDepartmentGUID", userData.strDepartmentGUID || "");
      form.setValue("strDesignationGUID", userData.strDesignationGUID || "");

      // Set phone number with a slight delay to ensure PhoneInput is mounted
      setTimeout(() => {
        form.setValue("strMobileNo", userData.strMobileNo || "");
      }, 0);

      if (userData.strProfileImg) {
        setPreviewUrl(userData.strProfileImg);
      }
    }
  }, [isEditMode, userData, form, id, departmentData, designationData]);

  const handleDelete = useCallback(() => {
    if (!id) return;

    deleteUser(id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        navigate("/user");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  }, [id, deleteUser, navigate]);

  const onSubmit = useCallback(
    (formData: UserFormValues) => {
      if (isEditMode && id) {
        const updateData: UserUpdate = {
          strName: formData.strName,
          strEmailId: formData.strEmailId,
          strMobileNo: formData.strMobileNo,
          bolIsActive: formData.bolIsActive,
          dtWorkingStartTime: formData.dtWorkingStartTime,
          dtWorkingEndTime: formData.dtWorkingEndTime,
          strTimeZone: formData.strTimeZone,
          strDepartmentGUID: formData.strDepartmentGUID,
          strDesignationGUID: formData.strDesignationGUID,
        };

        if (formData.dtBirthDate instanceof Date) {
          updateData.dtBirthDate = format(formData.dtBirthDate, "yyyy-MM-dd");
        } else {
          updateData.dtBirthDate = null;
        }

        if (profileImageFile) {
          updateData.ProfileImgFile = profileImageFile;
          updateData.strProfileImg = profileImageFile.name;
        } else if (!previewUrl && userData?.strProfileImg) {
          const emptyBlob = new Blob([""], {
            type: "application/octet-stream",
          });
          updateData.ProfileImgFile = new File([emptyBlob], "empty.txt");
          updateData.strProfileImg = "";
        } else {
          updateData.strProfileImg = formData.strProfileImg;
        }

        const timezoneChanged =
          originalTimeZone && formData.strTimeZone !== originalTimeZone;

        updateUser(
          { id, data: updateData },
          {
            onSuccess: () => {
              if (timezoneChanged) {
                toast.info(
                  "Please logout and login back to apply timezone changes for this user.",
                  {
                    duration: 6000,
                  }
                );
              }
              navigate("/user");
            },
          }
        );
      } else {
        const newUser: UserCreate = {
          strName: formData.strName,
          strEmailId: formData.strEmailId,
          strMobileNo: formData.strMobileNo,
          strPassword: formData.strPassword || "",
          bolIsActive: formData.bolIsActive,
          dtWorkingStartTime: formData.dtWorkingStartTime,
          dtWorkingEndTime: formData.dtWorkingEndTime,
          strRoleGUID: formData.strRoleGUID || "",
          strTimeZone: formData.strTimeZone,
          strDepartmentGUID: formData.strDepartmentGUID,
          strDesignationGUID: formData.strDesignationGUID,
        };

        if (formData.dtBirthDate instanceof Date) {
          newUser.dtBirthDate = format(formData.dtBirthDate, "yyyy-MM-dd");
        } else {
          newUser.dtBirthDate = null;
        }

        if (profileImageFile) {
          newUser.ProfileImgFile = profileImageFile;
          newUser.strProfileImg = profileImageFile.name;
        }

        createUser(newUser, {
          onSuccess: () => navigate("/user"),
        });
      }
    },
    [
      isEditMode,
      id,
      profileImageFile,
      previewUrl,
      userData?.strProfileImg,
      originalTimeZone,
      updateUser,
      createUser,
      navigate,
    ]
  );

  const HeaderIcon = useMenuIcon(FormModules.USER, UserPlus);

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit User" : "New User"}
        description={
          isEditMode
            ? "Update user account details"
            : "Create a new user account and assign appropriate roles"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/user")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <UserFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="userForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-6">
                  <div className="gap-2 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <FormLabel className="mb-0">Profile Image</FormLabel>
                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted-foreground/20 cursor-help transition-colors"
                        title="Upload a profile image (optional). Max file size: 2MB. Supported formats: JPEG, PNG"
                      >
                        <Info className="w-3 h-3" />
                      </span>
                    </div>

                    <FormField
                      control={form.control}
                      name="strProfileImg"
                      render={({ field }) => <input type="hidden" {...field} />}
                    />

                    <div className="flex flex-col items-center mb-4">
                      <div className="relative">
                        <div className="relative">
                          {previewUrl && (
                            <button
                              type="button"
                              className="absolute -right-2 -top-2 z-30 rounded-full p-1 bg-muted text-foreground shadow-md hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeFile();
                              }}
                              disabled={isSaving}
                              aria-label="Remove profile image"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </button>
                          )}
                          <div
                            className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 cursor-pointer group"
                            onClick={() => {
                              fileInputRef.current?.click();
                            }}
                          >
                            {previewUrl ? (
                              <LazyImage
                                src={
                                  profileImageFile
                                    ? URL.createObjectURL(profileImageFile)
                                    : getImagePath(previewUrl) || ""
                                }
                                alt="Profile"
                                className="w-full h-full object-cover object-center"
                                containerClassName="w-full h-full rounded-full"
                                placeholderClassName="rounded-full"
                                loading={profileImageFile ? "eager" : "lazy"}
                                threshold={100}
                                rootMargin="50px"
                                onError={() => {
                                  // Fallback handled by LazyImage component
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                                <User className="h-16 w-16 text-muted-foreground/90" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                              <Camera className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Click to upload profile photo
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="strName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2 font-medium">
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter user name"
                            className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strMobileNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Mobile Number <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <PhoneInput
                            value={field.value}
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

                  <FormField
                    control={form.control}
                    name="dtBirthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birth Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ?? undefined}
                            onChange={field.onChange}
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="strEmailId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Email <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter email address"
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isEditMode && (
                    <FormField
                      control={form.control}
                      name="strPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Password <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PasswordInput
                              {...field}
                              placeholder="Enter password"
                              disabled={isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="strDepartmentGUID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Department <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <PreloadedSelect
                            selectedValue={field.value || ""}
                            onChange={field.onChange}
                            options={
                              departmentData?.map((dept) => ({
                                label: dept.strDepartmentName,
                                value: dept.strDepartmentGUID,
                              })) || []
                            }
                            placeholder="Select a department"
                            disabled={isSaving}
                            isLoading={isLoadingDepartments}
                            initialMessage="Type to filter departments"
                            showSettings={true}
                            onOpenChange={(isOpen: boolean) =>
                              setDropdownOpen((p) => ({
                                ...p,
                                departments: isOpen,
                              }))
                            }
                            onSettingsClick={() => {
                              if (canAccessDepartment) {
                                setShowDepartmentModal(true);
                              } else {
                                toast.error(
                                  "You don't have permission to manage departments"
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
                    name="strDesignationGUID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Designation <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <PreloadedSelect
                            selectedValue={field.value || ""}
                            onChange={field.onChange}
                            options={
                              designationData?.map((designation) => ({
                                label: designation.strName,
                                value: designation.strDesignationGUID,
                              })) || []
                            }
                            placeholder="Select a designation"
                            disabled={isSaving}
                            isLoading={isLoadingDesignations}
                            initialMessage="Type to filter designations"
                            showSettings={true}
                            onOpenChange={(isOpen: boolean) =>
                              setDropdownOpen((p) => ({
                                ...p,
                                designations: isOpen,
                              }))
                            }
                            onSettingsClick={() => {
                              if (canAccessDesignation) {
                                setShowDesignationModal(true);
                              } else {
                                toast.error(
                                  "You don't have permission to manage designations"
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isEditMode && (
                    <FormField
                      control={form.control}
                      name="strRoleGUID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            User Role <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <PreloadedSelect
                              selectedValue={field.value || ""}
                              onChange={field.onChange}
                              options={
                                roleData?.map((role: UserRole) => ({
                                  label: role.strName,
                                  value: role.strUserRoleGUID,
                                })) || []
                              }
                              placeholder="Select a role"
                              disabled={isSaving}
                              isLoading={isLoadingRoles}
                              initialMessage="Type to filter roles"
                              queryKey={["userRoles", "active"]}
                              addNewPath="/user-role/new"
                              addNewLabel="Add New Role"
                              onOpenChange={(isOpen: boolean) =>
                                setDropdownOpen((p) => ({
                                  ...p,
                                  roles: isOpen,
                                }))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="dtWorkingStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Working Start Time{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <TimePicker
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Select start time"
                            disabled={isSaving}
                            use24HourFormat={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dtWorkingEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Working End Time{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <TimePicker
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Select end time"
                            disabled={isSaving}
                            use24HourFormat={false}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="bolIsActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-4">
                        <FormLabel>Active</FormLabel>
                        <div className="pt-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSaving}
                            />
                          </FormControl>
                        </div>
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

                <ImageCropDialog
                  open={cropperOpen}
                  onOpenChange={setCropperOpen}
                  file={selectedFile}
                  title="Crop Profile Image"
                  description="Drag to adjust the cropping area for your profile image"
                  helperText="Adjust the circular crop to select your profile picture"
                  onCrop={handleCroppedImage}
                  fileInputRef={fileInputRef}
                />
              </CardContent>

              <CardFooter className="border-t px-6 py-4">
                <div className="flex items-center justify-between w-full">
                  <div>
                    {isEditMode && (
                      <WithPermission
                        module={FormModules.USER}
                        action={Actions.DELETE}
                      >
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={
                            isDeleting || isSaving || userData?.bolSystemCreated
                          }
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </WithPermission>
                    )}
                  </div>
                  <div>
                    <WithPermission
                      module={FormModules.USER}
                      action={Actions.SAVE}
                    >
                      <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSaving}
                      >
                        {isEditMode ? (
                          <Save className="mr-2 h-4 w-4" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
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
        </Form>
      )}

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      <DepartmentModal
        open={showDepartmentModal}
        onOpenChange={setShowDepartmentModal}
      />

      <DesignationModal
        open={showDesignationModal}
        onOpenChange={setShowDesignationModal}
      />
    </CustomContainer>
  );
};

export default UserForm;
