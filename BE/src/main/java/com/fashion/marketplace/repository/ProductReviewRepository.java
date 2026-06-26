package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.ProductReview;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    Page<ProductReview> findByProductId(Long productId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId")
    Double avgRatingByProductId(@Param("productId") Long productId);

    long countByProductId(Long productId);

    boolean existsByCustomerIdAndProductIdAndOrderId(Long customerId, Long productId, Long orderId);

    boolean existsByCustomerIdAndProductId(Long customerId, Long productId);

    List<ProductReview> findByCustomerIdAndOrderId(Long customerId, Long orderId);

    @Query("SELECT r FROM ProductReview r JOIN r.product p WHERE p.factory.id = :factoryId ORDER BY r.createdAt DESC")
    Page<ProductReview> findByFactoryId(@Param("factoryId") Long factoryId, Pageable pageable);

    // All reviews by a customer (for customer review management page)
    Page<ProductReview> findByCustomerId(Long customerId, Pageable pageable);

    // Reported reviews for admin
    Page<ProductReview> findByIsReportedTrue(Pageable pageable);
    long countByIsReportedTrue();

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.factory.id = :factoryId")
    Double avgRatingByFactoryId(@Param("factoryId") Long factoryId);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.factory.id = :factoryId")
    long countByFactoryId(@Param("factoryId") Long factoryId);
}
