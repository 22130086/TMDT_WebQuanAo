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

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng ký thành công", authService.register(req)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", authService.login(req)));
    }
}
