package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity 
@Table(name = "carts")
@Getter 
@Setter 
@NoArgsConstructor  
@AllArgsConstructor 
@Builder
public class Cart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    // Sử dụng @Builder.Default để đảm bảo builder luôn khởi tạo List rỗng thay vì null
    @Builder.Default
    @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CartItem> items = new ArrayList<>();

    /**
     * Hàm Helper để thêm sản phẩm vào giỏ hàng một cách an toàn.
     * Đảm bảo mối quan hệ 2 chiều (Bidirectional) giữa Cart và CartItem được đồng bộ.
     */
    public void addItem(CartItem item) {
        if (this.items == null) {
            this.items = new ArrayList<>();
        }
        this.items.add(item);
        item.setCart(this); // Quan trọng: Đóng vai trò thiết lập quan hệ ngược lại cho CartItem
    }

    /**
     * Hàm Helper để xóa sản phẩm khỏi giỏ hàng một cách an toàn.
     */
    public void removeItem(CartItem item) {
        if (this.items != null) {
            this.items.remove(item);
            item.setCart(null);
        }
    }

    public User getUser() {
        return this.customer;
    }
}