package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.OrderRequest;
import com.fashion.marketplace.dto.request.PaymentRequest;
import com.fashion.marketplace.dto.response.OrderResponse;
import com.fashion.marketplace.dto.response.OrderResponseDTO;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;

import jakarta.servlet.http.HttpServletRequest;
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
    private final ProductRepository productRepository; 
    private final WalletService walletService;
    private final ComplaintRepository complaintRepository;
    private final DisputeRepository disputeRepository;
    private final OutsourcingPostRepository outsourcingPostRepository;
    private final CustomProductRepository customProductRepository;

    private final PaymentService paymentService;
    private final HttpServletRequest httpServletRequest;

    // 🌟 HÀM CHUYỂN ĐỔI CHUNG (MAPPER) TỪ ENTITY SANG DTO AN TOÀN
    private OrderResponse convertToResponse(Order order) {
        List<OrderResponse.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> {
                    String firstImage = null;
                    if (item.getProduct() != null && item.getProduct().getImages() != null
                            && !item.getProduct().getImages().isEmpty()) {
                        firstImage = item.getProduct().getImages().get(0).getImageUrl();
                    }
                    return OrderResponse.OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .productImage(firstImage)
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .attributes(item.getAttributes())
                        .build();
                })
                .collect(Collectors.toList());

        String issueType = null;
        String issueReason = null;

        if (order.getId() != null) {
            var complaints = complaintRepository.findByOrderIdAndStatus(order.getId(), Complaint.ComplaintStatus.OPEN);
            if (!complaints.isEmpty()) {
                issueType = "COMPLAINT";
                issueReason = complaints.get(0).getReason();
            } else {
                var disputes = disputeRepository.findByOrderIdAndStatus(order.getId(), Dispute.DisputeStatus.OPEN);
                if (!disputes.isEmpty()) {
                    issueType = "DISPUTE";
                    issueReason = disputes.get(0).getDescription();
                }
            }
        }

        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerEmail(order.getCustomer() != null ? order.getCustomer().getEmail() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
                .factoryId(order.getFactory() != null ? order.getFactory().getId() : null)
                .factoryName(order.getFactory() != null ? order.getFactory().getFactoryName() : null)
                .orderType(order.getOrderType() != null ? order.getOrderType().name() : null)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .depositAmount(order.getDepositAmount())
                .status(order.getStatus().name())
                .issueType(issueType)
                .issueReason(issueReason)
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null)
                .createdAt(order.getCreatedAt())
                .items(itemResponses)
                .designFileUrl(getDesignUrl(order, true))
                .designFileUrlBack(getDesignUrl(order, false))
                .build();
    }

    private String getDesignUrl(Order order, boolean isFront) {
        try {
            if (order.getQuotation() != null
                    && order.getQuotation().getPost() != null
                    && order.getQuotation().getPost().getCustomProduct() != null) {
                return isFront
                        ? order.getQuotation().getPost().getCustomProduct().getDesignFileUrl()
                        : order.getQuotation().getPost().getCustomProduct().getDesignFileUrlBack();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private OrderResponseDTO toOrderResponseDTO(Order order) {
        String displayStatus = order.getStatus() != null ? order.getStatus().name() : null;

        boolean hasOpenComplaint = order.getId() != null && orderRepository
                .findOrdersWithComplaintsByStatus(com.fashion.marketplace.entity.Complaint.ComplaintStatus.OPEN).stream()
                .anyMatch(o -> o.getId().equals(order.getId()));
        if (hasOpenComplaint) {
            displayStatus = "COMPLAINT";
        } else {
            boolean hasOpenDispute = order.getId() != null && orderRepository
                    .findOrdersWithDisputesByStatus(com.fashion.marketplace.entity.Dispute.DisputeStatus.OPEN).stream()
                    .anyMatch(o -> o.getId().equals(order.getId()));
            if (hasOpenDispute) {
                displayStatus = "DISPUTE";
            }
        }

        return OrderResponseDTO.builder()
                .id(order.getId())
                .displayStatus(displayStatus)
                .build();
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrdersWithOpenComplaints() {
        return orderRepository.findOrdersWithComplaintsByStatus(com.fashion.marketplace.entity.Complaint.ComplaintStatus.OPEN).stream()
                .map(order -> OrderResponseDTO.builder()
                        .id(order.getId())
                        .displayStatus("COMPLAINT")
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrdersWithOpenDisputes() {
        return orderRepository.findOrdersWithDisputesByStatus(com.fashion.marketplace.entity.Dispute.DisputeStatus.OPEN).stream()
                .map(order -> OrderResponseDTO.builder()
                        .id(order.getId())
                        .displayStatus("DISPUTE")
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderWithDisplayStatus(Long orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        return toOrderResponseDTO(order);
    }

    @Transactional
    public OrderResponse placeOrder(Long customerId, OrderRequest req) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
        FactoryProfile factory = factoryProfileRepository.findById(req.getFactoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Xưởng không tồn tại"));

        // 1. Tính tổng tiền sản phẩm dựa trên request truyền lên từ frontend
        BigDecimal total = req.getItems().stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Xử lý mã giảm giá (giữ nguyên logic cũ của bạn)
        BigDecimal discount = BigDecimal.ZERO;
        DiscountCode discountCode = null;
        if (req.getDiscountCode() != null) {
            discountCode = discountCodeRepository.findByCode(req.getDiscountCode())
                    .orElseThrow(() -> new IllegalArgumentException("Mã giảm giá không hợp lệ"));
            discount = applyDiscount(discountCode, total);
            discountCode.setUsedCount(discountCode.getUsedCount() + 1);
        }

        // 3. Khởi tạo thực thể Order bao gồm paymentStatus mặc định ban đầu là UNPAID
        Order order = Order.builder()
                .customer(customer)
                .factory(factory)
                .orderType(req.getOrderType())
                .totalAmount(total)
                .discountAmount(discount)
                .finalAmount(total.subtract(discount))
                .discountCode(discountCode)
                .paymentMethod(req.getPaymentMethod()) // Nhận vào từ React ("COD" hoặc "VNPAY")
                .receiverName(req.getReceiverName())
                .receiverPhone(req.getReceiverPhone())
                .shippingAddress(req.getShippingAddress())
                .note(req.getNote())
                .status(Order.OrderStatus.PENDING)          // Mặc định đơn vừa đặt là PENDING
                .paymentStatus(Order.PaymentStatus.UNPAID)   // Mặc định chưa thanh toán cho cả COD và VNPAY
                .build();

        if (req.getQuotationId() != null) {
            order.setQuotation(quotationRepository.findById(req.getQuotationId()).orElse(null));
        }

        // 4. Ánh xạ danh sách items
        List<OrderItem> items = req.getItems().stream().map(i -> {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setQuantity(i.getQuantity());
            item.setUnitPrice(i.getUnitPrice());
            item.setAttributes(i.getAttributes());
            
            Product product = productRepository.findById(i.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại với ID: " + i.getProductId()));
            if (product.getStock() < i.getQuantity()) {
                throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' đã hết hàng hoặc không đủ số lượng tồn kho!");
            }
            product.setStock(product.getStock() - i.getQuantity());
            productRepository.save(product); // Lưu lại số lượng mới vào DB

            item.setProduct(product);              
            item.setProductName(product.getName());   
            return item;
        }).collect(Collectors.toList());
        order.setItems(items);

        // 5. Lưu vào database để sinh ra Order ID duy nhất nhằm làm tham chiếu cho VNPAY (vnp_TxnRef)
        Order saved = orderRepository.save(order);

        // 6. Gửi thông báo đến xưởng
        notificationService.push(factory.getUser().getId(),
                "Đơn hàng mới", "Bạn có đơn hàng mới #" + saved.getId(), "ORDER", saved.getId());

        // 7. Chuyển đổi dữ liệu Entity thành DTO phản hồi (OrderResponse)
        OrderResponse response = convertToResponse(saved);

        // 🌟 8. LOGIC RẼ NHÁNH: Nếu phương thức chọn là VNPAY, tự đúc link thanh toán đẩy kèm vào DTO
        if ("VNPAY".equalsIgnoreCase(saved.getPaymentMethod().toString())) {
            try {
                // Khởi tạo đối tượng Request theo cấu trúc mới sửa bên trên
                com.fashion.marketplace.dto.request.PaymentRequest paymentRequest = 
                    new com.fashion.marketplace.dto.request.PaymentRequest();
                
                paymentRequest.setOrderId(saved.getId()); // Gán Long mượt mà
                paymentRequest.setAmount(saved.getFinalAmount().longValue()); // Lấy phần nguyên của số tiền
                paymentRequest.setOrderInfo("Thanh toan don hang #" + saved.getId());

                // Gọi hàm sinh link từ paymentService (Yêu cầu inject PaymentService và HttpServletRequest vào Service này)
                String vnpayUrl = paymentService.createPaymentUrl(httpServletRequest, paymentRequest);
                
                // Đính link VNPAY vào object response trả về cho Client React
                response.setPaymentUrl(vnpayUrl);
                
            } catch (Exception e) {
                // Log lỗi ra màn hình console, không throw exception để tránh làm lỗi luồng lưu đơn hàng của khách
                e.printStackTrace();
            }
        }

        return response; 
    }

    // 🌟 Chuyển đổi Page<Order> sang Page<OrderResponse> bằng hàm .map()
    @Transactional(readOnly = true)
    public Page<OrderResponse> getByCustomer(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerId(customerId, pageable).map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getReadyMadeByFactory(Long userId, Pageable pageable) {
        FactoryProfile f = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        return orderRepository.findByFactoryIdAndOrderType(f.getId(), Order.OrderType.READY_MADE, pageable).map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getOutsourcingByFactory(Long userId, Pageable pageable) {
        FactoryProfile f = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        return orderRepository.findByFactoryIdAndOrderType(f.getId(), Order.OrderType.OUTSOURCING, pageable).map(this::convertToResponse);
    }

    @Transactional
    public OrderResponse updateStatus(Long userId, Long orderId, Order.OrderStatus newStatus, boolean isFactory) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        if (isFactory) {
            FactoryProfile f = factoryProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
            if (!order.getFactory().getId().equals(f.getId()))
                throw new AccessDeniedException("Không có quyền cập nhật đơn này");
        } else {
            if (!order.getCustomer().getId().equals(userId))
                throw new AccessDeniedException("Không có quyền hủy đơn này");
            if (order.getStatus() != Order.OrderStatus.PENDING)
                throw new IllegalStateException("Chỉ có thể hủy đơn đang chờ xử lý");
        }
        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);

        if (newStatus == Order.OrderStatus.COMPLETED && order.getQuotation() != null) {
            try {
                OutsourcingPost post = order.getQuotation().getPost();
                if (post != null) {
                    post.setStatus(OutsourcingPost.PostStatus.CLOSED);
                    outsourcingPostRepository.save(post);
                    if (post.getCustomProduct() != null) {
                        post.getCustomProduct().setStatus(CustomProduct.Status.CLOSED);
                        customProductRepository.save(post.getCustomProduct());
                    }
                }
            } catch (Exception ignored) {}
        }

        notificationService.push(order.getCustomer().getId(),
                "Cập nhật đơn hàng", "Đơn hàng #" + orderId + " → " + newStatus,
                "ORDER", orderId);
        return convertToResponse(saved); // 🌟 Thay đổi ở đây
    }

    @Transactional
    public void deleteOrderFactory(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        FactoryProfile f = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));

        if (!order.getFactory().getId().equals(f.getId())) {
            throw new AccessDeniedException("Không có quyền xóa đơn này");
        }
        
        if (order.getStatus() != Order.OrderStatus.PENDING || order.getPaymentStatus() != Order.PaymentStatus.UNPAID) {
            throw new IllegalStateException("Chỉ có thể xóa đơn hàng chưa được xác nhận và chưa thanh toán");
        }

        // Hoàn lại số lượng tồn kho nếu là đơn hàng có sẵn
        if (order.getOrderType() == Order.OrderType.READY_MADE) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    product.setStock(product.getStock() + item.getQuantity());
                    productRepository.save(product);
                }
            }
        }

        orderRepository.delete(order);
    }

    @Transactional
    public OrderResponse updateStatusByCustomer(Long customerId, Long orderId) {
        // 1. Tìm đơn hàng
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        // 2. Kiểm tra quyền sở hữu đơn hàng
        if (!order.getCustomer().getId().equals(customerId)) {
            throw new AccessDeniedException("Bạn không có quyền xác nhận đơn hàng này");
        }

        // 3. Kiểm tra trạng thái hợp lệ (chỉ cho phép xác nhận khi đang giao hàng hoặc đã giao hàng)
        if (order.getStatus() != Order.OrderStatus.SHIPPING && order.getStatus() != Order.OrderStatus.DELIVERED) {
            throw new IllegalStateException("Đơn hàng phải ở trạng thái đang giao hoặc đã giao thì mới có thể xác nhận đã nhận");
        }

        // 4. Cập nhật trạng thái
        order.setStatus(Order.OrderStatus.COMPLETED);
        order.setCompletedAt(java.time.LocalDateTime.now()); // Ghi nhận thời điểm hoàn tất

        // Luôn chuyển sang PAID khi hoàn tất (đặc biệt quan trọng cho luồng COD)
        order.setPaymentStatus(Order.PaymentStatus.FULLY_PAID); 

        Order saved = orderRepository.save(order);

        if (order.getQuotation() != null) {
            try {
                OutsourcingPost post = order.getQuotation().getPost();
                if (post != null) {
                    post.setStatus(OutsourcingPost.PostStatus.CLOSED);
                    outsourcingPostRepository.save(post);
                    if (post.getCustomProduct() != null) {
                        post.getCustomProduct().setStatus(CustomProduct.Status.CLOSED);
                        customProductRepository.save(post.getCustomProduct());
                    }
                }
            } catch (Exception ignored) {}
        }

        // 5. CỘNG TIỀN VÀO FROZEN (phong tỏa) — chờ 3 ngày không có khiếu nại/tranh chấp
        //    mới chuyển sang balance khả dụng (qua FrozenReleaseScheduler)
        try {
            walletService.creditFrozen(
                saved.getFactory().getUser().getId(),
                saved.getFinalAmount(),
                "Phong tỏa thanh toán đơn hàng #" + saved.getId() + " (giải phóng sau 3 ngày)",
                saved.getId()
            );
        } catch (Exception e) {
            System.err.println("Lỗi cộng frozen ví xưởng: " + e.getMessage());
        }

        // 6. Gửi thông báo cho xưởng biết khách đã nhận hàng
        notificationService.push(order.getFactory().getUser().getId(),
                "Khách đã nhận hàng", 
                "Đơn hàng #" + orderId + " đã hoàn tất. " +
                String.format("%,.0f", saved.getFinalAmount()) +
                " VNĐ đang phong tỏa, sẽ khả dụng sau 3 ngày nếu không có khiếu nại.",
                "ORDER", orderId);

        return convertToResponse(saved);
    }

    @Transactional
    public OrderResponse updateOrderShippingInfo(Long customerId, Long orderId, com.fashion.marketplace.dto.request.UpdateOrderAddressRequest req) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new AccessDeniedException("Bạn không có quyền cập nhật đơn này");
        }

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể cập nhật địa chỉ khi đơn hàng đang chờ xác nhận");
        }

        order.setReceiverName(req.getReceiverName());
        order.setReceiverPhone(req.getReceiverPhone());
        order.setShippingAddress(req.getShippingAddress());

        Order saved = orderRepository.save(order);

        notificationService.push(order.getFactory().getUser().getId(),
                "Khách cập nhật địa chỉ giao hàng", 
                "Đơn hàng #" + orderId + " đã được cập nhật thông tin nhận hàng.",
                "ORDER", orderId);

        return convertToResponse(saved);
    }

    @Transactional(readOnly = true)
    public OrderResponse getById(Long orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        return convertToResponse(order);
    }

    private BigDecimal applyDiscount(DiscountCode code, BigDecimal total) {
        if (code.getDiscountType() == DiscountCode.DiscountType.PERCENT) {
            return total.multiply(code.getDiscountValue()).divide(BigDecimal.valueOf(100));
        }
        return code.getDiscountValue().min(total);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getFactoryRevenueReport(Long userId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        FactoryProfile factory = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Xưởng chưa có hồ sơ"));

        List<Order> completedOrders = orderRepository.findByFactoryIdAndStatus(factory.getId(), Order.OrderStatus.COMPLETED);

        java.time.LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : null;
        java.time.LocalDateTime end = (endDate != null) ? endDate.atTime(java.time.LocalTime.MAX) : null;

        List<Order> filteredOrders = completedOrders.stream()
                .filter(o -> o.isFrozenReleased() || o.getCompletedAt() == null) // Các đơn cũ (trước khi có tính năng frozen) vẫn được tính
                .filter(o -> start == null || (o.getUpdatedAt() != null && !o.getUpdatedAt().isBefore(start)))
                .filter(o -> end == null || (o.getUpdatedAt() != null && !o.getUpdatedAt().isAfter(end)))
                .collect(Collectors.toList());

        BigDecimal totalRevenue = filteredOrders.stream()
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long orderCount = filteredOrders.size();

        java.util.Map<String, BigDecimal> dailyRevenue = new java.util.LinkedHashMap<>();
        
        if (startDate != null && endDate != null) {
            long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);
            if (daysBetween <= 60) {
                // Group by day
                for (java.time.LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
                    String key = d.toString();
                    java.time.LocalDate currentDate = d;
                    BigDecimal dayTotal = filteredOrders.stream()
                            .filter(o -> o.getUpdatedAt() != null && o.getUpdatedAt().toLocalDate().equals(currentDate))
                            .map(Order::getFinalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    dailyRevenue.put(key, dayTotal);
                }
            } else {
                // Group by month
                for (java.time.LocalDate m = startDate.withDayOfMonth(1); !m.isAfter(endDate); m = m.plusMonths(1)) {
                    java.time.LocalDate monthStart = m;
                    java.time.LocalDate monthEnd = m.plusMonths(1).minusDays(1);
                    String key = monthStart.getYear() + "-" + String.format("%02d", monthStart.getMonthValue());
                    BigDecimal monthTotal = filteredOrders.stream()
                            .filter(o -> o.getUpdatedAt() != null 
                                && !o.getUpdatedAt().toLocalDate().isBefore(monthStart) 
                                && !o.getUpdatedAt().toLocalDate().isAfter(monthEnd))
                            .map(Order::getFinalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    dailyRevenue.put(key, monthTotal);
                }
            }
        } else {
            java.time.LocalDate now = java.time.LocalDate.now();
            java.time.LocalDate rangeStart = now.minusMonths(5).withDayOfMonth(1);
            java.time.LocalDate rangeEnd = now;
            for (java.time.LocalDate m = rangeStart.withDayOfMonth(1); !m.isAfter(rangeEnd); m = m.plusMonths(1)) {
                java.time.LocalDate monthStart = m;
                java.time.LocalDate monthEnd = m.plusMonths(1).minusDays(1);
                String key = monthStart.getYear() + "-" + String.format("%02d", monthStart.getMonthValue());
                BigDecimal monthTotal = filteredOrders.stream()
                        .filter(o -> o.getUpdatedAt() != null 
                            && !o.getUpdatedAt().toLocalDate().isBefore(monthStart) 
                            && !o.getUpdatedAt().toLocalDate().isAfter(monthEnd))
                        .map(Order::getFinalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                dailyRevenue.put(key, monthTotal);
            }
        }

        java.util.List<java.util.Map<String, Object>> chartData = new java.util.ArrayList<>();
        dailyRevenue.forEach((date, rev) -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("date", date);
            map.put("revenue", rev);
            chartData.add(map);
        });

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("orderCount", orderCount);
        result.put("chartData", chartData);
        
        BigDecimal readyMadeRevenue = filteredOrders.stream()
                .filter(o -> o.getOrderType() == Order.OrderType.READY_MADE)
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outsourcingRevenue = filteredOrders.stream()
                .filter(o -> o.getOrderType() == Order.OrderType.OUTSOURCING)
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        java.util.List<java.util.Map<String, Object>> typeData = new java.util.ArrayList<>();
        if (readyMadeRevenue.compareTo(BigDecimal.ZERO) > 0) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("name", "Sản phẩm mẫu sẵn");
            map.put("value", readyMadeRevenue);
            typeData.add(map);
        }
        if (outsourcingRevenue.compareTo(BigDecimal.ZERO) > 0) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("name", "Sản phẩm gia công");
            map.put("value", outsourcingRevenue);
            typeData.add(map);
        }
        result.put("typeData", typeData);
        
        return result;
    }
}