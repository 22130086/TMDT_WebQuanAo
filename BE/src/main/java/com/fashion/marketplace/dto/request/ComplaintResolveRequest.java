package com.fashion.marketplace.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ComplaintResolveRequest {
    
    @NotBlank(message = "Resolution is required")
    @Size(min = 10, max = 2000, message = "Resolution must be between 10 and 2000 characters")
    private String resolution;

    @NotNull(message = "Status is required")
    private String status; // RESOLVED, CLOSED, REJECTED, etc.
}
