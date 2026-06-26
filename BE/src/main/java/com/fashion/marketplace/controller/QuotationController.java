package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.AcceptQuotationRequest;
import com.fashion.marketplace.dto.request.QuotationRequest;
import com.fashion.marketplace.dto.response.QuotationResponse;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.QuotationService;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class QuotationController {

    private final QuotationService quotationService;
    private final AuthUtil authUtil;

    // ==================== FACTORY ====================

    @PostMapping("/api/factory/quotations")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<QuotationResponse>> send(
            @Valid @RequestBody QuotationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Gửi báo giá thành công",
                quotationService.send(authUtil.currentUserId(), req)));
    }

    @PutMapping("/api/factory/quotations/{id}")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<QuotationResponse>> update(
            @PathVariable Long id, @Valid @RequestBody QuotationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật báo giá thành công",
                quotationService.update(authUtil.currentUserId(), id, req)));
    }

    @PatchMapping("/api/factory/quotations/{id}/cancel")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<QuotationResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã hủy báo giá",
                quotationService.cancel(authUtil.currentUserId(), id)));
    }

    @PatchMapping("/api/factory/quotations/{id}/withdraw")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<QuotationResponse>> withdraw(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã rút lại báo giá",
                quotationService.withdraw(authUtil.currentUserId(), id)));
    }

    @GetMapping("/api/factory/quotations")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<QuotationResponse>>> myQuotations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                quotationService.getByFactory(authUtil.currentUserId(), pageable)));
    }

    // ==================== CUSTOMER ====================

    @GetMapping("/api/quotations")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Page<QuotationResponse>>> received(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                quotationService.getByCustomer(authUtil.currentUserId(), pageable)));
    }

    @GetMapping("/api/quotations/post/{postId}")
    @PreAuthorize("hasAnyRole('CUSTOMER','FACTORY')")
    public ResponseEntity<ApiResponse<Page<QuotationResponse>>> byPost(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok(
                quotationService.getByPost(postId, pageable)));
    }

    @PatchMapping("/api/quotations/{id}/accept")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<QuotationResponse>> accept(
            @PathVariable Long id,
            @RequestBody(required = false) AcceptQuotationRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đã tạo đơn hàng",
                quotationService.accept(authUtil.currentUserId(), id, req)));
    }

    @PatchMapping("/api/quotations/{id}/reject")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<QuotationResponse>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối báo giá",
                quotationService.reject(authUtil.currentUserId(), id)));
    }

    @GetMapping("/api/factory/quotations/{id}")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<QuotationResponse>> getOne(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                quotationService.getById(id)));
    }
}