-- ============================================================
-- Migration: Priority Score v2 — 10-factor formula
-- Run this on an existing database (after init.sql was applied)
-- ============================================================

-- 1. New columns on users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS loyalty_tier       INTEGER       NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS has_corporate_contract BOOLEAN  NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS no_show_count      INTEGER       NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ancillary_spend    DECIMAL(12,2) NOT NULL DEFAULT 0;

-- 2. Updated submit_booking_request: replaces simple total_spend with weighted 10-factor score
CREATE OR REPLACE FUNCTION submit_booking_request(
    p_user_id INT,
    p_flight_id INT
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_req_id INT;
    v_priority DECIMAL(12,4);

    -- raw user attributes
    v_loyalty_tier           INT;
    v_has_corporate          BOOLEAN;
    v_no_show_count          INT;
    v_ancillary_spend        DECIMAL(12,2);

    -- computed intermediates
    v_purchase_count         INT;
    v_avg_order_value        DECIMAL(12,2);
    v_cancel_count           INT;
    v_total_requests         INT;
    v_days_since_last        DECIMAL(12,4);
    v_balance                DECIMAL(12,2);

    -- normalised scores (0.0 – 1.0)
    v_purchase_frequency_score   DECIMAL(8,6);
    v_average_order_value_score  DECIMAL(8,6);
    v_booking_class_score        DECIMAL(8,6);
    v_corporate_contract_score   DECIMAL(8,6);
    v_loyalty_status_score       DECIMAL(8,6);
    v_cancel_ratio               DECIMAL(8,6);
    v_no_show_ratio              DECIMAL(8,6);
    v_days_since_score           DECIMAL(8,6);
    v_bonus_balance_score        DECIMAL(8,6);
    v_ancillary_services_score   DECIMAL(8,6);
BEGIN
    -- Load user attributes
    SELECT loyalty_tier, has_corporate_contract, no_show_count, ancillary_spend
    INTO   v_loyalty_tier, v_has_corporate, v_no_show_count, v_ancillary_spend
    FROM   users WHERE id = p_user_id;

    -- === purchase_frequency_score ===
    -- number of purchases in last 12 months, capped at 20
    SELECT COUNT(*) INTO v_purchase_count
    FROM   transactions
    WHERE  user_id = p_user_id
      AND  type = 'PURCHASE'
      AND  created_at >= NOW() - INTERVAL '12 months';
    v_purchase_frequency_score := LEAST(1.0, v_purchase_count::DECIMAL / 20.0);

    -- === average_order_value_score ===
    -- avg ticket price; 50 000 ₽ = max score
    SELECT COALESCE(AVG(amount), 0) INTO v_avg_order_value
    FROM   transactions
    WHERE  user_id = p_user_id AND type = 'PURCHASE';
    v_average_order_value_score := LEAST(1.0, v_avg_order_value / 50000.0);

    -- === booking_class_score ===
    -- proxy: derived from avg order value brackets
    IF    v_avg_order_value > 30000 THEN v_booking_class_score := 1.0;
    ELSIF v_avg_order_value > 10000 THEN v_booking_class_score := 0.6;
    ELSE                                  v_booking_class_score := 0.2;
    END IF;

    -- === corporate_contract_score ===
    v_corporate_contract_score := CASE WHEN v_has_corporate THEN 1.0 ELSE 0.0 END;

    -- === loyalty_status_score ===
    -- 0 = none, 1 = silver, 2 = gold, 3 = platinum
    v_loyalty_status_score := LEAST(1.0, COALESCE(v_loyalty_tier, 0)::DECIMAL / 3.0);

    -- === cancel_ratio (penalty) ===
    SELECT COUNT(*) INTO v_cancel_count FROM booking_requests
    WHERE  user_id = p_user_id AND status = 'CANCELED';
    SELECT COUNT(*) INTO v_total_requests FROM booking_requests
    WHERE  user_id = p_user_id;
    v_cancel_ratio := CASE WHEN v_total_requests > 0
                           THEN v_cancel_count::DECIMAL / v_total_requests
                           ELSE 0.0 END;

    -- === no_show_ratio (penalty) ===
    v_no_show_ratio := CASE WHEN v_total_requests > 0
                            THEN COALESCE(v_no_show_count, 0)::DECIMAL / v_total_requests
                            ELSE 0.0 END;

    -- === days_since_last_purchase (penalty: 0=recent, 1=365+ days ago) ===
    SELECT COALESCE(
               EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 86400.0,
               365
           ) INTO v_days_since_last
    FROM   transactions
    WHERE  user_id = p_user_id AND type = 'PURCHASE';
    v_days_since_score := LEAST(1.0, v_days_since_last / 365.0);

    -- === bonus_balance_score ===
    -- current wallet balance (DEPOSIT+REFUND-PURCHASE); 100 000 ₽ = max score
    SELECT COALESCE(SUM(
               CASE WHEN type IN ('DEPOSIT','REFUND') THEN amount
                    WHEN type = 'PURCHASE'            THEN -amount
                    ELSE 0 END), 0)
    INTO   v_balance
    FROM   transactions WHERE user_id = p_user_id;
    v_bonus_balance_score := LEAST(1.0, GREATEST(0.0, v_balance / 100000.0));

    -- === ancillary_services_score ===
    -- lifetime ancillary spend; 5 000 ₽ = max score
    v_ancillary_services_score := LEAST(1.0, COALESCE(v_ancillary_spend, 0) / 5000.0);

    -- === Final weighted priority score ===
    v_priority :=
          29.22 * v_purchase_frequency_score
        + 14.15 * v_average_order_value_score
        + 11.46 * v_booking_class_score
        + 11.43 * v_corporate_contract_score
        + 11.00 * v_loyalty_status_score
        - 10.50 * v_cancel_ratio
        -  5.53 * v_no_show_ratio
        -  2.93 * v_days_since_score
        +  2.03 * v_bonus_balance_score
        +  1.76 * v_ancillary_services_score;

    -- Guard: score cannot go below 0
    IF v_priority < 0 THEN v_priority := 0; END IF;

    INSERT INTO booking_requests (user_id, flight_id, calculated_priority, status)
    VALUES (p_user_id, p_flight_id, v_priority, 'PENDING')
    RETURNING id INTO v_req_id;

    RETURN v_req_id;
END;
$$;
