package com.fashion.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomProductCreateRequest {

    @NotBlank
    private String name;

    private String description;
}

