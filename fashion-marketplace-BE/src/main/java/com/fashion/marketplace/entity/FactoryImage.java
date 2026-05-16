package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "factory_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FactoryImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factory_id")
    private FactoryProfile factory;

    private String imageUrl;
    private Boolean isPrimary = false;
    private LocalDateTime createdAt;

    @PrePersist public void onCreate() { createdAt = LocalDateTime.now(); }
}
