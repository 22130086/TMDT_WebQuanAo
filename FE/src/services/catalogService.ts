import http from "./http";

export interface ProductCard {
  id: number;
  name: string;
  price: string;
  imageUrls: string[];
  factoryName?: string;
}

export interface FactoryCard {
  id: number;
  factoryName: string;
  description?: string;
  address?: string;
  ratingAvg?: number;
  imageUrls?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export async function fetchProducts(page = 0, size = 8) {
  const response = await http.get<ApiResponse<PageResponse<ProductCard>>>("/products", {
    params: { page, size, sort: "createdAt,desc" },
  });
  return response.data.data;
}

export async function fetchFactories(page = 0, size = 5) {
  const response = await http.get<ApiResponse<PageResponse<FactoryCard>>>("/factories", {
    params: { page, size, sort: "verifiedAt,desc" },
  });
  return response.data.data;
}
