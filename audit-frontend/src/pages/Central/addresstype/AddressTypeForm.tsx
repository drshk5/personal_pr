import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  addressTypeSchema,
  type AddressTypeFormValues,
} from "@/validations/central/address-type";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
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
import { AddressTypeFormSkeleton } from "./AddressTypeFormSkeleton";

import { ArrowLeft, MapPin, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import {
  useAddressType,
  useCreateAddressType,
  useUpdateAddressType,
  useDeleteAddressType,
} from "@/hooks/api/central/use-address-types";
import type {
  AddressTypeCreate,
  AddressTypeUpdate,
} from "@/types/central/address-type";
import { useMenuIcon } from "@/hooks";

const AddressTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(addressTypeSchema),
    defaultValues: {
      strName: "",
      bolIsActive: true,
    },
  });

  const { data: addressTypeData, isLoading: isLoadingData } = useAddressType(
    isEditMode && id && id !== "new" ? id : undefined
  );

  const { mutate: createAddressTypeMutation, isPending: isCreating } =
    useCreateAddressType();
  const { mutate: updateAddressTypeMutation, isPending: isUpdating } =
    useUpdateAddressType();
  const { mutate: deleteAddressTypeMutation, isPending: isDeleting } =
    useDeleteAddressType();

  useEffect(() => {
    if (addressTypeData && isEditMode && id && id !== "new" && !isLoadingData) {
      form.setValue("strName", addressTypeData.strName);
      form.setValue("bolIsActive", addressTypeData.bolIsActive);
    }
  }, [addressTypeData, form, isEditMode, id, isLoadingData]);

  const handleDelete = () => {
    if (!id) return;

    deleteAddressTypeMutation(id, {
      onSuccess: () => {
        navigate("/address-type");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const HeaderIcon = useMenuIcon("address_type_form", MapPin);

  const onSubmit = (data: AddressTypeFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: AddressTypeUpdate = {
        strName: data.strName,
        bolIsActive: data.bolIsActive,
      };

      updateAddressTypeMutation(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/address-type");
          },
        }
      );
    } else {
      const createData: AddressTypeCreate = {
        strName: data.strName,
        bolIsActive: data.bolIsActive,
      };

      createAddressTypeMutation(createData, {
        onSuccess: () => {
          navigate("/address-type");
        },
      });
    }
  };

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Address Type" : "New Address Type"}
        description={
          isEditMode
            ? "Update address type details"
            : "Create a new address type"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/address-type")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoadingData ? (
        <AddressTypeFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="addressTypeForm"
          >
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <FormField
                    control={form.control}
                    name="strName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter address type name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Active status */}
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
              <CardFooter className="flex justify-between pt-2 pb-6">
                <div>
                  {isEditMode && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting || isCreating || isUpdating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isCreating || isUpdating || isLoadingData}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isCreating || isUpdating
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

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this address type? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default AddressTypeForm;
