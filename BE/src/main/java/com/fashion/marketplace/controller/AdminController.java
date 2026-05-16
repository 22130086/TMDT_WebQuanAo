package com.fashion.marketplace.controller;

import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.AdminService;
import com.fashion.marketplace.service.AdminService.*;
import com.fashion.marketplace.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
 * ── QUẢN LÝ MÃ GIẢM GIÁ ────────────────────────────────────
 *   GET    /api/admin/discount-codes            → Danh sách mã giảm giá
 *   POST   /api/admin/discount-codes            → Thêm mã giảm giá
 *   PUT    /api/admin/discount-codes/{id}       → Sửa mã giảm giá
 *   DELETE /api/admin/discount-codes/{id}       → Xóa mã giảm giá
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

    // ==================== WITHDRAWALS ====================

    @GetMapping("/api/admin/withdrawals")
    public ResponseEntity<ApiResponse<Page<WithdrawalRequest>>> withdrawals(
            @RequestParam(required = false) WithdrawalRequest.WithdrawalStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(adminService.getWithdrawals(status, pageable)));
    }

    @GetMapping("/api/admin/withdrawals/{id}")
    public ResponseEntity<ApiResponse<WithdrawalRequest>> withdrawalDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getWithdrawal(id)));
    }

    @PatchMapping("/api/admin/withdrawals/{id}/approve")
    public ResponseEntity<ApiResponse<WithdrawalRequest>> approveWithdrawal(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã duyệt yêu cầu rút tiền",
                adminService.approveWithdrawal(authUtil.currentUserId(), id)));
    }

    @PatchMapping("/api/admin/withdrawals/{id}/reject")
    public ResponseEntity<ApiResponse<WithdrawalRequest>> rejectWithdrawal(
            @PathVariable Long id, @RequestParam String note) {
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối yêu cầu",
                adminService.rejectWithdrawal(authUtil.currentUserId(), id, note)));
    }

    @PatchMapping("/api/admin/withdrawals/{id}/transferred")
    public ResponseEntity<ApiResponse<WithdrawalRequest>> markTransferred(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật trạng thái chuyển tiền",
                adminService.markTransferred(authUtil.currentUserId(), id)));
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
}
