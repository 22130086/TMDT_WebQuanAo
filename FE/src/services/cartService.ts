import http from "./http";

const API_URL = "/cart";

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  image: string;
  price: number;
  quantity: number;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET CART
export async function getCart() {
  const token = localStorage.getItem("token"); // Hoặc nơi bạn lưu token
  
  const response = await http.get<ApiResponse<CartItem[]>>(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}

// ADD TO CART
export async function addToCart(
  productId: number,
  quantity: number
) {
  const response = await http.post(
    API_URL,
    {
      productId,
      quantity,
    }
  );

  return response.data;
}

// UPDATE QUANTITY
// Trong file cartService.ts
export async function updateQuantity(
  cartItemId: number,
  quantity: number,
  productId: number
) {
  // 1. Ép lấy Token từ localStorage (Hãy đổi chữ "token" thành "accessToken" hoặc đúng tên key bạn đang lưu)
  const token = localStorage.getItem("token"); 

  // 2. Gửi request PUT kèm theo cấu hình Headers
  const response = await http.put(
    `${API_URL}/${cartItemId}`,
    {
      productId: productId,
      quantity: quantity 
    },
    {
      headers: {
        // Bắt buộc phải có dòng này để Backend nhận diện được tài khoản của bạn
        Authorization: `Bearer ${token}` 
      }
    }
  );

  return response.data;
}

// DELETE ITEM
export async function deleteCartItem(
  cartItemId: number
) {
  const response = await http.delete(
    `${API_URL}/${cartItemId}`
  );

  return response.data;
}