import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const UserRightsAccordionSkeleton: React.FC = () => {
  const permissionColumns = [
    "View",
    "Edit",
    "Save",
    "Delete",
    "Print",
    "Export",
    "Import",
  ];

  const CategorySkeleton = () => (
    <Card className="rounded-md mb-2 overflow-hidden">
      <div className="px-4 py-4 flex items-center w-full bg-muted/30">
        <div className="flex-5 flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 flex justify-center  pr-4 mr-6">
          <Skeleton className="h-6 w-11 rounded-full" />
        </div>
        {permissionColumns.map((_, index) => (
          <div key={index} className="flex-1 flex justify-center">
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="w-full space-y-4">
      <div className="mb-6">
        <div className="relative max-w-md">
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className="mb-2">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex items-center py-3 px-4 mb-2 font-medium bg-muted/50 dark:bg-muted/20 shadow-sm rounded-t-md">
        <div className="flex-5">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex-1 text-center border-r border-border pr-4 mr-6"></div>
        {permissionColumns.map((_, index) => (
          <div key={index} className="flex-1 text-center">
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {[1, 2, 3].map((categoryIndex) => (
          <CategorySkeleton key={categoryIndex} />
        ))}
      </div>
    </div>
  );
};

export const UserRightsTableSkeleton: React.FC = () => {
  return <UserRightsAccordionSkeleton />;
};
