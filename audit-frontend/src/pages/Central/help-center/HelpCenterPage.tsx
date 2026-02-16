import { useEffect, useMemo, useState } from "react";
import { BookOpen, Edit, Plus } from "lucide-react";

import type { HelpArticle, HelpCategory } from "@/types/central/help-center";

import { getIconByName } from "@/lib/icon-map";
import { useTableLayout, useMenuIcon } from "@/hooks/common";
import {
  useHelpArticles,
  useHelpCategories,
} from "@/hooks/api/central/use-help-center";

import { DraggableColumnVisibility } from "@/components/shared/draggable-column-visibility";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { TableSkeleton } from "@/components/data-display/skeleton/table-skeleton";
import { HelpArticleModal, HelpCategoryModal } from "./components";
import { useModules } from "@/hooks/api/central/use-modules";

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "articles">("categories");
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [articleSearch, setArticleSearch] = useState<string>("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [categoryModuleFilter, setCategoryModuleFilter] = useState<string>("all");

  // Fetch all modules for dropdown
  const { data: modulesData } = useModules({ pageSize: 100 });
  const moduleOptions = useMemo(() => modulesData?.data?.items || [], [modulesData?.data?.items]);

  const defaultCategoryColumnOrder = [
    "actions",
    "intOrder",
    "strCategoryName",
    "strModuleGUID",
    "strDescription",
    "strIcon",
    "bolIsActive",
  ];

  const {
    columnVisibility: categoryColumnVisibility,
    toggleColumnVisibility: toggleCategoryColumnVisibility,
    resetColumnVisibility: resetCategoryColumnVisibility,
    hasVisibleContentColumns: hasCategoryVisibleContentColumns,
    getAlwaysVisibleColumns: getCategoryAlwaysVisibleColumns,
    isTextWrapped: isCategoryTextWrapped,
    toggleTextWrapping: toggleCategoryTextWrapping,
    pinnedColumns: categoryPinnedColumns,
    pinColumn: pinCategoryColumn,
    unpinColumn: unpinCategoryColumn,
    resetPinnedColumns: resetCategoryPinnedColumns,
    columnOrder: categoryColumnOrder,
    setColumnOrder: setCategoryColumnOrder,
    columnWidths: categoryColumnWidths,
    setColumnWidths: setCategoryColumnWidths,
    resetAll: resetCategoryAll,
  } = useTableLayout(
    "help_category_columns",
    defaultCategoryColumnOrder,
    ["actions"]
  );

  const defaultArticleColumnOrder = [
    "actions",
    "intOrder",
    "strTitle",
    "strCategoryName",
    "strModuleName",
    "bolIsFeatured",
    "bolIsActive",
  ];

  const {
    columnVisibility: articleColumnVisibility,
    toggleColumnVisibility: toggleArticleColumnVisibility,
    resetColumnVisibility: resetArticleColumnVisibility,
    hasVisibleContentColumns: hasArticleVisibleContentColumns,
    getAlwaysVisibleColumns: getArticleAlwaysVisibleColumns,
    isTextWrapped: isArticleTextWrapped,
    toggleTextWrapping: toggleArticleTextWrapping,
    pinnedColumns: articlePinnedColumns,
    pinColumn: pinArticleColumn,
    unpinColumn: unpinArticleColumn,
    resetPinnedColumns: resetArticlePinnedColumns,
    columnOrder: articleColumnOrder,
    setColumnOrder: setArticleColumnOrder,
    columnWidths: articleColumnWidths,
    setColumnWidths: setArticleColumnWidths,
    resetAll: resetArticleAll,
  } = useTableLayout(
    "help_article_columns",
    defaultArticleColumnOrder,
    ["actions"]
  );

  const [categoryPagination, setCategoryPagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  const [articlePagination, setArticlePagination] = useState({
    pageNumber: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | null>(
    null
  );

  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    null
  );

  const helpCategoryParams = {
    includeInactive: true,
    pageNumber: categoryPagination.pageNumber,
    pageSize: categoryPagination.pageSize,
    search: categorySearch,
    ...(categoryModuleFilter !== "all" && { strModuleGUID: categoryModuleFilter })
  };
  const { data: categoriesData, isLoading: categoriesLoading } = useHelpCategories(helpCategoryParams);
  const { data: articlesData, isLoading: articlesLoading } = useHelpArticles({
    includeInactive: true,
    pageNumber: articlePagination.pageNumber,
    pageSize: articlePagination.pageSize,
    searchTerm: articleSearch,
    strModuleGUID: moduleFilter !== "all" ? moduleFilter : undefined,
  });

  const categories = categoriesData?.items || [];
  const articles = articlesData?.items || [];

  useEffect(() => {
    if (categoriesData) {
      setCategoryPagination({
        pageNumber: categoriesData.pageNumber,
        pageSize: categoriesData.pageSize,
        totalCount: categoriesData.totalCount,
        totalPages: categoriesData.totalPages,
      });
    }
  }, [categoriesData]);

  useEffect(() => {
    if (articlesData) {
      setArticlePagination({
        pageNumber: articlesData.pageNumber,
        pageSize: articlesData.pageSize,
        totalCount: articlesData.totalCount,
        totalPages: articlesData.totalPages,
      });
    }
  }, [articlesData]);

  const categoryColumns = useMemo<DataTableColumn<HelpCategory>[]>(
    () => [
      {
        key: "actions",
        header: "Actions",
        cell: (category) => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCategory(category);
              }}
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
        width: "80px",
        sortable: false,
      },
      {
        key: "intOrder",
        header: "Order",
        cell: (category) => (
          <span className="font-medium">{category.intOrder}</span>
        ),
        sortable: true,
        width: "60px",
      },
      {
        key: "strCategoryName",
        header: "Name",
        cell: (category) => (
          <span className="font-medium">{category.strCategoryName}</span>
        ),
        sortable: true,
        width: "220px",
      },
      {
        key: "strModuleGUID",
        header: "Module",
        cell: (category) => {
          if (category.strModuleName)
            return <span>{category.strModuleName}</span>;
          if (!category.strModuleGUID) return "—";
          const module = moduleOptions.find(
            (m) => m.strModuleGUID === category.strModuleGUID
          );
          return <span>{module ? module.strName : category.strModuleGUID}</span>;
        },
        sortable: true,
        width: "180px",
      },
      {
        key: "strDescription",
        header: "Description",
        cell: (category) => (
          <span className="text-muted-foreground">
            {category.strDescription || "—"}
          </span>
        ),
        width: "320px",
      },
      {
        key: "strIcon",
        header: "Icon",
        cell: (category) => {
          const IconComponent = category.strIcon
            ? getIconByName(category.strIcon)
            : null;
          return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
        },
        width: "70px",
      },
      {
        key: "bolIsActive",
        header: "Status",
        cell: (category) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              category.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {category.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
        width: "100px",
      },
    ],
    [moduleOptions]
  );

  const orderedCategoryColumns = useMemo(() => {
    if (!categoryColumns || categoryColumns.length === 0)
      return categoryColumns;

    return [...categoryColumns].sort((a, b) => {
      const aIndex = categoryColumnOrder.indexOf(a.key);
      const bIndex = categoryColumnOrder.indexOf(b.key);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [categoryColumns, categoryColumnOrder]);

  const articleColumns = useMemo<DataTableColumn<HelpArticle>[]>(
    () => [
      {
        key: "actions",
        header: "Actions",
        cell: (article) => (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEditArticle(article);
              }}
              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-gray-900"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        ),
        width: "80px",
        sortable: false,
      },
      {
        key: "intOrder",
        header: "Order",
        cell: (article) => (
          <span className="font-medium">{article.intOrder}</span>
        ),
        sortable: true,
        width: "60px",
      },
      {
        key: "strTitle",
        header: "Title",
        cell: (article) => (
          <span className="font-medium">{article.strTitle}</span>
        ),
        sortable: true,
        width: "350px",
      },
      {
        key: "strCategoryName",
        header: "Category",
        cell: (article) => (
          <span className="text-foreground">
            {article.strCategoryName || "—"}
          </span>
        ),
        sortable: true,
        width: "180px",
      },
      {
        key: "strModuleName",
        header: "Page/Module",
        cell: (article) => (
          <span className="text-foreground">
            {article.strModuleName || "—"}
          </span>
        ),
        sortable: true,
        width: "150px",
      },
      {
        key: "bolIsFeatured",
        header: "Featured",
        cell: (article) =>
          article.bolIsFeatured ? <Badge>Featured</Badge> : null,
        width: "100px",
      },
      {
        key: "bolIsActive",
        header: "Status",
        cell: (article) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              article.bolIsActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {article.bolIsActive ? "Active" : "Inactive"}
          </span>
        ),
        sortable: true,
        width: "100px",
      },
    ],
    []
  );

  const orderedArticleColumns = useMemo(() => {
    if (!articleColumns || articleColumns.length === 0) return articleColumns;

    return [...articleColumns].sort((a, b) => {
      const aIndex = articleColumnOrder.indexOf(a.key);
      const bIndex = articleColumnOrder.indexOf(b.key);

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [articleColumns, articleColumnOrder]);

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (category: HelpCategory) => {
    setSelectedCategory(category);
    setCategoryModalOpen(true);
  };

  const handleCreateArticle = () => {
    setSelectedArticle(null);
    setArticleModalOpen(true);
  };

  const handleEditArticle = (article: HelpArticle) => {
    setSelectedArticle(article);
    setArticleModalOpen(true);
  };

  const goToCategoryPage = (page: number) => {
    setCategoryPagination((prev) => ({
      ...prev,
      pageNumber: page,
    }));
  };

  const handleCategoryPageSizeChange = (newSize: number) => {
    setCategoryPagination((prev) => ({
      ...prev,
      pageSize: newSize,
      pageNumber: 1,
    }));
  };

  const goToArticlePage = (page: number) => {
    setArticlePagination((prev) => ({
      ...prev,
      pageNumber: page,
    }));
  };

  const handleArticlePageSizeChange = (newSize: number) => {
    setArticlePagination((prev) => ({
      ...prev,
      pageSize: newSize,
      pageNumber: 1,
    }));
  };

  const HeaderIcon = useMenuIcon("help_center", BookOpen);

  return (
    <CustomContainer>
      <PageHeader
        title="Help Center Management"
        description="Manage help articles and categories for users"
        icon={HeaderIcon}
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "categories" | "articles")}
      >
        <div className="flex items-center gap-4 mb-2">
          <TabsList>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
          </TabsList>
        </div>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:flex-1">
              <SearchInput
                placeholder="Search categories..."
                onSearchChange={setCategorySearch}
                className="w-full sm:max-w-md"
              />
              <div className="h-9 flex gap-2 items-center">
                <DraggableColumnVisibility
                  columns={categoryColumns}
                  columnVisibility={categoryColumnVisibility}
                  toggleColumnVisibility={toggleCategoryColumnVisibility}
                  resetColumnVisibility={resetCategoryColumnVisibility}
                  hasVisibleContentColumns={hasCategoryVisibleContentColumns}
                  getAlwaysVisibleColumns={getCategoryAlwaysVisibleColumns}
                  isTextWrapped={isCategoryTextWrapped}
                  toggleTextWrapping={toggleCategoryTextWrapping}
                  pinnedColumns={categoryPinnedColumns}
                  pinColumn={pinCategoryColumn}
                  unpinColumn={unpinCategoryColumn}
                  resetPinnedColumns={resetCategoryPinnedColumns}
                  onColumnOrderChange={(order) => {
                    setCategoryColumnOrder(order);
                    localStorage.setItem(
                      "help_category_column_order",
                      JSON.stringify(order)
                    );
                  }}
                  onResetAll={() => {
                    resetCategoryAll();
                  }}
                />
                <div className="w-45">
                  <Select value={categoryModuleFilter} onValueChange={setCategoryModuleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {moduleOptions.map((mod) => (
                        <SelectItem key={mod.strModuleGUID} value={mod.strModuleGUID}>
                          {mod.strName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button onClick={handleCreateCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

{categoriesLoading ? (
            <TableSkeleton
              columns={[
                "Actions",
                "Order",
                "Name",
                "Module",
                "Description",
                "Icon",
                "Status",
              ]}
              pageSize={categoryPagination.pageSize}
            />
          ) : (
            <DataTable
              data={categories}
              columns={orderedCategoryColumns}
              keyExtractor={(category) => category.strCategoryGUID}
              loading={false}
              columnVisibility={categoryColumnVisibility}
              alwaysVisibleColumns={getCategoryAlwaysVisibleColumns()}
              pinnedColumns={categoryPinnedColumns}
              isTextWrapped={isCategoryTextWrapped}
              columnWidths={categoryColumnWidths}
              onColumnWidthsChange={(widths) => {
                setCategoryColumnWidths(widths);
                localStorage.setItem(
                  "help_category_column_widths",
                  JSON.stringify(widths)
                );
              }}
              emptyState={
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No categories found. Create your first category to get
                    started.
                  </p>
                </div>
              }
              pagination={{
                pageNumber: categoryPagination.pageNumber,
                pageSize: categoryPagination.pageSize,
                totalCount: categoryPagination.totalCount,
                totalPages: categoryPagination.totalPages,
                onPageChange: goToCategoryPage,
                onPageSizeChange: handleCategoryPageSizeChange,
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          )}
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:flex-1">
              <SearchInput
                placeholder="Search articles..."
                onSearchChange={setArticleSearch}
                className="w-full sm:max-w-md"
              />
              <div className="h-9 flex gap-2 items-center">
                <DraggableColumnVisibility
                  columns={articleColumns}
                  columnVisibility={articleColumnVisibility}
                  toggleColumnVisibility={toggleArticleColumnVisibility}
                  resetColumnVisibility={resetArticleColumnVisibility}
                  hasVisibleContentColumns={hasArticleVisibleContentColumns}
                  getAlwaysVisibleColumns={getArticleAlwaysVisibleColumns}
                  isTextWrapped={isArticleTextWrapped}
                  toggleTextWrapping={toggleArticleTextWrapping}
                  pinnedColumns={articlePinnedColumns}
                  pinColumn={pinArticleColumn}
                  unpinColumn={unpinArticleColumn}
                  resetPinnedColumns={resetArticlePinnedColumns}
                  onColumnOrderChange={(order) => {
                    setArticleColumnOrder(order);
                    localStorage.setItem(
                      "help_article_column_order",
                      JSON.stringify(order)
                    );
                  }}
                  onResetAll={() => {
                    resetArticleAll();
                  }}
                />
                <div className="w-45">
                  <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Modules</SelectItem>
                      {moduleOptions.map((mod) => (
                        <SelectItem key={mod.strModuleGUID} value={mod.strModuleGUID}>
                          {mod.strName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button onClick={handleCreateArticle}>
              <Plus className="h-4 w-4 mr-2" />
              Add Article
            </Button>
          </div>

{articlesLoading ? (
            <TableSkeleton
              columns={[
                "Actions",
                "Order",
                "Title",
                "Category",
                "Page/Module",
                "Featured",
                "Status",
              ]}
              pageSize={articlePagination.pageSize}
            />
          ) : (
            <DataTable
              data={articles}
              columns={orderedArticleColumns}
              keyExtractor={(article) => article.strArticleGUID}
              loading={false}
              columnVisibility={articleColumnVisibility}
              alwaysVisibleColumns={getArticleAlwaysVisibleColumns()}
              pinnedColumns={articlePinnedColumns}
              isTextWrapped={isArticleTextWrapped}
              columnWidths={articleColumnWidths}
              onColumnWidthsChange={(widths) => {
                setArticleColumnWidths(widths);
                localStorage.setItem(
                  "help_article_column_widths",
                  JSON.stringify(widths)
                );
              }}
              emptyState={
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No articles found. Create your first article to get started.
                  </p>
                </div>
              }
              pagination={{
                pageNumber: articlePagination.pageNumber,
                pageSize: articlePagination.pageSize,
                totalCount: articlePagination.totalCount,
                totalPages: articlePagination.totalPages,
                onPageChange: goToArticlePage,
                onPageSizeChange: handleArticlePageSizeChange,
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              maxHeight="calc(100vh - 350px)"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <HelpCategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        category={selectedCategory}
      />

      <HelpArticleModal
        open={articleModalOpen}
        onOpenChange={setArticleModalOpen}
        article={selectedArticle}
      />
    </CustomContainer>
  );
}
