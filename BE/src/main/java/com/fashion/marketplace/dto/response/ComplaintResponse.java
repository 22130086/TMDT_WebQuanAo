package com.fashion.marketplace.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ComplaintResponse {
    private Long id;
    private Long orderId;
    private Long raisedById;
    private String raisedByName;
    private String reason;
    private String evidenceUrl;
    private String status;
    private String resolution;
    private Long resolvedById;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
