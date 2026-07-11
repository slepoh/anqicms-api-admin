export interface Category {
  id: number;
  parent_id: number;
  title: string;
  [key: string]: unknown;
}

export interface CategoriesResponse {
  code: number;
  msg: string;
  data: Category[];
}

export interface ImportResponse {
  code: number;
  msg: string;
  data?: {
    url?: string;
    [key: string]: unknown;
  };
}
