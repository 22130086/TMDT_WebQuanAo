package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {
    Page<WithdrawalRequest> findByStatus(WithdrawalRequest.WithdrawalStatus status, Pageable pageable);
    Page<WithdrawalRequest> findByFactoryUserId(Long userId, Pageable pageable);
}
