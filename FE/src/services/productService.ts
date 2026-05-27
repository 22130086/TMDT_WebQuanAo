import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

// =========================
// AUTH HEADER
// =========================
const getAuthHeader = () => {
    const token = localStorage.getItem("token");

    return {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    };
};

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
            `${API_BASE_URL}/products?page=${page}&size=${size}`;

        if (keyword) {
            url += `&keyword=${keyword}`;
        }

        if (categoryId) {
            url += `&categoryId=${categoryId}`;
        }

        const response = await axios.get(url);

        return response.data;
    },

    // Lấy chi tiết sản phẩm
    getProductById: async (id: number) => {

        const response = await axios.get(
            `${API_BASE_URL}/products/${id}`
        );

        return response.data;
    },

    // =========================
    // FACTORY APIs
    // =========================

    // Danh sách sản phẩm của xưởng
    getMyProducts: async (page = 0, size = 20) => {

        const response = await axios.get(
            `${API_BASE_URL}/factory/products?page=${page}&size=${size}`,
            getAuthHeader()
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

        const response = await axios.post(
            `${API_BASE_URL}/factory/products`,
            productData,
            getAuthHeader()
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

        const response = await axios.put(
            `${API_BASE_URL}/factory/products/${id}`,
            productData,
            getAuthHeader()
        );

        return response.data;
    },

    // Ẩn sản phẩm
    hideProduct: async (id: number) => {

        const response = await axios.patch(
            `${API_BASE_URL}/factory/products/${id}/hide`,
            {},
            getAuthHeader()
        );

        return response.data;
    },

    // Xóa sản phẩm
    deleteProduct: async (id: number) => {

        const response = await axios.delete(
            `${API_BASE_URL}/factory/products/${id}`,
            getAuthHeader()
        );

        return response.data;
    },
};