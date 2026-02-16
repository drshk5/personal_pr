import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const PicklistValueFormSkeleton: React.FC = () => {
  const FormFieldSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full bg-white border rounded-md" />
    </div>
  );

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Value field and Picklist Type in same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Value field */}
              <FormFieldSkeleton />

              {/* Picklist Type selection */}
              <FormFieldSkeleton />
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

        <CardFooter className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            {/* Delete button placeholder */}
            <div>
            </div>
            {/* Save button placeholder */}
            <div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};