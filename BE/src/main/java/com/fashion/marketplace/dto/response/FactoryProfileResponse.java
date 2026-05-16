package com.fashion.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactoryProfileResponse {
    private Long id;
    private String factoryName;
    private String description;
    private String address;
    private Integer minQuantity;
    private Integer maxQuantity;
    private Integer leadTimeDays;
    private BigDecimal ratingAvg;
    private Integer totalRatings;
    private String verifiedStatus;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private List<String> imageUrls;
}
