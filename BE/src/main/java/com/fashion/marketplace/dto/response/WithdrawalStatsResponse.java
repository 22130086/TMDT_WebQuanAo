package com.fashion.marketplace.dto.response;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WithdrawalStatsResponse {
    private Long total;
    private Long pending;
    private Long approved;
    private Long transferred;
    private Long rejected;
}
