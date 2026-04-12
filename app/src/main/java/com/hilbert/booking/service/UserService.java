package com.hilbert.booking.service;

import com.hilbert.booking.dto.response.UserProfileResponse;
import com.hilbert.booking.entity.Transaction;
import com.hilbert.booking.entity.User;
import com.hilbert.booking.entity.UserRole;
import com.hilbert.booking.entity.enums.Enums.RoleType;
import com.hilbert.booking.entity.enums.Enums.TransactionType;
import com.hilbert.booking.repository.TransactionRepository;
import com.hilbert.booking.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

        private final UserRepository userRepository;
        private final TransactionRepository transactionRepository;

        @Transactional
        public void deposit(Integer userId, BigDecimal amount) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Transaction transaction = Transaction.builder()
                                .user(user)
                                .amount(amount)
                                .type(TransactionType.DEPOSIT)
                                .build();
                transactionRepository.save(transaction);
        }

        @Transactional
        public void promoteToAdmin(Integer userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                boolean isAdmin = user.getRoles().stream()
                                .anyMatch(r -> r.getRole() == RoleType.ADMIN);

                if (isAdmin) {
                        return;
                }

                UserRole adminRole = UserRole.builder()
                                .user(user)
                                .role(RoleType.ADMIN)
                                .assignedAt(LocalDateTime.now())
                                .build();

                user.getRoles().add(adminRole);
                userRepository.save(user);
        }

        @Transactional(readOnly = true)
        public UserProfileResponse getUserProfile(Integer userId) {
                User user = userRepository.findByEmailWithRolesById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                BigDecimal balance = transactionRepository.calculateBalance(userId);

                return UserProfileResponse.builder()
                                .id(user.getId())
                                .email(user.getEmail())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .totalSpend(user.getCachedTotalSpend())
                                .balance(balance)
                                .roles(user.getRoles().stream()
                                                .map(r -> r.getRole().name())
                                                .collect(Collectors.toList()))
                                .build();
        }

}