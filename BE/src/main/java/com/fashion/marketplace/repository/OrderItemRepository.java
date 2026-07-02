package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT SUM(oi.quantity) FROM OrderItem oi JOIN oi.order o WHERE oi.product.id = :productId AND o.status <> 'CANCELLED'")
    Long sumQuantityByProductIdAndOrderNotCancelled(@Param("productId") Long productId);
}
