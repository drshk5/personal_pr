import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const YearFormSkeleton: React.FC = () => {
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
          {/* Year Name - Full Width */}
          <FormFieldSkeleton />

          {/* Start Date and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <FormFieldSkeleton />

            {/* End Date */}
            <FormFieldSkeleton />
          </div>

          {/* Previous Year and Next Year Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Previous Year */}
            <FormFieldSkeleton />

            {/* Next Year */}
            <FormFieldSkeleton />
          </div>

          {/* Active Status */}
          <div className="flex flex-row items-center justify-start gap-4">
            <div className="space-y-0.5">
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-6 w-11 bg-white rounded-full" />
          </div>
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