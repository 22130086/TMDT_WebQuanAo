package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.Complaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    
    // Find by order
    Page<Complaint> findByOrderId(Long orderId, Pageable pageable);
    
    // Find by user who raised complaint
    Page<Complaint> findByRaisedById(Long userId, Pageable pageable);
    
    // Find by status
    Page<Complaint> findByStatus(Complaint.ComplaintStatus status, Pageable pageable);
    
    // Find by factory (complaints related to factory's orders)
    @Query("SELECT c FROM Complaint c WHERE c.order.factory.id = :factoryId")
    Page<Complaint> findByFactoryId(@Param("factoryId") Long factoryId, Pageable pageable);

    List<Complaint> findByOrderIdAndStatus(Long orderId, Complaint.ComplaintStatus status);
    
    // Count by status
    Long countByStatus(Complaint.ComplaintStatus status);
    
    // Find recent complaints
    @Query("SELECT c FROM Complaint c WHERE c.createdAt >= :since ORDER BY c.createdAt DESC")
    List<Complaint> findRecentComplaints(@Param("since") LocalDateTime since, Pageable pageable);
    
    // Search complaints
    @Query("SELECT c FROM Complaint c WHERE " +
           "c.reason LIKE %:keyword% OR c.resolution LIKE %:keyword% OR " +
           "CONCAT(c.order.id, '') LIKE %:keyword% ORDER BY c.createdAt DESC")
    Page<Complaint> searchComplaints(@Param("keyword") String keyword, Pageable pageable);
}
