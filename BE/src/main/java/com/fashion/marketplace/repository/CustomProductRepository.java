package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.CustomProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomProductRepository extends JpaRepository<CustomProduct, Long> {

    Optional<CustomProduct> findByIdAndCustomer_Id(Long id, Long customerId);
}

