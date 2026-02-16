import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { environment } from "@/config/environment";

export async function refreshTokens(): Promise<{
  token: string | null;
}> {
  try {
    // Separate axios instance to avoid triggering interceptors
    const standaloneAxios = axios.create({
      baseURL: `${environment.baseUrl}/api`,
      withCredentials: true, // This ensures cookies are sent
    });

    // Get current access token to send in header for recovery
    const accessToken = localStorage.getItem("Token");

    const config: AxiosRequestConfig = {
      headers: {},
    };

    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }

    const response = await standaloneAxios.post(
      "/auth/refresh-token",
      {},
      config
    );

    // Response structure: { statusCode, message, data: { Token, ... } }
    const newToken = (response?.data?.data?.Token as string | null) || null;

    if (!newToken) {
      throw new Error("No token received from refresh endpoint");
    }

    localStorage.setItem("Token", newToken);
    // Refresh token is httpOnly cookie; do not store in frontend

    return {
      token: newToken,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
}
