package com.fashion.marketplace.controller;

import com.fashion.marketplace.entity.Notification;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.NotificationService;
import com.fashion.marketplace.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * NotificationController - Thông báo
 *
 * GET    /api/notifications               → Danh sách thông báo (phân trang)
 * GET    /api/notifications/unread-count  → Số thông báo chưa đọc
 * PATCH  /api/notifications/{id}/read     → Đánh dấu đã đọc
 * DELETE /api/notifications/{id}          → Xóa thông báo
 */
@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthUtil authUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Notification>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.getAll(authUtil.currentUserId(), pageable)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount() {
        return ResponseEntity.ok(ApiResponse.ok(
                notificationService.countUnread(authUtil.currentUserId())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Notification>> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu đọc",
                notificationService.markRead(authUtil.currentUserId(), id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        notificationService.delete(authUtil.currentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa thông báo", null));
    }
}
