-- 001_init_schema.sql
-- Database Migration: Initialize PostgreSQL Schema for Arena Sports Turf

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Branches Table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 3. Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Roles Table
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 5. Courts Table
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 6. Sports Table
CREATE TABLE sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    min_players INT DEFAULT 1,
    max_players INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Court Sports Table (Many-to-Many mapping physical courts to playable sports)
CREATE TABLE court_sports (
    court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
    sport_id UUID REFERENCES sports(id) ON DELETE CASCADE,
    PRIMARY KEY (court_id, sport_id)
);

-- 8. Time Slots Table
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_peak BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_timeslot_range CHECK (start_time < end_time)
);

-- 9. Pricing Rules Table
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    day_type VARCHAR(50) NOT NULL CHECK (day_type IN ('weekday', 'weekend', 'holiday', 'any')),
    pricing_category VARCHAR(50) NOT NULL CHECK (pricing_category IN ('base', 'peak')),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0.00),
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Blocked Dates Table
CREATE TABLE blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Maintenance Slots Table
CREATE TABLE maintenance_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_court_maintenance_slot UNIQUE (court_id, maintenance_date, time_slot_id)
);

-- 12. Coupons Table
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0.00),
    min_booking_amount DECIMAL(10, 2) DEFAULT 0.00 CHECK (min_booking_amount >= 0.00),
    max_discount_amount DECIMAL(10, 2) CHECK (max_discount_amount >= 0.00),
    usage_limit INT,
    user_usage_limit INT DEFAULT 1,
    expiry_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- 13. Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_name VARCHAR(255),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    coupon_id UUID REFERENCES coupons(id) ON DELETE RESTRICT,
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0.00),
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0.00),
    final_amount DECIMAL(10, 2) NOT NULL CHECK (final_amount >= 0.00),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (refund_amount >= 0.00),
    qr_code_data TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_customer_profile CHECK (
        (user_id IS NOT NULL) OR 
        (guest_name IS NOT NULL AND guest_email IS NOT NULL AND guest_phone IS NOT NULL)
    )
);

-- 14. Booking Slots Table (Core Reservation Grid)
CREATE TABLE booking_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    time_slot_id UUID NOT NULL REFERENCES time_slots(id) ON DELETE RESTRICT,
    booking_date DATE NOT NULL,
    price_charged DECIMAL(10, 2) NOT NULL CHECK (price_charged >= 0.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_physical_court_allocation UNIQUE (court_id, booking_date, time_slot_id)
);

-- 15. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('razorpay', 'stripe', 'cash', 'upi', 'manual')),
    gateway_order_id VARCHAR(255),
    gateway_payment_id VARCHAR(255),
    gateway_signature VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0.00),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    refund_transaction_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Coupon Redemptions Table
CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. Loyalty Transactions Table
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    points_change INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('signup_bonus', 'booking_accrual', 'booking_refund', 'admin_adjustment')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. Notification Templates Table
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    channels VARCHAR(50)[] NOT NULL,
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 20. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 21. Settings Table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    value_type VARCHAR(50) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_branch_setting_key UNIQUE (branch_id, key)
);

-- 22. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Database Helper Triggers to Auto-Update updated_at values
CREATE OR REPLACE FUNCTION auto_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Register auto_update_timestamp triggers
CREATE TRIGGER trigger_update_branches BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_roles BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_courts BEFORE UPDATE ON courts FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_sports BEFORE UPDATE ON sports FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_time_slots BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_pricing_rules BEFORE UPDATE ON pricing_rules FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_blocked_dates BEFORE UPDATE ON blocked_dates FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_maintenance_slots BEFORE UPDATE ON maintenance_slots FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_coupons BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_bookings BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_booking_slots BEFORE UPDATE ON booking_slots FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_reviews BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_notification_templates BEFORE UPDATE ON notification_templates FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();
CREATE TRIGGER trigger_update_settings BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION auto_update_timestamp();

-- Create Indexes for performance optimization
CREATE INDEX idx_booking_slots_lookup ON booking_slots (booking_date, court_id, time_slot_id);
CREATE INDEX idx_bookings_user_date ON bookings (user_id, created_at DESC);
CREATE INDEX idx_payments_gateway_order ON payments (gateway_order_id, status);
CREATE INDEX idx_maintenance_slots_date ON maintenance_slots (maintenance_date, court_id);
CREATE INDEX idx_blocked_dates_calendar ON blocked_dates (blocked_date, branch_id);
CREATE INDEX idx_audit_logs_record ON audit_logs (table_name, record_id);
