package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.QuotationRequest;
import com.fashion.marketplace.entity.Quotation;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.QuotationService;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * QuotationController
 *
 * FACTORY:
 *   POST  /api/factory/quotations              → Gửi báo giá mới
 *   PUT   /api/factory/quotations/{id}         → Sửa báo giá
 *   PATCH /api/factory/quotations/{id}/cancel  → Hủy báo giá
 *   PATCH /api/factory/quotations/{id}/withdraw→ Rút lại báo giá
 *   GET   /api/factory/quotations              → Danh sách báo giá đã gửi
 *
 * CUSTOMER:
 *   GET   /api/quotations                      → Danh sách báo giá nhận được
 *   GET   /api/quotations/post/{postId}        → Báo giá theo bài đăng
 *   PATCH /api/quotations/{id}/accept          → Chấp nhận báo giá
 *   PATCH /api/quotations/{id}/reject          → Từ chối báo giá
 */
@RestController
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;
    private final AuthUtil authUtil;

    // ==================== FACTORY ====================

    @PostMapping("/api/factory/quotations")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Quotation>> send(@Valid @RequestBody QuotationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Gửi báo giá thành công",
                quotationService.send(authUtil.currentUserId(), req)));
    }

    @PutMapping("/api/factory/quotations/{id}")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Quotation>> update(
            @PathVariable Long id, @Valid @RequestBody QuotationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật báo giá thành công",
                quotationService.update(authUtil.currentUserId(), id, req)));
    }

    @PatchMapping("/api/factory/quotations/{id}/cancel")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Quotation>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã hủy báo giá",
                quotationService.cancel(authUtil.currentUserId(), id)));
    }

    @PatchMapping("/api/factory/quotations/{id}/withdraw")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Quotation>> withdraw(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã rút lại báo giá",
                quotationService.withdraw(authUtil.currentUserId(), id)));
    }

    @GetMapping("/api/factory/quotations")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<Quotation>>> myQuotations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                quotationService.getByFactory(authUtil.currentUserId(), pageable)));
    }

    // ==================== CUSTOMER ====================

    @GetMapping("/api/quotations")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Page<Quotation>>> received(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                quotationService.getByCustomer(authUtil.currentUserId(), pageable)));
    }

    @GetMapping("/api/quotations/post/{postId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','FACTORY')")
    public ResponseEntity<ApiResponse<Page<Quotation>>> byPost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(quotationService.getByPost(postId, pageable)));
    }

    @PatchMapping("/api/quotations/{id}/accept")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Quotation>> accept(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã chấp nhận báo giá",
                quotationService.accept(authUtil.currentUserId(), id)));
    }

    @PatchMapping("/api/quotations/{id}/reject")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Quotation>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối báo giá",
                quotationService.reject(authUtil.currentUserId(), id)));
    }
}
