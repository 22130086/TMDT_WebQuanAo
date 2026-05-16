package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factory_id", nullable = false)
    private FactoryProfile factory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    private Integer stock = 0;

    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String rejectedReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImage> images = new ArrayList<>();

    @PrePersist public void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  public void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum ProductStatus { DRAFT, PENDING, ACTIVE, HIDDEN, REJECTED }
}
