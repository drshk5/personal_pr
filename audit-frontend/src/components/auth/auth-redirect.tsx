import { Navigate } from "react-router-dom";

import { useContextSwitches } from "@/hooks/common/use-context-switches";
import { useToken } from "@/hooks/common/use-token";

export const AuthRedirect = () => {
  const { isSwitchingContext } = useContextSwitches();
  const { hasToken } = useToken();

  if (isSwitchingContext) {
    return <Navigate to="/welcome" replace />;
  }

  return <Navigate to={hasToken ? "/welcome" : "/auth/login"} replace />;
};
