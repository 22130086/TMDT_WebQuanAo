package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "banners")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Banner {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(nullable = false)
    private String imageUrl;

    private String linkUrl;
    private String position;
    private Boolean isActive = true;
    private LocalDate startDate;
    private LocalDate endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist public void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  public void onUpdate() { updatedAt = LocalDateTime.now(); }
}
