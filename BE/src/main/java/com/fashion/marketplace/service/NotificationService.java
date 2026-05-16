package com.fashion.marketplace.service;

import com.fashion.marketplace.entity.*;
import com.fashion.marketplace.exception.ResourceNotFoundException;
import com.fashion.marketplace.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void push(Long userId, String title, String body, String type, Long refId) {
        userRepository.findById(userId).ifPresent(user -> {
            Notification n = Notification.builder()
                    .user(user).title(title).body(body)
                    .type(type).refId(refId).isRead(false)
                    .build();
            notificationRepository.save(n);
        });
    }

    public Page<Notification> getAll(Long userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable);
    }

    @Transactional
    public Notification markRead(Long userId, Long notifId) {
        Notification n = notificationRepository.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo không tồn tại"));
        if (!n.getUser().getId().equals(userId))
            throw new IllegalArgumentException("Không có quyền");
        n.setIsRead(true);
        return notificationRepository.save(n);
    }

    @Transactional
    public void delete(Long userId, Long notifId) {
        Notification n = notificationRepository.findById(notifId)
                .orElseThrow(() -> new ResourceNotFoundException("Thông báo không tồn tại"));
        if (!n.getUser().getId().equals(userId))
            throw new IllegalArgumentException("Không có quyền");
        notificationRepository.delete(n);
    }

    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
