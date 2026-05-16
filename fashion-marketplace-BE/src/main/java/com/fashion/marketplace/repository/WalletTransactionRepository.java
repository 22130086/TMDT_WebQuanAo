package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.WalletTransaction;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    Page<WalletTransaction> findByWalletId(Long walletId, Pageable pageable);
}
