import { Skeleton } from "@/components/ui/skeleton";
import CustomContainer from "@/components/layout/custom-container";

export function ContentSkeleton() {
  return (
    <CustomContainer>
      <div className="flex flex-col space-y-6">
        {/* Welcome Banner Skeleton */}
        <div className="bg-linear-to-r from-primary/20 via-primary/10 to-background rounded-lg shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center rounded-lg gap-4">
            <div className="space-y-3 rounded-lg">
              <Skeleton className="h-8 w-72 rounded-lg" />
              <Skeleton className="h-4 w-96 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-32 rounded-lg" />
          </div>
        </div>

        {/* Two-column grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="lg:col-span-4">
            <div className="border border-border-color rounded-lg shadow-md h-full">
              <div className="bg-linear-to-r from-primary/40 rounded-lg to-primary/20 px-6 py-4">
                <Skeleton className="h-6 w-48 rounded-lg" />
              </div>
              <div className="p-6 space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-8 rounded-lg">
            <div className="border border-border-color rounded-lg shadow-md h-full">
              <div className="bg-linear-to-r from-primary/40 rounded-lg to-primary/20 px-6 py-4">
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="p-6">
                <Skeleton className="h-12 w-80 mx-auto mb-4 rounded-lg" />
                <Skeleton className="h-100 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomContainer>
  );
}
