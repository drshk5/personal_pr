import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const GeneralAccountFormSkeleton: React.FC = () => {
  const FormFieldSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full bg-white border rounded-md" />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Account Name, Type and Schedule in same row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Account Name */}
              <FormFieldSkeleton />

              {/* Account Type */}
              <FormFieldSkeleton />

              {/* Schedule */}
              <FormFieldSkeleton />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full bg-white border rounded-md" />
            </div>

            {/* Is Active toggle */}
            <div className="flex flex-row items-center justify-start gap-4">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-11 bg-white rounded-full" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t px-6 py-4 bg-muted/20">
          <div className="flex items-center justify-between w-full">
            {/* Delete button placeholder */}
            <div>
            </div>
            <div className="flex gap-2">
              {/* Save button placeholder */}
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};