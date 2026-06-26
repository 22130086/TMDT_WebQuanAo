package com.fashion.marketplace.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FactoryProfileResponse {
    private Long id;
    private Long userId;
    private String factoryName;
    private String factoryUserName;
    private String factoryUserEmail;
    private String factoryUserAvatar;
    private String description;
    private String address;
    private Integer minQuantity;
    private Integer maxQuantity;
    private Integer leadTimeDays;
    private BigDecimal ratingAvg;
    private Integer totalRatings;
    private String verifiedStatus;
    private String rejectedReason;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private List<String> imageUrls;
    private List<CertificateItem> certificates;
    private Integer totalProducts;
    private Integer totalOrders;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CertificateItem {
        private Long id;
        private String name;
        private String imageUrl;
        private LocalDate issuedDate;
        private LocalDate expiredDate;
    }
}
