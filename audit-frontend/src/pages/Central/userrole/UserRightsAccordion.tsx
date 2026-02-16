import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  FileIcon,
  Folder,
  Loader2,
  Minus,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";

import type {
  UserRight,
  UserRightsBatchItem,
  MenuUserRightsTree,
} from "@/types/central/user-rights";

import { Modules, Actions } from "@/lib/permissions";

import { cn } from "@/lib/utils";

import {
  useUserRightsTree as fetchUserRightsTree,
  useBatchUpsertUserRights,
} from "@/hooks/api/central/use-user-rights";
import { useUserRole } from "@/hooks/api/central/use-user-roles";
import { useIsMobile } from "@/hooks/common/use-mobile";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { WithPermission } from "@/components/ui/with-permission";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { UserRightsAccordionSkeleton } from "./UserRightsAccordionSkeleton";
import { SearchInput } from "@/components/shared/search-input";
import UserRightsAccordionMobile from "./UserRightsAccordionMobile";

interface ExtendedUserRight extends UserRight {
  isChild?: boolean;
  hasChildren?: boolean;
  menuName?: string;
  children?: MenuUserRightsTree[];
  level?: number;
  strParentMenuGUID?: string;
  bolIsView?: boolean;
  bolIsEdit?: boolean;
  bolIsSave?: boolean;
  bolIsDelete?: boolean;
  bolIsPrint?: boolean;
  bolIsExport?: boolean;
  bolIsImport?: boolean;
  bolIsApprove?: boolean;
}

interface CategoryItems {
  [category: string]: MenuUserRightsTree[];
}

interface ApiResponseData {
  Items?: CategoryItems;
  TotalCount?: number;
}

interface GroupedRights {
  [category: string]: {
    categoryName: string;
    items: ExtendedUserRight[];
  };
}

const CheckboxWrapper: React.FC<
  React.ComponentPropsWithoutRef<typeof Checkbox>
> = (props) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`p-1.5 ${props.disabled ? "opacity-50" : ""}`}
      onClick={handleClick}
    >
      <Checkbox
        {...props}
        className={`h-5 w-5 shadow-md 
          data-[state=checked]:bg-primary 
          data-[state=checked]:border-primary 
          dark:data-[state=checked]:bg-primary 
           dark:data-[state=checked]:border-primary
          ${props.disabled ? "cursor-not-allowed bg-muted" : ""}
        `} // Use theme color when checked, muted when disabled
      />
    </div>
  );
};

const AllColumnCheckbox: React.FC<
  React.ComponentPropsWithoutRef<typeof Checkbox>
> = (props) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (props.disabled) return;
    if (props.onCheckedChange) {
      props.onCheckedChange(!props.checked);
    }
  };

  return (
    <div
      className={`p-1.5 ${props.disabled ? "opacity-50" : ""} relative`}
      onClick={(e) => e.stopPropagation()}
    >
      {props.checked ? (
        <div
          onClick={handleClick}
          className={`h-5 w-5 rounded-sm flex items-center justify-center bg-primary border-border-color shadow-md ${
            props.disabled ? "" : "cursor-pointer"
          }`}
          title={props.title}
        >
          <Minus className="h-3 w-3 text-white" />
        </div>
      ) : (
        <Checkbox
          {...props}
          className={`h-5 w-5 shadow-md 
            ${props.disabled ? "cursor-not-allowed bg-muted" : ""}
          `}
        />
      )}
    </div>
  );
};

const UserRightsAccordion: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleBack = () => navigate("/user-role");
  const [searchParams] = useSearchParams();
  const roleId = searchParams.get("roleId");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (!roleId) {
      navigate("/user-role");
      return;
    }
  }, [roleId, navigate]);

  const [userRights, setUserRights] = useState<ExtendedUserRight[]>([]);
  const [groupedRights, setGroupedRights] = useState<GroupedRights>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [modifiedRights, setModifiedRights] = useState<
    Record<string, UserRightsBatchItem>
  >({});

  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 100,
    totalCount: 0,
    totalPages: 0,
  });

  const { data: userRightsResponse, isLoading } = fetchUserRightsTree({
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
    search: search || undefined,
    strRoleGUID: roleId || undefined,
    ascending: true,
  });

  const { data: roleData, isLoading: isLoadingRole } = useUserRole(
    roleId || undefined
  );

  const { mutate: batchUpsertUserRights, isPending: isSubmitting } =
    useBatchUpsertUserRights();

  useEffect(() => {
    const data = userRightsResponse?.data;
    if (data) {
      const enhancedRights: ExtendedUserRight[] = [];
      const groupedData: GroupedRights = {};

      // Check if data has the Items object from the API response
      const apiResponse = data as unknown as { data?: ApiResponseData };
      const apiItems = apiResponse.data?.Items;

      if (apiItems && typeof apiItems === "object") {
        Object.entries(apiItems).forEach(([category, menuItems]) => {
          if (Array.isArray(menuItems)) {
            if (!groupedData[category]) {
              groupedData[category] = {
                categoryName:
                  category.charAt(0).toUpperCase() + category.slice(1),
                items: [],
              };
            }

            menuItems.forEach((item: MenuUserRightsTree) => {
              const processItem = (
                menuItem: MenuUserRightsTree
              ): ExtendedUserRight => {
                const bolIsView = Boolean(menuItem.bolIsView);
                const bolIsEdit = Boolean(menuItem.bolIsEdit);
                const bolIsSave = Boolean(menuItem.bolIsSave);
                const bolIsDelete = Boolean(menuItem.bolIsDelete);
                const bolIsPrint = Boolean(menuItem.bolIsPrint);
                const bolIsExport = Boolean(menuItem.bolIsExport);
                const bolIsImport = Boolean(menuItem.bolIsImport);
                const bolIsApprove = Boolean(menuItem.bolIsApprove);

                return {
                  ...menuItem,
                  isChild: false,
                  hasChildren:
                    Array.isArray(menuItem.children) &&
                    menuItem.children.length > 0,
                  menuName: menuItem.strMenuName || "Unnamed Menu",
                  bolCanView: bolIsView ? Boolean(menuItem.bolCanView) : false,
                  bolCanEdit: bolIsEdit ? Boolean(menuItem.bolCanEdit) : false,
                  bolCanSave: bolIsSave ? Boolean(menuItem.bolCanSave) : false,
                  bolCanDelete: bolIsDelete
                    ? Boolean(menuItem.bolCanDelete)
                    : false,
                  bolCanPrint: bolIsPrint
                    ? Boolean(menuItem.bolCanPrint)
                    : false,
                  bolCanExport: bolIsExport
                    ? Boolean(menuItem.bolCanExport)
                    : false,
                  bolCanImport: bolIsImport
                    ? Boolean(menuItem.bolCanImport)
                    : false,
                  bolCanApprove: bolIsApprove
                    ? Boolean(menuItem.bolCanApprove)
                    : false,
                  bolIsView,
                  bolIsEdit,
                  bolIsSave,
                  bolIsDelete,
                  bolIsPrint,
                  bolIsExport,
                  bolIsImport,
                  bolIsApprove,
                };
              };

              const enhancedItem = processItem(item);
              enhancedRights.push(enhancedItem);
              groupedData[category].items.push(enhancedItem);

              if (item.children && Array.isArray(item.children)) {
                item.children.forEach((child: MenuUserRightsTree) => {
                  const enhancedChild = {
                    ...processItem(child),
                    strParentMenuGUID: item.strMenuGUID,
                    isChild: true,
                  };
                  enhancedRights.push(enhancedChild);
                  groupedData[category].items.push(enhancedChild);
                });
              }
            });
          }
        });
      } else {
        const items = data.items;
        if (items && Array.isArray(items)) {
          items.forEach((item) => {
            const category = item.strCategory || "uncategorized";

            if (!groupedData[category]) {
              groupedData[category] = {
                categoryName:
                  category.charAt(0).toUpperCase() + category.slice(1),
                items: [],
              };
            }

            const bolIsView = Boolean(item.bolIsView);
            const bolIsEdit = Boolean(item.bolIsEdit);
            const bolIsSave = Boolean(item.bolIsSave);
            const bolIsDelete = Boolean(item.bolIsDelete);
            const bolIsPrint = Boolean(item.bolIsPrint);
            const bolIsExport = Boolean(item.bolIsExport);
            const bolIsImport = Boolean(item.bolIsImport);
            const bolIsApprove = Boolean(item.bolIsApprove);

            const enhancedItem: ExtendedUserRight = {
              ...item,
              isChild: false,
              hasChildren:
                Array.isArray(item.children) && item.children.length > 0,
              menuName: item.strMenuName || "Unnamed Menu",
              bolCanView: bolIsView ? Boolean(item.bolCanView) : false,
              bolCanEdit: bolIsEdit ? Boolean(item.bolCanEdit) : false,
              bolCanSave: bolIsSave ? Boolean(item.bolCanSave) : false,
              bolCanDelete: bolIsDelete ? Boolean(item.bolCanDelete) : false,
              bolCanPrint: bolIsPrint ? Boolean(item.bolCanPrint) : false,
              bolCanExport: bolIsExport ? Boolean(item.bolCanExport) : false,
              bolCanImport: bolIsImport ? Boolean(item.bolCanImport) : false,
              bolCanApprove: bolIsApprove ? Boolean(item.bolCanApprove) : false,
              bolIsView,
              bolIsEdit,
              bolIsSave,
              bolIsDelete,
              bolIsPrint,
              bolIsExport,
              bolIsImport,
              bolIsApprove,
            };

            enhancedRights.push(enhancedItem);
            groupedData[category].items.push(enhancedItem);

            if (item.children && Array.isArray(item.children)) {
              item.children.forEach((child) => {
                const childCategory = category;

                if (!groupedData[childCategory]) {
                  groupedData[childCategory] = {
                    categoryName:
                      childCategory.charAt(0).toUpperCase() +
                      childCategory.slice(1),
                    items: [],
                  };
                }

                const cBolIsView = Boolean(child.bolIsView);
                const cBolIsEdit = Boolean(child.bolIsEdit);
                const cBolIsSave = Boolean(child.bolIsSave);
                const cBolIsDelete = Boolean(child.bolIsDelete);
                const cBolIsPrint = Boolean(child.bolIsPrint);
                const cBolIsExport = Boolean(child.bolIsExport);
                const cBolIsImport = Boolean(child.bolIsImport);
                const cBolIsApprove = Boolean(child.bolIsApprove);

                const enhancedChild: ExtendedUserRight = {
                  ...child,
                  isChild: true,
                  hasChildren: false,
                  strParentMenuGUID: item.strMenuGUID,
                  menuName: child.strMenuName || "Unnamed Menu",
                  bolCanView: cBolIsView ? Boolean(child.bolCanView) : false,
                  bolCanEdit: cBolIsEdit ? Boolean(child.bolCanEdit) : false,
                  bolCanSave: cBolIsSave ? Boolean(child.bolCanSave) : false,
                  bolCanDelete: cBolIsDelete
                    ? Boolean(child.bolCanDelete)
                    : false,
                  bolCanPrint: cBolIsPrint ? Boolean(child.bolCanPrint) : false,
                  bolCanExport: cBolIsExport
                    ? Boolean(child.bolCanExport)
                    : false,
                  bolCanImport: cBolIsImport
                    ? Boolean(child.bolCanImport)
                    : false,
                  bolCanApprove: cBolIsApprove
                    ? Boolean(child.bolCanApprove)
                    : false,
                  bolIsView: cBolIsView,
                  bolIsEdit: cBolIsEdit,
                  bolIsSave: cBolIsSave,
                  bolIsDelete: cBolIsDelete,
                  bolIsPrint: cBolIsPrint,
                  bolIsExport: cBolIsExport,
                  bolIsImport: cBolIsImport,
                  bolIsApprove: cBolIsApprove,
                };

                enhancedRights.push(enhancedChild);
                groupedData[childCategory].items.push(enhancedChild);
              });
            }
          });
        }
      }

      setUserRights(enhancedRights);
      setGroupedRights(groupedData);

      if (roleId) {
        setModifiedRights({});
      }

      const totalCount =
        apiResponse.data?.TotalCount ||
        data.totalCount ||
        enhancedRights.length ||
        0;

      const totalPages =
        data.totalPages || Math.ceil(totalCount / pagination.pageSize) || 1;

      setPagination((prev) => ({
        ...prev,
        totalCount,
        totalPages,
      }));
    }
  }, [userRightsResponse, roleId, pagination.pageSize]);

  const handlePermissionChange = (
    rightId: string,
    menuId: string,
    roleId: string,
    field: keyof UserRightsBatchItem,
    value: boolean
  ) => {
    setModifiedRights((prev) => {
      const newState = { ...prev };

      const key = rightId || `new-${menuId}`;
      const originalRight = userRights.find(
        (right) => right.strMenuGUID === menuId
      );
      const baseRight = {
        strUserRightGUID: rightId || "",
        strMenuGUID: menuId,
        strUserRoleGUID: roleId,
        bolCanView: originalRight?.bolCanView || false,
        bolCanEdit: originalRight?.bolCanEdit || false,
        bolCanSave: originalRight?.bolCanSave || false,
        bolCanDelete: originalRight?.bolCanDelete || false,
        bolCanPrint: originalRight?.bolCanPrint || false,
        bolCanExport: originalRight?.bolCanExport || false,
        bolCanImport: originalRight?.bolCanImport || false,
        bolCanApprove: originalRight?.bolCanApprove || false,
      };
      const withPreviousChanges = prev[key]
        ? { ...baseRight, ...prev[key] }
        : baseRight;
      const updatedRight = {
        ...withPreviousChanges,
        [field]: value,
        ...(value === true && field !== "bolCanView"
          ? { bolCanView: true }
          : {}),
      };

      // Check if the updated right is different from the original
      const hasChanges =
        updatedRight.bolCanView !== baseRight.bolCanView ||
        updatedRight.bolCanEdit !== baseRight.bolCanEdit ||
        updatedRight.bolCanSave !== baseRight.bolCanSave ||
        updatedRight.bolCanDelete !== baseRight.bolCanDelete ||
        updatedRight.bolCanPrint !== baseRight.bolCanPrint ||
        updatedRight.bolCanExport !== baseRight.bolCanExport ||
        updatedRight.bolCanImport !== baseRight.bolCanImport ||
        updatedRight.bolCanApprove !== baseRight.bolCanApprove;

      // Only keep in modifiedRights if there are actual changes
      if (hasChanges) {
        newState[key] = updatedRight as UserRightsBatchItem;
      } else {
        // Remove from modifiedRights if it matches the original
        delete newState[key];
      }

      return newState;
    });
  };

  const getCurrentValue = (
    right: ExtendedUserRight,
    field: keyof Pick<
      UserRightsBatchItem,
      | "bolCanView"
      | "bolCanEdit"
      | "bolCanSave"
      | "bolCanDelete"
      | "bolCanPrint"
      | "bolCanExport"
      | "bolCanImport"
      | "bolCanApprove"
    >
  ): boolean => {
    const isFieldAvailable =
      (field === "bolCanView" && right.bolIsView) ||
      (field === "bolCanEdit" && right.bolIsEdit) ||
      (field === "bolCanSave" && right.bolIsSave) ||
      (field === "bolCanDelete" && right.bolIsDelete) ||
      (field === "bolCanPrint" && right.bolIsPrint) ||
      (field === "bolCanExport" && right.bolIsExport) ||
      (field === "bolCanImport" && right.bolIsImport) ||
      (field === "bolCanApprove" && right.bolIsApprove);

    if (!isFieldAvailable) {
      return false;
    }

    const key = right.strUserRightGUID || `new-${right.strMenuGUID}`;
    const modifiedRight = modifiedRights[key];

    if (modifiedRight && modifiedRight[field] !== undefined) {
      return Boolean(modifiedRight[field]);
    }

    return Boolean(right[field]);
  };

  const handleSelectAllPermissions = (
    right: ExtendedUserRight,
    isSelected: boolean
  ) => {
    const permissionPairs: Array<
      [keyof UserRightsBatchItem, keyof ExtendedUserRight]
    > = [
      ["bolCanView", "bolIsView"],
      ["bolCanEdit", "bolIsEdit"],
      ["bolCanSave", "bolIsSave"],
      ["bolCanDelete", "bolIsDelete"],
      ["bolCanPrint", "bolIsPrint"],
      ["bolCanExport", "bolIsExport"],
      ["bolCanImport", "bolIsImport"],
      ["bolCanApprove", "bolIsApprove"],
    ];

    permissionPairs.forEach(([permission, isAvailableField]) => {
      if (right[isAvailableField] === true) {
        handlePermissionChange(
          right.strUserRightGUID,
          right.strMenuGUID,
          right.strUserRoleGUID,
          permission,
          isSelected
        );
      } else if (!isSelected) {
        handlePermissionChange(
          right.strUserRightGUID,
          right.strMenuGUID,
          right.strUserRoleGUID,
          permission,
          false
        );
      }
    });
  };

  const areAllPermissionsEnabled = (right: ExtendedUserRight): boolean => {
    const hasAnyPermissionAvailable =
      right.bolIsView ||
      right.bolIsEdit ||
      right.bolIsSave ||
      right.bolIsDelete ||
      right.bolIsPrint ||
      right.bolIsExport ||
      right.bolIsImport ||
      right.bolIsApprove;

    // If no permissions are available, return false
    if (!hasAnyPermissionAvailable) return false;

    // Check if all available permissions are enabled
    // Each permission is checked only if it's available (the corresponding bolIs* is true)
    if (right.bolIsView && !getCurrentValue(right, "bolCanView")) return false;
    if (right.bolIsEdit && !getCurrentValue(right, "bolCanEdit")) return false;
    if (right.bolIsSave && !getCurrentValue(right, "bolCanSave")) return false;
    if (right.bolIsDelete && !getCurrentValue(right, "bolCanDelete"))
      return false;
    if (right.bolIsPrint && !getCurrentValue(right, "bolCanPrint"))
      return false;
    if (right.bolIsExport && !getCurrentValue(right, "bolCanExport"))
      return false;
    if (right.bolIsImport && !getCurrentValue(right, "bolCanImport"))
      return false;
    if (right.bolIsApprove && !getCurrentValue(right, "bolCanApprove"))
      return false;

    return true;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = () => {
    if (Object.keys(modifiedRights).length === 0) {
      return;
    }

    const count = Object.keys(modifiedRights).length;

    const userRightsArray = Object.values(modifiedRights);

    const batchRequest = {
      userRights: {
        userRights: userRightsArray,
      },
      options: {
        showToast: true,
        customSuccessMessage: `Successfully updated ${count} permission${
          count > 1 ? "s" : ""
        }`,
      },
    };

    setIsSaving(true);

    batchUpsertUserRights(batchRequest, {
      onSuccess: () => {
        setModifiedRights({});

        setTimeout(() => {
          setIsSaving(false);
        }, 800);
      },
      onError: () => {
        setIsSaving(false);
      },
    });
  };

  const getRoleName = () => {
    if (userRights && userRights.length > 0 && userRights[0].strUserRoleName) {
      return userRights[0].strUserRoleName;
    }

    if (roleData) {
      return roleData.strName;
    }

    return "";
  };

  const permissionColumns = [
    { key: "bolCanView", label: "View", isKey: "bolIsView" },
    { key: "bolCanEdit", label: "Edit", isKey: "bolIsEdit" },
    { key: "bolCanSave", label: "Save", isKey: "bolIsSave" },
    { key: "bolCanDelete", label: "Delete", isKey: "bolIsDelete" },
    { key: "bolCanPrint", label: "Print", isKey: "bolIsPrint" },
    { key: "bolCanExport", label: "Export", isKey: "bolIsExport" },
    { key: "bolCanImport", label: "Import", isKey: "bolIsImport" },
    { key: "bolCanApprove", label: "Approve", isKey: "bolIsApprove" },
  ];

  // Render mobile version if on mobile device
  if (isMobile) {
    return (
      <UserRightsAccordionMobile
        roleId={roleId}
        roleName={getRoleName()}
        userRights={userRights}
        groupedRights={groupedRights}
        isLoading={isLoading || isLoadingRole}
        isSubmitting={isSubmitting}
        search={search}
        setSearch={setSearch}
        modifiedRights={modifiedRights}
        handlePermissionChange={handlePermissionChange}
        getCurrentValue={getCurrentValue}
        handleSubmit={handleSubmit}
        isSaving={isSaving}
      />
    );
  }

  // Render desktop version
  return (
    <CustomContainer>
      <PageHeader
        title={
          isLoading || isLoadingRole
            ? "User Role Permissions..."
            : `User Role Permissions${
                getRoleName() ? `: ${getRoleName()}` : ""
              }`
        }
        description={
          (isLoading || isLoadingRole) && roleId
            ? "Loading role information..."
            : "Manage role permissions for each menu item"
        }
        icon={ShieldCheck}
        actions={
          <div className="flex space-x-2">
            {roleId && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to User Roles
              </Button>
            )}
            <WithPermission
              module={Modules.USER_PRIVILEGE}
              action={Actions.SAVE}
            >
              <Button
                onClick={handleSubmit}
                className="bg-primary hover:bg-primary/90"
                disabled={
                  isSubmitting || Object.keys(modifiedRights).length === 0
                }
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Permissions
                {Object.keys(modifiedRights).length > 0 && (
                  <span className="ml-2 bg-white text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    {Object.keys(modifiedRights).length}
                  </span>
                )}
              </Button>
            </WithPermission>
          </div>
        }
      />

      <div className="mb-6">
        <SearchInput
          placeholder="Search menu items..."
          onSearchChange={setSearch}
          debounceDelay={300}
          className="max-w-md"
        />
      </div>

      {isLoading || isSaving ? (
        <UserRightsAccordionSkeleton />
      ) : (
        <>
          {userRights && userRights.length > 0 ? (
            <div className="w-full">
              <div className="mb-2 text-sm text-muted-foreground">
                {userRights.length} menu items found
              </div>

              <div className="flex items-center py-3 px-4 mb-2 font-medium sticky top-0 z-10 w-full bg-muted/50 dark:bg-muted/20 shadow-sm">
                <div className="flex-5 text-muted-foreground">Menu Name</div>
                <div className="flex-1 text-center text-muted-foreground font-semibold border-border-color pr-4 mr-6"></div>
                {permissionColumns.map((col) => (
                  <div
                    key={col.key}
                    className="flex-1 text-center text-muted-foreground"
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              <div className="overflow-y-auto max-h-[calc(100vh-280px)] pr-2">
                <Accordion
                  type="multiple"
                  value={expandedCategories}
                  onValueChange={setExpandedCategories}
                  className="border-border-color rounded-md w-full"
                >
                  {Object.entries(groupedRights).map(
                    ([categoryId, category]) => {
                      return (
                        <AccordionItem
                          value={categoryId}
                          key={categoryId}
                          className="w-full"
                        >
                          <AccordionTrigger
                            className="px-4 hover:no-underline w-full group text-foreground [&[data-state=open]>div>div:first-child>svg]:rotate-90 [&>svg]:hidden"
                            style={{
                              backgroundColor:
                                "var(--sidebar, hsl(var(--sidebar)))",
                              textDecoration: "none !important",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            }}
                          >
                            <div
                              className="flex items-center w-full justify-between relative **:no-underline hover:**:no-underline"
                              style={{ textDecoration: "none !important" }}
                            >
                              <div className="flex-5 text-left font-medium flex items-center gap-2">
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 15 15"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="transition-transform duration-200"
                                >
                                  <path
                                    d="M6.1584 3.13508C6.35985 2.94621 6.67627 2.95642 6.86514 3.15788L10.6151 7.15788C10.7954 7.3502 10.7954 7.64949 10.6151 7.84182L6.86514 11.8418C6.67627 12.0433 6.35985 12.0535 6.1584 11.8646C5.95694 11.6757 5.94673 11.3593 6.1356 11.1579L9.565 7.49985L6.1356 3.84182C5.94673 3.64036 5.95694 3.32394 6.1584 3.13508Z"
                                    fill="currentColor"
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                                <span
                                  style={{ textDecoration: "none !important" }}
                                >
                                  {category.categoryName}
                                </span>
                              </div>

                              {!expandedCategories.includes(categoryId) && (
                                <span className="text-black dark:text-white font-medium text-sm absolute right-80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Click to configure access
                                </span>
                              )}

                              <div
                                className={`flex-1 flex justify-center border-border-color pr-4 mr-6 ${
                                  !expandedCategories.includes(categoryId)
                                    ? "pointer-events-none"
                                    : ""
                                }`}
                              >
                                <div
                                  className={`flex items-center justify-center ${
                                    expandedCategories.includes(categoryId)
                                      ? "visible"
                                      : "invisible"
                                  }`}
                                >
                                  <div
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();

                                      const checked = !(
                                        category.items.length > 0 &&
                                        category.items.every((item) =>
                                          areAllPermissionsEnabled(item)
                                        )
                                      );

                                      category.items.forEach((item) => {
                                        handleSelectAllPermissions(
                                          item,
                                          checked
                                        );
                                      });
                                    }}
                                    title="Toggle all permissions"
                                  >
                                    <div
                                      className={cn(
                                        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                        category.items.length > 0 &&
                                          category.items.every((item) =>
                                            areAllPermissionsEnabled(item)
                                          )
                                          ? "bg-primary"
                                          : "bg-input"
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                                          category.items.length > 0 &&
                                            category.items.every((item) =>
                                              areAllPermissionsEnabled(item)
                                            )
                                            ? "translate-x-5"
                                            : "translate-x-0"
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {permissionColumns.map((col) => {
                                const itemsWithPermission =
                                  category.items.filter((item) =>
                                    Boolean(
                                      item[col.isKey as keyof ExtendedUserRight]
                                    )
                                  );

                                const allEnabled =
                                  itemsWithPermission.length > 0 &&
                                  itemsWithPermission.every((item) =>
                                    getCurrentValue(
                                      item,
                                      col.key as
                                        | "bolCanView"
                                        | "bolCanEdit"
                                        | "bolCanSave"
                                        | "bolCanDelete"
                                        | "bolCanPrint"
                                        | "bolCanExport"
                                        | "bolCanImport"
                                        | "bolCanApprove"
                                    )
                                  );

                                return (
                                  <div
                                    key={col.key}
                                    className={`flex-1 flex justify-center ${
                                      !expandedCategories.includes(categoryId)
                                        ? "pointer-events-none"
                                        : ""
                                    }`}
                                  >
                                    <div
                                      className={`flex items-center justify-center ${
                                        expandedCategories.includes(categoryId)
                                          ? "visible"
                                          : "invisible"
                                      }`}
                                    >
                                      <div
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();

                                          const checked = !allEnabled;

                                          category.items.forEach((item) => {
                                            if (
                                              item[
                                                col.isKey as keyof ExtendedUserRight
                                              ]
                                            ) {
                                              handlePermissionChange(
                                                item.strUserRightGUID,
                                                item.strMenuGUID,
                                                item.strUserRoleGUID,
                                                col.key as keyof UserRightsBatchItem,
                                                checked
                                              );
                                            }
                                          });
                                        }}
                                        title={`Toggle ${col.label} permission for all items`}
                                      >
                                        <div
                                          className={cn(
                                            "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                            allEnabled
                                              ? "bg-primary"
                                              : "bg-input"
                                          )}
                                        >
                                          <span
                                            className={cn(
                                              "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                                              allEnabled
                                                ? "translate-x-5"
                                                : "translate-x-0"
                                            )}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 text-foreground border-border-color">
                            {(() => {
                              const parentItems: ExtendedUserRight[] = [];
                              const childrenByParent: Record<
                                string,
                                ExtendedUserRight[]
                              > = {};

                              category.items.forEach((item) => {
                                if (
                                  item.hasChildren ||
                                  !item.strParentMenuGUID
                                ) {
                                  parentItems.push(item);
                                } else {
                                  const parentId = item.strParentMenuGUID || "";
                                  if (!childrenByParent[parentId]) {
                                    childrenByParent[parentId] = [];
                                  }
                                  childrenByParent[parentId].push(item);
                                }
                              });

                              return parentItems.map((parent) => {
                                const anyPermissionsAvailable =
                                  parent.bolIsView ||
                                  parent.bolIsEdit ||
                                  parent.bolIsSave ||
                                  parent.bolIsDelete ||
                                  parent.bolIsPrint ||
                                  parent.bolIsExport ||
                                  parent.bolIsImport ||
                                  parent.bolIsApprove;

                                const children =
                                  childrenByParent[parent.strMenuGUID] || [];

                                return (
                                  <div key={parent.strMenuGUID}>
                                    {/* Parent item */}
                                    <div className="flex items-center py-3 px-4 border-b border-border-color transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                      <div className="flex-5 flex items-center">
                                        <span className="flex items-center">
                                          <span className="mr-2 text-muted-foreground">
                                            {children.length > 0 ? (
                                              <Folder size={14} />
                                            ) : (
                                              <FileIcon size={14} />
                                            )}
                                          </span>
                                          {parent.strMenuName ||
                                            parent.menuName ||
                                            "Unnamed Menu"}
                                        </span>
                                      </div>
                                      <div className="flex-1 flex justify-center items-center border-border-color pr-4 mr-6">
                                        {anyPermissionsAvailable ? (
                                          <AllColumnCheckbox
                                            checked={areAllPermissionsEnabled(
                                              parent
                                            )}
                                            disabled={false}
                                            onCheckedChange={(
                                              checked: boolean | "indeterminate"
                                            ) => {
                                              handleSelectAllPermissions(
                                                parent,
                                                Boolean(checked)
                                              );
                                            }}
                                            title="Toggle all permissions"
                                          />
                                        ) : (
                                          <div title="No permissions available for this menu item">
                                            <Minus
                                              size={18}
                                              className="text-muted-foreground"
                                            />
                                          </div>
                                        )}
                                      </div>
                                      {permissionColumns.map((col) => (
                                        <div
                                          key={col.key}
                                          className="flex-1 flex justify-center items-center"
                                        >
                                          {parent[
                                            col.isKey as keyof ExtendedUserRight
                                          ] ? (
                                            <CheckboxWrapper
                                              checked={getCurrentValue(
                                                parent,
                                                col.key as keyof Pick<
                                                  UserRightsBatchItem,
                                                  | "bolCanView"
                                                  | "bolCanEdit"
                                                  | "bolCanSave"
                                                  | "bolCanDelete"
                                                  | "bolCanPrint"
                                                  | "bolCanExport"
                                                  | "bolCanImport"
                                                  | "bolCanApprove"
                                                >
                                              )}
                                              disabled={false}
                                              title={`Allow ${col.label} access`}
                                              onCheckedChange={(
                                                checked:
                                                  | boolean
                                                  | "indeterminate"
                                              ) =>
                                                handlePermissionChange(
                                                  parent.strUserRightGUID,
                                                  parent.strMenuGUID,
                                                  parent.strUserRoleGUID,
                                                  col.key as keyof UserRightsBatchItem,
                                                  Boolean(checked)
                                                )
                                              }
                                            />
                                          ) : (
                                            <div
                                              title={`${col.label} access is not available for this menu item`}
                                            >
                                              <Minus
                                                size={18}
                                                className="text-muted-foreground"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {children.map((child, childIndex) => {
                                      const childPermissionsAvailable =
                                        child.bolIsView ||
                                        child.bolIsEdit ||
                                        child.bolIsSave ||
                                        child.bolIsDelete ||
                                        child.bolIsPrint ||
                                        child.bolIsExport ||
                                        child.bolIsImport ||
                                        child.bolIsApprove;

                                      const isLastChild =
                                        childIndex === children.length - 1;

                                      return (
                                        <div
                                          key={child.strMenuGUID}
                                          className={`flex items-center py-3 px-4 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted ${
                                            !isLastChild
                                              ? "border-b border-border-color"
                                              : ""
                                          }`}
                                        >
                                          <div className="flex-5 flex items-center">
                                            <span className="ml-8 flex items-center">
                                              <span className="mr-2 text-muted-foreground">
                                                <FileIcon size={14} />
                                              </span>
                                              {child.strMenuName ||
                                                child.menuName ||
                                                "Unnamed Menu"}
                                            </span>
                                          </div>
                                          <div className="flex-1 flex justify-center items-center border-border-color pr-4 mr-6">
                                            {childPermissionsAvailable ? (
                                              <AllColumnCheckbox
                                                checked={areAllPermissionsEnabled(
                                                  child
                                                )}
                                                disabled={false}
                                                onCheckedChange={(
                                                  checked:
                                                    | boolean
                                                    | "indeterminate"
                                                ) => {
                                                  // Toggle based on the current state of the checkbox
                                                  // This leverages the checkbox's internal state management
                                                  handleSelectAllPermissions(
                                                    child,
                                                    Boolean(checked)
                                                  );
                                                }}
                                                title="Toggle all permissions"
                                              />
                                            ) : (
                                              <div title="No permissions available for this menu item">
                                                <Minus
                                                  size={18}
                                                  className="text-muted-foreground"
                                                />
                                              </div>
                                            )}
                                          </div>
                                          {permissionColumns.map((col) => (
                                            <div
                                              key={col.key}
                                              className="flex-1 flex justify-center items-center"
                                            >
                                              {child[
                                                col.isKey as keyof ExtendedUserRight
                                              ] ? (
                                                <CheckboxWrapper
                                                  checked={getCurrentValue(
                                                    child,
                                                    col.key as keyof Pick<
                                                      UserRightsBatchItem,
                                                      | "bolCanView"
                                                      | "bolCanEdit"
                                                      | "bolCanSave"
                                                      | "bolCanDelete"
                                                      | "bolCanPrint"
                                                      | "bolCanExport"
                                                      | "bolCanImport"
                                                      | "bolCanApprove"
                                                    >
                                                  )}
                                                  disabled={false}
                                                  title={`Allow ${col.label} access`}
                                                  onCheckedChange={(
                                                    checked:
                                                      | boolean
                                                      | "indeterminate"
                                                  ) =>
                                                    handlePermissionChange(
                                                      child.strUserRightGUID,
                                                      child.strMenuGUID,
                                                      child.strUserRoleGUID,
                                                      col.key as keyof UserRightsBatchItem,
                                                      Boolean(checked)
                                                    )
                                                  }
                                                />
                                              ) : (
                                                <div
                                                  title={`${col.label} access is not available for this menu item`}
                                                >
                                                  <Minus
                                                    size={18}
                                                    className="text-muted-foreground"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              });
                            })()}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    }
                  )}
                </Accordion>
              </div>
            </div>
          ) : (
            <Card className="w-full overflow-hidden border shadow-sm">
              <CardContent className="p-6 text-center">
                {search ? (
                  <div className="py-8">
                    <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      No Results Found
                    </h3>
                    <p className="text-gray-500">
                      No menu items found matching "{search}".
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSearch("")}
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <div className="py-8">
                    <ShieldCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No Permissions Found
                    </h3>
                    <p className="text-gray-500">
                      No menu items found for this role.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </CustomContainer>
  );
};

export default UserRightsAccordion;
