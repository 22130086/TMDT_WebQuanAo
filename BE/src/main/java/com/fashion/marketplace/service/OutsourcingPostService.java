package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.OutsourcingPostRequest;
import com.fashion.marketplace.dto.response.OutsourcingPostResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OutsourcingPostService {

    private final OutsourcingPostRepository postRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final CustomProductRepository customProductRepository;

    public OutsourcingPostResponse create(Long customerId, OutsourcingPostRequest req) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        OutsourcingPost post = OutsourcingPost.builder()
                .customer(customer)
                .title(req.getTitle())
                .description(req.getDescription())
                .quantity(req.getQuantity())
                .budgetMin(req.getBudgetMin())
                .budgetMax(req.getBudgetMax())
                .deadline(req.getDeadline())
                .status(OutsourcingPost.PostStatus.PENDING)
                .build();

        if (req.getCategoryId() != null) {
            post.setCategory(categoryRepository.findById(req.getCategoryId()).orElse(null));
        }
        if (req.getCustomProductId() != null) {
            post.setCustomProduct(customProductRepository.findById(req.getCustomProductId()).orElse(null));
        }
        return toResponse(postRepository.save(post));
    }

    public OutsourcingPostResponse update(Long customerId, Long postId, OutsourcingPostRequest req) {
        OutsourcingPost post = getOwned(customerId, postId);
        if (post.getStatus() != OutsourcingPost.PostStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể sửa bài đăng đang chờ duyệt");
        }
        post.setTitle(req.getTitle());
        post.setDescription(req.getDescription());
        post.setQuantity(req.getQuantity());
        post.setBudgetMin(req.getBudgetMin());
        post.setBudgetMax(req.getBudgetMax());
        post.setDeadline(req.getDeadline());
        return toResponse(postRepository.save(post));
    }

    @Transactional
    public void delete(Long customerId, Long postId) {
        OutsourcingPost post = getOwned(customerId, postId);
        if (post.getStatus() != OutsourcingPost.PostStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể xóa bài đăng đang chờ duyệt");
        }
        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public Page<OutsourcingPostResponse> getByCustomer(Long customerId, Pageable pageable) {
        Page<OutsourcingPost> page = postRepository.findByCustomerId(customerId, pageable);
        List<OutsourcingPostResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<OutsourcingPostResponse> searchOpen(String keyword, Long categoryId, Pageable pageable) {
        Page<OutsourcingPost> page = postRepository.searchOpen(keyword, categoryId, pageable);
        List<OutsourcingPostResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public OutsourcingPostResponse getById(Long id) {
        return toResponse(postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại")));
    }

    private OutsourcingPost getOwned(Long customerId, Long postId) {
        OutsourcingPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài đăng không tồn tại"));
        if (!post.getCustomer().getId().equals(customerId))
            throw new AccessDeniedException("Không có quyền thao tác bài đăng này");
        return post;
    }

    @Transactional(readOnly = true)
    public Page<OutsourcingPostResponse> search(String keyword, Long categoryId, String status, Pageable pageable) {
        OutsourcingPost.PostStatus postStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                postStatus = OutsourcingPost.PostStatus.valueOf(status);
            } catch (IllegalArgumentException ignored) {}
        }
        Page<OutsourcingPost> page = postRepository.search(keyword, categoryId, postStatus, pageable);
        List<OutsourcingPostResponse> content = page.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    public OutsourcingPostResponse toResponse(OutsourcingPost p) {
        CustomProduct cp = p.getCustomProduct();
        User customer = p.getCustomer();
        return OutsourcingPostResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .quantity(p.getQuantity())
                .budgetMin(p.getBudgetMin())
                .budgetMax(p.getBudgetMax())
                .deadline(p.getDeadline())
                .status(p.getStatus() != null ? p.getStatus().name() : null)
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customer != null ? customer.getFullName() : null)
                .customProductId(cp != null ? cp.getId() : null)
                .designFileUrl(cp != null ? cp.getDesignFileUrl() : null)
                .designFileUrlBack(cp != null ? cp.getDesignFileUrlBack() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}