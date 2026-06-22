package com.fashion.marketplace.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductReviewResponse {
    private Long id;
    private Long productId;
    private Integer rating;
    private String comment;

    // Customer info
    private Long customerId;
    private String customerName;
    private String customerAvatar;

    // Factory reply
    private String reply;
    private LocalDateTime repliedAt;

    private LocalDateTime createdAt;
}
