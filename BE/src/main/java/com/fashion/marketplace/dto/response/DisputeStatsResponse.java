package com.fashion.marketplace.dto.response;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DisputeStatsResponse {
    private Long total;
    private Long open;
    private Long infoRequested;
    private Long verdictGiven;
    private Long closed;
}
