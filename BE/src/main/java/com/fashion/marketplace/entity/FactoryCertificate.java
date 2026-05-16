package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "factory_certificates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FactoryCertificate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factory_id")
    private FactoryProfile factory;

    private String name;
    private String imageUrl;
    private LocalDate issuedDate;
    private LocalDate expiredDate;
    private LocalDateTime createdAt;

    @PrePersist public void onCreate() { createdAt = LocalDateTime.now(); }
}
