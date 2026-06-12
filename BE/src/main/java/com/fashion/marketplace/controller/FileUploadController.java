package com.fashion.marketplace.controller;

import com.fashion.marketplace.exception.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping("/api/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file) {
        try {
            // Dùng đường dẫn tuyệt đối từ current working directory
            Path dir = Paths.get(System.getProperty("user.dir"), uploadDir, "factories").toAbsolutePath().normalize();
            Files.createDirectories(dir);

            // Tạo tên file unique
            String originalName = file.getOriginalFilename();
            String ext = (originalName != null && originalName.contains("."))
                    ? originalName.substring(originalName.lastIndexOf(".")) : "";
            String fileName = UUID.randomUUID().toString() + ext;
            Path filePath = dir.resolve(fileName);

            // Lưu file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Trả về URL
            String fileUrl = "/uploads/factories/" + fileName;
            Map<String, String> result = new LinkedHashMap<>();
            result.put("url", fileUrl);
            result.put("fileName", fileName);
            return ResponseEntity.ok(ApiResponse.ok("Upload thành công", result));
        } catch (IOException e) {
            throw new RuntimeException("Lỗi upload file: " + e.getMessage());
        }
    }
}
