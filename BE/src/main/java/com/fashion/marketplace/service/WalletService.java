package com.fashion.marketplace.service;

import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final UserRepository userRepository;

    // ---- User / Factory methods ----

    @Transactional(readOnly = true)
    public Wallet getWallet(Long userId) {
        return walletRepository.findByUserIdWithUser(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ví không tồn tại"));
    }

    @Transactional(readOnly = true)
    public Page<WalletTransaction> getTransactions(Long userId, Pageable pageable) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ví không tồn tại"));
        return walletTransactionRepository.findByWalletId(wallet.getId(), pageable);
    }

    @Transactional
    public WithdrawalRequest requestWithdrawal(Long userId, WithdrawalRequestDTO req) {
        Wallet wallet = getWallet(userId);
        if (wallet.getBalance().compareTo(req.getAmount()) < 0) {
            throw new IllegalStateException("Số dư không đủ để rút tiền");
        }
        // Freeze số tiền
        wallet.setBalance(wallet.getBalance().subtract(req.getAmount()));
        wallet.setFrozen(wallet.getFrozen().add(req.getAmount()));
        walletRepository.save(wallet);
        
        saveTransaction(wallet, WalletTransaction.TransactionType.FREEZE, 
                req.getAmount().negate(), wallet.getBalance(), 
                "Đóng băng số dư cho yêu cầu rút tiền", null);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        return withdrawalRequestRepository.save(WithdrawalRequest.builder()
                .factoryUser(user)
                .amount(req.getAmount())
                .bankName(req.getBankName())
                .accountNumber(req.getAccountNumber())
                .accountName(req.getAccountName())
                .status(WithdrawalRequest.WithdrawalStatus.PENDING)
                .build());
    }

    public Page<WithdrawalRequest> getWithdrawalHistory(Long userId, Pageable pageable) {
        return withdrawalRequestRepository.findByFactoryUserId(userId, pageable);
    }

    @Transactional
    public void credit(Long userId, BigDecimal amount, String note,
                       WalletTransaction.TransactionType type, Long orderId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ví không tồn tại"));
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
        saveTransaction(wallet, type, amount, wallet.getBalance(), note, orderId);
    }

    @Transactional
    public void debit(Long userId, BigDecimal amount, String note,
                      WalletTransaction.TransactionType type, Long orderId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ví không tồn tại"));
        if (wallet.getBalance().compareTo(amount) < 0)
            throw new IllegalStateException("Số dư không đủ");
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);
        saveTransaction(wallet, type, amount.negate(), wallet.getBalance(), note, orderId);
    }

    // ---- Admin methods ----

    /** Lấy danh sách tất cả ví (admin) */
    @Transactional(readOnly = true)
    public Page<Wallet> getAllWallets(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return walletRepository.searchByUser(search.trim(), pageable);
        }
        return walletRepository.findAllWithUser(pageable);
    }

    /** Lấy ví của một user cụ thể (admin) */
    @Transactional(readOnly = true)
    public Wallet getWalletByUserId(Long userId) {
        return walletRepository.findByUserIdWithUser(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ví của người dùng không tồn tại"));
    }

    /** Admin điều chỉnh số dư ví (cộng/trừ) */
    @Transactional
    public Wallet adjustBalance(Long adminUserId, Long targetUserId, BigDecimal amount, String note) {
        Wallet wallet = walletRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Ví của người dùng không tồn tại"));

        User admin = userRepository.findById(adminUserId).orElse(null);
        String adminName = admin != null ? admin.getFullName() : "Admin";

        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            // Cộng tiền
            wallet.setBalance(wallet.getBalance().add(amount));
            walletRepository.save(wallet);
            saveTransaction(wallet, WalletTransaction.TransactionType.DEPOSIT,
                    amount, wallet.getBalance(),
                    "[Admin: " + adminName + "] " + (note != null ? note : "Điều chỉnh số dư"), null);
        } else if (amount.compareTo(BigDecimal.ZERO) < 0) {
            // Trừ tiền
            BigDecimal absAmount = amount.abs();
            if (wallet.getBalance().compareTo(absAmount) < 0) {
                throw new IllegalStateException("Số dư ví không đủ để trừ");
            }
            wallet.setBalance(wallet.getBalance().subtract(absAmount));
            walletRepository.save(wallet);
            saveTransaction(wallet, WalletTransaction.TransactionType.WITHDRAWAL,
                    amount, wallet.getBalance(),
                    "[Admin: " + adminName + "] " + (note != null ? note : "Điều chỉnh số dư"), null);
        }
        return wallet;
    }

    /** Admin xem tất cả giao dịch */
    @Transactional(readOnly = true)
    public Page<WalletTransaction> getAllTransactions(Pageable pageable) {
        return walletTransactionRepository.findAllWithDetails(pageable);
    }

    /** Tạo ví cho user nếu chưa có */
    @Transactional
    public Wallet ensureWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
                    return walletRepository.save(Wallet.builder()
                            .user(user)
                            .balance(BigDecimal.ZERO)
                            .frozen(BigDecimal.ZERO)
                            .build());
                });
    }

    private void saveTransaction(Wallet wallet, WalletTransaction.TransactionType type,
                                 BigDecimal amount, BigDecimal balanceAfter,
                                 String note, Long orderId) {
        walletTransactionRepository.save(WalletTransaction.builder()
                .wallet(wallet).type(type).amount(amount)
                .balanceAfter(balanceAfter).note(note)
                .build());
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class WithdrawalRequestDTO {
        private BigDecimal amount;
        private String bankName;
        private String accountNumber;
        private String accountName;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AdjustBalanceDTO {
        private BigDecimal amount;
        private String note;
    }
}
