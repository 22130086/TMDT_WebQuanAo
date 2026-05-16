package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.ProductReview;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    Page<ProductReview> findByProductId(Long productId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId")
    Double avgRatingByProductId(@Param("productId") Long productId);

    long countByProductId(Long productId);
}
