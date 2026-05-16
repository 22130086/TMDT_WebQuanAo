package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "factory_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FactoryProfile {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String factoryName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String address;

    private Integer minQuantity;
    private Integer maxQuantity;
    private Integer leadTimeDays;

    @Column(precision = 3, scale = 2)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    private Integer totalRatings = 0;

    @Enumerated(EnumType.STRING)
    private VerifiedStatus verifiedStatus = VerifiedStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectedReason;

    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "factory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FactoryImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "factory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FactoryCertificate> certificates = new ArrayList<>();

    @PrePersist
    public void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate
    public void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum VerifiedStatus { PENDING, APPROVED, REJECTED }
}
