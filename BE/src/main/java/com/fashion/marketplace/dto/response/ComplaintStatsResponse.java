package com.fashion.marketplace.dto.response;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ComplaintStatsResponse {
    private Long totalComplaints;
    private Long openComplaints;
    private Long processingComplaints;
    private Long resolvedComplaints;
    private Long closedComplaints;
}
