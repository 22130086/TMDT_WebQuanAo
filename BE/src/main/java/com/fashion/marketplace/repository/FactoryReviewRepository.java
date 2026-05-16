package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.FactoryReview;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FactoryReviewRepository extends JpaRepository<FactoryReview, Long> {
    Page<FactoryReview> findByFactoryId(Long factoryId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM FactoryReview r WHERE r.factory.id = :factoryId")
    Double avgRatingByFactoryId(@Param("factoryId") Long factoryId);

    long countByFactoryId(Long factoryId);
}
