package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.Wallet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {
    // Dùng cho thao tác ghi (update balance, frozen) - KHÔNG JOIN FETCH
    Optional<Wallet> findByUserId(Long userId);

    // Dùng cho thao tác đọc (trả về JSON) - CÓ JOIN FETCH để tránh LazyInitializationException
    @Query("SELECT w FROM Wallet w JOIN FETCH w.user WHERE w.user.id = :userId")
    Optional<Wallet> findByUserIdWithUser(@Param("userId") Long userId);

    @Query("SELECT w FROM Wallet w JOIN FETCH w.user ORDER BY w.balance DESC")
    Page<Wallet> findAllWithUser(Pageable pageable);

    @Query("SELECT w FROM Wallet w JOIN FETCH w.user WHERE " +
           "LOWER(w.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(w.user.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "ORDER BY w.balance DESC")
    Page<Wallet> searchByUser(@Param("search") String search, Pageable pageable);
}
