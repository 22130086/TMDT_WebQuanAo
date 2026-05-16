package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.OrderRequest;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final FactoryProfileRepository factoryProfileRepository;
    private final QuotationRepository quotationRepository;
    private final DiscountCodeRepository discountCodeRepository;
    private final NotificationService notificationService;

    @Transactional
    public Order placeOrder(Long customerId, OrderRequest req) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
        FactoryProfile factory = factoryProfileRepository.findById(req.getFactoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Xưởng không tồn tại"));

        BigDecimal total = req.getItems().stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal discount = BigDecimal.ZERO;
        DiscountCode discountCode = null;
        if (req.getDiscountCode() != null) {
            discountCode = discountCodeRepository.findByCode(req.getDiscountCode())
                    .orElseThrow(() -> new IllegalArgumentException("Mã giảm giá không hợp lệ"));
            discount = applyDiscount(discountCode, total);
            discountCode.setUsedCount(discountCode.getUsedCount() + 1);
        }

        Order order = Order.builder()
                .customer(customer)
                .factory(factory)
                .orderType(req.getOrderType())
                .totalAmount(total)
                .discountAmount(discount)
                .finalAmount(total.subtract(discount))
                .discountCode(discountCode)
                .paymentMethod(req.getPaymentMethod())
                .receiverName(req.getReceiverName())
                .receiverPhone(req.getReceiverPhone())
                .shippingAddress(req.getShippingAddress())
                .note(req.getNote())
                .status(Order.OrderStatus.PENDING)
                .build();

        if (req.getQuotationId() != null) {
            order.setQuotation(quotationRepository.findById(req.getQuotationId()).orElse(null));
        }

        List<OrderItem> items = req.getItems().stream().map(i -> {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setQuantity(i.getQuantity());
            item.setUnitPrice(i.getUnitPrice());
            return item;
        }).collect(Collectors.toList());
        order.setItems(items);

        Order saved = orderRepository.save(order);

        notificationService.push(factory.getUser().getId(),
                "Đơn hàng mới", "Bạn có đơn hàng mới #" + saved.getId(), "ORDER", saved.getId());

        return saved;
    }

    // Khách hàng xem đơn
    public Page<Order> getByCustomer(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerId(customerId, pageable);
    }

    // Xưởng xem đơn mẫu sẵn
    public Page<Order> getReadyMadeByFactory(Long userId, Pageable pageable) {
        FactoryProfile f = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        return orderRepository.findByFactoryIdAndOrderType(f.getId(), Order.OrderType.READY_MADE, pageable);
    }

    // Xưởng xem đơn gia công
    public Page<Order> getOutsourcingByFactory(Long userId, Pageable pageable) {
        FactoryProfile f = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        return orderRepository.findByFactoryIdAndOrderType(f.getId(), Order.OrderType.OUTSOURCING, pageable);
    }

    @Transactional
    public Order updateStatus(Long userId, Long orderId, Order.OrderStatus newStatus, boolean isFactory) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        if (isFactory) {
            FactoryProfile f = factoryProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
            if (!order.getFactory().getId().equals(f.getId()))
                throw new AccessDeniedException("Không có quyền cập nhật đơn này");
        } else {
            // customer cancel
            if (!order.getCustomer().getId().equals(userId))
                throw new AccessDeniedException("Không có quyền hủy đơn này");
            if (order.getStatus() != Order.OrderStatus.PENDING)
                throw new IllegalStateException("Chỉ có thể hủy đơn đang chờ xử lý");
        }
        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);

        notificationService.push(order.getCustomer().getId(),
                "Cập nhật đơn hàng", "Đơn hàng #" + orderId + " → " + newStatus,
                "ORDER", orderId);
        return saved;
    }

    public Order getById(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
    }

    private BigDecimal applyDiscount(DiscountCode code, BigDecimal total) {
        if (code.getDiscountType() == DiscountCode.DiscountType.PERCENT) {
            return total.multiply(code.getDiscountValue()).divide(BigDecimal.valueOf(100));
        }
        return code.getDiscountValue().min(total);
    }
}
