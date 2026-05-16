package com.fashion.marketplace.dto.response;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private Long userId;
    private String email;
    private String fullName;
    private String role;
}
