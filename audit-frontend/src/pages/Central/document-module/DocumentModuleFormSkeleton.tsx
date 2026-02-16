import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import CustomContainer from "@/components/layout/custom-container";
import { FolderOpen } from "lucide-react";

export const DocumentModuleFormSkeleton: React.FC = () => {
  return (
    <CustomContainer>
      <PageHeader
        title="Loading Document Module..."
        description="Please wait while the data is being loaded"
        icon={FolderOpen}
      />

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Module Selection Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Module Name Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Active Status Skeleton */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-11" />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </CardFooter>
      </Card>
    </CustomContainer>
  );
};