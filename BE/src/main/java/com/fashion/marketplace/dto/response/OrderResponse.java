package com.fashion.marketplace.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long customerId;
    private String customerEmail; 
    private String customerName;
    private Long factoryId;
    private String factoryName;
    private String orderType;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private BigDecimal depositAmount;
    private String status;
    private String issueType;
    private String issueReason;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String note;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime createdAt;
    private String paymentUrl;
    
    // Ảnh thiết kế (cho đơn gia công)
    private String designFileUrl;
    private String designFileUrlBack;
    
    // 🌟 THÊM DANH SÁCH SẢN PHẨM AN TOÀN Ở ĐÂY
    private List<OrderItemResponse> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}