package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.ProductRequest;
import com.fashion.marketplace.dto.response.ProductResponse;
import com.fashion.marketplace.entity.Product;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.ProductService;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * ProductController
 *
 * PUBLIC (không cần token):
 *   GET  /api/products                  → Tìm kiếm sản phẩm (keyword, categoryId, page, size, sort)
 *   GET  /api/products/{id}             → Xem chi tiết sản phẩm
 *
 * FACTORY (cần token role=FACTORY):
 *   GET  /api/factory/products          → Danh sách sản phẩm của xưởng
 *   POST /api/factory/products          → Thêm sản phẩm mới
 *   PUT  /api/factory/products/{id}     → Sửa thông tin sản phẩm
 *   DELETE /api/factory/products/{id}   → Xóa sản phẩm
 *   PATCH /api/factory/products/{id}/hide → Ẩn sản phẩm
 *
 * ADMIN (cần token role=ADMIN):
 *   GET  /api/admin/products/pending    → Danh sách sản phẩm cần duyệt
 *   PATCH /api/admin/products/{id}/approve → Duyệt sản phẩm
 *   PATCH /api/admin/products/{id}/reject  → Từ chối sản phẩm
 */
@RestController
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final AuthUtil authUtil;

    // ==================== PUBLIC ====================

    @GetMapping("/api/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        Sort.Direction dir = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortParts[0]));

        return ResponseEntity.ok(ApiResponse.ok(
                productService.searchActive(keyword, categoryId, pageable)));
    }

    @GetMapping("/api/products/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getById(id)));
    }

    // ==================== FACTORY ====================

    @GetMapping("/api/factory/products")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> myProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                productService.getByFactory(authUtil.currentUserId(), pageable)));
    }

    @PostMapping("/api/factory/products")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Thêm sản phẩm thành công",
                productService.create(authUtil.currentUserId(), req)));
    }

    @PutMapping("/api/factory/products/{id}")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công",
                productService.update(authUtil.currentUserId(), id, req)));
    }

    @DeleteMapping("/api/factory/products/{id}")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        productService.delete(authUtil.currentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa sản phẩm thành công", null));
    }

    @PatchMapping("/api/factory/products/{id}/hide")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<ProductResponse>> hide(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã ẩn sản phẩm",
                productService.hide(authUtil.currentUserId(), id)));
    }

    // ==================== ADMIN ====================

    @GetMapping("/api/admin/products/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> pending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                productService.getPending(PageRequest.of(page, size))));
    }

    @PatchMapping("/api/admin/products/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã duyệt sản phẩm",
                productService.approve(id)));
    }

    @PatchMapping("/api/admin/products/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductResponse>> reject(
            @PathVariable Long id, @RequestParam String reason) {
        return ResponseEntity.ok(ApiResponse.ok("Đã từ chối sản phẩm",
                productService.reject(id, reason)));
    }
}
