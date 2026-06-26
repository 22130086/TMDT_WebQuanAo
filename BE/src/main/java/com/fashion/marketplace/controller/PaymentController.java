package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.PaymentRequest;
import com.fashion.marketplace.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // API 1: Nhận yêu cầu tạo link thanh toán gửi về cho React
    @PostMapping("/create")
    public ResponseEntity<?> createPayment(
            HttpServletRequest request,
            @RequestBody PaymentRequest paymentRequest
    ) {
        try {
            String paymentUrl = paymentService.createPaymentUrl(request, paymentRequest);
            return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi khởi tạo cổng giao dịch VNPay");
        }
    }

    // API: Tạo link thanh toán phần còn lại
    @PostMapping("/create-remaining")
    public ResponseEntity<?> createRemainingPayment(
            HttpServletRequest request,
            @RequestBody PaymentRequest paymentRequest
    ) {
        try {
            String ipAddr = request.getRemoteAddr();
            if (ipAddr == null || ipAddr.isEmpty() || "0:0:0:0:0:0:0:1".equals(ipAddr)) {
                ipAddr = "127.0.0.1";
            }
            java.util.Map<String, Object> response = paymentService.createPaymentUrlInternal(
                    paymentRequest.getAmount(),
                    ipAddr,
                    "REM_" + paymentRequest.getOrderId()
            );
            return ResponseEntity.ok(Map.of("paymentUrl", (String) response.get("vnpay_url")));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Lỗi khởi tạo cổng giao dịch VNPay");
        }
    }

    // API 2: VNPay tự động gọi redirect về đường dẫn này sau khi user quẹt thẻ/quét QR thành công
    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> vnpayCallback(@RequestParam Map<String, String> allRequestParams) {
        String status = paymentService.processVNPayCallback(allRequestParams);

        String orderId = allRequestParams.get("vnp_TxnRef");
        if (orderId != null && orderId.startsWith("REM_")) {
            orderId = orderId.substring(4);
        }
        String amount = allRequestParams.get("vnp_Amount");

        // Gom toàn bộ về chung một Router nhận kết quả trên React
        String frontendRedirectUrl = "http://localhost:5173/payment-result";

        if ("SUCCESS".equals(status)) {
            // Thanh toán OK: Đính thêm status=success, mã đơn và số tiền
            frontendRedirectUrl += "?status=success&orderId=" + orderId + "&amount=" + amount;
        } else {
            // Thanh toán Xịt/Hủy: Gửi status=fail kèm mã lỗi hệ thống
            frontendRedirectUrl += "?status=fail&orderId=" + orderId + "&reason=" + status;
        }

        // Thực hiện redirect trình duyệt người dùng quay về client React ứng với kết quả
        return ResponseEntity.status(302).location(URI.create(frontendRedirectUrl)).build();
    }
}