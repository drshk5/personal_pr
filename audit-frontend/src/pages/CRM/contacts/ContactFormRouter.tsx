import { lazy, Suspense } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PageLoader } from "@/components/layout/page-loader";

const ContactForm = lazy(() => import("./ContactForm"));
const ContactDetail = lazy(() => import("./ContactDetail"));

/**
 * Router wrapper:
 * - /new or /create → ContactForm (create)
 * - /:id?mode=edit  → ContactForm (edit)
 * - /:id            → ContactDetail (read-only)
 */
export default function ContactFormRouter() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id || id === "new" || id === "create";
  const isEditMode = !isCreateMode && searchParams.get("mode") === "edit";

  return (
    <Suspense fallback={<PageLoader />}>
      {isCreateMode || isEditMode ? <ContactForm /> : <ContactDetail />}
    </Suspense>
  );
}
