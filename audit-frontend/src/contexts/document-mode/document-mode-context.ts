import * as React from "react";

export interface DocumentModeContextType {
  isDocMode: boolean;
  toggleDocMode: () => void;
  setDocMode: (value: boolean) => void;
  referrerPath: string | null;
  setReferrerPath: (path: string | null) => void;
}

export const DocumentModeContext = React.createContext<
  DocumentModeContextType | undefined
>(undefined);
