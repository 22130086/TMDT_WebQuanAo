package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "withdrawal_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WithdrawalRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factory_user_id", nullable = false)
    private User factoryUser;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    private String bankName;
    private String accountNumber;
    private String accountName;

    @Enumerated(EnumType.STRING)
    private WithdrawalStatus status = WithdrawalStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String adminNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by")
    private User handledBy;

    private LocalDateTime handledAt;
    private LocalDateTime createdAt;

    @PrePersist public void onCreate() { createdAt = LocalDateTime.now(); }

    public enum WithdrawalStatus { PENDING, APPROVED, REJECTED, TRANSFERRED }
}
