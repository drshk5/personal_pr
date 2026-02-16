import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileIcon,
  Folder,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import type {
  UserRight,
  UserRightsBatchItem,
  MenuUserRightsTree,
} from "@/types/central/user-rights";

import { Modules, Actions } from "@/lib/permissions";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { WithPermission } from "@/components/ui/with-permission";
import CustomContainer from "@/components/layout/custom-container";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";

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
}

interface GroupedRights {
  [category: string]: {
    categoryName: string;
    items: ExtendedUserRight[];
  };
}

interface UserRightsAccordionMobileProps {
  roleId: string | null;
  roleName: string;
  userRights: ExtendedUserRight[];
  groupedRights: GroupedRights;
  isLoading: boolean;
  isSubmitting: boolean;
  search: string;
  setSearch: (value: string) => void;
  modifiedRights: Record<string, UserRightsBatchItem>;
  handlePermissionChange: (
    rightId: string,
    menuId: string,
    roleId: string,
    field: keyof UserRightsBatchItem,
    value: boolean
  ) => void;
  getCurrentValue: (
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
  ) => boolean;
  handleSubmit: () => void;
  isSaving: boolean;
}

const UserRightsAccordionMobile: React.FC<UserRightsAccordionMobileProps> = ({
  roleId,
  roleName,
  userRights,
  groupedRights,
  isLoading,
  isSubmitting,
  search,
  setSearch,
  modifiedRights,
  handlePermissionChange,
  getCurrentValue,
  handleSubmit,
  isSaving,
}) => {
  const navigate = useNavigate();
  const handleBack = () => navigate("/user-role");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedMenuItems, setExpandedMenuItems] = useState<string[]>([]);

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

  const toggleMenuItem = (menuId: string) => {
    setExpandedMenuItems((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
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
      right.bolIsImport;

    if (!hasAnyPermissionAvailable) return false;

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

    return true;
  };

  const getEnabledPermissionsCount = (right: ExtendedUserRight): number => {
    let count = 0;
    if (right.bolIsView && getCurrentValue(right, "bolCanView")) count++;
    if (right.bolIsEdit && getCurrentValue(right, "bolCanEdit")) count++;
    if (right.bolIsSave && getCurrentValue(right, "bolCanSave")) count++;
    if (right.bolIsDelete && getCurrentValue(right, "bolCanDelete")) count++;
    if (right.bolIsPrint && getCurrentValue(right, "bolCanPrint")) count++;
    if (right.bolIsExport && getCurrentValue(right, "bolCanExport")) count++;
    if (right.bolIsImport && getCurrentValue(right, "bolCanImport")) count++;
    return count;
  };

  const getAvailablePermissionsCount = (right: ExtendedUserRight): number => {
    let count = 0;
    if (right.bolIsView) count++;
    if (right.bolIsEdit) count++;
    if (right.bolIsSave) count++;
    if (right.bolIsDelete) count++;
    if (right.bolIsPrint) count++;
    if (right.bolIsExport) count++;
    if (right.bolIsImport) count++;
    return count;
  };

  if (isSaving) {
    return (
      <CustomContainer>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer>
      <div className="pb-32">
        {/* Mobile Header */}
        <div className="sticky top-0 z-20 bg-background border-b border-border-color pb-3">
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold line-clamp-1 text-foreground">
                {isLoading ? "Loading..." : roleName || "User Role Permissions"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {userRights.length} menu items
              </p>
            </div>
          </div>

          <SearchInput
            placeholder="Search menus..."
            onSearchChange={setSearch}
            debounceDelay={300}
            className="w-full"
          />
        </div>

        {/* Content */}
        <div className="mt-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : userRights && userRights.length > 0 ? (
            <Accordion
              type="multiple"
              value={expandedCategories}
              onValueChange={setExpandedCategories}
              className="space-y-2"
            >
              {Object.entries(groupedRights).map(([categoryId, category]) => {
                return (
                  <AccordionItem
                    value={categoryId}
                    key={categoryId}
                    className="border border-border-color rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline bg-sidebar/50">
                      <div className="flex items-center justify-between w-full gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm truncate text-foreground">
                            {category.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedCategories.includes(categoryId) && (
                            <Switch
                              checked={
                                category.items.length > 0 &&
                                category.items.every((item) =>
                                  areAllPermissionsEnabled(item)
                                )
                              }
                              onCheckedChange={(checked) => {
                                category.items.forEach((item) => {
                                  handleSelectAllPermissions(item, checked);
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {category.items.length}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      {(() => {
                        const parentItems: ExtendedUserRight[] = [];
                        const childrenByParent: Record<
                          string,
                          ExtendedUserRight[]
                        > = {};

                        category.items.forEach((item) => {
                          if (item.hasChildren || !item.strParentMenuGUID) {
                            parentItems.push(item);
                          } else {
                            const parentId = item.strParentMenuGUID || "";
                            if (!childrenByParent[parentId]) {
                              childrenByParent[parentId] = [];
                            }
                            childrenByParent[parentId].push(item);
                          }
                        });

                        return parentItems.map((parent, parentIndex) => {
                          const children =
                            childrenByParent[parent.strMenuGUID] || [];
                          const isExpanded = expandedMenuItems.includes(
                            parent.strMenuGUID
                          );
                          const enabledCount =
                            getEnabledPermissionsCount(parent);
                          const availableCount =
                            getAvailablePermissionsCount(parent);

                          return (
                            <div
                              key={parent.strMenuGUID}
                              className={cn(
                                "border-t border-border-color",
                                parentIndex === parentItems.length - 1 &&
                                  !isExpanded
                                  ? "border-b-0"
                                  : ""
                              )}
                            >
                              {/* Parent Menu Item */}
                              <div
                                className="px-4 py-3 bg-background"
                                onClick={() =>
                                  toggleMenuItem(parent.strMenuGUID)
                                }
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <div className="mt-1">
                                      {children.length > 0 ? (
                                        <ChevronRight
                                          className={cn(
                                            "h-4 w-4 text-foreground transition-transform",
                                            isExpanded && "rotate-90"
                                          )}
                                        />
                                      ) : (
                                        <FileIcon className="h-4 w-4 text-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium line-clamp-2 text-foreground">
                                        {parent.strMenuName ||
                                          parent.menuName ||
                                          "Unnamed Menu"}
                                      </p>
                                      {availableCount > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {enabledCount} / {availableCount}{" "}
                                          permissions
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {availableCount > 0 && (
                                    <div
                                      className="mt-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Switch
                                        checked={areAllPermissionsEnabled(
                                          parent
                                        )}
                                        onCheckedChange={(checked) => {
                                          handleSelectAllPermissions(
                                            parent,
                                            checked
                                          );
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Permissions Grid */}
                                {isExpanded && (
                                  <div
                                    className="mt-3 space-y-2 pl-6"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {permissionColumns.map((col) => {
                                      const isAvailable = Boolean(
                                        parent[
                                          col.isKey as keyof ExtendedUserRight
                                        ]
                                      );
                                      const isEnabled = getCurrentValue(
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
                                      );

                                      return (
                                        <div
                                          key={col.key}
                                          className={cn(
                                            "flex items-center justify-between py-2 px-3 rounded-md",
                                            isAvailable
                                              ? "bg-muted/50"
                                              : "bg-muted/30 opacity-50"
                                          )}
                                        >
                                          <span className="text-sm text-foreground">
                                            {col.label}
                                          </span>
                                          <Switch
                                            checked={isEnabled}
                                            disabled={!isAvailable}
                                            onCheckedChange={(checked) => {
                                              if (isAvailable) {
                                                handlePermissionChange(
                                                  parent.strUserRightGUID,
                                                  parent.strMenuGUID,
                                                  parent.strUserRoleGUID,
                                                  col.key as keyof UserRightsBatchItem,
                                                  checked
                                                );
                                              }
                                            }}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Child Menu Items */}
                              {children.length > 0 && isExpanded && (
                                <div className="bg-muted/30">
                                  {children.map((child, childIndex) => {
                                    const childExpanded =
                                      expandedMenuItems.includes(
                                        child.strMenuGUID
                                      );
                                    const childEnabledCount =
                                      getEnabledPermissionsCount(child);
                                    const childAvailableCount =
                                      getAvailablePermissionsCount(child);

                                    return (
                                      <div
                                        key={child.strMenuGUID}
                                        className={cn(
                                          childIndex > 0 &&
                                            "border-t border-border-color"
                                        )}
                                      >
                                        <div
                                          className="px-4 py-3 pl-12"
                                          onClick={() =>
                                            toggleMenuItem(child.strMenuGUID)
                                          }
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                              <FileIcon className="h-4 w-4 text-muted-foreground mt-1" />
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm line-clamp-2 text-foreground">
                                                  {child.strMenuName ||
                                                    child.menuName ||
                                                    "Unnamed Menu"}
                                                </p>
                                                {childAvailableCount > 0 && (
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    {childEnabledCount} /{" "}
                                                    {childAvailableCount}{" "}
                                                    permissions
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            {childAvailableCount > 0 && (
                                              <div
                                                className="mt-1"
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                              >
                                                <Switch
                                                  checked={areAllPermissionsEnabled(
                                                    child
                                                  )}
                                                  onCheckedChange={(
                                                    checked
                                                  ) => {
                                                    handleSelectAllPermissions(
                                                      child,
                                                      checked
                                                    );
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </div>

                                          {/* Child Permissions Grid */}
                                          {childExpanded && (
                                            <div
                                              className="mt-3 space-y-2"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              {permissionColumns.map((col) => {
                                                const isAvailable = Boolean(
                                                  child[
                                                    col.isKey as keyof ExtendedUserRight
                                                  ]
                                                );
                                                const isEnabled =
                                                  getCurrentValue(
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
                                                  );

                                                return (
                                                  <div
                                                    key={col.key}
                                                    className={cn(
                                                      "flex items-center justify-between py-2 px-3 rounded-md",
                                                      isAvailable
                                                        ? "bg-background"
                                                        : "bg-muted/30 opacity-50"
                                                    )}
                                                  >
                                                    <span className="text-sm text-foreground">
                                                      {col.label}
                                                    </span>
                                                    <Switch
                                                      checked={isEnabled}
                                                      disabled={!isAvailable}
                                                      onCheckedChange={(
                                                        checked
                                                      ) => {
                                                        if (isAvailable) {
                                                          handlePermissionChange(
                                                            child.strUserRightGUID,
                                                            child.strMenuGUID,
                                                            child.strUserRoleGUID,
                                                            col.key as keyof UserRightsBatchItem,
                                                            checked
                                                          );
                                                        }
                                                      }}
                                                    />
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                {search ? (
                  <div className="py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base font-medium text-foreground mb-1">
                      No Results Found
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      No menu items found matching "{search}".
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearch("")}
                    >
                      Clear Search
                    </Button>
                  </div>
                ) : (
                  <div className="py-8">
                    <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-base font-medium text-foreground mb-1">
                      No Permissions Found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      No menu items found for this role.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Fixed Bottom Save Button */}
        {roleId && Object.keys(modifiedRights).length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border-color z-30">
            <WithPermission
              module={Modules.USER_PRIVILEGE}
              action={Actions.SAVE}
            >
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={
                  isSubmitting || Object.keys(modifiedRights).length === 0
                }
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
                {Object.keys(modifiedRights).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.keys(modifiedRights).length}
                  </Badge>
                )}
              </Button>
            </WithPermission>
          </div>
        )}
      </div>
    </CustomContainer>
  );
};

export default UserRightsAccordionMobile;
