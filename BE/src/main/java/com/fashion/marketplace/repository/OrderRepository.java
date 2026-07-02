package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.Order;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = {"customer", "factory", "items", "quotation", "quotation.post", "quotation.post.customProduct"})
    Page<Order> findByCustomerId(Long customerId, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "factory", "items"})
    Page<Order> findByFactoryId(Long factoryId, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "factory", "items"})
    Page<Order> findByFactoryIdAndOrderType(Long factoryId, Order.OrderType type, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "factory", "factory.user", "items"})
    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o " +
           "WHERE EXISTS (SELECT c FROM Complaint c WHERE c.order = o AND c.status = :status)")
    List<Order> findOrdersWithComplaintsByStatus(@Param("status") com.fashion.marketplace.entity.Complaint.ComplaintStatus status);

    @Query("SELECT DISTINCT o FROM Order o " +
           "WHERE EXISTS (SELECT d FROM Dispute d WHERE d.order = o AND d.status = :status)")
    List<Order> findOrdersWithDisputesByStatus(@Param("status") com.fashion.marketplace.entity.Dispute.DisputeStatus status);

    @EntityGraph(attributePaths = {"customer", "factory", "quotation", "quotation.post", "quotation.post.customProduct"})
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);

    int countByFactoryId(Long factoryId);

    List<Order> findByFactoryIdAndStatus(Long factoryId, Order.OrderStatus status);

    /**
     * Tìm các đơn COMPLETED đã qua 3 ngày, chưa giải phóng frozen,
     * và không còn khiếu nại/tranh chấp đang mở.
     */
    @EntityGraph(attributePaths = {"factory", "factory.user"})
    @Query("SELECT o FROM Order o " +
           "WHERE o.status = :orderStatus " +
           "AND o.frozenReleased = false " +
           "AND o.completedAt IS NOT NULL " +
           "AND o.completedAt <= :cutoff " +
           "AND NOT EXISTS (SELECT c FROM Complaint c WHERE c.order = o AND c.status = :complaintStatus) " +
           "AND NOT EXISTS (SELECT d FROM Dispute  d WHERE d.order = o AND d.status = :disputeStatus)")
    List<Order> findOrdersEligibleForFrozenRelease(
            @Param("cutoff") LocalDateTime cutoff,
            @Param("orderStatus") Order.OrderStatus orderStatus,
            @Param("complaintStatus") com.fashion.marketplace.entity.Complaint.ComplaintStatus complaintStatus,
            @Param("disputeStatus") com.fashion.marketplace.entity.Dispute.DisputeStatus disputeStatus);
}

