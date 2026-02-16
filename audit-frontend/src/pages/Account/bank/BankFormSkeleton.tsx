import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const BankFormSkeleton: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="p-6 pt-6">
        <div className="flex flex-col gap-6">
          {/* ROW 1: Account Name, Account Code, and Currency Type */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Account Code */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Currency Type Dropdown */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 2: Account Type and Bank Name */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Type Dropdown */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Bank Name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 3: Account Number, IFSC Code, Branch Name */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Number */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* IFSC Code */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Branch Name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 4: Description */}
          <div className="w-full">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-30 w-full" />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t px-6 py-4 bg-muted/20">
        <div className="flex w-full justify-between">
          <div>
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
