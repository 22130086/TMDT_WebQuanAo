package com.fashion.marketplace.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String status;

    // Chỉ lấy field cần thiết, không load lazy
    private Long factoryId;
    private String factoryName;

    private Long categoryId;
    private String categoryName;

    private List<String> imageUrls;
    private LocalDateTime createdAt;
}