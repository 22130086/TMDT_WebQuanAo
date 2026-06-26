package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.PaymentRequest;
import com.fashion.marketplace.entity.Order;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.OrderRepository;
import com.fashion.marketplace.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final VNPayService vnPayService;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;
    private final QuotationService quotationService;

    public String createPaymentUrl(HttpServletRequest request, PaymentRequest paymentRequest) throws Exception {
        String ipAddr = request.getRemoteAddr();
        if (ipAddr == null || ipAddr.isEmpty() || "0:0:0:0:0:0:0:1".equals(ipAddr)) {
            ipAddr = "127.0.0.1"; 
        }

        String orderCode = paymentRequest.getOrderId().toString();
        if (orderCode == null || orderCode.trim().isEmpty()) {
            orderCode = "FASHION_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        Map<String, Object> response = vnPayService.createPaymentRequest(
                paymentRequest.getAmount(), 
                ipAddr, 
                orderCode
        );

        return (String) response.get("vnpay_url");
    }

    public Map<String, Object> createPaymentUrlInternal(Long amount, String ipAddr, String orderCode) throws Exception {
        return vnPayService.createPaymentRequest((double) amount, ipAddr, orderCode);
    }

    @Transactional
    public String processVNPayCallback(Map<String, String> allRequestParams) {
        if (!vnPayService.verifyCallback(allRequestParams)) {
            return "INVALID_SIGNATURE";
        }

        String responseCode = allRequestParams.get("vnp_ResponseCode");
        String orderCode = allRequestParams.get("vnp_TxnRef");

        try {
            if (orderCode.startsWith("REM_")) {
                Long orderId = Long.parseLong(orderCode.substring(4));
                if ("00".equals(responseCode)) {
                    updateOrderPaymentStatus(orderId);
                    return "SUCCESS";
                } else {
                    return "ROLLBACK";
                }
            } else {
                Long orderId = Long.parseLong(orderCode);

                if ("00".equals(responseCode)) {
                    // Thanh toán thành công → accept quotation, reject others, post IN_PROGRESS
                    quotationService.confirmOrder(orderId);
                    return "SUCCESS";
                } else {
                    // Thất bại → chỉ hủy order, quotation & post giữ nguyên
                    quotationService.cancelOrder(orderId);
                    return "ROLLBACK";
                }
            }
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }

    @Transactional
    private void updateOrderPaymentStatus(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        
        order.setPaymentStatus(Order.PaymentStatus.FULLY_PAID);
        orderRepository.save(order);
        
        notificationService.push(order.getCustomer().getId(),
                "Thanh toán thành công", 
                "Thanh toán cho đơn hàng #" + orderId + " đã thành công.",
                "ORDER", orderId);
    }
}