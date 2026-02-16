import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  FormFieldSkeleton,
  SwitchFieldSkeleton,
} from "@/components/data-display/skeleton/form-field-skeleton";

export const UserFormSkeleton: React.FC = () => {
  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* First Row: Profile Photo centered */}
          <div className="flex justify-center mb-6">
            <div className="gap-2 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 border border-transparent" />
              <Skeleton className="h-4 w-40 mt-2" />
            </div>
          </div>

          {/* Second Row: Name, Email and Mobile Number */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* User Name */}
            <FormFieldSkeleton />

            {/* Email field */}
            <FormFieldSkeleton />

            {/* Mobile Number */}
            <FormFieldSkeleton />
          </div>

          {/* Third Row: Password and Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Password - We'll show this in the skeleton regardless of mode */}
            <FormFieldSkeleton />

            {/* User Role - We'll show this in the skeleton regardless of mode */}
            <FormFieldSkeleton />
          </div>

          {/* Fourth Row: Birth Date, Work Start and End Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Birth Date */}
            <FormFieldSkeleton />

            {/* Working Start Time */}
            <FormFieldSkeleton />

            {/* Working End Time */}
            <FormFieldSkeleton />
          </div>

          {/* Fifth Row: Is Active on the left side */}
          <div className="flex justify-start">
            {/* Is Active */}
            <SwitchFieldSkeleton />
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
