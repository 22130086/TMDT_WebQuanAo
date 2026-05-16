package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.response.FactoryProfileResponse;
import com.fashion.marketplace.entity.FactoryProfile;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.FactoryProfileService;
import com.fashion.marketplace.service.FactoryProfileService.*;
import com.fashion.marketplace.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * FactoryProfileController - Hồ sơ năng lực xưởng may
 *
 * PUBLIC:
 *   GET /api/factories/{id}           → Xem hồ sơ xưởng (public)
 *
 * FACTORY:
 *   GET  /api/factory/profile         → Xem hồ sơ của mình
 *   POST /api/factory/profile         → Tạo/cập nhật hồ sơ
 *   POST /api/factory/profile/images  → Thêm hình ảnh
 *   POST /api/factory/profile/certs   → Thêm chứng chỉ
 *
 * ADMIN:
 *   GET   /api/admin/factories/pending      → Danh sách hồ sơ chờ duyệt
 *   GET   /api/admin/factories              → Tất cả hồ sơ
 *   PATCH /api/admin/factories/{id}/approve → Duyệt hồ sơ
 *   PATCH /api/admin/factories/{id}/reject  → Từ chối hồ sơ
 */
@RestController
@RequiredArgsConstructor
public class FactoryProfileController {

    private final FactoryProfileService factoryProfileService;
    private final AuthUtil authUtil;

    // PUBLIC
    @GetMapping("/api/factories/{id}")
    public ResponseEntity<ApiResponse<FactoryProfileResponse>> getPublic(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(factoryProfileService.getByIdResponse(id)));
    }

    @GetMapping("/api/factories")
    public ResponseEntity<ApiResponse<Page<FactoryProfileResponse>>> listPublic(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size,
            @RequestParam(defaultValue = "verifiedAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        Sort.Direction dir = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortParts[0]));

        return ResponseEntity.ok(ApiResponse.ok(
                factoryProfileService.getApprovedResponse(pageable)));
    }

    // FACTORY
    @GetMapping("/api/factory/profile")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<FactoryProfileResponse>> myProfile() {
        return ResponseEntity.ok(ApiResponse.ok(
                factoryProfileService.getByUserIdResponse(authUtil.currentUserId())));
    }

    @PostMapping("/api/factory/profile")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<FactoryProfile>> upsertProfile(
            @RequestBody FactoryProfileRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật hồ sơ thành công",
                factoryProfileService.createOrUpdate(authUtil.currentUserId(), req)));
    }

    @PostMapping("/api/factory/profile/images")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<FactoryProfile>> addImage(
            @RequestParam String imageUrl,
            @RequestParam(defaultValue = "false") boolean isPrimary) {
        return ResponseEntity.ok(ApiResponse.ok("Thêm ảnh thành công",
                factoryProfileService.addImage(authUtil.currentUserId(), imageUrl, isPrimary)));
    }

    @PostMapping("/api/factory/profile/certs")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<FactoryProfile>> addCert(
            @RequestBody CertificateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Thêm chứng chỉ thành công",
                factoryProfileService.addCertificate(authUtil.currentUserId(), req)));
    }

    // ADMIN
    @GetMapping("/api/admin/factories/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<FactoryProfile>>> pending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                factoryProfileService.getPending(PageRequest.of(page, size))));
    }

    @GetMapping("/api/admin/factories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<FactoryProfile>>> all(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                factoryProfileService.getAll(PageRequest.of(page, size))));
    }

    @PatchMapping("/api/admin/factories/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FactoryProfile>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã duyệt hồ sơ",
                factoryProfileService.approve(id)));
    }

    @PatchMapping("/api/admin/factories/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FactoryProfile>> reject(
            @PathVariable Long id, @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối hồ sơ",
                factoryProfileService.reject(id, reason)));
    }
}
