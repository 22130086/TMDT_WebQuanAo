package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "categories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(unique = true, length = 191)
    private String slug;

    private LocalDateTime createdAt;

    @PrePersist public void onCreate() { createdAt = LocalDateTime.now(); }
}
