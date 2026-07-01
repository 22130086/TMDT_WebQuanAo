package com.fashion.marketplace.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class UpdateProfileRequest {
    @Size(max = 100, message = "Họ tên không quá 100 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại không quá 20 ký tự")
    private String phone;

    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    private String address;

    private String avatarUrl;
}
