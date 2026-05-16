package com.fashion.marketplace.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductRequest {
    @NotBlank private String name;
    private String description;
    @NotNull @DecimalMin("0.0") private BigDecimal price;
    @Min(0) private Integer stock;
    private Long categoryId;
    private List<String> imageUrls;
}
