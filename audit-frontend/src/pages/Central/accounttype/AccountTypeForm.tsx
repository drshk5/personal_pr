import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  accountTypeSchema,
  type AccountTypeFormValues,
} from "@/validations/central/account-type";

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
import { AccountTypeFormSkeleton } from "./AccountTypeFormSkeleton";

import { ArrowLeft, BarChart3, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

import {
  useAccountType,
  useCreateAccountType,
  useUpdateAccountType,
  useDeleteAccountType,
} from "@/hooks/api/central/use-account-types";
import type {
  AccountTypeCreate,
  AccountTypeUpdate,
} from "@/types/central/account-type";
import { useMenuIcon } from "@/hooks";

const AccountTypeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const form = useForm({
    resolver: zodResolver(accountTypeSchema),
    defaultValues: {
      strName: "",
      bolIsActive: true,
    },
  });

  const { data: accountTypeData, isLoading: isLoadingData } = useAccountType(
    isEditMode && id && id !== "new" ? id : undefined
  );

  const { mutate: createAccountTypeMutation, isPending: isCreating } =
    useCreateAccountType();
  const { mutate: updateAccountTypeMutation, isPending: isUpdating } =
    useUpdateAccountType();
  const { mutate: deleteAccountTypeMutation, isPending: isDeleting } =
    useDeleteAccountType();

  useEffect(() => {
    if (accountTypeData && isEditMode && id && id !== "new" && !isLoadingData) {
      form.setValue("strName", accountTypeData.strName);
      form.setValue("bolIsActive", accountTypeData.bolIsActive);
    }
  }, [accountTypeData, form, isEditMode, id, isLoadingData]);

  const handleDelete = () => {
    if (!id) return;

    deleteAccountTypeMutation(id, {
      onSuccess: () => {
        navigate("/account-type");
      },
      onSettled: () => {
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: AccountTypeFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: AccountTypeUpdate = {
        strName: data.strName,
        bolIsActive: data.bolIsActive,
      };

      updateAccountTypeMutation(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/account-type");
          },
        }
      );
    } else {
      const createData: AccountTypeCreate = {
        strName: data.strName,
        bolIsActive: data.bolIsActive,
      };

      createAccountTypeMutation(createData, {
        onSuccess: () => {
          navigate("/account-type");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon("ACCOUNT_TYPE", BarChart3);

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Account Type" : "New Account Type"}
        description={
          isEditMode
            ? "Update account type details"
            : "Create a new account type"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/account-type")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoadingData ? (
        <AccountTypeFormSkeleton />
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="accountTypeForm"
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
                            placeholder="Enter account type name"
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
        description="Are you sure you want to delete this account type? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        loadingText="Deleting..."
      />
    </CustomContainer>
  );
};

export default AccountTypeForm;
