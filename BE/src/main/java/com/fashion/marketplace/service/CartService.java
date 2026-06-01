package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.CartRequest;
import com.fashion.marketplace.dto.response.CartItemResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // GET CART (Theo ID) - Đảm bảo an toàn, không tự tạo bừa bãi dưới DB khi chỉ xem
    @Transactional(readOnly = true)
    public List<CartItemResponse> getCart(Long userId) {
        // Nếu không tìm thấy giỏ hàng, trả về list rỗng luôn, không gọi createCart nữa
        Cart cart = cartRepository.findByCustomer_Id(userId).orElse(null);
        
        if (cart == null || cart.getItems() == null || cart.getItems().isEmpty()) {
            return List.of();
        }

        return cart.getItems().stream().map(item ->
                CartItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        // Kiểm tra null an toàn cho danh sách ảnh của Product
                        .image(item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty() 
                                ? item.getProduct().getImages().get(0).getImageUrl() : null)
                        .price(item.getProduct().getPrice())
                        .quantity(item.getQuantity())
                        .build()
        ).toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
    }

    // CREATE CART - Hàm này chỉ chạy khi thực sự cần tạo lúc Add To Cart
    @Transactional
    public Cart createCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        Cart cart = Cart.builder()
                .customer(user)
                .items(new ArrayList<>())
                .build();

        return cartRepository.save(cart);
    }

    // ADD TO CART
    @Transactional
    public void addToCart(Long userId, CartRequest req) {
        // Lúc này nếu chưa có giỏ hàng thì mới tạo mới dưới DB (Hợp lý vì đây là lệnh ghi dữ liệu)
        Cart cart = cartRepository.findByCustomer_Id(userId)
                .orElseGet(() -> createCart(userId));

        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product không tồn tại"));

        // Kiểm tra trùng sản phẩm trong giỏ hàng
        for (CartItem item : cart.getItems()) {
            if (item.getProduct().getId().equals(req.getProductId())) {
                item.setQuantity(item.getQuantity() + req.getQuantity());
                cartItemRepository.save(item); // Lưu trực tiếp item
                return;
            }
        }

        // Nếu là sản phẩm mới, thêm mới vào giỏ
        CartItem item = CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(req.getQuantity())
                .unitPrice(product.getPrice()) 
                .build();

        cartItemRepository.save(item);
    }

    @Transactional
    public void addToCartByEmail(String email, CartRequest req) {
        User user = getUserByEmail(email);
        addToCart(user.getId(), req);
    }

    // Thêm annotation này để tránh lỗi LazyInitializationException khi Controller gọi hàm bằng Email
    @Transactional(readOnly = true)
    public List<CartItemResponse> getCartByEmail(String email) {
        User user = getUserByEmail(email);
        return getCart(user.getId());
    }
    
    // UPDATE QUANTITY
    @Transactional
    public void updateQuantity(Long userId, Long cartItemId, CartRequest req) {
        CartItem item = cartItemRepository.findByIdAndCartCustomer_Id(cartItemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item không tồn tại"));

        if (req.getQuantity() <= 0) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn 0");
        }

        item.setQuantity(req.getQuantity());
        cartItemRepository.save(item);
    }

    @Transactional
        public void updateQuantityByEmail(String email, Long cartItemId, CartRequest req) {
        // 1. Tìm chính xác dòng CartItem bằng ID (Frontend truyền lên là 1, 2)
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item không tồn tại thực sự với ID: " + cartItemId));

        // 2. Kiểm tra bảo mật xem giỏ hàng này có đúng là của User có Email này không
        if (cartItem.getCart().getCustomer() == null || 
                !cartItem.getCart().getCustomer().getEmail().equals(email)) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền sửa sản phẩm này");
        }

        if (req.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng phải lớn hơn 0");
        }

        // 3. Thay đổi số lượng và lưu
        cartItem.setQuantity(req.getQuantity());
        cartItemRepository.save(cartItem);
        }

    // DELETE ITEM
    @Transactional
    public void deleteItem(Long userId, Long cartItemId) {
        CartItem item = cartItemRepository.findByIdAndCartCustomer_Id(cartItemId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item không tồn tại"));

        cartItemRepository.delete(item);
    }

    @Transactional
    public void deleteItemByEmail(String email, Long cartItemId) {
        // 1. Tìm chính xác dòng CartItem bằng hàm findById mặc định của JPA (Luôn đúng)
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item không tồn tại với ID: " + cartItemId));

        // 2. Kiểm tra bảo mật xem giỏ hàng này có đúng là của User đang đăng nhập không
        if (cartItem.getCart().getCustomer() == null || 
                !cartItem.getCart().getCustomer().getEmail().equals(email)) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền xóa sản phẩm này");
        }

        // 3. Thực hiện xóa trực tiếp đối tượng đã tìm thấy
        cartItemRepository.delete(cartItem);
    }
}