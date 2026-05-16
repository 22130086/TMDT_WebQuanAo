package com.fashion.marketplace.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuotationRequest {
    private Long postId;
    @NotNull @DecimalMin("0.01") private BigDecimal unitPrice;
    @NotNull @Min(1) private Integer quantity;
    private String note;
    private Integer deliveryDays;
}
