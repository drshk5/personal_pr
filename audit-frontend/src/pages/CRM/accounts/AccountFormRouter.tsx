import { lazy, Suspense } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PageLoader } from "@/components/layout/page-loader";

const AccountForm = lazy(() => import("./AccountForm"));
const AccountDetail = lazy(() => import("./AccountDetail"));

/**
 * Router wrapper:
 * - /new or /create → AccountForm (create)
 * - /:id?mode=edit  → AccountForm (edit)
 * - /:id            → AccountDetail (read-only)
 */
export default function AccountFormRouter() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id || id === "new" || id === "create";
  const isEditMode = !isCreateMode && searchParams.get("mode") === "edit";

  return (
    <Suspense fallback={<PageLoader />}>
      {isCreateMode || isEditMode ? <AccountForm /> : <AccountDetail />}
    </Suspense>
  );
}
