import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUsers } from "@/hooks/api/central/use-users";
import { useActiveUserRoles } from "@/hooks/api/central/use-user-roles";
import { useActiveYearsByOrganization } from "@/hooks/api/central/use-years";
import { useBulkCreateUserDetails } from "@/hooks/api/central/use-user-details";
import { useTableLayout } from "@/hooks/common";
import { z } from "zod";
import type { User } from "@/types/central/user";
import type { UserDetails } from "@/types/central/user-details";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { Save, UserCog, Calendar, Users } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { Separator } from "@/components/ui/separator";

const bulkTeamMemberSchema = z.object({
  strUserRoleGUID: z.string().min(1, "Role is required"),
  strYearGUID: z.string().min(1, "Year is required"),
});

type BulkTeamMemberFormValues = z.infer<typeof bulkTeamMemberSchema>;

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName?: string;
  editingUserDetail?: UserDetails | null;
  onEditingUserChange?: (userDetail: UserDetails) => void;
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName = "this organization",
  editingUserDetail = null,
  onEditingUserChange,
}) => {
  const isEditMode = !!editingUserDetail;
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
  });

  const defaultColumnOrder = useMemo(
    () => ["select", "strName", "strEmailId", "bolIsActive"],
    []
  );

  const { columnWidths, setColumnWidths } = useTableLayout(
    "teamMemberModal",
    defaultColumnOrder,
    []
  );

  const { data: usersResponse, isLoading: usersLoading } = useUsers(
    {
      pageNumber: pagination.pageNumber,
      pageSize: pagination.pageSize,
      search: debouncedSearch || undefined,
      bolIsActive: true,
    },
    isOpen // Only fetch when modal is open
  );

  const users = useMemo(() => {
    if (!usersResponse?.data.items) return [];
    if (Array.isArray(usersResponse.data.items))
      return usersResponse.data.items;
    return [];
  }, [usersResponse?.data]);

  const { data: rolesData, isLoading: rolesLoading } = useActiveUserRoles(
    undefined,
    isOpen
  );
  const { data: yearsData, isLoading: yearsLoading } =
    useActiveYearsByOrganization(organizationId || undefined, undefined, {
      enabled: isOpen,
    });

  const { mutateAsync: bulkCreateUserDetails, isPending: isCreating } =
    useBulkCreateUserDetails();

  const form = useForm<BulkTeamMemberFormValues>({
    resolver: zodResolver(bulkTeamMemberSchema),
    defaultValues: {
      strUserRoleGUID: "",
      strYearGUID: "",
    },
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageNumber: 1,
    }));
  }, [debouncedSearch]);

  // Reset state when modal opens/closes or edit mode changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingUserDetail) {
        // Populate form with editing user data
        form.reset({
          strUserRoleGUID: editingUserDetail.strUserRoleGUID,
          strYearGUID: editingUserDetail.strYearGUID || "",
        });
        // In edit mode, set the current user as selected
        setSelectedUsers([editingUserDetail.strUserGUID]);
      } else {
        // Reset for bulk mode
        setPagination({
          pageNumber: 1,
          pageSize: 10,
        });
        form.reset({
          strUserRoleGUID: "",
          strYearGUID: "",
        });
        setSelectedUsers([]);
      }
    } else {
      setSelectedUsers([]);
      setSearchTerm("");
      setDebouncedSearch("");
      setPagination({
        pageNumber: 1,
        pageSize: 10,
      });
    }
  }, [isOpen, isEditMode, editingUserDetail, form]);

  const roleOptions = React.useMemo(() => {
    if (!rolesData) return [];
    if (!Array.isArray(rolesData)) return [];
    return rolesData.map((role: unknown) => ({
      value: (role as { strUserRoleGUID: string }).strUserRoleGUID,
      label: (role as { strName: string }).strName || "Unknown",
    }));
  }, [rolesData]);

  const yearOptions = React.useMemo(() => {
    if (!yearsData) return [];
    if (!Array.isArray(yearsData)) return [];
    return yearsData.map((year: unknown) => ({
      value: (year as { strYearGUID: string }).strYearGUID,
      label: (year as { strName: string }).strName || "Unknown",
    }));
  }, [yearsData]);

  const handleToggleUser = useCallback(
    (userGuid: string, user?: User) => {
      if (isEditMode) {
        // In edit mode, select only one user and update form
        setSelectedUsers([userGuid]);
        if (user && onEditingUserChange) {
          // Find the full user detail from the users array
          const selectedUser = users.find((u) => u.strUserGUID === userGuid);
          if (selectedUser) {
            // Create a UserDetails-like object to pass to callback
            onEditingUserChange({
              ...editingUserDetail!,
              strUserGUID: selectedUser.strUserGUID,
              strUserName: selectedUser.strName,
            } as UserDetails);
          }
        }
      } else {
        // In bulk mode, toggle selection
        setSelectedUsers((prev) =>
          prev.includes(userGuid)
            ? prev.filter((id) => id !== userGuid)
            : [...prev, userGuid]
        );
      }
    },
    [isEditMode, editingUserDetail, onEditingUserChange, users]
  );

  const handleToggleAll = useCallback(() => {
    if (isEditMode) {
      // Don't allow select all in edit mode
      return;
    }
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u: User) => u.strUserGUID));
    }
  }, [selectedUsers.length, users, isEditMode]);

  const goToPage = (pageNumber: number) => {
    setPagination((prev) => ({
      ...prev,
      pageNumber,
    }));
  };

  const changePageSize = (pageSize: number) => {
    setPagination({
      pageNumber: 1,
      pageSize,
    });
  };

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
      {
        key: "select",
        header: (
          <Checkbox
            checked={users.length > 0 && selectedUsers.length === users.length}
            onCheckedChange={handleToggleAll}
            aria-label="Select all"
          />
        ),
        width: "50px",
        cell: (user) => (
          <Checkbox
            checked={selectedUsers.includes(user.strUserGUID)}
            onCheckedChange={() => handleToggleUser(user.strUserGUID)}
            aria-label="Select row"
          />
        ),
      },
      {
        key: "strName",
        header: "User Name",
        width: "200px",
        sortable: true,
        cell: (user) => (
          <span className="font-medium">{user.strName || "N/A"}</span>
        ),
      },
      {
        key: "strEmailId",
        header: "Email",
        width: "200px",
        sortable: true,
        cell: (user) => (
          <span className="text-muted-foreground">
            {user.strEmailId || "N/A"}
          </span>
        ),
      },
      {
        key: "bolIsActive",
        header: "Status",
        width: "100px",
        cell: (user) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {user.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
      },
    ],
    [selectedUsers, users, handleToggleUser, handleToggleAll]
  );

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    return defaultColumnOrder
      .map((key: string) => columnMap.get(key))
      .filter(
        (
          col: DataTableColumn<User> | undefined
        ): col is DataTableColumn<User> => col !== undefined
      );
  }, [columns, defaultColumnOrder]);

  const onSubmit = async (data: BulkTeamMemberFormValues) => {
    await bulkCreateUserDetails({
      strUserGUIDs:
        isEditMode && editingUserDetail
          ? [editingUserDetail.strUserGUID]
          : selectedUsers,
      strUserRoleGUID: data.strUserRoleGUID,
      strOrganizationGUID: organizationId,
      strYearGUID: data.strYearGUID,
      bolIsActive: true,
    });
    onClose();
  };

  const footerContent = (
    <div className="flex w-full justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isCreating}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isCreating || (!isEditMode && selectedUsers.length === 0)}
        onClick={form.handleSubmit(onSubmit)}
      >
        {isCreating ? (
          isEditMode ? (
            "Updating..."
          ) : (
            "Adding..."
          )
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            {isEditMode
              ? "Update"
              : `Add ${selectedUsers.length > 0 && `(${selectedUsers.length})`}`}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <ModalDialog
      open={isOpen}
      onOpenChange={onClose}
      title={isEditMode ? "Edit Team Member" : "Add Team Members"}
      description={
        isEditMode
          ? `Update the role and year for ${editingUserDetail?.strUserName || "this member"} in ${organizationName}.`
          : `Select users and assign them a role and year for ${organizationName}.`
      }
      maxWidth="900px"
      className="h-[90vh] max-sm:h-[95vh] max-sm:w-[95vw] max-sm:max-w-[95vw] max-md:w-[90vw] max-md:max-w-[90vw]"
      footerContent={footerContent}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col h-full w-full"
        >
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
            {/* Role and Year Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="strYearGUID"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm">
                      Year <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="relative">
                      <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <FormControl>
                        <PreloadedSelect
                          disabled={yearsLoading}
                          selectedValue={field.value}
                          onChange={field.onChange}
                          options={yearOptions}
                          placeholder="Select a financial year"
                          isLoading={yearsLoading}
                          className="pl-8"
                          queryKey={["years", "byOrganization", organizationId]}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strUserRoleGUID"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm">
                      Role <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="relative">
                      <UserCog className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <FormControl>
                        <PreloadedSelect
                          disabled={rolesLoading}
                          selectedValue={field.value}
                          onChange={field.onChange}
                          options={roleOptions}
                          placeholder="Select a role"
                          isLoading={rolesLoading}
                          className="pl-8"
                          queryKey={["userRoles", "active"]}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            {/* Users Selection Table - Show in both modes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {isEditMode ? "Select User to Edit" : "Select Users"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEditMode
                      ? `Click a user to edit their role and year`
                      : selectedUsers.length > 0
                        ? `${selectedUsers.length} user(s) selected`
                        : "Select users to add to the team"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <DataTable
                  data={users}
                  columns={orderedColumns}
                  keyExtractor={(item) => item.strUserGUID}
                  maxHeight="250px"
                  minHeight="200px"
                  loading={usersLoading}
                  columnWidths={columnWidths}
                  onColumnWidthsChange={setColumnWidths}
                  emptyState={
                    <div className="py-8 text-center text-muted-foreground">
                      {searchTerm
                        ? `No users found matching "${searchTerm}"`
                        : "No users available"}
                    </div>
                  }
                  pagination={{
                    pageNumber: usersResponse?.data.pageNumber || 1,
                    pageSize: usersResponse?.data.pageSize || 10,
                    totalCount: usersResponse?.data.totalCount || 0,
                    totalPages: usersResponse?.data.totalPages || 0,
                    onPageChange: goToPage,
                    onPageSizeChange: changePageSize,
                  }}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </ModalDialog>
  );
};
