import { lazy, Suspense } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PageLoader } from "@/components/layout/page-loader";

const OpportunityForm = lazy(() => import("./OpportunityForm"));
const OpportunityDetail = lazy(() => import("./OpportunityDetail"));

/**
 * Router wrapper:
 * - /new or /create → OpportunityForm (create)
 * - /:id?mode=edit  → OpportunityForm (edit)
 * - /:id            → OpportunityDetail (read-only)
 */
export default function OpportunityFormRouter() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id || id === "new" || id === "create";
  const isEditMode = !isCreateMode && searchParams.get("mode") === "edit";

  return (
    <Suspense fallback={<PageLoader />}>
      {isCreateMode || isEditMode ? <OpportunityForm /> : <OpportunityDetail />}
    </Suspense>
  );
}
