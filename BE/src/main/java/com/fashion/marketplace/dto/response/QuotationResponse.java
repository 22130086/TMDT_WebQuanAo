package com.fashion.marketplace.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuotationResponse {
    private Long id;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal totalPrice;
    private String note;
    private Integer deliveryDays;
    private String status;

    // Post info
    private Long postId;
    private String postTitle;

    // Factory info
    private Long factoryId;
    private String factoryName;

    // Customer info
    private Long customerId;
    private String customerName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}