package com.fashion.marketplace.repository;

import com.fashion.marketplace.entity.Quotation;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    Page<Quotation> findByFactoryId(Long factoryId, Pageable pageable);
    Page<Quotation> findByCustomerId(Long customerId, Pageable pageable);
    Page<Quotation> findByPostId(Long postId, Pageable pageable);
}
