package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.OrderRequest;
import com.fashion.marketplace.entity.Order;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.OrderService;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * OrderController
 *
 * CUSTOMER:
 *   POST  /api/orders                        → Đặt hàng (mẫu sẵn hoặc gia công)
 *   GET   /api/orders                        → Danh sách đơn hàng của tôi
 *   GET   /api/orders/{id}                   → Xem chi tiết đơn hàng
 *   PATCH /api/orders/{id}/cancel            → Hủy đơn hàng
 *
 * FACTORY:
 *   GET   /api/factory/orders/ready-made     → Đơn hàng mẫu sẵn
 *   GET   /api/factory/orders/outsourcing    → Đơn hàng gia công
 *   PATCH /api/factory/orders/{id}/confirm   → Xác nhận nhận đơn
 *   PATCH /api/factory/orders/{id}/status    → Cập nhật trạng thái (IN_PRODUCTION → READY_TO_SHIP...)
 *
 * ADMIN:
 *   GET   /api/admin/orders                  → Tất cả đơn hàng
 */
@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final AuthUtil authUtil;

    // ==================== CUSTOMER ====================

    @PostMapping("/api/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Order>> place(@Valid @RequestBody OrderRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đặt hàng thành công",
                orderService.placeOrder(authUtil.currentUserId(), req)));
    }

    @GetMapping("/api/orders")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<Order>>> myOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getByCustomer(authUtil.currentUserId(), pageable)));
    }

    @GetMapping("/api/orders/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Order>> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getById(id)));
    }

    @PatchMapping("/api/orders/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Order>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã hủy đơn hàng",
                orderService.updateStatus(authUtil.currentUserId(), id,
                        Order.OrderStatus.CANCELLED, false)));
    }

    // ==================== FACTORY ====================

    @GetMapping("/api/factory/orders/ready-made")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<Order>>> readyMadeOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getReadyMadeByFactory(authUtil.currentUserId(), pageable)));
    }

    @GetMapping("/api/factory/orders/outsourcing")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<Order>>> outsourcingOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getOutsourcingByFactory(authUtil.currentUserId(), pageable)));
    }

    @PatchMapping("/api/factory/orders/{id}/confirm")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Order>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã xác nhận đơn hàng",
                orderService.updateStatus(authUtil.currentUserId(), id,
                        Order.OrderStatus.CONFIRMED, true)));
    }

    @PatchMapping("/api/factory/orders/{id}/status")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Order>> updateStatus(
            @PathVariable Long id, @RequestParam Order.OrderStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công",
                orderService.updateStatus(authUtil.currentUserId(), id, status, true)));
    }
}
