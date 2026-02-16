import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building, ArrowLeft, Save } from "lucide-react";

import { useGroup } from "@/hooks/api/central/use-groups";
import { useModulesByGroup } from "@/hooks/api/central/use-group-modules";
import { useMenusByGroupAndModule } from "@/hooks/api/central/use-master-menus";
import { useUpdateBulkMenuRights } from "@/hooks/api/central/use-menus";
import { useTableLayout } from "@/hooks/common/use-table-layout";

import type { MenuRightsBatch } from "@/types/central/menu";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Label } from "@/components/ui/label";

interface MenuPermission {
  strMasterMenuGUID: string;
  strParentMenuGUID?: string | null;
  strModuleGUID?: string | null;
  dblSeqNo: number;
  strName: string;
  strPath: string;
  strMenuPosition: string;
  strMapKey: string;
  bolHasSubMenu: boolean;
  strIconName?: string | null;
  bolIsActive: boolean;
  strGroupGUID?: string;
  strMenuGUID?: string | null;
  hasMenuRights?: boolean;
  bolRightGiven: boolean;
  children: MenuPermission[];
  level?: number;
}

const GroupModulePermission: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupGuid = searchParams.get("strGroupGUID");
  const [groupName, setGroupName] = useState("");
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([]);
  const [selectedModuleGuid, setSelectedModuleGuid] = useState<string>("");
  const [changedMenus, setChangedMenus] = useState<Set<string>>(new Set());
  const [changedPermissions, setChangedPermissions] = useState<string[]>([]);

  const defaultColumnOrder = ["strName", "bolRightGiven"];

  const {
    columnVisibility,
    isTextWrapped,
    pinnedColumns,
    columnOrder,
    columnWidths,
    setColumnWidths,
  } = useTableLayout("group-module-permission", defaultColumnOrder, []);

  const {
    mutate: updateBulkMenuRights,
    isPending: isSaving,
    isSuccess,
  } = useUpdateBulkMenuRights();

  const handleSavePermissions = () => {
    if (!groupGuid || !selectedModuleGuid) {
      return;
    }

    const menuRightsList: MenuRightsBatch[] = menuPermissions
      .filter(
        (menu) =>
          !menu.strParentMenuGUID ||
          !menuPermissions.some(
            (m) => m.strMasterMenuGUID === menu.strParentMenuGUID
          )
      )
      .filter((menu) => {
        if (changedMenus.has(menu.strMasterMenuGUID)) {
          return true;
        }

        const hasChangedChildren = (parent: MenuPermission): boolean => {
          const directChildren = menuPermissions.filter(
            (m) => m.strParentMenuGUID === parent.strMasterMenuGUID
          );

          return directChildren.some(
            (child) =>
              changedMenus.has(child.strMasterMenuGUID) ||
              hasChangedChildren(child)
          );
        };

        return hasChangedChildren(menu);
      })
      .map((menu) => {
        const {
          strMasterMenuGUID,
          strParentMenuGUID,
          strModuleGUID,
          dblSeqNo,
          strName,
          strPath,
          strMenuPosition,
          strMapKey,
          bolHasSubMenu,
          strIconName,
          bolIsActive,
          strMenuGUID,
          hasMenuRights,
          bolRightGiven,
        } = menu;
        const result = {
          strMasterMenuGUID,
          strParentMenuGUID,
          strModuleGUID,
          dblSeqNo,
          strName,
          strPath,
          strMenuPosition,
          strMapKey,
          bolHasSubMenu,
          strIconName,
          bolIsActive,
          strGroupGUID: menu.strGroupGUID || (groupGuid as string),
          strMenuGUID,
          hasMenuRights,
          bolRightGiven,
          children: (() => {
            const buildChildrenTree = (parentId: string): MenuRightsBatch[] => {
              const directChildren = menuPermissions.filter(
                (m) => m.strParentMenuGUID === parentId
              );

              return directChildren.map((child) => ({
                ...child,
                strGroupGUID: child.strGroupGUID || (groupGuid as string),
                children: buildChildrenTree(child.strMasterMenuGUID),
              })) as unknown as MenuRightsBatch[];
            };

            return buildChildrenTree(menu.strMasterMenuGUID);
          })(),
        };

        return result as unknown as MenuRightsBatch;
      });
    updateBulkMenuRights({
      menuRights: menuRightsList,
      moduleGuid: selectedModuleGuid,
      groupGuid: groupGuid || undefined,
    });
  };

  const { data: groupData } = useGroup(groupGuid || undefined);

  const { data: moduleInfoData, isLoading: isModulesLoading } =
    useModulesByGroup(groupGuid || undefined);
  const {
    data: menusByGroupAndModuleRaw,
    isLoading: isMenusLoading,
    refetch: refetchMenus,
  } = useMenusByGroupAndModule(
    groupGuid || undefined,
    selectedModuleGuid || undefined
  );

  // Helper function to find a menu item in the nested structure by GUID
  const findMenuItemByGuid = useCallback(
    (guid: string): MenuPermission | null => {
      if (!menusByGroupAndModuleRaw?.data?.items) {
        return null;
      }

      const findInItems = (items: MenuPermission[]): MenuPermission | null => {
        for (const item of items) {
          if (item.strMasterMenuGUID === guid) {
            return item;
          }

          if (
            item.children &&
            Array.isArray(item.children) &&
            item.children.length > 0
          ) {
            const found = findInItems(item.children);
            if (found) {
              return found;
            }
          }
        }
        return null;
      };

      return findInItems(menusByGroupAndModuleRaw.data.items);
    },
    [menusByGroupAndModuleRaw]
  );

  const handlePermissionToggle = useCallback(
    (menuGuid: string, checked: boolean) => {
      let affectedGuids = [menuGuid];

      const findAllChildMenuGuids = (
        parentGuid: string,
        result: string[] = []
      ): string[] => {
        const children = menuPermissions.filter(
          (menu) => menu.strParentMenuGUID === parentGuid
        );

        for (const child of children) {
          result.push(child.strMasterMenuGUID);
          findAllChildMenuGuids(child.strMasterMenuGUID, result);
        }

        return result;
      };

      const findParentMenuGuid = (childGuid: string): string | null => {
        const childMenu = menuPermissions.find(
          (m) => m.strMasterMenuGUID === childGuid
        );
        return childMenu?.strParentMenuGUID || null;
      };

      const areAllChildrenOff = (
        parentGuid: string,
        currentToggleGuid: string,
        newValue: boolean
      ): boolean => {
        const children = menuPermissions.filter(
          (m) => m.strParentMenuGUID === parentGuid
        );

        return children.every((child) => {
          if (child.strMasterMenuGUID === currentToggleGuid) {
            return !newValue;
          }
          return !child.bolRightGiven;
        });
      };

      const menu = menuPermissions.find(
        (m) => m.strMasterMenuGUID === menuGuid
      );
      if (menu && menu.bolHasSubMenu) {
        const childGuids = findAllChildMenuGuids(menuGuid);
        affectedGuids = [...affectedGuids, ...childGuids];
      }

      if (checked && menu?.strParentMenuGUID) {
        let currentParentGuid: string | null = menu.strParentMenuGUID;
        const parentChain = [];

        while (currentParentGuid) {
          parentChain.push(currentParentGuid);
          affectedGuids.push(currentParentGuid);
          currentParentGuid = findParentMenuGuid(currentParentGuid);
        }
      }

      if (!checked && menu?.strParentMenuGUID) {
        const parentMenuGuid = menu.strParentMenuGUID;

        if (areAllChildrenOff(parentMenuGuid, menuGuid, checked)) {
          affectedGuids.push(parentMenuGuid);

          let currentParentGuid: string | null = parentMenuGuid;
          let grandparentGuid = findParentMenuGuid(currentParentGuid);

          while (grandparentGuid) {
            if (areAllChildrenOff(grandparentGuid, currentParentGuid, false)) {
              affectedGuids.push(grandparentGuid);
              currentParentGuid = grandparentGuid;
              grandparentGuid = findParentMenuGuid(currentParentGuid);
            } else {
              break;
            }
          }
        }
      }

      setMenuPermissions((prevMenus) => {
        const updatedMenus = prevMenus.map((menu) =>
          affectedGuids.includes(menu.strMasterMenuGUID)
            ? { ...menu, bolRightGiven: checked }
            : menu
        );
        setChangedMenus((prev) => {
          const newSet = new Set(prev);

          affectedGuids.forEach((guid) => {
            const menu = updatedMenus.find((m) => m.strMasterMenuGUID === guid);

            const originalMenu = menuPermissions.find(
              (m) => m.strMasterMenuGUID === guid
            );
            if (
              menu &&
              originalMenu &&
              menu.bolRightGiven === originalMenu.bolRightGiven
            ) {
              newSet.delete(guid);
            } else {
              newSet.add(guid);
            }
          });
          return newSet;
        });

        // Update changedPermissions array by simply tracking affected items
        setChangedPermissions((prev) => {
          // Create a new array that will have all the affected guids
          let newPermissions = [...prev];

          // Find which guids have actually changed from their original state
          const changedGuids = affectedGuids.filter((guid) => {
            const menu = updatedMenus.find((m) => m.strMasterMenuGUID === guid);
            // Compare the new state with the menu's original state
            const initialMenu = findMenuItemByGuid(guid);

            // If menu state differs from original, it's changed
            return (
              menu &&
              initialMenu &&
              menu.bolRightGiven !== initialMenu.bolRightGiven
            );
          });

          // Add new guids that aren't already in the array
          changedGuids.forEach((guid) => {
            if (!newPermissions.includes(guid)) {
              newPermissions.push(guid);
            }
          });

          // Remove guids that aren't changed anymore
          newPermissions = newPermissions.filter((guid) => {
            const menu = updatedMenus.find((m) => m.strMasterMenuGUID === guid);
            const initialMenu = findMenuItemByGuid(guid);

            return (
              menu &&
              initialMenu &&
              menu.bolRightGiven !== initialMenu.bolRightGiven
            );
          });
          return newPermissions;
        });
        return updatedMenus;
      });
    },
    [menuPermissions, findMenuItemByGuid]
  );

  useEffect(() => {
    if (groupData) {
      setGroupName(groupData.strName);
    }
  }, [groupData]);

  useEffect(() => {
    // Initialize the first module as selected when data is loaded
    if (
      moduleInfoData &&
      Array.isArray(moduleInfoData) &&
      moduleInfoData.length > 0 &&
      !selectedModuleGuid
    ) {
      setSelectedModuleGuid(moduleInfoData[0].strModuleGUID);
    }
  }, [moduleInfoData, selectedModuleGuid]);

  useEffect(() => {
    if (isSuccess) {
      setChangedMenus(new Set());
      setChangedPermissions([]);
      refetchMenus();
    }
  }, [isSuccess, refetchMenus]);

  useEffect(() => {
    if (menusByGroupAndModuleRaw && selectedModuleGuid) {
      const processedMenus: MenuPermission[] = [];
      // Extract items array from the API response structure
      const menuItems = menusByGroupAndModuleRaw?.data?.items || [];
      if (menuItems.length === 0) {
        setMenuPermissions([]);
        return;
      }

      const processMenuItems = (items: MenuPermission[], level: number = 0) => {
        if (!items || !Array.isArray(items)) {
          return;
        }

        items.forEach((menu) => {
          const processedMenu: MenuPermission = {
            ...menu,
            level,
          };

          processedMenus.push(processedMenu);

          if (
            menu.children &&
            Array.isArray(menu.children) &&
            menu.children.length > 0
          ) {
            processMenuItems(menu.children, level + 1);
          }
        });
      };

      processMenuItems(menuItems);
      setMenuPermissions(processedMenus);
    }
  }, [menusByGroupAndModuleRaw, selectedModuleGuid]);

  const handleToggleAllPermissions = (checked: boolean) => {
    setMenuPermissions((prevMenus) => {
      const updatedMenus = prevMenus.map((menu) => ({
        ...menu,
        bolRightGiven: checked,
      }));

      setChangedMenus(() => {
        const newSet = new Set<string>();

        updatedMenus.forEach((menu) => {
          const originalMenu = menuPermissions.find(
            (m) => m.strMasterMenuGUID === menu.strMasterMenuGUID
          );
          if (
            originalMenu &&
            menu.bolRightGiven !== originalMenu.bolRightGiven
          ) {
            newSet.add(menu.strMasterMenuGUID);
          }
        });

        return newSet;
      });

      // Update changedPermissions array based on what's actually changed from initial state
      setChangedPermissions(() => {
        // Find all guids that have changed compared to their initial state
        const changedGuids = menuPermissions
          .filter((menu) => {
            // Find the original menu from the raw data to compare
            const initialMenu = findMenuItemByGuid(menu.strMasterMenuGUID); // If the new state is different from the original state, it's changed
            const hasChanged =
              initialMenu && checked !== initialMenu.bolRightGiven;
            return hasChanged;
          })
          .map((menu) => menu.strMasterMenuGUID);

        return changedGuids;
      });

      return updatedMenus;
    });
  };

  const columns = useMemo<DataTableColumn<MenuPermission>[]>(() => {
    const renderPermissionSwitch = (item: MenuPermission) => (
      <div className="text-center">
        <Switch
          checked={item.bolRightGiven}
          onCheckedChange={(checked) =>
            handlePermissionToggle(item.strMasterMenuGUID, checked)
          }
        />
      </div>
    );

    const renderMenuName = (item: MenuPermission) => {
      const getTextClass = () => {
        return isTextWrapped ? "whitespace-normal wrap-break-word" : "truncate";
      };

      return (
        <div
          className={`font-medium flex items-center ${getTextClass()}`}
          style={{ paddingLeft: `${item.level ? item.level * 20 : 0}px` }}
        >
          {item.strName}
          {item.bolHasSubMenu && (
            <span className="ml-1 text-xs text-gray-500">(parent)</span>
          )}
        </div>
      );
    };

    const baseColumns: DataTableColumn<MenuPermission>[] = [
      {
        key: "strName",
        header: "Page Name",
        cell: renderMenuName,
      },
      {
        key: "bolRightGiven",
        header: "Permission",
        cell: renderPermissionSwitch,
        width: "120px",
      },
    ];

    return baseColumns;
  }, [isTextWrapped, handlePermissionToggle]);

  const orderedColumns = useMemo(() => {
    const columnMap = new Map(columns.map((col) => [col.key, col]));
    const ordered = columnOrder
      .map((key: string) => columnMap.get(key))
      .filter(
        (
          col: DataTableColumn<MenuPermission> | undefined
        ): col is DataTableColumn<MenuPermission> => col !== undefined
      );

    columns.forEach((col) => {
      if (!columnOrder.includes(col.key)) {
        ordered.push(col);
      }
    });

    return ordered;
  }, [columns, columnOrder]);

  return (
    <CustomContainer>
      <PageHeader
        title={`Menu List for ${groupName || "Group"}`}
        description="View menu structure for this group"
        icon={Building}
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate("/group")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Button>
            {selectedModuleGuid && menuPermissions.length > 0 && (
              <Button
                className="bg-primary hover:bg-primary/90"
                disabled={isSaving || changedPermissions.length === 0}
                onClick={() => {
                  handleSavePermissions();
                }}
              >
                <div className="relative mr-2 w-4 h-4 flex items-center justify-center">
                  {isSaving && (
                    <div className="absolute inset-0 animate-spin border-t-2 border-b-2 border-white rounded-full"></div>
                  )}
                  <Save className="h-4 w-4" />
                </div>
                {isSaving ? "Saving..." : "Save Permissions"}
                {changedPermissions.length > 0 && (
                  <span className="ml-2 bg-white text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    {changedPermissions.length}
                  </span>
                )}
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="w-64">
            <Label className="text-sm font-medium mb-1 block">
              Select Module
            </Label>
            <Select
              value={selectedModuleGuid}
              onValueChange={(value) => {
                setSelectedModuleGuid(value);
                setChangedMenus(new Set());
                setChangedPermissions([]);
              }}
              disabled={!moduleInfoData || moduleInfoData.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent>
                {moduleInfoData &&
                  moduleInfoData.map((module) => (
                    <SelectItem
                      key={module.strModuleGUID}
                      value={module.strModuleGUID}
                    >
                      {module.strModuleName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Menu Permissions</span>
            {selectedModuleGuid && menuPermissions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  Toggle All Permissions:
                </span>
                <Switch
                  checked={
                    menuPermissions.length > 0 &&
                    menuPermissions.every((menu) => menu.bolRightGiven)
                  }
                  onCheckedChange={handleToggleAllPermissions}
                  aria-label="Toggle all permissions"
                />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isModulesLoading || isMenusLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full mx-auto mb-4"></div>
                <p>Loading menus...</p>
              </div>
            </div>
          ) : !selectedModuleGuid ? (
            <div className="py-8 text-center text-muted-foreground">
              Please select a module to view menus
            </div>
          ) : (
            <DataTable<MenuPermission>
              columns={orderedColumns}
              data={menuPermissions}
              keyExtractor={(item) => item.strMasterMenuGUID}
              emptyState={
                <div className="py-8 text-center text-muted-foreground">
                  No menu items found for this module
                </div>
              }
              onSort={() => {}}
              loading={isModulesLoading || isMenusLoading}
              columnVisibility={columnVisibility}
              isTextWrapped={isTextWrapped}
              pinnedColumns={pinnedColumns}
              columnWidths={columnWidths}
              onColumnWidthsChange={setColumnWidths}
            />
          )}
        </CardContent>
      </Card>
    </CustomContainer>
  );
};

export default GroupModulePermission;
