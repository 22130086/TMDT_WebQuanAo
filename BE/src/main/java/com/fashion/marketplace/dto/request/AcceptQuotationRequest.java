package com.fashion.marketplace.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AcceptQuotationRequest {
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String note;
}
