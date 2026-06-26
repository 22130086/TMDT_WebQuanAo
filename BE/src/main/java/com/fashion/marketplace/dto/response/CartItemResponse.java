package com.fashion.marketplace.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @Builder @NoArgsConstructor  @AllArgsConstructor
public class CartItemResponse {

    private Long id;

    private Long productId;

    private String productName;

    private String image;

    private BigDecimal price;

    private Integer quantity;
    
    private String attributes;
}