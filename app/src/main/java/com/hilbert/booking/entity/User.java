package com.hilbert.booking.entity;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "cached_total_spend")
    @Builder.Default
    private BigDecimal cachedTotalSpend = BigDecimal.ZERO;

    @Column(name = "loyalty_tier")
    @Builder.Default
    private Integer loyaltyTier = 0;

    @Column(name = "has_corporate_contract")
    @Builder.Default
    private Boolean hasCorporateContract = false;

    @Column(name = "no_show_count")
    @Builder.Default
    private Integer noShowCount = 0;

    @Column(name = "ancillary_spend")
    @Builder.Default
    private BigDecimal ancillarySpend = BigDecimal.ZERO;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private Set<UserRole> roles = new HashSet<>();
}
