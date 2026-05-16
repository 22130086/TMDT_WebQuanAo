package com.fashion.marketplace.service;

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
    public ProductReview reviewProduct(Long customerId, ProductReviewRequest req) {
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
        return productReviewRepository.save(review);
    }

    @Transactional
    public ProductReview updateProductReview(Long customerId, Long reviewId, ProductReviewRequest req) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        if (!review.getCustomer().getId().equals(customerId))
            throw new IllegalArgumentException("Không có quyền sửa đánh giá này");
        review.setRating(req.getRating());
        review.setComment(req.getComment());
        return productReviewRepository.save(review);
    }

    @Transactional
    public void deleteProductReview(Long customerId, Long reviewId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        if (!review.getCustomer().getId().equals(customerId))
            throw new IllegalArgumentException("Không có quyền xóa đánh giá này");
        productReviewRepository.delete(review);
    }

    public Page<ProductReview> getProductReviews(Long productId, Pageable pageable) {
        return productReviewRepository.findByProductId(productId, pageable);
    }

    // ---- Phản hồi đánh giá (Xưởng may) ----

    @Transactional
    public ProductReview replyProductReview(Long factoryUserId, Long reviewId, String reply) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        FactoryProfile factory = factoryProfileRepository.findByUserId(factoryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        if (!review.getProduct().getFactory().getId().equals(factory.getId()))
            throw new IllegalArgumentException("Không có quyền phản hồi đánh giá này");
        review.setReply(reply);
        review.setRepliedAt(LocalDateTime.now());
        return productReviewRepository.save(review);
    }

    @Transactional
    public ProductReview reportProductReview(Long factoryUserId, Long reviewId) {
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Đánh giá không tồn tại"));
        review.setIsReported(true);
        return productReviewRepository.save(review);
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
