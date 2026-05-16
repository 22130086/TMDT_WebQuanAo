package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FactoryProfileRepository extends JpaRepository<FactoryProfile, Long> {
    Optional<FactoryProfile> findByUserId(Long userId);
    Page<FactoryProfile> findByVerifiedStatus(FactoryProfile.VerifiedStatus status, Pageable pageable);
    boolean existsByUserId(Long userId);
}
