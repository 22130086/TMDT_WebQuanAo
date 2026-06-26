package com.fashion.marketplace.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FactoryReviewResponse {
    private Long id;
    private int rating;
    private String comment;
    private String customerName;
    private String customerAvatar;
    private String reply;
    private LocalDateTime repliedAt;
    private LocalDateTime createdAt;
}
