import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, Camera, User, Info } from "lucide-react";

import { useUpdateUser, useUser } from "@/hooks";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import type { UserUpdate } from "@/types";

import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/validations/central/user";

import { getImagePath } from "@/lib/utils/image-utils";
import timezoneData from "@/data/timezone.json";

import { ImageCropDialog } from "@/components/modals/ImageCropDialog";
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
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { PhoneInput } from "@/components/ui/phone-input";

export function ProfileForm({
  onUpdateComplete,
}: {
  onUpdateComplete?: () => void;
}) {
  const { user: authUser } = useAuthContext();
  const { data: user } = useUser(authUser?.strUserGUID);
  const { mutate: updateProfile, isPending } = useUpdateUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profileImageFile, setProfileImageFile] = useState<File | undefined>(
    undefined
  );
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [cropperOpen, setCropperOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalTimeZone, setOriginalTimeZone] = useState<string>("");

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
          selectedFile?.name || "profile-image.png",
          {
            type: "image/png",
          }
        );
        setProfileImageFile(file);
        setCropperOpen(false);
      });
  };

  const removeFile = () => {
    setProfileImageFile(undefined);
    setPreviewUrl(undefined);
    setSelectedFile(null);
    form.setValue("strProfileImg", "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      strName: "",
      strEmailId: "",
      strMobileNo: "",
      bolIsActive: true,
      strProfileImg: "",
      strTimeZone: "Asia/Kolkata",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (user) {
      const userTimeZone = user.strTimeZone || "Asia/Kolkata";
      form.reset({
        strName: user.strName || "",
        strEmailId: user.strEmailId || "",
        strMobileNo: user.strMobileNo || "",
        bolIsActive: user.bolIsActive ?? true,
        strProfileImg: user.strProfileImg || "",
        strTimeZone: userTimeZone,
      });

      setOriginalTimeZone(userTimeZone);

      if (user.strProfileImg) {
        setPreviewUrl(user.strProfileImg);
      }
    }
  }, [user, form]);

  function onSubmit(data: ProfileFormValues) {
    let birthDate = user?.dtBirthDate || null;
    if (birthDate) {
      birthDate = birthDate.split("T")[0];
    }

    const updateData: UserUpdate = {
      strName: data.strName,
      strEmailId: data.strEmailId,
      strMobileNo: data.strMobileNo || "",
      bolIsActive: data.bolIsActive,
      dtBirthDate: birthDate,
      dtWorkingStartTime: null,
      dtWorkingEndTime: null,
      strTimeZone: data.strTimeZone,
    };

    if (profileImageFile) {
      updateData.ProfileImgFile = profileImageFile;
      updateData.strProfileImg = profileImageFile.name;
    } else if (!previewUrl && user?.strProfileImg) {
      const emptyBlob = new Blob([""], { type: "application/octet-stream" });
      updateData.ProfileImgFile = new File([emptyBlob], "empty.txt");
      updateData.strProfileImg = "";
    } else {
      updateData.strProfileImg = data.strProfileImg;
    }

    const userId = user?.strUserGUID;

    if (!userId) {
      return;
    }

    const timezoneChanged =
      originalTimeZone && data.strTimeZone !== originalTimeZone;

    updateProfile(
      {
        id: userId,
        data: updateData,
      },
      {
        onSuccess: () => {
          if (timezoneChanged) {
            toast.info(
              "Please logout and login back to apply timezone changes.",
              {
                duration: 6000,
              }
            );
          }
          if (onUpdateComplete) {
            onUpdateComplete();
          }
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form
        id="profile-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <Card>
          <CardContent className="p-6 pt-6">
            <div className="flex justify-center w-full mb-6">
              <div className="flex flex-col items-center">
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
                      {previewUrl && (
                        <button
                          type="button"
                          className="absolute -right-2 -top-2 z-30 rounded-full p-1 text-foreground shadow-md hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeFile();
                          }}
                          disabled={isPending}
                          aria-label="Remove profile image"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </button>
                      )}
                      <div
                        className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 cursor-pointer group"
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                      >
                        {previewUrl ? (
                          <img
                            src={
                              profileImageFile
                                ? URL.createObjectURL(profileImageFile)
                                : getImagePath(previewUrl)
                            }
                            alt="Profile"
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
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
                  disabled={isPending}
                />

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
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="strName"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end h-full">
                    <FormLabel className="mb-2 font-medium">Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your name"
                        className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="strEmailId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value || ""}
                        onChange={field.onChange}
                        disabled={isPending}
                        placeholder="Enter phone number"
                        defaultCountry="IN"
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
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <PreloadedSelect
                        selectedValue={field.value}
                        onChange={field.onChange}
                        options={timezoneData}
                        placeholder="Select timezone"
                        disabled={isPending}
                        clearable
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 bg-muted/20 flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
