import { ApiService } from "@/lib/api/api-service";
import type {
  HelpCategory,
  HelpArticle,
  HelpCategoryCreate,
  HelpCategoryUpdate,
  HelpArticleCreate,
  HelpArticleUpdate,
  HelpArticleSearch,
  HelpCategorySearch,
  PagedResponse,
} from "@/types/central/help-center";

export const helpCenterService = {
  // Categories
  getCategories: (params?: HelpCategorySearch) =>
    ApiService.get<PagedResponse<HelpCategory>>(
      "/HelpCategory",
      params as Record<string, unknown>
    ),

  getCategoryById: (guid: string) =>
    ApiService.get<HelpCategory>(`/HelpCategory/${guid}`),

  getActiveCategoriesDropdown: () =>
    ApiService.get<HelpCategory[]>("/HelpCategory/active/dropdown"),

  createCategory: (data: HelpCategoryCreate) =>
    ApiService.post<HelpCategory>("/HelpCategory", data),

  updateCategory: (guid: string, data: HelpCategoryUpdate) =>
    ApiService.put<HelpCategory>(`/HelpCategory/${guid}`, data),

  deleteCategory: (guid: string) => ApiService.delete(`/HelpCategory/${guid}`),

  // Articles
  getArticles: (params?: HelpArticleSearch) =>
    ApiService.get<PagedResponse<HelpArticle>>(
      "/HelpArticle",
      params as Record<string, unknown>
    ),

  getCategoriesWithArticles: () =>
    ApiService.get<HelpCategory[]>("/HelpArticle/categories-with-articles"),

  getArticleById: (guid: string) =>
    ApiService.get<HelpArticle>(`/HelpArticle/${guid}`),

  getArticleBySlug: (slug: string) =>
    ApiService.get<HelpArticle>(`/HelpArticle/slug/${slug}`),

  getActiveArticlesDropdown: () =>
    ApiService.get<HelpArticle[]>("/HelpArticle/active/dropdown"),

  createArticle: (data: HelpArticleCreate) =>
    ApiService.post<HelpArticle>("/HelpArticle", data),

  updateArticle: (guid: string, data: HelpArticleUpdate) =>
    ApiService.put<HelpArticle>(`/HelpArticle/${guid}`, data),

  deleteArticle: (guid: string) => ApiService.delete(`/HelpArticle/${guid}`),

  // Widget endpoints
  getArticlesForWidget: (moduleGuid?: string) =>
    ApiService.get<HelpArticle[]>("/HelpArticle/widget/for-current-page", {
      moduleGuid: moduleGuid || "",
    }),

  getFeaturedArticlesForWidget: () =>
    ApiService.get<HelpArticle[]>("/HelpArticle/widget/featured"),

  getQuickActionCategories: () =>
    ApiService.get<HelpCategory[]>("/HelpArticle/widget/quick-actions"),
};
