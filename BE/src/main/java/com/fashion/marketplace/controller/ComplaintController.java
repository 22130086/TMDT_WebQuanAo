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

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final AuthUtil authUtil;

    // ==================== CUSTOMER ====================

    @PostMapping("/api/complaints")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> createComplaint(@Valid @RequestBody ComplaintRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Khiếu nại được tạo thành công",
                complaintService.createComplaint(authUtil.currentUserId(), request)));
    }

    @GetMapping("/api/complaints/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getMyComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách khiếu nại của tôi",
                complaintService.getMyComplaints(authUtil.currentUserId(), pageable)));
    }

    @GetMapping("/api/complaints/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết khiếu nại", complaintService.getComplaint(id)));
    }

    @GetMapping("/api/orders/{orderId}/complaints")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getOrderComplaints(
            @PathVariable Long orderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Khiếu nại của đơn hàng",
                complaintService.getComplaintsByOrder(orderId, pageable)));
    }

    // ==================== FACTORY ====================

    @GetMapping("/api/factory/complaints")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getFactoryComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách khiếu nại xưởng",
                complaintService.getFactoryComplaints(authUtil.currentUserId(), pageable)));
    }

    @PatchMapping("/api/complaints/{id}/resolve")
    @PreAuthorize("hasAnyRole('FACTORY','ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> resolveComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintResolveRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Khiếu nại được giải quyết",
                complaintService.resolveComplaint(id, authUtil.currentUserId(), request)));
    }

    @PatchMapping("/api/complaints/{id}/status")
    @PreAuthorize("hasAnyRole('FACTORY','ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công",
                complaintService.updateStatus(id, body.get("status"))));
    }

    // ==================== ADMIN ====================

    @GetMapping("/api/admin/complaints")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getAllComplaints(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Tất cả khiếu nại", complaintService.getAllComplaints(pageable)));
    }

    @GetMapping("/api/admin/complaints/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getComplaintsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Khiếu nại theo trạng thái",
                complaintService.getComplaintsByStatus(status, pageable)));
    }

    @GetMapping("/api/admin/complaints/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> searchComplaints(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Kết quả tìm kiếm",
                complaintService.searchComplaints(keyword, pageable)));
    }

    @GetMapping("/api/admin/complaints/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ComplaintStatsResponse>> getComplaintStats() {
        return ResponseEntity.ok(ApiResponse.ok("Thống kê khiếu nại", complaintService.getStats()));
    }
}
