package com.fashion.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "factory_id", nullable = false)
    private FactoryProfile factory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quotation_id")
    private Quotation quotation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderType orderType;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal finalAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discount_code_id")
    private DiscountCode discountCode;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    private String receiverName;
    private String receiverPhone;

    @Column(columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(precision = 15, scale = 2)
    private BigDecimal depositAmount = BigDecimal.ZERO;

    private LocalDateTime depositPaidAt;
    private LocalDateTime finalPaidAt;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist public void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate  public void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum OrderType    { READY_MADE, OUTSOURCING }
    public enum OrderStatus  { PENDING, CONFIRMED, IN_PRODUCTION, READY_TO_SHIP, SHIPPING, DELIVERED, COMPLETED, CANCELLED, DISPUTED }
    public enum PaymentMethod{ VNPAY, MOMO, BANK_TRANSFER, COD }
    public enum PaymentStatus{ UNPAID, DEPOSIT_PAID, FULLY_PAID }
}
