package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.Dispute;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    Page<Dispute> findByOrderId(Long orderId, Pageable pageable);

    Page<Dispute> findByInitiatedById(Long userId, Pageable pageable);

    Page<Dispute> findByStatus(Dispute.DisputeStatus status, Pageable pageable);

    Long countByStatus(Dispute.DisputeStatus status);

    @Query("SELECT d FROM Dispute d WHERE " +
           "d.description LIKE %:keyword% OR d.verdict LIKE %:keyword% OR " +
           "CONCAT(d.order.id, '') LIKE %:keyword% ORDER BY d.createdAt DESC")
    Page<Dispute> searchDisputes(@Param("keyword") String keyword, Pageable pageable);
}
