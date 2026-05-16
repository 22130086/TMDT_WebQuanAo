package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.Product;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByFactoryId(Long factoryId, Pageable pageable);

    Page<Product> findByStatus(Product.ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' AND " +
           "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%',:keyword,'%'))) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId)")
    Page<Product> searchActive(@Param("keyword") String keyword,
                               @Param("categoryId") Long categoryId,
                               Pageable pageable);
}
