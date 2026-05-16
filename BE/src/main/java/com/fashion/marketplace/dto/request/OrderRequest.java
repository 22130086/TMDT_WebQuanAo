package com.fashion.marketplace.dto.request;

import com.fashion.marketplace.entity.Order;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderRequest {
    @NotNull private Long factoryId;
    private Long quotationId;
    @NotNull private Order.OrderType orderType;
    @NotNull private Order.PaymentMethod paymentMethod;
    @NotBlank private String receiverName;
    @NotBlank private String receiverPhone;
    @NotBlank private String shippingAddress;
    private String discountCode;
    private String note;
    private List<OrderItemRequest> items;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemRequest {
        private Long productId;
        @Min(1) private Integer quantity;
        @NotNull private BigDecimal unitPrice;
    }
}
