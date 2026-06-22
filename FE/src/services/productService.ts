import http from "./http";

export const productService = {

    // =========================
    // PUBLIC APIs
    // =========================

    // Lấy danh sách sản phẩm public
    getProducts: async (
        page = 0,
        size = 20,
        keyword = "",
        categoryId?: number
    ) => {

        let url =
            `/products?page=${page}&size=${size}`;

        if (keyword) {
            url += `&keyword=${encodeURIComponent(keyword)}`;
        }

        if (categoryId) {
            url += `&categoryId=${categoryId}`;
        }

        const response = await http.get(url);

        return response.data;
    },

    // Lấy chi tiết sản phẩm
    getProductById: async (id: number) => {

        const response = await http.get(
            `/products/${id}`
        );

        return response.data;
    },

    // =========================
    // FACTORY APIs
    // =========================

    // Danh sách sản phẩm của xưởng
    getMyProducts: async (page = 0, size = 20) => {

        const response = await http.get(
            `/factory/products?page=${page}&size=${size}`
        );

        return response.data;
    },

    // Thêm sản phẩm
    createProduct: async (productData: {
        name: string;
        description: string;
        price: number;
        stock: number;
        categoryId: number;
        imageUrls: string[];
    }) => {

        const response = await http.post(
            `/factory/products`,
            productData
        );

        return response.data;
    },

    // Cập nhật sản phẩm
    updateProduct: async (
        id: number,
        productData: {
            name: string;
            description: string;
            price: number;
            stock: number;
            categoryId: number;
            imageUrls?: string[];
        }
    ) => {

        const response = await http.put(
            `/factory/products/${id}`,
            productData
        );

        return response.data;
    },

    // Ẩn sản phẩm
    hideProduct: async (id: number) => {
        const response = await http.patch(
            `/factory/products/${id}/hide`
        );
        return response.data;
    },

    // Hiện sản phẩm
    unhideProduct: async (id: number) => {
        const response = await http.patch(
            `/factory/products/${id}/unhide`
        );
        return response.data;
    },

    // Xóa sản phẩm
    deleteProduct: async (id: number) => {

        const response = await http.delete(
            `/factory/products/${id}`
        );

        return response.data;
    },
};