package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.Order;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByCustomerId(Long customerId, Pageable pageable);
    Page<Order> findByFactoryId(Long factoryId, Pageable pageable);
    Page<Order> findByFactoryIdAndOrderType(Long factoryId, Order.OrderType type, Pageable pageable);
    Page<Order> findByStatus(Order.OrderStatus status, Pageable pageable);
}
