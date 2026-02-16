import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { helpCenterService } from "@/services/central/help-center.service";
import type {
  HelpArticleSearch,
  HelpCategorySearch,
  HelpCategoryCreate,
  HelpCategoryUpdate,
  HelpArticleCreate,
  HelpArticleUpdate,
} from "@/types/central/help-center";

// Query keys
export const helpCenterKeys = {
  all: ["help-center"] as const,
  categories: () => [...helpCenterKeys.all, "categories"] as const,
  category: (guid: string) => [...helpCenterKeys.categories(), guid] as const,
  categoriesWithArticles: () =>
    [...helpCenterKeys.categories(), "with-articles"] as const,
  articles: () => [...helpCenterKeys.all, "articles"] as const,
  article: (guid: string) => [...helpCenterKeys.articles(), guid] as const,
  articleBySlug: (slug: string) =>
    [...helpCenterKeys.articles(), "slug", slug] as const,
  articleSearch: (params?: HelpArticleSearch) =>
    [...helpCenterKeys.articles(), "search", params] as const,
  widgetArticles: (moduleGuid?: string) =>
    [...helpCenterKeys.articles(), "widget", moduleGuid] as const,
  widgetFeatured: () =>
    [...helpCenterKeys.articles(), "widget", "featured"] as const,
  quickActions: () =>
    [...helpCenterKeys.categories(), "quick-actions"] as const,
};

// Categories
export function useHelpCategories(params?: HelpCategorySearch) {
  return useQuery({
    queryKey: [...helpCenterKeys.categories(), params],
    queryFn: () => helpCenterService.getCategories(params),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useActiveCategoryDropdown() {
  return useQuery({
    queryKey: [...helpCenterKeys.categories(), "active-dropdown"],
    queryFn: () => helpCenterService.getActiveCategoriesDropdown(),
  });
}

export function useHelpCategory(guid: string) {
  return useQuery({
    queryKey: helpCenterKeys.category(guid),
    queryFn: () => helpCenterService.getCategoryById(guid),
    enabled: !!guid,
  });
}

export function useCategoriesWithArticles(enabled = true) {
  return useQuery({
    queryKey: helpCenterKeys.categoriesWithArticles(),
    queryFn: () => helpCenterService.getCategoriesWithArticles(),
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCreateHelpCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HelpCategoryCreate) =>
      helpCenterService.createCategory(data),
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.categories() });
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categoriesWithArticles(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create category");
    },
  });
}

export function useUpdateHelpCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guid, data }: { guid: string; data: HelpCategoryUpdate }) =>
      helpCenterService.updateCategory(guid, data),
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.categories() });
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categoriesWithArticles(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update category");
    },
  });
}

export function useDeleteHelpCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guid: string) => helpCenterService.deleteCategory(guid),
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.categories() });
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categoriesWithArticles(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete category");
    },
  });
}

// Articles
export function useHelpArticles(params?: HelpArticleSearch) {
  return useQuery({
    queryKey: helpCenterKeys.articleSearch(params),
    queryFn: () => helpCenterService.getArticles(params),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useActiveArticleDropdown() {
  return useQuery({
    queryKey: [...helpCenterKeys.articles(), "active-dropdown"],
    queryFn: () => helpCenterService.getActiveArticlesDropdown(),
  });
}

export function useHelpArticle(guid: string, enabled = true) {
  return useQuery({
    queryKey: helpCenterKeys.article(guid),
    queryFn: () => helpCenterService.getArticleById(guid),
    enabled: !!guid && enabled,
  });
}

export function useHelpArticleBySlug(slug: string) {
  return useQuery({
    queryKey: helpCenterKeys.articleBySlug(slug),
    queryFn: () => helpCenterService.getArticleBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HelpArticleCreate) =>
      helpCenterService.createArticle(data),
    onSuccess: () => {
      toast.success("Article created successfully");
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.articles() });
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categoriesWithArticles(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create article");
    },
  });
}

export function useUpdateHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guid, data }: { guid: string; data: HelpArticleUpdate }) =>
      helpCenterService.updateArticle(guid, data),
    onSuccess: () => {
      toast.success("Article updated successfully");
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.articles() });
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categoriesWithArticles(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update article");
    },
  });
}

export function useDeleteHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guid: string) => helpCenterService.deleteArticle(guid),
    onSuccess: () => {
      toast.success("Article deleted successfully");
      queryClient.invalidateQueries({ queryKey: helpCenterKeys.articles() });
      queryClient.invalidateQueries({
        queryKey: helpCenterKeys.categoriesWithArticles(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete article");
    },
  });
}

// Widget Hooks
export function useWidgetArticlesForPage(moduleGuid?: string) {
  return useQuery({
    queryKey: helpCenterKeys.widgetArticles(moduleGuid),
    queryFn: () => helpCenterService.getArticlesForWidget(moduleGuid),
    enabled: !!moduleGuid,
    staleTime: 60 * 60 * 1000,
  });
}

export function useWidgetFeaturedArticles() {
  return useQuery({
    queryKey: helpCenterKeys.widgetFeatured(),
    queryFn: () => helpCenterService.getFeaturedArticlesForWidget(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useQuickActionCategories(enabled = true) {
  return useQuery({
    queryKey: helpCenterKeys.quickActions(),
    queryFn: () => helpCenterService.getQuickActionCategories(),
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}
