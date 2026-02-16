import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useDocumentMode } from "./use-document-mode";

export function useDocumentModeByRoute() {
  const location = useLocation();
  const { setDocMode, setReferrerPath } = useDocumentMode();
  const previousPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    // Only match /document route, but not /document-module or other document-* routes
    const isDocumentRoute =
      location.pathname === "/document" ||
      location.pathname.startsWith("/document/");
    const wasDocumentRoute =
      previousPathRef.current === "/document" ||
      previousPathRef.current.startsWith("/document/");

    // If we're entering document mode from a non-document page, save the referrer
    if (isDocumentRoute && !wasDocumentRoute) {
      setReferrerPath(previousPathRef.current);
    }

    setDocMode(isDocumentRoute);
    previousPathRef.current = location.pathname;
  }, [location.pathname, setDocMode, setReferrerPath]);
}
