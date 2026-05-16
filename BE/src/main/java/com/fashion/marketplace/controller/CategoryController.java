package com.fashion.marketplace.controller;

import com.fashion.marketplace.entity.Category;
import com.fashion.marketplace.exception.ApiResponse;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.CategoryRepository;
import lombok.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CategoryController - Danh mục sản phẩm
 *
 * PUBLIC:
 *   GET /api/categories         → Danh mục gốc
 *   GET /api/categories/{id}/children → Danh mục con
 *
 * ADMIN:
 *   POST   /api/admin/categories       → Thêm danh mục
 *   PUT    /api/admin/categories/{id}  → Sửa danh mục
 *   DELETE /api/admin/categories/{id}  → Xóa danh mục
 */
@RestController
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;

    @GetMapping("/api/categories")
    public ResponseEntity<ApiResponse<List<Category>>> roots() {
        return ResponseEntity.ok(ApiResponse.ok(categoryRepository.findByParentIsNull()));
    }

    @GetMapping("/api/categories/{id}/children")
    public ResponseEntity<ApiResponse<List<Category>>> children(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(categoryRepository.findByParentId(id)));
    }

    @PostMapping("/api/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Category>> create(@RequestBody CategoryRequest req) {
        Category category = Category.builder()
                .name(req.getName())
                .slug(req.getSlug())
                .build();
        if (req.getParentId() != null) {
            category.setParent(categoryRepository.findById(req.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Danh mục cha không tồn tại")));
        }
        return ResponseEntity.ok(ApiResponse.ok("Thêm danh mục thành công",
                categoryRepository.save(category)));
    }

    @PutMapping("/api/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Category>> update(
            @PathVariable Long id, @RequestBody CategoryRequest req) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại"));
        category.setName(req.getName());
        category.setSlug(req.getSlug());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thành công",
                categoryRepository.save(category)));
    }

    @DeleteMapping("/api/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa danh mục", null));
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    static class CategoryRequest {
        private String name;
        private String slug;
        private Long parentId;
    }
}
