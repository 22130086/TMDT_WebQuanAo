package com.fashion.marketplace.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductReviewResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Integer rating;
    private String comment;

    // Customer info
    private Long customerId;
    private String customerName;
    private String customerAvatar;

    // Factory reply
    private String reply;
    private LocalDateTime repliedAt;

    // Report
    private Boolean isReported;

    private LocalDateTime createdAt;
}
