package com.fashion.marketplace.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DisputeResponse {
    private Long id;
    private Long orderId;
    private Long initiatedById;
    private String initiatedByName;
    private String description;
    private String evidenceUrl;
    private String status;
    private String verdict;
    private BigDecimal refundToCustomer;
    private BigDecimal transferToFactory;
    private String adminNote;
    private Boolean violationRecorded;
    private Long handledById;
    private LocalDateTime handledAt;
    private LocalDateTime createdAt;
}
