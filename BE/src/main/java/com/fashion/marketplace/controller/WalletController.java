package com.fashion.marketplace.controller;

import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.WalletService;
import com.fashion.marketplace.service.WalletService.WithdrawalRequestDTO;
import com.fashion.marketplace.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * WalletController - Quản lý ví & tài chính xưởng may
 *
 * LƯU Ý: open-in-view=false → cần @Transactional trên controller
 * để Hibernate session mở trong suốt quá trình Jackson serialize entity.
 *
 * FACTORY / CUSTOMER:
 *   GET  /api/wallet                        → Xem số dư ví
 *   GET  /api/wallet/transactions           → Lịch sử giao dịch
 *   POST /api/wallet/ensure                 → Đảm bảo ví tồn tại (tự động tạo nếu chưa có)
 *
 * FACTORY:
 *   POST /api/wallet/deposit                → Nạp tiền vào ví
 *   POST /api/wallet/withdraw               → Tạo yêu cầu rút tiền
 *   GET  /api/wallet/withdrawals            → Lịch sử yêu cầu rút tiền
 */
@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final AuthUtil authUtil;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Wallet>> getWallet() {
        return ResponseEntity.ok(ApiResponse.ok(walletService.getWallet(authUtil.currentUserId())));
    }

    @GetMapping("/transactions")
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<WalletTransaction>>> transactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                walletService.getTransactions(authUtil.currentUserId(), pageable)));
    }

    @PostMapping("/ensure")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<ApiResponse<Wallet>> ensureWallet() {
        return ResponseEntity.ok(ApiResponse.ok("Ví đã sẵn sàng",
                walletService.ensureWallet(authUtil.currentUserId())));
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('FACTORY')")
    @Transactional
    public ResponseEntity<ApiResponse<Wallet>> deposit(
            @RequestBody WalletService.AdjustBalanceDTO req) {
        if (req.getAmount() == null || req.getAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Số tiền nạp phải lớn hơn 0"));
        }
        walletService.credit(authUtil.currentUserId(), req.getAmount(),
                req.getNote() != null ? req.getNote() : "Nạp tiền vào ví",
                WalletTransaction.TransactionType.DEPOSIT, null);
        return ResponseEntity.ok(ApiResponse.ok("Nạp tiền thành công",
                walletService.getWallet(authUtil.currentUserId())));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('FACTORY')")
    @Transactional
    public ResponseEntity<ApiResponse<WithdrawalRequest>> requestWithdrawal(
            @RequestBody WithdrawalRequestDTO req) {
        return ResponseEntity.ok(ApiResponse.ok("Yêu cầu rút tiền đã được gửi",
                walletService.requestWithdrawal(authUtil.currentUserId(), req)));
    }

    @GetMapping("/withdrawals")
    @PreAuthorize("hasRole('FACTORY')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<WithdrawalRequest>>> withdrawalHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                walletService.getWithdrawalHistory(authUtil.currentUserId(), pageable)));
    }
}
