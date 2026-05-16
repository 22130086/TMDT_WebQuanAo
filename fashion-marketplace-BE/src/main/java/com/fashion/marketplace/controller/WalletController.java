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
import org.springframework.web.bind.annotation.*;

/**
 * WalletController - Quản lý ví & tài chính xưởng may
 *
 * FACTORY / CUSTOMER:
 *   GET  /api/wallet                        → Xem số dư ví
 *   GET  /api/wallet/transactions           → Lịch sử giao dịch
 *
 * FACTORY:
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
    public ResponseEntity<ApiResponse<Wallet>> getWallet() {
        return ResponseEntity.ok(ApiResponse.ok(walletService.getWallet(authUtil.currentUserId())));
    }

    @GetMapping("/transactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<WalletTransaction>>> transactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                walletService.getTransactions(authUtil.currentUserId(), pageable)));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<WithdrawalRequest>> requestWithdrawal(
            @RequestBody WithdrawalRequestDTO req) {
        return ResponseEntity.ok(ApiResponse.ok("Yêu cầu rút tiền đã được gửi",
                walletService.requestWithdrawal(authUtil.currentUserId(), req)));
    }

    @GetMapping("/withdrawals")
    @PreAuthorize("hasRole('FACTORY')")
    public ResponseEntity<ApiResponse<Page<WithdrawalRequest>>> withdrawalHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(
                walletService.getWithdrawalHistory(authUtil.currentUserId(), pageable)));
    }
}
