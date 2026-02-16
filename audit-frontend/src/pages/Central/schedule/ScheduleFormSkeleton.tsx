import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export const ScheduleFormSkeleton: React.FC = () => {
  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Schedule Code field skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 mb-1" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>

            {/* Schedule Name field skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 mb-1" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>

            {/* Reference No. field skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mb-1" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>

            {/* Parent Schedule field skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 mb-1" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Dropdown */}
            </div>

            {/* Template Name field skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 mb-1" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>

            {/* Chart Type field skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 mb-1" /> {/* Label */}
              <Skeleton className="h-10 w-full" /> {/* Input */}
            </div>

            {/* Active status skeleton */}
            <div className="flex flex-row items-center justify-start gap-4">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-12" /> {/* Label */}
              </div>
              <Skeleton className="h-5 w-10 rounded-full" /> {/* Switch */}
            </div>

            {/* Editable status skeleton */}
            <div className="flex flex-row items-center justify-start gap-4">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-16" /> {/* Label */}
              </div>
              <Skeleton className="h-5 w-10 rounded-full" /> {/* Switch */}
            </div>
          </div>
          <Separator className="my-4" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-6">
        <div>
          <Skeleton className="h-10 w-24" /> {/* Delete button */}
        </div>
        <div>
          <Skeleton className="h-10 w-28" /> {/* Save button */}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ScheduleFormSkeleton;