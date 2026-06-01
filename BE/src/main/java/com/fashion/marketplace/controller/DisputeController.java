package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.response.DisputeResponse;
import com.fashion.marketplace.dto.response.DisputeStatsResponse;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.DisputeService;
import com.fashion.marketplace.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;
    private final AuthUtil authUtil;

    @GetMapping("/api/admin/disputes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<DisputeResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách tranh chấp", disputeService.getAllDisputes(pageable)));
    }

    @GetMapping("/api/admin/disputes/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<DisputeResponse>>> getByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Tranh chấp theo trạng thái", disputeService.getByStatus(status, pageable)));
    }

    @GetMapping("/api/admin/disputes/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<DisputeResponse>>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.ok("Kết quả tìm kiếm", disputeService.searchDisputes(keyword, pageable)));
    }

    @GetMapping("/api/admin/disputes/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DisputeStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok("Thống kê tranh chấp", disputeService.getStats()));
    }

    @GetMapping("/api/admin/disputes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DisputeResponse>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết tranh chấp", disputeService.getDispute(id)));
    }

    @PatchMapping("/api/admin/disputes/{id}/verdict")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DisputeResponse>> giveVerdict(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        String verdict = (String) body.get("verdict");
        BigDecimal refund = body.get("refundToCustomer") != null ? new BigDecimal(body.get("refundToCustomer").toString()) : BigDecimal.ZERO;
        BigDecimal transfer = body.get("transferToFactory") != null ? new BigDecimal(body.get("transferToFactory").toString()) : BigDecimal.ZERO;
        String note = (String) body.get("adminNote");
        return ResponseEntity.ok(ApiResponse.ok("Đã đưa ra phán quyết",
                disputeService.giveVerdict(id, authUtil.currentUserId(), verdict, refund, transfer, note)));
    }

    @PatchMapping("/api/admin/disputes/{id}/request-info")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DisputeResponse>> requestInfo(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Đã yêu cầu bổ sung thông tin",
                disputeService.requestInfo(id, body.get("note"))));
    }
}
