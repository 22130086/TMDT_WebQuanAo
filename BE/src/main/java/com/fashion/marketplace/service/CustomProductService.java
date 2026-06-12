package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.CustomProductCreateRequest;
import com.fashion.marketplace.dto.request.CustomProductDesignJsonRequest;
import com.fashion.marketplace.dto.response.CustomProductDesignJsonResponse;
import com.fashion.marketplace.dto.response.CustomProductResponse;
import com.fashion.marketplace.entity.CustomProduct;
import com.fashion.marketplace.entity.User;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.CustomProductRepository;
import com.fashion.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class CustomProductService {

    private final CustomProductRepository customProductRepository;
    private final UserRepository userRepository;

    @Value("${app.custom-products.json-storage-dir:./custom-products-json}")
    private String jsonStorageDir;

    @Transactional
    public CustomProductResponse create(Long customerId, CustomProductCreateRequest req) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        CustomProduct cp = CustomProduct.builder()
                .customer(customer)
                .name(req.getName())
                .description(req.getDescription())
                .status(CustomProduct.Status.DRAFT)
                .designFileUrl(null)
                .build();

        return toResponse(customProductRepository.save(cp));
    }

    @Transactional(readOnly = true)
    public CustomProductResponse getOne(Long customerId, Long customProductId) {
        CustomProduct cp = customProductRepository.findByIdAndCustomer_Id(customProductId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Custom product không tồn tại"));
        return toResponse(cp);
    }

    @Transactional
    public CustomProductDesignJsonResponse uploadDesignJson(Long customerId, Long customProductId, CustomProductDesignJsonRequest req) {
        CustomProduct cp = customProductRepository.findByIdAndCustomer_Id(customProductId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Custom product không tồn tại"));

        String base64 = req.getJsonBase64();
        String fileName = req.getFileName() != null && !req.getFileName().isBlank()
                ? req.getFileName()
                : ("custom_design_" + cp.getId() + "_" + System.currentTimeMillis() + ".json");

        // Support data URL: "data:application/json;base64,xxxx"
        if (base64.contains(",")) {
            base64 = base64.substring(base64.indexOf(',') + 1);
        }

        byte[] decoded = Base64.getDecoder().decode(base64);

        try {
            Path dir = Path.of(jsonStorageDir);
            Files.createDirectories(dir);

            Path filePath = dir.resolve(fileName);
            Files.write(filePath, decoded);

            // designFileUrl: return local relative url-like path for now
            String designUrl = "/files/custom-products-json/" + filePath.getFileName();

            cp.setDesignFileUrl(designUrl);
            cp.setUpdatedAt(LocalDateTime.now());
            customProductRepository.save(cp);

            return CustomProductDesignJsonResponse.builder()
                    .designFileUrl(designUrl)
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file json thiết kế", e);
        }
    }

    private CustomProductResponse toResponse(CustomProduct cp) {
        return CustomProductResponse.builder()
                .id(cp.getId())
                .customerId(cp.getCustomer().getId())
                .name(cp.getName())
                .description(cp.getDescription())
                .designFileUrl(cp.getDesignFileUrl())
                .status(cp.getStatus())
                .createdAt(cp.getCreatedAt())
                .updatedAt(cp.getUpdatedAt())
                .build();
    }
}

