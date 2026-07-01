package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.OrderRequest;
import com.fashion.marketplace.dto.response.OrderResponse; // Import DTO mới
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

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final AuthUtil authUtil;

    // ==================== CUSTOMER ====================

    @PostMapping("/api/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> place(@Valid @RequestBody OrderRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Đặt hàng thành công",
                orderService.placeOrder(authUtil.currentUserId(), req)));
    }

    @PatchMapping("/api/orders/{id}/received")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> customerReceived(@PathVariable Long id) {
        // Gọi hàm dành riêng cho Customer
        OrderResponse updatedOrder = orderService.updateStatusByCustomer(authUtil.currentUserId(), id);
        
        return ResponseEntity.ok(ApiResponse.ok("Đơn hàng đã hoàn tất thành công", updatedOrder));
    }
    
    @GetMapping("/api/orders")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN')")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> myOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getByCustomer(authUtil.currentUserId(), pageable)));
    }

    @GetMapping("/api/orders/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> getOne(@PathVariable Long id) {
        // Code cực kỳ sạch sẽ, dữ liệu đã được xử lý an toàn từ Service
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết đơn hàng thành công", orderService.getById(id)));
    }

    @PatchMapping("/api/orders/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderAddress(
            @PathVariable Long id,
            @Valid @RequestBody com.fashion.marketplace.dto.request.UpdateOrderAddressRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin nhận hàng thành công",
                orderService.updateOrderShippingInfo(authUtil.currentUserId(), id, req)));
    }

    @PatchMapping("/api/orders/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã hủy đơn hàng",
                orderService.updateStatus(authUtil.currentUserId(), id,
                        Order.OrderStatus.CANCELLED, false)));
    }

    // ==================== FACTORY ====================

    @GetMapping("/api/factory/orders/ready-made")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> readyMadeOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getReadyMadeByFactory(authUtil.currentUserId(), pageable)));
    }

    @GetMapping("/api/factory/orders/outsourcing")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> outsourcingOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.getOutsourcingByFactory(authUtil.currentUserId(), pageable)));
    }

    @PatchMapping("/api/factory/orders/{id}/confirm")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<OrderResponse>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã xác nhận đơn hàng",
                orderService.updateStatus(authUtil.currentUserId(), id,
                        Order.OrderStatus.CONFIRMED, true)));
    }

    @PatchMapping("/api/factory/orders/{id}/status")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id, @RequestParam Order.OrderStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công",
                orderService.updateStatus(authUtil.currentUserId(), id, status, true)));
    }

    @DeleteMapping("/api/factory/orders/{id}")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrderFactory(authUtil.currentUserId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa đơn hàng thành công", null));
    }

    @GetMapping("/api/factory/reports/revenue")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getRevenueReport(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.ok("Báo cáo doanh thu xưởng",
                orderService.getFactoryRevenueReport(authUtil.currentUserId(), startDate, endDate)));
    }
}