package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.response.OrderResponse;
import com.fashion.marketplace.dto.response.OutsourcingPostResponse;
import com.fashion.marketplace.dto.response.QuotationResponse;
import com.fashion.marketplace.dto.response.WithdrawalResponse;
import com.fashion.marketplace.dto.response.WithdrawalStatsResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.AdminService;
import com.fashion.marketplace.service.AdminService.*;
import com.fashion.marketplace.service.WalletService;
import com.fashion.marketplace.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * AdminController - Tất cả chức năng quản trị
 *
 * Tất cả endpoints yêu cầu role = ADMIN
 * Base path: /api/admin
 *
 * ── QUẢN LÝ NGƯỜI DÙNG ──────────────────────────────────────
 *   GET   /api/admin/users                      → Danh sách tất cả người dùng
 *   GET   /api/admin/users/{id}                 → Xem chi tiết người dùng
 *   PATCH /api/admin/users/{id}/lock            → Khóa tài khoản
 *   PATCH /api/admin/users/{id}/unlock          → Mở khóa tài khoản
 *
 * ── QUẢN LÝ YÊU CẦU RÚT TIỀN ───────────────────────────────
 *   GET   /api/admin/withdrawals                → Danh sách yêu cầu rút tiền (lọc theo status)
 *   GET   /api/admin/withdrawals/{id}           → Chi tiết yêu cầu rút tiền
 *   PATCH /api/admin/withdrawals/{id}/approve   → Duyệt yêu cầu
 *   PATCH /api/admin/withdrawals/{id}/reject    → Từ chối yêu cầu
 *   PATCH /api/admin/withdrawals/{id}/transferred → Đánh dấu đã chuyển tiền
 *
 * ── QUẢN LÝ VÍ TIỀN (ADMIN) ────────────────────────────────
 *   GET   /api/admin/wallets                    → Danh sách tất cả ví
 *   GET   /api/admin/wallets/{userId}           → Chi tiết ví của user
 *   GET   /api/admin/wallets/{userId}/transactions → Giao dịch của ví
 *   POST  /api/admin/wallets/{userId}/adjust    → Điều chỉnh số dư
 *   GET   /api/admin/transactions               → Tất cả giao dịch ví
 *
 * ── QUẢN LÝ MÃ GIẢM GIÁ ────────────────────────────────────
 *   GET    /api/admin/discount-codes            → Danh sách mã giảm giá
 *   POST   /api/admin/discount-codes            → Thêm mã giảm giá
 *   PUT    /api/admin/discount-codes/{id}       → Sửa mã giảm giá
 *   DELETE /api/admin/discount-codes/{id}       → Xóa mã giảm giá
 *
 * ── QUẢN LÝ ĐƠN HÀNG ─────────────────────────────────────
 *   GET   /api/admin/orders                   → Tất cả đơn hàng
 *
 * ── QUẢN LÝ BANNER ──────────────────────────────────────────
 *   GET    /api/banners                         → Danh sách banner active (PUBLIC)
 *   GET    /api/admin/banners                   → Tất cả banner
 *   POST   /api/admin/banners                   → Thêm banner
 *   PUT    /api/admin/banners/{id}              → Sửa banner
 *   DELETE /api/admin/banners/{id}              → Xóa banner
 */
@RestController
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final WalletService walletService;
    private final AuthUtil authUtil;

    // ==================== USERS ====================

    @GetMapping("/api/admin/users")
    public ResponseEntity<ApiResponse<Page<User>>> allUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllUsers(pageable)));
    }

    @GetMapping("/api/admin/users/{id}")
    public ResponseEntity<ApiResponse<User>> userDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUserDetail(id)));
    }

    @PatchMapping("/api/admin/users/{id}/lock")
    public ResponseEntity<ApiResponse<User>> lockUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã khóa tài khoản", adminService.lockUser(id)));
    }

    @PatchMapping("/api/admin/users/{id}/unlock")
    public ResponseEntity<ApiResponse<User>> unlockUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã mở khóa tài khoản", adminService.unlockUser(id)));
    }

    @GetMapping("/api/admin/users/{id}/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> userStats(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getUserStats(id)));
    }

    // ==================== WITHDRAWALS ====================

    @GetMapping("/api/admin/withdrawals")
    public ResponseEntity<ApiResponse<Page<WithdrawalResponse>>> withdrawals(
            @RequestParam(required = false) WithdrawalRequest.WithdrawalStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.getWithdrawals(status, startDate, endDate, pageable)));
    }

    @GetMapping("/api/admin/withdrawals/stats")
    public ResponseEntity<ApiResponse<WithdrawalStatsResponse>> withdrawalStats() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getWithdrawalStats()));
    }

    @GetMapping("/api/admin/withdrawals/{id}")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> withdrawalDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getWithdrawal(id)));
    }

    @PatchMapping("/api/admin/withdrawals/{id}/approve")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> approveWithdrawal(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã duyệt yêu cầu rút tiền",
                adminService.approveWithdrawal(authUtil.currentUserId(), id)));
    }

    @PatchMapping("/api/admin/withdrawals/{id}/reject")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> rejectWithdrawal(
            @PathVariable Long id, @RequestParam String note) {
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối yêu cầu",
                adminService.rejectWithdrawal(authUtil.currentUserId(), id, note)));
    }

    @PatchMapping("/api/admin/withdrawals/{id}/transferred")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> markTransferred(
            @PathVariable Long id,
            @RequestBody(required = false) TransferRequest transferReq) {
        return ResponseEntity.ok(ApiResponse.ok("Đã chuyển tiền thành công",
                adminService.markTransferred(authUtil.currentUserId(), id, transferReq)));
    }

    // ==================== WALLETS (ADMIN) ====================

    @GetMapping("/api/admin/wallets")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<Wallet>>> allWallets(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(walletService.getAllWallets(search, pageable)));
    }

    @GetMapping("/api/admin/wallets/{userId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Wallet>> walletDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok(walletService.getWalletByUserId(userId)));
    }

    @GetMapping("/api/admin/wallets/{userId}/transactions")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<WalletTransaction>>> walletTransactions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(walletService.getTransactions(userId, pageable)));
    }

    @PostMapping("/api/admin/wallets/{userId}/adjust")
    @Transactional
    public ResponseEntity<ApiResponse<Wallet>> adjustBalance(
            @PathVariable Long userId,
            @RequestBody WalletService.AdjustBalanceDTO req) {
        if (req.getAmount() == null || req.getAmount().compareTo(java.math.BigDecimal.ZERO) == 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Số tiền điều chỉnh không hợp lệ"));
        }
        return ResponseEntity.ok(ApiResponse.ok("Điều chỉnh số dư thành công",
                walletService.adjustBalance(authUtil.currentUserId(), userId, req.getAmount(), req.getNote())));
    }

    @GetMapping("/api/admin/transactions")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<WalletTransaction>>> allTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(walletService.getAllTransactions(pageable)));
    }

    // ==================== DISCOUNT CODES ====================

    @GetMapping("/api/admin/discount-codes")
    public ResponseEntity<ApiResponse<Page<DiscountCode>>> discountCodes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                adminService.getDiscountCodes(PageRequest.of(page, size))));
    }

    @PostMapping("/api/admin/discount-codes")
    public ResponseEntity<ApiResponse<DiscountCode>> createDiscountCode(
            @RequestBody DiscountCodeRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Tạo mã giảm giá thành công",
                adminService.createDiscountCode(authUtil.currentUserId(), req)));
    }

    @PutMapping("/api/admin/discount-codes/{id}")
    public ResponseEntity<ApiResponse<DiscountCode>> updateDiscountCode(
            @PathVariable Long id, @RequestBody DiscountCodeRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công",
                adminService.updateDiscountCode(id, req)));
    }

    @DeleteMapping("/api/admin/discount-codes/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDiscountCode(@PathVariable Long id) {
        adminService.deleteDiscountCode(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa mã giảm giá", null));
    }

    // ==================== ORDERS ====================

    @GetMapping("/api/admin/orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> allOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllOrders(pageable)));
    }

    @GetMapping("/api/admin/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> orderDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getOrderDetail(id)));
    }

    // ==================== REPORTS ====================

    @GetMapping("/api/admin/reports/revenue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> revenueReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.ok("Báo cáo doanh thu", adminService.getRevenueReport(startDate, endDate)));
    }

    // ==================== BANNERS ====================

    @GetMapping("/api/banners")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<Banner>>> activeBanners() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getBanners()));
    }

    @GetMapping("/api/admin/banners")
    public ResponseEntity<ApiResponse<List<Banner>>> allBanners() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getBanners()));
    }

    @PostMapping("/api/admin/banners")
    public ResponseEntity<ApiResponse<Banner>> createBanner(@RequestBody BannerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Thêm banner thành công",
                adminService.createBanner(authUtil.currentUserId(), req)));
    }

    @PutMapping("/api/admin/banners/{id}")
    public ResponseEntity<ApiResponse<Banner>> updateBanner(
            @PathVariable Long id, @RequestBody BannerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật banner thành công",
                adminService.updateBanner(id, req)));
    }

    @DeleteMapping("/api/admin/banners/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable Long id) {
        adminService.deleteBanner(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa banner", null));
    }

    // ==================== QUOTATIONS ====================

    @GetMapping("/api/admin/quotations")
    public ResponseEntity<ApiResponse<Page<QuotationResponse>>> allQuotations(
            @RequestParam(required = false) Quotation.QuotationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllQuotations(status, pageable)));
    }

    @GetMapping("/api/admin/quotations/{id}")
    public ResponseEntity<ApiResponse<QuotationResponse>> quotationDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getQuotationDetail(id)));
    }

    @DeleteMapping("/api/admin/quotations/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuotation(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Vi phạm quy định") String reason) {
        adminService.deleteQuotation(authUtil.currentUserId(), id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa báo giá", null));
    }

    // ==================== OUTSOURCING POSTS ====================

    @GetMapping("/api/admin/outsourcing-posts")
    public ResponseEntity<ApiResponse<Page<OutsourcingPostResponse>>> allOutsourcingPosts(
            @RequestParam(required = false) OutsourcingPost.PostStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(adminService.getAllOutsourcingPosts(status, pageable)));
    }

    @GetMapping("/api/admin/outsourcing-posts/{id}")
    public ResponseEntity<ApiResponse<OutsourcingPostResponse>> outsourcingPostDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getOutsourcingPostDetail(id)));
    }

    @PatchMapping("/api/admin/outsourcing-posts/{id}/approve")
    public ResponseEntity<ApiResponse<OutsourcingPostResponse>> approveOutsourcingPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã duyệt bài đăng",
                adminService.approveOutsourcingPost(id)));
    }

    @PatchMapping("/api/admin/outsourcing-posts/{id}/close")
    public ResponseEntity<ApiResponse<OutsourcingPost>> closeOutsourcingPost(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Vi phạm quy định") String reason) {
        return ResponseEntity.ok(ApiResponse.ok("Đã đóng bài đăng",
                adminService.closeOutsourcingPost(authUtil.currentUserId(), id, reason)));
    }

    @DeleteMapping("/api/admin/outsourcing-posts/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOutsourcingPost(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Vi phạm quy định") String reason) {
        adminService.deleteOutsourcingPost(authUtil.currentUserId(), id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa bài đăng", null));
    }
}
