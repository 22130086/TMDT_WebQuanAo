package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.QuotationRequest;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class QuotationService {

    private final QuotationRepository quotationRepository;
    private final FactoryProfileRepository factoryProfileRepository;
    private final OutsourcingPostRepository outsourcingPostRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // Xưởng gửi báo giá
    @Transactional
    public Quotation send(Long factoryUserId, QuotationRequest req) {
        FactoryProfile factory = factoryProfileRepository.findByUserId(factoryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));

        OutsourcingPost post = null;
        User customer;
        if (req.getPostId() != null) {
            post = outsourcingPostRepository.findById(req.getPostId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại"));
            customer = post.getCustomer();
        } else {
            throw new IllegalArgumentException("Cần cung cấp postId");
        }

        BigDecimal total = req.getUnitPrice()
                .multiply(BigDecimal.valueOf(req.getQuantity()));

        Quotation q = Quotation.builder()
                .post(post)
                .factory(factory)
                .customer(customer)
                .unitPrice(req.getUnitPrice())
                .quantity(req.getQuantity())
                .totalPrice(total)
                .note(req.getNote())
                .deliveryDays(req.getDeliveryDays())
                .status(Quotation.QuotationStatus.PENDING)
                .build();

        Quotation saved = quotationRepository.save(q);

        notificationService.push(customer.getId(),
                "Báo giá mới", factory.getFactoryName() + " đã gửi báo giá cho bạn",
                "QUOTATION", saved.getId());
        return saved;
    }

    // Xưởng sửa báo giá
    @Transactional
    public Quotation update(Long factoryUserId, Long quotationId, QuotationRequest req) {
        Quotation q = getOwnedByFactory(factoryUserId, quotationId);
        if (q.getStatus() != Quotation.QuotationStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể sửa báo giá đang chờ");
        }
        q.setUnitPrice(req.getUnitPrice());
        q.setQuantity(req.getQuantity());
        q.setTotalPrice(req.getUnitPrice().multiply(BigDecimal.valueOf(req.getQuantity())));
        q.setNote(req.getNote());
        q.setDeliveryDays(req.getDeliveryDays());
        return quotationRepository.save(q);
    }

    // Xưởng hủy báo giá
    @Transactional
    public Quotation cancel(Long factoryUserId, Long quotationId) {
        Quotation q = getOwnedByFactory(factoryUserId, quotationId);
        q.setStatus(Quotation.QuotationStatus.CANCELLED);
        return quotationRepository.save(q);
    }

    // Xưởng rút lại báo giá
    @Transactional
    public Quotation withdraw(Long factoryUserId, Long quotationId) {
        Quotation q = getOwnedByFactory(factoryUserId, quotationId);
        if (q.getStatus() != Quotation.QuotationStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể rút báo giá đang chờ");
        }
        q.setStatus(Quotation.QuotationStatus.WITHDRAWN);
        return quotationRepository.save(q);
    }

    // Khách chấp nhận báo giá
    @Transactional
    public Quotation accept(Long customerId, Long quotationId) {
        Quotation q = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại"));
        if (!q.getCustomer().getId().equals(customerId))
            throw new AccessDeniedException("Không có quyền thao tác");
        q.setStatus(Quotation.QuotationStatus.ACCEPTED);
        Quotation saved = quotationRepository.save(q);
        notificationService.push(q.getFactory().getUser().getId(),
                "Báo giá được chấp nhận", "Khách hàng đã chấp nhận báo giá #" + quotationId,
                "QUOTATION", quotationId);
        return saved;
    }

    // Khách từ chối báo giá
    @Transactional
    public Quotation reject(Long customerId, Long quotationId) {
        Quotation q = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại"));
        if (!q.getCustomer().getId().equals(customerId))
            throw new AccessDeniedException("Không có quyền thao tác");
        q.setStatus(Quotation.QuotationStatus.REJECTED);
        return quotationRepository.save(q);
    }

    public Page<Quotation> getByFactory(Long factoryUserId, Pageable pageable) {
        FactoryProfile f = factoryProfileRepository.findByUserId(factoryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        return quotationRepository.findByFactoryId(f.getId(), pageable);
    }

    public Page<Quotation> getByCustomer(Long customerId, Pageable pageable) {
        return quotationRepository.findByCustomerId(customerId, pageable);
    }

    public Page<Quotation> getByPost(Long postId, Pageable pageable) {
        return quotationRepository.findByPostId(postId, pageable);
    }

    public Quotation getById(Long id) {
        return quotationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại"));
    }

    private Quotation getOwnedByFactory(Long factoryUserId, Long quotationId) {
        FactoryProfile factory = factoryProfileRepository.findByUserId(factoryUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        Quotation q = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new ResourceNotFoundException("Báo giá không tồn tại"));
        if (!q.getFactory().getId().equals(factory.getId()))
            throw new AccessDeniedException("Không có quyền thao tác báo giá này");
        return q;
    }
}
