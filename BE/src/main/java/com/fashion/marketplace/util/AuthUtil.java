package com.fashion.marketplace.util;

import com.fashion.marketplace.entity.User;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtil {

    private final UserRepository userRepository;

    public User currentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
    }

    public Long currentUserId() {
        return currentUser().getId();
    }
}
