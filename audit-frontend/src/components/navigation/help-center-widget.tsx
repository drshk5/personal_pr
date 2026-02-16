import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import {
  useCategoriesWithArticles,
  useHelpArticle,
  useQuickActionCategories,
} from "@/hooks/api/central/use-help-center";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

interface HelpCenterWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewMode = "home" | "article";

export function HelpCenterWidget({
  open,
  onOpenChange,
}: HelpCenterWidgetProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [selectedArticleGuid, setSelectedArticleGuid] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const { data: categoriesWithArticles, isLoading } =
    useCategoriesWithArticles(open);
  useQuickActionCategories(open);
  const { data: selectedArticle, isLoading: isArticleLoading } = useHelpArticle(
    selectedArticleGuid || "",
    open
  );

  const handleArticleClick = (articleGuid: string) => {
    setSelectedArticleGuid(articleGuid);
    setViewMode("article");
  };

  const handleBackToHome = () => {
    setViewMode("home");
    setSelectedArticleGuid(null);
    setSearchTerm("");
  };

  // Reset state when widget closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setViewMode("home");
      setSelectedArticleGuid(null);
      setSearchTerm("");
      setOpenCategories([]);
    }
    onOpenChange(newOpen);
  };

  const toggleCategory = (categoryGuid: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryGuid)
        ? prev.filter((guid) => guid !== categoryGuid)
        : [...prev, categoryGuid]
    );
  };

  // Filter articles based on search - memoized for performance
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categoriesWithArticles;

    return categoriesWithArticles
      ?.map((category) => ({
        ...category,
        Articles: category.Articles?.filter(
          (article) =>
            article.strTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.strContent.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((category) => (category.Articles?.length || 0) > 0);
  }, [categoriesWithArticles, searchTerm]);

  // Featured articles - memoized for performance
  const featuredArticles = useMemo(
    () =>
      categoriesWithArticles
        ?.flatMap((cat) => cat.Articles || [])
        .filter((article) => article.bolIsFeatured)
        .slice(0, 3),
    [categoriesWithArticles]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-100 sm:w-135 flex flex-col h-full overflow-hidden p-0"
        side="right"
      >
        {/* Header */}
        <div className="bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            {viewMode === "article" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToHome}
                className="size-8"
              >
                <ChevronLeft className="h-4 w-4 text-foreground" />
              </Button>
            )}
            <h2 className="text-lg font-semibold text-foreground">
              Help Center
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 ">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 border-t border-border overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-4 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : viewMode === "home" ? (
            <div className="px-4 py-4 space-y-6">
              {/* Suggested/Featured Articles */}
              {!searchTerm &&
                featuredArticles &&
                featuredArticles.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground uppercase">
                      FAQ's
                    </h3>
                    <div className="space-y-1">
                      {featuredArticles.map((article) => (
                        <button
                          key={article.strArticleGUID}
                          onClick={() =>
                            handleArticleClick(article.strArticleGUID)
                          }
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-sm text-primary hover:text-primary/80"
                        >
                          {article.strTitle}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Categories with Articles */}
              <div className="space-y-2">
                {(searchTerm
                  ? filteredCategories
                  : categoriesWithArticles
                )?.map((category) => (
                  <Collapsible
                    key={category.strCategoryGUID}
                    open={
                      openCategories.includes(category.strCategoryGUID) ||
                      !!searchTerm
                    }
                    onOpenChange={() =>
                      toggleCategory(category.strCategoryGUID)
                    }
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-2 hover:bg-muted/50 rounded-md transition-colors">
                      <div className="flex items-center gap-2">
                        {!searchTerm && (
                          <ChevronRight
                            className={`h-4 w-4 text-foreground transition-transform ${
                              openCategories.includes(
                                category.strCategoryGUID
                              ) || searchTerm
                                ? "rotate-90"
                                : ""
                            }`}
                          />
                        )}
                        <span className="font-semibold text-sm text-foreground">
                          {category.strCategoryName}
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 mt-1 space-y-1">
                      {category.Articles && category.Articles.length > 0 ? (
                        category.Articles.map((article, index) => (
                          <button
                            key={article.strArticleGUID}
                            onClick={() =>
                              handleArticleClick(article.strArticleGUID)
                            }
                            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 transition-colors text-sm text-primary hover:text-primary/80 flex items-start gap-2"
                          >
                            {category.Articles &&
                              category.Articles.length > 1 && (
                                <span className="font-semibold text-foreground min-w-2">
                                  {index + 1}.
                                </span>
                              )}
                            <span className="flex-1">{article.strTitle}</span>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                          No articles available
                        </p>
                      )}
                      {!searchTerm &&
                        category.Articles &&
                        category.Articles.length > 5 && (
                          <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                            {category.Articles.length - 5} More
                          </button>
                        )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          ) : (
            // Article View
            <div className="p-6">
              {isArticleLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : selectedArticle ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-medium text-foreground">
                    {selectedArticle.strTitle}
                  </h2>

                  <div
                    className="article-content max-w-none text-foreground text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: selectedArticle.strContent,
                    }}
                  />

                  {/* Video Embed if URL is provided */}
                  {selectedArticle.strVideoUrl &&
                    (() => {
                      const videoId = selectedArticle.strVideoUrl.match(
                        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
                      )?.[1];

                      if (videoId) {
                        return (
                          <div
                            className="relative w-full"
                            style={{ paddingBottom: "56.25%" }}
                          >
                            <iframe
                              className="absolute top-0 left-0 w-full h-full rounded-md"
                              src={`https://www.youtube.com/embed/${videoId}`}
                              title={selectedArticle.strTitle}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        );
                      }
                    })()}

                  {/* Related Articles */}
                  {selectedArticle.strCategoryName &&
                    (() => {
                      const relatedArticles = categoriesWithArticles
                        ?.find(
                          (cat) =>
                            cat.strCategoryGUID ===
                            selectedArticle.strCategoryGUID
                        )
                        ?.Articles?.filter(
                          (a) =>
                            a.strArticleGUID !== selectedArticle.strArticleGUID
                        )
                        .slice(0, 3);

                      return relatedArticles && relatedArticles.length > 0 ? (
                        <div className="mt-6 pt-6 border-t border-border">
                          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
                            RELATED ARTICLES
                          </h3>
                          <div className="space-y-1">
                            {relatedArticles.map((article) => (
                              <button
                                key={article.strArticleGUID}
                                onClick={() =>
                                  handleArticleClick(article.strArticleGUID)
                                }
                                className="w-full text-left text-sm text-primary hover:text-primary/80 hover:underline"
                              >
                                {article.strTitle}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Article not found
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
