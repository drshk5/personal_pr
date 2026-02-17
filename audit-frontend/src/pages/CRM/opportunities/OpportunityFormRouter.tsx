import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { PageLoader } from "@/components/layout/page-loader";

const OpportunityForm = lazy(() => import("./OpportunityForm"));
const OpportunityDetail = lazy(() => import("./OpportunityDetail"));

/**
 * Router wrapper that shows OpportunityDetail for edit mode (with :id param)
 * and OpportunityForm for create mode (/new or no id).
 */
export default function OpportunityFormRouter() {
  const { id } = useParams<{ id: string }>();
  const isCreateMode = !id || id === "new" || id === "create";

  return (
    <Suspense fallback={<PageLoader />}>
      {isCreateMode ? <OpportunityForm /> : <OpportunityDetail />}
    </Suspense>
  );
}
