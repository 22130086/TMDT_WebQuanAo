package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.response.WithdrawalResponse;
import com.fashion.marketplace.dto.response.WithdrawalStatsResponse;
import com.fashion.marketplace.dto.response.QuotationResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.*;
import org.springframework.data.domain.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fashion.marketplace.dto.response.OrderResponse;
import com.fashion.marketplace.dto.response.OutsourcingPostResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    @Value("${platform.commission-rate:5}")
    private BigDecimal commissionRate; // Mặc định 5%

    private final UserRepository userRepository;
    private final WithdrawalRequestRepository withdrawalRepository;
    private final DiscountCodeRepository discountCodeRepository;
    private final BannerRepository bannerRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final OrderRepository orderRepository;
    private final QuotationRepository quotationRepository;
    private final OutsourcingPostRepository outsourcingPostRepository;
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

    public Map<String, Object> getUserStats(Long userId) {
        User user = getUserDetail(userId);
        List<Order> orders = orderRepository.findByCustomerId(userId, Pageable.unpaged()).getContent();
        long orderCount = orders.size();
        BigDecimal totalSpent = orders.stream()
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("userId", user.getId());
        stats.put("fullName", user.getFullName());
        stats.put("email", user.getEmail());
        stats.put("phone", user.getPhone());
        stats.put("role", user.getRole() != null ? user.getRole().name() : null);
        stats.put("status", user.getStatus() != null ? user.getStatus().name() : null);
        stats.put("createdAt", user.getCreatedAt());
        stats.put("orderCount", orderCount);
        stats.put("totalSpent", totalSpent);
        return stats;
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

    public Page<WithdrawalResponse> getWithdrawals(WithdrawalRequest.WithdrawalStatus status,
                                                    LocalDate startDate, LocalDate endDate,
                                                    Pageable pageable) {
        Page<WithdrawalRequest> page;

        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : null;

        if (status != null && start != null && end != null) {
            page = withdrawalRepository.findByStatusAndCreatedAtBetween(status, start, end, pageable);
        } else if (start != null && end != null) {
            page = withdrawalRepository.findByCreatedAtBetween(start, end, pageable);
        } else if (status != null) {
            page = withdrawalRepository.findByStatus(status, pageable);
        } else {
            page = withdrawalRepository.findAll(pageable);
        }
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
        if (wr.getStatus() != WithdrawalRequest.WithdrawalStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể duyệt yêu cầu đang ở trạng thái chờ");
        }
        wr.setStatus(WithdrawalRequest.WithdrawalStatus.APPROVED);
        wr.setHandledBy(userRepository.findById(adminId).orElse(null));
        wr.setHandledAt(LocalDateTime.now());
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
        if (wr.getStatus() != WithdrawalRequest.WithdrawalStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể từ chối yêu cầu đang ở trạng thái chờ");
        }
        wr.setStatus(WithdrawalRequest.WithdrawalStatus.REJECTED);
        wr.setAdminNote(note);
        wr.setHandledBy(userRepository.findById(adminId).orElse(null));
        wr.setHandledAt(LocalDateTime.now());

        // Hoàn trả tiền từ frozen về balance
        Wallet wallet = walletRepository.findByUserId(wr.getFactoryUser().getId())
                .orElse(null);
        if (wallet != null) {
            wallet.setBalance(wallet.getBalance().add(wr.getAmount()));
            wallet.setFrozen(wallet.getFrozen().subtract(wr.getAmount()));
            walletRepository.save(wallet);
        }

        WithdrawalRequest saved = withdrawalRepository.save(wr);
        notificationService.push(wr.getFactoryUser().getId(),
                "Yêu cầu rút tiền bị từ chối", "Lý do: " + note,
                "WITHDRAWAL", withdrawalId);
        return toResponse(saved);
    }

    @Transactional
    public WithdrawalResponse markTransferred(Long adminId, Long withdrawalId, TransferRequest transferReq) {
        WithdrawalRequest wr = withdrawalRepository.findById(withdrawalId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu rút tiền không tồn tại"));
        if (wr.getStatus() != WithdrawalRequest.WithdrawalStatus.APPROVED) {
            throw new IllegalStateException("Chỉ có thể chuyển tiền cho yêu cầu đã được duyệt");
        }

        // Tính phí sàn (commission) từ số tiền rút - tính động, không lưu DB
        BigDecimal commission = wr.getAmount()
                .multiply(commissionRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal actualTransfer = wr.getAmount().subtract(commission);

        // Trừ tiền từ frozen
        Wallet wallet = walletRepository.findByUserId(wr.getFactoryUser().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ví không tồn tại"));
        wallet.setFrozen(wallet.getFrozen().subtract(wr.getAmount()));
        walletRepository.save(wallet);

        // Tạo giao dịch WITHDRAWAL
        WalletTransaction tx = WalletTransaction.builder()
                .wallet(wallet)
                .type(WalletTransaction.TransactionType.WITHDRAWAL)
                .amount(wr.getAmount().negate())
                .balanceAfter(wallet.getBalance())
                .note("Rút " + actualTransfer + " VNĐ về " + wr.getBankName() + " - STK: " + wr.getAccountNumber()
                        + " | Phí sàn (" + commissionRate + "%): " + commission + " VNĐ"
                        + (transferReq != null && transferReq.getTransactionRef() != null
                            ? " | Ref: " + transferReq.getTransactionRef() : ""))
                .build();
        walletTransactionRepository.save(tx);

        wr.setStatus(WithdrawalRequest.WithdrawalStatus.TRANSFERRED);
        wr.setHandledBy(userRepository.findById(adminId).orElse(null));
        wr.setHandledAt(LocalDateTime.now());

        if (transferReq != null && transferReq.getTransactionRef() != null) {
            wr.setAdminNote((wr.getAdminNote() != null ? wr.getAdminNote() + " | " : "")
                    + "Mã GD: " + transferReq.getTransactionRef());
        }

        WithdrawalRequest saved = withdrawalRepository.save(wr);
        notificationService.push(wr.getFactoryUser().getId(),
                "Tiền đã được chuyển",
                "Số tiền " + actualTransfer + " VNĐ đã chuyển về TK " + wr.getBankName()
                        + " (phí sàn " + commissionRate + "%: " + commission + " VNĐ)",
                "WITHDRAWAL", withdrawalId);
        return toResponse(saved);
    }

    // ---- 6. Quản lý đơn hàng (Admin) ----

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toOrderResponse);
    }

    public OrderResponse getOrderDetail(Long orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));
        return toOrderResponse(order);
    }

    // ---- 6b. Báo cáo doanh thu ----

    public Map<String, Object> getRevenueReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime end = (endDate != null) ? endDate.atTime(LocalTime.MAX) : null;

        // Lấy tất cả giao dịch TRANSFERRED, lọc theo ngày nếu có
        List<WithdrawalRequest> allTransferred = withdrawalRepository.findAll().stream()
                .filter(w -> w.getStatus() == WithdrawalRequest.WithdrawalStatus.TRANSFERRED)
                .filter(w -> start == null || (w.getHandledAt() != null && !w.getHandledAt().isBefore(start)))
                .filter(w -> end == null || (w.getHandledAt() != null && !w.getHandledAt().isAfter(end)))
                .collect(Collectors.toList());

        // Tổng doanh thu tính động: amount × rate%
        BigDecimal totalRevenue = allTransferred.stream()
                .map(w -> w.getAmount().multiply(commissionRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalWithdrawals = allTransferred.size();

        BigDecimal totalWithdrawn = allTransferred.stream()
                .map(WithdrawalRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Doanh thu theo tháng (6 tháng gần nhất, hoặc theo khoảng ngày)
        Map<String, BigDecimal> monthlyRevenue = new LinkedHashMap<>();
        LocalDate now = LocalDate.now();
        LocalDate rangeStart = startDate != null ? startDate : now.minusMonths(5).withDayOfMonth(1);
        LocalDate rangeEnd = endDate != null ? endDate : now;
        for (LocalDate m = rangeStart.withDayOfMonth(1); !m.isAfter(rangeEnd); m = m.plusMonths(1)) {
            LocalDate monthStart = m;
            LocalDate monthEnd = m.plusMonths(1);
            String key = monthStart.getYear() + "-" + String.format("%02d", monthStart.getMonthValue());
            BigDecimal monthTotal = allTransferred.stream()
                    .filter(w -> w.getHandledAt() != null
                            && !w.getHandledAt().toLocalDate().isBefore(monthStart)
                            && w.getHandledAt().toLocalDate().isBefore(monthEnd))
                    .map(w -> w.getAmount().multiply(commissionRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            monthlyRevenue.put(key, monthTotal);
        }

        // Lịch sử rút tiền gần đây (10 giao dịch mới nhất trong khoảng)
        List<Map<String, Object>> recentWithdrawals = allTransferred.stream()
                .sorted((a, b) -> b.getHandledAt() != null && a.getHandledAt() != null
                        ? b.getHandledAt().compareTo(a.getHandledAt()) : 0)
                .limit(10)
                .map(w -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", w.getId());
                    item.put("factoryName", w.getFactoryUser() != null ? w.getFactoryUser().getFullName() : "N/A");
                    item.put("amount", w.getAmount());
                    item.put("commission", w.getAmount().multiply(commissionRate)
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
                    item.put("handledAt", w.getHandledAt());
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalRevenue", totalRevenue);
        report.put("totalWithdrawals", totalWithdrawals);
        report.put("totalWithdrawn", totalWithdrawn);
        report.put("commissionRate", commissionRate);
        report.put("monthlyRevenue", monthlyRevenue);
        report.put("recentWithdrawals", recentWithdrawals);
        return report;
    }

    private OrderResponse toOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerEmail(order.getCustomer() != null ? order.getCustomer().getEmail() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
                .factoryId(order.getFactory() != null ? order.getFactory().getId() : null)
                .orderType(order.getOrderType() != null ? order.getOrderType().name() : null)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null)
                .createdAt(order.getCreatedAt())
                .items(order.getItems() != null ? order.getItems().stream().map(i ->
                        OrderResponse.OrderItemResponse.builder()
                                .id(i.getId()).productId(i.getProduct() != null ? i.getProduct().getId() : null)
                                .productName(i.getProductName()).quantity(i.getQuantity())
                                .unitPrice(i.getUnitPrice()).build()
                ).collect(Collectors.toList()) : null)
                .build();
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

    // ---- 9. Quản lý Báo giá (Admin) ----

    public Page<QuotationResponse> getAllQuotations(Quotation.QuotationStatus status, Pageable pageable) {
        Page<Quotation> page;
        if (status != null) {
            page = quotationRepository.findByStatus(status, pageable);
        } else {
            page = quotationRepository.findAll(pageable);
        }
        return page.map(this::toQuotationResponse);
    }

    public QuotationResponse getQuotationDetail(Long id) {
        return toQuotationResponse(quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại")));
    }

    @Transactional
    public void deleteQuotation(Long adminId, Long quotationId, String reason) {
        Quotation q = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại"));

        // Gửi thông báo cho factory bị xóa báo giá
        if (q.getFactory() != null && q.getFactory().getUser() != null) {
            notificationService.push(q.getFactory().getUser().getId(),
                    "Báo giá bị xóa bởi Admin",
                    "Báo giá #" + quotationId + " của bạn đã bị xóa. Lý do: " + (reason != null ? reason : "Vi phạm quy định"),
                    "QUOTATION", quotationId);
        }

        quotationRepository.delete(q);
    }

    private QuotationResponse toQuotationResponse(Quotation q) {
        return QuotationResponse.builder()
                .id(q.getId())
                .unitPrice(q.getUnitPrice())
                .quantity(q.getQuantity())
                .totalPrice(q.getTotalPrice())
                .note(q.getNote())
                .deliveryDays(q.getDeliveryDays())
                .status(q.getStatus() != null ? q.getStatus().name() : null)
                .postId(q.getPost() != null ? q.getPost().getId() : null)
                .postTitle(q.getPost() != null ? q.getPost().getTitle() : null)
                .factoryId(q.getFactory() != null ? q.getFactory().getId() : null)
                .factoryName(q.getFactory() != null ? q.getFactory().getFactoryName() : null)
                .customerId(q.getCustomer() != null ? q.getCustomer().getId() : null)
                .customerName(q.getCustomer() != null ? q.getCustomer().getFullName() : null)
                .createdAt(q.getCreatedAt())
                .updatedAt(q.getUpdatedAt())
                .build();
    }

    // ---- 10. Quản lý Bài đăng tìm xưởng (Admin) ----

    public Page<OutsourcingPostResponse> getAllOutsourcingPosts(OutsourcingPost.PostStatus status, Pageable pageable) {
        Page<OutsourcingPost> page;
        if (status != null) {
            page = outsourcingPostRepository.findByStatus(status, pageable);
        } else {
            page = outsourcingPostRepository.findAll(pageable);
        }
        return page.map(this::toPostResponse);
    }

    public OutsourcingPostResponse getOutsourcingPostDetail(Long id) {
        OutsourcingPost post = outsourcingPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại"));
        return toPostResponse(post);
    }

    @Transactional
    public OutsourcingPostResponse approveOutsourcingPost(Long postId) {
        OutsourcingPost post = outsourcingPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại"));
        if (post.getStatus() != OutsourcingPost.PostStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể duyệt bài đăng đang chờ duyệt");
        }
        post.setStatus(OutsourcingPost.PostStatus.OPEN);

        // Thông báo cho khách hàng
        if (post.getCustomer() != null) {
            notificationService.push(post.getCustomer().getId(),
                    "Bài đăng đã được duyệt",
                    "Bài đăng \"" + post.getTitle() + "\" đã được Admin duyệt. Xưởng sẽ sớm gửi báo giá cho bạn.",
                    "POST", postId);
        }
        return toPostResponse(outsourcingPostRepository.save(post));
    }

    @Transactional
    public OutsourcingPost closeOutsourcingPost(Long adminId, Long postId, String reason) {
        OutsourcingPost post = outsourcingPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại"));
        if (post.getStatus() == OutsourcingPost.PostStatus.CLOSED ||
            post.getStatus() == OutsourcingPost.PostStatus.CANCELLED) {
            throw new IllegalStateException("Bài đăng đã đóng hoặc hủy trước đó");
        }
        post.setStatus(OutsourcingPost.PostStatus.CLOSED);

        if (post.getCustomer() != null) {
            notificationService.push(post.getCustomer().getId(),
                    "Bài đăng bị đóng bởi Admin",
                    "Bài đăng \"" + post.getTitle() + "\" đã bị Admin đóng. Lý do: "
                            + (reason != null ? reason : "Vi phạm quy định"),
                    "POST", postId);
        }
        return outsourcingPostRepository.save(post);
    }

    @Transactional
    public void deleteOutsourcingPost(Long adminId, Long postId, String reason) {
        OutsourcingPost post = outsourcingPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại"));

        if (post.getCustomer() != null) {
            notificationService.push(post.getCustomer().getId(),
                    "Bài đăng bị xóa bởi Admin",
                    "Bài đăng \"" + post.getTitle() + "\" đã bị Admin xóa. Lý do: "
                            + (reason != null ? reason : "Vi phạm quy định"),
                    "POST", postId);
        }
        outsourcingPostRepository.delete(post);
    }

    private OutsourcingPostResponse toPostResponse(OutsourcingPost p) {
        CustomProduct cp = p.getCustomProduct();
        return OutsourcingPostResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .quantity(p.getQuantity())
                .budgetMin(p.getBudgetMin())
                .budgetMax(p.getBudgetMax())
                .deadline(p.getDeadline())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .customerId(p.getCustomer().getId())
                .customerName(p.getCustomer().getFullName())
                .customProductId(cp != null ? cp.getId() : null)
                .designFileUrl(cp != null ? cp.getDesignFileUrl() : null)
                .designFileUrlBack(cp != null ? cp.getDesignFileUrlBack() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
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

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class TransferRequest {
        private String transactionRef;
        private String bankName;
        private String note;
    }
}
