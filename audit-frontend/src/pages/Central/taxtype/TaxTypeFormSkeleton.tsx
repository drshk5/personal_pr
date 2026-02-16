import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const TaxTypeFormSkeleton: React.FC = () => {
  const FormFieldSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full bg-white border rounded-md" />
    </div>
  );

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax Type Code skeleton */}
            <FormFieldSkeleton />

            {/* Tax Type Name skeleton */}
            <FormFieldSkeleton />

            {/* Country dropdown skeleton */}
            <FormFieldSkeleton />

            {/* Is Compound Tax skeleton */}
            <div className="flex flex-row items-center justify-start gap-4">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-11 bg-white rounded-full" />
            </div>

            {/* Description textarea skeleton */}
            <div className="md:col-span-2 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full bg-white border rounded-md" />
            </div>

            {/* Active status skeleton */}
            <div className="flex flex-row items-center justify-start gap-4">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-11 bg-white rounded-full" />
            </div>
          </div>
          <Separator className="my-4" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-6">
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
