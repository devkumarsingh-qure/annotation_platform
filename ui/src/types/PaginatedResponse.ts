export type PaginatedResponse<T> = {
    current_page_number: number;
    page_size: number;
    total_results: number;
    results: T[];
}