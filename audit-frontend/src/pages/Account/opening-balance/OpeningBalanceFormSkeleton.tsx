import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const OpeningBalanceFormSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Page Header Skeleton */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Opening Balance Information Section */}
            <div>
              <Skeleton className="h-5 sm:h-6 w-56 mb-3 sm:mb-4" />

              {/* Opening Balance No, Date, and Account Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Currency Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Exchange Rate Info (conditional section) */}
              <div className="mt-2">
                <Skeleton className="h-4 w-64 mb-2" />
              </div>
            </div>

            <Separator />

            {/* Amount Details Section */}
            <div>
              <Skeleton className="h-5 sm:h-6 w-44 mb-3 sm:mb-4" />

              <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div></div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t px-4 py-3 sm:px-6 sm:py-4 bg-muted/20">
          <div className="flex w-full justify-between">
            <Skeleton className="h-10 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
