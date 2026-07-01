package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.LoginRequest;
import com.fashion.marketplace.dto.request.RegisterRequest;
import com.fashion.marketplace.dto.response.AuthResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import com.fashion.marketplace.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final FactoryProfileRepository factoryProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;

    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    public void generateAndSendOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }

        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        String otpCode = String.valueOf(otp);
        otpStorage.put(email, otpCode);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Mã OTP xác thực đăng ký tài khoản");
        message.setText("Mã OTP của bạn là: " + otpCode + "\nMã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ với bất kỳ ai.");
        mailSender.send(message);
    }

    public boolean verifyOtp(String email, String userProvidedOtp) {
        String savedOtp = otpStorage.get(email);
        if (savedOtp != null && savedOtp.equals(userProvidedOtp)) {
            otpStorage.remove(email);
            return true;
        }
        return false;
    }

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
                .status(req.getRole() == User.Role.FACTORY ? User.Status.PENDING : User.Status.ACTIVE)
                .build();
        userRepository.save(user);
        // Tạo ví cho user
        walletRepository.save(Wallet.builder().user(user).build());

        // Nếu là FACTORY, tạo FactoryProfile với thông tin đăng ký
        if (req.getRole() == User.Role.FACTORY && req.getFactoryName() != null) {
            FactoryProfile fp = FactoryProfile.builder()
                    .user(user)
                    .factoryName(req.getFactoryName())
                    .address(req.getFactoryAddress())
                    .verifiedStatus(FactoryProfile.VerifiedStatus.PENDING)
                    .build();
            factoryProfileRepository.save(fp);

            // Lưu ảnh giấy phép vào avatarUrl của user (tận dụng field có sẵn)
            if (req.getCertImageUrl() != null && !req.getCertImageUrl().isBlank()) {
                user.setAvatarUrl(req.getCertImageUrl());
                userRepository.save(user);
            }
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return buildAuthResponse(user, token);
    }

    public AuthResponse login(LoginRequest req) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        } catch (DisabledException e) {
            throw new IllegalStateException("Tài khoản của bạn đang chờ admin phê duyệt. Vui lòng đợi trong giây lát.");
        } catch (BadCredentialsException e) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        }
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if (user.getStatus() == User.Status.LOCKED) {
            throw new IllegalStateException("Tài khoản đã bị khóa");
        }
        if (user.getStatus() == User.Status.PENDING) {
            throw new IllegalStateException("Tài khoản của bạn đang chờ admin phê duyệt. Vui lòng đợi trong giây lát.");
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
