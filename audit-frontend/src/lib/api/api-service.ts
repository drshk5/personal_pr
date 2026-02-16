import { api } from "@/lib/api/axios";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@/types/common";

export class ApiService {
  public static async get<T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const response = await api.get<ApiResponse<T>>(url, { params });
    return response.data.data;
  }

  public static async getWithMeta<T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const response = await api.get<T>(url, { params });
    return response.data;
  }

  public static async getRaw<T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    return await api.get<T>(url, { params });
  }

  public static async getArray<T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<T[]> {
    const response = await api.get<ApiResponse<T[]>>(url, { params });
    return response.data.data;
  }

  public static async post<T>(url: string, data: unknown): Promise<T> {
    const response = await api.post<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  public static async postWithMeta<T>(url: string, data: unknown): Promise<T> {
    const response = await api.post<T>(url, data);
    return response.data;
  }

  public static async postRaw<T>(
    url: string,
    data: unknown
  ): Promise<AxiosResponse<T>> {
    return await api.post<T>(url, data);
  }

  public static async put<T>(url: string, data: unknown): Promise<T> {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  public static async putWithMeta<T>(url: string, data: unknown): Promise<T> {
    const response = await api.put<T>(url, data);
    return response.data;
  }

  public static async patch<T>(url: string, data: unknown): Promise<T> {
    const response = await api.patch<ApiResponse<T>>(url, data);
    return response.data.data;
  }

  public static async patchWithMeta<T>(url: string, data: unknown): Promise<T> {
    const response = await api.patch<T>(url, data);
    return response.data;
  }

  public static async delete<T>(url: string): Promise<T> {
    const response = await api.delete<ApiResponse<T>>(url);
    return response.data.data;
  }

  public static async deleteWithBody<T>(url: string, data: unknown): Promise<T> {
    const response = await api.delete<ApiResponse<T>>(url, { data });
    return response.data.data;
  }

  public static async deleteWithMeta<T>(url: string): Promise<T> {
    const response = await api.delete<T>(url);
    return response.data;
  }

  public static async exportFile(
    url: string,
    params?: Record<string, unknown>,
    format: "excel" | "csv" = "excel"
  ): Promise<Blob> {
    const response = await api.get(url, {
      params: {
        ...params,
        format: format,
      },
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    });
    return response.data;
  }

  public static async exportFilePost(
    url: string,
    data?: Record<string, unknown>
  ): Promise<Blob> {
    const response = await api.post(url, data, {
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    });
    return response.data;
  }

  public static async downloadFile(
    url: string,
    params?: Record<string, unknown>
  ): Promise<Blob> {
    const response = await api.get(url, {
      params,
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    });
    return response.data;
  }

  public static async getBlob(
    url: string,
    params?: Record<string, unknown>
  ): Promise<Blob> {
    const response = await api.get(url, {
      params,
      responseType: "blob",
      headers: {
        Accept: "*/*",
      },
    });
    return response.data;
  }
}
