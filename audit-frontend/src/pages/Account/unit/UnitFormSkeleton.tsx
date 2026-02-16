import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const UnitFormSkeleton: React.FC = () => {
  return (
    <Card className="w-full">
      <CardContent className="p-6 pt-6">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit Name */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Active Status */}
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-6 w-11" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border-color px-6 py-4 bg-muted/20">
        <div className="flex w-full justify-between">
          <div>
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UnitFormSkeleton;
