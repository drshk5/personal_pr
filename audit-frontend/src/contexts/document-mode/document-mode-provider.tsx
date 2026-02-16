import * as React from "react";

import type { DocumentModeContextType } from "./document-mode-context";
import { DocumentModeContext } from "./document-mode-context";

export function DocumentModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDocMode, setIsDocMode] = React.useState<boolean>(() => {
    const savedValue = localStorage.getItem("isDocMode");
    return savedValue ? JSON.parse(savedValue) : false;
  });

  const [referrerPath, setReferrerPath] = React.useState<string | null>(() => {
    const savedPath = localStorage.getItem("documentReferrerPath");
    return savedPath || null;
  });

  const toggleDocMode = React.useCallback(() => {
    setIsDocMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("isDocMode", JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  const setDocMode = React.useCallback((value: boolean) => {
    setIsDocMode(value);
    localStorage.setItem("isDocMode", JSON.stringify(value));
  }, []);

  const handleSetReferrerPath = React.useCallback((path: string | null) => {
    setReferrerPath(path);
    if (path) {
      localStorage.setItem("documentReferrerPath", path);
    } else {
      localStorage.removeItem("documentReferrerPath");
    }
  }, []);

  const value = React.useMemo<DocumentModeContextType>(
    () => ({
      isDocMode,
      toggleDocMode,
      setDocMode,
      referrerPath,
      setReferrerPath: handleSetReferrerPath,
    }),
    [isDocMode, toggleDocMode, setDocMode, referrerPath, handleSetReferrerPath]
  );

  return (
    <DocumentModeContext.Provider value={value}>
      {children}
    </DocumentModeContext.Provider>
  );
}
