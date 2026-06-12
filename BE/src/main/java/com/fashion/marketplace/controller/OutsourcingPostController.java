package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.OutsourcingPostRequest;
import com.fashion.marketplace.dto.response.OutsourcingPostResponse;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.OutsourcingPostService;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class OutsourcingPostController {

    private final OutsourcingPostService postService;
    private final AuthUtil authUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OutsourcingPostResponse>>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        // Mặc định chỉ hiện bài đã duyệt (OPEN), admin dùng endpoint riêng /api/admin/outsourcing-posts
        if (status == null || status.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(
                    postService.searchOpen(keyword, categoryId, pageable)));
        }
        return ResponseEntity.ok(ApiResponse.ok(
                postService.search(keyword, categoryId, status, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OutsourcingPostResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(postService.getById(id)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Page<OutsourcingPostResponse>>> myPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                postService.getByCustomer(authUtil.currentUserId(), pageable)));
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OutsourcingPostResponse>> create(
            @Valid @RequestBody OutsourcingPostRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đăng bài thành công",
                postService.create(authUtil.currentUserId(), req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OutsourcingPostResponse>> update(
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