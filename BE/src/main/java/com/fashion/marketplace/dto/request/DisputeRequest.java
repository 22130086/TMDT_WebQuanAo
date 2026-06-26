package com.fashion.marketplace.dto.request;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DisputeRequest {
    private Long orderId;
    private String description;
    private String evidenceUrl;
}
