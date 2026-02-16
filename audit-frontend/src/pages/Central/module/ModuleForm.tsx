import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getModuleImagePath } from "@/lib/utils";
import {
  moduleSchema,
  type ModuleFormValues,
} from "@/validations/central/module";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  ArrowLeft,
  LayoutDashboard,
  Trash2,
  Save,
  X,
  Camera,
} from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { ImageCropDialog } from "@/components/modals/ImageCropDialog";
import {
  useModule,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
} from "@/hooks/api/central/use-modules";
import type { ModuleCreate, ModuleUpdate } from "@/types/central/module";
import { ModuleFormSkeleton } from "./ModuleFormSkeleton";
import { useMenuIcon } from "@/hooks";

const ModuleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);
  const [imageFile, setImageFile] = React.useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(
    undefined
  );
  const [cropperOpen, setCropperOpen] = React.useState<boolean>(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      strName: "",
      strDesc: "",
      strSQlfilePath: "",
      strImagePath: "",
      bolIsActive: true,
    },
  });

  const { data: moduleData, isLoading: isLoadingModule } = useModule(
    isEditMode && id && id !== "new" ? id : undefined
  );

  useEffect(() => {
    if (moduleData && isEditMode && id && id !== "new") {
      form.setValue("strName", moduleData.strName);
      form.setValue("strDesc", moduleData.strDesc);
      form.setValue("strSQlfilePath", moduleData.strSQlfilePath);
      form.setValue("strImagePath", moduleData.strImagePath);
      form.setValue("bolIsActive", moduleData.bolIsActive);

      if (moduleData.strImagePath) {
        setPreviewUrl(moduleData.strImagePath);
      }
    }
  }, [moduleData, form, isEditMode, id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      setSelectedFile(file);
      setCropperOpen(true);
    }
  };

  const handleCroppedImage = (croppedImage: string) => {
    setPreviewUrl(croppedImage);

    fetch(croppedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File(
          [blob],
          selectedFile?.name || "module-image.png",
          {
            type: "image/png",
          }
        );
        setImageFile(file);
        setCropperOpen(false);
      });
  };

  const removeFile = () => {
    setImageFile(undefined);
    setPreviewUrl(undefined);
    setSelectedFile(null);
    form.setValue("strImagePath", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const { mutate: createModule, isPending: isCreating } = useCreateModule();

  const { mutate: updateModule, isPending: isUpdating } = useUpdateModule();

  const { mutate: deleteModule, isPending: isDeleting } = useDeleteModule();

  const handleDelete = () => {
    if (!id) return;

    deleteModule(id, {
      onSuccess: () => {
        navigate("/module-super");
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: ModuleFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: ModuleUpdate = {
        strName: data.strName,
        strDesc: data.strDesc,
        strSQlfilePath: data.strSQlfilePath,
        bolIsActive: data.bolIsActive,
      };

      if (imageFile) {
        updateData.ImageFile = imageFile;
        updateData.strImagePath = imageFile.name;
      } else if (!previewUrl && moduleData?.strImagePath) {
        const emptyBlob = new Blob([""], {
          type: "application/octet-stream",
        });
        updateData.ImageFile = new File([emptyBlob], "empty.txt");
        updateData.strImagePath = "";
      } else {
        updateData.strImagePath = data.strImagePath;
      }

      updateModule(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/module-super", { replace: true });
          },
        }
      );
    } else {
      const createData: ModuleCreate = {
        strName: data.strName,
        strDesc: data.strDesc,
        strSQlfilePath: data.strSQlfilePath,
        strImagePath: imageFile ? imageFile.name : data.strImagePath,
        bolIsActive: data.bolIsActive,
        ImageFile: new File(["placeholder"], "placeholder.txt", {
          type: "text/plain",
        }),
      };

      if (imageFile) {
        createData.ImageFile = imageFile;
      }

      createModule(createData, {
        onSuccess: () => {
          navigate("/module-super");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("module_form", LayoutDashboard);

  const isLoading = isLoadingModule;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Module" : "New Module"}
        description={
          isEditMode ? "Update module details" : "Create a new module"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/module-super")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <ModuleFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8"
            id="moduleForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex justify-center w-full mb-6">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <FormLabel className="mb-0">Module Image</FormLabel>

                      <span
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted-foreground/20 cursor-help transition-colors"
                        title="Upload a module image (optional). Max file size: 2MB. Supported formats: JPEG, PNG"
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

                    <FormField
                      control={form.control}
                      name="strImagePath"
                      render={({ field }) => (
                        <input
                          type="hidden"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      )}
                    />

                    <div className="flex flex-col items-center mb-4">
                      <div className="relative">
                        <div className="relative">
                          <div
                            className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {previewUrl ? (
                              <img
                                src={
                                  imageFile
                                    ? URL.createObjectURL(imageFile)
                                    : getModuleImagePath(previewUrl)
                                }
                                alt="Module image"
                                className="w-full h-full object-cover object-center"
                              />
                            ) : (
                              <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                                <LayoutDashboard className="h-16 w-16 text-muted-foreground/90" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                              <Camera className="h-8 w-8 text-white" />
                            </div>
                          </div>
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
                              aria-label="Remove module image"
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground text-center">
                        Click to upload module image
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isCreating || isUpdating || isDeleting}
                      />

                      <ImageCropDialog
                        open={cropperOpen}
                        onOpenChange={setCropperOpen}
                        file={selectedFile}
                        title="Crop Module Image"
                        description="Drag to adjust the cropping area for your module image"
                        helperText="Adjust the circular crop to select your module image"
                        onCrop={handleCroppedImage}
                        fileInputRef={fileInputRef}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
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
                            placeholder="Enter module name"
                            className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strSQlfilePath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          SQL File Path<span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter SQL file path" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strDesc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter module description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bolIsActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-start gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            Active
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
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4 bg-muted/20">
                <div>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting || isUpdating || isCreating}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    type="submit"
                    disabled={isUpdating || isCreating || isLoading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isUpdating || isCreating
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : isEditMode
                        ? "Update"
                        : "Create"}
                  </Button>
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
        description="Are you sure you want to delete this module? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default ModuleForm;
