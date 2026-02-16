import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const GroupFormSkeleton: React.FC = () => {
  const FormFieldSkeleton = () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-full bg-white border rounded-md" />
    </div>
  );

  return (
    <Card className="mt-6 border border-border shadow-md rounded-xl bg-card hover:border-muted-foreground/20 transition-all duration-200">
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Top row with Logo and Group Name side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-6 md:items-end">
            {/* Logo File Upload - Left side */}
            <div className="gap-2 flex flex-col justify-end h-full">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-16 w-16 rounded-md mr-2" />
              <Skeleton className="h-9 w-full bg-white border rounded-md mt-2" />
            </div>

            {/* Group Name - Right side */}
            <FormFieldSkeleton />
          </div>

          {/* License details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* License Number */}
            <FormFieldSkeleton />

            {/* License Issue Date */}
            <FormFieldSkeleton />

            {/* License Expiry Date */}
            <FormFieldSkeleton />
          </div>

          {/* ID details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PAN */}
            <FormFieldSkeleton />

            {/* TAN */}
            <FormFieldSkeleton />

            {/* CIN */}
            <FormFieldSkeleton />
          </div>

          {/* Additional details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* UDF Code */}
            <FormFieldSkeleton />

            {/* Industry */}
            <FormFieldSkeleton />

            {/* Legal Status Type */}
            <FormFieldSkeleton />
          </div>

          {/* Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Currency Type */}
            <FormFieldSkeleton />
          </div>

          {/* Admin details section - conditional for new groups */}
          <div className="space-y-4">
            <div className="border-t pt-4">
              <Skeleton className="h-5 w-48" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admin Name */}
              <FormFieldSkeleton />

              {/* Admin Email */}
              <FormFieldSkeleton />

              {/* Admin Mobile */}
              <FormFieldSkeleton />

              {/* Admin Password */}
              <FormFieldSkeleton />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t px-6 py-4 bg-muted/20">
        <div className="flex items-center justify-between w-full">
          {/* Delete button placeholder */}
          <div>
            <Skeleton className="h-10 w-24" />
          </div>
          {/* Save button placeholder */}
          <div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};