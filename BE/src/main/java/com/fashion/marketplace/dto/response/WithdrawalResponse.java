package com.fashion.marketplace.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WithdrawalResponse {
    private Long id;
    private Long factoryUserId;
    private String factoryUserName;
    private String factoryName;
    private BigDecimal amount;
    private String bankName;
    private String accountNumber;
    private String accountName;
    private String status;
    private String adminNote;
    private Long handledById;
    private LocalDateTime handledAt;
    private LocalDateTime createdAt;
}
