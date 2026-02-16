// Help Center Types

export interface HelpCategory {
  strCategoryGUID: string;
  strCategoryName: string;
  strDescription?: string;
  strIcon?: string;
  strModuleGUID?: string;
  strModuleName?: string;
  intOrder: number;
  bolIsActive: boolean;
  Articles?: HelpArticle[];
}

export interface HelpArticle {
  strArticleGUID: string;
  strCategoryGUID: string;
  strCategoryName?: string;
  strModuleGUID?: string;
  strModuleName?: string;
  strTitle: string;
  strContent: string;
  strVideoUrl?: string;
  intOrder: number;
  bolIsActive: boolean;
  bolIsFeatured: boolean;
  dtCreatedOn: Date;
  dtModifiedOn?: Date;
}

export interface HelpCategoryCreate {
  strCategoryName: string;
  strDescription?: string;
  strIcon?: string;
  strModuleGUID?: string;
  intOrder?: number;
  bolIsActive?: boolean;
}

export interface HelpCategoryUpdate {
  strCategoryName: string;
  strDescription?: string;
  strIcon?: string;
  strModuleGUID?: string;
  intOrder: number;
  bolIsActive: boolean;
}

export interface HelpArticleCreate {
  strCategoryGUID: string;
  strModuleGUID?: string;
  strTitle: string;
  strContent: string;
  strVideoUrl?: string;
  intOrder?: number;
  bolIsActive?: boolean;
  bolIsFeatured?: boolean;
}

export interface HelpArticleUpdate {
  strCategoryGUID: string;
  strModuleGUID?: string;
  strTitle: string;
  strContent: string;
  strVideoUrl?: string;
  intOrder: number;
  bolIsActive: boolean;
  bolIsFeatured: boolean;
}

export interface HelpArticleSearch {
  searchTerm?: string;
  strCategoryGUID?: string;
  bolIsFeatured?: boolean;
  includeInactive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  strModuleGUID?: string;
}

export interface HelpCategorySearch {
  includeInactive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  search?: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
