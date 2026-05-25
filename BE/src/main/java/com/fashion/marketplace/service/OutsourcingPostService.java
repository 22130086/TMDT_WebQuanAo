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

@Service
@RequiredArgsConstructor
public class OutsourcingPostService {

    private final OutsourcingPostRepository postRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
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
                .status(OutsourcingPost.PostStatus.OPEN)
                .build();

        if (req.getCategoryId() != null) {
            post.setCategory(categoryRepository.findById(req.getCategoryId()).orElse(null));
        }
        return toResponse(postRepository.save(post));
    }

    @Transactional
    public OutsourcingPostResponse update(Long customerId, Long postId, OutsourcingPostRequest req) {
        OutsourcingPost post = getOwned(customerId, postId);
        if (post.getStatus() != OutsourcingPost.PostStatus.OPEN) {
            throw new IllegalStateException("Chỉ có thể sửa bài đăng đang mở");
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
        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public Page<OutsourcingPostResponse> getByCustomer(Long customerId, Pageable pageable) {
        return postRepository.findByCustomerId(customerId, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<OutsourcingPostResponse> searchOpen(String keyword, Long categoryId, Pageable pageable) {
        return postRepository.searchOpen(keyword, categoryId, pageable)
                .map(this::toResponse);
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
        return postRepository.search(keyword, categoryId, postStatus, pageable)
                .map(this::toResponse);
    }

    public OutsourcingPostResponse toResponse(OutsourcingPost p) {
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
                .customerId(p.getCustomer().getId())
                .customerName(p.getCustomer().getFullName())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}