package com.fashion.marketplace.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomProductDesignJsonRequest {

    // Base64 string of the Fabric JSON file content
    @NotBlank
    private String jsonBase64;

    // Optional original filename
    private String fileName;
}

