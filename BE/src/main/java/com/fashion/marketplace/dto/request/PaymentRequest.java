package com.fashion.marketplace.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentRequest {
    private Long amount;      
    private Long orderId;    
    private String orderInfo; 
}