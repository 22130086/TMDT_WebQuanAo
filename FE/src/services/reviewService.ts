import http from "./http";

export interface ReviewData {
  id: number;
  productId: number;
  productName?: string;
  rating: number;
  comment: string;
  customerId: number;
  customerName: string;
  customerAvatar: string | null;
  reply: string | null;
  repliedAt: string | null;
  isReported?: boolean;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface ReviewPage {
  content: ReviewData[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export const reviewService = {
  /** Lấy danh sách đánh giá của sản phẩm (public) */
  getProductReviews: async (
    productId: number,
    page = 0,
    size = 10
  ): Promise<{ success: boolean; data: ReviewPage; message?: string }> => {
    const response = await http.get(
      `/reviews/products/${productId}?page=${page}&size=${size}`
    );
    return response.data;
  },

  /** Lấy tổng quan đánh giá (public) */
  getProductReviewSummary: async (
    productId: number
  ): Promise<{ success: boolean; data: ReviewSummary }> => {
    const response = await http.get(
      `/reviews/products/${productId}/summary`
    );
    return response.data;
  },

  /** Thêm đánh giá sản phẩm (CUSTOMER) */
  addProductReview: async (data: {
    productId: number;
    rating: number;
    comment: string;
    orderId?: number;
  }): Promise<{ success: boolean; data: ReviewData; message?: string }> => {
    const response = await http.post("/reviews/products", data);
    return response.data;
  },

  /** Sửa đánh giá (CUSTOMER) */
  updateProductReview: async (
    reviewId: number,
    data: { rating: number; comment: string }
  ): Promise<{ success: boolean; data: ReviewData; message?: string }> => {
    const response = await http.put(`/reviews/products/${reviewId}`, data);
    return response.data;
  },

  /** Xóa đánh giá (CUSTOMER) */
  deleteProductReview: async (
    reviewId: number
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await http.delete(`/reviews/products/${reviewId}`);
    return response.data;
  },

  /** Lấy đánh giá của tôi trong 1 đơn hàng */
  getMyReviewsForOrder: async (
    orderId: number
  ): Promise<{ success: boolean; data: ReviewData[] }> => {
    const response = await http.get(`/reviews/my-reviews?orderId=${orderId}`);
    return response.data;
  },

  /** Lấy tất cả đánh giá của tôi (trang quản lý) */
  getMyAllReviews: async (
    page = 0,
    size = 10
  ): Promise<{ success: boolean; data: ReviewPage; message?: string }> => {
    const response = await http.get(`/reviews/my?page=${page}&size=${size}`);
    return response.data;
  },
};
