package com.fashion.marketplace.controller;

import com.fashion.marketplace.entity.AttributeValue;
import com.fashion.marketplace.entity.ProductAttribute;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.AttributeValueRepository;
import com.fashion.marketplace.repository.ProductAttributeRepository;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * ProductAttributeController - Quản lý thuộc tính sản phẩm (Size, Màu sắc, Chất liệu...)
 *
 * PUBLIC:
 *   GET /api/product-attributes → Lấy tất cả thuộc tính (kèm values)
 *
 * ADMIN:
 *   POST   /api/admin/product-attributes       → Thêm thuộc tính
 *   PUT    /api/admin/product-attributes/{id}  → Sửa thuộc tính
 *   DELETE /api/admin/product-attributes/{id}  → Xóa thuộc tính
 */
@RestController
@RequiredArgsConstructor
public class ProductAttributeController {

    private final ProductAttributeRepository attributeRepository;
    private final AttributeValueRepository valueRepository;

    // ==================== PUBLIC ====================

    @GetMapping("/api/product-attributes")
    public ResponseEntity<ApiResponse<List<ProductAttribute>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(attributeRepository.findAll()));
    }

    // ==================== ADMIN ====================

    @PostMapping("/api/admin/product-attributes")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<ProductAttribute>> create(@RequestBody AttributeRequest req) {
        if (attributeRepository.existsByNameIgnoreCase(req.getName())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Thuộc tính \"" + req.getName() + "\" đã tồn tại"));
        }

        ProductAttribute attr = ProductAttribute.builder()
                .name(req.getName())
                .build();

        // Parse comma-separated values into AttributeValue entities
        List<AttributeValue> values = parseValues(req.getAttributeValues(), attr);
        attr.setValues(values);

        return ResponseEntity.ok(ApiResponse.ok("Thêm thuộc tính thành công",
                attributeRepository.save(attr)));
    }

    @PutMapping("/api/admin/product-attributes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<ProductAttribute>> update(
            @PathVariable Long id, @RequestBody AttributeRequest req) {
        ProductAttribute attr = attributeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Thuộc tính không tồn tại"));

        // Kiểm tra trùng tên (nếu đổi tên khác với hiện tại)
        if (!attr.getName().equalsIgnoreCase(req.getName()) &&
                attributeRepository.existsByNameIgnoreCase(req.getName())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Thuộc tính \"" + req.getName() + "\" đã tồn tại"));
        }

        attr.setName(req.getName());

        // Xóa values cũ và tạo mới
        valueRepository.deleteByAttributeId(id);
        List<AttributeValue> newValues = parseValues(req.getAttributeValues(), attr);
        attr.setValues(newValues);
        attr = attributeRepository.save(attr);

        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công", attr));
    }

    @DeleteMapping("/api/admin/product-attributes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        if (!attributeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Thuộc tính không tồn tại");
        }
        attributeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa thuộc tính", null));
    }

    // ==================== HELPERS ====================

    private List<AttributeValue> parseValues(String commaSeparated, ProductAttribute attr) {
        List<AttributeValue> result = new ArrayList<>();
        if (commaSeparated == null || commaSeparated.isBlank()) return result;

        for (String val : commaSeparated.split(",")) {
            String trimmed = val.trim();
            if (!trimmed.isEmpty()) {
                result.add(AttributeValue.builder()
                        .attribute(attr)
                        .value(trimmed)
                        .build());
            }
        }
        return result;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    static class AttributeRequest {
        private String name;
        private String attributeValues; // comma-separated
    }
}
