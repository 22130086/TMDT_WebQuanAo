package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.ComplaintRequest;
import com.fashion.marketplace.dto.request.ComplaintResolveRequest;
import com.fashion.marketplace.dto.response.ComplaintResponse;
import com.fashion.marketplace.dto.response.ComplaintStatsResponse;
import com.fashion.marketplace.entity.Complaint;
import com.fashion.marketplace.entity.Order;
import com.fashion.marketplace.entity.User;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.ComplaintRepository;
import com.fashion.marketplace.repository.OrderRepository;
import com.fashion.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    private ComplaintResponse toResponse(Complaint c) {
        return ComplaintResponse.builder()
                .id(c.getId())
                .orderId(c.getOrder() != null ? c.getOrder().getId() : null)
                .raisedById(c.getRaisedBy() != null ? c.getRaisedBy().getId() : null)
                .raisedByName(c.getRaisedBy() != null ? c.getRaisedBy().getFullName() : null)
                .reason(c.getReason())
                .evidenceUrl(c.getEvidenceUrl())
                .status(c.getStatus().name())
                .resolution(c.getResolution())
                .resolvedById(c.getResolvedBy() != null ? c.getResolvedBy().getId() : null)
                .resolvedAt(c.getResolvedAt())
                .createdAt(c.getCreatedAt())
                .build();
    }

    public ComplaintResponse createComplaint(Long userId, ComplaintRequest request) {
        User raisedBy = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        Complaint complaint = Complaint.builder()
                .order(order)
                .raisedBy(raisedBy)
                .reason(request.getReason())
                .evidenceUrl(request.getEvidenceUrl())
                .status(Complaint.ComplaintStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();
        return toResponse(complaintRepository.save(complaint));
    }

    public ComplaintResponse getComplaint(Long complaintId) {
        return toResponse(complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found")));
    }

    public Page<ComplaintResponse> getAllComplaints(Pageable pageable) {
        return complaintRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<ComplaintResponse> getComplaintsByStatus(String statusStr, Pageable pageable) {
        Complaint.ComplaintStatus status = Complaint.ComplaintStatus.valueOf(statusStr.toUpperCase());
        return complaintRepository.findByStatus(status, pageable).map(this::toResponse);
    }

    public Page<ComplaintResponse> getMyComplaints(Long userId, Pageable pageable) {
        return complaintRepository.findByRaisedById(userId, pageable).map(this::toResponse);
    }

    public Page<ComplaintResponse> getFactoryComplaints(Long factoryId, Pageable pageable) {
        return complaintRepository.findByFactoryId(factoryId, pageable).map(this::toResponse);
    }

    public Page<ComplaintResponse> getComplaintsByOrder(Long orderId, Pageable pageable) {
        return complaintRepository.findByOrderId(orderId, pageable).map(this::toResponse);
    }

    public Page<ComplaintResponse> searchComplaints(String keyword, Pageable pageable) {
        return complaintRepository.searchComplaints(keyword, pageable).map(this::toResponse);
    }

    public ComplaintResponse resolveComplaint(Long complaintId, Long resolvedById, ComplaintResolveRequest request) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        User resolvedBy = userRepository.findById(resolvedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        complaint.setResolution(request.getResolution());
        complaint.setStatus(Complaint.ComplaintStatus.valueOf(request.getStatus().toUpperCase()));
        complaint.setResolvedBy(resolvedBy);
        complaint.setResolvedAt(LocalDateTime.now());
        return toResponse(complaintRepository.save(complaint));
    }

    public ComplaintResponse updateStatus(Long complaintId, String statusStr) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        complaint.setStatus(Complaint.ComplaintStatus.valueOf(statusStr.toUpperCase()));
        return toResponse(complaintRepository.save(complaint));
    }

    public ComplaintStatsResponse getStats() {
        return ComplaintStatsResponse.builder()
                .totalComplaints(complaintRepository.count())
                .openComplaints(complaintRepository.countByStatus(Complaint.ComplaintStatus.OPEN))
                .processingComplaints(complaintRepository.countByStatus(Complaint.ComplaintStatus.PROCESSING))
                .resolvedComplaints(complaintRepository.countByStatus(Complaint.ComplaintStatus.RESOLVED))
                .closedComplaints(complaintRepository.countByStatus(Complaint.ComplaintStatus.CLOSED))
                .build();
    }
}
