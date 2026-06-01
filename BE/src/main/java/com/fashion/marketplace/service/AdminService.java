package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.response.WithdrawalResponse;
import com.fashion.marketplace.dto.response.WithdrawalStatsResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final DiscountCodeRepository discountCodeRepository;
    private final BannerRepository bannerRepository;
    private final WalletRepository walletRepository;
    private final NotificationService notificationService;

    // ---- 4. Quản lý người dùng ----

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public User getUserDetail(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
    }

    @Transactional
    public User lockUser(Long userId) {
        User user = getUserDetail(userId);
        user.setStatus(User.Status.LOCKED);
        notificationService.push(userId, "Tài khoản bị khóa",
                "Tài khoản của bạn đã bị khóa bởi Admin", "ACCOUNT", userId);
        return userRepository.save(user);
    }

    @Transactional
    public User unlockUser(Long userId) {
        User user = getUserDetail(userId);
        user.setStatus(User.Status.ACTIVE);
        notificationService.push(userId, "Tài khoản được mở khóa",
                "Tài khoản của bạn đã được mở khóa", "ACCOUNT", userId);
        return userRepository.save(user);
    }

    // ---- 1. Quản lý yêu cầu rút tiền ----

    private WithdrawalResponse toResponse(WithdrawalRequest w) {
        return WithdrawalResponse.builder()
                .id(w.getId())
                .factoryUserId(w.getFactoryUser() != null ? w.getFactoryUser().getId() : null)
                .factoryUserName(w.getFactoryUser() != null ? w.getFactoryUser().getFullName() : null)
                .factoryName(w.getFactoryUser() != null ? w.getFactoryUser().getFullName() : null)
                .amount(w.getAmount())
                .bankName(w.getBankName())
                .accountNumber(w.getAccountNumber())
                .accountName(w.getAccountName())
                .status(w.getStatus().name())
                .adminNote(w.getAdminNote())
                .handledById(w.getHandledBy() != null ? w.getHandledBy().getId() : null)
                .handledAt(w.getHandledAt())
                .createdAt(w.getCreatedAt())
                .build();
    }

    public Page<WithdrawalResponse> getWithdrawals(WithdrawalRequest.WithdrawalStatus status, Pageable pageable) {
        Page<WithdrawalRequest> page = (status != null)
                ? withdrawalRepository.findByStatus(status, pageable)
                : withdrawalRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    public WithdrawalResponse getWithdrawal(Long id) {
        return toResponse(withdrawalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu rút tiền không tồn tại")));
    }

    public WithdrawalStatsResponse getWithdrawalStats() {
        return WithdrawalStatsResponse.builder()
                .total(withdrawalRepository.count())
                .pending(withdrawalRepository.countByStatus(WithdrawalRequest.WithdrawalStatus.PENDING))
                .approved(withdrawalRepository.countByStatus(WithdrawalRequest.WithdrawalStatus.APPROVED))
                .transferred(withdrawalRepository.countByStatus(WithdrawalRequest.WithdrawalStatus.TRANSFERRED))
                .rejected(withdrawalRepository.countByStatus(WithdrawalRequest.WithdrawalStatus.REJECTED))
                .build();
    }

    @Transactional
    public WithdrawalResponse approveWithdrawal(Long adminId, Long withdrawalId) {
        WithdrawalRequest wr = withdrawalRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu rút tiền không tồn tại"));
        wr.setStatus(WithdrawalRequest.WithdrawalStatus.APPROVED);
        wr.setHandledBy(userRepository.findById(adminId).orElse(null));
        wr.setHandledAt(java.time.LocalDateTime.now());
        WithdrawalRequest saved = withdrawalRepository.save(wr);
        notificationService.push(wr.getFactoryUser().getId(),
                "Yêu cầu rút tiền được duyệt",
                "Yêu cầu rút " + wr.getAmount() + " VNĐ đã được phê duyệt",
                "WITHDRAWAL", withdrawalId);
        return toResponse(saved);
    }

    @Transactional
    public WithdrawalResponse rejectWithdrawal(Long adminId, Long withdrawalId, String note) {
        WithdrawalRequest wr = withdrawalRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu rút tiền không tồn tại"));
        wr.setStatus(WithdrawalRequest.WithdrawalStatus.REJECTED);
        wr.setAdminNote(note);
        wr.setHandledBy(userRepository.findById(adminId).orElse(null));
        wr.setHandledAt(java.time.LocalDateTime.now());
        WithdrawalRequest saved = withdrawalRepository.save(wr);
        notificationService.push(wr.getFactoryUser().getId(),
                "Yêu cầu rút tiền bị từ chối", "Lý do: " + note,
                "WITHDRAWAL", withdrawalId);
        return toResponse(saved);
    }

    @Transactional
    public WithdrawalResponse markTransferred(Long adminId, Long withdrawalId) {
        WithdrawalRequest wr = withdrawalRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu rút tiền không tồn tại"));
        wr.setStatus(WithdrawalRequest.WithdrawalStatus.TRANSFERRED);
        wr.setHandledAt(java.time.LocalDateTime.now());
        return toResponse(withdrawalRepository.save(wr));
    }

    // ---- 7. Quản lý mã giảm giá ----

    public Page<DiscountCode> getDiscountCodes(Pageable pageable) {
        return discountCodeRepository.findAll(pageable);
    }

    @Transactional
    public DiscountCode createDiscountCode(Long adminId, DiscountCodeRequest req) {
        if (discountCodeRepository.existsByCode(req.getCode()))
            throw new IllegalArgumentException("Mã giảm giá đã tồn tại");
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin không tồn tại"));
        DiscountCode dc = DiscountCode.builder()
                .code(req.getCode())
                .discountType(req.getDiscountType())
                .discountValue(req.getDiscountValue())
                .minOrderValue(req.getMinOrderValue())
                .maxUses(req.getMaxUses())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .isActive(true)
                .createdBy(admin)
                .build();
        return discountCodeRepository.save(dc);
    }

    @Transactional
    public DiscountCode updateDiscountCode(Long id, DiscountCodeRequest req) {
        DiscountCode dc = discountCodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mã giảm giá không tồn tại"));
        dc.setDiscountType(req.getDiscountType());
        dc.setDiscountValue(req.getDiscountValue());
        dc.setMinOrderValue(req.getMinOrderValue());
        dc.setMaxUses(req.getMaxUses());
        dc.setStartDate(req.getStartDate());
        dc.setEndDate(req.getEndDate());
        return discountCodeRepository.save(dc);
    }

    @Transactional
    public void deleteDiscountCode(Long id) {
        discountCodeRepository.deleteById(id);
    }

    // ---- 8. Quản lý Banner ----

    public java.util.List<Banner> getBanners() {
        return bannerRepository.findAll();
    }

    @Transactional
    public Banner createBanner(Long adminId, BannerRequest req) {
        User admin = userRepository.findById(adminId).orElse(null);
        Banner banner = Banner.builder()
                .title(req.getTitle())
                .imageUrl(req.getImageUrl())
                .linkUrl(req.getLinkUrl())
                .position(req.getPosition())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .isActive(true)
                .createdBy(admin)
                .build();
        return bannerRepository.save(banner);
    }

    @Transactional
    public Banner updateBanner(Long id, BannerRequest req) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner không tồn tại"));
        banner.setTitle(req.getTitle());
        banner.setImageUrl(req.getImageUrl());
        banner.setLinkUrl(req.getLinkUrl());
        banner.setPosition(req.getPosition());
        banner.setStartDate(req.getStartDate());
        banner.setEndDate(req.getEndDate());
        return bannerRepository.save(banner);
    }

    @Transactional
    public void deleteBanner(Long id) {
        bannerRepository.deleteById(id);
    }

    // ---- Inner DTOs ----

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class DiscountCodeRequest {
        private String code;
        private DiscountCode.DiscountType discountType;
        private BigDecimal discountValue;
        private BigDecimal minOrderValue;
        private Integer maxUses;
        private LocalDate startDate;
        private LocalDate endDate;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BannerRequest {
        private String title;
        private String imageUrl;
        private String linkUrl;
        private String position;
        private LocalDate startDate;
        private LocalDate endDate;
    }
}
