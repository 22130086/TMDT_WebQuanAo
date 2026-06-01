package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.PaymentRequest;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final VNPayService vnPayService;

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

    public String processVNPayCallback(Map<String, String> allRequestParams) {
        // Kiểm tra chữ ký bảo mật hợp lệ chống gian lận tiền bạc
        if (!vnPayService.verifyCallback(allRequestParams)) {
            return "INVALID_SIGNATURE";
        }

        String responseCode = allRequestParams.get("vnp_ResponseCode");
        String orderCode = allRequestParams.get("vnp_TxnRef");
        String amount = allRequestParams.get("vnp_Amount");

        if ("00".equals(responseCode)) {
            System.out.println("--- GIAO DỊCH THÀNH CÔNG ---");
            System.out.println("Đơn hàng mã: " + orderCode);
            System.out.println("Số tiền: " + (Double.parseDouble(amount) / 100) + " VND");

            // TODO: Viết thêm hàm lưu hóa đơn hoặc cập nhật trạng thái đơn hàng dưới DB của bạn tại đây

            return "SUCCESS";
        } else {
            System.out.println("Giao dịch thất bại/Hủy. Mã phản hồi lỗi: " + responseCode);
            return "FAILED_OR_CANCELED";
        }
    }
}