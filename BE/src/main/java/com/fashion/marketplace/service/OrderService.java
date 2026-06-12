package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.OrderRequest;
import com.fashion.marketplace.dto.request.PaymentRequest;
import com.fashion.marketplace.dto.response.OrderResponse; // 🌟 Import DTO mới
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

    private final PaymentService paymentService;
    private final HttpServletRequest httpServletRequest;

    // 🌟 HÀM CHUYỂN ĐỔI CHUNG (MAPPER) TỪ ENTITY SANG DTO AN TOÀN
    private OrderResponse convertToResponse(Order order) {
        List<OrderResponse.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

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
    public Page<OrderResponse> getByCustomer(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerId(customerId, pageable).map(this::convertToResponse);
    }

    public Page<OrderResponse> getReadyMadeByFactory(Long userId, Pageable pageable) {
        FactoryProfile f = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        return orderRepository.findByFactoryIdAndOrderType(f.getId(), Order.OrderType.READY_MADE, pageable).map(this::convertToResponse);
    }

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

        notificationService.push(order.getCustomer().getId(),
                "Cập nhật đơn hàng", "Đơn hàng #" + orderId + " → " + newStatus,
                "ORDER", orderId);
        return convertToResponse(saved); // 🌟 Thay đổi ở đây
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

        // 3. Kiểm tra trạng thái hợp lệ (chỉ cho phép xác nhận khi đang giao hàng)
        if (order.getStatus() != Order.OrderStatus.SHIPPING) {
            throw new IllegalStateException("Đơn hàng phải ở trạng thái đang giao thì mới có thể xác nhận đã nhận");
        }

        // 4. Cập nhật trạng thái
        order.setStatus(Order.OrderStatus.COMPLETED);
        
        // Luôn chuyển sang PAID khi hoàn tất (đặc biệt quan trọng cho luồng COD)
        order.setPaymentStatus(Order.PaymentStatus.FULLY_PAID); 

        Order saved = orderRepository.save(order);

        // 5. CỘNG TIỀN VÀO VÍ XƯỞNG khi đơn hàng hoàn tất
        try {
            walletService.credit(
                saved.getFactory().getUser().getId(),
                saved.getFinalAmount(),
                "Thanh toán đơn hàng #" + saved.getId(),
                WalletTransaction.TransactionType.COMMISSION,
                saved.getId()
            );
        } catch (Exception e) {
            // Không để lỗi ví làm hỏng luồng hoàn tất đơn
            System.err.println("Lỗi cộng tiền ví xưởng: " + e.getMessage());
        }

        // 6. Gửi thông báo cho xưởng biết khách đã nhận hàng
        notificationService.push(order.getFactory().getUser().getId(),
                "Khách đã nhận hàng", 
                "Đơn hàng #" + orderId + " đã được khách hàng xác nhận nhận hàng và thanh toán.",
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
}