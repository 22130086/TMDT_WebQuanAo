package com.fashion.marketplace.scheduler;

import com.fashion.marketplace.entity.Order;
import com.fashion.marketplace.repository.OrderRepository;
import com.fashion.marketplace.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class FrozenReleaseScheduler {

    private static final long HOLD_DAYS = 3;

    private final OrderRepository orderRepository;
    private final WalletService walletService;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void releaseFrozenFunds() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(HOLD_DAYS);
        List<Order> eligibleOrders = orderRepository.findOrdersEligibleForFrozenRelease(
                cutoff,
                Order.OrderStatus.COMPLETED,
                com.fashion.marketplace.entity.Complaint.ComplaintStatus.OPEN,
                com.fashion.marketplace.entity.Dispute.DisputeStatus.OPEN
        );

        if (eligibleOrders.isEmpty()) {
            log.debug("[FrozenRelease] No orders to release at {}", LocalDateTime.now());
            return;
        }

        log.info("[FrozenRelease] Found {} orders eligible for frozen release", eligibleOrders.size());

        for (Order order : eligibleOrders) {
            try {
                Long factoryUserId = order.getFactory().getUser().getId();
                walletService.releaseFrozen(
                        factoryUserId,
                        order.getFinalAmount(),
                        "Giai phong phong toa don hang #" + order.getId()
                                + " (da qua " + HOLD_DAYS + " ngay khong co khieu nai)",
                        order.getId()
                );
                order.setFrozenReleased(true);
                orderRepository.save(order);
                log.info("[FrozenRelease] Released {} for factory #{} (order #{})",
                        order.getFinalAmount(), factoryUserId, order.getId());
            } catch (Exception e) {
                log.error("[FrozenRelease] Error releasing order #{}: {}", order.getId(), e.getMessage());
            }
        }
    }
}