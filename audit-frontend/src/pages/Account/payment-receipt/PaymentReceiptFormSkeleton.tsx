import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const PaymentReceiptFormSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Basic Transaction Information Section */}
            <div>
              <Skeleton className="h-5 sm:h-6 w-56 mb-3 sm:mb-4" />

              {/* Transaction Type, Transaction No, Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <div className="relative">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded-md" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            {/* Payment Mode, Payment To/From, Amount, Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Payment mode specific section */}
            <Separator className="my-4 sm:my-6" />
            <Skeleton className="h-5 sm:h-6 w-48 mb-3 sm:mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Additional Information Section */}
            <Separator className="my-4 sm:my-6" />
            <div>
              <Skeleton className="h-5 sm:h-6 w-52 mb-3 sm:mb-4" />
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>

                {/* Narration */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="mt-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <Skeleton className="h-10 w-28" />
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
