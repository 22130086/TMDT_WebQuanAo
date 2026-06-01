package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.response.DisputeResponse;
import com.fashion.marketplace.dto.response.DisputeStatsResponse;
import com.fashion.marketplace.entity.Dispute;
import com.fashion.marketplace.entity.User;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.DisputeRepository;
import com.fashion.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final UserRepository userRepository;

    private DisputeResponse toResponse(Dispute d) {
        return DisputeResponse.builder()
                .id(d.getId())
                .orderId(d.getOrder() != null ? d.getOrder().getId() : null)
                .initiatedById(d.getInitiatedBy() != null ? d.getInitiatedBy().getId() : null)
                .initiatedByName(d.getInitiatedBy() != null ? d.getInitiatedBy().getFullName() : null)
                .description(d.getDescription())
                .evidenceUrl(d.getEvidenceUrl())
                .status(d.getStatus().name())
                .verdict(d.getVerdict())
                .refundToCustomer(d.getRefundToCustomer())
                .transferToFactory(d.getTransferToFactory())
                .adminNote(d.getAdminNote())
                .violationRecorded(d.getViolationRecorded())
                .handledById(d.getHandledBy() != null ? d.getHandledBy().getId() : null)
                .handledAt(d.getHandledAt())
                .createdAt(d.getCreatedAt())
                .build();
    }

    public DisputeResponse getDispute(Long id) {
        return toResponse(disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found")));
    }

    public Page<DisputeResponse> getAllDisputes(Pageable pageable) {
        return disputeRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<DisputeResponse> getByStatus(String statusStr, Pageable pageable) {
        Dispute.DisputeStatus status = Dispute.DisputeStatus.valueOf(statusStr.toUpperCase());
        return disputeRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    public Page<DisputeResponse> searchDisputes(String keyword, Pageable pageable) {
        return disputeRepository.searchDisputes(keyword, pageable).map(this::toResponse);
    }

    public DisputeStatsResponse getStats() {
        return DisputeStatsResponse.builder()
                .total(disputeRepository.count())
                .open(disputeRepository.countByStatus(Dispute.DisputeStatus.OPEN))
                .infoRequested(disputeRepository.countByStatus(Dispute.DisputeStatus.ADDITIONAL_INFO_REQUESTED))
                .verdictGiven(disputeRepository.countByStatus(Dispute.DisputeStatus.VERDICT_GIVEN))
                .closed(disputeRepository.countByStatus(Dispute.DisputeStatus.CLOSED))
                .build();
    }

    @Transactional
    public DisputeResponse giveVerdict(Long disputeId, Long adminId, String verdict,
                                        BigDecimal refund, BigDecimal transfer, String note) {
        Dispute d = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found"));
        User admin = userRepository.findById(adminId).orElse(null);
        d.setStatus(Dispute.DisputeStatus.VERDICT_GIVEN);
        d.setVerdict(verdict);
        d.setRefundToCustomer(refund);
        d.setTransferToFactory(transfer);
        d.setAdminNote(note);
        d.setHandledBy(admin);
        d.setHandledAt(LocalDateTime.now());
        return toResponse(disputeRepository.save(d));
    }

    @Transactional
    public DisputeResponse requestInfo(Long disputeId, String note) {
        Dispute d = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Dispute not found"));
        d.setStatus(Dispute.DisputeStatus.ADDITIONAL_INFO_REQUESTED);
        d.setAdminNote(note);
        return toResponse(disputeRepository.save(d));
    }
}
