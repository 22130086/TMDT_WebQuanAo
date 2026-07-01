package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.UpdateProfileRequest;
import com.fashion.marketplace.dto.response.UserProfileResponse;
import com.fashion.marketplace.entity.User;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.UserRepository;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * CustomerController - Hồ sơ khách hàng
 *
 * GET  /api/customer/profile   → Xem thông tin hồ sơ
 * PUT  /api/customer/profile   → Cập nhật thông tin hồ sơ
 */
@RestController
@RequestMapping("/api/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final UserRepository userRepository;
    private final AuthUtil authUtil;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        Long userId = authUtil.currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        UserProfileResponse profile = UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .address(user.getAddress())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest req) {
        Long userId = authUtil.currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        if (req.getAvatarUrl() != null) user.setAvatarUrl(req.getAvatarUrl());

        userRepository.save(user);

        UserProfileResponse profile = UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .address(user.getAddress())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Cập nhật hồ sơ thành công", profile));
    }
}
