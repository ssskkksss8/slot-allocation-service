package com.hilbert.booking.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private Integer id;
    private String email;
    private String firstName;
    private String lastName;
    private BigDecimal totalSpend;
    private BigDecimal balance;
    private List<String> roles;
}