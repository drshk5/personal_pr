import axios from "axios";
import type {
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { environment } from "@/config/environment";
import { handleSessionExpired } from "@/lib/utils";
import { refreshTokens } from "./token-refresh";

export const api = axios.create({
  baseURL: `${environment.baseUrl}/api`,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  refreshQueue.forEach((request) => {
    if (error) {
      request.reject(error);
    } else if (token) {
      request.resolve(token);
    }
  });
  refreshQueue = [];
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("Token");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Refresh token is managed by backend via cookies;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url
    ) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/auth/")) {
        return Promise.reject(error);
      }

      const isAuthMeRequest = originalRequest.url.includes("/auth/me");
      if (originalRequest.url.includes("/auth/") && !isAuthMeRequest) {
        return Promise.reject(error);
      }

      // Queue requests during token refresh
      if (isRefreshing) {
        try {
          return new Promise((resolve, reject) => {
            refreshQueue.push({
              resolve: () => {
                if (originalRequest.headers) {
                  resolve(api(originalRequest));
                } else {
                  reject(new Error("Request headers not available"));
                }
              },
              reject: (err) => reject(err),
            });
          });
        } catch (queueError) {
          return Promise.reject(queueError);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshTokens();
        // Authorization header is derived from localStorage by request interceptor

        isRefreshing = false;
        processQueue(null, "success");

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);

        // Redirect to login only if refresh token endpoint fails
        if (!window.location.pathname.startsWith("/auth/")) {
          await handleSessionExpired();
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
