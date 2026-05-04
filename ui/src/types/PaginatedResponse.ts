export type PaginatedResponse<T> = {
  total: number;
  results: T[];
};
