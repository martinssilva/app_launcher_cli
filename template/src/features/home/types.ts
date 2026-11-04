export interface Item {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PageParams {
  page?: number;
  limit?: number;
}
