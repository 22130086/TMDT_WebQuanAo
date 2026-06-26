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

    // URL của file thiết kế có sẵn (ảnh) khi khách upload thay vì tự thiết kế
    private String designFileUrl;

    // URL ảnh mặt sau khi upload file có sẵn
    private String designFileUrlBack;
}

