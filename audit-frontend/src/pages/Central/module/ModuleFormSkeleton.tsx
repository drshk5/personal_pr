import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const ModuleFormSkeleton: React.FC = () => {
  const FormFieldSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full bg-white border rounded-md" />
    </div>
  );

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-8">
          {/* Top row with Image and Module Name side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6 md:items-end">
            {/* Module Image Upload - Left side */}
            <div className="gap-2 flex flex-col justify-end h-full">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-16 w-16 rounded-md mr-2" />
              <Skeleton className="h-9 w-full bg-white border rounded-md mt-2" />
            </div>

            {/* Module Name - Right side */}
            <FormFieldSkeleton />
          </div>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
            {/* SQL File Path field */}
            <FormFieldSkeleton />

            {/* Description field */}
            <FormFieldSkeleton />

            {/* Active status */}
            <div className="flex flex-row items-center justify-start gap-4">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-11 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4 bg-muted/20">
        <div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div>
          <Skeleton className="h-10 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
};