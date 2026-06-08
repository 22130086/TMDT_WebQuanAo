package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    Page<WithdrawalRequest> findByStatus(WithdrawalRequest.WithdrawalStatus status, Pageable pageable);
    Page<WithdrawalRequest> findByFactoryUserId(Long userId, Pageable pageable);
    Long countByStatus(WithdrawalRequest.WithdrawalStatus status);

    // Lọc theo ngày
    Page<WithdrawalRequest> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    Page<WithdrawalRequest> findByStatusAndCreatedAtBetween(
            WithdrawalRequest.WithdrawalStatus status, LocalDateTime start, LocalDateTime end, Pageable pageable);
}
