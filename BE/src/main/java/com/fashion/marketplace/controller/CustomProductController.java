package com.fashion.marketplace.controller;

import com.fashion.marketplace.dto.request.CustomProductCreateRequest;
import com.fashion.marketplace.dto.request.CustomProductDesignJsonRequest;
import com.fashion.marketplace.dto.response.CustomProductDesignJsonResponse;
import com.fashion.marketplace.dto.response.CustomProductResponse;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.service.CustomProductService;
import com.fashion.marketplace.util.AuthUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/custom-products")
public class CustomProductController {

    private final CustomProductService customProductService;
    private final AuthUtil authUtil;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomProductResponse>> create(
            @Valid @RequestBody CustomProductCreateRequest req
    ) {
        CustomProductResponse created = customProductService.create(authUtil.currentUserId(), req);
        return ResponseEntity.ok(ApiResponse.ok("Tạo design mới thành công", created));
    }

    @PostMapping("/{id}/design-json")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomProductDesignJsonResponse>> uploadDesignJson(
            @PathVariable("id") Long id,
            @Valid @RequestBody CustomProductDesignJsonRequest req
    ) {
        CustomProductDesignJsonResponse res = customProductService.uploadDesignJson(
                authUtil.currentUserId(),
                id,
                req
        );
        return ResponseEntity.ok(ApiResponse.ok("Đã lưu file JSON thiết kế", res));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomProductResponse>> getOne(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Lấy design thành công",
                customProductService.getOne(authUtil.currentUserId(), id)
        ));
    }
}

