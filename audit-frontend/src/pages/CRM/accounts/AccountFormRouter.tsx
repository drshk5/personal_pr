import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { PageLoader } from "@/components/layout/page-loader";

const AccountForm = lazy(() => import("./AccountForm"));
const AccountDetail = lazy(() => import("./AccountDetail"));

/**
 * Router wrapper that shows AccountDetail for edit mode (with :id param)
 * and AccountForm for create mode (/new or no id).
 */
export default function AccountFormRouter() {
  const { id } = useParams<{ id: string }>();
  const isCreateMode = !id || id === "new" || id === "create";

  return (
    <Suspense fallback={<PageLoader />}>
      {isCreateMode ? <AccountForm /> : <AccountDetail />}
    </Suspense>
  );
}
