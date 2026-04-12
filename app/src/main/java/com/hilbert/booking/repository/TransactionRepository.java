package com.hilbert.booking.repository;

import com.hilbert.booking.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {

    @Query(value = """
        SELECT COALESCE(SUM(
            CASE
                WHEN type IN ('DEPOSIT','REFUND') THEN amount
                WHEN type = 'PURCHASE' THEN -amount
                ELSE 0
            END
        ), 0)
        FROM transactions WHERE user_id = :userId
        """, nativeQuery = true)
    BigDecimal calculateBalance(@Param("userId") Integer userId);
}