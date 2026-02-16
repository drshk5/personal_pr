import * as React from "react";
import { DocumentModeContext } from "@/contexts/document-mode/document-mode-context";

export function useDocumentMode() {
  const context = React.useContext(DocumentModeContext);
  if (context === undefined) {
    throw new Error(
      "useDocumentMode must be used within a DocumentModeProvider"
    );
  }
  return context;
}
