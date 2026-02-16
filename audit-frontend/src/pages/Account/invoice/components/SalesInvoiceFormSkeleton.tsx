import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const InvoiceFormSkeleton: React.FC = () => {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-8 w-50" />
          </div>
          <Skeleton className="h-4 w-62.5" />
        </div>
        <Skeleton className="h-9 w-25" />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-25" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-25" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-37.5" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-25" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-25" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-25" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-30" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-45" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-25" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="mt-6 border-t border-border-color pt-6">
              <div className="mb-3 sm:mb-4">
                <Skeleton className="h-6 w-45" />
              </div>
              <div className="space-y-4">
                <Skeleton className="w-full" />
                <div className="w-full lg:w-1/2 ml-auto space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className=" w-full" />
              </div>
            </div>

            <div className="pt-4 border-t border-border-color">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="mb-3 sm:mb-4">
                    <Skeleton className="h-6 w-37.5" />
                  </div>
                  <Skeleton className="w-full" />
                </div>
                <div>
                  <div className="mb-3 sm:mb-4">
                    <Skeleton className="h-6 w-45" />
                  </div>
                  <Skeleton className="w-full" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <Skeleton className="h-10 w-full sm:w-25" />
          <Skeleton className="h-10 w-full sm:w-25" />
        </CardFooter>
      </Card>
    </>
  );
};
