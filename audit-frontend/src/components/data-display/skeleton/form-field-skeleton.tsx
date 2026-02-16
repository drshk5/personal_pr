import { Skeleton } from "@/components/ui/skeleton";

/**
 * A reusable skeleton component for form fields
 * Provides improved visibility in both light and dark modes
 */
export const FormFieldSkeleton = ({
  labelWidth = "w-32",
  fieldHeight = "h-9",
}: {
  labelWidth?: string;
  fieldHeight?: string;
}) => (
  <div className="space-y-2">
    <Skeleton className={`h-4 ${labelWidth}`} />
    <Skeleton
      className={`${fieldHeight} w-full rounded-md shadow-sm border-transparent
        bg-gray-200 dark:bg-gray-700`}
    />
  </div>
);

/**
 * A reusable skeleton component for switch form fields
 */
export const SwitchFieldSkeleton = ({
  labelWidth = "w-16",
}: {
  labelWidth?: string;
}) => (
  <div className="flex flex-row items-center justify-start gap-4">
    <div className="space-y-0.5">
      <Skeleton className={`h-4 ${labelWidth}`} />
    </div>
    <Skeleton className="h-6 w-11 rounded-full bg-gray-200 dark:bg-gray-700" />
  </div>
);
