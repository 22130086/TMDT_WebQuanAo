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

    public Wallet getWallet(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Ví không tồn tại"));
    }

    public Page<WalletTransaction> getTransactions(Long userId, Pageable pageable) {
        Wallet wallet = getWallet(userId);
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
}
