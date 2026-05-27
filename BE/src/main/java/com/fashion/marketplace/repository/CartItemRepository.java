package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository
        extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByIdAndCartCustomer_Id(
            Long id,
            Long customerId
    );
}