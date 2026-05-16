package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.OutsourcingPost;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OutsourcingPostRepository extends JpaRepository<OutsourcingPost, Long> {
    Page<OutsourcingPost> findByCustomerId(Long customerId, Pageable pageable);
    Page<OutsourcingPost> findByStatus(OutsourcingPost.PostStatus status, Pageable pageable);

    @Query("SELECT p FROM OutsourcingPost p WHERE p.status = 'OPEN' AND " +
           "(:keyword IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%',:keyword,'%'))) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId)")
    Page<OutsourcingPost> searchOpen(@Param("keyword") String keyword,
                                     @Param("categoryId") Long categoryId,
                                     Pageable pageable);
}
