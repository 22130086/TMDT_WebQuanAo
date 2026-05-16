package com.fashion.marketplace.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OutsourcingPostRequest {
    @NotBlank private String title;
    private String description;
    @NotNull @Min(1) private Integer quantity;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private LocalDate deadline;
    private Long categoryId;
}
