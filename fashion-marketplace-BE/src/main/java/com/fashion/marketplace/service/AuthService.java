package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.LoginRequest;
import com.fashion.marketplace.dto.request.RegisterRequest;
import com.fashion.marketplace.dto.response.AuthResponse;
import com.fashion.marketplace.entity.User;
import com.fashion.marketplace.entity.Wallet;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.UserRepository;
import com.fashion.marketplace.repository.WalletRepository;
import com.fashion.marketplace.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(req.getRole() != null ? req.getRole() : User.Role.CUSTOMER)
                .status(User.Status.ACTIVE)
                .build();
        userRepository.save(user);
        // Tạo ví cho user
        walletRepository.save(Wallet.builder().user(user).build());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildAuthResponse(user, token);
    }

    public AuthResponse login(LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        } catch (BadCredentialsException e) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        }
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if (user.getStatus() == User.Status.LOCKED) {
            throw new IllegalStateException("Tài khoản đã bị khóa");
        }
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
