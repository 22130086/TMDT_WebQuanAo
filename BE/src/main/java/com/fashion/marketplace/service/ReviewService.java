package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.response.FactoryReviewResponse;
import com.fashion.marketplace.dto.response.ProductReviewResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ProductReviewRepository productReviewRepository;
    private final FactoryReviewRepository factoryReviewRepository;
    private final ProductRepository productRepository;
    private final FactoryProfileRepository factoryProfileRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    // ---- Đánh giá sản phẩm (Khách hàng) ----

    @Transactional
    public ProductReviewResponse reviewProduct(Long customerId, ProductReviewRequest req) {
        // Chặn đánh giá trùng: mỗi customer chỉ được đánh giá 1 sản phẩm 1 lần duy nhất
        if (productReviewRepository.existsByCustomerIdAndProductId(customerId, req.getProductId())) {
            throw new IllegalStateException("Bạn đã đánh giá sản phẩm này rồi. Vào mục 'Đánh giá của tôi' để sửa hoặc xóa.");
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));

        ProductReview review = ProductReview.builder()
                .product(product)
                .customer(customer)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();

        if (req.getOrderId() != null) {
            review.setOrder(orderRepository.findById(req.getOrderId()).orElse(null));
        }
        return toResponse(productReviewRepository.save(review));
    }

    @Transactional
    public ProductReviewResponse updateProductReview(Long customerId, Long reviewId, ProductReviewRequest req) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        if (!review.getCustomer().getId().equals(customerId))
            throw new IllegalArgumentException("Không có quyền sửa đánh giá này");
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        return toResponse(productReviewRepository.save(review));
    }

    @Transactional
    public void deleteProductReview(Long customerId, Long reviewId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        if (!review.getCustomer().getId().equals(customerId))
            throw new IllegalArgumentException("Không có quyền xóa đánh giá này");
        productReviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public Page<ProductReviewResponse> getProductReviews(Long productId, Pageable pageable) {
        return productReviewRepository.findByProductId(productId, pageable)
                .map(this::toResponse);
    }

    /** Lấy thông tin tổng quan đánh giá của một sản phẩm */
    public ReviewSummary getProductReviewSummary(Long productId) {
        Double avg = productReviewRepository.avgRatingByProductId(productId);
        long count = productReviewRepository.countByProductId(productId);
        return new ReviewSummary(avg != null ? BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP).doubleValue() : 0.0, count);
    }

    @Data @AllArgsConstructor
    public static class ReviewSummary {
        private double averageRating;
        private long totalReviews;
    }

    private ProductReviewResponse toResponse(ProductReview r) {
        User customer = r.getCustomer();
        return ProductReviewResponse.builder()
                .id(r.getId())
                .productId(r.getProduct() != null ? r.getProduct().getId() : null)
                .productName(r.getProduct() != null ? r.getProduct().getName() : null)
                .rating(r.getRating())
                .comment(r.getComment())
                .customerId(customer.getId())
                .customerName(customer.getFullName() != null ? customer.getFullName() : customer.getEmail())
                .customerAvatar(customer.getAvatarUrl())
                .reply(r.getReply())
                .repliedAt(r.getRepliedAt())
                .isReported(r.getIsReported())
                .createdAt(r.getCreatedAt())
                .build();
    }

    /** Lấy danh sách đánh giá của customer cho 1 đơn hàng */
    @Transactional(readOnly = true)
    public List<ProductReviewResponse> getMyReviewsForOrder(Long customerId, Long orderId) {
        return productReviewRepository.findByCustomerIdAndOrderId(customerId, orderId)
                .stream().map(this::toResponse).toList();
    }

    /** Lấy tất cả đánh giá của customer (cho trang quản lý đánh giá) */
    @Transactional(readOnly = true)
    public Page<ProductReviewResponse> getMyAllReviews(Long customerId, Pageable pageable) {
        return productReviewRepository.findByCustomerId(customerId, pageable)
                .map(this::toResponse);
    }

    /** Lấy tất cả đánh giá sản phẩm của 1 xưởng (cho factory management) */
    @Transactional(readOnly = true)
    public Page<ProductReviewResponse> getProductReviewsByFactory(Long factoryId, Pageable pageable) {
        return productReviewRepository.findByFactoryId(factoryId, pageable)
                .map(this::toResponse);
    }

    // ---- Phản hồi đánh giá (Xưởng may) ----

    @Transactional
    public ProductReviewResponse replyProductReview(Long factoryUserId, Long reviewId, String reply) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        FactoryProfile factory = factoryProfileRepository.findByUserId(factoryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        if (!review.getProduct().getFactory().getId().equals(factory.getId()))
            throw new IllegalArgumentException("Không có quyền phản hồi đánh giá này");
        review.setReply(reply);
        review.setRepliedAt(LocalDateTime.now());
        return toResponse(productReviewRepository.save(review));
    }

    @Transactional
    public ProductReviewResponse reportProductReview(Long factoryUserId, Long reviewId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        review.setIsReported(true);
        return toResponse(productReviewRepository.save(review));
    }

    // ---- Đánh giá xưởng may (Khách hàng) ----

    @Transactional
    public FactoryReview reviewFactory(Long customerId, FactoryReviewRequest req) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
        FactoryProfile factory = factoryProfileRepository.findById(req.getFactoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Xưởng không tồn tại"));

        FactoryReview review = FactoryReview.builder()
                .factory(factory)
                .customer(customer)
                .rating(req.getRating())
                .comment(req.getComment())
                .build();
        if (req.getOrderId() != null) {
            review.setOrder(orderRepository.findById(req.getOrderId()).orElse(null));
        }
        FactoryReview saved = factoryReviewRepository.save(review);

        // Cập nhật rating trung bình xưởng
        updateFactoryRating(factory);
        return saved;
    }

    @Transactional
    public FactoryReview updateFactoryReview(Long customerId, Long reviewId, FactoryReviewRequest req) {
        FactoryReview review = factoryReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        if (!review.getCustomer().getId().equals(customerId))
            throw new IllegalArgumentException("Không có quyền sửa đánh giá này");
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        FactoryReview saved = factoryReviewRepository.save(review);
        updateFactoryRating(review.getFactory());
        return saved;
    }

    @Transactional
    public void deleteFactoryReview(Long customerId, Long reviewId) {
        FactoryReview review = factoryReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        if (!review.getCustomer().getId().equals(customerId))
            throw new IllegalArgumentException("Không có quyền xóa đánh giá này");
        FactoryProfile factory = review.getFactory();
        factoryReviewRepository.delete(review);
        updateFactoryRating(factory);
    }

    public Page<FactoryReview> getFactoryReviews(Long factoryId, Pageable pageable) {
        return factoryReviewRepository.findByFactoryId(factoryId, pageable);
    }

    private void updateFactoryRating(FactoryProfile factory) {
        Double avg = factoryReviewRepository.avgRatingByFactoryId(factory.getId());
        long count = factoryReviewRepository.countByFactoryId(factory.getId());
        factory.setRatingAvg(avg != null
                ? BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO);
        factory.setTotalRatings((int) count);
        factoryProfileRepository.save(factory);
    }

    // ---- Admin Methods ----

    @Transactional(readOnly = true)
    public Page<ProductReviewResponse> getAllProductReviews(Pageable pageable) {
        return productReviewRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public void adminDeleteReview(Long reviewId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        productReviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public Page<ProductReviewResponse> getReportedReviews(Pageable pageable) {
        return productReviewRepository.findByIsReportedTrue(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long getReportedReviewCount() {
        return productReviewRepository.countByIsReportedTrue();
    }

    @Transactional
    public ProductReviewResponse resolveReportedReview(Long reviewId, String action) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        if ("DELETE".equalsIgnoreCase(action)) {
            productReviewRepository.delete(review);
            return null;
        } else {
            // "DISMISS" - bỏ báo cáo
            review.setIsReported(false);
            return toResponse(productReviewRepository.save(review));
        }
    }

    @Transactional(readOnly = true)
    public Page<FactoryReviewResponse> getFactoryReviewsResponse(Long factoryId, Pageable pageable) {
        return factoryReviewRepository.findByFactoryId(factoryId, pageable)
                .map(this::toFactoryReviewResponse);
    }

    private FactoryReviewResponse toFactoryReviewResponse(FactoryReview r) {
        User customer = r.getCustomer();
        return FactoryReviewResponse.builder()
                .id(r.getId())
                .rating(r.getRating())
                .comment(r.getComment())
                .customerName(customer.getFullName() != null ? customer.getFullName() : customer.getEmail())
                .customerAvatar(customer.getAvatarUrl())
                .reply(r.getReply())
                .repliedAt(r.getRepliedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }

    // ---- Inner DTOs ----

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ProductReviewRequest {
        private Long productId;
        private Long orderId;
        private Integer rating;
        private String comment;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class FactoryReviewRequest {
        private Long factoryId;
        private Long orderId;
        private Integer rating;
        private String comment;
    }
}
