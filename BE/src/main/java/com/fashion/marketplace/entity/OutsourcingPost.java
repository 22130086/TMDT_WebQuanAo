package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "outsourcing_posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OutsourcingPost {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer quantity;

    @Column(precision = 15, scale = 2)
    private BigDecimal budgetMin;

    @Column(precision = 15, scale = 2)
    private BigDecimal budgetMax;

    private LocalDate deadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    private PostStatus status = PostStatus.OPEN;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist public void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  public void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum PostStatus { OPEN, IN_PROGRESS, CLOSED, CANCELLED }
}
