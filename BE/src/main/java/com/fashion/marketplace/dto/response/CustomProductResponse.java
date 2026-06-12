package com.fashion.marketplace.dto.response;

import com.fashion.marketplace.entity.CustomProduct;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomProductResponse {

    private Long id;
    private Long customerId;

    private String name;
    private String description;

    private String designFileUrl;
    private CustomProduct.Status status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

