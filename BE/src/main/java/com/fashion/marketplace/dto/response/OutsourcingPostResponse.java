package com.fashion.marketplace.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OutsourcingPostResponse {
    private Long id;
    private String title;
    private String description;
    private Integer quantity;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private LocalDate deadline;
    private String status;

    // Category
    private Long categoryId;
    private String categoryName;

    // Customer (để xưởng xem thông tin người đăng)
    private Long customerId;
    private String customerName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}