import { ApiService } from "@/lib/api/api-service";
import type {
  AuthResponseData,
  LoginRequest,
  ResetPasswordCredentials,
  User,
  UserProfileData,
} from "@/types/central/user";

interface AuthServiceType {
  login: (
    credentials: LoginRequest
  ) => Promise<{ user: User | null; token: string }>;
  logout: () => Promise<{ statusCode: number; message: string }>;
  forgotPassword: (data: { email: string }) => Promise<unknown>;
  resetPassword: (
    data: ResetPasswordCredentials
  ) => Promise<{ data: { message: string } }>;
  getCurrentUser: () => Promise<{ data: UserProfileData }>;
}

export const AuthService: AuthServiceType = {
  login: async (credentials: LoginRequest) => {
    // ApiService.post automatically unwraps ApiResponse<T> and returns just T (the data)
    const response = await ApiService.post<AuthResponseData>(
      "/auth/login",
      credentials
    );

    return {
      user: null,
      token: response.Token,
    };
  },

  logout: async () => {
    return await ApiService.postWithMeta<{
      statusCode: number;
      message: string;
    }>("/auth/logout", {});
  },

  forgotPassword: async (data: { email: string }) => {
    const backendData = {
      strEmailId: data.email,
    };
    return await ApiService.postWithMeta("/auth/forgot-password", backendData);
  },

  resetPassword: async (data: ResetPasswordCredentials) => {
    return ApiService.postWithMeta("/auth/change-password", data);
  },

  getCurrentUser: async () => {
    // Always make the API call - React Query handles caching
    const response = await ApiService.get<UserProfileData>("/auth/me");
    return { data: response };
  },
};
