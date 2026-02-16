import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const OpportunityFormSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-6">
          {/* Deal Info Row */}
          <div>
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
          {/* Financial Row */}
          <div>
            <Skeleton className="h-4 w-36 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 bg-muted/20">
        <div className="flex items-center justify-end w-full">
          <Skeleton className="h-9 w-24" />
        </div>
      </CardFooter>
    </Card>
  );
};

export default OpportunityFormSkeleton;
