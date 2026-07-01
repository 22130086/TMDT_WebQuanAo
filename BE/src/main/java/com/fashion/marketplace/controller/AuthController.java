package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.LoginRequest;
import com.fashion.marketplace.dto.request.RegisterRequest;
import com.fashion.marketplace.dto.response.AuthResponse;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController - Xác thực người dùng
 *
 * POST /api/auth/register  → Đăng ký tài khoản mới
 * POST /api/auth/login     → Đăng nhập, nhận JWT token
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@RequestParam String email) {
        authService.generateAndSendOtp(email);
        return ResponseEntity.ok(ApiResponse.ok("Mã OTP đã được gửi", null));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest req,
            @RequestParam String otp) {
        
        boolean isOtpValid = authService.verifyOtp(req.getEmail(), otp);
        if (!isOtpValid) {
            throw new IllegalArgumentException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }
        
        return ResponseEntity.ok(ApiResponse.ok("Đăng ký thành công", authService.register(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", authService.login(req)));
    }
}
