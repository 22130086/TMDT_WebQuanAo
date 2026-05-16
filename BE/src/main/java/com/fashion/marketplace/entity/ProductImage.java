package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "product_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    private String imageUrl;
    private Boolean isPrimary = false;
    private Integer sortOrder = 0;
}
