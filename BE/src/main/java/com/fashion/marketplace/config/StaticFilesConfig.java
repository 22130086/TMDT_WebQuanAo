package com.fashion.marketplace.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class StaticFilesConfig implements WebMvcConfigurer {

    @Value("${app.custom-products.json-storage-dir:./custom-products-json}")
    private String jsonStorageDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded json for dev preview
        String location = Path.of(jsonStorageDir).toAbsolutePath().toString();
        registry.addResourceHandler("/files/custom-products-json/**")
                .addResourceLocations("file:" + location + "/")
                .setCachePeriod(3600);
    }
}

