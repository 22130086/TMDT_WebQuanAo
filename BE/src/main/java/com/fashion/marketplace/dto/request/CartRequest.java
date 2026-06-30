package com.fashion.marketplace.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartRequest {
    @NotNull private Long productId;
    @NotNull @Min(1) private Integer quantity;
    private String attributes;
}