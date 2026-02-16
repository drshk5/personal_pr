import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const DocTypeFormSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Code field skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        
        {/* Name field skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Active status field skeleton */}
        <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5">
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <div className="space-x-2">
          <Skeleton className="h-10 w-24 inline-block" />
          <Skeleton className="h-10 w-24 inline-block" />
        </div>
      </CardFooter>
    </Card>
  );
};