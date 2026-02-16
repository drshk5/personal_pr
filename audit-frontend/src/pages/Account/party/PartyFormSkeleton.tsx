import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const PartyFormSkeleton: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="p-6 pt-6">
        <div className="flex flex-col gap-6">
          {/* ROW 1: Party Name, Party Type, and Display Name */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Party Name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Party Type */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 2: Email, Phone, PAN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Email */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* PAN */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 3: Currency Type, Payment Terms, Website */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Currency Type */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Payment Terms */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 4: Department, Designation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Designation */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 5: Social Media */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Twitter */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Skype */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Facebook */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 6: Interest Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interest Rate */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* ROW 7: Remarks */}
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
