package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, Long> {
    Optional<ProductAttribute> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
