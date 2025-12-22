export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // Número de página actual
  size: number
}