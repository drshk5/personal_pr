import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { PageLoader } from "@/components/layout/page-loader";

const ContactForm = lazy(() => import("./ContactForm"));
const ContactDetail = lazy(() => import("./ContactDetail"));

/**
 * Router wrapper that shows ContactDetail for edit mode (with :id param)
 * and ContactForm for create mode (/new or no id).
 */
export default function ContactFormRouter() {
  const { id } = useParams<{ id: string }>();
  const isCreateMode = !id || id === "new" || id === "create";

  return (
    <Suspense fallback={<PageLoader />}>
      {isCreateMode ? <ContactForm /> : <ContactDetail />}
    </Suspense>
  );
}
