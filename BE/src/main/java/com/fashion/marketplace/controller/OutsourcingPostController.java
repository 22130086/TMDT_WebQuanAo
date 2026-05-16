package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.OutsourcingPostRequest;
import com.fashion.marketplace.entity.OutsourcingPost;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.OutsourcingPostService;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * OutsourcingPostController - Bài đăng yêu cầu gia công
 *
 * PUBLIC:
 *   GET  /api/posts           → Tìm kiếm bài đăng (keyword, categoryId, page)
 *   GET  /api/posts/{id}      → Xem chi tiết bài đăng
 *
 * CUSTOMER:
 *   POST   /api/posts          → Đăng bài yêu cầu gia công
 *   PUT    /api/posts/{id}     → Sửa bài đăng
 *   DELETE /api/posts/{id}     → Xóa bài đăng
 *   GET    /api/posts/my       → Danh sách bài đăng của tôi
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class OutsourcingPostController {

    private final OutsourcingPostService postService;
    private final AuthUtil authUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OutsourcingPost>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                postService.searchOpen(keyword, categoryId, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OutsourcingPost>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getById(id)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Page<OutsourcingPost>>> myPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                postService.getByCustomer(authUtil.currentUserId(), pageable)));
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OutsourcingPost>> create(
            @Valid @RequestBody OutsourcingPostRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng bài thành công",
                postService.create(authUtil.currentUserId(), req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OutsourcingPost>> update(
            @PathVariable Long id, @Valid @RequestBody OutsourcingPostRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công",
                postService.update(authUtil.currentUserId(), id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        postService.delete(authUtil.currentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa bài đăng", null));
    }
}
