package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.PaymentRequest;
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

    @Transactional
    public String processVNPayCallback(Map<String, String> allRequestParams) {
        if (!vnPayService.verifyCallback(allRequestParams)) {
            return "INVALID_SIGNATURE";
        }

        String responseCode = allRequestParams.get("vnp_ResponseCode");
        String orderCode = allRequestParams.get("vnp_TxnRef");

        try {
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
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }
}