package com.fashion.marketplace.controller;

import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.ReviewService;
import com.fashion.marketplace.service.ReviewService.*;
import com.fashion.marketplace.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * ReviewController - Đánh giá sản phẩm và xưởng may
 *
 * CUSTOMER:
 *   POST   /api/reviews/products             → Thêm đánh giá sản phẩm
 *   PUT    /api/reviews/products/{id}        → Sửa đánh giá sản phẩm
 *   DELETE /api/reviews/products/{id}        → Xóa đánh giá sản phẩm
 *   POST   /api/reviews/factories            → Thêm đánh giá xưởng
 *   PUT    /api/reviews/factories/{id}       → Sửa đánh giá xưởng
 *   DELETE /api/reviews/factories/{id}       → Xóa đánh giá xưởng
 *
 * PUBLIC:
 *   GET /api/reviews/products/{productId}    → Xem đánh giá sản phẩm
 *   GET /api/reviews/factories/{factoryId}   → Xem đánh giá xưởng
 *
 * FACTORY:
 *   PATCH /api/factory/reviews/{id}/reply    → Phản hồi đánh giá
 *   PATCH /api/factory/reviews/{id}/report   → Báo cáo đánh giá
 */
@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthUtil authUtil;

    // ==================== PUBLIC ====================

    @GetMapping("/api/reviews/products/{productId}")
    public ResponseEntity<ApiResponse<Page<ProductReview>>> productReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getProductReviews(productId, pageable)));
    }

    @GetMapping("/api/reviews/factories/{factoryId}")
    public ResponseEntity<ApiResponse<Page<FactoryReview>>> factoryReviews(
            @PathVariable Long factoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getFactoryReviews(factoryId, pageable)));
    }

    // ==================== CUSTOMER ====================

    @PostMapping("/api/reviews/products")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ProductReview>> addProductReview(
            @RequestBody ProductReviewRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đánh giá thành công",
                reviewService.reviewProduct(authUtil.currentUserId(), req)));
    }

    @PutMapping("/api/reviews/products/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ProductReview>> updateProductReview(
            @PathVariable Long id, @RequestBody ProductReviewRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật đánh giá thành công",
                reviewService.updateProductReview(authUtil.currentUserId(), id, req)));
    }

    @DeleteMapping("/api/reviews/products/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> deleteProductReview(@PathVariable Long id) {
        reviewService.deleteProductReview(authUtil.currentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa đánh giá", null));
    }

    @PostMapping("/api/reviews/factories")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<FactoryReview>> addFactoryReview(
            @RequestBody FactoryReviewRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đánh giá xưởng thành công",
                reviewService.reviewFactory(authUtil.currentUserId(), req)));
    }

    @PutMapping("/api/reviews/factories/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<FactoryReview>> updateFactoryReview(
            @PathVariable Long id, @RequestBody FactoryReviewRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật đánh giá thành công",
                reviewService.updateFactoryReview(authUtil.currentUserId(), id, req)));
    }

    @DeleteMapping("/api/reviews/factories/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> deleteFactoryReview(@PathVariable Long id) {
        reviewService.deleteFactoryReview(authUtil.currentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa đánh giá", null));
    }

    // ==================== FACTORY ====================

    @PatchMapping("/api/factory/reviews/{id}/reply")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<ProductReview>> replyReview(
            @PathVariable Long id, @RequestParam String reply) {
        return ResponseEntity.ok(ApiResponse.ok("Phản hồi thành công",
                reviewService.replyProductReview(authUtil.currentUserId(), id, reply)));
    }

    @PatchMapping("/api/factory/reviews/{id}/report")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<ProductReview>> reportReview(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã báo cáo đánh giá",
                reviewService.reportProductReview(authUtil.currentUserId(), id)));
    }
}
