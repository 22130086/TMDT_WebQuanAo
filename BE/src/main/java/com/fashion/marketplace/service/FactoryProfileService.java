package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.response.FactoryProfileResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.*;
import org.springframework.data.domain.*;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class FactoryProfileService {

    private final FactoryProfileRepository factoryProfileRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final NotificationService notificationService;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ProductReviewRepository productReviewRepository;

    @Transactional
    public FactoryProfileResponse createOrUpdateResponse(Long userId, FactoryProfileRequest req) {
        return toResponse(createOrUpdate(userId, req));
    }
    // ---- Xưởng: quản lý hồ sơ ----

    @Transactional
    public FactoryProfile createOrUpdate(Long userId, FactoryProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        FactoryProfile profile = factoryProfileRepository.findByUserId(userId)
                .orElse(FactoryProfile.builder().user(user)
                        .verifiedStatus(FactoryProfile.VerifiedStatus.PENDING).build());

        profile.setFactoryName(req.getFactoryName());
        profile.setDescription(req.getDescription());
        profile.setAddress(req.getAddress());
        profile.setMinQuantity(req.getMinQuantity());
        profile.setMaxQuantity(req.getMaxQuantity());
        profile.setLeadTimeDays(req.getLeadTimeDays());

        return factoryProfileRepository.save(profile);
    }

    public FactoryProfile getByUserId(Long userId) {
        return factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
    }

    public FactoryProfile getById(Long id) {
        return factoryProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
    }

    @Transactional(readOnly = true)
    public FactoryProfileResponse getByIdResponse(Long id) {
        return toResponse(getById(id));
    }

    @Transactional(readOnly = true)
    public FactoryProfileResponse getByUserIdResponse(Long userId) {
        return factoryProfileRepository.findByUserId(userId)
                .map(this::toResponse)
                .orElse(null);
    }

    // ---- Admin: xét duyệt hồ sơ ----

    public Page<FactoryProfile> getPending(Pageable pageable) {
        return factoryProfileRepository.findByVerifiedStatus(
                FactoryProfile.VerifiedStatus.PENDING, pageable);
    }

    @Transactional(readOnly = true)
    public Page<FactoryProfileResponse> getPendingResponse(Pageable pageable) {
        Page<FactoryProfile> page = getPending(pageable);
        List<FactoryProfileResponse> list = page.getContent().stream().map(this::toResponse).collect(Collectors.toList());
        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<FactoryProfileResponse> getAllResponse(Pageable pageable) {
        Page<FactoryProfile> page = factoryProfileRepository.findAll(pageable);
        List<FactoryProfileResponse> list = page.getContent().stream().map(this::toResponse).collect(Collectors.toList());
        return new PageImpl<>(list, pageable, page.getTotalElements());
    }

    public Page<FactoryProfile> getApproved(Pageable pageable) {
        return factoryProfileRepository.findByVerifiedStatus(
                FactoryProfile.VerifiedStatus.APPROVED, pageable);
    }

    @Transactional(readOnly = true)
    public Page<FactoryProfileResponse> getApprovedResponse(Pageable pageable) {
        return factoryProfileRepository.findByVerifiedStatus(
                        FactoryProfile.VerifiedStatus.APPROVED, pageable)
                .map(this::toResponse);
    }

    public Page<FactoryProfile> getAll(Pageable pageable) {
        return factoryProfileRepository.findAll(pageable);
    }

    @Transactional
    public FactoryProfile approve(Long factoryId) {
        FactoryProfile profile = factoryProfileRepository.findById(factoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        profile.setVerifiedStatus(FactoryProfile.VerifiedStatus.APPROVED);
        profile.setVerifiedAt(java.time.LocalDateTime.now());
        // Kích hoạt tài khoản user
        User user = profile.getUser();
        if (user != null && user.getStatus() == User.Status.PENDING) {
            user.setStatus(User.Status.ACTIVE);
        }
        // Tạo ví cho xưởng nếu chưa có
        if (user != null && walletRepository.findByUserId(user.getId()).isEmpty()) {
            walletRepository.save(Wallet.builder()
                    .user(user)
                    .balance(BigDecimal.ZERO)
                    .frozen(BigDecimal.ZERO)
                    .build());
        }
        FactoryProfile saved = factoryProfileRepository.save(profile);
        notificationService.push(profile.getUser().getId(),
                "Hồ sơ được duyệt", "Hồ sơ năng lực của bạn đã được phê duyệt",
                "FACTORY_VERIFIED", factoryId);
        return saved;
    }

    @Transactional
    public FactoryProfileResponse approveResponse(Long factoryId) {
        return toResponse(approve(factoryId));
    }

    @Transactional
    public FactoryProfile reject(Long factoryId, String reason) {
        FactoryProfile profile = factoryProfileRepository.findById(factoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        profile.setVerifiedStatus(FactoryProfile.VerifiedStatus.REJECTED);
        profile.setRejectedReason(reason);
        FactoryProfile saved = factoryProfileRepository.save(profile);
        notificationService.push(profile.getUser().getId(),
                "Hồ sơ bị từ chối", "Hồ sơ năng lực bị từ chối: " + reason,
                "FACTORY_REJECTED", factoryId);
        return saved;
    }

    // ---- Thêm ảnh & chứng chỉ ----

    @Transactional
    public FactoryProfile addImage(Long userId, String imageUrl, boolean isPrimary) {
        FactoryProfile profile = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        FactoryImage img = FactoryImage.builder()
                .factory(profile).imageUrl(imageUrl).isPrimary(isPrimary).build();
        profile.getImages().add(img);
        return factoryProfileRepository.save(profile);
    }

    @Transactional
    public FactoryProfile addCertificate(Long userId, CertificateRequest req) {
        FactoryProfile profile = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        FactoryCertificate cert = FactoryCertificate.builder()
                .factory(profile).name(req.getName())
                .imageUrl(req.getImageUrl())
                .issuedDate(req.getIssuedDate())
                .expiredDate(req.getExpiredDate())
                .build();
        profile.getCertificates().add(cert);
        return factoryProfileRepository.save(profile);
    }

    // inner DTOs
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class FactoryProfileRequest {
        private String factoryName;
        private String description;
        private String address;
        private Integer minQuantity;
        private Integer maxQuantity;
        private Integer leadTimeDays;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class CertificateRequest {
        private String name;
        private String imageUrl;
        private java.time.LocalDate issuedDate;
        private java.time.LocalDate expiredDate;
    }

    public FactoryProfileResponse toResponse(FactoryProfile profile) {
        int totalProducts = productRepository.countByFactoryId(profile.getId());
        int totalOrders = orderRepository.countByFactoryId(profile.getId());
        Double avg = productReviewRepository.avgRatingByFactoryId(profile.getId());
        long count = productReviewRepository.countByFactoryId(profile.getId());
        double ratingAvg = avg != null
                ? BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;
        return FactoryProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .factoryName(profile.getFactoryName())
                .factoryUserName(profile.getUser() != null ? profile.getUser().getFullName() : null)
                .factoryUserEmail(profile.getUser() != null ? profile.getUser().getEmail() : null)
                .factoryUserAvatar(profile.getUser() != null ? profile.getUser().getAvatarUrl() : null)
                .description(profile.getDescription())
                .address(profile.getAddress())
                .minQuantity(profile.getMinQuantity())
                .maxQuantity(profile.getMaxQuantity())
                .leadTimeDays(profile.getLeadTimeDays())
                .ratingAvg(BigDecimal.valueOf(ratingAvg))
                .totalRatings((int) count)
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .verifiedStatus(profile.getVerifiedStatus() != null ? profile.getVerifiedStatus().name() : null)
                .verifiedAt(profile.getVerifiedAt())
                .createdAt(profile.getCreatedAt())
                .rejectedReason(profile.getRejectedReason())
                .imageUrls(profile.getImages() != null ? profile.getImages().stream()
                        .map(FactoryImage::getImageUrl)
                        .collect(Collectors.toList()) : List.of())
                .certificates(profile.getCertificates() != null ? profile.getCertificates().stream()
                        .map(c -> FactoryProfileResponse.CertificateItem.builder()
                                .id(c.getId())
                                .name(c.getName())
                                .imageUrl(c.getImageUrl())
                                .issuedDate(c.getIssuedDate())
                                .expiredDate(c.getExpiredDate())
                                .build())
                        .collect(Collectors.toList()) : List.of())
                .build();
    }
}
