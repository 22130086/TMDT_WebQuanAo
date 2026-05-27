package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.*;
import com.fashion.marketplace.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // GET CART
    @GetMapping
    public ResponseEntity<?> getCart(Authentication authentication) {
        // Phòng thủ nếu cấu hình Spring Security cho phép đi qua nhưng chưa bắt được Token
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Bạn chưa đăng nhập hoặc Token không hợp lệ");
        }

        String email = authentication.getName();
        
        // Nếu token chưa cấu hình phân quyền tốt, nó có thể trả về chuỗi "anonymousUser"
        if ("anonymousUser".equals(email)) {
            return ResponseEntity.status(401).body("Token không hợp lệ (Anonymous User)");
        }

        return ResponseEntity.ok(cartService.getCartByEmail(email));
    }

    // ADD TO CART
    @PostMapping
    public ResponseEntity<?> addToCart(
            @Valid @RequestBody CartRequest req,
            Authentication authentication
    ) {

        String email = authentication.getName();

        cartService.addToCartByEmail(email, req);

        return ResponseEntity.ok("Đã thêm vào giỏ hàng");
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<?> updateQuantity(
            @PathVariable Long id,
            @Valid @RequestBody CartRequest req,
            Authentication authentication
    ) {

        String email = authentication.getName();

        cartService.updateQuantityByEmail(email,id,req);

        return ResponseEntity.ok("Cập nhật thành công");
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteItem(
            @PathVariable Long id,
            Authentication authentication
    ) {

        String email = authentication.getName();

        cartService.deleteItemByEmail(email,id);

        return ResponseEntity.ok("Đã xóa sản phẩm");
    }
}