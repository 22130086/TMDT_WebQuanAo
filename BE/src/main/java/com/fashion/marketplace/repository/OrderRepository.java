package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.Order;

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

    @EntityGraph(attributePaths = {"customer", "factory", "quotation", "quotation.post", "quotation.post.customProduct"})
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);
}
