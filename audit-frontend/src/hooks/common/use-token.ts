import { useState, useEffect } from "react";

export function useToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkTokens = () => {
      setToken(localStorage.getItem("Token"));
    };

    // Check tokens on mount
    checkTokens();

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "Token" || e.key === null) {
        checkTokens();
      }
    };

    // Listen for custom event (logout from same tab)
    const handleTokenChange = () => {
      checkTokens();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("tokenChange", handleTokenChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenChange", handleTokenChange);
    };
  }, []);

  return {
    token,
    hasToken: !!token,
    isChecking: token === null,
  };
}

// Keep backward compatibility
export const useAuthTokenCheck = useToken;
