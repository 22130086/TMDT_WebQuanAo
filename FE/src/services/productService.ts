import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Hàm cấu hình tự động chèn JWT Token của xưởng vào Header chuẩn mã hóa Bearer
const getAuthHeader = () => {
    const token = localStorage.getItem('token'); // Lấy token đã lưu từ lúc login thành công
    return {
        headers: {
            // Sửa lại dùng dấu huyền để đảm bảo có đúng 1 khoảng trắng sau chữ Bearer
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const productService = {
    // 2.5 Xem danh sách sản phẩm của chính xưởng đó
    getMyProducts: async (page = 0, size = 20) => {
        const response = await axios.get(`${API_BASE_URL}/factory/products?page=${page}&size=${size}`, getAuthHeader());
        return response.data;
    },

    // 2.1 Thêm sản phẩm mẫu mới
    createProduct: async (productData: { name: string; description: string; price: number; stock: number; categoryId: number; imageUrls: string[] }) => {
        const response = await axios.post(`${API_BASE_URL}/factory/products`, productData, getAuthHeader());
        return response.data;
    },

    // 2.2 Sửa thông tin sản phẩm mẫu
    updateProduct: async (id: number, productData: { name: string; description: string; price: number; stock: number; categoryId: number }) => {
        const response = await axios.put(`${API_BASE_URL}/factory/products/${id}`, productData, getAuthHeader());
        return response.data;
    },

    // 2.4 Ẩn sản phẩm mẫu
    hideProduct: async (id: number) => {
        const response = await axios.patch(`${API_BASE_URL}/factory/products/${id}/hide`, {}, getAuthHeader());
        return response.data;
    },

    // 2.3 Xóa hoàn toàn sản phẩm mẫu khỏi hệ thống
    deleteProduct: async (id: number) => {
        const response = await axios.delete(`${API_BASE_URL}/factory/products/${id}`, getAuthHeader());
        return response.data;
    }
};