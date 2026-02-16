import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/central/auth.service";
import type {
  ResetPasswordCredentials,
  LoginRequest,
  SessionExistsError,
} from "@/types/central/user";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { handleMutationError } from "../common";
import { clearTokensAndCache, refreshAppState } from "@/lib/utils";
import { useToken } from "@/hooks/common/use-token";
import { signalRService } from "@/services/task/signalr.service";

export const authQueryKeys = {
  all: ["auth"] as const,
  user: ["auth", "user"] as const,
};

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { hasToken } = useToken();

  const userQuery = useQuery({
    queryKey: authQueryKeys.user,
    queryFn: async () => {
      const userData = await AuthService.getCurrentUser();
      return userData.data;
    },
    enabled: hasToken,
  });

  // Don't automatically redirect on auth failure
  // Let the axios interceptor handle token refresh first
  // Only redirect if axios interceptor explicitly calls handleSessionExpired

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await AuthService.login(credentials);
      if (response.token) {
        localStorage.setItem("Token", response.token);
      }
      return response;
    },
    onSuccess: async () => {
      await refreshAppState(queryClient);
      toast.success("Logged in successfully");
      navigate("/welcome");
    },
    onError: (error: AxiosError<SessionExistsError>) => {
      // Check if it's a session exists error (409)
      if (error.response?.status === 409) {
        // Don't show generic error toast - let the UI handle this
        // The error will be available in the mutation error state
        return;
      }
      // For other errors, show generic error message
      handleMutationError(error, "Login failed. Please try again.");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => AuthService.logout(),
    onSuccess: (response) => {
      // ✅ FIX 3: STOP SignalR when user logs out (prevents retries with bad token)
      console.log("[Auth] Logout successful, stopping SignalR connection...");
      signalRService.stop().catch((err) => {
        console.warn("[Auth] Error stopping SignalR on logout:", err);
      });

      // Clear organization and year queries
      queryClient.removeQueries({ queryKey: ["organizations"] });
      queryClient.removeQueries({ queryKey: ["years"] });

      clearTokensAndCache(queryClient);

      queryClient.setQueryData(authQueryKeys.user, null);
      toast.success(
        response.message || "You have been logged out successfully"
      );
      navigate("/auth/login", { replace: true });
    },
    onError: (error) =>
      handleMutationError(error, "Logout failed. Please try again."),
  });

  return {
    user: userQuery.data,
    isLoadingUser: userQuery.isLoading || userQuery.isFetching,
    isUserError: userQuery.isError,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) =>
      AuthService.forgotPassword({ email }),
    onSuccess: () => {
      toast.success(
        "OTP sent successfully to your email. Please check your inbox."
      );
    },
    onError: (error) =>
      handleMutationError(error, "Failed to send password reset OTP"),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (credentials: ResetPasswordCredentials) =>
      AuthService.resetPassword(credentials),
    onSuccess: () => {
      toast.success(
        "Password reset successful. You can now log in with your new password."
      );
    },
    onError: (error) => handleMutationError(error, "Password reset failed"),
  });
}
