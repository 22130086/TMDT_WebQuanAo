package com.fashion.marketplace.service;

import com.fashion.marketplace.dto.request.ProductRequest;
import com.fashion.marketplace.dto.response.ProductResponse;
import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final FactoryProfileRepository factoryProfileRepository;
    private final CategoryRepository categoryRepository;

    // ---- Factory: quản lý sản phẩm mẫu sẵn ----

    @Transactional
    public ProductResponse  create(Long userId, ProductRequest req) {
        FactoryProfile factory = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        if (factory.getVerifiedStatus() != FactoryProfile.VerifiedStatus.APPROVED) {
            throw new IllegalStateException("Xưởng chưa được phê duyệt");
        }

        Product product = Product.builder()
                .factory(factory)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .stock(req.getStock() != null ? req.getStock() : 0)
                .status(Product.ProductStatus.PENDING)
                .build();

        if (req.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(req.getCategoryId()).orElse(null));
        }

        if (req.getImageUrls() != null) {
            List<ProductImage> images = req.getImageUrls().stream()
                    .map(url -> ProductImage.builder().product(product).imageUrl(url).build())
                    .collect(Collectors.toList());
            product.setImages(images);
        }

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse  update(Long userId, Long productId, ProductRequest req) {
        Product product = getOwnedProduct(userId, productId);
        product.setName(req.getName());
        product.setDescription(req.getDescription());
        product.setPrice(req.getPrice());
        if (req.getStock() != null) product.setStock(req.getStock());
        if (req.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(req.getCategoryId()).orElse(null));
        }
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long userId, Long productId) {
        Product product = getOwnedProduct(userId, productId);
        productRepository.delete(product);
    }

    @Transactional
    public ProductResponse  hide(Long userId, Long productId) {
        Product product = getOwnedProduct(userId, productId);
        product.setStatus(Product.ProductStatus.HIDDEN);
        return toResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getByFactory(Long userId, Pageable pageable) {
        FactoryProfile factory = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        return productRepository.findByFactoryId(factory.getId(), pageable)
                .map(this::toResponse);
    }

    // ---- Public ----
    @Transactional(readOnly = true)
    public Page<ProductResponse> searchActive(String keyword, Long categoryId, Pageable pageable) {
        return productRepository.searchActive(keyword, categoryId, pageable)
                .map(this::toResponse);  // convert entity → DTO
    }

    private ProductResponse toResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .price(p.getPrice())
                .stock(p.getStock())
                .status(p.getStatus().name())
                .factoryId(p.getFactory().getId())
                .factoryName(p.getFactory().getFactoryName())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .imageUrls(p.getImages().stream()
                        .map(img -> img.getImageUrl())
                        .toList())
                .createdAt(p.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
        return toResponse(p);
    }

    // ---- Admin: kiểm duyệt ----
    @Transactional
    public ProductResponse  approve(Long productId) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
        p.setStatus(Product.ProductStatus.ACTIVE);
        return toResponse(productRepository.save(p));
    }

    @Transactional
    public ProductResponse  reject(Long productId, String reason) {
        Product p = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
        p.setStatus(Product.ProductStatus.REJECTED);
        p.setRejectedReason(reason);
        return toResponse(productRepository.save(p));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getPending(Pageable pageable) {
        return productRepository.findByStatus(Product.ProductStatus.PENDING, pageable)
                .map(this::toResponse);
    }

    // helper
    private Product getOwnedProduct(Long userId, Long productId) {
        FactoryProfile factory = factoryProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ xưởng không tồn tại"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
        if (!product.getFactory().getId().equals(factory.getId())) {
            throw new AccessDeniedException("Bạn không có quyền sửa sản phẩm này");
        }
        return product;
    }
}
