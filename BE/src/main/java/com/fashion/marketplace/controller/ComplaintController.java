package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.ComplaintRequest;
import com.fashion.marketplace.dto.request.ComplaintResolveRequest;
import com.fashion.marketplace.dto.response.ComplaintResponse;
import com.fashion.marketplace.dto.response.ComplaintStatsResponse;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.ComplaintService;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * ComplaintController
 *
 * CUSTOMER:
 *   POST  /api/complaints                     → Tạo khiếu nại mới
 *   GET   /api/complaints/my                  → Danh sách khiếu nại của tôi
 *   GET   /api/complaints/{id}                → Xem chi tiết khiếu nại
 *   GET   /api/orders/{orderId}/complaints    → Khiếu nại của một đơn hàng
 *
 * FACTORY:
 *   GET   /api/factory/complaints             → Khiếu nại liên quan đến xưởng
 *   PATCH /api/complaints/{id}/resolve        → Giải quyết khiếu nại
 *   PATCH /api/complaints/{id}/status         → Cập nhật trạng thái
 *
 * ADMIN:
 *   GET   /api/admin/complaints               → Tất cả khiếu nại
 *   GET   /api/admin/complaints/status/{status} → Lọc theo trạng thái
 *   GET   /api/admin/complaints/search        → Tìm kiếm
 *   GET   /api/admin/complaints/stats         → Thống kê
 */
@RestController
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final AuthUtil authUtil;

    // ==================== CUSTOMER ====================

    @PostMapping("/api/complaints")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> createComplaint(@Valid @RequestBody ComplaintRequest request) {
        ComplaintResponse complaint = complaintService.createComplaint(authUtil.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Khiếu nại được tạo thành công", complaint));
    }

    @GetMapping("/api/complaints/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getMyComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ComplaintResponse> complaints = complaintService.getMyComplaints(authUtil.currentUserId(), pageable);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách khiếu nại của tôi", complaints));
    }

    @GetMapping("/api/complaints/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(@PathVariable Long id) {
        ComplaintResponse complaint = complaintService.getComplaint(id);
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết khiếu nại", complaint));
    }

    @GetMapping("/api/orders/{orderId}/complaints")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getOrderComplaints(
            @PathVariable Long orderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByOrder(orderId, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Khiếu nại của đơn hàng", complaints));
    }

    // ==================== FACTORY ====================

    @GetMapping("/api/factory/complaints")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getFactoryComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        // TODO: Get factory ID from current user
        Long factoryId = authUtil.currentUserId(); // Simplified for now
        Page<ComplaintResponse> complaints = complaintService.getFactoryComplaints(factoryId, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách khiếu nại xưởng", complaints));
    }

    @PatchMapping("/api/complaints/{id}/resolve")
    @PreAuthorize("hasAnyRole('FACTORY','ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> resolveComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintResolveRequest request) {
        ComplaintResponse complaint = complaintService.resolveComplaint(id, authUtil.currentUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Khiếu nại được giải quyết", complaint));
    }

    @PatchMapping("/api/complaints/{id}/status")
    @PreAuthorize("hasAnyRole('FACTORY','ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        ComplaintResponse complaint = complaintService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công", complaint));
    }

    // ==================== ADMIN ====================

    @GetMapping("/api/admin/complaints")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getAllComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ComplaintResponse> complaints = complaintService.getAllComplaints(pageable);
        return ResponseEntity.ok(ApiResponse.ok("Tất cả khiếu nại", complaints));
    }

    @GetMapping("/api/admin/complaints/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getComplaintsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Khiếu nại theo trạng thái", complaints));
    }

    @GetMapping("/api/admin/complaints/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> searchComplaints(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ComplaintResponse> complaints = complaintService.searchComplaints(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Kết quả tìm kiếm", complaints));
    }

    @GetMapping("/api/admin/complaints/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintStatsResponse>> getComplaintStats() {
        ComplaintStatsResponse stats = complaintService.getStats();
        return ResponseEntity.ok(ApiResponse.ok("Thống kê khiếu nại", stats));
    }
}
