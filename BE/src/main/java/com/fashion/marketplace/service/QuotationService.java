package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.AcceptQuotationRequest;
import com.fashion.marketplace.dto.request.QuotationRequest;
import com.fashion.marketplace.dto.response.QuotationResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final FactoryProfileRepository factoryProfileRepository;
    private final OutsourcingPostRepository outsourcingPostRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final VNPayService vnPayService;
    private final NotificationService notificationService;

    @Transactional
    public QuotationResponse send(Long factoryUserId, QuotationRequest req) {
        FactoryProfile factory = factoryProfileRepository.findByUserId(factoryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));

        if (req.getPostId() == null) throw new IllegalArgumentException("Cần cung cấp postId");

        OutsourcingPost post = outsourcingPostRepository.findById(req.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại"));

        if (post.getStatus() != OutsourcingPost.PostStatus.OPEN)
            throw new IllegalStateException("Bài đăng không còn nhận báo giá");

        User customer = post.getCustomer();
        BigDecimal total = req.getUnitPrice().multiply(BigDecimal.valueOf(req.getQuantity()));

        Quotation q = Quotation.builder()
                .post(post)
                .factory(factory)
                .customer(customer)
                .unitPrice(req.getUnitPrice())
                .quantity(req.getQuantity())
                .totalPrice(total)
                .note(req.getNote())
                .deliveryDays(req.getDeliveryDays())
                .status(Quotation.QuotationStatus.PENDING)
                .build();

        Quotation saved = quotationRepository.save(q);

        notificationService.push(customer.getId(),
                "Báo giá mới",
                factory.getFactoryName() + " đã gửi báo giá cho bạn",
                "QUOTATION", saved.getId());

        return toResponse(saved);
    }

    @Transactional
    public QuotationResponse update(Long factoryUserId, Long quotationId, QuotationRequest req) {
        Quotation q = getOwnedByFactory(factoryUserId, quotationId);
        if (q.getStatus() != Quotation.QuotationStatus.PENDING)
            throw new IllegalStateException("Chỉ có thể sửa báo giá đang chờ");

        q.setUnitPrice(req.getUnitPrice());
        q.setQuantity(req.getQuantity());
        q.setTotalPrice(req.getUnitPrice().multiply(BigDecimal.valueOf(req.getQuantity())));
        q.setNote(req.getNote());
        q.setDeliveryDays(req.getDeliveryDays());
        return toResponse(quotationRepository.save(q));
    }

    @Transactional
    public QuotationResponse cancel(Long factoryUserId, Long quotationId) {
        Quotation q = getOwnedByFactory(factoryUserId, quotationId);
        if (q.getStatus() != Quotation.QuotationStatus.PENDING)
            throw new IllegalStateException("Chỉ có thể hủy báo giá đang chờ");
        q.setStatus(Quotation.QuotationStatus.CANCELLED);
        return toResponse(quotationRepository.save(q));
    }

    @Transactional
    public QuotationResponse withdraw(Long factoryUserId, Long quotationId) {
        Quotation q = getOwnedByFactory(factoryUserId, quotationId);
        if (q.getStatus() != Quotation.QuotationStatus.PENDING)
            throw new IllegalStateException("Chỉ có thể rút báo giá đang chờ");
        q.setStatus(Quotation.QuotationStatus.WITHDRAWN);
        return toResponse(quotationRepository.save(q));
    }

    @Transactional
    public QuotationResponse accept(Long customerId, Long quotationId, AcceptQuotationRequest req) {
        Quotation q = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại"));
        if (!q.getCustomer().getId().equals(customerId))
            throw new AccessDeniedException("Không có quyền thao tác");
        if (q.getStatus() != Quotation.QuotationStatus.PENDING)
            throw new IllegalStateException("Báo giá không ở trạng thái chờ");
        if (q.getPost().getStatus() != OutsourcingPost.PostStatus.OPEN)
            throw new IllegalStateException("Bài đăng không còn nhận báo giá");

        BigDecimal deposit = q.getTotalPrice()
                .multiply(BigDecimal.valueOf(30))
                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);

        Order order = Order.builder()
                .customer(q.getCustomer())
                .factory(q.getFactory())
                .quotation(q)
                .orderType(Order.OrderType.OUTSOURCING)
                .totalAmount(q.getTotalPrice())
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(q.getTotalPrice())
                .depositAmount(deposit)
                .status(Order.OrderStatus.PENDING)
                .paymentStatus(Order.PaymentStatus.UNPAID)
                .receiverName(req != null ? req.getReceiverName() : null)
                .receiverPhone(req != null ? req.getReceiverPhone() : null)
                .shippingAddress(req != null ? req.getShippingAddress() : null)
                .note(req != null ? req.getNote() : null)
                .build();
        orderRepository.save(order);

        // Tạo link VNPay
        String paymentUrl = null;
        try {
            paymentUrl = vnPayService.createPaymentUrl(
                    deposit.longValue(), order.getId().toString());
        } catch (Exception ignored) {}

        QuotationResponse resp = toResponse(q);
        resp.setOrderId(order.getId());
        if (paymentUrl != null) resp.setNote(paymentUrl);
        return resp;
    }

    // Gọi từ VNPay callback khi thanh toán thành công
    @Transactional
    public void confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        order.setPaymentStatus(Order.PaymentStatus.DEPOSIT_PAID);
        order.setStatus(Order.OrderStatus.CONFIRMED);
        order.setDepositPaidAt(java.time.LocalDateTime.now());
        orderRepository.save(order);

        Quotation q = order.getQuotation();
        if (q != null) {
            // Accept quotation này
            q.setStatus(Quotation.QuotationStatus.ACCEPTED);
            quotationRepository.save(q);

            // Reject tất cả quotation PENDING khác cùng post
            quotationRepository.findByPostIdAndStatus(
                    q.getPost().getId(), Quotation.QuotationStatus.PENDING).forEach(other -> {
                if (!other.getId().equals(q.getId())) {
                    other.setStatus(Quotation.QuotationStatus.REJECTED);
                    quotationRepository.save(other);
                }
            });

            // Post → IN_PROGRESS
            OutsourcingPost post = q.getPost();
            if (post != null && post.getStatus() == OutsourcingPost.PostStatus.OPEN) {
                post.setStatus(OutsourcingPost.PostStatus.IN_PROGRESS);
                outsourcingPostRepository.save(post);
            }

            // Thông báo
            notificationService.push(q.getFactory().getUser().getId(),
                    "Báo giá được chấp nhận",
                    "Khách hàng đã chấp nhận và thanh toán cọc báo giá #" + q.getId(),
                    "QUOTATION", q.getId());
            notificationService.push(q.getCustomer().getId(),
                    "Thanh toán thành công",
                    "Bạn đã thanh toán cọc " + String.format("%,.0f", order.getDepositAmount())
                            + " VNĐ. Đơn hàng #" + orderId + " đã được xác nhận.",
                    "ORDER", orderId);
        }
    }

    // Gọi từ VNPay callback khi thanh toán thất bại
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        // Chỉ hủy order, quotation và post giữ nguyên
        order.setStatus(Order.OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    @Transactional
    public QuotationResponse reject(Long customerId, Long quotationId) {
        Quotation q = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại"));
        if (!q.getCustomer().getId().equals(customerId))
            throw new AccessDeniedException("Không có quyền thao tác");
        if (q.getStatus() != Quotation.QuotationStatus.PENDING)
            throw new IllegalStateException("Báo giá không ở trạng thái chờ");

        q.setStatus(Quotation.QuotationStatus.REJECTED);
        return toResponse(quotationRepository.save(q));
    }

    @Transactional(readOnly = true)
    public Page<QuotationResponse> getByFactory(Long factoryUserId, Pageable pageable) {
        FactoryProfile f = factoryProfileRepository.findByUserId(factoryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        return quotationRepository.findByFactoryId(f.getId(), pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuotationResponse> getByCustomer(Long customerId, Pageable pageable) {
        return quotationRepository.findByCustomerId(customerId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<QuotationResponse> getByPost(Long postId, Pageable pageable) {
        return quotationRepository.findByPostId(postId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public QuotationResponse getById(Long id) {
        return toResponse(quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại")));
    }

    private Quotation getOwnedByFactory(Long factoryUserId, Long quotationId) {
        FactoryProfile factory = factoryProfileRepository.findByUserId(factoryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        Quotation q = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại"));
        if (!q.getFactory().getId().equals(factory.getId()))
            throw new AccessDeniedException("Không có quyền thao tác báo giá này");
        return q;
    }


    public QuotationResponse toResponse(Quotation q) {
        return QuotationResponse.builder()
                .id(q.getId())
                .unitPrice(q.getUnitPrice())
                .quantity(q.getQuantity())
                .totalPrice(q.getTotalPrice())
                .note(q.getNote())
                .deliveryDays(q.getDeliveryDays())
                .status(q.getStatus() != null ? q.getStatus().name() : null)
                .postId(q.getPost() != null ? q.getPost().getId() : null)
                .postTitle(q.getPost() != null ? q.getPost().getTitle() : null)
                .factoryId(q.getFactory().getId())
                .factoryName(q.getFactory().getFactoryName())
                .customerId(q.getCustomer().getId())
                .customerName(q.getCustomer().getFullName())
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .build();
    }
}