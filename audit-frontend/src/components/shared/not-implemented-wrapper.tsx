import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MenuItem } from "@/types/central/user-rights";

interface NotImplementedWrapperProps {
  menuItem?: MenuItem;
}

const NotImplementedWrapper: React.FC<NotImplementedWrapperProps> = ({
  menuItem,
}) => {
  // Default menu item to use if none provided
  const defaultMenuItem: MenuItem = {
    strName: "Unknown Page",
    strPath: "",
    strMapKey: "",
    strMenuPosition: "sidebar",
    strIconName: "HelpCircle",
    dblSeqNo: 0,
    bolHasSubMenu: false,
    children: [],
    permission: {
      bolCanView: true,
      bolCanEdit: false,
      bolCanDelete: false,
      bolCanSave: false,
      bolCanPrint: false,
      bolCanExport: false,
      bolCanImport: false,
      bolCanApprove: false,
      bolIsApprove: false,
      bolIsImport: false,
      bolIsExport: false,
      bolIsPrint: false,
      bolIsSave: false,
      bolIsDelete: false,
      bolIsEdit: false,
      bolIsView: true,
    },
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>{menuItem?.strName || defaultMenuItem.strName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This page has not been implemented yet.
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
            <h2 className="text-md font-semibold mb-2 text-foreground">Menu Item Details:</h2>
            <pre className="text-sm text-foreground">
              {JSON.stringify(menuItem || defaultMenuItem, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotImplementedWrapper;
